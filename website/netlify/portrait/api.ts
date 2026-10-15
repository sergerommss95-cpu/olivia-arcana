// website/netlify/portrait/api.ts
/** The portrait's two HTTP endpoints, with every dependency passed in so they can be tested. */
import { validatePacket } from "../../src/lib/portrait/packet.js";
import { admit, createJob, forgetJob, readJob, readStages, refund, utcDay, type KeyValue } from "./store.ts";
import { inviteId } from "./invite.ts";
import { selectTeachings, type Bank } from "./teachings.ts";

type Deps = { kv: KeyValue; env: (name: string) => string | undefined; now: () => number; kick: (id: string) => Promise<void>; uuid: () => string; bank: Bank };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 16 * 1024;
const DAY_MS = 86_400_000;
/** Longer than the background function may run (15 minutes): a job still open after this was lost. */
const STALE_MS = 15 * 60_000;
const DEFAULT_RESERVE_USD = 1.5;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const logError = (event: string, error: unknown) => console.warn(JSON.stringify({ event, message: (error as Error)?.message }));

function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = req.headers.get("origin");
  return !origin || new URL(origin).host === new URL(req.url).host;
}

export function createApi({ kv, env, now, kick, uuid, bank }: Deps) {
  const number = (name: string, fallback: number) => { const v = Number(env(name)); return Number.isFinite(v) && env(name) !== undefined && env(name) !== "" ? v : fallback; };

  async function create(req: Request) {
    if (!sameOrigin(req)) return json(403, { error: "origin" });
    if (env("PORTRAIT_ENABLED") === "false") return json(503, { error: "paused" });
    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json(413, { error: "too_large" });
    let body: any;
    try { body = JSON.parse(text); } catch { return json(400, { error: "packet" }); }
    const checked = validatePacket(body?.packet) as { ok: true; packet: unknown } | { ok: false; error: string };
    if (!checked.ok) return json(400, { error: "packet" });
    const invite = await inviteId(body?.invite, (env("PORTRAIT_INVITE_HASHES") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
    if (!invite) return json(403, { error: "invite" });

    const key = req.headers.get("idempotency-key");
    const id = key && UUID.test(key) ? key.toLowerCase() : uuid();
    const day = utcDay(now());

    try {
      const existing = await readJob(kv, id);
      if (existing) return existing.invite === invite ? json(200, { id }) : json(409, { error: "conflict" });
      const budgetCents = Math.round(number("PORTRAIT_DAILY_BUDGET_USD", 5) * 100);
      if (budgetCents <= 0) return json(503, { error: "budget" });
      const reserve = number("PORTRAIT_RESERVE_USD", DEFAULT_RESERVE_USD);
      const reserveCents = Math.round((reserve > 0 ? reserve : DEFAULT_RESERVE_USD) * 100);
      const admitted = await admit(kv, { day, invite, perInvite: number("PORTRAIT_PER_INVITE_DAILY", 3), budgetCents, reserveCents });
      if (admitted === "invite") return json(429, { error: "invite_limit" });
      if (admitted === "budget") return json(503, { error: "budget" });

      let created: boolean;
      try {
        created = await createJob(kv, { id, status: "queued", createdAt: now(), packet: checked.packet, invite, day, reserveCents, costCents: 0, error: null });
      } catch (error) {
        // Nothing was handed to the background, so the reservation must not stay held.
        await refund(kv, { day, invite, reserveCents }).catch((refundError) => logError("portrait_store_error", refundError));
        throw error;
      }
      if (!created) { await refund(kv, { day, invite, reserveCents }); return json(200, { id }); }
    } catch (error) {
      logError("portrait_store_error", error);
      return json(503, { error: "busy" });
    }

    // The job stays queued if the background cannot be reached: it may still claim it, and the status endpoint times it out.
    try { await kick(id); } catch (error) { logError("portrait_kick_failed", error); }
    return json(202, { id });
  }

  async function status(id: string) {
    if (!UUID.test(id)) return json(404, { error: "missing" });
    const job = await readJob(kv, id);
    if (!job) return json(404, { error: "missing" });
    // The reader keeps the portrait on their device; the server lets it go after a day.
    if (now() - job.createdAt > DAY_MS) { await forgetJob(kv, id); return json(404, { error: "missing" }); }
    const stages = await readStages(kv, id);
    const cited = new Set<string>();
    const collect = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) k === "teachings" && Array.isArray(v) ? v.forEach((t) => cited.add(String(t))) : collect(v);
    };
    collect(stages);
    const teachings = Object.fromEntries(selectTeachings(job.packet as any, bank).filter((t) => cited.has(t.id)).map((t) => [t.id, { label: t.label, text: t.text, sources: t.sources.map((s) => bank.sources[s]) }]));
    // A writer that vanished leaves the job open for ever; report it failed without touching the record.
    const lost = (job.status === "running" || job.status === "queued") && now() - job.createdAt > STALE_MS;
    return json(200, { status: lost ? "failed" : job.status, stages, teachings, error: lost ? "timeout" : job.error });
  }

  return { create, status };
}
