import test from "node:test";
import assert from "node:assert/strict";
import { parseUtcMoment, observationInput, shiftUtcMoment, compassDirection, skyLabels } from "./sky-study.ts";

test("calendar validation rejects rollover days and accepts actual leap years", () => {
  for (const value of ["2026-02-29T12:00", "1900-02-29T12:00", "2026-04-31T12:00", "2026-09-15T24:00", "2026-09-15T12:60", "2026-09-15", "1899-12-31T23:59"]) assert.throws(() => parseUtcMoment(value));
  assert.equal(parseUtcMoment("2000-02-29T00:15").utc.toISOString(), "2000-02-29T00:15:00.000Z");
});
test("UTC minutes and hour exploration preserve exact moments across dates", () => {
  assert.equal(shiftUtcMoment("2026-12-31T23:45", 60), "2027-01-01T00:45");
  assert.equal(shiftUtcMoment("2026-01-01T00:15", -60), "2025-12-31T23:15");
  assert.throws(() => shiftUtcMoment("2100-12-31T23:30", 60));
  const input = observationInput("2026-09-24T19:37", "50.45", "30.52");
  assert.equal(input.minute, 37); assert.equal(input.timezone, 0);
});
test("coordinate validation rejects missing and non-finite values, accepts poles and date line", () => {
  for (const [lat, lon] of [["", "0"], ["0", " "], ["Infinity", "0"], ["NaN", "0"], ["90.01", "0"], ["0", "-180.1"]]) assert.throws(() => observationInput("2026-09-24T19:00", lat, lon));
  assert.equal(observationInput("2026-09-24T19:00", "-90", "180").latitude, -90);
});
test("azimuth compass directions wrap correctly", () => {
  assert.equal(compassDirection(0), "north"); assert.equal(compassDirection(90), "east");
  assert.equal(compassDirection(270), "west"); assert.equal(compassDirection(-90), "west"); assert.equal(compassDirection(360), "north");
});
test("crowded label layout preserves exact input points without mutation", () => {
  const points = [{ name: "Moon", x: 350, y: 290 }, { name: "Saturn", x: 352, y: 294 }, { name: "Neptune", x: 357, y: 286 }];
  const copy = structuredClone(points), labels = skyLabels(points);
  assert.deepEqual(points, copy);
  labels.forEach((label, i) => { assert.equal(label.x, points[i].x); assert.equal(label.y, points[i].y); });
  assert.equal(new Set(labels.map(p => `${p.labelX},${p.labelY}`)).size, 3);
});
