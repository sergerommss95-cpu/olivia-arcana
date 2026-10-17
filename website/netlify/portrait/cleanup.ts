// website/netlify/portrait/cleanup.ts
/** The daily sweep: what the status endpoint would only forget when someone asked, and the old daily counters. */
import { forgetJob, readJob, utcDay, type KeyValue } from "./store.ts";

const DAY_MS = 86_400_000;
/** The cleanup function runs hourly, so a job is taken one sweep before it turns a day old and never outlives the day the page promises. */
const SWEEP_EVERY_MS = 3_600_000;
const KEEP_JOBS_MS = DAY_MS - SWEEP_EVERY_MS;
const KEEP_QUOTA_DAYS = 7;
const JOB_KEY = /^job\/([^/]+)(?:\/[abct])?$/;
const QUOTA_KEY = /^quota\/(\d{4}-\d{2}-\d{2})\//;

/** Removes jobs past the keep limit (23 hours) with their stages and teachings, stages left without a job, and quota counters more than a week old. Returns counts only. */
export async function cleanup(kv: KeyValue, now: number) {
  const ids = new Set<string>();
  for (const { key } of (await kv.list({ prefix: "job/" })).blobs) {
    const match = JOB_KEY.exec(key);
    if (match) ids.add(match[1]);
  }
  let jobs = 0;
  for (const id of ids) {
    const job = await readJob(kv, id);
    // No record means its stages were orphaned (a delete that only half worked); an unreadable date cannot prove the job is fresh.
    if (job && now - job.createdAt <= KEEP_JOBS_MS) continue;
    await forgetJob(kv, id);
    jobs++;
  }

  const today = Date.parse(`${utcDay(now)}T00:00:00Z`);
  let quota = 0;
  for (const { key } of (await kv.list({ prefix: "quota/" })).blobs) {
    const day = QUOTA_KEY.exec(key)?.[1];
    const age = day ? (today - Date.parse(`${day}T00:00:00Z`)) / DAY_MS : NaN;
    if (!(age > KEEP_QUOTA_DAYS)) continue;
    await kv.delete(key);
    quota++;
  }
  return { jobs, quota };
}
