import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { angles, birthChart, birthMoment, moonNow, signOf, skyAt, SIGN_CARDS, BODY_CARDS, SIGNS } from "./astrology/chart.js";

const reference = JSON.parse(readFileSync(new URL("./astrology/reference-charts.json", import.meta.url), "utf8"));
const gap = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

test("positions match Swiss Ephemeris within an arcminute or two", () => {
  for (const chart of reference.charts) {
    const date = new Date(chart.utc);
    const sky = Object.fromEntries(skyAt(date).map((body) => [body.key, body]));
    for (const [key, expected] of Object.entries(chart.bodies)) {
      const tolerance = key === "moon" ? 0.03 : 0.02;
      assert.ok(gap(sky[key].longitude, expected.longitude) < tolerance, `${chart.name} ${key}: ${sky[key].longitude} vs ${expected.longitude}`);
      if (key !== "node" && Math.abs(expected.speed) > 0.002) assert.equal(sky[key].retrograde, expected.speed < 0, `${chart.name} ${key} retrograde`);
    }
  }
});

test("Ascendant and Midheaven match Swiss Ephemeris", () => {
  for (const chart of reference.charts) {
    const found = angles(new Date(chart.utc), chart.latitude, chart.longitude);
    // 1879: the two libraries use different ΔT models; allow a little more.
    const tolerance = chart.utc < "1900" ? 0.25 : 0.05;
    assert.ok(gap(found.ascendant, chart.ascendant) < tolerance, `${chart.name} Ascendant: ${found.ascendant} vs ${chart.ascendant}`);
    assert.ok(gap(found.midheaven, chart.midheaven) < tolerance, `${chart.name} Midheaven: ${found.midheaven} vs ${chart.midheaven}`);
  }
});

test("local birth time resolves through the zone's history", () => {
  const offset = (date, time, zone) => birthMoment({ date, time, zone }).offsetMinutes;
  assert.equal(offset("1985-07-01", "12:00", "Europe/Kyiv"), 240, "Kyiv kept Moscow summer time in 1985");
  assert.equal(offset("1995-07-01", "12:00", "Europe/Kyiv"), 180);
  assert.equal(offset("1970-06-01", "12:00", "Europe/London"), 60, "British Standard Time, 1968–71");
  assert.equal(offset("2021-03-14", "06:30", "America/New_York"), -240, "after the spring change, not before");
  assert.equal(offset("2021-01-10", "08:00", "Asia/Kolkata"), 330);
});

test("times the clocks skipped or repeated are reported", () => {
  const skipped = birthMoment({ date: "2021-03-14", time: "02:30", zone: "America/New_York" });
  assert.equal(skipped.status, "skipped");
  assert.equal(skipped.utc.toISOString(), "2021-03-14T07:30:00.000Z");
  const repeated = birthMoment({ date: "2021-11-07", time: "01:30", zone: "America/New_York" });
  assert.equal(repeated.status, "repeated");
  assert.equal(repeated.utc.toISOString(), "2021-11-07T05:30:00.000Z", "the earlier of the two");
  assert.equal(birthMoment({ date: "2021-06-01", time: "09:00", zone: "Europe/Kyiv" }).status, "ok");
});

test("a chart without a birth time drops the angles, houses and Moon aspects", () => {
  const chart = birthChart({ date: "1990-06-15", time: null, zone: "America/New_York", latitude: 40.71, longitude: -74.01 });
  assert.equal(chart.moment.timeKnown, false);
  assert.equal(chart.ascendant, null);
  assert.ok(chart.bodies.every((body) => body.house === undefined));
  assert.ok(chart.aspects.every((found) => found.a !== "moon" && found.b !== "moon"));
});

test("an unknown time on a day the Moon changes sign names both signs", () => {
  // The Moon entered Pisces from Aquarius on 14 June 1990 (UTC evening in New York).
  let found = null;
  for (let day = 1; day <= 28 && !found; day++) {
    const date = `1990-06-${String(day).padStart(2, "0")}`;
    const chart = birthChart({ date, time: null, zone: "America/New_York", latitude: 40.71, longitude: -74.01 });
    if (chart.moonSigns) found = chart.moonSigns;
  }
  assert.ok(found && found[0] !== found[1] && SIGNS.includes(found[0]) && SIGNS.includes(found[1]));
});

test("whole-sign houses count from the rising sign", () => {
  const chart = birthChart({ date: "1990-06-15", time: "08:00", zone: "America/New_York", latitude: 40.7128, longitude: -74.006 });
  assert.equal(chart.moment.utc.toISOString(), "1990-06-15T12:00:00.000Z");
  assert.equal(chart.ascendant.sign, "cancer");
  const sun = chart.bodies.find((body) => body.key === "sun");
  assert.equal(sun.sign, "gemini");
  assert.equal(sun.house, 12);
  assert.equal(chart.midheaven.sign, "aries");
});

test("correspondences match the deck", () => {
  const source = readFileSync(new URL("./academy/tarot-cards.ts", import.meta.url), "utf8");
  const majors = [...source.matchAll(/astrology: "([A-Za-z]+)"/g)].map((match) => match[1].toLowerCase());
  assert.equal(majors.length, 22);
  SIGNS.forEach((sign, i) => assert.equal(majors[SIGN_CARDS[i]], sign));
  for (const [body, card] of Object.entries(BODY_CARDS)) assert.equal(majors[card], body);
});

test("signs, elements and the Moon's phase", () => {
  assert.deepEqual(signOf(0), { index: 0, sign: "aries", degree: 0, element: "fire", modality: "cardinal" });
  assert.equal(signOf(359.5).sign, "pisces");
  assert.equal(signOf(95).element, "water");
  const full = moonNow(new Date("2024-02-24T12:30:00Z"));
  assert.equal(full.phase, "full");
  assert.ok(full.lit > 0.99);
  assert.ok(full.nextNew > new Date("2024-02-24T12:30:00Z"));
});
