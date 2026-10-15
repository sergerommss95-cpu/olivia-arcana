// website/netlify/portrait/claude.ts
/** One structured Claude call per stage. The key stays on the server; raw provider errors are never shown. */
import Anthropic from "@anthropic-ai/sdk";

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number };
export type WriteResult =
  | { ok: true; data: unknown; usage: Usage }
  | { ok: false; code: "refusal" | "truncated" | "unparseable" | "provider"; usage: Usage };
export type Call = { system: string; user: string; schema: object; maxTokens: number };

const NONE: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
/** Claude Opus 5.5: $4 / $20 per million input / output tokens; cache reads $0.20, 5-minute cache writes $5. */
export function costCents(u: Usage) {
  return Math.ceil((u.input * 4 + u.output * 20 + u.cacheRead * 0.2 + u.cacheWrite * 5) / 10_000);
}

export function interpret(message: any): WriteResult {
  const u = message?.usage ?? {};
  const usage: Usage = { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 };
  if (message?.stop_reason === "refusal") return { ok: false, code: "refusal", usage };
  if (message?.stop_reason === "max_tokens") return { ok: false, code: "truncated", usage };
  const text = (message?.content ?? []).filter((block: any) => block.type === "text").map((block: any) => block.text).join("");
  try { return { ok: true, data: JSON.parse(text), usage }; } catch { return { ok: false, code: "unparseable", usage }; }
}

export function createWriter({ apiKey, model, effort, send }: { apiKey: string; model: string; effort: string; send?: (params: object) => Promise<unknown> }) {
  const client = new Anthropic({ apiKey, timeout: 240_000, maxRetries: 1 });
  const dispatch = send ?? ((params: object) => client.beta.messages.stream(params as any).finalMessage());
  return async function write(call: Call): Promise<WriteResult> {
    try {
      const message = await dispatch({
        model,
        max_tokens: call.maxTokens,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort, format: { type: "json_schema", schema: call.schema } },
        system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: call.user }],
      });
      return interpret(message);
    } catch (error) {
      console.warn(JSON.stringify({ event: "portrait_provider_failure", status: (error as any)?.status ?? null, type: (error as any)?.error?.type ?? (error as Error)?.name }));
      return { ok: false, code: "provider", usage: NONE };
    }
  };
}
