// website/src/components/portrait/client.ts
/** Browser side of the portrait API: start a reading, follow it, remember the beta invite. */
// Relative, not "@/": the node test runner imports this file directly.
import { validatePacket } from "../../lib/portrait/packet.js";

/** A passage cites the packet factors it was read from, and the teachings behind them. */
export type Passage = { text: string; refs: string[]; teachings: string[] };
export type Facet = Passage & { heading: string };
export type Chapter = { title: string; lede: string; paragraphs: string[]; practice: string; refs: string[]; teachings: string[] };
export type PortraitStages = {
  a?: { title: string; epigraph: string; overview: Passage; facets: Record<string, Facet> };
  b?: { chapters: Record<string, Chapter> };
  c?: { chapters: Record<string, Chapter>; keep: string[] };
};
export type PortraitStatus = {
  status: "queued" | "running" | "done" | "failed";
  stages: PortraitStages;
  teachings: Record<string, { label: string; text: string; sources: { title: string; url: string }[] }>;
  error: string | null;
  /** Set only on the client's own 8-minute give-up: the reading may still be running, so its id is worth keeping. */
  resumable?: boolean;
};
/** The calculated factors sent to the server (src/lib/portrait/packet.js); never the birth details. */
export type PacketFactor = {
  id: string; kind: string; position?: number; card?: number; role?: string; value?: number; master?: boolean;
  body?: string; sign?: string; house?: number | null; retrograde?: boolean; alternatives?: string[] | null;
  angle?: string; a?: string; b?: string; aspect?: string;
};
export type PortraitPacket = { v: number; locale: string; timeKnown: boolean; factors: PacketFactor[] };
/**
 * The reading on this page: its id, and the packet so a reload can lay the
 * cards again or reopen the finished reader. Kept after the reading is done;
 * cleared only by a new portrait or by the server no longer knowing the id.
 */
export type StoredJob = { id: string; packet?: PortraitPacket };
const INVITE = "olivia:portrait-invite";
const JOB = "olivia:portrait-job";
const GIVE_UP_AFTER = 8 * 60_000;
const EVERY = 2500;

export function readInviteFromHash() {
  const match = /[#&]invite=([a-z0-9-]{4,40})/i.exec(window.location.hash);
  if (!match) return null;
  rememberInvite(match[1]);
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return match[1];
}
export function rememberInvite(code: string) { try { localStorage.setItem(INVITE, code.trim().toLowerCase()); } catch { /* private mode */ } }
export function storedInvite() { try { return localStorage.getItem(INVITE); } catch { return null; } }
export function forgetInvite() { try { localStorage.removeItem(INVITE); } catch { /* private mode */ } }
/** Keeps only the id and the packet, whatever else the caller holds: no name, date, time or place. */
export function rememberJob(job: StoredJob | null) {
  try {
    if (job) localStorage.setItem(JOB, JSON.stringify(job.packet ? { id: job.id, packet: job.packet } : { id: job.id }));
    else localStorage.removeItem(JOB);
  } catch { /* private mode */ }
}
/** The stored reading, if any. A plain string is an id stored before packets were kept. */
export function storedJob(): StoredJob | null {
  let raw: string | null;
  try { raw = localStorage.getItem(JOB); } catch { return null; }
  if (!raw) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return { id: raw }; }
  if (!value || typeof value !== "object" || typeof (value as StoredJob).id !== "string") return { id: raw };
  const { id, packet } = value as StoredJob;
  const checked = validatePacket(packet) as { ok: boolean; packet?: PortraitPacket };
  return checked.ok && checked.packet ? { id, packet: checked.packet } : { id };
}

/**
 * After each status: an unknown or expired reading (404, "missing") is
 * forgotten. Anything else, done or failed, stays, so a reload reopens what
 * was written.
 */
export function settleJob(status: PortraitStatus) {
  if (status.status === "failed" && status.error === "missing") rememberJob(null);
}

export async function startPortrait(packet: unknown, invite: string): Promise<{ id: string } | { error: string }> {
  try {
    const res = await fetch("/api/portrait", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ packet, invite }) });
    const body = await res.json().catch(() => ({}));
    return res.ok && body.id ? { id: body.id } : { error: body.error ?? `http_${res.status}` };
  } catch {
    return { error: "offline" };
  }
}

const failed = (error: string, resumable = false): PortraitStatus => ({ status: "failed", stages: {}, teachings: {}, error, ...(resumable ? { resumable } : {}) });

/**
 * Follows a reading until it is done or failed; gives up after 8 minutes.
 * A 404 means the reading is unknown or expired. A 503 or any other 5xx is
 * transient store trouble: no update, keep polling.
 */
export async function pollPortrait(id: string, onUpdate: (s: PortraitStatus) => void, signal: AbortSignal) {
  const started = Date.now();
  while (!signal.aborted) {
    try {
      const res = await fetch(`/api/portrait/${id}`, { cache: "no-store", signal });
      if (res.status === 404) return onUpdate(failed("missing"));
      if (res.ok) {
        const status = (await res.json()) as PortraitStatus;
        onUpdate(status);
        if (status.status === "done" || status.status === "failed") return;
      }
    } catch { if (signal.aborted) return; }
    if (Date.now() - started > GIVE_UP_AFTER) return onUpdate(failed("timeout", true));
    await new Promise((resolve) => setTimeout(resolve, EVERY));
  }
}
