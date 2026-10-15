import test from "node:test";
import assert from "node:assert/strict";
import { memoryStore, createJob, readJob, claimJob, finishJob, putStage, readStages, forgetJob, admit, refund, settle } from "./store.ts";
import { inviteId, sha256Hex } from "./invite.ts";

const job = (id) => ({ id, status: "queued", createdAt: 1, packet: { v: 1 }, invite: "abc", day: "2026-10-15", reserveCents: 75, costCents: 0, error: null });

test("a job is created once and claimed once", async () => {
  const kv = memoryStore();
  assert.equal(await createJob(kv, job("j1")), true);
  assert.equal(await createJob(kv, job("j1")), false);
  const [first, second] = await Promise.all([claimJob(kv, "j1"), claimJob(kv, "j1")]);
  assert.equal([first, second].filter(Boolean).length, 1);
  assert.equal((await readJob(kv, "j1")).status, "running");
  await finishJob(kv, "j1", { status: "done", costCents: 41, error: null });
  assert.equal((await readJob(kv, "j1")).costCents, 41);
});

test("stages are stored separately so parallel writers never collide", async () => {
  const kv = memoryStore();
  await Promise.all([putStage(kv, "j2", "b", { x: 1 }), putStage(kv, "j2", "c", { y: 2 })]);
  assert.deepEqual(await readStages(kv, "j2"), { b: { x: 1 }, c: { y: 2 } });
});

test("an invite is limited per day and the budget is shared", async () => {
  const kv = memoryStore();
  const ask = (invite) => admit(kv, { day: "d", invite, perInvite: 2, budgetCents: 200, reserveCents: 75 });
  assert.equal(await ask("a"), "ok");
  assert.equal(await ask("a"), "ok");
  assert.equal(await ask("a"), "invite");
  assert.equal(await ask("b"), "budget"); // 150 reserved; another 75 would pass 200
  await settle(kv, { day: "d", reserveCents: 75, costCents: 30 });
  assert.equal(await ask("b"), "ok"); // 105 + 75 = 180
  await refund(kv, { day: "d", invite: "b", reserveCents: 75 });
  assert.equal(await ask("b"), "ok");
});

test("parallel admissions never pass the limit", async () => {
  const kv = memoryStore();
  const results = await Promise.all(Array.from({ length: 6 }, () => admit(kv, { day: "d", invite: "p", perInvite: 3, budgetCents: 10_000, reserveCents: 75 })));
  assert.equal(results.filter((r) => r === "ok").length, 3);
});

test("an unconfirmed write is an error, not a success", async () => {
  const kv = memoryStore();
  kv.setJSON = async () => ({ modified: true }); // Blobs after throttling: no etag
  await assert.rejects(createJob(kv, job("j3")), /store_unconfirmed/);
});

test("invite codes are checked by hash", async () => {
  const hash = await sha256Hex("olv-moon-4821");
  assert.equal(await inviteId("olv-moon-4821", ["ffff", hash]), hash.slice(0, 16));
  assert.equal(await inviteId(" OLV-MOON-4821 ", [hash]), hash.slice(0, 16));
  assert.equal(await inviteId("wrong", [hash]), null);
  assert.equal(await inviteId("", [hash]), null);
});

test("a NaN limit is refused and nothing is written", async () => {
  const kv = memoryStore();
  await assert.rejects(admit(kv, { day: "d", invite: "n", perInvite: NaN, budgetCents: 200, reserveCents: 75 }), /counter_invalid/);
  assert.equal(await kv.get("quota/d/invite/n", { type: "json" }), null);
});

test("a missing cost is refused, never recorded as a counter change", async () => {
  const kv = memoryStore();
  await assert.rejects(settle(kv, { day: "d", reserveCents: 75, costCents: undefined }), /counter_invalid/);
});

test("a cost above the reservation is recorded for later admissions", async () => {
  const kv = memoryStore();
  const ask = (invite) => admit(kv, { day: "d", invite, perInvite: 5, budgetCents: 190, reserveCents: 75 });
  assert.equal(await ask("a"), "ok"); // 75 reserved
  await settle(kv, { day: "d", reserveCents: 75, costCents: 120 }); // 120 spent
  assert.equal(await ask("b"), "budget"); // 120 + 75 > 190
});

test("refund and settle throw when contention never resolves", async () => {
  const kv = memoryStore();
  kv.getWithMetadata = async () => ({ data: 5, etag: '"1"' });
  kv.setJSON = async () => ({ modified: false });
  await assert.rejects(refund(kv, { day: "d", invite: "a", reserveCents: 75 }), /counter_contended/);
  await assert.rejects(settle(kv, { day: "d", reserveCents: 75, costCents: 30 }), /counter_contended/);
});

test("forgetJob removes the job and every stage", async () => {
  const kv = memoryStore();
  await createJob(kv, job("j6"));
  await putStage(kv, "j6", "a", { s: 1 });
  await putStage(kv, "j6", "b", { s: 2 });
  await putStage(kv, "j6", "c", { s: 3 });
  await forgetJob(kv, "j6");
  assert.equal(await readJob(kv, "j6"), null);
  assert.deepEqual(await readStages(kv, "j6"), {});
});

test("a finished job cannot be finished again", async () => {
  const kv = memoryStore();
  await createJob(kv, job("j7"));
  await claimJob(kv, "j7");
  await finishJob(kv, "j7", { status: "done", costCents: 41, error: null });
  await assert.rejects(finishJob(kv, "j7", { status: "failed", costCents: 0, error: "x" }), /job_finished/);
  assert.equal((await readJob(kv, "j7")).costCents, 41);
});

test("a stage can be written again only with identical data", async () => {
  const kv = memoryStore();
  await putStage(kv, "j8", "a", { x: 1 });
  await putStage(kv, "j8", "a", { x: 1 });
  await assert.rejects(putStage(kv, "j8", "a", { x: 2 }), /stage_exists/);
  assert.deepEqual(await readStages(kv, "j8"), { a: { x: 1 } });
});

test("an existing entry without an etag is unconfirmed, not bumped", async () => {
  const kv = memoryStore();
  kv.getWithMetadata = async () => ({ data: 0 });
  await assert.rejects(admit(kv, { day: "d", invite: "z", perInvite: 2, budgetCents: 200, reserveCents: 75 }), /store_unconfirmed/);
});
