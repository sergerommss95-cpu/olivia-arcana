import test from "node:test";
import assert from "node:assert/strict";
import { baseRates, surveySpread } from "./learn/spread-survey.js";

const near = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);

test("base rates match the teaching table for a random draw", () => {
  const eight = baseRates(8), five = baseRates(5), three = baseRates(3);
  near(eight.majorsAtMost(0), 0.06);
  near(three.majorsAtMost(0), 0.36);
  near(eight.namedSuitAbsent, 0.19);
  near(five.namedSuitAbsent, 0.36);
  near(1 - eight.anyNumberAtLeast(2), 1 - 0.44, 0.015);
  near(eight.anyNumberAtLeast(3), 0.03, 0.01);
  near(five.courtsAtLeast(3), 0.06, 0.01);
  near(eight.reversedAtLeast(8), 1 / 256, 0.0001);
});

test("ordinary spreads call out nothing; rare patterns are phrased as questions", () => {
  // Four of Cups, Hierophant, Page of Pentacles, Ten of Pentacles, Two of Swords, Star, Five of Pentacles, Eight of Pentacles.
  const cards = [39, 5, 74, 73, 51, 17, 68, 71].map((id) => ({ id }));
  const { facts, counts } = surveySpread(cards, { locale: "en" });
  assert.equal(counts.majors, 2);
  assert.equal(counts.suitCounts.pentacles, 4);
  const suit = facts.find((f) => f.id === "suit");
  assert.ok(suit.notable, "four Pentacles in eight is unusual");
  assert.match(suit.odds, /about 1 in \d+ random draws/);
  assert.equal(facts.find((f) => f.id === "majors").notable, false);
  assert.ok(facts.filter((f) => f.notable).length <= 2);
  for (const f of facts) assert.doesNotMatch(`${f.label} ${f.ask} ${f.odds}`, /\b(sign|significant|will|destiny|fate)\b/i);
});

test("Ukrainian survey text is written, formal and free of banned words", () => {
  const { facts } = surveySpread([0, 1, 2, 3, 4].map((id) => ({ id, reversed: true })), { locale: "uk", reversals: true });
  assert.ok(facts.length >= 2);
  for (const f of facts) {
    assert.match(f.label + f.ask, /[А-Яа-яІіЇїЄє]/);
    assert.doesNotMatch(f.label + f.ask, /(^|\s)(ти|твій|тобі)(\s|$)|доля|Всесвіт/);
  }
});
