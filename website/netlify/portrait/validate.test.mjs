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
// Fresh letter-only words on every call (waaa, waab, ...): no six-word run repeats anywhere in a fixture, and none is a hedge or a banned phrase.
let seq = 0;
const word = (n) => "w" + [2, 1, 0].map((k) => String.fromCharCode(97 + (Math.floor(n / 26 ** k) % 26))).join("");
const words = (n) => Array.from({ length: n }, () => word(seq++)).join(" ") + ".";
const passage = (refs, text = words(60)) => ({ text, refs, teachings: ["card-4-risk"] });
const outline = () => ({
  mind: "How your attention picks what matters and lets the rest go.",
  heart: "What you need to feel safe enough to let someone close.",
  work: "The kind of effort you can sustain and where it pays off.",
  shadow: "The habit that protects you now and costs you later on.",
  love: "How you give affection and what you ask for in return.",
  becoming: "The direction your next few years keep pointing you toward.",
});
const stageA = () => ({
  title: "A Quiet Engine", epigraph: "You build the room before you invite anyone in.",
  outline: outline(),
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

test("heart, love and bonds no longer share their focus", () => {
  const full = { factors: ["natal-moon", "natal-venus", "natal-mars", "natal-asc", "num-soulUrge", "num-personality", "arkan-4", "arkan-12", "arkan-13", "arkan-14"].map((id) => ({ id })) };
  assert.deepEqual(focusFor("heart", full), ["natal-moon", "num-soulUrge", "arkan-12", "arkan-13", "arkan-4"]);
  assert.deepEqual(focusFor("love", full), ["natal-venus", "natal-mars", "arkan-14", "num-personality", "natal-asc"]);
  assert.deepEqual(focusFor("bonds", full), ["natal-venus", "arkan-14", "num-soulUrge", "num-personality", "natal-moon"]);
});

test("the opening plans one angle per later chapter", () => {
  const schema = stageSchema("a", ["natal-sun"], ["card-4-risk"]);
  assert.deepEqual(Object.keys(schema.properties.outline.properties), ["mind", "heart", "work", "shadow", "love", "becoming"]);
  assert.ok(schema.required.includes("outline"));
  assert.deepEqual(validateStage("a", stageA(), packet, teachings), { ok: true });
});

test("an opening without an outline is refused", () => {
  const data = stageA();
  delete data.outline;
  assert.ok(validateStage("a", data, packet, teachings).errors.includes("missing:outline"));
});

test("an outline missing one chapter is refused for that chapter", () => {
  const data = stageA();
  delete data.outline.work;
  assert.ok(validateStage("a", data, packet, teachings).errors.includes("missing:outline:work"));
});

test("two chapters planned with the same angle are refused, even if case and spacing differ", () => {
  const data = stageA();
  data.outline.love = `  ${data.outline.heart.toUpperCase()} `;
  assert.ok(validateStage("a", data, packet, teachings).errors.includes("outline:duplicate"));
  assert.equal(validateStage("a", stageA(), packet, teachings).ok, true);
});

test("an outline line outside 20-200 characters is a length error", () => {
  const short = stageA();
  short.outline.mind = "Too short now.";
  assert.ok(validateStage("a", short, packet, teachings).errors.includes("length:outline:mind"));
  const long = stageA();
  long.outline.becoming = "x".repeat(201);
  assert.ok(validateStage("a", long, packet, teachings).errors.includes("length:outline:becoming"));
});

test("unsafe text in an outline line is flagged, and an outline is not held to passage rules", () => {
  const data = stageA();
  data.outline.shadow = "Why you are destined to repeat the same old pattern again.";
  assert.ok(validateStage("a", data, packet, teachings).errors.some((e) => e.startsWith("unsafe:outline:shadow:")));
  // no refs, teachings or focus are asked of an outline
  assert.deepEqual(validateStage("a", stageA(), packet, teachings), { ok: true });
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

test("Ukrainian Cancer counts in its locative, Місяць у Раці, and in its other cases, but a word that only starts like it does not", () => {
  const names = (text) => {
    const data = stageA();
    data.facets.inner.text = text;
    const { errors = [] } = validateStage("a", data, withMoon(["cancer", "leo"], "uk"), teachings);
    return !errors.includes("uncertain:inner:natal-moon");
  };
  const leo = `якщо у Леві, ${words(25)}`;
  for (const form of ["Рак", "Раку", "Раком", "Ракові", "Раці"]) assert.ok(names(`Якщо ваш Місяць у ${form}, ${words(30)} ${leo}`), form);
  assert.ok(names(`Місяць у Раці, ${words(30)} ${leo}`));
  assert.equal(names(`Місяць у Ракеті, ${words(30)} ${leo}`), false);
  assert.equal(names(`Місяць у Раковині, ${words(30)} ${leo}`), false);
});

test("a promise of death, marriage or money is flagged, but a word that only starts like one is not", () => {
  for (const text of ["You will get rich", "You'll get wealthy one day", "you are going to get rich", "You'll die", "You will die."]) assert.ok(unsafeMatches(text).length > 0, text);
  for (const text of ["you'll diet", "You will diet for a while", "you will marry-in the new habit"]) {
    // a hyphen ends the word, so only the last is still a promise to marry
    assert.equal(unsafeMatches(text).length > 0, text.includes("marry-in"), text);
  }
  // "become rich" is followed by a space, so a boundary cannot tell "rich in friends" from "rich": it stays flagged, the safe side.
  assert.ok(unsafeMatches("you will become rich in friends").length > 0);
});

test("the opening's title, epigraph, overview, facets and headings are style-checked", () => {
  const data = stageA();
  data.title = "A Healing Journey Begins";
  data.epigraph = "Perhaps you build the room before you invite anyone in.";
  data.overview.text = `You probably keep everything in order. ${words(90)}`;
  data.facets.temperament.heading = "Your symbolic style";
  data.facets.inner.text = `You hold a quiet line. It may cost you rest and you might not notice. ${words(40)}`;
  const { errors } = validateStage("a", data, packet, teachings);
  for (const code of ['phrase:title:"Healing"', "hedge-lead:epigraph", "hedge-lead:overview", 'phrase:temperament:heading:"symbolic"', "hedges:inner:2"]) {
    assert.ok(errors.some((e) => e.toLowerCase().startsWith(code.toLowerCase())), `${code} in ${errors}`);
  }
});

test("a chapter's title, lede, paragraphs and practice are each style-checked", () => {
  const data = stageB();
  const mind = data.chapters.mind;
  mind.title = "Your healing mind";
  mind.lede = "Perhaps your mind settles when a question has a clear edge.";
  mind.paragraphs = [`You may think it might help. ${words(50)}`, words(60)];
  mind.practice = "Embrace one plain sentence each morning before you check messages.";
  const { errors } = validateStage("b", data, packet, teachings);
  for (const code of ["phrase:mind:title", "hedge-lead:mind:lede", "hedges:mind:p0:2", "phrase:mind:practice"]) assert.ok(errors.some((e) => e.startsWith(code)), `${code} in ${errors}`);
  assert.equal(errors.some((e) => e.startsWith("hedges:mind:p1")), false);
});

test("a lede that hedges in its second sentence still leads with the hedge", () => {
  const data = stageB();
  data.chapters.work.lede = "You work in short bursts. Perhaps that suits you.";
  assert.ok(validateStage("b", data, packet, teachings).errors.includes("hedge-lead:work:lede"));
});

test("Ukrainian text is checked against Ukrainian lists, never assuming a gender", () => {
  const data = stageA();
  data.overview.text = `Ви сама вирішуєте, коли зупинитись. ${words(80)}`;
  data.facets.gifts.text = `Мабуть, ви тримаєте слово. ${words(50)}`;
  const { errors } = validateStage("a", data, withMoon(["taurus", "gemini"], "uk"), teachings);
  assert.ok(errors.some((e) => e.startsWith("gender:overview")), String(errors));
  assert.ok(errors.includes("hedge-lead:gifts"), String(errors));
});

test("the hidden outline is planning text: it is not style-checked", () => {
  const data = stageA();
  data.outline.mind = "Perhaps how your attention picks what matters on its healing journey.";
  assert.deepEqual(validateStage("a", data, packet, teachings), { ok: true });
});

test("stage B and C chapters may not repeat six words from the opening's visible text", () => {
  const opening = stageA();
  const copied = "a quiet engine that never stops running";
  opening.overview.text = `Most days ${copied} and nobody sees it. ${words(80)}`;
  opening.facets.bonds.text = `At home it is the same: you set the table for people who may not come. ${words(40)}`;
  for (const stage of ["b", "c"]) {
    const data = stage === "b" ? stageB() : stageC();
    const key = Object.keys(data.chapters)[0];
    const other = Object.keys(data.chapters)[1];
    data.chapters[key].paragraphs[1] = `${words(20)} Some say ${copied} behind it all. ${words(20)}`;
    data.chapters[other].lede = "You set the table for people who may not come.";
    const { errors } = validateStage(stage, data, packet, teachings, opening);
    assert.ok(errors.some((e) => e.startsWith(`repeat:${key}:"`)), `${stage} ${key}: ${errors}`);
    assert.ok(errors.some((e) => e.startsWith(`repeat:${other}:"`)), `${stage} ${other}: ${errors}`);
    assert.equal(errors.filter((e) => e.startsWith("repeat:")).length, 2, String(errors));
  }
});

test("without an opening nothing is compared, and fresh chapters pass against one", () => {
  const data = stageB();
  data.chapters.mind.paragraphs[0] = data.chapters.heart.paragraphs[0];
  assert.deepEqual(validateStage("b", data, packet, teachings), { ok: true });
  assert.deepEqual(validateStage("b", stageB(), packet, teachings, stageA()), { ok: true });
  assert.deepEqual(validateStage("c", stageC(), packet, teachings, stageA()), { ok: true });
});

test("the outline is hidden, so chapters are never compared with it", () => {
  const opening = stageA();
  const data = stageB();
  data.chapters.heart.paragraphs[0] = `${words(20)} ${opening.outline.heart} ${words(20)}`;
  assert.deepEqual(validateStage("b", data, packet, teachings, opening), { ok: true });
});

test("chapters of one stage may share phrases with each other", () => {
  const data = stageB();
  data.chapters.mind.paragraphs[0] = data.chapters.work.paragraphs[0];
  assert.deepEqual(validateStage("b", data, packet, teachings, stageA()), { ok: true });
});

test("a malformed opening is ignored rather than thrown on", () => {
  for (const bad of [null, "x", {}, { overview: 1, facets: "no" }, { facets: { mind: null } }]) assert.deepEqual(validateStage("b", stageB(), packet, teachings, bad), { ok: true });
});
