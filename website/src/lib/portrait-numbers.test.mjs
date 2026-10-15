// website/src/lib/portrait-numbers.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { nameNumbers, reduceNumber } from "./portrait/numbers.js";

const core = (r) => [r.lifePath?.number, r.expression?.number, r.soulUrge?.number, r.personality?.number, r.birthday?.number];

test("reduceNumber keeps 11, 22 and 33", () => {
  assert.equal(reduceNumber(29).number, 11);
  assert.equal(reduceNumber(29).master, true);
  assert.equal(reduceNumber(38).number, 11);
  assert.equal(reduceNumber(39).number, 3);
  assert.deepEqual(reduceNumber(1987).steps, [1987, 25, 7]);
});

test("matches the V18 numbers for three reference names", () => {
  assert.deepEqual(core(nameNumbers({ date: "2000-02-01", name: "Olena Koval" })), [5, 9, 1, 8, 1]);
  assert.deepEqual(core(nameNumbers({ date: "1987-11-29", name: "Mary-Kaye Wyatt" })), [11, 8, 4, 4, 11]);
  assert.deepEqual(core(nameNumbers({ date: "1999-12-31", name: "Bryan Yates" })), [8, 4, 5, 8, 4]);
});

test("Y follows the published surrounding-letter rules", () => {
  const r = nameNumbers({ date: "1987-11-29", name: "Mary-Kaye Wyatt" });
  assert.deepEqual(r.yLetters.map((y) => [y.index, y.vowel, y.rule]), [
    [3, true, "between-consonants"],
    [6, false, "mixed-or-vowel-neighbours"],
    [9, true, "published-name-exception"],
  ]);
});

test("a Y override changes only that letter", () => {
  const plain = nameNumbers({ date: "1999-12-31", name: "Bryan Yates" });
  const fixed = nameNumbers({ date: "1999-12-31", name: "Bryan Yates", yOverrides: { 5: "vowel" } });
  assert.equal(fixed.yLetters.find((y) => y.index === 5).vowel, true);
  assert.notEqual(fixed.soulUrge.number, plain.soulUrge.number);
});

test("non-Latin names need a Latin spelling; accents are folded", () => {
  assert.equal(nameNumbers({ date: "2000-02-01", name: "Олена Коваль" }).status, "needs-latin");
  assert.equal(nameNumbers({ date: "2000-02-01", name: "Олена Коваль" }).expression, null);
  assert.deepEqual(core(nameNumbers({ date: "2000-02-01", name: "Олена Коваль", latin: "Olena Koval" })), [5, 9, 1, 8, 1]);
  assert.equal(nameNumbers({ date: "2000-02-01", name: "Hélène" }).spelling, "HELENE");
  assert.equal(nameNumbers({ date: "2000-02-01", name: "" }).status, "missing");
});
