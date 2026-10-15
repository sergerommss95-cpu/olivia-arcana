// website/netlify/portrait/validate.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { validateStage, unsafeMatches } from "./validate.ts";
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
/** The shared packet, with natal-moon's alternative signs replaced. */
const withMoon = (alternatives, locale = "en") => ({ ...packet, locale, factors: packet.factors.map((f) => (f.id === "natal-moon" ? { ...f, alternatives } : f)) });
const chapter = (refs) => ({
  title: "Mind at Work", lede: "Your mind settles when a question has a clear edge.",
  paragraphs: [words(60), words(60)], practice: "Write one plain sentence each morning before you check messages.", refs, teachings: ["card-4-risk"],
});
const stageB = () => ({ chapters: { mind: chapter(["natal-sun"]), heart: chapter(["num-soulUrge"]), work: chapter(["natal-sun"]) } });
const stageC = () => ({
  chapters: { shadow: chapter(["arkan-4"]), love: chapter(["num-soulUrge"]), becoming: chapter(["natal-sun"]) },
  keep: ["Rest is part of the work.", "Small steps still count.", "Ask for help before it is late."],
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
  const data = stageA();
  data.facets.inner.text = `Якщо ваш Місяць в Овні, ${words(30)} якщо в Тельці, ${words(25)}`;
  const { errors = [] } = validateStage("a", data, withMoon(["aries", "taurus"], "uk"), teachings);
  assert.equal(errors.some((e) => e.startsWith("uncertain:")), false);
});

test("Ukrainian nominative names count, and only the new stems match them", () => {
  const data = stageA();
  data.facets.inner.text = `Овен — це вогонь, ${words(30)} Телець — це земля, ${words(25)}`;
  const { errors = [] } = validateStage("a", data, withMoon(["aries", "taurus"], "uk"), teachings);
  assert.equal(errors.some((e) => e.startsWith("uncertain:")), false);
});

test("Ukrainian nominative names for Sagittarius and Capricorn count", () => {
  const data = stageA();
  data.facets.inner.text = `Стрілець — це вогонь, ${words(30)} Козеріг — це земля, ${words(25)}`;
  const { errors = [] } = validateStage("a", data, withMoon(["sagittarius", "capricorn"], "uk"), teachings);
  assert.equal(errors.some((e) => e.startsWith("uncertain:")), false);
});

test("a Ukrainian word that only contains a sign stem does not name it", () => {
  const data = stageA();
  data.facets.inner.text = `Ваш характер міцний, ${words(30)} Лев у вас сильний, ${words(25)}`;
  const result = validateStage("a", data, withMoon(["cancer", "leo"], "uk"), teachings);
  assert.ok(result.errors.includes("uncertain:inner:natal-moon"));
});

test("an English word that only contains a sign name does not name it", () => {
  const data = stageA();
  data.facets.inner.text = `It varies week to week. Your Moon in Taurus wants slow comfort. ${words(50)}`;
  const result = validateStage("a", data, withMoon(["aries", "taurus"]), teachings);
  assert.ok(result.errors.includes("uncertain:inner:natal-moon"));
});

test("headings and chapter titles are checked for unsafe claims", () => {
  const data = stageA();
  data.facets.temperament.heading = "Your fate with money";
  const a = validateStage("a", data, packet, teachings);
  assert.ok(a.errors.includes('unsafe:temperament:heading:"Your fate"'));
  const b = stageB();
  b.chapters.mind.title = "Your depression and death";
  assert.ok(validateStage("b", b, packet, teachings).errors.some((e) => e.startsWith("unsafe:mind:title")));
});

test("unsafe claims in English and Ukrainian are flagged", () => {
  const flagged = [
    "You'll die alone", "You are going to marry a stranger", "You will become wealthy", "traumatic childhood",
    "Вас чекає ваша смерть", "Ви розбагатієте", "Це ваша доля", "Вам гарантовано успіх",
  ];
  for (const text of flagged) assert.ok(unsafeMatches(text).length > 0, text);
});

test("ordinary words that resemble unsafe claims are not flagged", () => {
  const plain = ["No one can guarantee how a choice will turn out.", "The Death card speaks of endings.", "a wealth of ideas", "характер розладнує плани"];
  for (const text of plain) assert.deepEqual(unsafeMatches(text), [], text);
});

test("stage B: valid chapters pass; one paragraph is a count error", () => {
  assert.deepEqual(validateStage("b", stageB(), packet, teachings), { ok: true });
  const data = stageB();
  data.chapters.mind.paragraphs = [words(60)];
  assert.ok(validateStage("b", data, packet, teachings).errors.includes("count:mind:paragraphs"));
});

test("stage C: keep must be exactly three lines", () => {
  assert.deepEqual(validateStage("c", stageC(), packet, teachings), { ok: true });
  const data = stageC();
  data.keep = data.keep.slice(0, 2);
  assert.ok(validateStage("c", data, packet, teachings).errors.includes("count:keep"));
});

test("an empty id list still yields a valid enum, and the validator rejects its empty string", () => {
  const schema = stageSchema("a", [], []);
  assert.deepEqual(schema.properties.overview.properties.refs.items.enum, [""]);
  assert.deepEqual(schema.properties.overview.properties.teachings.items.enum, [""]);
  const data = stageA();
  data.overview.teachings = [""];
  assert.ok(validateStage("a", data, packet, []).errors.includes("teachings:overview:"));
});

test("malformed model output is refused, never thrown", () => {
  const a = stageA();
  a.overview = { text: "x", refs: "natal-sun", teachings: null };
  a.facets.temperament = { heading: "x", text: words(60), refs: "natal-sun", teachings: null };
  assert.equal(validateStage("a", a, packet, teachings).ok, false);
  assert.equal(validateStage("a", null, packet, teachings).ok, false);
  const b = { chapters: { mind: { title: 1, lede: null, paragraphs: "no", practice: 3, refs: null, teachings: null } } };
  assert.equal(validateStage("b", b, packet, teachings).ok, false);
  assert.equal(validateStage("c", { chapters: null, keep: "x" }, packet, teachings).ok, false);
});
