// website/netlify/portrait/claude.ts
/** One structured Claude call per stage. The key stays on the server; raw provider errors are never shown. */
import Anthropic from "@anthropic-ai/sdk";

export type Tokens = { input: number; output: number; cacheRead: number; cacheWrite: number };
/** With server-side fallback the API lists each model's share in `iterations`; when present, those are what is priced. */
export type Usage = Tokens & { iterations?: (Tokens & { model?: string })[] };
/** What the call reported besides its text, for the stage log. */
export type Meta = { stopReason: string | null; model: string | null; refusalCategory: string | null };
export type WriteResult = Meta & (
  | { ok: true; data: unknown; usage: Usage }
  | { ok: false; code: "refusal" | "truncated" | "unparseable" | "provider"; usage: Usage }
);
export type Call = { system: string; user: string; schema: object; maxTokens: number; signal?: AbortSignal };

const NONE: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
const NO_META: Meta = { stopReason: null, model: null, refusalCategory: null };
/** Dollars per million tokens. An unknown model is priced as Opus, the dearest, so the daily budget errs on the safe side. */
const OPUS: Tokens = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };
const PRICES: [prefix: string, rates: Tokens][] = [
  ["claude-opus-5-5", OPUS],
  ["claude-sonnet-5-5", { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }],
];
const ratesOf = (model?: string | null) => PRICES.find(([prefix]) => typeof model === "string" && model.startsWith(prefix))?.[1] ?? OPUS;
const worth = (t: Tokens, model?: string | null) => {
  const r = ratesOf(model);
  return t.input * r.input + t.output * r.output + t.cacheRead * r.cacheRead + t.cacheWrite * r.cacheWrite;
};
/** Cents for one call (rounded up), priced by the model that answered; fallback iterations are each priced by their own model. */
export function costCents(u: Usage, model?: string | null) {
  const parts = u.iterations?.length ? u.iterations.map((it) => worth(it, it.model ?? model)) : [worth(u, model)];
  return Math.ceil(parts.reduce((sum, part) => sum + part, 0) / 10_000);
}

const tally = (u: any): Tokens => ({ input: u?.input_tokens ?? 0, output: u?.output_tokens ?? 0, cacheRead: u?.cache_read_input_tokens ?? 0, cacheWrite: u?.cache_creation_input_tokens ?? 0 });

export function interpret(message: any): WriteResult {
  const u = message?.usage ?? {};
  const usage: Usage = {
    ...tally(u),
    ...(Array.isArray(u.iterations) && u.iterations.length ? { iterations: u.iterations.map((it: any) => ({ ...tally(it), ...(typeof it?.model === "string" ? { model: it.model } : {}) })) } : {}),
  };
  const meta: Meta = { stopReason: message?.stop_reason ?? null, model: message?.model ?? null, refusalCategory: message?.stop_details?.category ?? null };
  if (message?.stop_reason === "refusal") return { ok: false, code: "refusal", usage, ...meta };
  if (message?.stop_reason === "max_tokens") return { ok: false, code: "truncated", usage, ...meta };
  // With server-side fallback, content can be [partial text, fallback block, full text]; only the text after the last fallback counts.
  const blocks: any[] = message?.content ?? [];
  const text = blocks.slice(blocks.map((block) => block?.type).lastIndexOf("fallback") + 1).filter((block) => block?.type === "text").map((block) => block.text).join("");
  try { return { ok: true, data: JSON.parse(text), usage, ...meta }; } catch { return { ok: false, code: "unparseable", usage, ...meta }; }
}

type Options = { apiKey: string; baseURL?: string; timeout: number; maxRetries: number };
type Streams = { beta: { messages: { stream(params: any, options?: { signal?: AbortSignal }): { finalMessage(): Promise<unknown> } } } };

/** `baseURL` points the client at a gateway (Netlify AI Gateway sets ANTHROPIC_BASE_URL next to its own key); without it the SDK uses its default. */
export function createWriter({ apiKey, baseURL, model, effort, send, makeClient = (options) => new Anthropic(options) as unknown as Streams }: {
  apiKey: string; baseURL?: string; model: string; effort: string; send?: (params: object, options: { signal?: AbortSignal }) => Promise<unknown>; makeClient?: (options: Options) => Streams;
}) {
  const client = makeClient({ apiKey, baseURL, timeout: 240_000, maxRetries: 1 });
  const dispatch = send ?? ((params: object, options: { signal?: AbortSignal }) => client.beta.messages.stream(params, options).finalMessage());
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
      }, { signal: call.signal });
      return interpret(message);
    } catch (error) {
      console.warn(JSON.stringify({ event: "portrait_provider_failure", status: (error as any)?.status ?? null, type: (error as any)?.type ?? (error as Error)?.name }));
      return { ok: false, code: "provider", usage: NONE, ...NO_META };
    }
  };
}
