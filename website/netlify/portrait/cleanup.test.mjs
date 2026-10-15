// website/netlify/portrait/cleanup.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { memoryStore, createJob, putStage, readJob, readStages } from "./store.ts";
import { cleanup } from "./cleanup.ts";

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 9, 16, 3, 0, 0);
const job = (id, createdAt) => ({ id, status: "done", createdAt, packet: null, invite: "abc", day: "2026-10-15", reserveCents: 75, costCents: 10, error: null });
const seed = async (kv, id, createdAt) => {
  await createJob(kv, job(id, createdAt));
  for (const stage of ["a", "b", "c"]) await putStage(kv, id, stage, { s: stage });
  await kv.setJSON(`job/${id}/t`, { x: 1 });
};
const keys = async (kv) => (await kv.list({ prefix: "" })).blobs.map((b) => b.key).sort();

test("a job past the keep limit goes with its stages and teachings; a fresher one stays", async () => {
  const kv = memoryStore();
  await seed(kv, "old", NOW - 23 * HOUR - 1);
  await seed(kv, "fresh", NOW - 22 * HOUR);
  const counts = await cleanup(kv, NOW);
  assert.equal(await readJob(kv, "old"), null);
  assert.deepEqual(await readStages(kv, "old"), {});
  assert.equal(await kv.get("job/old/t", { type: "json" }), null);
  assert.equal((await readJob(kv, "fresh")).id, "fresh");
  assert.deepEqual(Object.keys(await readStages(kv, "fresh")), ["a", "b", "c"]);
  assert.deepEqual(await kv.get("job/fresh/t", { type: "json" }), { x: 1 });
  assert.equal(counts.jobs, 1);
});

test("a job exactly at the limit is kept", async () => {
  const kv = memoryStore();
  await seed(kv, "edge", NOW - 23 * HOUR);
  await cleanup(kv, NOW);
  assert.ok(await readJob(kv, "edge"));
});

test("hourly sweeps keep every job under a day: the limit leaves room for the gap between runs", async () => {
  const kv = memoryStore();
  await seed(kv, "j", NOW - 23 * HOUR - 1);
  await cleanup(kv, NOW); // the sweep that finds it...
  assert.equal(await readJob(kv, "j"), null);
  await seed(kv, "k", NOW - 23 * HOUR);
  await cleanup(kv, NOW); // ...and one that spares a job which the next sweep, an hour later, takes at under 24 h
  assert.ok(await readJob(kv, "k"));
  await cleanup(kv, NOW + HOUR);
  assert.equal(await readJob(kv, "k"), null);
});

test("a stuck queued or running job is removed too, packet and all", async () => {
  const kv = memoryStore();
  await createJob(kv, { ...job("stuck", NOW - 30 * HOUR), status: "running", packet: { v: 1 } });
  await cleanup(kv, NOW);
  assert.equal(await readJob(kv, "stuck"), null);
});

test("stages left behind without a job record are removed", async () => {
  const kv = memoryStore();
  await putStage(kv, "orphan", "a", { s: 1 });
  await kv.setJSON("job/orphan/t", { x: 1 });
  await seed(kv, "fresh", NOW - HOUR);
  const counts = await cleanup(kv, NOW);
  assert.deepEqual((await keys(kv)).filter((k) => k.includes("orphan")), []);
  assert.deepEqual(Object.keys(await readStages(kv, "fresh")), ["a", "b", "c"]);
  assert.equal(counts.jobs, 1);
});

test("a day's quota counters are removed once the day is more than seven days old", async () => {
  const kv = memoryStore();
  for (const day of ["2026-10-01", "2026-10-08", "2026-10-09", "2026-10-15", "2026-10-16"]) {
    await kv.setJSON(`quota/${day}/cents`, 75);
    await kv.setJSON(`quota/${day}/invite/abc`, 1);
  }
  const counts = await cleanup(kv, NOW);
  const left = (await keys(kv)).map((k) => k.split("/")[1]);
  assert.deepEqual([...new Set(left)], ["2026-10-09", "2026-10-15", "2026-10-16"]);
  assert.equal(left.length, 6);
  assert.equal(counts.quota, 4);
});

test("keys it does not know are left alone", async () => {
  const kv = memoryStore();
  await kv.setJSON("quota/not-a-day/cents", 1);
  await kv.setJSON("other/thing", 1);
  await cleanup(kv, NOW);
  assert.deepEqual(await keys(kv), ["other/thing", "quota/not-a-day/cents"]);
});

test("an empty store is fine, and a store error is not swallowed", async () => {
  assert.deepEqual(await cleanup(memoryStore(), NOW), { jobs: 0, quota: 0 });
  const kv = memoryStore();
  kv.list = async () => { throw new Error("blobs_down"); };
  await assert.rejects(cleanup(kv, NOW), /blobs_down/);
});
