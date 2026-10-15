// website/scripts/portrait-eval.test.mjs
// The pure parts of the eval harness, plus a dry end-to-end run. Run by hand: node --test scripts/portrait-eval.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePacket } from "../src/lib/portrait/packet.js";
import { stageRequest } from "../netlify/portrait/prompt.ts";
import * as ev from "./portrait-eval.mjs";

// runJob logs one JSON line per call; the tests read the records instead.
ev.quietLogs();

const profiles = await ev.loadProfiles();
const places = await ev.loadPlaces();
const bank = await ev.loadBank();
const byId = (id) => profiles.find((p) => p.id === id);
const M1_DIR = new URL("../../docs/superpowers/evidence/2026-10-15-m1/", import.meta.url);

/** A full dry reading for a profile (no quirks: it needs no repair and keeps no residue). */
async function dryReading(id, { quirks = false } = {}) {
  const profile = byId(id);
  const packet = ev.packetFor(profile, places);
  const write = ev.fakeWriter({ locale: profile.locale, quirks, delayMs: 0 });
  return { profile, packet, record: await ev.runProfile({ profile, packet, write, bank, variant: "t", model: "dry-run", effort: "medium", dry: true }) };
}

test("every profile builds a valid packet from a real place, as the page does", () => {
  assert.equal(profiles.length, 8);
  assert.equal(new Set(profiles.map((p) => p.id)).size, 8);
  for (const profile of profiles) {
    const packet = ev.packetFor(profile, places);
    assert.equal(validatePacket(packet).ok, true, profile.id);
    assert.equal(packet.locale, profile.locale, profile.id);
    assert.equal(packet.timeKnown, profile.time !== null, profile.id);
    const planets = packet.factors.filter((f) => f.kind === "planet");
    // The page sends a name's numbers only when a Latin spelling exists; every profile has one.
    assert.ok(packet.factors.some((f) => f.id === "num-soulUrge"), profile.id);
    if (profile.time === null) assert.ok(planets.some((f) => f.alternatives), `${profile.id}: a personal planet changes sign`);
    else assert.ok(planets.every((f) => f.alternatives === null) && packet.factors.some((f) => f.id === "natal-asc"), profile.id);
  }
});

test("the profile set covers the planned mix, including the two Milestone 1 births", () => {
  const mix = (p) => `${p.locale}-${p.time ? "timed" : "unknown"}`;
  const counts = Object.groupBy(profiles, mix);
  assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v.length])), { "en-timed": 3, "en-unknown": 1, "uk-timed": 2, "uk-unknown": 2 });
  const baselines = profiles.filter((p) => p.baselineFile);
  assert.deepEqual(baselines.map((p) => p.id), ["m1-en-olena", "m1-uk-olena"]);
  for (const p of baselines) assert.ok(existsSync(new URL(p.baselineFile, M1_DIR)), p.baselineFile);
  for (const p of profiles.filter((x) => x.locale === "uk")) assert.ok(/[а-яіїєґ]/i.test(p.name) && /^[A-Za-z .'-]+$/.test(p.latin), p.id);
  assert.equal(new Set(profiles.map((p) => p.place)).size >= 6, true, "varied birthplaces");
});

test("selectProfiles takes all, a list in the given order, and rejects unknown ids", () => {
  assert.equal(ev.selectProfiles(profiles, "all").length, 8);
  assert.deepEqual(ev.selectProfiles(profiles, "uk-timed-taras, en-timed-tom").map((p) => p.id), ["uk-timed-taras", "en-timed-tom"]);
  assert.throws(() => ev.selectProfiles(profiles, "en-timed-tom,nobody"), /unknown profile.*nobody/);
});

test("lint counts group the style codes by class and ignore everything else", () => {
  const counts = ev.lintCounts(["hedge-lead:overview", "hedge-lead:mind:lede", "hedges:gifts:2", 'phrase:love:"journey"', 'gender:inner:"самій собі"', 'repeat:work:"a b c d e f"', "length:title", "refs:overview:x", 'unsafe:mind:"destined"']);
  assert.deepEqual(counts, { "hedge-lead": 2, hedges: 1, phrase: 1, gender: 1, repeat: 1 });
  assert.deepEqual(ev.lintCounts([]), { "hedge-lead": 0, hedges: 0, phrase: 0, gender: 0, repeat: 0 });
});

test("word counts cover what the reader sees and leave out the hidden outline", () => {
  assert.equal(ev.countWords("Don't stop — it's 2 o'clock, well-known."), 6);
  const stages = {
    a: { title: "One Two", epigraph: "Three four five.", outline: { mind: "hidden hidden hidden hidden" }, overview: { text: "six seven eight nine", refs: ["x"], teachings: [] }, facets: { temperament: { heading: "Ten", text: "eleven twelve", refs: [], teachings: [] } } },
    b: { chapters: { mind: { title: "Title here", lede: "Lede words.", paragraphs: ["one two three", "four five"], practice: "Do this.", refs: [], teachings: [] } } },
    c: { chapters: {}, keep: ["keep one", "keep two"] },
  };
  assert.deepEqual(ev.wordCounts(stages), { a: 2 + 3 + 4 + 1 + 2, b: 2 + 2 + 3 + 2 + 2, c: 4, total: 12 + 11 + 4 });
  assert.deepEqual(ev.wordCounts({}), { a: 0, b: 0, c: 0, total: 0 });
});

test("per-stage ms, attempts and tokens come from the recorded calls", () => {
  const usage = (n) => ({ input: n, output: n * 2, cacheRead: 1, cacheWrite: 0 });
  const calls = [
    { stage: "a", attempt: 0, ms: 1000, usage: usage(10), cents: 3 },
    { stage: "b", attempt: 0, ms: 400, usage: usage(10), cents: 2 },
    { stage: "c", attempt: 0, ms: 700, usage: usage(10), cents: 2 },
    { stage: "b", attempt: 1, ms: 500, usage: usage(10), cents: 2 },
  ];
  const s = ev.summariseCalls(calls);
  assert.deepEqual(s.ms, { a: 1000, b: 900, c: 700 });
  assert.deepEqual(s.attempts, { a: 1, b: 2, c: 1 });
  assert.deepEqual(s.tokens, { input: 40, output: 80, cacheRead: 4, cacheWrite: 0 });
  assert.equal(s.cents, 9);
  assert.deepEqual(ev.summariseCalls([calls[0]]).ms, { a: 1000, b: null, c: null });
});

test("the repair prompt's error list is read back exactly", () => {
  const profile = byId("en-timed-tom");
  const packet = ev.packetFor(profile, places);
  const errors = ['hedge-lead:mind:lede', 'phrase:love:"journey"'];
  assert.deepEqual(ev.repairErrors(stageRequest("b", packet, [], { a: { title: "t" } }, errors).task), errors);
  assert.deepEqual(ev.repairErrors(stageRequest("a", packet, [], {}).task), []);
});

test("a clean dry reading runs through runJob with timings, cost, attempts and zero lint", async () => {
  const { record } = await dryReading("en-timed-tom");
  assert.equal(record.status, "done");
  assert.equal(record.error, null);
  assert.deepEqual(record.attempts, { a: 1, b: 1, c: 1 });
  assert.equal(record.calls.length, 3);
  assert.ok(record.ms.total >= 0 && ["a", "b", "c"].every((k) => record.ms[k] >= 0));
  assert.ok(record.costCents > 0 && record.costCents === record.calls.reduce((n, c) => n + c.cents, 0));
  assert.deepEqual(record.lint, { "hedge-lead": 0, hedges: 0, phrase: 0, gender: 0, repeat: 0 });
  assert.deepEqual(record.residue, { a: [], b: [], c: [] });
  assert.deepEqual(record.repairs, {});
  assert.ok(record.words.total > 1000 && record.words.total === record.words.a + record.words.b + record.words.c);
  assert.ok(record.teachingsCited > 0);
  assert.equal(record.dry, true);
});

test("measureReading counts each kind of voice problem left in stored stages", async () => {
  for (const id of ["en-timed-tom", "uk-timed-taras"]) {
    const { profile, packet, record } = await dryReading(id);
    const stages = structuredClone(record.stages);
    const clean = ev.measureReading(stages, packet, bank);
    assert.deepEqual(clean.lint, { "hedge-lead": 0, hedges: 0, phrase: 0, gender: 0, repeat: 0 }, id);
    const uk = profile.locale === "uk";
    stages.a.overview.text = `${uk ? "Мабуть," : "Probably"} ${stages.a.overview.text}`;
    stages.b.chapters.heart.paragraphs[1] = `${uk ? "Ви сама" : "A journey of"} ${stages.b.chapters.heart.paragraphs[1]}`;
    // Six words of the opening, copied into a chapter, are a repeat.
    stages.c.chapters.love.paragraphs[0] += ` ${stages.a.facets.gifts.text.split(" ").slice(2, 9).join(" ")}`;
    const lint = ev.measureReading(stages, packet, bank).lint;
    assert.equal(lint["hedge-lead"], 1, id);
    assert.equal(lint.repeat, 1, id);
    assert.equal(uk ? lint.gender : lint.phrase, 1, id);
  }
});

test("with quirks some dry readings need a repair and some keep a residue, and all still finish", async () => {
  const records = [];
  for (const profile of profiles) records.push((await dryReading(profile.id, { quirks: true })).record);
  assert.ok(records.every((r) => r.status === "done"));
  assert.ok(records.some((r) => Object.values(r.attempts).some((n) => n > 1)));
  const left = records.filter((r) => r.lint["hedge-lead"] > 0);
  assert.ok(left.length > 0);
  for (const r of left) {
    assert.equal(Object.values(r.residue).flat().length, r.lint["hedge-lead"]);
    assert.ok(Object.values(r.repairs).flat().some((code) => code.startsWith("hedge-lead:")), "the repair prompt named the hedge");
  }
});

test("a baseline import keeps the live reading and measures it with today's lint", async () => {
  const profile = byId("m1-en-olena");
  const sourceFile = new URL(profile.baselineFile, M1_DIR);
  const source = JSON.parse(await readFile(sourceFile, "utf8"));
  const record = ev.baselineRecord({ profile, source, sourceFile: "m1/en", packet: ev.packetFor(profile, places), bank, variant: "m1-baseline" });
  assert.equal(record.profile, "m1-en-olena");
  assert.equal(record.baseline, true);
  assert.equal(record.status, "done");
  assert.deepEqual(record.stages, source.stages);
  assert.equal(record.ms, null);
  assert.equal(record.costCents, null);
  assert.equal(record.attempts, null);
  assert.ok(record.lint["hedge-lead"] > 0, "the M1 reading hedges its first sentences");
  assert.ok(record.words.total > 2000);
  assert.equal(record.teachingsCited, Object.keys(source.teachings).length);
});

/* ───────────── judge ───────────── */

const FIRST = "secret-variant-alpha", SECOND = "secret-variant-beta";

test("the judge prompt hides the variant names and the machinery of the reading", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("en-timed-priya");
  const facts = ev.describeFacts(x.packet, bank);
  const pair = ev.pairReadings({ id: "en-timed-tom", locale: "en", seed: 3, facts, firstName: FIRST, secondName: SECOND, firstStages: x.record.stages, secondStages: y.record.stages });
  const prompt = JSON.stringify(pair.request);
  assert.ok(!prompt.includes("alpha") && !prompt.includes("beta") && !prompt.includes("secret"), "no variant name");
  assert.deepEqual([pair.order.A, pair.order.B].sort(), [FIRST, SECOND]);
  for (const outline of [x, y].map((r) => r.record.stages.a.outline.mind)) assert.ok(!pair.request.task.includes(outline), "hidden outline stays out");
  assert.ok(!/natal-|num-|arkan-|card-|\brefs\b|teachings/.test(pair.request.task), "no factor or teaching ids");
  assert.ok(pair.request.task.includes(x.record.stages.a.title) && pair.request.task.includes(y.record.stages.a.title), "both readings are present");
  assert.match(pair.request.shared, /Sun in .*house \d+/);
  assert.match(pair.request.shared, /Arkan position 4: /);
  // The names only decide the mapping, never the request.
  const renamed = ev.pairReadings({ id: "en-timed-tom", locale: "en", seed: 3, facts, firstName: "x", secondName: "y", firstStages: x.record.stages, secondStages: y.record.stages });
  assert.deepEqual(renamed.request, pair.request);
});

test("the A/B order is seeded per profile, reproducible, and varies", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("en-timed-priya");
  const pair = (seed, id = "p") => ev.pairReadings({ id, locale: "en", seed, facts: "f", firstName: FIRST, secondName: SECOND, firstStages: x.record.stages, secondStages: y.record.stages });
  const orders = new Set(Array.from({ length: 40 }, (_, seed) => pair(seed).order.A));
  assert.deepEqual([...orders].sort(), [FIRST, SECOND], "both orders occur across seeds");
  assert.deepEqual(pair(5), pair(5));
  assert.notEqual(new Set(profiles.map((p) => pair(5, p.id).order.A)).size, 1, "profiles are shuffled independently");
  // Reading A in the prompt is whichever variant the order says.
  for (let seed = 0; seed < 6; seed++) {
    const p = pair(seed);
    const title = (p.order.A === FIRST ? x : y).record.stages.a.title;
    assert.ok(p.request.task.startsWith(`<reading_a>\n# ${title}`), `seed ${seed}`);
  }
});

test("the judge schema asks for Ukrainian naturalness only for Ukrainian readings", () => {
  const keys = (locale) => Object.keys(ev.judgeSchema(locale).properties.scores.properties.A.properties);
  assert.deepEqual(keys("en"), ["recognisability", "specificity", "distinctness", "warmth", "plainLanguage"]);
  assert.deepEqual(keys("uk"), [...keys("en"), "ukrainianNaturalness"]);
  assert.ok(ev.judgeSystem("uk").includes("ukrainianNaturalness") && !ev.judgeSystem("en").includes("ukrainianNaturalness"));
  assert.deepEqual(ev.judgeSchema("en").required, ["scores", "reasons", "winner"]);
});

const scores = (n, uk = false) => ({ recognisability: n, specificity: n, distinctness: n, warmth: n, plainLanguage: n, ...(uk ? { ukrainianNaturalness: n } : {}) });

test("verdicts are checked against the rubric and long reasons are clipped", () => {
  const good = { winner: "A", scores: { A: scores(4), B: scores(2) }, reasons: "x".repeat(900) };
  const checked = ev.checkVerdict(good, "en");
  assert.equal(checked.ok, true);
  assert.equal(checked.verdict.reasons.length, 600);
  assert.equal(checked.verdict.scores.A.ukrainianNaturalness, null);
  assert.equal(ev.checkVerdict({ ...good, winner: "C" }, "en").ok, false);
  assert.equal(ev.checkVerdict({ ...good, scores: { A: scores(6), B: scores(2) } }, "en").ok, false);
  assert.equal(ev.checkVerdict(good, "uk").ok, false, "Ukrainian readings need the extra score");
  assert.equal(ev.checkVerdict({ ...good, scores: { A: scores(4, true), B: scores(2, true) } }, "uk").ok, true);
});

test("a verdict maps back to the variant that was shown as Reading A or B, and one bad answer is retried", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("en-timed-priya");
  const answers = [{ ok: false, code: "provider", usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }, { ok: true, data: { winner: "B", scores: { A: scores(2), B: scores(5) }, reasons: "Reading B is concrete." }, usage: { input: 1000, output: 1000, cacheRead: 0, cacheWrite: 0 }, model: "claude-opus-5-5" }];
  const asked = [];
  const write = async (call) => { asked.push(call); return answers.shift(); };
  const result = await ev.judgeProfile({ write, id: "en-timed-tom", locale: "en", seed: 2, facts: "f", first: { name: FIRST, stages: x.record.stages }, second: { name: SECOND, stages: y.record.stages } });
  assert.equal(asked.length, 2);
  assert.equal(result.verdict.winner, "B");
  assert.equal(result.winnerVariant, result.order.B);
  assert.ok(result.costCents > 0);
  const failing = await ev.judgeProfile({ write: async () => ({ ok: true, data: { winner: "Z" }, usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }), id: "p", locale: "en", seed: 2, facts: "f", first: { name: FIRST, stages: x.record.stages }, second: { name: SECOND, stages: y.record.stages } });
  assert.equal(failing.verdict, null);
  assert.match(failing.error, /judge_invalid:winner/);
});

test("the summary table maps the judge's A and B back to variant names", () => {
  const result = (profile, order, winner, a, b, reasons) => ({
    profile, locale: "en", order, verdict: { winner, scores: { A: { ...scores(a), ukrainianNaturalness: null }, B: { ...scores(b), ukrainianNaturalness: null } }, reasons },
    winnerVariant: winner === "tie" ? "tie" : order[winner], costCents: 1, ms: 1, error: null,
  });
  const results = [
    result("p1", { A: "new", B: "old" }, "A", 5, 2, "Reading A is concrete; Reading B hedges."),
    result("p2", { A: "old", B: "new" }, "A", 4, 3, "Reading A is warmer than Reading B."),
    result("p3", { A: "old", B: "new" }, "B", 1, 4, "Reading B wins."),
    result("p4", { A: "new", B: "old" }, "tie", 3, 3, "Level."),
  ];
  const metrics = Object.fromEntries(["old", "new"].map((v) => [v, ev.variantMetrics([])]));
  const md = ev.summarize({ variants: ["old", "new"], results, skipped: [{ profile: "p5", reason: "only in old" }], metrics, meta: { model: "claude-opus-5-5", effort: "high", seed: 1 } });
  assert.match(md, /# Blind judge: old vs new/);
  // old wins p2 only; new wins p1 and p3; p4 ties.
  assert.match(md, /\| old \| new \| Tie \|\n\| --- \| --- \| --- \|\n\| 1 \| 2 \| 1 \|/);
  // Scores read "old – new": p1 old was Reading B (2), new Reading A (5).
  assert.match(md, /\| p1 \| en \| new \| new \| 2 – 5 \|/);
  assert.match(md, /\| p2 \| en \| old \| old \| 4 – 3 \|/);
  assert.match(md, /\| p3 \| en \| new \| old \| 1 – 4 \|/);
  assert.match(md, /\| p4 \| en \| tie \| new \| 3 – 3 \|/);
  // Mean recognisability: old (2 + 4 + 1 + 3) / 4 = 2.5, new (5 + 3 + 4 + 3) / 4 = 3.8.
  assert.match(md, /\| recognisability \| 2\.5 \| 3\.8 \|/);
  assert.ok(!md.includes("ukrainianNaturalness"), "no Ukrainian row without Ukrainian profiles");
  assert.match(md, /- \*\*p1\*\* \(winner: new; A = new, B = old\): \*\*new\*\* is concrete; \*\*old\*\* hedges\./);
  assert.match(md, /## Not judged\n\n- p5: only in old/);
});

test("variant metrics average what was recorded and mark what was not", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("uk-timed-taras");
  const m = ev.variantMetrics([x.record, y.record]);
  assert.equal(m.readings, 2);
  assert.equal(m.repairs, 0);
  assert.ok(m.cents > 0 && m.words > 1000 && m.seconds >= 0);
  const baseline = ev.variantMetrics([{ lint: { "hedge-lead": 13, hedges: 5, phrase: 0, gender: 0, repeat: 2 }, residue: { a: ["x"], b: [], c: ["y", "z"] }, words: { total: 2653 }, ms: null, costCents: null, attempts: null }]);
  assert.deepEqual([baseline.seconds, baseline.cents, baseline.repairs], [null, null, null]);
  assert.equal(baseline.residue, 3);
  assert.equal(baseline.lint["hedge-lead"], 13);
});

/* ───────────── plumbing ───────────── */

test("pool keeps results in order and never runs more than the limit at once", async () => {
  let live = 0, peak = 0;
  const out = await ev.pool([30, 5, 20, 1, 10, 2], 2, async (ms, i) => {
    peak = Math.max(peak, ++live);
    await new Promise((done) => setTimeout(done, ms));
    live--;
    return i;
  });
  assert.deepEqual(out, [0, 1, 2, 3, 4, 5]);
  assert.equal(peak, 2);
});

test("dry output is refused among the evidence, and a real run without credentials stops before any call", async () => {
  await assert.rejects(ev.main(["--dry", "--variant", "x", "--out", ev.EVIDENCE_ROOT]), /must not go inside/);
  await assert.rejects(ev.main(["--judge", "only-one"]), /two variant directories/);
  await assert.rejects(ev.main(["--variant", "x", "--effort", "extreme"]), /--effort must be one of/);
  const key = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(ev.main(["--variant", "x", "--out", join(tmpdir(), "portrait-eval-test-never")]), /ANTHROPIC_API_KEY is not set/);
  } finally {
    if (key !== undefined) process.env.ANTHROPIC_API_KEY = key;
  }
});

test("a dry run, a baseline import and a dry judge work together end to end", async () => {
  const dir = await mkdtemp(join(tmpdir(), "portrait-eval-test-"));
  const quiet = console.error;
  console.error = () => {};
  try {
    await ev.main(["--dry", "--variant", "one", "--out", dir, "--profiles", "m1-en-olena,m1-uk-olena,en-timed-tom"]);
    await ev.main(["--dry", "--variant", "two", "--out", dir, "--profiles", "m1-en-olena,m1-uk-olena,uk-timed-taras", "--concurrency", "3"]);
    await ev.main(["--import-baseline", new URL(".", M1_DIR).pathname, "--variant", "base", "--out", dir, "--dry"]);
    const written = await ev.readVariantDir(join(dir, "one"));
    assert.deepEqual([...written.keys()].sort(), ["en-timed-tom", "m1-en-olena", "m1-uk-olena"]);
    assert.ok([...written.values()].every((f) => f.dry && f.variant === "one" && f.stages.a && f.ms.total >= 0));
    const base = await ev.readVariantDir(join(dir, "base"));
    assert.deepEqual([...base.keys()].sort(), ["m1-en-olena", "m1-uk-olena"]);

    await ev.main(["--dry", "--judge", join(dir, "base"), join(dir, "two"), "--out", join(dir, "judge.md"), "--seed", "4"]);
    const md = await readFile(join(dir, "judge.md"), "utf8");
    assert.match(md, /# Blind judge: base vs two/);
    assert.match(md, /uk-timed-taras: only in two/);
    const raw = JSON.parse(await readFile(join(dir, "judge.json"), "utf8"));
    assert.deepEqual(raw.variants, ["base", "two"]);
    assert.equal(raw.results.length, 2);
    for (const r of raw.results) assert.deepEqual([r.order.A, r.order.B].sort(), ["base", "two"]);
    // Dry readings are never judged for real.
    await assert.rejects(ev.main(["--judge", join(dir, "one"), join(dir, "two"), "--out", join(dir, "j2.md")]), /dry \(fake\) readings/);
  } finally {
    console.error = quiet;
    await rm(dir, { recursive: true, force: true });
  }
});
