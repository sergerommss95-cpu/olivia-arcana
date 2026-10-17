// website/src/lib/portrait-typography.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { typeset, typesetStages } from "./portrait/typography.js";

test("English: apostrophes, single and double quotations turn", () => {
  assert.equal(typeset("a friend's spare hour, and you don't", "en"), "a friend’s spare hour, and you don’t");
  assert.equal(typeset("answer with 'You're right about that' and wait", "en"), "answer with ‘You’re right about that’ and wait");
  assert.equal(typeset("decides for you 'to be helpful': these", "en"), "decides for you ‘to be helpful’: these");
  assert.equal(typeset("the first to say \"right, here's what we do now\" and", "en"), "the first to say “right, here’s what we do now” and");
  assert.equal(typeset("titled \"idea\", with no date", "en"), "titled “idea”, with no date");
  assert.equal(typeset("\"I don't want to be the one.\"", "en"), "“I don’t want to be the one.”");
  assert.equal(typeset("remembers the in-laws' birthdays", "en"), "remembers the in-laws’ birthdays");
  assert.equal(typeset("back in the '90s", "en"), "back in the ’90s");
  assert.equal(typeset("(\"quiet\") and/\"loud\"", "en"), "(“quiet”) and/“loud”");
  assert.equal(typeset("and —\"loud\"", "en"), "and\u00a0—“loud”");
});

test("Ukrainian: guillemets for quotations, „ “ inside them, ’ for the apostrophe", () => {
  assert.equal(typeset("ви пам'ятаєте, хто п'є чай", "uk"), "ви пам’ятаєте, хто п’є чай");
  assert.equal(typeset("кажете \"та я впораюся\" раніше", "uk"), "кажете «та я впораюся» раніше");
  assert.equal(typeset("кажете 'та я впораюся' раніше", "uk"), "кажете «та я впораюся» раніше");
  assert.equal(typeset("«Він сказав \"ні\" і пішов»", "uk"), "«Він сказав „ні“ і пішов»");
  assert.equal(typeset("словом «треба». Якщо ж", "uk"), "словом «треба». Якщо ж", "guillemets already set stay as they are");
});

test("a dash keeps to the word before it", () => {
  assert.equal(typeset("in saturday — is that ok?", "en"), "in saturday — is that ok?");
  assert.equal(typeset("сказати «так» – і все", "uk"), "сказати «так» – і все");
});

test("typeset is idempotent and leaves what is not text alone", () => {
  const once = typeset("You're the one who says \"leave it with me\" — and does.", "en");
  assert.equal(typeset(once, "en"), once);
  assert.equal(typeset("Plain text.", "en"), "Plain text.");
  assert.equal(typeset(undefined, "en"), undefined);
  assert.equal(typeset("", "uk"), "");
});

test("typesetStages turns every passage, keeps refs, and never touches the stages it was given", () => {
  const stages = {
    a: { title: "Don't", epigraph: "It's", overview: { text: "\"Go\"", refs: ["arkan-1"], teachings: ["t'1"] }, facets: { inner: { heading: "Who's", text: "a 'b'", refs: ["natal-moon"], teachings: [] } } },
    b: { chapters: { mind: { title: "One's", lede: "l'l", paragraphs: ["p'p", "q"], practice: "x'x", refs: [], teachings: [] } } },
    c: { chapters: {}, keep: ["k'k"] },
  };
  const frozen = JSON.stringify(stages);
  const shown = typesetStages(stages, "en");
  assert.equal(JSON.stringify(stages), frozen, "the stored stages are unchanged");
  assert.equal(shown.a.title, "Don’t");
  assert.equal(shown.a.overview.text, "“Go”");
  assert.deepEqual(shown.a.overview.refs, ["arkan-1"]);
  assert.deepEqual(shown.a.overview.teachings, ["t'1"], "ids are not text");
  assert.equal(shown.a.facets.inner.text, "a ‘b’");
  assert.deepEqual(shown.b.chapters.mind.paragraphs, ["p’p", "q"]);
  assert.equal(shown.b.chapters.mind.practice, "x’x");
  assert.deepEqual(shown.c.keep, ["k’k"]);
  assert.deepEqual(typesetStages({}, "uk"), {});
  assert.equal(typesetStages({ a: { title: "П'ять", epigraph: "", overview: { text: "" }, facets: {} } }, "uk").a.title, "П’ять");
});
