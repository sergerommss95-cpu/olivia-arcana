// website/scripts/portrait-eval.test.mjs
// The pure parts of the eval harness, plus a dry end-to-end run. Run by hand: node --test scripts/portrait-eval.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
  const write = ev.fakeWriter({ locale: profile.locale, quirks, delayMs: 0, salt: id });
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
const USAGE = { input: 1000, output: 1000, cacheRead: 0, cacheWrite: 0 };
const scores = (n, uk = false) => ({ recognisability: n, specificity: n, distinctness: n, warmth: n, plainLanguage: n, ...(uk ? { ukrainianNaturalness: n } : {}) });
const readingOf = (task, side) => task.match(new RegExp(`<reading_${side}>\\n([\\s\\S]*?)\\n</reading_${side}>`))[1];

test("the judge prompt hides the variant names and the machinery of the reading", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("en-timed-priya");
  const facts = ev.describeFacts(x.packet, bank);
  const pairs = ev.bothOrders({ locale: "en", facts, firstName: FIRST, secondName: SECOND, firstStages: x.record.stages, secondStages: y.record.stages });
  for (const { request, order } of pairs) {
    const prompt = JSON.stringify(request);
    assert.ok(!prompt.includes("alpha") && !prompt.includes("beta") && !prompt.includes("secret"), "no variant name");
    assert.deepEqual([order.A, order.B].sort(), [FIRST, SECOND]);
    for (const outline of [x, y].map((r) => r.record.stages.a.outline.mind)) assert.ok(!request.task.includes(outline), "hidden outline stays out");
    assert.ok(!/natal-|num-|arkan-|card-|\brefs\b|teachings/.test(request.task), "no factor or teaching ids");
    assert.ok(request.task.includes(x.record.stages.a.title) && request.task.includes(y.record.stages.a.title), "both readings are present");
    assert.match(request.shared, /Sun in .*house \d+/);
    assert.match(request.shared, /Arkan position 4: /);
    assert.equal(request.maxTokens, 32_000);
  }
  // The names only decide the mapping, never the request.
  const renamed = ev.bothOrders({ locale: "en", facts, firstName: "x", secondName: "y", firstStages: x.record.stages, secondStages: y.record.stages });
  assert.deepEqual(renamed.map((p) => p.request), pairs.map((p) => p.request));
});

test("order 2 is the order 1 request with the readings swapped", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("en-timed-priya");
  const [one, two] = ev.bothOrders({ locale: "en", facts: "facts here", firstName: FIRST, secondName: SECOND, firstStages: x.record.stages, secondStages: y.record.stages });
  assert.deepEqual(one.order, { A: FIRST, B: SECOND });
  assert.deepEqual(two.order, { A: SECOND, B: FIRST });
  // Same builder: everything but the two reading blocks is identical, and the blocks trade places.
  assert.deepEqual({ ...two.request, task: null }, { ...one.request, task: null });
  assert.equal(readingOf(one.request.task, "a"), readingOf(two.request.task, "b"));
  assert.equal(readingOf(one.request.task, "b"), readingOf(two.request.task, "a"));
  assert.equal(two.request.task, ev.judgeRequest({ locale: "en", facts: "facts here", first: y.record.stages, second: x.record.stages }).task);
  assert.ok(readingOf(one.request.task, "a").includes(x.record.stages.a.title), "order 1 shows the first variant as Reading A");
  assert.ok(readingOf(two.request.task, "a").includes(y.record.stages.a.title), "order 2 shows the second variant as Reading A");
});

test("the judge schema asks for Ukrainian naturalness only for Ukrainian readings", () => {
  const keys = (locale) => Object.keys(ev.judgeSchema(locale).properties.scores.properties.A.properties);
  assert.deepEqual(keys("en"), ["recognisability", "specificity", "distinctness", "warmth", "plainLanguage"]);
  assert.deepEqual(keys("uk"), [...keys("en"), "ukrainianNaturalness"]);
  assert.ok(ev.judgeSystem("uk").includes("ukrainianNaturalness") && !ev.judgeSystem("en").includes("ukrainianNaturalness"));
  assert.deepEqual(ev.judgeSchema("en").required, ["scores", "reasons", "winner"]);
});

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

/** An order result as judgeOrder returns it, for the combination and summary tests. */
const orderOf = (order, winner, a, b, reasons = "Reading A and Reading B differ.", uk = false) => {
  const verdict = { winner, scores: { A: { ...scores(a, uk), ...(uk ? {} : { ukrainianNaturalness: null }) }, B: { ...scores(b, uk), ...(uk ? {} : { ukrainianNaturalness: null }) } }, reasons };
  return { order, verdict, winnerVariant: winner === "tie" ? "tie" : order[winner], calls: [], costCents: 1, ms: 1, error: null };
};

test("the two orders combine: agreement wins, disagreement or any tie is a tie", () => {
  const variants = ["old", "new"];
  const o1 = (winner) => orderOf({ A: "old", B: "new" }, winner, 3, 3);
  const o2 = (winner) => orderOf({ A: "new", B: "old" }, winner, 3, 3);
  const combine = (w1, w2) => ev.combineOrders({ variants, orders: [o1(w1), o2(w2)] });
  // Order 1 shows old as A, order 2 shows new as A: old wins in order 1 by "A" and in order 2 by "B".
  assert.equal(combine("A", "B").winnerVariant, "old");
  assert.equal(combine("A", "B").agree, true);
  assert.equal(combine("B", "A").winnerVariant, "new");
  // The same position winning both times is the judge's bias: the variants disagree, so it is a tie.
  assert.equal(combine("A", "A").winnerVariant, "tie");
  assert.deepEqual(combine("A", "A").picks, ["old", "new"]);
  assert.equal(combine("B", "B").winnerVariant, "tie");
  // A tie in either order, or in both, is a tie.
  assert.equal(combine("tie", "B").winnerVariant, "tie");
  assert.equal(combine("A", "tie").winnerVariant, "tie");
  assert.equal(combine("tie", "tie").winnerVariant, "tie");
  assert.deepEqual(combine("tie", "B").picks, ["tie", "old"]);
  // Without both verdicts there is nothing to combine.
  assert.equal(ev.combineOrders({ variants, orders: [o1("A"), { ...o2("B"), verdict: null, winnerVariant: null }] }), null);
  assert.equal(ev.combineOrders({ variants, orders: [o1("A")] }), null);
});

test("scores per variant are the mean of the two orders", () => {
  const variants = ["old", "new"];
  // Order 1 (old = A): old 5, new 1. Order 2 (new = A): new 4, old 2. So old = (5 + 2) / 2 and new = (1 + 4) / 2.
  const one = orderOf({ A: "old", B: "new" }, "A", 5, 1, undefined, true);
  const two = orderOf({ A: "new", B: "old" }, "A", 4, 2, undefined, true);
  const { scores: mean } = ev.combineOrders({ variants, orders: [one, two] });
  assert.equal(mean.old.recognisability, 3.5);
  assert.equal(mean.new.recognisability, 2.5);
  assert.equal(mean.old.ukrainianNaturalness, 3.5);
  assert.equal(mean.new.warmth, 2.5);
  // English readings carry no Ukrainian score.
  const en = ev.combineOrders({ variants, orders: [orderOf({ A: "old", B: "new" }, "A", 5, 1), orderOf({ A: "new", B: "old" }, "A", 4, 2)] });
  assert.equal(en.scores.old.ukrainianNaturalness, null);
  assert.equal(en.scores.old.specificity, 3.5);
});

test("a profile is judged in both orders, with every call's model, stop reason and usage kept, and one bad answer is retried", async () => {
  const x = await dryReading("en-timed-tom"), y = await dryReading("en-timed-priya");
  const asked = [];
  let failedOnce = false;
  // Prefers the reading whose title it sees as the first variant's: consistent across orders.
  const write = async (call) => {
    asked.push(call);
    if (!failedOnce) { failedOnce = true; return { ok: false, code: "provider", usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }; }
    const firstIsA = readingOf(call.task, "a").includes(x.record.stages.a.title);
    return { ok: true, data: { winner: firstIsA ? "A" : "B", scores: { A: scores(firstIsA ? 5 : 2), B: scores(firstIsA ? 2 : 5) }, reasons: `Reading ${firstIsA ? "A" : "B"} is concrete.` }, usage: USAGE, model: "claude-opus-5-5", stopReason: "end_turn" };
  };
  const result = await ev.judgeProfile({ write, id: "en-timed-tom", locale: "en", facts: "f", first: { name: FIRST, stages: x.record.stages }, second: { name: SECOND, stages: y.record.stages } });
  assert.equal(asked.length, 3, "two orders, one of them retried");
  assert.equal(result.orders.length, 2);
  assert.deepEqual(result.orders.map((o) => o.order), [{ A: FIRST, B: SECOND }, { A: SECOND, B: FIRST }]);
  assert.deepEqual(result.orders.map((o) => o.verdict.winner).sort(), ["A", "B"], "the raw verdicts name opposite positions");
  assert.equal(result.combined.winnerVariant, FIRST);
  assert.deepEqual(result.combined.picks, [FIRST, FIRST]);
  assert.equal(result.winnerVariant, FIRST);
  assert.equal(result.combined.scores[FIRST].recognisability, 5);
  const retried = result.orders.find((o) => o.calls.length === 2);
  assert.equal(retried.calls[0].ok, false);
  assert.equal(retried.calls[0].code, "provider");
  for (const o of result.orders) {
    const last = o.calls.at(-1);
    assert.deepEqual([last.ok, last.model, last.stopReason, last.usage], [true, "claude-opus-5-5", "end_turn", USAGE]);
    assert.ok(last.cents > 0);
  }
  assert.equal(result.costCents, result.orders.reduce((n, o) => n + o.costCents, 0));

  // A throw is a failed call, not a failed run; the other order still lands, but the profile has no combined verdict.
  let n = 0;
  const flaky = await ev.judgeProfile({ write: async () => { if (n++ < 2) throw new Error(`boom ${process.env.ANTHROPIC_API_KEY ?? ""}`); return { ok: true, data: { winner: "A", scores: { A: scores(3), B: scores(3) }, reasons: "ok" }, usage: USAGE, model: "m", stopReason: "end_turn" }; }, id: "p", locale: "en", facts: "f", first: { name: FIRST, stages: x.record.stages }, second: { name: SECOND, stages: y.record.stages } });
  assert.equal(flaky.orders.filter((o) => o.verdict).length, 2, "each order retried after its throw");
  const failing = await ev.judgeProfile({ write: async () => ({ ok: true, data: { winner: "Z" }, usage: USAGE }), id: "p", locale: "en", facts: "f", first: { name: FIRST, stages: x.record.stages }, second: { name: SECOND, stages: y.record.stages } });
  assert.equal(failing.combined, null);
  assert.match(failing.error, /judge_invalid:winner/);
});

test("the summary maps picks, scores and reasons back to variant names, order by order", () => {
  const profileResult = (profile, orders) => ({ profile, locale: "en", orders, combined: ev.combineOrders({ variants: ["old", "new"], orders }), costCents: 2, ms: 1, error: null });
  const results = [
    // new wins both orders.
    profileResult("p1", [orderOf({ A: "old", B: "new" }, "B", 2, 5, "Reading B is concrete; Reading A hedges."), orderOf({ A: "new", B: "old" }, "A", 4, 1, "Reading A is concrete.")]),
    // old wins both.
    profileResult("p2", [orderOf({ A: "old", B: "new" }, "A", 4, 3, "Reading A is warmer than Reading B."), orderOf({ A: "new", B: "old" }, "B", 3, 5, "Reading B is warmer.")]),
    // the judge picks position A both times: a tie.
    profileResult("p3", [orderOf({ A: "old", B: "new" }, "A", 3, 3), orderOf({ A: "new", B: "old" }, "A", 3, 3)]),
    // a tie in one order.
    profileResult("p4", [orderOf({ A: "old", B: "new" }, "tie", 3, 3), orderOf({ A: "new", B: "old" }, "A", 4, 2)]),
  ];
  const metrics = Object.fromEntries(["old", "new"].map((v) => [v, ev.variantMetrics([])]));
  const md = ev.summarize({ variants: ["old", "new"], results, skipped: [{ profile: "p5", reason: "only in old" }], metrics, meta: { model: "claude-opus-5-5", effort: "high" } });
  assert.match(md, /# Blind judge: old vs new/);
  assert.match(md, /judged twice/);
  assert.match(md, /\| old \| new \| Tie \|\n\| --- \| --- \| --- \|\n\| 1 \| 1 \| 2 \|/);
  assert.match(md, /the two orders agreed on 2 of 4/);
  // Scores read "old – new", the mean over both orders: p1 old (2 + 1) / 2 = 1.5, new (5 + 4) / 2 = 4.5.
  assert.match(md, /\| p1 \| en \| new \| new \/ new \| 1\.5 – 4\.5 \|/);
  assert.match(md, /\| p2 \| en \| old \| old \/ old \| 4\.5 – 3 \|/);
  // Mean recognisability over the profiles: old (1.5 + 4.5 + 3 + 2.5) / 4, new (4.5 + 3 + 3 + 3.5) / 4.
  assert.match(md, /\| recognisability \| 2\.9 \| 3\.5 \|/);
  assert.match(md, /\| p3 \| en \| tie \| old \/ new \| 3 – 3 \|/);
  assert.match(md, /\| p4 \| en \| tie \| tie \/ new \|/);
  assert.ok(!md.includes("ukrainianNaturalness"), "no Ukrainian row without Ukrainian profiles");
  assert.match(md, /- \*\*p1\*\* \(winner: new\):\n {2}- Order 1 \(A = old, B = new; pick: new\): \*\*new\*\* is concrete; \*\*old\*\* hedges\.\n {2}- Order 2 \(A = new, B = old; pick: new\): \*\*new\*\* is concrete\./);
  assert.match(md, /## Not judged\n\n- p5: only in old/);
});

test("the Ukrainian mean covers the Ukrainian profiles only, and other criteria are unaffected", () => {
  const variants = ["old", "new"];
  const pair = (profile, locale, o, n) => {
    const uk = locale === "uk";
    const orders = [orderOf({ A: "old", B: "new" }, "A", o, n, undefined, uk), orderOf({ A: "new", B: "old" }, "B", n, o, undefined, uk)];
    return { profile, locale, orders, combined: ev.combineOrders({ variants, orders }), costCents: 2, ms: 1, error: null };
  };
  // old scores 2 and new scores 4 on every Ukrainian profile; old 3 and new 5 on every English one.
  const results = [pair("e1", "en", 3, 5), pair("e2", "en", 3, 5), pair("u1", "uk", 2, 4), pair("u2", "uk", 2, 4)];
  const md = ev.summarize({ variants, results, meta: { model: "m", effort: "high" } });
  assert.match(md, /\| ukrainianNaturalness \(UK only\) \| 2\.0 \| 4\.0 \|/);
  // Over all four profiles: old (3 + 3 + 2 + 2) / 4 = 2.5, new (5 + 5 + 4 + 4) / 4 = 4.5.
  assert.match(md, /\| recognisability \| 2\.5 \| 4\.5 \|/);
  assert.match(md, /\| warmth \| 2\.5 \| 4\.5 \|/);
  // No Ukrainian profile at all: no row (it would be n/a).
  assert.ok(!ev.summarize({ variants, results: results.slice(0, 2), meta: {} }).includes("ukrainianNaturalness"));
  // A criterion with no scored value in one variant reads n/a rather than 0.
  const hollow = pair("u3", "uk", 2, 4);
  for (const o of hollow.orders) for (const side of ["A", "B"]) o.verdict.scores[side].ukrainianNaturalness = null;
  hollow.combined = ev.combineOrders({ variants, orders: hollow.orders });
  assert.match(ev.summarize({ variants, results: [hollow], meta: {} }), /\| warmth \| 2\.0 \| 4\.0 \|/);
});

test("a runner exception is recorded through the same redaction and clip", async () => {
  const key = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "sk-test-secret-value";
  try {
    const profile = byId("en-timed-tom");
    const packet = ev.packetFor(profile, places);
    // runJob catches a throwing writer itself. Once its stages have landed it reads the bank again to keep the cited teachings, and
    // that read is outside its catches: the first bank read after the first call throws, so runJob rejects and runProfile records it.
    let armed = false;
    const flaky = new Proxy(bank, { get(target, name) { if (armed && name === "sources") { armed = false; throw new Error(`bad bank sk-test-secret-value ${"y".repeat(400)}`); } return target[name]; } });
    const inner = ev.fakeWriter({ locale: "en", quirks: false, delayMs: 0 });
    const record = await ev.runProfile({ profile, packet, write: async (call) => { armed = true; return inner(call); }, bank: flaky, variant: "v", model: "m", effort: "low" });
    assert.equal(record.status, "failed");
    assert.match(record.error, /^eval_exception:bad bank \[redacted\] y+$/);
    assert.equal(record.error.length, "eval_exception:".length + 200, "clipped to 200 characters");
    assert.ok(!record.error.includes("sk-test"));
  } finally {
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = key;
  }
});

test("the summary says when the run stopped at its budget", () => {
  const md = ev.summarize({ variants: ["old", "new"], results: [], skipped: [{ profile: "p9", reason: "not started: stopped at budget" }], meta: { stoppedAtBudget: true, spentCents: 12, maxCents: 10 } });
  assert.match(md, /\*\*Stopped at budget\*\*: 12c spent against a cap of 10c/);
  assert.match(md, /- p9: not started: stopped at budget/);
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

/* ───────────── plumbing, resume and guards ───────────── */

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

/** Runs `fn` with console.error captured; returns the lines. */
async function captured(fn) {
  const lines = [];
  const original = console.error;
  console.error = (...args) => lines.push(args.join(" "));
  try { await fn(); } finally { console.error = original; }
  return lines;
}
const scratch = () => mkdtemp(join(tmpdir(), "portrait-eval-test-"));
const dryOptions = (dir, extra = {}) => ({ profiles: profiles.slice(0, 4), outDir: dir, variant: "v", model: "dry-run", effort: "medium", dry: true, concurrency: 1, bank, packetOf: (p) => ev.packetFor(p, places), makeWrite: (p) => ev.fakeWriter({ locale: p.locale, delayMs: 0 }), ...extra });

test("writes are atomic: no temp file is left, and a failed write keeps the old file", async () => {
  const dir = await scratch();
  try {
    const file = join(dir, "a.json");
    await ev.writeJSON(file, { n: 1 });
    await ev.writeJSON(file, { n: 2 });
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), { n: 2 });
    assert.deepEqual((await readdir(dir)).sort(), ["a.json"]);
    // Renaming over a directory fails; the temp file must not stay behind.
    await mkdir(join(dir, "taken.json"));
    await assert.rejects(ev.writeJSON(join(dir, "taken.json"), { n: 3 }));
    assert.deepEqual((await readdir(dir)).sort(), ["a.json", "taken.json"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a truncated, corrupt or mismatched profile file is not done, and --resume re-runs and overwrites it", async () => {
  const dir = await scratch();
  try {
    const profile = profiles[2];
    const file = join(dir, `${profile.id}.json`);
    const key = { profile, effort: "medium", model: "dry-run", dry: true };
    const good = (await dryReading(profile.id)).record;
    await writeFile(file, JSON.stringify(good).slice(0, 400));
    assert.equal(await ev.readDone(file, key), null, "truncated");
    await writeFile(file, "");
    assert.equal(await ev.readDone(file, key), null, "empty");
    await writeFile(file, "not json");
    assert.equal(await ev.readDone(file, key), null, "corrupt");
    assert.equal(await ev.readDone(join(dir, "missing.json"), key), null, "absent");
    await ev.writeJSON(file, { ...good, effort: "medium", model: "dry-run", dry: true });
    assert.equal((await ev.readDone(file, key)).profile, profile.id);
    // Same file, but another effort, model or dry-ness is a different run.
    assert.equal(await ev.readDone(file, { ...key, effort: "high" }), null);
    assert.equal(await ev.readDone(file, { ...key, model: "claude-opus-5-5" }), null);
    assert.equal(await ev.readDone(file, { ...key, dry: false }), null);
    await ev.writeJSON(file, { ...good, status: "failed" });
    assert.equal(await ev.readDone(file, key), null, "failed readings are re-run");

    // End to end: the broken file is replaced, an intact one of the same kind is kept (the writer is not called for it).
    await writeFile(file, '{"profile": "x", "stat');
    let calls = 0;
    const counting = (p) => { const write = ev.fakeWriter({ locale: p.locale, delayMs: 0 }); return async (call) => { calls++; return write(call); }; };
    const lines = [];
    const first = await ev.runVariant(dryOptions(dir, { profiles: [profile], resume: true, makeWrite: counting, say: (l) => lines.push(l) }));
    assert.equal(first.records[0].status, "done");
    assert.ok(calls >= 3);
    assert.equal(JSON.parse(await readFile(file, "utf8")).status, "done", "overwritten with a whole file");
    const before = calls;
    const second = await ev.runVariant(dryOptions(dir, { profiles: [profile], resume: true, makeWrite: counting, say: (l) => lines.push(l) }));
    assert.equal(calls, before, "intact and matching: kept");
    assert.equal(second.records[0].profile, profile.id);
    assert.ok(lines.some((l) => /resume: already done/.test(l)));
    // Another effort re-runs it.
    await ev.runVariant(dryOptions(dir, { profiles: [profile], resume: true, effort: "high", makeWrite: counting }));
    assert.ok(calls > before);
    assert.equal(JSON.parse(await readFile(file, "utf8")).effort, "high");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a profile whose runner throws becomes a failed record, the others complete, and the summary prints", async () => {
  const dir = await scratch();
  const key = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "sk-test-secret-value";
  try {
    const lines = [];
    const target = profiles[1].id;
    const run = (options) => {
      if (options.profile.id === target) throw new Error(`exploded with sk-test-secret-value in ${"x".repeat(500)}`);
      return ev.runProfile(options);
    };
    const out = await ev.runVariant(dryOptions(dir, { profiles: profiles.slice(0, 4), concurrency: 2, run, say: (l) => lines.push(l) }));
    assert.equal(out.records.length, 4);
    assert.deepEqual(out.records.map((r) => r.status), ["done", "failed", "done", "done"]);
    const failed = out.records[1];
    assert.match(failed.error, /^eval_exception:exploded with \[redacted\] in /);
    assert.ok(failed.error.length < 260 && !failed.error.includes("sk-test"), "code/message only, no secret");
    assert.equal(failed.stages && Object.keys(failed.stages).length, 0);
    const onDisk = await ev.readVariantDir(dir);
    assert.deepEqual([...onDisk.keys()].sort(), profiles.slice(0, 4).map((p) => p.id).sort());
    assert.equal(onDisk.get(target).status, "failed");
    assert.ok(lines.some((l) => l.startsWith(`[${target}] failed (eval_exception:`)));
    const summary = lines.at(-1);
    assert.match(summary, /^done: 3\/4 complete/);
    // Failed records have the shape the summaries expect.
    assert.equal(ev.variantMetrics(out.records).readings, 4);
    // A write that fails does not lose the paid reading from the summary: the output "directory" is a file, so nothing can be written under it.
    await writeFile(join(dir, "blocker"), "x");
    const blocked = await ev.runVariant(dryOptions(join(dir, "blocker"), { profiles: [profiles[2]], say: (l) => lines.push(l) }));
    assert.equal(blocked.records[0].status, "done");
    assert.ok(lines.some((l) => /could not write/.test(l)));
  } finally {
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = key;
    await rm(dir, { recursive: true, force: true });
  }
});

test("--max-cents stops new profiles once the recorded spend reaches the cap, and in-flight work finishes", async () => {
  const dir = await scratch();
  try {
    // A fake cost of 40c per profile through the same hook the real calls use.
    const costly = async ({ profile, onCost }) => { onCost(25); await new Promise((done) => setTimeout(done, 5)); onCost(15); return { profile: profile.id, status: "done", error: null, costCents: 40, ms: { total: 5 }, attempts: { a: 1, b: 1, c: 1 }, words: { total: 1 }, lint: {}, residue: {} }; };
    const lines = [];
    const out = await ev.runVariant(dryOptions(dir, { profiles, concurrency: 1, maxCents: 100, run: costly, say: (l) => lines.push(l) }));
    assert.equal(out.records.length, 3, "40 + 40 + 40 reaches 100 after the third");
    assert.deepEqual(out.notStarted, profiles.slice(3).map((p) => p.id));
    assert.equal(out.spentCents, 120);
    assert.equal(out.stoppedAtBudget, true);
    assert.ok(lines.some((l) => /stopped at budget: 120c spent against a cap of 100c; not started: /.test(l)));
    assert.equal((await readdir(dir)).length, 3);
    // With room to spare nothing is held back.
    const free = await ev.runVariant(dryOptions(await scratch(), { profiles: profiles.slice(0, 3), maxCents: 1000, run: costly }));
    assert.equal(free.stoppedAtBudget, false);
    // In flight at the cap: two running together both finish.
    const slow = async (options) => { await new Promise((done) => setTimeout(done, 10)); return costly(options); };
    const pair = await ev.runVariant(dryOptions(await scratch(), { profiles: profiles.slice(0, 4), concurrency: 2, maxCents: 10, run: slow }));
    assert.equal(pair.records.length, 2);
    assert.equal(pair.notStarted.length, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("real-mode guard: no gateway URL and no --allow-direct stops before any work", async () => {
  const saved = { key: process.env.ANTHROPIC_API_KEY, url: process.env.ANTHROPIC_BASE_URL };
  const dir = join(await scratch(), "never-created");
  try {
    delete process.env.ANTHROPIC_BASE_URL;
    process.env.ANTHROPIC_API_KEY = "sk-test-only";
    const none = (dryFlag) => ["--variant", "x", "--out", dir, ...dryFlag];
    await assert.rejects(ev.main(none([])), /ANTHROPIC_BASE_URL is not set.*--allow-direct/s);
    await assert.rejects(ev.main(["--judge", join(dir, "a"), join(dir, "b"), "--out", join(dir, "j.md")]), /ANTHROPIC_BASE_URL is not set/);
    assert.equal(existsSync(dir), false, "nothing was written");
    // --allow-direct lifts only that guard; the key is still required.
    delete process.env.ANTHROPIC_API_KEY;
    await assert.rejects(ev.main([...none([]), "--allow-direct"]), /ANTHROPIC_API_KEY is not set/);
    process.env.ANTHROPIC_BASE_URL = "https://gateway.example.test";
    await assert.rejects(ev.main(none([])), /ANTHROPIC_API_KEY is not set/);
    assert.equal(existsSync(dir), false);
    // Dry runs need neither.
    await captured(() => ev.main(["--dry", "--variant", "x", "--out", dir, "--profiles", "en-timed-tom"]));
    assert.equal(existsSync(join(dir, "x", "en-timed-tom.json")), true);
  } finally {
    for (const [name, value] of [["ANTHROPIC_API_KEY", saved.key], ["ANTHROPIC_BASE_URL", saved.url]]) if (value === undefined) delete process.env[name]; else process.env[name] = value;
    await rm(dirname(dir), { recursive: true, force: true });
  }
});

test("dry output is refused among the evidence, and bad flags stop early", async () => {
  await assert.rejects(ev.main(["--dry", "--variant", "x", "--out", ev.EVIDENCE_ROOT]), /must not go inside/);
  await assert.rejects(ev.main(["--judge", "only-one"]), /two variant directories/);
  await assert.rejects(ev.main(["--variant", "x", "--effort", "extreme"]), /--effort must be one of/);
  await assert.rejects(ev.main(["--dry", "--variant", "x", "--max-cents", "0"]), /--max-cents must be an integer >= 1/);
  await assert.rejects(ev.main(["--dry", "--variant", "x", "--seed", "1"]), /seed/);
});

test("records carry the commit and the packet they were made from", async () => {
  assert.match(ev.gitSha(), /^(?:[0-9a-f]{7,40}|unknown)$/);
  const { packet, record } = await dryReading("uk-unknown-kateryna");
  assert.deepEqual(record.packet, packet);
  assert.equal(validatePacket(record.packet).ok, true);
  assert.equal(typeof record.gitSha, "string");
  const text = JSON.stringify(record.packet);
  assert.ok(!text.includes("Катерина") && !text.includes("1982") && !text.includes("Odesa"), "derived factors only");
  const failed = ev.failedRecord({ profile: byId("en-timed-tom"), variant: "v", model: "m", effort: "low", sha: "abc1234", packet, error: new Error("nope") });
  assert.deepEqual([failed.status, failed.gitSha, failed.error], ["failed", "abc1234", "eval_exception:nope"]);
});

test("a dry run, a baseline import and a dry judge in both orders work together end to end", async () => {
  const dir = await scratch();
  try {
    await captured(async () => {
      await ev.main(["--dry", "--variant", "one", "--out", dir, "--profiles", "m1-en-olena,m1-uk-olena,en-timed-tom"]);
      await ev.main(["--dry", "--variant", "two", "--out", dir, "--profiles", "m1-en-olena,m1-uk-olena,uk-timed-taras", "--concurrency", "3"]);
      await ev.main(["--import-baseline", new URL(".", M1_DIR).pathname, "--variant", "base", "--out", dir, "--dry"]);
    });
    const written = await ev.readVariantDir(join(dir, "one"));
    assert.deepEqual([...written.keys()].sort(), ["en-timed-tom", "m1-en-olena", "m1-uk-olena"]);
    assert.ok([...written.values()].every((f) => f.dry && f.variant === "one" && f.stages.a && f.ms.total >= 0 && f.packet && f.gitSha));
    const base = await ev.readVariantDir(join(dir, "base"));
    assert.deepEqual([...base.keys()].sort(), ["m1-en-olena", "m1-uk-olena"]);
    assert.ok([...base.values()].every((f) => f.baseline && f.packet && f.gitSha));

    await captured(() => ev.main(["--dry", "--judge", join(dir, "base"), join(dir, "two"), "--out", join(dir, "judge.md")]));
    const md = await readFile(join(dir, "judge.md"), "utf8");
    assert.match(md, /# Blind judge: base vs two/);
    assert.match(md, /uk-timed-taras: only in two/);
    const raw = JSON.parse(await readFile(join(dir, "judge.json"), "utf8"));
    assert.deepEqual(raw.variants, ["base", "two"]);
    assert.equal(raw.results.length, 2);
    for (const r of raw.results) {
      assert.equal(r.orders.length, 2, "both orders are stored");
      assert.deepEqual(r.orders.map((o) => o.order), [{ A: "base", B: "two" }, { A: "two", B: "base" }]);
      assert.ok(r.orders.every((o) => o.verdict && o.calls[0].model === "dry-judge" && o.calls[0].stopReason === "end_turn" && o.calls[0].usage.input > 0));
      assert.equal(r.combined.picks.length, 2);
    }
    // Dry readings are never judged for real.
    const key = process.env.ANTHROPIC_BASE_URL;
    process.env.ANTHROPIC_BASE_URL = "https://gateway.example.test";
    try { await assert.rejects(ev.main(["--judge", join(dir, "one"), join(dir, "two"), "--out", join(dir, "j2.md")]), /dry \(fake\) readings|ANTHROPIC_API_KEY/); } finally { if (key === undefined) delete process.env.ANTHROPIC_BASE_URL; else process.env.ANTHROPIC_BASE_URL = key; }

    // A tiny cap through the CLI: the dry judge starts one profile and holds the rest back, and the summary says so.
    await captured(() => ev.main(["--dry", "--judge", join(dir, "one"), join(dir, "two"), "--out", join(dir, "capped.md"), "--max-cents", "1", "--concurrency", "1", "--profiles", "m1-en-olena,m1-uk-olena"]));
    const capped = await readFile(join(dir, "capped.md"), "utf8");
    assert.match(capped, /\*\*Stopped at budget\*\*/);
    assert.match(capped, /- m1-uk-olena: not started: stopped at budget/);
    const cappedRun = await captured(() => ev.main(["--dry", "--variant", "cap", "--out", dir, "--max-cents", "1", "--concurrency", "1"]));
    assert.equal((await ev.readVariantDir(join(dir, "cap"))).size, 1);
    assert.ok(cappedRun.some((l) => /^stopped at budget: \d+c spent against a cap of 1c; not started: /.test(l)));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
