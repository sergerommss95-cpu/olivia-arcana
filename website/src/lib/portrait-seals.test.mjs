// website/src/lib/portrait-seals.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { sealsFor } from "./portrait/seals.js";
const cards = Array.from({ length: 22 }, (_, id) => ({ id, name: `Card ${id}`, thumb: `/cards/thumbs/${id}.webp` }));
const packet = { factors: [
  { id: "arkan-14", kind: "arkan", position: 14, card: 13 },
  { id: "natal-mercury", kind: "planet", body: "mercury", sign: "aquarius" },
  { id: "natal-asc", kind: "angle", angle: "asc", sign: "cancer" },
  { id: "num-lifePath", kind: "number", role: "lifePath", value: 5 },
  { id: "aspect-sun-trine-moon", kind: "aspect", a: "sun", b: "moon", aspect: "trine" },
] };
test("seals come in a fixed order and read naturally", () => {
  const s = sealsFor(["num-lifePath", "natal-asc", "arkan-14", "natal-mercury", "aspect-sun-trine-moon"], packet, "en", cards);
  assert.deepEqual(s.map((x) => x.kind), ["card", "planet", "angle", "number"]);
  assert.equal(s[0].image, "/cards/thumbs/13.webp");
  assert.match(s[1].label, /Mercury · Aquarius/);
  assert.match(s[2].label, /Rising · Cancer/);
  assert.match(s[3].label, /Life path 5/);
});
test("Ukrainian labels", () => {
  const s = sealsFor(["natal-asc", "num-lifePath"], packet, "uk", cards);
  assert.match(s[0].label, /Асцендент · Рак/);
  assert.match(s[1].label, /Життєвий шлях 5/);
});

test("Ukrainian planet and aspect labels", () => {
  const s = sealsFor(["aspect-sun-trine-moon", "natal-mercury"], packet, "uk", cards);
  assert.equal(s[0].label, "Меркурій · Водолій");
  assert.equal(s[0].glyph, "☿");
  assert.equal(s[1].label, "Сонце трин Місяць");
});
test("aspects read as a phrase; angle points use their full names", () => {
  const withAngle = { factors: [...packet.factors, { id: "aspect-venus-square-asc", kind: "aspect", a: "venus", b: "asc", aspect: "square" }] };
  const s = sealsFor(["aspect-sun-trine-moon", "aspect-venus-square-asc"], withAngle, "en", cards);
  assert.deepEqual(s.map((x) => x.label), ["Sun trine Moon", "Venus square Ascendant"]);
});
test("Midheaven in both languages", () => {
  const mc = { factors: [{ id: "natal-mc", kind: "angle", angle: "mc", sign: "aries" }] };
  assert.equal(sealsFor(["natal-mc"], mc, "en", cards)[0].label, "Midheaven · Aries");
  assert.equal(sealsFor(["natal-mc"], mc, "uk", cards)[0].label, "Середина неба · Овен");
  assert.equal(sealsFor(["natal-mc"], mc, "en", cards)[0].glyph, "MC");
});
test("refs the packet does not hold are ignored", () => {
  assert.deepEqual(sealsFor(["natal-venus", "arkan-9", "num-expression", "nonsense"], packet, "en", cards), []);
  assert.deepEqual(sealsFor(["natal-venus", "arkan-14"], packet, "en", cards).map((x) => x.key), ["arkan-14"]);
});
test("stable within a kind, capped at four, number carries its value", () => {
  const more = { factors: [...packet.factors, { id: "natal-venus", kind: "planet", body: "venus", sign: "pisces" }, { id: "arkan-1", kind: "arkan", position: 1, card: 5 }] };
  const s = sealsFor(["natal-venus", "num-lifePath", "natal-mercury", "arkan-1", "arkan-14", "arkan-14"], more, "en", cards);
  assert.deepEqual(s.map((x) => x.key), ["arkan-1", "arkan-14", "natal-venus", "natal-mercury"]);
  assert.equal(sealsFor(["num-lifePath"], packet, "en", cards)[0].value, 5);
});
test("an uncertain sign shows its alternatives", () => {
  const untimed = { factors: [{ id: "natal-moon", kind: "planet", body: "moon", sign: "aries", alternatives: ["aries", "taurus"] }] };
  assert.equal(sealsFor(["natal-moon"], untimed, "en", cards)[0].label, "Moon · Aries / Taurus");
});
