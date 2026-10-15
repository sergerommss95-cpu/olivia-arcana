// website/netlify/portrait/teachings.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { birthChart } from "../../src/lib/astrology/chart.js";
import { arkanPortrait } from "../../src/lib/portrait/arkan.js";
import { nameNumbers } from "../../src/lib/portrait/numbers.js";
import { signsThroughDay } from "../../src/lib/portrait/uncertain.js";
import { buildPacket } from "../../src/lib/portrait/packet.js";
import { selectTeachings } from "./teachings.ts";

const bank = JSON.parse(await readFile(new URL("./knowledge/bank.json", import.meta.url), "utf8"));
const KYIV = { zone: "Europe/Kyiv", latitude: 50.45, longitude: 30.52 };
const packetFor = (date, time, locale = "en") => buildPacket({ locale, chart: birthChart({ date, time, ...KYIV }), arkan: arkanPortrait(date), numbers: nameNumbers({ date, name: "Olena Koval" }), daySigns: time ? null : signsThroughDay({ date, zone: KYIV.zone }) });

test("the bank covers every card, number, sign and personal planet", () => {
  assert.equal(Object.keys(bank.cards).length, 22);
  for (const role of ["lifePath", "expression", "soulUrge", "personality"]) assert.ok(bank.numbers[role]["11"].essence.en.length > 20, role);
  assert.equal(Object.keys(bank.personal.venus).length, 12);
  assert.ok(bank.cards["9"].strength.uk.length > 20);
});

test("each Arkan position gets the fields that fit its role", () => {
  const ids = selectTeachings(packetFor("2000-02-01", "14:30"), bank).map((t) => t.id);
  assert.ok(ids.includes("card-4-risk"));
  assert.ok(ids.includes("card-8-strength"));
  assert.ok(!ids.includes("card-4-strength"));
  assert.ok(ids.includes("num-soulUrge-innerWorld"));
  assert.ok(ids.includes("natal-venus-sign"));
  assert.ok(ids.includes("natal-sun-house"));
});

test("teachings carry their factor, readable text and a source", () => {
  const teachings = selectTeachings(packetFor("2000-02-01", "14:30", "uk"), bank);
  for (const t of teachings) {
    assert.ok(t.factors.length >= 1, t.id);
    assert.ok(t.text.length > 20, t.id);
    assert.ok(t.sources.length >= 1, t.id);
    assert.ok(t.sources.every((s) => bank.sources[s]), t.id);
  }
  const card = teachings.find((t) => t.id === "card-1-character");
  assert.match(card.text, /[а-яіїєґ]/i);
});

test("unknown time gives each alternative sign its own teaching and no houses", () => {
  const teachings = selectTeachings(packetFor("1990-03-03", null), bank);
  const ids = teachings.map((t) => t.id);
  assert.ok(ids.includes("natal-moon-sign-taurus") && ids.includes("natal-moon-sign-gemini"));
  assert.ok(!ids.some((id) => id.endsWith("-house")));
});

const TIMED = () => packetFor("2000-02-01", "14:30");
const UNTIMED_UK = () => packetFor("1990-03-03", null, "uk");
const numberFactor = (role, value) => ({ id: `num-${role}`, kind: "number", role, value, master: value > 9 });

test("teaching ids are unique, timed and untimed", () => {
  for (const packet of [TIMED(), UNTIMED_UK()]) {
    const ids = selectTeachings(packet, bank).map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, ids.filter((id, i) => ids.indexOf(id) !== i).join(","));
  }
});

test("fields that do not fit a role are left out", () => {
  const ids = selectTeachings(TIMED(), bank).map((t) => t.id);
  assert.ok(!ids.includes("num-lifePath-innerWorld"));
  assert.ok(!ids.includes("card-5-choice"));
  assert.ok(ids.includes("card-5-character") && ids.includes("card-5-growth"));
});

test("labels name the role and the planet in the reader's language", () => {
  const TITLES = { en: { lifePath: "Life path", expression: "Expression", soulUrge: "Inner motivation", personality: "Outward personality" }, uk: { lifePath: "Життєвий шлях", expression: "Вираження", soulUrge: "Внутрішній мотив", personality: "Зовнішній прояв" } };
  for (const locale of ["en", "uk"]) {
    for (const packet of [packetFor("2000-02-01", "14:30", locale), packetFor("1990-03-03", null, locale)]) {
      for (const t of selectTeachings(packet, bank)) {
        const number = /^num-(lifePath|expression|soulUrge|personality)-(\w+)$/.exec(t.id);
        if (number) {
          const title = TITLES[locale][number[1]];
          assert.ok(t.label.startsWith(number[2] === "role" ? `${title} · ` : `${title} `), `${locale} ${t.id}: ${t.label}`);
          assert.doesNotMatch(t.label, /\b(lifePath|soulUrge)\b/, t.id);
        } else {
          // Outside number labels, no raw role key may appear at all.
          assert.doesNotMatch(t.label, /\b(lifePath|soulUrge|expression|personality)\b/, `${locale} ${t.id}: ${t.label}`);
        }
      }
    }
  }
});

test("house teachings name their planet, so two planets in one house read differently", () => {
  let shared = null;
  for (const date of ["2000-02-01", "1985-07-12", "1992-11-23", "1978-05-05", "2005-09-30"]) {
    const packet = packetFor(date, "14:30");
    const byHouse = {};
    for (const f of packet.factors.filter((f) => f.kind === "planet")) (byHouse[f.house] ??= []).push(f.body);
    const crowded = Object.values(byHouse).find((bodies) => bodies.length >= 2);
    if (crowded) { shared = { packet, bodies: crowded }; break; }
  }
  assert.ok(shared, "no sample birth has two planets in one house");
  const teachings = selectTeachings(shared.packet, bank);
  const labels = shared.bodies.map((body) => teachings.find((t) => t.id === `natal-${body}-house`).label);
  assert.equal(new Set(labels).size, labels.length, labels.join(" | "));
  shared.bodies.forEach((body, i) => assert.ok(labels[i].startsWith(`${bank.planets[body].name.en} · `), labels[i]));
});

test("sources match the passage: personal planets cite their function and sign, numbers cite the check sources", () => {
  const teachings = selectTeachings(TIMED(), bank);
  const venus = teachings.find((t) => t.id === "natal-venus-sign");
  assert.equal(venus.sources.length, 2);
  assert.equal(venus.sources[0], "v18-natal-function-venus");
  assert.match(venus.sources[1], /^v18-natal-style-[a-z]+$/);
  const sun = teachings.find((t) => t.id === "natal-sun-sign");
  assert.deepEqual(sun.sources, ["astrodienst-intro"]);

  const sourcesOf = (value) => selectTeachings({ locale: "en", factors: [numberFactor("lifePath", value)] }, bank).find((t) => t.id === "num-lifePath-essence").sources;
  assert.deepEqual(sourcesOf(4), ["v15-num-roles", "v15-num-check-roles", "v15-num-4"]);
  for (const master of [11, 22, 33]) assert.deepEqual(sourcesOf(master), ["v15-num-roles", "v15-num-check-roles", `v15-num-${master}`, "v15-num-check-masters"]);
});

test("a source missing from the bank is an error, never silently dropped", () => {
  const withoutSources = { ...bank, sources: {} };
  assert.throws(() => selectTeachings(TIMED(), withoutSources), /unknown_source:/);
  const { "v15-num-check-roles": _gone, ...rest } = bank.sources;
  assert.throws(() => selectTeachings({ locale: "en", factors: [numberFactor("lifePath", 4)] }, { ...bank, sources: rest }), /unknown_source:v15-num-check-roles/);
});
