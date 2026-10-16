// website/src/lib/portrait-digest.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { definingCards, facetCards, firstSentence, pullQuote, readingMinutes } from "./portrait/digest.js";

const arkan = (position, card) => ({ id: `arkan-${position}`, kind: "arkan", position, card });
const packet = { v: 1, locale: "en", timeKnown: true, factors: [arkan(1, 1), arkan(2, 2), arkan(3, 2), arkan(4, 3), arkan(5, 4), arkan(6, 7), arkan(7, 5), arkan(8, 9), arkan(12, 14), arkan(13, 8), arkan(14, 13)] };
const p = (refs, text = "One. Two.") => ({ text, refs, teachings: [] });
const stageA = {
  title: "T", epigraph: "E",
  overview: p(["arkan-2", "arkan-5", "arkan-6"]),
  facets: {
    temperament: { heading: "h", ...p(["arkan-13", "arkan-14"]) },
    inner: { heading: "h", ...p(["arkan-12", "arkan-13", "arkan-4"]) },
    gifts: { heading: "h", ...p(["arkan-6", "arkan-7", "arkan-8"]) },
    bonds: { heading: "h", ...p(["arkan-14", "num-soulUrge"]) },
    direction: { heading: "h", ...p(["arkan-1", "arkan-2", "arkan-3", "arkan-5", "arkan-6"]) },
  },
};

test("defining cards: most cited in the opening and facets, ties to the overview, then reading order", () => {
  const d = definingCards(stageA, packet);
  // Counts: card 2 (pos 2+3) = 3, card 7 (pos 6) = 3, card 4 (pos 5) = 2 and cited in the overview, card 8 (pos 13) = 2, card 13 (pos 14) = 2.
  // Top four by count, overview, first position: 2, 7, 4, 8 — then re-sorted by first position.
  assert.deepEqual(d.map((x) => x.card), [2, 4, 7, 8]);
  assert.deepEqual(d[0], { card: 2, positions: [2, 3], count: 3 });
  assert.ok(d.some((x) => x.card === 7));
  for (let i = 1; i < d.length; i++) assert.ok(d[i - 1].positions[0] < d[i].positions[0], "re-sorted by first position");
});

test("facet cards: fewest refs choose first, no card repeats when avoidable", () => {
  const f = facetCards(stageA, packet);
  assert.equal(f.bonds, 14);
  assert.equal(f.temperament, 13);
  assert.notEqual(packet.factors.find((x) => x.position === f.inner).card, packet.factors.find((x) => x.position === f.temperament).card);
  assert.equal(facetCards({ ...stageA, facets: { ...stageA.facets, bonds: { heading: "h", ...p(["num-soulUrge"]) } } }, packet).bonds, null);
});

test("first sentence handles closing quotes and Ukrainian", () => {
  assert.equal(firstSentence("He said «go». Then more."), "He said «go».");
  assert.equal(firstSentence("Ви приходите вчасно. Далі."), "Ви приходите вчасно.");
  assert.equal(firstSentence("No ending"), "No ending");
});

test("pull quote: shortest qualifying sentence, never the chapter's first, with its paragraph", () => {
  const chapter = { title: "t", lede: "l", practice: "p", refs: [], teachings: [], paragraphs: [
    "This very first sentence has exactly nine words in it. And this one starts with a conjunction but is long enough to count here.",
    "A short one. Here is a calm sentence of exactly ten words in total. Another sentence that runs on for quite a long while past twenty words so that it can never qualify as a pull quote at all.",
  ] };
  assert.deepEqual(pullQuote(chapter), { sentence: "Here is a calm sentence of exactly ten words in total.", after: 1 });
  assert.equal(pullQuote({ ...chapter, paragraphs: ["Too short. Also short."] }), null);
});

test("reading minutes counts present stages at 220 words a minute", () => {
  const words = (n) => Array.from({ length: n }, () => "w").join(" ");
  const stages = { a: { ...stageA, overview: p([], words(440)) }, b: { chapters: { mind: { title: "t", lede: "l", paragraphs: [words(440)], practice: "p", refs: [], teachings: [] } } } };
  assert.equal(readingMinutes(stages), 4);
  assert.equal(readingMinutes({ a: { ...stageA, overview: p([], "x") } }), 1);
});
