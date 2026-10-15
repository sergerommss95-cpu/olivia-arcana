// website/netlify/portrait/run.ts
/** Writes one portrait: opening first, then the two chapter stages side by side. */
import { claimJob, finishJob, putStage, settle, type KeyValue } from "./store.ts";
import { selectTeachings, type Bank } from "./teachings.ts";
import { stageSchema } from "./schema.ts";
import { systemPrompt, stageRequest } from "./prompt.ts";
import { validateStage } from "./validate.ts";
import { costCents, type Call, type WriteResult } from "./claude.ts";
import type { Stage } from "./plan.ts";

const MAX_TOKENS: Record<Stage, number> = { a: 16_000, b: 20_000, c: 20_000 };

export async function runJob({ kv, id, write, bank }: { kv: KeyValue; id: string; write: (call: Call) => Promise<WriteResult>; bank: Bank }) {
  const job = await claimJob(kv, id);
  if (!job) return "skipped" as const;
  const packet = job.packet as any;
  const teachings = selectTeachings(packet, bank);
  const factorIds = packet.factors.map((f: { id: string }) => f.id);
  const teachingIds = teachings.map((t) => t.id);
  const system = systemPrompt(packet.locale);
  let cents = 0;

  const stage = async (key: Stage, earlier: { a?: unknown }) => {
    let errors: string[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await write({ system, user: stageRequest(key, packet, teachings, earlier, errors), schema: stageSchema(key, factorIds, teachingIds), maxTokens: MAX_TOKENS[key] });
      cents += costCents(result.usage);
      if (!result.ok) return { ok: false as const, error: `stage_${key}_${result.code}` };
      const check = validateStage(key, result.data, packet, teachings);
      if (check.ok) { await putStage(kv, id, key, result.data); return { ok: true as const, data: result.data }; }
      errors = check.errors;
      console.warn(JSON.stringify({ event: "portrait_stage_invalid", stage: key, attempt, errors: errors.slice(0, 20) }));
    }
    return { ok: false as const, error: `stage_${key}_invalid` };
  };

  let error: string | null = null;
  try {
    const a = await stage("a", {});
    if (!a.ok) error = a.error;
    else {
      const [b, c] = await Promise.all([stage("b", { a: a.data }), stage("c", { a: a.data })]);
      error = !b.ok ? b.error : !c.ok ? c.error : null;
    }
  } catch (thrown) {
    error = "internal";
    console.warn(JSON.stringify({ event: "portrait_run_error", message: (thrown as Error)?.message }));
  }
  try {
    await finishJob(kv, id, { status: error ? "failed" : "done", error, costCents: cents });
  } catch (thrown) {
    if ((thrown as Error)?.message === "job_finished") return "skipped" as const;
    throw thrown;
  }
  try {
    await settle(kv, { day: job.day, reserveCents: job.reserveCents, costCents: cents });
  } catch (thrown) {
    console.warn(JSON.stringify({ event: "portrait_settle_failed", code: (thrown as Error)?.message }));
  }
  return error ? ("failed" as const) : ("done" as const);
}
