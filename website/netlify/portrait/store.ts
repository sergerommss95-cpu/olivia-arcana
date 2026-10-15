/* Portrait jobs and daily limits in Netlify Blobs. Counters and job claims use
   conditional writes, so parallel requests cannot slip past a limit or run a
   job twice; a write the store could not confirm is an error, never a success.
   Stages are separate keys so the two parallel writers never touch one blob. */

type Conditional = { onlyIfNew?: boolean; onlyIfMatch?: string };
type WriteResult = { modified: boolean; etag?: string } | void;
export interface KeyValue {
  get(key: string, options: { type: "json" }): Promise<unknown>;
  getWithMetadata(key: string, options: { type: "json" }): Promise<{ data: unknown; etag?: string } | null>;
  setJSON(key: string, value: unknown, options?: Conditional): Promise<WriteResult>;
  delete(key: string): Promise<unknown>;
}

export type Job = {
  id: string; status: "queued" | "running" | "done" | "failed"; createdAt: number;
  packet: unknown; invite: string; day: string; reserveCents: number; costCents: number; error: string | null;
};
export type StageKey = "a" | "b" | "c";

export function memoryStore(): KeyValue {
  const data = new Map<string, { value: unknown; etag: string }>();
  let version = 0;
  return {
    async get(key) { return data.has(key) ? structuredClone(data.get(key)!.value) : null; },
    async getWithMetadata(key) { const entry = data.get(key); return entry ? { data: structuredClone(entry.value), etag: entry.etag } : null; },
    async setJSON(key, value, options = {}) {
      const current = data.get(key);
      if (options.onlyIfNew && current) return { modified: false };
      if (options.onlyIfMatch !== undefined && current?.etag !== options.onlyIfMatch) return { modified: false };
      const etag = `"${++version}"`;
      data.set(key, { value: structuredClone(value), etag });
      return { modified: true, etag };
    },
    async delete(key) { data.delete(key); },
  };
}

async function conditional(kv: KeyValue, key: string, value: unknown, condition: Conditional) {
  const written = await kv.setJSON(key, value, condition);
  if (written && written.modified && written.etag) return true;
  if (written && !written.modified) return false;
  throw new Error("store_unconfirmed");
}

/** Adds `step` to a counter unless the result would pass `max`; never below zero. */
async function bump(kv: KeyValue, key: string, step: number, max = Infinity) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const entry = await kv.getWithMetadata(key, { type: "json" });
    const next = Math.max(0, Number(entry?.data || 0) + step);
    if (step > 0 && next > max) return false;
    if (await conditional(kv, key, next, entry?.etag ? { onlyIfMatch: entry.etag } : { onlyIfNew: true })) return true;
  }
  return false;
}

export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);
const jobKey = (id: string) => `job/${id}`;

export async function createJob(kv: KeyValue, job: Job) { return conditional(kv, jobKey(job.id), job, { onlyIfNew: true }); }
export async function readJob(kv: KeyValue, id: string) { return (await kv.get(jobKey(id), { type: "json" })) as Job | null; }

export async function claimJob(kv: KeyValue, id: string): Promise<Job | null> {
  const entry = await kv.getWithMetadata(jobKey(id), { type: "json" });
  const job = entry?.data as Job | undefined;
  if (!job || job.status !== "queued" || !entry?.etag) return null;
  const running = { ...job, status: "running" as const };
  return (await conditional(kv, jobKey(id), running, { onlyIfMatch: entry.etag })) ? running : null;
}

export async function finishJob(kv: KeyValue, id: string, change: Partial<Job>) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const entry = await kv.getWithMetadata(jobKey(id), { type: "json" });
    if (!entry?.etag) throw new Error("job_missing");
    if (await conditional(kv, jobKey(id), { ...(entry.data as Job), ...change }, { onlyIfMatch: entry.etag })) return;
  }
  throw new Error("job_contended");
}

export async function putStage(kv: KeyValue, id: string, stage: StageKey, data: unknown) {
  if (!(await conditional(kv, `${jobKey(id)}/${stage}`, data, { onlyIfNew: true }))) throw new Error("stage_exists");
}
export async function readStages(kv: KeyValue, id: string) {
  const out: Record<string, unknown> = {};
  for (const stage of ["a", "b", "c"]) {
    const value = await kv.get(`${jobKey(id)}/${stage}`, { type: "json" });
    if (value) out[stage] = value;
  }
  return out;
}
export async function forgetJob(kv: KeyValue, id: string) {
  await Promise.all([jobKey(id), ...["a", "b", "c"].map((s) => `${jobKey(id)}/${s}`)].map((key) => kv.delete(key)));
}

type Limits = { day: string; invite: string; perInvite: number; budgetCents: number; reserveCents: number };
export async function admit(kv: KeyValue, { day, invite, perInvite, budgetCents, reserveCents }: Limits): Promise<"ok" | "invite" | "budget"> {
  if (!(await bump(kv, `quota/${day}/invite/${invite}`, 1, perInvite))) return "invite";
  if (await bump(kv, `quota/${day}/cents`, reserveCents, budgetCents)) return "ok";
  await bump(kv, `quota/${day}/invite/${invite}`, -1);
  return "budget";
}
export async function refund(kv: KeyValue, { day, invite, reserveCents }: { day: string; invite: string; reserveCents: number }) {
  await Promise.all([bump(kv, `quota/${day}/invite/${invite}`, -1), bump(kv, `quota/${day}/cents`, -reserveCents)]);
}
/** Replaces a job's reservation with what it actually cost. */
export async function settle(kv: KeyValue, { day, reserveCents, costCents }: { day: string; reserveCents: number; costCents: number }) {
  await bump(kv, `quota/${day}/cents`, costCents - reserveCents);
}
