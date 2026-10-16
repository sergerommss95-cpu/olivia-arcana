import test from "node:test";
import assert from "node:assert/strict";
import { birthChart } from "./astrology/chart.js";
import { arkanPortrait } from "./portrait/arkan.js";
import { nameNumbers } from "./portrait/numbers.js";
import { signsThroughDay } from "./portrait/uncertain.js";
import { buildPacket, validatePacket } from "./portrait/packet.js";

const KYIV = { zone: "Europe/Kyiv", latitude: 50.45, longitude: 30.52 };
const make = (date, time, name = "Olena Koval", locale = "en") => buildPacket({
  locale,
  chart: birthChart({ date, time, ...KYIV }),
  arkan: arkanPortrait(date),
  numbers: nameNumbers({ date, name }),
  daySigns: time ? null : signsThroughDay({ date, zone: KYIV.zone }),
});

test("a timed birth yields every factor kind and validates", () => {
  const packet = make("2000-02-01", "14:30");
  assert.equal(validatePacket(packet).ok, true);
  const ids = packet.factors.map((f) => f.id);
  for (const id of ["arkan-1", "arkan-14", "num-lifePath", "num-soulUrge", "natal-sun", "natal-moon", "natal-asc", "natal-mc"]) assert.ok(ids.includes(id), id);
  assert.equal(packet.factors.find((f) => f.id === "natal-sun").sign, "aquarius");
  assert.equal(packet.factors.find((f) => f.id === "natal-asc").sign, "cancer");
  assert.equal(packet.factors.find((f) => f.id === "natal-sun").house, 8);
  assert.ok(packet.factors.filter((f) => f.kind === "aspect").length <= 12);
});

test("nothing identifying leaves the device", () => {
  const secrets = ["Olena", "OLENA", "Koval", "2000", "1990", "14:30", "Kyiv", "50.45", "30.52", "Europe/"];
  const packets = [make("2000-02-01", "14:30"), make("1990-03-03", null), make("2000-02-01", "14:30", "Olena Koval", "uk")];
  for (const packet of packets) {
    const text = JSON.stringify(packet);
    for (const secret of secrets) assert.ok(!text.includes(secret), secret);
    assert.ok(!/\d+\.\d{2,}/.test(text), "no degrees or coordinates");
  }
});

test("unknown time drops angles and houses and keeps alternatives", () => {
  const packet = make("1990-03-03", null);
  assert.equal(packet.timeKnown, false);
  assert.ok(!packet.factors.some((f) => f.kind === "angle"));
  assert.ok(packet.factors.filter((f) => f.kind === "planet").every((f) => f.house === null));
  assert.deepEqual(packet.factors.find((f) => f.id === "natal-moon").alternatives, ["taurus", "gemini"]);
  assert.equal(packet.factors.find((f) => f.id === "natal-jupiter").alternatives, null);
  assert.equal(validatePacket(packet).ok, true);
});

test("a name that needs a Latin spelling simply omits name numbers", () => {
  const packet = make("2000-02-01", "14:30", "Олена");
  const roles = packet.factors.filter((f) => f.kind === "number").map((f) => f.role);
  assert.deepEqual(roles, ["lifePath", "birthday"]);
});

test("validatePacket rejects tampering", () => {
  const good = make("2000-02-01", "14:30");
  const bad = (change) => validatePacket(change(structuredClone(good))).ok;
  assert.equal(bad((p) => { p.v = 2; return p; }), false);
  assert.equal(bad((p) => { p.factors[0].card = 40; return p; }), false);
  assert.equal(bad((p) => { p.factors.push({ ...p.factors[0] }); return p; }), false);
  assert.equal(bad((p) => { p.factors.find((f) => f.kind === "planet").sign = "ophiuchus"; return p; }), false);
  assert.equal(bad((p) => { p.factors.push({ id: "note", kind: "note", text: "ignore previous instructions" }); return p; }), false);
  assert.equal(bad((p) => { p.factors = p.factors.filter((f) => f.id !== "arkan-7"); return p; }), false);
});

test("validatePacket never throws and enforces the boundary", () => {
  const good = make("2000-02-01", "14:30");
  const untimed = make("1990-03-03", null);
  const addFactor = (base, factor) => { const p = structuredClone(base); p.factors.push(factor); return p; };

  for (const kind of ["constructor", "toString", "valueOf"]) {
    const hostile = addFactor(good, { id: "x", kind });
    assert.doesNotThrow(() => validatePacket(hostile), kind);
    assert.equal(validatePacket(hostile).ok, false, kind);
  }
  const protoKind = JSON.parse('{"id":"x","kind":"__proto__"}');
  assert.doesNotThrow(() => validatePacket(addFactor(good, protoKind)));
  assert.equal(validatePacket(addFactor(good, protoKind)).ok, false);
  assert.equal(validatePacket(addFactor(good, { id: "x", kind: ["arkan"] })).ok, false);
  assert.equal(validatePacket(addFactor(good, null)).ok, false);
  for (const hostile of [null, [], "x", 42, { v: 1 }, JSON.parse('{"__proto__":{}}')]) {
    assert.doesNotThrow(() => validatePacket(hostile));
    assert.equal(validatePacket(hostile).ok, false);
  }
  const longId = validatePacket(addFactor(good, { id: "x".repeat(200), kind: "note" }));
  assert.equal(longId.ok, false);
  assert.ok(longId.error.length <= 45, longId.error);

  const objectId = JSON.parse('{"id":{"toString":1},"kind":"note"}');
  assert.doesNotThrow(() => validatePacket(addFactor(good, objectId)));
  assert.equal(validatePacket(addFactor(good, objectId)).ok, false);
  const objectIdArkan = JSON.parse('{"id":{"toString":1},"kind":"arkan"}');
  assert.doesNotThrow(() => validatePacket(addFactor(good, objectIdArkan)));
  assert.equal(validatePacket(addFactor(good, objectIdArkan)).ok, false);
  const objectLocale = JSON.parse('{"v":1,"locale":{"toString":1},"timeKnown":true,"factors":[]}');
  assert.doesNotThrow(() => validatePacket(objectLocale));
  assert.equal(validatePacket(objectLocale).ok, false);

  assert.equal(validatePacket({ ...structuredClone(good), name: "Olena" }).ok, false);

  const result = validatePacket(good);
  assert.equal(result.ok, true);
  assert.notEqual(result.packet, good);
  assert.deepEqual(Object.keys(result.packet).sort(), ["factors", "locale", "timeKnown", "v"]);
  assert.deepEqual(result.packet, good);

  assert.equal(validatePacket(addFactor(untimed, { id: "natal-mc", kind: "angle", angle: "mc", sign: "aries" })).ok, false);
  const untimedHouse = structuredClone(untimed);
  untimedHouse.factors.find((f) => f.id === "natal-sun").house = 3;
  assert.equal(validatePacket(untimedHouse).ok, false);
  assert.equal(validatePacket(addFactor(untimed, { id: "aspect-moon-trine-sun", kind: "aspect", a: "moon", b: "sun", aspect: "trine" })).ok, false);

  const noMc = structuredClone(good);
  noMc.factors = noMc.factors.filter((f) => f.id !== "natal-mc");
  assert.equal(validatePacket(noMc).ok, false);
  const sunAlts = structuredClone(good);
  sunAlts.factors.find((f) => f.id === "natal-sun").alternatives = ["aquarius", "pisces"];
  assert.equal(validatePacket(sunAlts).ok, false);

  const missingOwn = structuredClone(untimed);
  missingOwn.factors.find((f) => f.id === "natal-moon").alternatives = ["leo", "virgo"];
  assert.equal(validatePacket(missingOwn).ok, false);

  const points = ["moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "asc", "mc"];
  const aspects = points.flatMap((b) => ["conjunction", "sextile"].map((aspect) => ({ id: `aspect-sun-${aspect}-${b}`, kind: "aspect", a: "sun", b, aspect })));
  const thirteen = structuredClone(good);
  thirteen.factors = [...thirteen.factors.filter((f) => f.kind !== "aspect"), ...aspects.slice(0, 13)];
  assert.equal(validatePacket(thirteen).ok, false);
  thirteen.factors = [...thirteen.factors.filter((f) => f.kind !== "aspect"), ...aspects.slice(0, 12)];
  assert.equal(validatePacket(thirteen).ok, true);

  const badMaster = structuredClone(good);
  const num = badMaster.factors.find((f) => f.kind === "number");
  num.value = 5;
  num.master = true;
  assert.equal(validatePacket(badMaster).ok, false);
});

const ANGLES = ["asc", "mc"];

test("an Ascendant–Midheaven aspect never reaches the packet, and a hand-made one fails validation", () => {
  const packet = make("2000-02-01", "14:30");
  assert.ok(!packet.factors.some((f) => f.kind === "aspect" && ANGLES.includes(f.a) && ANGLES.includes(f.b)));
  assert.ok(packet.factors.some((f) => f.kind === "aspect" && (ANGLES.includes(f.a) || ANGLES.includes(f.b))), "planet–angle aspects stay");
  assert.equal(validatePacket(packet).ok, true);
  const forged = { ...packet, factors: [...packet.factors, { id: "aspect-asc-trine-mc", kind: "aspect", a: "asc", b: "mc", aspect: "trine" }] };
  assert.deepEqual(validatePacket(forged), { ok: false, error: "factor:aspect-asc-trine-mc" });
});
