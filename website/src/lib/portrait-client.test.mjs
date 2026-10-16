// website/src/lib/portrait-client.test.mjs
// The browser side of the portrait API, run against stubbed fetch and localStorage.
// client.ts is imported directly (Node strips the types); it touches no DOM at import time.
import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
};
const { pollPortrait, startPortrait, rememberInvite, storedInvite, forgetInvite, rememberJob, storedJob, settleJob } = await import("../components/portrait/client.ts");

const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const state = (status, error = null, stages = {}) => reply(200, { status, stages, teachings: {}, error });

const realFetch = globalThis.fetch;
const realSetTimeout = globalThis.setTimeout;
const realNow = Date.now;
test.beforeEach(() => {
  store.clear();
  globalThis.setTimeout = (fn) => realSetTimeout(fn, 0);
});
test.afterEach(() => {
  globalThis.fetch = realFetch;
  globalThis.setTimeout = realSetTimeout;
  Date.now = realNow;
});

async function follow(responses) {
  const queue = [...responses];
  const urls = [];
  globalThis.fetch = async (url) => { urls.push(String(url)); return queue.shift(); };
  const updates = [];
  await pollPortrait("job-1", (s) => updates.push(s), new AbortController().signal);
  return { updates, urls, left: queue.length };
}

test("a 503 and a 502 are transient: no update, polling continues to done", async () => {
  const { updates, urls, left } = await follow([reply(503, { error: "busy" }), reply(502, {}), state("running"), state("done")]);
  assert.deepEqual(updates.map((u) => u.status), ["running", "done"]);
  assert.equal(urls.length, 4);
  assert.equal(urls[0], "/api/portrait/job-1");
  assert.equal(left, 0);
});

test("a 404 ends the poll as failed with error missing, not resumable", async () => {
  const { updates } = await follow([reply(404, { error: "missing" })]);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].status, "failed");
  assert.equal(updates[0].error, "missing");
  assert.equal(updates[0].resumable, undefined);
});

test("a server-reported failure is passed through untouched", async () => {
  const { updates } = await follow([state("failed", "stage_b_invalid")]);
  assert.deepEqual(updates.map((u) => [u.status, u.error, u.resumable]), [["failed", "stage_b_invalid", undefined]]);
});

test("after 8 minutes the client gives up with timeout, marked resumable", async () => {
  globalThis.fetch = async () => reply(503, { error: "busy" });
  let clock = 0;
  Date.now = () => (clock += 200_000);
  const updates = [];
  await pollPortrait("job-1", (s) => updates.push(s), new AbortController().signal);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].status, "failed");
  assert.equal(updates[0].error, "timeout");
  assert.equal(updates[0].resumable, true);
});

test("an aborted poll stops without an update", async () => {
  const controller = new AbortController();
  globalThis.fetch = async () => { controller.abort(); throw new DOMException("aborted", "AbortError"); };
  const updates = [];
  await pollPortrait("job-1", (s) => updates.push(s), controller.signal);
  assert.deepEqual(updates, []);
});

test("startPortrait sends the idempotency key and maps every outcome", async () => {
  let sent;
  globalThis.fetch = async (url, init) => { sent = { url, init }; return reply(202, { id: "job-9" }); };
  assert.deepEqual(await startPortrait({ v: 1 }, "beta-code"), { id: "job-9" });
  assert.equal(sent.url, "/api/portrait");
  assert.equal(sent.init.method, "POST");
  assert.match(sent.init.headers["idempotency-key"], /^[0-9a-f-]{36}$/);
  assert.deepEqual(JSON.parse(sent.init.body), { packet: { v: 1 }, invite: "beta-code" });

  for (const [status, error] of [[400, "packet"], [403, "invite"], [403, "origin"], [409, "conflict"], [413, "too_large"], [429, "invite_limit"], [503, "busy"], [503, "paused"], [503, "budget"]]) {
    globalThis.fetch = async () => reply(status, { error });
    assert.deepEqual(await startPortrait({}, "x"), { error }, `${status} ${error}`);
  }
  globalThis.fetch = async () => ({ status: 502, ok: false, json: async () => { throw new Error("not json"); } });
  assert.deepEqual(await startPortrait({}, "x"), { error: "http_502" });
  globalThis.fetch = async () => { throw new TypeError("network"); };
  assert.deepEqual(await startPortrait({}, "x"), { error: "offline" });
});

test("the invite is remembered in lower case and forgetInvite clears it", () => {
  assert.equal(storedInvite(), null);
  rememberInvite("  BETA-Code ");
  assert.equal(storedInvite(), "beta-code");
  forgetInvite();
  assert.equal(storedInvite(), null);
});

const PACKET = {
  v: 1, locale: "en", timeKnown: false,
  factors: [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 14].map((position) => ({ id: `arkan-${position}`, kind: "arkan", position, card: position % 22 })),
    ...["sun", "moon", "mercury", "venus", "mars"].map((body) => ({ id: `natal-${body}`, kind: "planet", body, sign: "aries", house: null, retrograde: false, alternatives: null })),
    { id: "num-lifePath", kind: "number", role: "lifePath", value: 5, master: false },
  ],
};

test("the job id and packet are remembered and cleared", () => {
  assert.equal(storedJob(), null);
  rememberJob({ id: "job-1", packet: PACKET });
  assert.deepEqual(storedJob(), { id: "job-1", packet: PACKET });
  rememberJob({ id: "job-1" });
  assert.deepEqual(storedJob(), { id: "job-1" });
  rememberJob(null);
  assert.equal(storedJob(), null);
});

test("a finished or failed reading keeps its id and packet; only a missing one is forgotten", () => {
  rememberJob({ id: "job-1", packet: PACKET });
  const status = (s, error = null, extra = {}) => ({ status: s, stages: {}, teachings: {}, error, ...extra });
  for (const s of [status("running"), status("done"), status("failed", "stage_b_invalid"), status("failed", "timeout", { resumable: true }), status("failed", "unconfigured")]) {
    settleJob(s);
    assert.deepEqual(storedJob(), { id: "job-1", packet: PACKET }, `${s.status} ${s.error}`);
  }
  settleJob(status("failed", "missing"));
  assert.equal(storedJob(), null);
});

test("an id stored as a plain string still resumes, without a packet", () => {
  store.set("olivia:portrait-job", "8f1c2a90-5d3e-4b7a-9c61-0e2f4a7b8c9d");
  assert.deepEqual(storedJob(), { id: "8f1c2a90-5d3e-4b7a-9c61-0e2f4a7b8c9d" });
  store.set("olivia:portrait-job", "12345");
  assert.deepEqual(storedJob(), { id: "12345" });
});

test("a stored packet that fails validation is dropped, the id kept", () => {
  store.set("olivia:portrait-job", JSON.stringify({ id: "job-2", packet: { ...PACKET, factors: PACKET.factors.slice(1) } }));
  assert.deepEqual(storedJob(), { id: "job-2" });
});

test("the stored job keeps only the id and the packet", () => {
  rememberJob({ id: "job-3", packet: PACKET, name: "Olena", date: "1990-03-03", place: "Kyiv" });
  assert.deepEqual(Object.keys(JSON.parse(store.get("olivia:portrait-job"))), ["id", "packet"]);
  assert.ok(!/Olena|1990-03-03|Kyiv/.test(store.get("olivia:portrait-job")));
});

test("blocked storage never throws", () => {
  const saved = globalThis.localStorage;
  const blocked = () => { throw new Error("blocked"); };
  globalThis.localStorage = { getItem: blocked, setItem: blocked, removeItem: blocked };
  try {
    assert.doesNotThrow(() => { rememberInvite("abcd"); forgetInvite(); rememberJob({ id: "x" }); rememberJob(null); });
    assert.equal(storedInvite(), null);
    assert.equal(storedJob(), null);
  } finally {
    globalThis.localStorage = saved;
  }
});
