import assert from "node:assert/strict";
import test from "node:test";
import { normalize, point, separateLabels, wheelAngle } from "./natal-atlas-geometry.ts";

const close = (actual, expected, tolerance = .002) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test("the four cardinal longitudes use one counterclockwise scale", () => {
  const expected = [{ x: 105, y: 260 }, { x: 260, y: 415 }, { x: 415, y: 260 }, { x: 260, y: 105 }];
  [0, 90, 180, 270].forEach((longitude, i) => assert.deepEqual(point(155, wheelAngle(longitude)), expected[i]));
});

test("every ascendant stays left while the whole zodiac rotates with it", () => {
  for (const ascendant of [0, 12.5, 90, 178.2, 270, 359.9]) {
    assert.deepEqual(point(155, wheelAngle(ascendant, ascendant)), { x: 105, y: 260 });
    assert.deepEqual(point(155, wheelAngle(ascendant + 90, ascendant)), { x: 260, y: 415 });
    // A planet on a house cusp and that same zodiac degree must share a ray.
    const longitude = 120;
    const zodiac = point(210, wheelAngle(longitude, ascendant));
    const planet = point(155, wheelAngle(longitude, ascendant));
    close((zodiac.x - 260) / 210, (planet.x - 260) / 155);
    close((zodiac.y - 260) / 210, (planet.y - 260) / 155);
  }
});

test("aspect chords preserve conjunction, sextile, square, trine and opposition geometry", () => {
  const radius = 155;
  for (const origin of [0, 42.5, 359.9]) {
    const first = point(radius, wheelAngle(origin, 87));
    for (const [separation, ratio] of [[0, 0], [60, 1], [90, Math.SQRT2], [120, Math.sqrt(3)], [180, 2]]) {
      close(distance(first, point(radius, wheelAngle(origin + separation, 87))), radius * ratio);
    }
  }
});

test("conjunction labels separate across Aries without moving exact anchors", () => {
  const longitudes = Object.freeze([359, 0, 1, 1, 2, 3, 120, 180, 230, 290]);
  const anchors = longitudes.map(longitude => point(155, wheelAngle(longitude, 32)));
  const labels = separateLabels(longitudes);
  assert.notDeepEqual(labels, longitudes);
  assert.deepEqual(anchors, longitudes.map(longitude => point(155, wheelAngle(longitude, 32))));
  assert.equal(labels.length, longitudes.length);
  const sorted = [...labels].sort((a, b) => a - b);
  sorted.forEach((label, i) => assert.ok(normalize(sorted[(i + 1) % sorted.length] - label) >= 15 - 1e-8));
});

test("well-spaced labels remain at their exact longitude", () => {
  const longitudes = [300, 0, 60, 180, 240, 120];
  assert.deepEqual(separateLabels(longitudes), longitudes);
  assert.deepEqual(separateLabels([]), []);
  assert.deepEqual(separateLabels([361]), [1]);
});

test("label separation remains circular for 2000 deterministic crowded skies", () => {
  let seed = 18471;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let fixture = 0; fixture < 2000; fixture++) {
    const center = random() * 360;
    const longitudes = Array.from({ length: 10 }, () => normalize(center + random() * (fixture % 2 ? 35 : 360)));
    const labels = separateLabels(longitudes).sort((a, b) => a - b);
    labels.forEach((label, i) => {
      assert.ok(Number.isFinite(label) && label >= 0 && label < 360);
      assert.ok(normalize(labels[(i + 1) % labels.length] - label) >= 15 - 1e-8, `overlap in fixture ${fixture}`);
    });
  }
});
