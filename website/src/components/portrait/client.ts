// website/src/components/portrait/client.ts
/** Browser side of the portrait API: start a reading, follow it, remember the beta invite. */

type Facet = { heading: string; text: string };
type Chapter = { title: string; lede: string; paragraphs: string[]; practice: string };
export type PortraitStages = {
  a?: { title: string; epigraph: string; overview: { text: string }; facets: Record<string, Facet> };
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
export function rememberJob(id: string | null) { try { if (id) localStorage.setItem(JOB, id); else localStorage.removeItem(JOB); } catch { /* private mode */ } }
export function storedJob() { try { return localStorage.getItem(JOB); } catch { return null; } }

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
