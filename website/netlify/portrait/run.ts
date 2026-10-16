// website/netlify/portrait/run.ts
/** Writes one portrait: opening first, then the two chapter stages side by side. */
import { claimJob, finishJob, putStage, readStages, settle, type KeyValue } from "./store.ts";
import { citedTeachings, selectTeachings, type Bank, type Teaching } from "./teachings.ts";
import { stageSchema } from "./schema.ts";
import { systemPrompt, stageRequest } from "./prompt.ts";
import { isSoftLength, isStyleError, validateStage } from "./validate.ts";
import { costCents, type Call, type Usage, type WriteResult } from "./claude.ts";
import type { Stage } from "./plan.ts";

/** Adaptive thinking counts against max_tokens, so the limit leaves room for the thinking as well as the JSON. */
const MAX_TOKENS: Record<Stage, number> = { a: 32_000, b: 32_000, c: 32_000 };

/** An error as it is logged: the code and place only. Quoted snippets and invented ids are model text and stay out of the logs. */
const logCode = (error: string) => error.replace(/:".*"$/s, "").replace(/^((?:refs|teachings):[^:]+):.*$/s, "$1");

/** The most errors the repair prompt lists. */
const MAX_LISTED_ERRORS = 20;

/** Under the 15 minutes a background function may run, so a stuck call ends the job instead of the platform doing it. */
export const JOB_DEADLINE_MS = 12 * 60_000;

/** Free retries a stage gets: provider failures that reported no tokens, which cost nothing and so do not use up one of its two attempts. */
const MAX_FREE_RETRIES = 3;

/** True when a call reported no tokens at all, fallback iterations included: nothing was billed. */
const noTokens = (usage: Usage) => [usage, ...(usage.iterations ?? [])].every((t) => t.input === 0 && t.output === 0 && t.cacheRead === 0 && t.cacheWrite === 0);

/** The wait before the nth free retry of a stage (n counts from 0): 500 ms, doubling, never more than 4 s. */
export const freeBackoffMs = (n: number) => Math.min(500 * 2 ** n, 4_000);

/** Waits `ms`; false when the signal aborts first (or already had), true when the wait ran its course. */
const pause = (ms: number, signal: AbortSignal) => new Promise<boolean>((resolve) => {
  if (signal.aborted) return resolve(false);
  const onAbort = () => { clearTimeout(timer); resolve(false); };
  const timer = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(true); }, ms);
  signal.addEventListener("abort", onAbort, { once: true });
});

/** Stress marks (U+0300, U+0301) are not part of the house style and the model sometimes misplaces them; every string is NFC first, so precomposed letters such as й, ї and é are untouched. */
const tidy = (value: unknown): unknown =>
  typeof value === "string" ? value.normalize("NFC").replace(/[\u0300\u0301]/g, "")
  : Array.isArray(value) ? value.map(tidy)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, tidy(inner)]))
  : value;

/** True when no string anywhere in the answer has any text: a schema-valid but empty reply, seen once in the eval. */
const blank = (value: unknown): boolean =>
  typeof value === "string" ? value.trim() === ""
  : Array.isArray(value) ? value.every(blank)
  : value && typeof value === "object" ? Object.values(value).every(blank)
  : true;

export async function runJob({ kv, id, write, bank, deadlineMs = JOB_DEADLINE_MS, backoff = freeBackoffMs }: { kv: KeyValue; id: string; write: (call: Call) => Promise<WriteResult>; bank: Bank; deadlineMs?: number; backoff?: (freeRetry: number) => number }) {
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
    const system = systemPrompt(packet.locale);

    const stage = async (key: Stage, earlier: { a?: unknown }) => {
      let errors: string[] = [];
      let freeRetries = 0;
      // `attempt` counts the tries that used something up; a free retry repeats the same attempt.
      for (let attempt = 0; attempt < 2;) {
        const started = Date.now();
        const result = await write({ system, ...stageRequest(key, packet, teachings, earlier, errors), schema: stageSchema(key), maxTokens: MAX_TOKENS[key], signal: deadline.signal });
        const ms = Date.now() - started;
        const spent = costCents(result.usage, result.model);
        cents += spent;
        // A provider failure that reported no tokens cost nothing (typically a connection that never opened), so it is retried without using up an attempt, a few times per stage.
        const free = !result.ok && result.code === "provider" && noTokens(result.usage) && freeRetries < MAX_FREE_RETRIES;
        // One line per attempt, never any text. `ok` means the attempt was accepted: the call succeeded and the stage passed its checks. `free` means it did not use up one of the two attempts.
        const log = (accepted: boolean) => console.log(JSON.stringify({ event: "portrait_stage", stage: key, attempt, ms, stopReason: result.stopReason ?? null, model: result.model ?? null, usage: result.usage, cents: spent, refusalCategory: result.refusalCategory ?? null, ok: accepted, free }));
        if (!result.ok) {
          log(false);
          // A provider hiccup deserves another try; a refusal or a cut-off answer would only repeat, and nothing helps once the deadline has passed (also while waiting out the backoff).
          if (result.code === "provider" && !deadline.signal.aborted) {
            if (free) { if (await pause(backoff(freeRetries++), deadline.signal)) continue; }
            else if (attempt === 0) { attempt++; continue; }
          }
          return { ok: false as const, error: `stage_${key}_${result.code}` };
        }
        const data = tidy(result.data);
        const check = validateStage(key, data, packet, teachings, earlier.a);
        // A paid reading is not thrown away over its voice: once a repair was actually tried (the first attempt reached validation and failed), style-only errors are tolerated. Anything else still fails the stage.
        const residue = !check.ok && attempt === 1 && errors.length > 0 && check.errors.every((code) => isStyleError(code) || isSoftLength(code));
        log(check.ok || residue);
        if (residue) console.warn(JSON.stringify({ event: "portrait_style_residue", stage: key, codes: check.errors.map(logCode) }));
        if (check.ok || residue) { await putStage(kv, id, key, data); return { ok: true as const, data }; }
        // An empty answer fails every field; one plain line says what happened instead of twenty "missing" codes.
        errors = blank(data) ? [`empty:${key}`] : check.errors.slice(0, MAX_LISTED_ERRORS);
        console.warn(JSON.stringify({ event: "portrait_stage_invalid", stage: key, attempt, errors: errors.map(logCode) }));
        attempt++;
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
