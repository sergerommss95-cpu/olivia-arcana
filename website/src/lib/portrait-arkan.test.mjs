// website/src/lib/portrait-arkan.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { arkanPortrait, cardOf, reduce22, POSITIONS } from "./portrait/arkan.js";

const table = (date) => Object.fromEntries(arkanPortrait(date).positions.map((p) => [p.position, [p.numeral, p.card]]));

test("reduce22 subtracts 22 until 1–22", () => {
  assert.equal(reduce22(22), 22);
  assert.equal(reduce22(23), 1);
  assert.equal(reduce22(44), 22);
  assert.throws(() => reduce22(0));
});

test("school numerals map to deck identities", () => {
  assert.equal(cardOf(22), 0); // the Fool
  assert.equal(cardOf(8), 11); // school VIII is Justice
  assert.equal(cardOf(11), 8); // school XI is Strength
  assert.equal(cardOf(9), 9);
});

test("matches the V18 portrait for three reference births", () => {
  assert.deepEqual(table("2000-02-01"), { 1: [1, 1], 2: [2, 2], 3: [2, 2], 4: [3, 3], 5: [4, 4], 6: [7, 7], 7: [5, 5], 8: [9, 9], 12: [14, 14], 13: [11, 8], 14: [13, 13] });
  assert.deepEqual(table("1987-11-29"), { 1: [7, 7], 2: [11, 8], 3: [3, 3], 4: [18, 18], 5: [14, 14], 6: [10, 10], 7: [21, 21], 8: [21, 21], 12: [20, 20], 13: [13, 13], 14: [5, 5] });
  assert.deepEqual(table("1999-12-31"), { 1: [9, 9], 2: [12, 12], 3: [6, 6], 4: [21, 21], 5: [18, 18], 6: [17, 17], 7: [5, 5], 8: [7, 7], 12: [12, 12], 13: [3, 3], 14: [19, 19] });
});

test("every position is present, in order, and the harmony check holds", () => {
  const result = arkanPortrait("1975-06-22");
  assert.deepEqual(result.positions.map((p) => p.position), POSITIONS);
  assert.equal(result.positions[0].card, 0); // day 22 → the Fool
  assert.equal(result.check, true);
  assert.deepEqual(result.steps.find((s) => s.position === 13).inputs, [1, 4, 6]);
});

test("rejects impossible dates", () => {
  assert.throws(() => arkanPortrait("2001-02-29"));
  assert.throws(() => arkanPortrait("1990-13-01"));
  assert.throws(() => arkanPortrait("01-02-1990"));
});
