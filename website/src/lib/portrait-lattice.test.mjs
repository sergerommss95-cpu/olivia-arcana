// website/src/lib/portrait-lattice.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { layout, threads, litPositions, READING_ORDER, ROLES } from "./portrait/lattice.js";
import { LINKS } from "./portrait/arkan.js";

test("every position has a place, rows read 1-2-3 / 4-5 / 7-6-8 / 13-12-14", () => {
  const l = layout(1200);
  assert.deepEqual(Object.keys(l.positions).map(Number).sort((a, b) => a - b), [...READING_ORDER].sort((a, b) => a - b));
  assert.ok(l.positions[1].y < l.positions[4].y && l.positions[4].y < l.positions[7].y && l.positions[7].y < l.positions[13].y);
  assert.ok(l.positions[4].x > l.positions[1].x && l.positions[4].x < l.positions[2].x);
});
test("compact layout fits a 360 px column", () => {
  const l = layout(360);
  for (const { x } of Object.values(l.positions)) assert.ok(x - l.card.w / 2 >= 0 && x + l.card.w / 2 <= 360);
});
test("one thread per dependency", () => {
  const expected = Object.values(LINKS).reduce((n, from) => n + from.length, 0);
  assert.equal(threads(layout(1200)).length, expected);
});
test("lit positions come only from arkan refs present in the packet", () => {
  const packet = { factors: [{ id: "arkan-4", kind: "arkan", position: 4, card: 3 }, { id: "natal-sun", kind: "planet" }] };
  assert.deepEqual(litPositions(["natal-sun", "arkan-4", "arkan-9"], packet), [4]);
});

test("desktop scales the 820 design box; height covers the last row and half a card", () => {
  const l = layout(820);
  assert.deepEqual(l.card, { w: 86, h: 149 });
  assert.deepEqual(l.positions[1], { x: 123, y: 95 });
  assert.deepEqual(l.positions[5], { x: 553.5, y: 285 });
  assert.deepEqual(l.positions[12], { x: 410, y: 662 });
  assert.equal(l.height, 662 + 149 / 2);
  const wide = layout(1640);
  assert.equal(wide.card.w, 172);
  assert.equal(wide.positions[14].y, 1324);
});
test("compact: 54 px cards, rows at 0.5h / 1.75h / 3h / 4.25h, height 4.85h", () => {
  const l = layout(719);
  const h = 54 * 149 / 86;
  assert.deepEqual(l.card, { w: 54, h });
  assert.deepEqual([1, 4, 7, 13].map((p) => l.positions[p].y), [0.5 * h, 1.75 * h, 3 * h, 4.25 * h]);
  assert.equal(l.height, 4.85 * h);
  assert.ok(Math.abs(l.positions[3].x - 0.83 * 719) < 1e-9);
  assert.ok(l.positions[4].x > l.positions[1].x && l.positions[4].x < l.positions[2].x);
});
test("threads run straight from source centre to target centre", () => {
  const t = threads(layout(820));
  assert.deepEqual(t.find((x) => x.from === 1 && x.to === 4), { from: 1, to: 4, d: "M 123 95 L 266.5 285" });
  assert.equal(new Set(t.map((x) => `${x.from}>${x.to}`)).size, t.length);
});
test("lit positions follow reading order, once each", () => {
  const packet = { factors: [1, 6, 14].map((position) => ({ id: `arkan-${position}`, kind: "arkan", position, card: 0 })) };
  assert.deepEqual(litPositions(["arkan-14", "arkan-1", "arkan-14", "arkan-6"], packet), [1, 6, 14]);
  assert.deepEqual(litPositions([], packet), []);
});
test("every position has an EN and UK role", () => {
  for (const p of READING_ORDER) assert.ok(ROLES[p].en && ROLES[p].uk, `role ${p}`);
  assert.equal(ROLES[5].en, "Conscious aim");
});
