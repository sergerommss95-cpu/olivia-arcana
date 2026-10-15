// website/netlify/functions/portrait-background.mts
// Writes one portrait. Safe to call with any id: only a queued job is claimed, and only once.
import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { UUID, failUnconfigured } from "../portrait/api.ts";
import { runJob } from "../portrait/run.ts";
import { storeName } from "../portrait/store.ts";
import { createWriter } from "../portrait/claude.ts";
import bank from "../portrait/knowledge/bank.json" with { type: "json" };

const EFFORTS = ["low", "medium", "high", "xhigh", "max"];

export default async (req: Request, context: Context) => {
  const { id } = (await req.json().catch(() => null)) ?? {};
  if (typeof id !== "string" || !UUID.test(id)) return;
  const kv = getStore({ name: storeName(context.deploy?.context), consistency: "strong" }) as any;
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.warn(JSON.stringify({ event: "portrait_no_key" }));
    // Fail the job now rather than leave it to time out.
    await failUnconfigured(kv, id);
    return;
  }
  const asked = Netlify.env.get("PORTRAIT_EFFORT");
  const effort = asked && EFFORTS.includes(asked) ? asked : "medium";
  if (asked && effort !== asked) console.warn(JSON.stringify({ event: "portrait_bad_effort" }));
  const write = createWriter({ apiKey, baseURL: Netlify.env.get("ANTHROPIC_BASE_URL") || undefined, model: Netlify.env.get("PORTRAIT_MODEL") || "claude-opus-5-5", effort });
  const outcome = await runJob({ kv, id, write, bank });
  console.log(JSON.stringify({ event: "portrait_job", outcome }));
};

export const config: Config = { background: true };
