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
