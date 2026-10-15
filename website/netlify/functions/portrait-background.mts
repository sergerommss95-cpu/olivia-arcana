// website/netlify/functions/portrait-background.mts
// Writes one portrait. Safe to call with any id: only a queued job is claimed, and only once.
import { getStore } from "@netlify/blobs";
import { runJob } from "../portrait/run.ts";
import { createWriter } from "../portrait/claude.ts";
import bank from "../portrait/knowledge/bank.json" with { type: "json" };

const EFFORTS = ["low", "medium", "high", "xhigh", "max"];

export default async (req: Request) => {
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return;
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) { console.warn(JSON.stringify({ event: "portrait_no_key" })); return; }
  const asked = Netlify.env.get("PORTRAIT_EFFORT");
  const effort = asked && EFFORTS.includes(asked) ? asked : "medium";
  if (asked && effort !== asked) console.warn(JSON.stringify({ event: "portrait_bad_effort" }));
  const write = createWriter({ apiKey, model: Netlify.env.get("PORTRAIT_MODEL") || "claude-opus-5-5", effort });
  const outcome = await runJob({ kv: getStore({ name: "portrait", consistency: "strong" }) as any, id, write, bank });
  console.log(JSON.stringify({ event: "portrait_job", outcome }));
};
