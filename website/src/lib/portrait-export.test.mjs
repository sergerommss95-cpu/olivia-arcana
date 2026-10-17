// website/src/lib/portrait-export.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildExport, escapeHtml, exportImages, fileName } from "./portrait/export.js";
import { typeset } from "./portrait/typography.js";

const example = (locale) => JSON.parse(readFileSync(new URL(`../../public/portrait/example-${locale}.json`, import.meta.url), "utf8"));
const deck = (prefix) => Array.from({ length: 22 }, (_, id) => ({ id, name: `${prefix} ${id}`, href: `/cards/c${id}/`, image: `/cards/${id}.webp`, thumb: `/cards/thumbs/${id}.webp` }));
const dataUris = (urls) => Object.fromEntries(urls.map((u) => [u, "data:image/webp;base64,AAAA"]));

function exported(locale, { images } = {}) {
  const { packet, stages, teachings } = example(locale);
  const cards = deck(locale === "uk" ? "Карта" : "Card");
  return { stages, teachings, html: buildExport({ locale, packet, stages, teachings, cards, images: images ?? dataUris(exportImages(packet, cards)) }) };
}

/** Every passage of a reading: overview, facets, chapters (lede, paragraphs, practice), keep lines. */
function passages(stages) {
  const out = [stages.a.title, stages.a.epigraph, stages.a.overview.text];
  for (const f of Object.values(stages.a.facets)) out.push(f.heading, f.text);
  for (const c of [...Object.values(stages.b.chapters), ...Object.values(stages.c.chapters)]) out.push(c.title, c.lede, ...c.paragraphs, c.practice);
  return [...out, ...stages.c.keep];
}

test("every passage, every chapter title and the keep lines appear, set as the reader sets them", () => {
  for (const locale of ["en", "uk"]) {
    const { html, stages } = exported(locale);
    for (const text of passages(stages)) assert.ok(html.includes(escapeHtml(typeset(text, locale))), `${locale}: missing ${text.slice(0, 60)}`);
  }
});

test("a standalone page: no script, no outside resources, every image inline", () => {
  const { html } = exported("en");
  assert.match(html, /^<!doctype html>/i);
  assert.ok(!/<script/i.test(html));
  assert.ok(!/<link\b/i.test(html));
  const imgs = html.match(/<img\b[^>]*>/g) ?? [];
  assert.ok(imgs.length >= 11, `expected the eleven lattice cards, got ${imgs.length}`);
  for (const img of imgs) assert.match(img, /\ssrc="data:/);
});

test("a card whose image could not be fetched is named, not drawn from the web", () => {
  const { packet, stages, teachings } = example("en");
  const cards = deck("Card");
  const urls = exportImages(packet, cards);
  const html = buildExport({ locale: "en", packet, stages, teachings, cards, images: dataUris(urls.slice(1)) });
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) assert.match(img, /\ssrc="data:/);
  assert.ok(!html.includes(`src="${urls[0]}"`));
});

test("maps, teachings with sources, the honest line and the footer", () => {
  const { html, teachings } = exported("en");
  const text = html.replace(/<[^>]+>/g, "");
  assert.match(text, /1 · Early foundation/);
  assert.match(text, /14 · Outward presence/);
  assert.match(html, /Life path/);
  assert.match(html, /Rising/);
  assert.match(html, /Other planets/);
  const first = Object.values(teachings)[0];
  assert.ok(html.includes(escapeHtml(first.label)));
  assert.ok(html.includes(`href="${escapeHtml(first.sources[0].url)}"`));
  assert.match(html, /not facts about you/);
  assert.match(text, /Written by Olivia Arcana · oliviaarcana\.com/);
});

test("the Ukrainian export speaks Ukrainian", () => {
  const { html } = exported("uk");
  assert.match(html, /<html lang="uk">/);
  for (const label of ["Практика на цей тиждень", "Якщо прочитаєте лише це", "Частина перша", "Розділ перший", "Ваші числа", "Ваше небо", "Інші планети", "Що кажуть традиції", "Ранні основи", "Життєвий шлях", "Для асцендента потрібен час народження"]) {
    assert.ok(html.includes(label), `missing ${label}`);
  }
  for (const label of ["Practice", "If you read nothing else", "Part one", "Chapter one", "Your numbers", "Other planets", "What the traditions say"]) assert.ok(!html.includes(label), `English left in: ${label}`);
});

test("the reader's order: glance, opening, facets, chapters, numbers, maps, teachings", () => {
  for (const locale of ["en", "uk"]) {
    const { html, stages } = exported(locale);
    const at = (text) => {
      const i = html.indexOf(escapeHtml(typeset(text, locale)));
      assert.ok(i >= 0, `${locale}: missing ${text.slice(0, 40)}`);
      return i;
    };
    const order = [
      at(stages.a.title), at(stages.c.keep[0]), at(stages.a.overview.text), at(stages.a.facets.temperament.heading),
      at(stages.b.chapters.mind.title), at(stages.c.chapters.becoming.practice),
      html.indexOf('class="numbers"'), html.indexOf('class="maps"'), html.indexOf('class="teachings"'), at(locale === "uk" ? "Написано в Olivia Arcana" : "Written by Olivia Arcana"),
    ];
    for (let i = 1; i < order.length; i++) assert.ok(order[i - 1] < order[i], `${locale}: step ${i} is out of order`);
    // Within the maps the cards come before the sky.
    assert.ok(html.indexOf('class="lattice"') < html.indexOf('class="sky"'));
  }
});

test("labels speak in the reader's one voice: sentence case, never letter-spaced capitals", () => {
  const { html } = exported("en");
  assert.ok(!/text-transform:\s*uppercase/i.test(html));
  assert.ok(!/letter-spacing:\s*\.[1-9]/.test(html), "no letter-spaced labels");
  assert.match(html, /<p class="label">If you read nothing else<\/p>|<h2 class="label">If you read nothing else<\/h2>/);
  assert.match(html, /<p class="label">Part one<\/p>/);
});

test("the numbers are set as numerals, a master number hallmarked", () => {
  const { packet, stages, teachings } = example("en");
  const master = { ...packet, factors: packet.factors.map((f) => (f.id === "num-expression" ? { ...f, value: 11, master: true } : f)) };
  const html = buildExport({ locale: "en", packet: master, stages, teachings, cards: deck("Card"), images: {} });
  assert.match(html, /<span class="numeral">11<\/span> <span class="label master">Master number<\/span>/);
  assert.ok(!html.includes('class="plate"'));
});

test("text is escaped, never markup", () => {
  const { packet, teachings } = example("en");
  const hostile = `Tom & Jerry <b onclick="x()">it's</b>`;
  const passage = { text: hostile, refs: [], teachings: [] };
  const chapter = { title: hostile, lede: hostile, paragraphs: [hostile], practice: hostile, refs: [], teachings: [] };
  const stages = {
    a: { title: hostile, epigraph: hostile, overview: passage, facets: { temperament: { ...passage, heading: hostile } } },
    b: { chapters: { mind: chapter } },
    c: { chapters: { love: chapter }, keep: [hostile] },
  };
  const html = buildExport({ locale: "en", packet, stages, teachings, cards: deck("Card"), images: {} });
  assert.ok(!html.includes("<b onclick"));
  // Text, escaped and set as the reader sets it: its quotes and apostrophe turned, its brackets and ampersand escaped.
  assert.equal(escapeHtml(typeset(hostile, "en")), "Tom &amp; Jerry &lt;b onclick=”x()”&gt;it’s&lt;/b&gt;");
  assert.ok(html.includes(escapeHtml(typeset(hostile, "en"))));
});

test("file names are slugged from the title, Cyrillic transliterated", () => {
  assert.equal(fileName("Soft Entrance, Independent Course"), "olivia-portrait-soft-entrance-independent-course.html");
  assert.equal(fileName("Теплий дім, власний ключ"), "olivia-portrait-teplyi-dim-vlasnyi-kliuch.html");
  assert.equal(fileName("  "), "olivia-portrait.html");
});
