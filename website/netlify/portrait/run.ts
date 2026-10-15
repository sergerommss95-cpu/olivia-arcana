// website/netlify/portrait/run.ts
/** Writes one portrait: opening first, then the two chapter stages side by side. */
import { claimJob, finishJob, putStage, readStages, settle, type KeyValue } from "./store.ts";
import { citedTeachings, selectTeachings, type Bank, type Teaching } from "./teachings.ts";
import { stageSchema } from "./schema.ts";
import { systemPrompt, stageRequest } from "./prompt.ts";
import { isStyleError, validateStage } from "./validate.ts";
import { costCents, type Call, type WriteResult } from "./claude.ts";
import type { Stage } from "./plan.ts";

/** Adaptive thinking counts against max_tokens, so the limit leaves room for the thinking as well as the JSON. */
const MAX_TOKENS: Record<Stage, number> = { a: 32_000, b: 32_000, c: 32_000 };

/** Under the 15 minutes a background function may run, so a stuck call ends the job instead of the platform doing it. */
export const JOB_DEADLINE_MS = 12 * 60_000;

export async function runJob({ kv, id, write, bank, deadlineMs = JOB_DEADLINE_MS }: { kv: KeyValue; id: string; write: (call: Call) => Promise<WriteResult>; bank: Bank; deadlineMs?: number }) {
  const job = await claimJob(kv, id);
  if (!job) return "skipped" as const;
  // Every call shares one deadline: when it passes, calls in flight abort and come back as provider failures.
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), deadlineMs);
  let cents = 0;
  let error: string | null = null;
  let teachings: Teaching[] = [];
  try {
    const packet = job.packet as any;
    teachings = selectTeachings(packet, bank);
    const factorIds = packet.factors.map((f: { id: string }) => f.id);
    const teachingIds = teachings.map((t) => t.id);
    const system = systemPrompt(packet.locale);

    const stage = async (key: Stage, earlier: { a?: unknown }) => {
      let errors: string[] = [];
      for (let attempt = 0; attempt < 2; attempt++) {
        const started = Date.now();
        const result = await write({ system, user: stageRequest(key, packet, teachings, earlier, errors), schema: stageSchema(key, factorIds, teachingIds), maxTokens: MAX_TOKENS[key], signal: deadline.signal });
        const ms = Date.now() - started;
        const spent = costCents(result.usage, result.model);
        cents += spent;
        // One line per attempt, never any text. `ok` means the attempt was accepted: the call succeeded and the stage passed its checks.
        const log = (accepted: boolean) => console.log(JSON.stringify({ event: "portrait_stage", stage: key, attempt, ms, stopReason: result.stopReason ?? null, model: result.model ?? null, usage: result.usage, cents: spent, refusalCategory: result.refusalCategory ?? null, ok: accepted }));
        if (!result.ok) {
          log(false);
          // A provider hiccup deserves a second try; a refusal or a cut-off answer would only repeat, and nothing helps once the deadline has passed.
          if (result.code === "provider" && attempt === 0 && !deadline.signal.aborted) continue;
          return { ok: false as const, error: `stage_${key}_${result.code}` };
        }
        const check = validateStage(key, result.data, packet, teachings, earlier.a);
        // A paid reading is not thrown away over its voice: after the repair attempt, style-only errors are tolerated. Anything else still fails the stage.
        const residue = !check.ok && attempt === 1 && check.errors.every(isStyleError);
        log(check.ok || residue);
        if (residue) console.warn(JSON.stringify({ event: "portrait_style_residue", stage: key, codes: check.errors.map((e) => e.replace(/:".*"$/s, "")) }));
        if (check.ok || residue) { await putStage(kv, id, key, result.data); return { ok: true as const, data: result.data }; }
        errors = check.errors;
        console.warn(JSON.stringify({ event: "portrait_stage_invalid", stage: key, attempt, errors: errors.map((e) => e.replace(/:".*"$/s, "")).slice(0, 20) }));
      }
      return { ok: false as const, error: `stage_${key}_invalid` };
    };

    const a = await stage("a", {});
    if (!a.ok) error = a.error;
    else {
      // allSettled: a throw in one stage must not finish the job while the other is still writing and spending.
      const [b, c] = (await Promise.allSettled([stage("b", { a: a.data }), stage("c", { a: a.data })])).map((result) => {
        if (result.status === "fulfilled") return result.value;
        console.warn(JSON.stringify({ event: "portrait_run_error", message: (result.reason as Error)?.message }));
        return { ok: false as const, error: "internal" };
      });
      error = !b.ok ? b.error : !c.ok ? c.error : null;
    }
  } catch (thrown) {
    error = "internal";
    console.warn(JSON.stringify({ event: "portrait_run_error", message: (thrown as Error)?.message }));
  } finally {
    clearTimeout(timer);
  }
  try {
    // The finished job keeps only the teachings its text cited, not the packet: the factors can reveal the birth date.
    const kept = citedTeachings(teachings, bank, await readStages(kv, id));
    await finishJob(kv, id, { status: error ? "failed" : "done", error, costCents: cents, teachings: kept });
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
