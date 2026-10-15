// website/netlify/portrait/run.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { memoryStore, createJob, readJob, readStages, readTeachings, finishJob } from "./store.ts";
import { runJob } from "./run.ts";
import { interpret, costCents, createWriter } from "./claude.ts";

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
const ok = (data, extra = {}) => () => ({ ok: true, data, usage, stopReason: "end_turn", model: "claude-opus-5-5", refusalCategory: null, ...extra });

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

test("a finished portrait keeps only the teachings it cited, and the job no longer holds the packet", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const { write } = scripted([ok(A), ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  assert.equal((await readJob(kv, "j")).packet, null);
  const kept = await readTeachings(kv, "j");
  assert.deepEqual(Object.keys(kept), ["natal-sun-sign"]);
  assert.equal(kept["natal-sun-sign"].label, "Sun · Pisces");
  assert.match(kept["natal-sun-sign"].text, /Pisces|porous/);
  assert.deepEqual(kept["natal-sun-sign"].sources, [{ title: "A", url: "https://example.com" }]);
});

test("a failed portrait lets the packet go as well, keeping what its landed stages cited", async () => {
  const kv = memoryStore();
  await createJob(kv, job);
  const bad = { ...B, chapters: { ...B.chapters, mind: { ...chapter(), paragraphs: ["short"] } } };
  const { write } = scripted([ok(A), ok(bad), ok(C), ok(bad)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "failed");
  assert.equal((await readJob(kv, "j")).packet, null);
  assert.deepEqual(Object.keys(await readTeachings(kv, "j")), ["natal-sun-sign"]);
  const none = memoryStore();
  await createJob(none, job);
  assert.equal(await runJob({ kv: none, id: "j", write: scripted([() => ({ ok: false, code: "provider", usage }), () => ({ ok: false, code: "provider", usage })]).write, bank }), "failed");
  assert.equal((await readJob(none, "j")).packet, null);
  assert.deepEqual(await readTeachings(none, "j"), {});
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

const quiet = (t) => {
  const lines = [];
  t.mock.method(console, "warn", (line) => lines.push(line));
  return lines;
};

test("a throw while preparing the run ends the job failed and settled, never running", async (t) => {
  const lines = quiet(t);
  const kv = memoryStore();
  await createJob(kv, job);
  const { write, calls } = scripted([]);
  assert.equal(await runJob({ kv, id: "j", write, bank: { ...bank, sources: {} } }), "failed");
  assert.equal(calls.length, 0);
  const finished = await readJob(kv, "j");
  assert.equal(finished.status, "failed");
  assert.equal(finished.error, "internal");
  assert.equal(await kv.get("quota/d/cents", { type: "json" }), 0);
  assert.ok(lines.some((line) => line.includes("portrait_run_error") && line.includes("unknown_source:astrodienst-intro")));
});

test("when one parallel stage throws, the job still waits for the other and counts both costs", async (t) => {
  const lines = quiet(t);
  const base = memoryStore();
  const kv = { ...base, async setJSON(key, value, options) { if (key === "job/j/b") throw new Error("blob_down"); return base.setJSON(key, value, options); } };
  await createJob(kv, job);
  const slowC = async () => { await new Promise((resolve) => setTimeout(resolve, 25)); return { ok: true, data: C, usage }; };
  const { write } = scripted([ok(A), ok(B), slowC]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "failed");
  const stored = await readStages(kv, "j");
  assert.ok(stored.a && stored.c && !stored.b);
  const finished = await readJob(kv, "j");
  assert.equal(finished.status, "failed");
  assert.equal(finished.error, "internal");
  assert.equal(finished.costCents, 3 * costCents(usage));
  assert.equal(await kv.get("quota/d/cents", { type: "json" }), 0);
  assert.ok(lines.some((line) => line.includes("portrait_run_error") && line.includes("blob_down")));
});

test("the invalid-stage log keeps error codes but not quoted snippets; the repair prompt keeps them whole", async (t) => {
  const lines = quiet(t);
  const kv = memoryStore();
  await createJob(kv, job);
  const unsafe = { ...A, overview: { ...p(100), text: `diagnosed ${words(100)}` } };
  const { write, calls } = scripted([ok(unsafe), ok(A), ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  assert.match(calls[1].user, /unsafe:overview:"diagnos/);
  const logged = lines.find((line) => line.includes("portrait_stage_invalid"));
  assert.ok(logged.includes("unsafe:overview"));
  assert.ok(!logged.includes("diagnos"));
});

test("createWriter sends one structured, cached, fallback-enabled request and interprets the reply", async () => {
  const sent = [];
  const reply = { stop_reason: "end_turn", content: [{ type: "text", text: "{\"a\":1}" }], usage: { input_tokens: 7, output_tokens: 3, cache_read_input_tokens: 2, cache_creation_input_tokens: 1 } };
  const write = createWriter({ apiKey: "test-key", model: "claude-opus-5-5", effort: "high", send: async (params) => { sent.push(params); return reply; } });
  const schema = { type: "object", properties: {} };
  const result = await write({ system: "SYS", user: "USER", schema, maxTokens: 1234 });
  assert.deepEqual(result, { ok: true, data: { a: 1 }, usage: { input: 7, output: 3, cacheRead: 2, cacheWrite: 1 }, stopReason: "end_turn", model: null, refusalCategory: null });
  assert.equal(sent.length, 1);
  const params = sent[0];
  assert.equal(params.model, "claude-opus-5-5");
  assert.equal(params.max_tokens, 1234);
  assert.deepEqual(params.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(params.fallbacks, "default");
  assert.deepEqual(params.thinking, { type: "adaptive" });
  assert.equal(params.output_config.effort, "high");
  assert.deepEqual(params.output_config.format, { type: "json_schema", schema });
  assert.deepEqual(params.system, [{ type: "text", text: "SYS", cache_control: { type: "ephemeral" } }]);
  assert.deepEqual(params.messages, [{ role: "user", content: "USER" }]);
  assert.ok(!("tool_choice" in params));
});

test("createWriter turns a provider error into a code, logging only event, status and type", async (t) => {
  const lines = quiet(t);
  const failure = Object.assign(new Error("prompt text and secret detail"), { status: 400, type: "invalid_request_error" });
  const write = createWriter({ apiKey: "test-key", model: "m", effort: "high", send: async () => { throw failure; } });
  const result = await write({ system: "s", user: "u", schema: {}, maxTokens: 10 });
  assert.deepEqual(result, { ok: false, code: "provider", usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, stopReason: null, model: null, refusalCategory: null });
  assert.equal(lines.length, 1);
  assert.deepEqual(Object.keys(JSON.parse(lines[0])).sort(), ["event", "status", "type"]);
  assert.equal(JSON.parse(lines[0]).type, "invalid_request_error");
  assert.equal(JSON.parse(lines[0]).status, 400);
  assert.ok(!lines[0].includes("secret detail"));
});

test("interpret keeps only the text written after the last fallback block", () => {
  const u = { input_tokens: 10, output_tokens: 5 };
  const content = [{ type: "text", text: "{partial" }, { type: "fallback", model: "other" }, { type: "text", text: "{\"a\":1}" }];
  assert.deepEqual(interpret({ stop_reason: "end_turn", content, usage: u }).data, { a: 1 });
  const twice = [{ type: "text", text: "{a" }, { type: "fallback" }, { type: "text", text: "{b" }, { type: "fallback" }, { type: "text", text: "{\"c\":1}" }];
  assert.deepEqual(interpret({ stop_reason: "end_turn", content: twice, usage: u }).data, { c: 1 });
  const split = [{ type: "text", text: "{\"d\":" }, { type: "text", text: "1}" }];
  assert.deepEqual(interpret({ stop_reason: "end_turn", content: split, usage: u }).data, { d: 1 });
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

test("cost follows the model that answered; an unknown model is priced as Opus", () => {
  const one = (field, model) => costCents({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, [field]: 1_000_000 }, model);
  // $ per million tokens → cents for one million
  assert.deepEqual(["input", "output", "cacheRead", "cacheWrite"].map((f) => one(f, "claude-opus-5-5")), [400, 2000, 20, 500]);
  assert.deepEqual(["input", "output", "cacheRead", "cacheWrite"].map((f) => one(f, "claude-sonnet-5-5")), [200, 1000, 20, 250]);
  assert.equal(one("input", "claude-sonnet-5-5-20260701"), 200);
  for (const unknown of [undefined, null, "", "claude-mystery-9"]) assert.equal(one("input", unknown), 400, String(unknown));
});

test("with a server-side fallback each iteration is priced by its own model, not the top-level total", () => {
  const tokens = (model) => ({ input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0, ...(model ? { model } : {}) });
  const usage = { input: 3_000_000, output: 999, cacheRead: 0, cacheWrite: 0, iterations: [tokens("claude-opus-5-5"), tokens("claude-sonnet-5-5"), tokens()] };
  assert.equal(costCents(usage, "claude-sonnet-5-5"), 400 + 200 + 200); // an iteration with no model takes the message's
  assert.equal(costCents(usage), 400 + 200 + 400);
  assert.equal(costCents({ ...usage, iterations: [] }, "claude-sonnet-5-5"), Math.ceil((3_000_000 * 2 + 999 * 10) / 10_000));
});

test("interpret reports the stop reason, the model and a refusal's category, and keeps per-iteration usage", () => {
  const u = { input_tokens: 10, output_tokens: 5 };
  const ok = interpret({ stop_reason: "end_turn", model: "claude-sonnet-5-5", content: [{ type: "text", text: "{}" }], usage: u });
  assert.equal(ok.stopReason, "end_turn");
  assert.equal(ok.model, "claude-sonnet-5-5");
  assert.equal(ok.refusalCategory, null);
  const refused = interpret({ stop_reason: "refusal", model: "claude-opus-5-5", stop_details: { type: "refusal", category: "cyber" }, content: [], usage: u });
  assert.deepEqual([refused.code, refused.stopReason, refused.model, refused.refusalCategory], ["refusal", "refusal", "claude-opus-5-5", "cyber"]);
  const cut = interpret({ stop_reason: "max_tokens", model: "m", content: [], usage: u });
  assert.deepEqual([cut.code, cut.stopReason, cut.refusalCategory], ["truncated", "max_tokens", null]);
  const bare = interpret({ content: [{ type: "text", text: "{}" }] });
  assert.deepEqual([bare.stopReason, bare.model, bare.refusalCategory], [null, null, null]);
  const iterated = interpret({ stop_reason: "end_turn", model: "claude-sonnet-5-5", content: [{ type: "text", text: "{}" }], usage: { ...u, iterations: [{ type: "message", input_tokens: 4, output_tokens: 1, cache_read_input_tokens: 2, cache_creation_input_tokens: 3, model: "claude-opus-5-5" }, { type: "message", input_tokens: 6, output_tokens: 4 }] } });
  assert.deepEqual(iterated.usage.iterations, [{ input: 4, output: 1, cacheRead: 2, cacheWrite: 3, model: "claude-opus-5-5" }, { input: 6, output: 4, cacheRead: 0, cacheWrite: 0 }]);
  assert.equal("iterations" in interpret({ stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: { ...u, iterations: [] } }).usage, false);
});

const stageLogs = (lines) => lines.map((line) => JSON.parse(line)).filter((entry) => entry.event === "portrait_stage");
const talk = (t) => {
  const lines = [];
  t.mock.method(console, "log", (line) => lines.push(line));
  return lines;
};

test("every stage attempt logs one line with timing, stop reason, model, usage, cost and outcome, and no text", async (t) => {
  const lines = talk(t);
  quiet(t);
  const kv = memoryStore();
  await createJob(kv, job);
  const broken = { ...A, title: "" };
  const slow = (data) => async () => { await new Promise((resolve) => setTimeout(resolve, 20)); return { ok: true, data, usage, stopReason: "end_turn", model: "claude-opus-5-5", refusalCategory: null }; };
  const { write } = scripted([ok(broken), slow(A), ok(B), ok(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  const logs = stageLogs(lines);
  assert.equal(logs.length, 4);
  for (const entry of logs) assert.deepEqual(Object.keys(entry).sort(), ["attempt", "cents", "event", "model", "ms", "ok", "refusalCategory", "stage", "stopReason", "usage"]);
  const a = logs.filter((entry) => entry.stage === "a");
  assert.deepEqual(a.map((entry) => [entry.attempt, entry.ok]), [[0, false], [1, true]]); // the first reply failed the checks
  assert.ok(a[1].ms >= 15, `ms was ${a[1].ms}`);
  assert.equal(a[0].stopReason, "end_turn");
  assert.equal(a[0].model, "claude-opus-5-5");
  assert.equal(a[0].cents, costCents(usage, "claude-opus-5-5"));
  assert.deepEqual(a[0].usage, usage);
  assert.equal(a[0].refusalCategory, null);
  assert.deepEqual(logs.filter((entry) => entry.stage !== "a").map((entry) => [entry.stage, entry.attempt, entry.ok]).sort(), [["b", 0, true], ["c", 0, true]]);
  for (const line of lines) for (const text of ["The Open Door", "word word", "Pisces", "Chapter"]) assert.ok(!line.includes(text), text);
});

test("the log and the job's cost both price by the model that answered", async (t) => {
  const lines = talk(t);
  quiet(t);
  const kv = memoryStore();
  await createJob(kv, job);
  const half = { input: 500_000, output: 0, cacheRead: 0, cacheWrite: 0 };
  const sonnet = (data) => () => ({ ok: true, data, usage: half, stopReason: "end_turn", model: "claude-sonnet-5-5", refusalCategory: null });
  const { write } = scripted([sonnet(A), sonnet(B), ok(C, { usage: half })]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  assert.deepEqual(stageLogs(lines).map((entry) => [entry.stage, entry.cents]).sort(), [["a", 100], ["b", 100], ["c", 200]]);
  assert.equal((await readJob(kv, "j")).costCents, 400);
});

test("a refusal is logged with its category and ends the job without a retry", async (t) => {
  const lines = talk(t);
  quiet(t);
  const kv = memoryStore();
  await createJob(kv, job);
  const refusal = () => ({ ok: false, code: "refusal", usage, stopReason: "refusal", model: "claude-opus-5-5", refusalCategory: "cyber" });
  const { write, calls } = scripted([refusal]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "failed");
  assert.equal(calls.length, 1);
  const [entry] = stageLogs(lines);
  assert.deepEqual([entry.stage, entry.attempt, entry.ok, entry.stopReason, entry.refusalCategory], ["a", 0, false, "refusal", "cyber"]);
  assert.equal((await readJob(kv, "j")).error, "stage_a_refusal");
});

test("a writer that gives no metadata still logs null, not a missing key", async (t) => {
  const lines = talk(t);
  quiet(t);
  const kv = memoryStore();
  await createJob(kv, job);
  const bare = (data) => () => ({ ok: true, data, usage });
  const { write } = scripted([bare(A), bare(B), bare(C)]);
  assert.equal(await runJob({ kv, id: "j", write, bank }), "done");
  for (const entry of stageLogs(lines)) assert.deepEqual([entry.stopReason, entry.model, entry.refusalCategory], [null, null, null]);
});

test("createWriter hands the gateway address to the Anthropic client, and nothing when there is none", async () => {
  const made = [];
  const reply = { stop_reason: "end_turn", content: [{ type: "text", text: "{}" }], usage: {} };
  const client = { beta: { messages: { stream: (params) => ({ finalMessage: async () => ({ ...reply, echoed: params.model }) }) } } };
  const factory = (options) => { made.push(options); return client; };
  const via = createWriter({ apiKey: "gateway-key", baseURL: "https://gateway.example/anthropic", model: "m", effort: "high", makeClient: factory });
  assert.equal((await via({ system: "s", user: "u", schema: {}, maxTokens: 10 })).ok, true);
  assert.equal(made[0].baseURL, "https://gateway.example/anthropic");
  assert.equal(made[0].apiKey, "gateway-key");
  assert.equal(made[0].timeout, 240_000);
  createWriter({ apiKey: "k", model: "m", effort: "high", makeClient: factory });
  assert.equal(made[1].baseURL, undefined);
});

test("the real Anthropic client takes the gateway address, and falls back to its own default without one", async () => {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  assert.equal(new Anthropic({ apiKey: "k", baseURL: "https://gateway.example/anthropic" }).baseURL, "https://gateway.example/anthropic");
  assert.equal(new Anthropic({ apiKey: "k", baseURL: undefined }).baseURL, new Anthropic({ apiKey: "k" }).baseURL);
});
