// website/netlify/portrait/style.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { styleProblems, repetition } from "./style.ts";

test("a passage may not open with a hedge", () => {
  assert.ok(styleProblems("inner", "You probably keep the kettle warm for everyone. Then more text.", "en", {}).some((e) => e.startsWith("hedge-lead:inner")));
  assert.ok(styleProblems("inner", "Мабуть, ви тримаєте чайник гарячим для всіх. Далі текст.", "uk", {}).some((e) => e.startsWith("hedge-lead:inner")));
  assert.deepEqual(styleProblems("inner", "You keep the kettle warm for everyone. It may cost you rest.", "en", {}), []);
});

test("at most one softener per passage", () => {
  const text = "You keep the kettle warm. It may cost you rest. You probably notice. Perhaps you mind.";
  assert.ok(styleProblems("inner", text, "en", {}).some((e) => e.startsWith("hedges:inner:")));
});

test("method words, therapy clichés and AI tics are refused", () => {
  for (const bad of ["Your symbolic resource is patience.", "This position suggests", "on your healing journey", "a unique blend of", "It's important to remember that", "navigate the complexities", "Ваш символічний ресурс", "енергія всесвіту", "ваша подорож до себе"]) {
    assert.ok(styleProblems("x", `${bad} rest of a fine sentence here.`, bad.match(/[а-яі]/i) ? "uk" : "en", {}).some((e) => e.startsWith("phrase:x")), bad);
  }
});

test("Ukrainian never assumes a gender with «ви»", () => {
  for (const bad of ["ви сама вирішуєте", "право обирати самій собі", "ви готова почати", "ви впевнений у цьому"]) {
    assert.ok(styleProblems("x", bad, "uk", {}).some((e) => e.startsWith("gender:x")), bad);
  }
  for (const ok of ["ви самі вирішуєте", "ви готові почати", "ви впевнені в цьому"]) assert.deepEqual(styleProblems("x", ok, "uk", {}).filter((e) => e.startsWith("gender")), [], ok);
});

test("six-word phrases may not repeat across sections", () => {
  const opening = ["You can feel enormous hope about someone and still wait."];
  assert.ok(repetition("love", "Again you can feel enormous hope about someone today.", opening).length === 1);
  assert.deepEqual(repetition("love", "A different sentence with no shared run of words.", opening), []);
});

test("a lede is judged whole: a hedge anywhere in it leads", () => {
  const lede = "You keep the kettle warm for everyone. It probably costs you rest.";
  assert.deepEqual(styleProblems("mind:lede", lede, "en", {}), []);
  assert.ok(styleProblems("mind:lede", lede, "en", { lede: true }).some((e) => e.startsWith("hedge-lead:mind:lede")));
});

test("error codes carry the section and the quoted match", () => {
  assert.deepEqual(styleProblems("heart", "Your healing is slow work, said plainly.", "en", {}), ['phrase:heart:"healing"']);
  assert.deepEqual(styleProblems("heart", "Ви сама вирішуєте, коли зупинитись.", "uk", {}), ['gender:heart:"Ви сама"']);
  assert.deepEqual(styleProblems("heart", "Ви тримаєте слово. Можливо, вам цього досить. Мабуть, так.", "uk", {}), ["hedges:heart:2"]);
});

test("«позиція» and a bare «енергія» are ordinary Ukrainian and stay allowed", () => {
  for (const ok of ["Ви тримаєте свою позицію до кінця розмови.", "Після обіду у вас менше енергії, і ви це помічаєте."]) assert.deepEqual(styleProblems("x", ok, "uk", {}), [], ok);
  for (const bad of ["енергія всесвіту", "енергії карти", "енергія числа"]) assert.ok(styleProblems("x", `${bad} стоїть за цим.`, "uk", {}).some((e) => e.startsWith("phrase:x")), bad);
});

test("a bare «remember that» is allowed; «it's important to» is still refused", () => {
  assert.deepEqual(styleProblems("x", "You remember that kitchen better than the house around it.", "en", {}), []);
  assert.ok(styleProblems("x", "It’s important to rest before you answer.", "en", {}).some((e) => e.startsWith("phrase:x")));
});

test("repetition ignores case and punctuation, and only an exact six-word run counts", () => {
  const opening = ["You carry the weight, quietly, for everyone around you."];
  assert.equal(repetition("work", "You CARRY the weight quietly for everyone, they say.", opening).length, 1);
  assert.deepEqual(repetition("work", "You carry the weight of other people sometimes.", opening), []);
  assert.deepEqual(repetition("work", "too short", opening), []);
  assert.deepEqual(repetition("work", "You carry the weight quietly for everyone.", []), []);
});

test("Ukrainian «традиція» is only a method word when tradition is made to speak", () => {
  for (const ok of ["Це був традиційний обід у неділю.", "Родинні традиції вас тримають.", "Ви любите традицію гарячого чаю."]) assert.deepEqual(styleProblems("x", ok, "uk", {}), [], ok);
  for (const bad of ["Традиція каже, що слід мовчати.", "Згідно з тим, що традиція свідчить, ви стійкі.", "Традиція радить зачекати."]) assert.ok(styleProblems("x", bad, "uk", {}).some((e) => e.startsWith("phrase:x")), bad);
});

test("Ukrainian hedges: «схоже / здається» hedge only as «що»-clauses or parentheticals; «певно» and «якщо можливо» do not count", () => {
  for (const ok of ["Зупинка здається поразкою, але нею не є.", "Ваша мапа схоже на мапу метро.", "Ви ступаєте впевнено, навіть коли не знаєте дороги.", "Якщо можливо, вимкніть телефон перед сном.", "Ви, певно кажучи, не просите допомоги."]) {
    assert.deepEqual(styleProblems("x", ok, "uk", {}).filter((e) => e.startsWith("hedge")), [], ok);
  }
  for (const bad of ["Здається, що ви тримаєте все в собі.", "Схоже, що вам потрібна тиша.", "Мабуть, ви тримаєте слово.", "Ви, здається, втомилися від розмов. Далі текст."]) {
    assert.ok(styleProblems("x", bad, "uk", {}).some((e) => e.startsWith("hedge-lead:x")), bad);
  }
  assert.ok(styleProblems("x", "Ви тримаєте слово. Здається, що ви втомилися. Схоже, що вам потрібна тиша.", "uk", {}).includes("hedges:x:2"));
});

test("Ukrainian «самий» is the ordinary «the very», not a gendered self", () => {
  assert.deepEqual(styleProblems("x", "Ви той самий день згадуєте кожного разу інакше.", "uk", {}), []);
  assert.ok(styleProblems("x", "Ви сама знаєте, коли час.", "uk", {}).some((e) => e.startsWith("gender:x")));
  assert.ok(styleProblems("x", "Це право обирати самій собі.", "uk", {}).some((e) => e.startsWith("gender:x")));
});

test("a closing quote after the full stop still ends the first sentence", () => {
  for (const quoted of ['Він сказав: "Так." Можливо, ні.', "Він сказав: «Так.» Можливо, ні.", "Він сказав: “Так.” Можливо, ні."]) {
    assert.deepEqual(styleProblems("x", quoted, "uk", {}), [], quoted);
  }
  assert.deepEqual(styleProblems("x", 'He said, "Yes." Perhaps not.', "en", {}), []);
  assert.ok(styleProblems("x", 'He said, "Perhaps." Then he left.', "en", {}).some((e) => e.startsWith("hedge-lead:x")));
});
