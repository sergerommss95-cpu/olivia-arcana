// website/netlify/portrait/api.test.mjs
import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { birthChart } from "../../src/lib/astrology/chart.js";
import { arkanPortrait } from "../../src/lib/portrait/arkan.js";
import { nameNumbers } from "../../src/lib/portrait/numbers.js";
import { buildPacket } from "../../src/lib/portrait/packet.js";
import { claimJob, finishJob, memoryStore, putStage, readJob, readTeachings } from "./store.ts";
import { sha256Hex } from "./invite.ts";
import { createApi, failUnconfigured } from "./api.ts";
import { readFile } from "node:fs/promises";

const bank = JSON.parse(await readFile(new URL("./knowledge/bank.json", import.meta.url), "utf8"));
const packet = buildPacket({ locale: "en", chart: birthChart({ date: "2000-02-01", time: "14:30", zone: "Europe/Kyiv", latitude: 50.45, longitude: 30.52 }), arkan: arkanPortrait("2000-02-01"), numbers: nameNumbers({ date: "2000-02-01", name: "Olena Koval" }), daySigns: null });
const CODE = "olv-test-0001";
const sha = await sha256Hex(CODE);
const setup = async (overrides = {}) => {
  const kv = memoryStore();
  const kicked = [];
  const vars = { PORTRAIT_INVITE_HASHES: await sha256Hex(CODE), PORTRAIT_PER_INVITE_DAILY: "2", PORTRAIT_DAILY_BUDGET_USD: "5", PORTRAIT_RESERVE_USD: "0.75", ...overrides };
  let n = 0;
  const clock = { now: Date.UTC(2026, 9, 15) };
  const api = createApi({ kv, env: (k) => vars[k], now: () => clock.now, kick: async (id) => { kicked.push(id); }, uuid: () => `00000000-0000-4000-8000-00000000000${++n}`, bank });
  return { api, kv, kicked, clock };
};
const post = (body, headers = {}) => new Request("https://oliviaarcana.com/api/portrait", { method: "POST", headers: { "content-type": "application/json", origin: "https://oliviaarcana.com", "sec-fetch-site": "same-origin", ...headers }, body: JSON.stringify(body) });

test("an invited, valid packet is admitted and handed to the background", async () => {
  const { api, kicked } = await setup();
  const res = await api.create(post({ packet, invite: CODE }));
  assert.equal(res.status, 202);
  const { id } = await res.json();
  assert.deepEqual(kicked, [id]);
});

test("the same idempotency key returns the same job without a second charge", async () => {
  const { api, kicked } = await setup();
  const key = "6f1c2c7e-6b44-4c35-9f6a-2b1f0a8d3e11";
  const first = await (await api.create(post({ packet, invite: CODE }, { "idempotency-key": key }))).json();
  const again = await api.create(post({ packet, invite: CODE }, { "idempotency-key": key }));
  assert.equal(again.status, 200);
  assert.deepEqual(await again.json(), first);
  assert.equal(kicked.length, 1);
});

test("refusals: origin, invite, packet, limit, pause, budget", async () => {
  const { api } = await setup();
  assert.equal((await api.create(post({ packet, invite: CODE }, { origin: "https://evil.example", "sec-fetch-site": "cross-site" }))).status, 403);
  assert.equal((await api.create(post({ packet, invite: "nope" }))).status, 403);
  assert.equal((await api.create(post({ packet: { ...packet, v: 9 }, invite: CODE }))).status, 400);
  await api.create(post({ packet, invite: CODE }));
  await api.create(post({ packet, invite: CODE }));
  const limited = await api.create(post({ packet, invite: CODE }));
  assert.equal(limited.status, 429);
  assert.equal((await (await setup({ PORTRAIT_ENABLED: "false" })).api.create(post({ packet, invite: CODE }))).status, 503);
  assert.equal((await (await setup({ PORTRAIT_DAILY_BUDGET_USD: "0" })).api.create(post({ packet, invite: CODE }))).status, 503);
});

test("status returns landed stages and the teachings they cite", async () => {
  const { api, kv } = await setup();
  const { id } = await (await api.create(post({ packet, invite: CODE }))).json();
  await putStage(kv, id, "a", { title: "T", overview: { text: "x", refs: ["natal-sun"], teachings: ["natal-sun-sign"] }, facets: {} });
  const res = await api.status(id);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "queued");
  assert.equal(body.stages.a.title, "T");
  assert.ok("natal-sun-sign" in body.teachings);
  assert.equal((await api.status("00000000-0000-4000-8000-999999999999")).status, 404);
  assert.equal((await api.status("../job")).status, 404);
});

test("a finished portrait is read from the teachings kept at the finish, not from the packet", async () => {
  const { api, kv } = await setup();
  const { id } = await (await api.create(post({ packet, invite: CODE }))).json();
  await claimJob(kv, id);
  await putStage(kv, id, "a", { title: "T", overview: { text: "x", refs: ["natal-sun"], teachings: ["natal-sun-sign"] }, facets: {} });
  const kept = { "natal-sun-sign": { label: "Sun · Aquarius", text: "Kept text.", sources: [{ title: "S", url: "https://example.com/s" }] } };
  await finishJob(kv, id, { status: "done", costCents: 5, error: null, teachings: kept });
  assert.equal((await readJob(kv, id)).packet, null);
  const res = await api.status(id);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "done");
  assert.deepEqual(body.teachings, kept);
  assert.equal(body.stages.a.title, "T");
});

test("a finished job whose teachings are gone still answers, with none", async () => {
  const { api, kv } = await setup();
  const { id } = await (await api.create(post({ packet, invite: CODE }))).json();
  await claimJob(kv, id);
  await finishJob(kv, id, { status: "failed", costCents: 0, error: "stage_a_invalid", teachings: {} });
  await kv.delete(`job/${id}/t`);
  const body = await (await api.status(id)).json();
  assert.equal(body.status, "failed");
  assert.deepEqual(body.teachings, {});
});

test("a portrait is forgotten by the server after a day", async () => {
  const { api, kv, clock } = await setup();
  const { id } = await (await api.create(post({ packet, invite: CODE }))).json();
  await putStage(kv, id, "a", { title: "T" });
  await claimJob(kv, id);
  await finishJob(kv, id, { status: "done", costCents: 1, error: null, teachings: { x: { label: "L", text: "T", sources: [] } } });
  clock.now += 24 * 3_600_000 + 1;
  assert.equal((await api.status(id)).status, 404);
  assert.equal(await kv.get(`job/${id}/a`, { type: "json" }), null);
  assert.equal(await kv.get(`job/${id}/t`, { type: "json" }), null);
});

test("the reserve defaults to $1.50 and a bad value falls back to it", async () => {
  // A $3 budget holds exactly two $1.50 reserves; the third is refused for budget.
  for (const bad of [undefined, "", "abc", "Infinity", "0", "-1"]) {
    const { api } = await setup({ PORTRAIT_DAILY_BUDGET_USD: "3", PORTRAIT_PER_INVITE_DAILY: "10", PORTRAIT_RESERVE_USD: bad });
    assert.equal((await api.create(post({ packet, invite: CODE }))).status, 202, `first with ${bad}`);
    assert.equal((await api.create(post({ packet, invite: CODE }))).status, 202, `second with ${bad}`);
    const third = await api.create(post({ packet, invite: CODE }));
    assert.equal(third.status, 503, `third with ${bad}`);
    assert.deepEqual(await third.json(), { error: "budget" });
  }
});

test("invite hashes are split on commas, trimmed and lowercased", async () => {
  const { api } = await setup({ PORTRAIT_INVITE_HASHES: ` , ${"f".repeat(64)} ,, ${sha.toUpperCase()} , ` });
  assert.equal((await api.create(post({ packet, invite: CODE }))).status, 202);
});

test("a job still queued or running after fifteen minutes is reported failed, without touching the store", async () => {
  const { api, kv, clock } = await setup({ PORTRAIT_PER_INVITE_DAILY: "5" });
  const queued = (await (await api.create(post({ packet, invite: CODE }))).json()).id;
  const running = (await (await api.create(post({ packet, invite: CODE }))).json()).id;
  const done = (await (await api.create(post({ packet, invite: CODE }, { "idempotency-key": "6f1c2c7e-6b44-4c35-9f6a-2b1f0a8d3e11" }))).json()).id;
  assert.ok(await claimJob(kv, running));
  assert.ok(await claimJob(kv, done));
  await finishJob(kv, done, { status: "done", costCents: 10, error: null });
  await putStage(kv, queued, "a", { title: "T" });

  clock.now += 15 * 60_000;
  assert.equal((await (await api.status(queued)).json()).status, "queued");
  assert.equal((await (await api.status(running)).json()).status, "running");

  clock.now += 1;
  for (const id of [queued, running]) {
    const res = await api.status(id);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "failed");
  }
  const late = await (await api.status(queued)).json();
  assert.equal(late.error, "timeout");
  assert.equal(late.stages.a.title, "T");
  assert.equal((await (await api.status(done)).json()).status, "done");
  assert.equal((await readJob(kv, queued)).status, "queued");
  assert.equal((await readJob(kv, running)).status, "running");
  assert.equal((await readJob(kv, queued)).error, null);
});

test("store trouble answers 503 busy, logs only the message, and gives the reservation back", async () => {
  const warn = mock.method(console, "warn", () => {});
  try {
    const { api, kv } = await setup({ PORTRAIT_PER_INVITE_DAILY: "1" });
    const write = kv.setJSON;

    kv.setJSON = async () => { throw new Error("blobs_down"); };
    const down = await api.create(post({ packet, invite: CODE }));
    assert.equal(down.status, 503);
    assert.deepEqual(await down.json(), { error: "busy" });

    // The counters work but the job record cannot be written: the invite's one slot must not leak.
    kv.setJSON = async (key, ...rest) => { if (key.startsWith("job/")) throw new Error("blobs_down"); return write(key, ...rest); };
    const half = await api.create(post({ packet, invite: CODE }));
    assert.equal(half.status, 503);
    assert.deepEqual(await half.json(), { error: "busy" });

    kv.setJSON = write;
    assert.equal((await api.create(post({ packet, invite: CODE }))).status, 202);

    assert.equal(warn.mock.callCount(), 2);
    for (const [line] of warn.mock.calls.map((c) => c.arguments)) {
      assert.deepEqual(JSON.parse(line), { event: "portrait_store_error", message: "blobs_down" });
    }
  } finally {
    warn.mock.restore();
  }
});

test("a request body over 16 KB is refused", async () => {
  const { api, kicked } = await setup();
  const res = await api.create(post({ packet, invite: CODE, padding: "x".repeat(16 * 1024) }));
  assert.equal(res.status, 413);
  assert.deepEqual(await res.json(), { error: "too_large" });
  assert.equal(kicked.length, 0);
});

test("a background that cannot be reached leaves the job queued and still answers 202", async () => {
  const warn = mock.method(console, "warn", () => {});
  try {
    const kv = memoryStore();
    const api = createApi({ kv, env: (k) => ({ PORTRAIT_INVITE_HASHES: sha, PORTRAIT_DAILY_BUDGET_USD: "5" })[k], now: () => Date.UTC(2026, 9, 15), kick: async () => { throw new Error("background_500"); }, uuid: () => "00000000-0000-4000-8000-000000000001", bank });
    const res = await api.create(post({ packet, invite: CODE }));
    assert.equal(res.status, 202);
    assert.equal((await (await api.status("00000000-0000-4000-8000-000000000001")).json()).status, "queued");
    assert.deepEqual(JSON.parse(warn.mock.calls[0].arguments[0]), { event: "portrait_kick_failed", message: "background_500" });
  } finally {
    warn.mock.restore();
  }
});

test("a null or garbage Origin is refused as a foreign origin, not a crash", async () => {
  const { api, kicked } = await setup();
  for (const origin of ["null", "garbage"]) {
    for (const site of ["same-origin", ""]) {
      const res = await api.create(post({ packet, invite: CODE }, { origin, "sec-fetch-site": site }));
      assert.equal(res.status, 403, `${origin} / ${site || "no sec-fetch-site"}`);
      assert.deepEqual(await res.json(), { error: "origin" });
    }
  }
  assert.equal(kicked.length, 0);
});

test("status answers 503 busy and logs only the message when the store fails", async () => {
  const warn = mock.method(console, "warn", () => {});
  try {
    const { api, kv } = await setup();
    const { id } = await (await api.create(post({ packet, invite: CODE }))).json();
    kv.get = async () => { throw new Error("blobs_down"); };
    const res = await api.status(id);
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: "busy" });
    assert.equal(warn.mock.callCount(), 1);
    assert.deepEqual(JSON.parse(warn.mock.calls[0].arguments[0]), { event: "portrait_store_error", message: "blobs_down" });
  } finally {
    warn.mock.restore();
  }
});

test("with no API key a queued job is failed at once, its reservation returned, and a second call changes nothing", async () => {
  const { api, kv } = await setup();
  const { id } = await (await api.create(post({ packet, invite: CODE }))).json();
  const cents = () => kv.get("quota/2026-10-15/cents", { type: "json" });
  assert.equal(await cents(), 75);

  assert.equal(await failUnconfigured(kv, id), "failed");
  const job = await readJob(kv, id);
  assert.equal(job.status, "failed");
  assert.equal(job.error, "unconfigured");
  assert.equal(job.costCents, 0);
  assert.equal(job.packet, null);
  assert.deepEqual(await readTeachings(kv, id), {});
  assert.equal(await cents(), 0);
  const body = await (await api.status(id)).json();
  assert.equal(body.status, "failed");
  assert.equal(body.error, "unconfigured");

  assert.equal(await failUnconfigured(kv, id), "skipped");
  assert.deepEqual(await readJob(kv, id), job);
  assert.equal(await cents(), 0);
  assert.equal(await failUnconfigured(kv, "00000000-0000-4000-8000-999999999999"), "skipped");
});
