// website/netlify/portrait/validate.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { validateStage } from "./validate.ts";
import { stageSchema } from "./schema.ts";
import { focusFor } from "./plan.ts";

const packet = {
  v: 1, locale: "en", timeKnown: false,
  factors: [
    { id: "arkan-4", kind: "arkan", position: 4, card: 3 },
    { id: "natal-moon", kind: "planet", body: "moon", sign: "taurus", house: null, retrograde: false, alternatives: ["taurus", "gemini"] },
    { id: "natal-sun", kind: "planet", body: "sun", sign: "pisces", house: null, retrograde: false, alternatives: null },
    { id: "num-soulUrge", kind: "number", role: "soulUrge", value: 1, master: false },
  ],
};
const teachings = [{ id: "card-4-risk", factors: ["arkan-4"], label: "", text: "", sources: [] }];
const words = (n) => Array.from({ length: n }, (_, i) => (i % 7 === 0 ? "steady" : "word")).join(" ") + ".";
const passage = (refs, text = words(60)) => ({ text, refs, teachings: ["card-4-risk"] });
const stageA = () => ({
  title: "A Quiet Engine", epigraph: "You build the room before you invite anyone in.",
  overview: passage(["natal-sun", "arkan-4"], words(90)),
  facets: {
    temperament: { heading: "How you meet things", ...passage(["natal-sun"]) },
    inner: { heading: "What you need", ...passage(["natal-moon"], `If your Moon is in Taurus, ${words(30)} If it is in Gemini, ${words(25)}`) },
    gifts: { heading: "What you can do", ...passage(["arkan-4"]) },
    bonds: { heading: "How you love", ...passage(["num-soulUrge"]) },
    direction: { heading: "Where you are going", ...passage(["arkan-4"]) },
  },
});

test("a well-formed stage passes", () => {
  assert.deepEqual(validateStage("a", stageA(), packet, teachings), { ok: true });
});

test("unknown references are rejected", () => {
  const data = stageA();
  data.facets.gifts.refs = ["natal-venus"];
  const result = validateStage("a", data, packet, teachings);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("natal-venus")));
});

test("an uncertain factor must stay conditional in the text itself", () => {
  const data = stageA();
  data.facets.inner.text = `Your Moon in Taurus wants slow comfort. ${words(50)}`;
  const result = validateStage("a", data, packet, teachings);
  assert.ok(result.errors.some((e) => e.startsWith("uncertain:inner")));
});

test("diagnosis and fate language is refused", () => {
  const data = stageA();
  data.overview.text = `You are destined to suffer from depression. ${words(80)}`;
  const result = validateStage("a", data, packet, teachings);
  assert.ok(result.errors.some((e) => e.startsWith("unsafe:overview")));
});

test("length limits apply", () => {
  const data = stageA();
  data.facets.bonds.text = "Too short.";
  assert.ok(validateStage("a", data, packet, teachings).errors.some((e) => e.startsWith("length:bonds")));
});

test("schemas restrict ids to the packet and teachings", () => {
  const schema = stageSchema("a", ["natal-sun"], ["card-4-risk"]);
  assert.deepEqual(schema.properties.overview.properties.refs.items.enum, ["natal-sun"]);
  assert.equal(schema.additionalProperties, false);
  const c = stageSchema("c", ["natal-sun"], ["card-4-risk"]);
  assert.deepEqual(Object.keys(c.properties.chapters.properties), ["shadow", "love", "becoming"]);
});

test("focus lists only name factors that exist", () => {
  assert.deepEqual(focusFor("inner", packet), ["natal-moon", "num-soulUrge", "arkan-4"]);
});

test("Ukrainian locative sign names count as naming each alternative", () => {
  const ukPacket = { ...packet, locale: "uk", factors: packet.factors.map((f) => (f.id === "natal-moon" ? { ...f, alternatives: ["aries", "taurus"] } : f)) };
  const data = stageA();
  data.facets.inner.text = `Якщо ваш Місяць в Овні, ${words(30)} якщо в Тельці, ${words(25)}`;
  const { errors = [] } = validateStage("a", data, ukPacket, teachings);
  assert.equal(errors.some((e) => e.startsWith("uncertain:")), false);
});
