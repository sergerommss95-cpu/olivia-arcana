// website/src/lib/portrait-why.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { explain, foundLine, ordinal, teachingFactor, ukIn } from "./portrait/why.js";

const cards = Array.from({ length: 22 }, (_, id) => ({ id, name: `Card ${id}` }));
const packet = { factors: [
  { id: "arkan-1", kind: "arkan", position: 1, card: 1 },
  { id: "arkan-4", kind: "arkan", position: 4, card: 3 },
  { id: "arkan-13", kind: "arkan", position: 13, card: 8 },
  { id: "num-lifePath", kind: "number", role: "lifePath", value: 5, master: false },
  { id: "num-expression", kind: "number", role: "expression", value: 11, master: true },
  { id: "natal-sun", kind: "planet", body: "sun", sign: "taurus", house: 1, retrograde: false, alternatives: null },
  { id: "natal-mercury", kind: "planet", body: "mercury", sign: "aquarius", house: 8, retrograde: true, alternatives: null },
  { id: "natal-mars", kind: "planet", body: "mars", sign: "aries", house: 12, retrograde: false, alternatives: null },
  { id: "natal-asc", kind: "angle", angle: "asc", sign: "cancer" },
  { id: "natal-mc", kind: "angle", angle: "mc", sign: "pisces" },
  { id: "aspect-sun-trine-moon", kind: "aspect", a: "sun", b: "moon", aspect: "trine" },
  { id: "aspect-mars-conjunction-mc", kind: "aspect", a: "mars", b: "mc", aspect: "conjunction" },
] };
const untimed = { factors: [
  { id: "natal-moon", kind: "planet", body: "moon", sign: "taurus", house: null, retrograde: false, alternatives: ["taurus", "gemini"] },
  { id: "natal-venus", kind: "planet", body: "venus", sign: "aries", house: null, retrograde: false, alternatives: ["pisces", "aries", "taurus"] },
] };
const all = { refs: packet.factors.map((f) => f.id), teachings: [] };

/** The lines hold no-break spaces so a sum never splits; compared here with plain ones. */
const plain = (s) => s.replace(/\u00a0/g, " ");

test("how each card was found", () => {
  assert.equal(plain(foundLine(4, "en")), "Position 4 · from cards 1 + 2");
  assert.equal(plain(foundLine(13, "en")), "Position 13 · from cards 1 + 4 + 6");
  assert.equal(plain(foundLine(2, "en")), "Position 2 · from your birth date");
  assert.equal(plain(foundLine(4, "uk")), "Позиція 4 · з карт 1 + 2");
  assert.equal(plain(foundLine(3, "uk")), "Позиція 3 · з вашої дати народження");
  assert.match(foundLine(13, "en"), /^Position\u00a013 · from\u00a0cards\u00a01\u00a0\+\u00a04\u00a0\+\u00a06$/);
});

test("cards come in reading order with their role, name and the cards they came from", () => {
  const { cards: lines } = explain({ refs: ["arkan-13", "arkan-1", "arkan-4", "arkan-9"], teachings: [] }, packet, "en", cards, {});
  assert.deepEqual(lines.map((c) => c.pos), [1, 4, 13]);
  assert.deepEqual({ ...lines[1], found: plain(lines[1].found) }, { key: "arkan-4", pos: 4, card: 3, role: "Inner tension", name: "Card 3", from: [1, 2], found: "Position 4 · from cards 1 + 2" });
  assert.deepEqual(lines[0].from, []);
  assert.equal(explain({ refs: ["arkan-4"], teachings: [] }, packet, "uk", cards, {}).cards[0].role, "Внутрішня напруга");
});

test("numbers name their role and value; a master number is marked", () => {
  const { numbers } = explain({ refs: ["num-expression", "num-lifePath"], teachings: [] }, packet, "en", cards, {});
  assert.deepEqual(numbers.map((n) => n.text), ["Life path 5", "Expression 11"]);
  assert.deepEqual(numbers.map((n) => n.master), [false, true]);
  assert.equal(explain({ refs: ["num-lifePath"], teachings: [] }, packet, "uk", cards, {}).numbers[0].text, "Життєвий шлях 5");
});

test("planets read with their sign and house, angles after them", () => {
  const { sky } = explain(all, packet, "en", cards, {});
  assert.deepEqual(sky.map((s) => s.text), ["Sun in Taurus, 1st house", "Mercury in Aquarius, 8th house", "Mars in Aries, 12th house", "Cancer rising", "Midheaven in Pisces"]);
  assert.deepEqual(sky.map((s) => s.retrograde), [false, true, false, false, false]);
  assert.equal(sky[1].glyph, "☿");
});

test("Ukrainian places a planet in the locative, with у or в as the words ask", () => {
  const { sky } = explain(all, packet, "uk", cards, {});
  assert.deepEqual(sky.map((s) => s.text), ["Сонце в Тельці, 1-й дім", "Меркурій у Водолії, 8-й дім", "Марс в Овні, 12-й дім", "Асцендент у Раку", "Середина неба в Рибах"]);
  assert.equal(ukIn("Сонце", "Водолії"), "у");
  assert.equal(ukIn("Місяць", "Тельці"), "у");
  assert.equal(ukIn("Венера", "Раку"), "в");
});

test("without a birth time an uncertain sign reads as either", () => {
  const { sky } = explain({ refs: ["natal-moon", "natal-venus"], teachings: [] }, untimed, "en", cards, {});
  assert.deepEqual(sky.map((s) => s.text), ["Moon in Taurus or Gemini", "Venus in Pisces, Aries or Taurus"]);
  assert.ok(sky.every((s) => s.uncertain));
  const uk = explain({ refs: ["natal-moon", "natal-venus"], teachings: [] }, untimed, "uk", cards, {}).sky;
  assert.deepEqual(uk.map((s) => s.text), ["Місяць у Тельці або Близнюках", "Венера в Рибах, Овні або Тельці"]);
});

test("aspects read as a phrase", () => {
  const { aspects } = explain(all, packet, "en", cards, {});
  assert.deepEqual(aspects.map((a) => a.text), ["Sun trine Moon", "Mars conjunction Midheaven"]);
  assert.equal(aspects[0].glyph, "△");
  assert.equal(explain(all, packet, "uk", cards, {}).aspects[0].text, "Сонце трин Місяць");
});

test("teachings: only those held, grouped cards → numbers → sky → aspects, as cited within a group", () => {
  const held = Object.fromEntries(["aspect-sun-trine-moon", "natal-mercury-sign", "num-lifePath-essence", "card-4-risk", "card-1-frame", "natal-mercury-house"].map((id) => [id, {}]));
  const passage = { refs: [], teachings: ["aspect-sun-trine-moon", "natal-mercury-sign", "missing-one", "num-lifePath-essence", "card-4-risk", "natal-mercury-house", "card-1-frame", "card-4-risk"] };
  assert.deepEqual(explain(passage, packet, "en", cards, held).teachings, ["card-4-risk", "card-1-frame", "num-lifePath-essence", "natal-mercury-sign", "natal-mercury-house", "aspect-sun-trine-moon"]);
});

test("a teaching names its factor", () => {
  assert.equal(teachingFactor("card-12-inner"), "arkan-12");
  assert.equal(teachingFactor("num-soulUrge-relationships"), "num-soulUrge");
  assert.equal(teachingFactor("natal-moon-sign-taurus"), "natal-moon");
  assert.equal(teachingFactor("natal-asc-sign"), "natal-asc");
  assert.equal(teachingFactor("aspect-mars-conjunction-mc"), "aspect-mars-conjunction-mc");
});

test("ordinals", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 21, 22].map(ordinal), ["1st", "2nd", "3rd", "4th", "11th", "12th", "21st", "22nd"]);
});

test("an empty passage or packet explains nothing and never throws", () => {
  assert.deepEqual(explain({ refs: ["arkan-4"], teachings: ["card-4-risk"] }, { factors: [] }, "en", cards, {}), { cards: [], numbers: [], sky: [], aspects: [], teachings: [] });
  assert.deepEqual(explain(undefined, undefined, "en", cards, undefined), { cards: [], numbers: [], sky: [], aspects: [], teachings: [] });
});
