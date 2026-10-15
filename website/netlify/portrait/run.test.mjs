// website/netlify/portrait/run.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { memoryStore, createJob, readJob, readStages, finishJob } from "./store.ts";
import { runJob } from "./run.ts";
import { interpret, costCents } from "./claude.ts";

const packet = {
  v: 1, locale: "en", timeKnown: true,
  factors: [
    { id: "natal-sun", kind: "planet", body: "sun", sign: "pisces", house: 1, retrograde: false, alternatives: null },
  ],
};
const bank = { cards: {}, numbers: {}, roleNotes: {}, personal: {}, signs: { pisces: { name: { en: "Pisces", uk: "Риби" }, style: { en: "A porous, imaginative style that takes in the mood of a room.", uk: "x" }, gift: { en: "The gift is compassion that notices what others miss.", uk: "x" } } }, planets: { sun: { name: { en: "Sun", uk: "Сонце" }, function: { en: "The Sun names the direction you grow toward.", uk: "x" } } }, houses: { 1: { name: { en: "First house", uk: "x" }, meaning: { en: "The first house is how you enter a room and begin.", uk: "x" } } }, aspects: {}, pairs: {}, sources: { "astrodienst-intro": { title: "A", url: "https://example.com" } } };
const words = (n) => Array.from({ length: n }, () => "word").join(" ") + ".";
const p = (n) => ({ text: words(n), refs: ["natal-sun"], teachings: ["natal-sun-sign"] });
const chapter = () => ({ title: "A Chapter", lede: words(8), paragraphs: [words(50), words(50)], practice: words(10), refs: ["natal-sun"], teachings: [] });
const A = { title: "The Open Door", epigraph: words(6), overview: p(100), facets: Object.fromEntries(["temperament", "inner", "gifts", "bonds", "direction"].map((k) => [k, { heading: "Heading", ...p(60) }])) };
const B = { chapters: { mind: chapter(), heart: chapter(), work: chapter() } };
const C = { chapters: { shadow: chapter(), love: chapter(), becoming: chapter() }, keep: [words(5), words(5), words(5)] };
const usage = { input: 1000, output: 1000, cacheRead: 0, cacheWrite: 0 };
const job = { id: "j", status: "queued", createdAt: 1, packet, invite: "i", day: "d", reserveCents: 75, costCents: 0, error: null };

const scripted = (answers) => {
  const calls = [];
  const write = async (call) => { calls.push(call); return answers.shift()(call); };
  return { write, calls };
};
const ok = (data) => () => ({ ok: true, data, usage });

test("stages run A then B and C, and each lands as soon as it passes", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const { write, calls } = scripted([ok(A), ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  assert.deepEqual(Object.keys(await readStages(kv, "j")).sort(), ["a", "b", "c"]);
  assert.match(calls[1].user, /<opening>/);
  const done = await readJob(kv, "j");
  assert.equal(done.status, "done");
  assert.equal(done.costCents, 3 * costCents(usage));
});

test("a failed check gets one repair attempt with the errors attached", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const broken = { ...A, title: "" };
  const { write, calls } = scripted([ok(broken), ok(A), ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  assert.match(calls[1].user, /length:title/);
});

test("a stage that fails twice fails the job visibly, keeping what landed", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const bad = { ...B, chapters: { ...B.chapters, mind: { ...chapter(), paragraphs: ["short"] } } };
  const { write } = scripted([ok(A), ok(bad), ok(C), ok(bad)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "failed");
  const stored = await readStages(kv, "j");
  assert.ok(stored.a && stored.c && !stored.b);
  assert.equal((await readJob(kv, "j")).error, "stage_b_invalid");
});

test("a job is only run once", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const { write } = scripted([ok(A), ok(B), ok(C)]);
  await runJob({ kv, id: "j", write, bank });
  assert.equal(await runJob({ kv, id: "j", write, bank }), "skipped");
});

test("a reading that finished stays done when the cost cannot be settled", async (t) => {
  const warnings = [];
  t.mock.method(console, "warn", (line) => warnings.push(line));
  const base = memoryStore();
  const kv = {
    ...base,
    async getWithMetadata(key, options) {
      if (key.startsWith("quota/")) return { data: 100, etag: '"quota"' };
      return base.getWithMetadata(key, options);
    },
    async setJSON(key, value, options) {
      if (key.startsWith("quota/")) return { modified: false };
      return base.setJSON(key, value, options);
    },
  };
  await createJob(kv, job);
  const { write } = scripted([ok(A), ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  assert.deepEqual(Object.keys(await readStages(kv, "j")).sort(), ["a", "b", "c"]);
  const done = await readJob(kv, "j");
  assert.equal(done.status, "done");
  assert.equal(done.costCents, 3 * costCents(usage));
  assert.ok(warnings.some((line) => line === JSON.stringify({ event: "portrait_settle_failed", code: "counter_contended" })));
});

test("a job finished elsewhere is skipped without settling", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const finishElsewhere = async () => {
    await finishJob(kv, "j", { status: "failed", costCents: 0, error: "elsewhere" });
    return { ok: true, data: A, usage };
  };
  const { write } = scripted([finishElsewhere, ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "skipped");
  assert.equal((await readJob(kv, "j")).error, "elsewhere");
  assert.equal(await kv.get("quota/d/cents", { type: "json" }), null);
});

test("interpret reads refusals, truncation and JSON text", () => {
  const u = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  assert.equal(interpret({ stop_reason: "refusal", content: [], usage: u }).code, "refusal");
  assert.equal(interpret({ stop_reason: "max_tokens", content: [], usage: u }).code, "truncated");
  assert.deepEqual(interpret({ stop_reason: "end_turn", content: [{ type: "thinking", thinking: "" }, { type: "text", text: "{\"a\":1}" }], usage: u }).data, { a: 1 });
  assert.equal(interpret({ stop_reason: "end_turn", content: [{ type: "text", text: "nope" }], usage: u }).code, "unparseable");
});

test("cost uses Opus 5.5 prices", () => {
  // $4/M input, $20/M output, $0.20/M cache read, $5/M cache write
  assert.equal(costCents({ input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 }), 400);
  assert.equal(costCents({ input: 0, output: 100_000, cacheRead: 0, cacheWrite: 0 }), 200);
});
