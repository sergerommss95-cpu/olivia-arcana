import test from "node:test";
import assert from "node:assert/strict";
import { shuffleForSitting, orientationsForSitting, parseSharedDraw, createRitualTimer } from "./ritual.ts";

const deck = Array.from({ length: 78 }, (_, i) => i);

test("the shipped seed still gives the same cards and reversals", () => {
  assert.deepEqual(shuffleForSitting(deck, 123456, 14), [39,49,30,42,65,35,14,31,77,70,41,56,27,6]);
  assert.deepEqual(orientationsForSitting(123456, 14), [true,true,false,false,true,false,false,false,true,false,true,true,false,false]);
  assert.deepEqual(deck, Array.from({ length: 78 }, (_, i) => i), "the source deck must not be mutated");
});

test("changing viewport pool size preserves the chosen prefix and orientation", () => {
  for (const seed of [0, 1, 123456, 999999999, 2147483648]) {
    const full = shuffleForSitting(deck, seed, 78);
    assert.equal(new Set(full).size, 78);
    assert.deepEqual(shuffleForSitting(deck, seed, 7), full.slice(0, 7));
    assert.deepEqual(orientationsForSitting(seed, 7), orientationsForSitting(seed, 14).slice(0, 7));
  }
});

test("shared readings preserve order and a full year-ahead spread", () => {
  assert.deepEqual(parseSharedDraw("10,0,8", 3, 11), [10,0,8]);
  assert.deepEqual(parseSharedDraw("0,1,2,3,4,5,6,7,8,9,10,13", 12, 14), [0,1,2,3,4,5,6,7,8,9,10,13]);
});

test("invalid links cannot duplicate, invent, or silently drop cards", () => {
  for (const value of ["0,0,1", "0,,1", "0,1,3,", "-1,1,2", "0,1,11", "0,1,2.5", "0,1,Infinity", "0,1,2,garbage", "0,1", "0,1, 2"]) {
    assert.equal(parseSharedDraw(value, 3, 11), null, value);
  }
});

test("reset cancels the pending preparation and reveal transitions", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const timer = createRitualTimer();
  let state = "preparing";
  timer.schedule(() => { state = "spread"; }, 850);
  state = "focusing";
  timer.cancel();
  context.mock.timers.tick(2000);
  assert.equal(state, "focusing");
  state = "revealing";
  timer.schedule(() => { state = "result"; }, 650);
  timer.cancel();
  state = "focusing";
  context.mock.timers.tick(2000);
  assert.equal(state, "focusing");
});

test("a new transition replaces an old one; reduced motion completes immediately", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const timer = createRitualTimer();
  const calls = [];
  timer.schedule(() => calls.push("old"), 850);
  timer.schedule(() => calls.push("new"), 0);
  context.mock.timers.tick(0);
  assert.deepEqual(calls, ["new"]);
  context.mock.timers.tick(2000);
  assert.deepEqual(calls, ["new"]);
  timer.cancel();
});

test("the entire 78-card reading restores with exact manual orientations", async () => {
  const { parseSharedReading } = await import("./ritual.ts");
  assert.deepEqual(parseSharedReading("77,0,38", "123456", "1,0,1", 3, 78), {
    indices: [77,0,38], seed: 123456, orientations: { 77: true, 0: false, 38: true },
  });
  assert.deepEqual(parseSharedReading("10,0,8", "0", null, 3, 78), {
    indices: [10,0,8], seed: 0, orientations: {},
  }, "legacy URLs without orientation bits retain their seeded reversals");
});

test("invalid seed or orientation never partially restores a different reading", async () => {
  const { parseSharedReading } = await import("./ritual.ts");
  for (const seed of [null, "", "-1", "1.2", "Infinity", "4294967296", "1e3", " 12"])
    assert.equal(parseSharedReading("0,1,2", seed, null, 3, 78), null);
  for (const bits of ["", "0,1", "0,1,2", "0,1,1,0", "0,1, 1", "true,0,1"])
    assert.equal(parseSharedReading("0,1,2", "12", bits, 3, 78), null);
  assert.equal(parseSharedReading("0,0,2", "12", "0,1,1", 3, 78), null);
  assert.equal(parseSharedReading("0,1,78", "12", "0,1,1", 3, 78), null);
});
