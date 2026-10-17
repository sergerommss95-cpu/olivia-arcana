// website/src/lib/card-names.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { cardFromSrc, isCardBack, CARD_NAMES } from "./card-names.js";

const pub = new URL("../../public/", import.meta.url);

test("a card's art names it in English and Ukrainian", () => {
  assert.deepEqual(cardFromSrc("/cards/04_the_emperor.webp"), { id: 4, numeral: "IV", en: "The Emperor", uk: "Імператор" });
  assert.deepEqual(cardFromSrc("http://localhost:3000/cards/00_the_fool.webp"), { id: 0, numeral: "0", en: "The Fool", uk: "Блазень" });
  const ace = cardFromSrc("/cards/22_ace_of_wands.webp");
  assert.equal(ace.en, "Ace of Wands");
  assert.equal(ace.uk, "Туз Жезлів");
  assert.equal(ace.numeral, "", "only the Majors carry a numeral");
  assert.equal(cardFromSrc("/cards/77_king_of_pentacles.webp").uk, "Король Пентаклів");
});

test("thumbs, wheel and portal cuts name the same card", () => {
  for (const src of ["/cards/thumbs/17_the_star.webp", "/cards/wheel/17_the_star.webp", "/cards-portal/17_the_star.webp", "https://oliviaarcana.com/cards/thumbs/17_the_star.webp?v=2"]) {
    assert.equal(cardFromSrc(src)?.en, "The Star", src);
  }
});

test("the reading experience's hashed decks name their cards", () => {
  assert.equal(cardFromSrc("/experience/assets/12-the-hanged-man.b66848e2df739ad1.webp")?.en, "The Hanged Man");
  assert.equal(cardFromSrc("/experience/assets/12-the-hanged-man-phone.cbd5525cb22cc604.webp")?.uk, "Повішений");
  assert.equal(cardFromSrc("/experience/assets/amielle-v1-06-men.36aa5ff50349210e.webp")?.en, "The Lovers");
  assert.equal(cardFromSrc("/experience/assets/space-between-64.534a2a47a75cf4f7.webp")?.en, "Ace of Pentacles");
});

test("backs and other images name nothing", () => {
  for (const src of ["/cards/back-448.webp", "/experience/assets/card-back.ce80d77b8f0d78be.webp", "/experience/assets/space-between-back.c3119214d07c72b8.webp"]) {
    assert.equal(cardFromSrc(src), null, src);
    assert.equal(isCardBack(src), true, src);
  }
  for (const src of ["", undefined, "/olive-mark.svg", "/deck/majors-q80.webp", "/cards/99_nothing.webp", "/cards/thumbs/04_the_empress.webp"]) {
    assert.equal(cardFromSrc(src), null, String(src));
    assert.equal(isCardBack(src), false, String(src));
  }
});

test("every card file on disk, and every experience deck card, has a name", () => {
  const files = readdirSync(new URL("cards/", pub)).filter((f) => /^\d\d_.+\.webp$/.test(f));
  assert.equal(files.length, 78);
  assert.equal(Object.keys(CARD_NAMES).length, 78);
  for (const f of files) assert.ok(cardFromSrc(`/cards/${f}`), f);
  for (const f of readdirSync(new URL("cards/thumbs/", pub))) assert.ok(cardFromSrc(`/cards/thumbs/${f}`), f);
  for (const f of readdirSync(new URL("cards/wheel/", pub))) assert.ok(cardFromSrc(`/cards/wheel/${f}`), f);
  const manifest = JSON.parse(readFileSync(new URL("experience/manifest.json", pub), "utf8"));
  for (const [deck, { back, cards }] of Object.entries(manifest.decks)) {
    assert.equal(cardFromSrc(`/experience/${back}`), null, `${deck} back`);
    for (const [n, file] of Object.entries(cards)) assert.equal(cardFromSrc(`/experience/${file}`)?.id, Number(n), `${deck} ${file}`);
  }
});
