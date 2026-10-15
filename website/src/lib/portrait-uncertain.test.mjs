// website/src/lib/portrait-uncertain.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { signsThroughDay } from "./portrait/uncertain.js";

test("the Sun's ingress day keeps both signs", () => {
  const signs = signsThroughDay({ date: "1990-01-20", zone: "Europe/Kyiv" });
  assert.deepEqual(signs.sun, ["capricorn", "aquarius"]);
});

test("several bodies can change sign on one day", () => {
  const signs = signsThroughDay({ date: "1990-03-03", zone: "Europe/Kyiv" });
  assert.deepEqual(signs.moon, ["taurus", "gemini"]);
  assert.deepEqual(signs.mercury, ["aquarius", "pisces"]);
  assert.deepEqual(signs.venus, ["capricorn", "aquarius"]);
});

test("a quiet day gives one sign per body", () => {
  const signs = signsThroughDay({ date: "2000-02-03", zone: "Europe/Kyiv" });
  for (const list of Object.values(signs)) assert.equal(list.length, 1);
  assert.deepEqual(signs.sun, ["aquarius"]);
});
