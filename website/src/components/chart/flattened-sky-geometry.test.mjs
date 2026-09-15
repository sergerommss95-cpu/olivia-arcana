import test from "node:test";
import assert from "node:assert/strict";
import { birthSkyGeometry, horizonPoint } from "./flattened-sky-geometry.ts";

const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const chart = {
  input: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, latitude: 51.5074, longitude: -.1278, timezone: 0 },
  timeKnown: true,
  planets: bodies.map((name, i) => ({ name, glyph: name[0], longitude: i * 30 })),
  ascendant: { longitude: 18.14 },
};
const close = (actual, expected, tolerance = .00001) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

test("sky projection keeps zenith centred, north above and east left", () => {
  close(horizonPoint(90, 0).x, 0); close(horizonPoint(90, 0).y, 0);
  close(horizonPoint(0, 0).y, -1); close(horizonPoint(0, 90).x, -1);
  close(horizonPoint(0, 180).y, 1); close(horizonPoint(0, 270).x, 1);
  const nadir = horizonPoint(-90, 34);
  assert.equal(nadir.alt, -90); close(Math.hypot(nadir.x, nadir.y), 1.22);
});

test("London J2000 fixture retains real topocentric Moon and Sun coordinates", () => {
  // Regression fixtures from Astronomy Engine's apparent, equator-of-date,
  // sea-level Observer/Horizon pipeline, without atmospheric refraction.
  const sky = birthSkyGeometry(chart);
  assert.equal(sky.planets.length, 10);
  close(sky.planets[0].alt, 15.4528693286); close(sky.planets[0].az, 179.0939229588);
  close(sky.planets[1].alt, 9.2997746547); close(sky.planets[1].az, 237.6707178046);
  close(sky.phase, 302.9493632167);
  assert.equal(sky.sunUp, true);
});

test("observed sky never substitutes zodiac longitude for latitude and parallax", () => {
  const original = structuredClone(chart);
  const sky = birthSkyGeometry(chart);
  const changed = birthSkyGeometry({ ...chart, planets: chart.planets.map(p => ({ ...p, longitude: (p.longitude + 117) % 360 })) });
  sky.planets.forEach((p, i) => { close(p.alt, changed.planets[i].alt); close(p.az, changed.planets[i].az); });
  assert.deepEqual(chart, original, "Sky rendering must not mutate natal results");
});

test("equivalent local times produce the same observed sky and untimed charts omit rising", () => {
  const noon = birthSkyGeometry(chart);
  const shifted = birthSkyGeometry({ ...chart, input: { ...chart.input, hour: 15, timezone: 3 } });
  noon.planets.forEach((p, i) => { close(p.alt, shifted.planets[i].alt); close(p.az, shifted.planets[i].az); });
  assert.equal(birthSkyGeometry({ ...chart, timeKnown: false }).asc, null);
});

test("historical, southern and polar observers yield finite bounded projections", () => {
  for (const year of [1900, 2000, 2035]) for (const latitude of [-90, -33.86, 0, 51.5074, 90]) {
    const sky = birthSkyGeometry({ ...chart, input: { ...chart.input, latitude, year } }, [{ ra: 6.75248, dec: -16.7161, mag: -1.46 }]);
    for (const p of [...sky.planets, ...sky.stars, ...sky.ecliptic]) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.alt));
      assert.ok(Math.hypot(p.x, p.y) <= 1.2200001);
    }
  }
});
