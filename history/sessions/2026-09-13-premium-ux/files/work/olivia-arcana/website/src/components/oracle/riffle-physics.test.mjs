import test from "node:test";
import assert from "node:assert/strict";
import { beginPullGesture, advancePullGesture, finishPullGesture, stepFlick } from "./riffle-physics.ts";

test("a long horizontal riffle does not increase the later pull threshold", () => {
  let grip = beginPullGesture(10, 200);
  grip = advancePullGesture(grip, 310, 200, 38);
  grip = advancePullGesture(grip, 310, 220, 39);
  grip = advancePullGesture(grip, 312, 270, 42);
  assert.deepEqual(finishPullGesture(grip, false), { index: 39, reversed: false });
});

test("the gripped card stays locked as a pull crosses neighboring backs", () => {
  let grip = beginPullGesture(100, 200);
  grip = advancePullGesture(grip, 100, 180, 12);
  grip = advancePullGesture(grip, 230, 120, 19);
  assert.deepEqual(finishPullGesture(grip, false), { index: 12, reversed: true });
});

test("cancelled and withdrawn pulls never draw a card", () => {
  let grip = advancePullGesture(beginPullGesture(100, 200), 100, 280, 10);
  assert.equal(finishPullGesture(grip, true), null);
  grip = advancePullGesture(grip, 100, 220, 10);
  assert.equal(finishPullGesture(grip, false), null);
  assert.equal(finishPullGesture(beginPullGesture(100, 200), true), null);
});

test("fine pointer samples cannot disguise a drag as a tap", () => {
  let grip = beginPullGesture(0, 200);
  for (let i = 1; i <= 30; i++) grip = advancePullGesture(grip, i / 2, 200, 10);
  assert.equal(grip.moved, true);
  assert.equal(finishPullGesture(grip, false), null);
});

test("riffle springs stay finite, bounded, and settle after slow or interrupted frames", () => {
  for (const frameTime of [1 / 240, 1 / 60, 0.05, 0.1, 1, 30]) {
    let x = 0, v = 10, peak = 0;
    for (let i = 0; i < 1000; i++) {
      [x, v] = stepFlick(x, v, frameTime);
      peak = Math.max(peak, Math.abs(x));
      assert.ok(Number.isFinite(x) && Number.isFinite(v));
    }
    assert.ok(peak < 0.25, `${frameTime}: ${peak}`);
    assert.equal(x, 0);
    assert.equal(v, 0);
  }
});
