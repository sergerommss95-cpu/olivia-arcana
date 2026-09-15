import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL, reducer } from "./sitting.ts";
import { createRitualTimer, orientationsForSitting, shuffleForSitting } from "../../../components/oracle/ritual.ts";

const ready = (count = 3) => reducer(reducer({ ...INITIAL, count }, { type: "begin", seed: 123456 }), { type: "ready", seed: 123456 });

test("fast repeated choices cannot duplicate cards or overflow a spread", () => {
  let state = ready();
  for (const index of [77, 77, 26, 4, 14]) state = reducer(state, { type: "select", index });
  assert.deepEqual(state.selected, [77, 26, 4]);
  assert.equal(state.phase, "revealing");
  const reshaped = reducer(state, { type: "count", count: 1 });
  assert.strictEqual(reshaped, state);
});

test("incomplete spreads cannot reveal, and invalid positions cannot enter the draw", () => {
  let state = ready();
  for (const index of [-1, 78, .5, NaN, Infinity]) assert.strictEqual(reducer(state, { type: "select", index }), state);
  state = reducer(state, { type: "select", index: 1 });
  assert.strictEqual(reducer(state, { type: "reveal", index: 1 }), state);
  state = reducer(reducer(state, { type: "select", index: 7 }), { type: "select", index: 8 });
  assert.strictEqual(reducer(state, { type: "reveal", index: 2 }), state);
});

test("a stale shuffle completion cannot open a later sitting", () => {
  let state = reducer(INITIAL, { type: "begin", seed: 8 });
  state = reducer(state, { type: "reset" });
  state = reducer(state, { type: "begin", seed: 19 });
  assert.strictEqual(reducer(state, { type: "ready", seed: 8 }), state);
  assert.equal(reducer(state, { type: "ready", seed: 19 }).phase, "choosing");
});

test("one-card and three-card readings finish only after every deliberate reveal", () => {
  for (const count of [1, 3]) {
    let state = ready(count);
    for (const index of [65, 22, 0].slice(0, count)) state = reducer(state, { type: "select", index });
    const chosen = [...state.selected];
    for (let i = 0; i < chosen.length; i++) {
      state = reducer(state, { type: "reveal", index: chosen[i] });
      assert.equal(state.phase, i === count - 1 ? "reading" : "revealing");
      const same = reducer(state, { type: "reveal", index: chosen[i] });
      assert.strictEqual(same, state);
    }
    assert.deepEqual(state.selected, chosen);
  }
});

test("browsed card 78 retains the identity and reversal from the full seeded deck", () => {
  const pool = Array.from({ length: 78 }, (_, i) => i);
  const deck = shuffleForSitting(pool, 123456, 78);
  const orientations = orientationsForSitting(123456, 78);
  let state = reducer(ready(1), { type: "select", index: 77 });
  state = reducer(state, { type: "reveal", index: 77 });
  assert.equal(new Set(deck).size, 78);
  assert.equal(deck[state.selected[0]], shuffleForSitting(pool, state.seed, 78)[77]);
  assert.equal(orientations[state.selected[0]], orientationsForSitting(state.seed, 78)[77]);
});

test("restart cancels the pending shuffle, clears the question and keeps reading preferences", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const timer = createRitualTimer();
  let state = { ...INITIAL, count: 1, intention: "connection", question: "A private question" };
  state = reducer(state, { type: "begin", seed: 5 });
  timer.schedule(() => { state = reducer(state, { type: "ready", seed: 5 }); }, 520);
  timer.cancel(); state = reducer(state, { type: "reset" });
  context.mock.timers.tick(1000);
  assert.equal(state.phase, "intention");
  assert.equal(state.question, "");
  assert.equal(state.count, 1);
  assert.equal(state.intention, "connection");
});
