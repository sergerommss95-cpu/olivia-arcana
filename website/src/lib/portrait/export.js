// website/src/lib/portrait/export.js
/**
 * A portrait as one standalone page to download, in the reader's order: the
 * glance (title, epigraph, the sentences to keep, the cards it returns to
 * most), the opening, the five facets, the chapters in their two parts, the
 * numbers, the maps and the teachings it cites. Inline CSS (the site's lapis
 * on screen, ink on white in print), labels in the reader's one voice
 * (sentence case, never letter-spaced capitals), and every card image inlined
 * as a data: URI. No script and nothing fetched from anywhere. Names come from
 * the tables the reader uses (lattice.js, seals.js, why.js, digest.js); the
 * few headings live here, because the node test runner cannot read the
 * components' copy.ts. Plain JS with JSDoc for the node test runner.
 */

import { BODY_GLYPHS, SIGN_CARDS, SIGN_GLYPHS, SIGNS } from "../astrology/constants.js";
import { definingCards } from "./digest.js";
import { READING_ORDER, ROLES, ROWS } from "./lattice.js";
import { PLANETS } from "./packet.js";
import { ANGLE_SEALS, NUMBER_TITLES, PLANET_NAMES } from "./seals.js";
import { eitherSigns, houseName } from "./why.js";

/**
 * @typedef {"en" | "uk"} Locale
 * @typedef {{ text: string, refs?: string[], teachings?: string[] }} Passage
 * @typedef {{ title: string, lede: string, paragraphs: string[], practice: string }} Chapter
 * @typedef {{ a?: { title: string, epigraph: string, overview: Passage, facets: Record<string, Passage & { heading: string }> }, b?: { chapters: Record<string, Chapter> }, c?: { chapters: Record<string, Chapter>, keep: string[] } }} Stages
 * @typedef {Record<string, { label: string, text: string, sources: { title: string, url: string }[] }>} Teachings
 * @typedef {{ id: number, name: string, href: string, thumb: string }} Card
 * @typedef {{ id: string, kind: string, position?: number, card?: number, role?: string, value?: number, master?: boolean, body?: string, sign?: string, house?: number | null, retrograde?: boolean, alternatives?: string[] | null, angle?: string }} Factor
 */

const SITE = "https://oliviaarcana.com";
const FACETS = ["temperament", "inner", "gifts", "bonds", "direction"];
/** The chapters in their two parts, as the reader groups them. */
const PARTS = [["mind", "heart", "work"], ["shadow", "love", "becoming"]];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const NUMBERS = ["lifePath", "expression", "soulUrge", "personality"];
/** Text presentation, so a glyph is never drawn as an emoji. */
const TEXT = "︎";

const WORDS = {
  en: {
    kicker: "Your birth portrait",
    essence: "If you read nothing else",
    defining: "The cards your portrait returns to most",
    opening: "Opening",
    facets: "Five facets",
    facetNames: { temperament: "Temperament", inner: "Inner life", gifts: "Gifts", bonds: "Bonds", direction: "Direction" },
    parts: [{ kicker: "Part one", title: "Mind, heart and work" }, { kicker: "Part two", title: "Shadow, love and becoming" }],
    ordinal: ["Chapter one", "Chapter two", "Chapter three", "Chapter four", "Chapter five", "Chapter six"],
    sections: { mind: "Mind", heart: "Heart", work: "Work", shadow: "Shadow", love: "Love", becoming: "Becoming" },
    practice: "A practice for this week",
    numbers: "Your numbers",
    numbersKicker: "From your name and birth date",
    master: "Master number",
    roles: {
      lifePath: "The road your life keeps taking, read from your full birth date.",
      expression: "What you are able to do and show, read from every letter of your name.",
      soulUrge: "What you want most deeply, read from the vowels of your name.",
      personality: "What others notice in you first, read from the consonants of your name.",
    },
    birthday: "the day of the month you were born",
    maps: "Your maps",
    mapsLede: "The cards and the sky this portrait was read from.",
    cards: "Your cards",
    cardsKicker: "From your birth date",
    sky: "Your sky",
    skyKicker: "From the sky at your birth",
    noRising: "Rising needs a birth time",
    others: "Other planets",
    retrograde: "retrograde",
    teachings: "What the traditions say",
    teachingsLede: "The passages of the tradition this portrait cites.",
    sources: "Sources",
    honest: "These traditions offer a way to reflect; they are not facts about you.",
    written: "Written by Olivia Arcana",
  },
  uk: {
    kicker: "Ваш портрет народження",
    essence: "Якщо прочитаєте лише це",
    defining: "Карти, до яких ваш портрет повертається найчастіше",
    opening: "Вступ",
    facets: "П’ять граней",
    facetNames: { temperament: "Темперамент", inner: "Внутрішнє життя", gifts: "Дари", bonds: "Зв’язки", direction: "Напрям" },
    parts: [{ kicker: "Частина перша", title: "Розум, серце й справа" }, { kicker: "Частина друга", title: "Тінь, любов і становлення" }],
    ordinal: ["Розділ перший", "Розділ другий", "Розділ третій", "Розділ четвертий", "Розділ п’ятий", "Розділ шостий"],
    sections: { mind: "Розум", heart: "Серце", work: "Справа", shadow: "Тінь", love: "Любов", becoming: "Становлення" },
    practice: "Практика на цей тиждень",
    numbers: "Ваші числа",
    numbersKicker: "З вашого імені й дати народження",
    master: "Майстер-число",
    roles: {
      lifePath: "Дорога, якою йде ваше життя, прочитана з повної дати народження.",
      expression: "Те, що ви вмієте й показуєте світові, прочитане з усіх літер вашого імені.",
      soulUrge: "Те, чого ви прагнете найглибше, прочитане з голосних вашого імені.",
      personality: "Те, що інші помічають у вас першим, прочитане з приголосних вашого імені.",
    },
    birthday: "день місяця, коли ви народилися",
    maps: "Ваші карти",
    mapsLede: "Аркани й небо, з яких прочитано цей портрет.",
    cards: "Ваші аркани",
    cardsKicker: "З вашої дати народження",
    sky: "Ваше небо",
    skyKicker: "З неба в мить вашого народження",
    noRising: "Для асцендента потрібен час народження",
    others: "Інші планети",
    retrograde: "ретроградний рух",
    teachings: "Що кажуть традиції",
    teachingsLede: "Уривки традицій, на які спирається цей портрет.",
    sources: "Джерела",
    honest: "Ці традиції пропонують спосіб поміркувати; це не факти про вас.",
    written: "Написано в Olivia Arcana",
  },
};

/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
const e = escapeHtml;
const glyph = (g) => (g && g.length === 1 ? `${g}${TEXT}` : g ?? "");

/** Ukrainian to Latin, the official (2010) way: «ключ» → kliuch; є ї й ю я have their y- forms at a word's start. */
const LATIN = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "’": "", "'": "",
};
const WORD_START = { є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya" };

/** "Soft Entrance, Independent Course" → "olivia-portrait-soft-entrance-independent-course.html". @param {string} title */
export function fileName(title) {
  const latin = [...String(title ?? "").toLowerCase()].map((c, i, all) => {
    const start = i === 0 || !/\p{L}/u.test(all[i - 1]);
    return (start ? WORD_START[c] : undefined) ?? LATIN[c] ?? c;
  }).join("");
  let slug = latin.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug.length > 60) slug = slug.slice(0, 60).replace(/-[^-]*$/, "");
  return slug ? `olivia-portrait-${slug}.html` : "olivia-portrait.html";
}

/** @param {{ factors: Factor[] }} packet */
const factorsById = (packet) => new Map((packet?.factors ?? []).map((f) => [f.id, f]));
/** A planet's sign, or the signs it may be in without a birth time. @param {Factor} f */
const signsOf = (f) => (f.alternatives && f.alternatives.length > 1 ? f.alternatives : f.sign ? [f.sign] : []);
/** @param {string} sign @param {Card[]} cards */
const signCard = (sign, cards) => cards?.[SIGN_CARDS[SIGNS.indexOf(sign)]];

/** The sky as cards: Sun, Moon and Rising, each with the deck's card for its sign (or signs). */
function skyItems(byId, cards, lang) {
  return [
    { key: "sun", label: PLANET_NAMES.sun[lang], glyph: BODY_GLYPHS.sun, f: byId.get("natal-sun") },
    { key: "moon", label: PLANET_NAMES.moon[lang], glyph: BODY_GLYPHS.moon, f: byId.get("natal-moon") },
    { key: "asc", label: ANGLE_SEALS.asc[lang], glyph: BODY_GLYPHS.ascendant, f: byId.get("natal-asc") },
  ].map((item) => {
    const signs = item.f ? signsOf(item.f) : [];
    return { ...item, signs, dealt: signs.flatMap((sign) => { const card = signCard(sign, cards); return card ? [{ sign, card }] : []; }) };
  });
}

/**
 * The card thumbnails the page shows (the eleven Arkan cards, then the sky's
 * sign cards), once each: the UI fetches these and hands them back as data URIs.
 * @param {{ factors: Factor[] }} packet
 * @param {Card[]} cards
 * @returns {string[]}
 */
export function exportImages(packet, cards) {
  const byId = factorsById(packet);
  const urls = READING_ORDER.map((pos) => cards?.[byId.get(`arkan-${pos}`)?.card ?? -1]?.thumb);
  for (const item of skyItems(byId, cards, "en")) for (const { card } of item.dealt) urls.push(card.thumb);
  return [...new Set(urls.filter(Boolean))];
}

/** An image only when it is inline; otherwise nothing (the caption names the card). */
function img(url, images, alt, cls) {
  const src = url ? images?.[url] : undefined;
  return typeof src === "string" && src.startsWith("data:") ? `<img class="${cls}" src="${e(src)}" alt="${e(alt)}" width="120" height="206">` : `<span class="${cls} missing" aria-hidden="true"></span>`;
}

const paragraphs = (texts, cls = "prose") => texts.map((t) => `<p class="${cls}">${e(t)}</p>`).join("\n");

/** One chapter: its numeral and place, title, lede, paragraphs and the practice. @param {Chapter} chapter @param {number} i @param {string} key @param {Locale} lang */
function chapterHtml(chapter, i, key, lang) {
  const w = WORDS[lang];
  return `<section class="chapter">
<p class="label"><span class="chapter-numeral">${NUMERALS[i]}</span> ${e(w.ordinal[i])} · ${e(w.sections[key])}</p>
<h3>${e(chapter.title)}</h3>
<p class="lede">${e(chapter.lede)}</p>
${paragraphs(chapter.paragraphs ?? [])}
<div class="practice"><p class="label">${e(w.practice)}</p><p class="practice-text">${e(chapter.practice)}</p></div>
</section>`;
}

/** The glance: the title, the epigraph, the sentences to keep and the cards the portrait returns to most. */
function glanceHtml(stages, byId, packet, cards, images, lang) {
  const w = WORDS[lang];
  const a = stages?.a;
  const keep = stages?.c?.keep?.length
    ? `<section class="essence"><h2 class="label">${e(w.essence)}</h2><ul>${stages.c.keep.map((line) => `<li>${e(line)}</li>`).join("")}</ul></section>`
    : "";
  const defining = a ? definingCards(a, packet) : [];
  const table = defining.length
    ? `<ul class="defining" aria-label="${e(w.defining)}">${defining.map((d) => {
      const card = cards?.[d.card];
      const roles = d.positions.map((pos) => ROLES[pos]?.[lang]).filter(Boolean).join(", ");
      return `<li><figure>${img(card?.thumb, images, card?.name ?? "", "art")}<figcaption><span class="cap">${e(roles)}</span><span class="name">${e(card?.name ?? "")}</span></figcaption></figure></li>`;
    }).join("")}</ul>`
    : "";
  return `<header class="glance">
<p class="label">${e(w.kicker)}</p>
<h1>${e(a?.title)}</h1>
<p class="epigraph">${e(a?.epigraph)}</p>
${keep}
${table}
</header>`;
}

/** The eleven cards on the lattice's own rows (1-2-3 / 4-5 / 7-6-8 / 13-12-14), each captioned "<pos> · <role>". */
function latticeHtml(byId, cards, images, lang) {
  const rows = ROWS.map((row) => {
    const cells = row.map((pos) => {
      const card = cards?.[byId.get(`arkan-${pos}`)?.card ?? -1];
      const role = ROLES[pos][lang];
      const name = card ? `<a href="${e(SITE + card.href)}">${e(card.name)}</a>` : "";
      return `<figure class="card">${img(card?.thumb, images, card?.name ?? "", "art")}<figcaption><span class="cap"><b>${pos}</b> · ${e(role)}</span><span class="name">${name}</span></figcaption></figure>`;
    }).join("");
    return `<div class="row${row.length === 2 ? " pair" : ""}">${cells}</div>`;
  }).join("\n");
  return `<div class="lattice">${rows}</div>`;
}

/** Four numerals in a row, each over its role and what it means; a master number hallmarked; the birthday small beneath. */
function numbersHtml(byId, lang) {
  const w = WORDS[lang];
  const cells = NUMBERS.flatMap((role) => {
    const f = byId.get(`num-${role}`);
    if (f?.value === undefined) return [];
    return [`<div class="num"><dt class="label">${e(NUMBER_TITLES[role][lang])}</dt><dd class="figure"><span class="numeral">${f.value}</span>${f.master ? ` <span class="label master">${e(w.master)}</span>` : ""}</dd><dd class="meaning">${e(w.roles[role])}</dd></div>`];
  });
  const birthday = byId.get("num-birthday");
  const day = birthday?.value !== undefined ? `<p class="birthday"><span class="label">${e(NUMBER_TITLES.birthday[lang])}</span> <span class="numeral">${birthday.value}</span> <span class="meaning">· ${e(w.birthday)}</span></p>` : "";
  return cells.length ? `<dl class="numerals">${cells.join("")}</dl>${day}` : day;
}

function skyHtml(byId, cards, images, lang) {
  const w = WORDS[lang];
  const items = skyItems(byId, cards, lang).map((s) => {
    // No sign without a birth time: an empty place where its card would lie.
    const art = s.dealt.length
      ? s.dealt.map(({ card }) => img(card.thumb, images, card.name, "art")).join("")
      : `<span class="art unknown" aria-hidden="true"></span>`;
    const sign = s.signs.length
      ? `<p class="sign"><span class="glyphs" aria-hidden="true">${s.signs.map((x) => glyph(SIGN_GLYPHS[SIGNS.indexOf(x)])).join(" ")}</span> ${e(eitherSigns(s.signs, lang))}</p><p class="name">${e(s.dealt.map((d) => d.card.name).join(" · "))}</p>`
      : `<p class="sign missing-sign">${e(w.noRising)}</p>`;
    return `<li class="sky-item"><p class="sky-label"><span class="glyph" aria-hidden="true">${e(glyph(s.glyph))}</span> ${e(s.label)}</p><div class="sky-cards${s.dealt.length > 1 ? " pair" : ""}">${art}</div>${sign}</li>`;
  });
  const others = PLANETS.filter((p) => p !== "sun" && p !== "moon").flatMap((body) => {
    const f = byId.get(`natal-${body}`);
    if (!f) return [];
    const house = f.house ? ` · ${e(houseName(f.house, lang))}` : "";
    const retro = f.retrograde ? ` <span class="retro" title="${e(w.retrograde)}">℞${TEXT}</span>` : "";
    return [`<li><span class="glyph" aria-hidden="true">${e(glyph(BODY_GLYPHS[body]))}</span> <span class="planet">${e(PLANET_NAMES[body][lang])}</span> <span class="where">${e(eitherSigns(signsOf(f), lang))}${house}</span>${retro}</li>`];
  });
  return `<ul class="sky">${items.join("")}</ul>${others.length ? `<h4 class="label">${e(w.others)}</h4><ul class="planets">${others.join("")}</ul>` : ""}`;
}

function teachingsHtml(teachings, lang) {
  const w = WORDS[lang];
  const items = Object.values(teachings ?? {}).map((t) => {
    const sources = (t.sources ?? []).filter((s) => s && s.url).map((s) => `<li><a href="${e(s.url)}">${e(s.title)}</a></li>`).join("");
    return `<li class="teaching"><p class="label">${e(t.label)}</p><p>${e(t.text)}</p>${sources ? `<ul class="sources" aria-label="${e(w.sources)}">${sources}</ul>` : ""}</li>`;
  });
  // Every source once, with its address written out: what a printed page can still point to.
  const unique = new Map();
  for (const t of Object.values(teachings ?? {})) for (const s of t.sources ?? []) if (s?.url && !unique.has(s.url)) unique.set(s.url, s.title);
  const bibliography = unique.size
    ? `<section class="bibliography"><h3 class="label">${e(w.sources)}</h3><ul>${[...unique].map(([url, title]) => `<li>${e(title)}<br><a href="${e(url)}">${e(url)}</a></li>`).join("")}</ul></section>`
    : "";
  return items.length ? `<section class="teachings"><h2>${e(w.teachings)}</h2><p class="hint">${e(w.teachingsLede)}</p><ul>${items.join("\n")}</ul>${bibliography}</section>` : "";
}

const CSS = `
:root{--ground:#0b1c2c;--deep:#07121d;--ink:#eee6d4;--body:rgba(238,230,212,.86);--soft:rgba(238,230,212,.74);--gilt:#c9b182;--hair:rgba(238,230,212,.14);--band:rgba(3,9,16,.55);
--display:"Cormorant","Cormorant Garamond","EB Garamond",Garamond,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
--heading:"Cormorant Garamond","Cormorant","EB Garamond",Garamond,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
--sans:"DM Sans","Onest",-apple-system,"Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box}
html{background:var(--ground);color:var(--ink);-webkit-text-size-adjust:100%}
body{margin:0;font:400 18px/1.7 var(--sans)}
main{max-width:760px;margin:0 auto;padding:80px 28px 56px}
p{margin:0}
ul{list-style:none;margin:0;padding:0}
a{color:inherit;text-decoration-color:rgba(201,177,130,.55);text-underline-offset:3px}
h1,h2,h3,h4{font-weight:400;margin:0;text-wrap:balance}
.label{font:500 13.5px/1.4 var(--sans);letter-spacing:0;text-transform:none;color:var(--gilt)}
h2{font:400 42px/1.05 var(--display);letter-spacing:-.005em}
h3{font:400 30px/1.12 var(--display)}
.hint{margin-top:10px;font-size:14px;line-height:1.55;color:var(--soft)}
.prose{max-width:34em;color:var(--body);hanging-punctuation:first;text-wrap:pretty}
.prose+.prose{margin-top:.9em}
.glance h1{margin:14px 0 14px;font:300 58px/1.02 var(--display);letter-spacing:-.01em}
.epigraph{max-width:28em;font:italic 400 23px/1.4 var(--heading);color:var(--soft)}
.essence{margin-top:40px}
.essence h2{margin-bottom:10px}
.essence li{padding:6px 0;font:400 25px/1.35 var(--heading);color:var(--ink);text-wrap:balance}
.defining{display:flex;flex-wrap:wrap;gap:24px 20px;margin-top:40px}
.defining li{width:124px}
.defining .art{width:96px}
.opening{margin-top:96px}
.opening h2,.facets>h2{margin-bottom:22px}
.overview::first-letter{float:left;padding:6px 10px 0 0;font:400 70px/.8 var(--display);color:var(--gilt)}
.facets{margin-top:88px}
.facet{padding-top:26px;margin-top:30px;border-top:1px solid var(--hair)}
.facet h3{margin:6px 0 12px;font-size:28px}
.part{margin-top:112px}
.part-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 20px}
.part-head .label{font-size:15px}
.chapter{margin-top:64px}
.chapter-numeral{margin-right:6px;font:300 26px/1 var(--display);vertical-align:-2px}
.chapter h3{margin:10px 0 14px;font-size:38px;line-height:1.08}
.lede{max-width:30em;margin-bottom:26px;font:italic 400 22px/1.45 var(--heading);color:var(--body)}
.practice{max-width:34em;margin-top:28px;padding:16px 20px;border:1px solid var(--hair);border-radius:10px;background:var(--band)}
.practice .label{margin-bottom:6px}
.practice-text{font:italic 400 20px/1.45 var(--heading);color:var(--ink)}
.numbers{margin-top:120px;padding:44px 0 36px;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.numbers h2{margin-top:6px}
.numerals{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:28px 26px;margin:36px 0 0}
.num{display:flex;flex-direction:column}
.num dd{margin:0}
.num .label{margin-top:12px}
.figure{order:-1;display:flex;align-items:flex-start;gap:10px}
.numeral{font:300 64px/.9 var(--display);font-variant-numeric:lining-nums;color:var(--ink)}
.master{margin-top:4px;font-size:12.5px;line-height:1.2}
.meaning{margin-top:6px;font:italic 400 17px/1.4 var(--heading);color:var(--soft)}
.birthday{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin-top:34px;padding-top:18px;border-top:1px solid var(--hair)}
.birthday .numeral{font-size:28px}
.birthday .meaning{margin:0}
.maps{margin-top:96px}
.map{margin-top:44px;padding-top:28px;border-top:1px solid var(--hair)}
.map h3{margin:6px 0 28px}
.lattice{display:grid;gap:24px 0;max-width:520px}
.row{display:grid;grid-template-columns:repeat(3,1fr)}
.row.pair{grid-template-columns:repeat(2,1fr);padding:0 16.66%}
figure{margin:0;display:grid;justify-items:center;gap:8px;break-inside:avoid}
.defining figure{justify-items:start}
.art{display:block;width:80px;height:auto;aspect-ratio:120/206;border-radius:5px;object-fit:cover;box-shadow:0 0 0 1px rgba(201,177,130,.24),0 14px 30px rgba(0,0,0,.45)}
.art.missing{background:var(--deep)}
figcaption{display:grid;gap:1px;text-align:center}
.defining figcaption{text-align:left}
.cap{font:400 12.5px/1.35 var(--sans);color:var(--soft)}
.cap b{font:400 14px/1 var(--display);color:var(--gilt)}
.name{font:italic 400 16px/1.3 var(--heading);color:var(--ink)}
.name a{text-decoration:none}
.sky{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.sky-item{display:grid;justify-items:start;align-content:start;gap:8px}
.sky-label{font-size:14px;color:var(--soft)}
.sky-label .glyph{color:var(--gilt);font-family:var(--heading)}
.sky-cards{display:flex;gap:8px;align-items:center}
.art.unknown{background:none;box-shadow:none;border:1px dashed rgba(201,177,130,.45)}
.sky-cards.pair .art{width:60px}
.sign{font:400 21px/1.3 var(--heading)}
.glyphs{color:var(--gilt)}
.sky-item .name{font:400 14px/1.4 var(--sans);color:var(--soft)}
.missing-sign{font:italic 400 18px/1.4 var(--heading);color:var(--soft)}
.maps h4{margin:40px 0 10px}
.planets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px}
.planets li{display:flex;align-items:baseline;gap:8px;padding:9px 0;border-bottom:1px solid var(--hair);font-size:15px}
.planet{min-width:5.6em;font:400 18px/1.2 var(--heading)}
.planets .glyph{display:inline-block;width:1.4em;color:var(--gilt);font-family:var(--heading)}
.where{color:var(--soft);white-space:nowrap}
.retro{color:var(--gilt)}
.teachings{margin-top:112px}
.teachings>ul{margin-top:32px}
.teaching{padding:20px 0;border-top:1px solid var(--hair);font-size:15px;line-height:1.7;color:var(--body);break-inside:avoid}
.teaching .label{margin-bottom:4px}
.sources{margin-top:8px;font-size:13px;line-height:1.6;color:var(--soft)}
.sources a::before{content:"↗\\FE0E  ";color:var(--gilt)}
.bibliography{margin-top:36px;padding-top:24px;border-top:1px solid var(--hair)}
.bibliography h3{margin-bottom:12px}
.bibliography ul{display:grid;gap:12px;font-size:14px;line-height:1.55;color:var(--body)}
.bibliography a{font-size:12.5px;color:var(--soft);word-break:break-all}
.honest{max-width:30em;margin-top:88px;font:italic 400 20px/1.5 var(--heading);color:var(--soft)}
.colophon{margin-top:40px;padding-top:20px;border-top:1px solid var(--hair);font-size:13.5px;color:var(--soft)}
.colophon a{text-decoration:none;color:var(--gilt)}
@media (max-width:600px){main{padding:56px 20px 40px}body{font-size:17px}.glance h1{font-size:42px}.epigraph{font-size:20px}.essence li{font-size:22px}h2{font-size:34px}.chapter h3{font-size:30px}.lede{font-size:20px}
.numerals{grid-template-columns:repeat(2,minmax(0,1fr))}.numeral{font-size:52px}
.sky{grid-template-columns:1fr}.planets{grid-template-columns:1fr}.art{width:60px}.defining .art{width:72px}.cap{font-size:11.5px}.name{font-size:14px}}
@page{margin:18mm 16mm}
@media print{
:root{--ink:#16161a;--body:#26262b;--soft:#55555c;--gilt:#6f5b33;--hair:#d6d2c8;--band:transparent}
html,body{background:#fff;color:var(--ink)}
body{font-size:11.5pt;line-height:1.6}
main{max-width:none;padding:0}
a{color:inherit;text-decoration:none}
.art{box-shadow:0 0 0 .5pt #b9b2a2}
.defining .art{width:64px}
.part,.chapter+.chapter,.numbers,.teachings{break-before:page;margin-top:0}
.part>.chapter:first-of-type{margin-top:24px}
.opening{margin-top:48px}
.facets{margin-top:40px}
.numbers{padding-top:0;border-top:0}
.maps{margin-top:40px}
.facet,.practice,.num,.sky-item,.planets li,.lattice,.row,.numerals,.sky,.bibliography li,.essence,.defining{break-inside:avoid}
h1,h2,h3,h4,.label,.lede,.part-head{break-after:avoid}
.chapter h3{font-size:26pt}
.lede{font-size:15pt}
.practice{padding:10px 14px}
.numeral{font-size:40pt}
.meaning{font-size:11pt}
.map{margin-top:24px;padding-top:18px}
.map h3{margin-bottom:18px}
.art{width:58px}
.lattice{gap:12px 0}
.sign{font-size:14pt}
.maps h4{margin:22px 0 8px}
.planets li{padding:5px 0;font-size:10pt}
.teachings>ul{columns:2;column-gap:28px;margin-top:24px}
.teaching{padding:12px 0;font-size:9.5pt;line-height:1.55}
.sources{font-size:8pt}
.sources a::before{content:""}
.bibliography{break-before:avoid}
.honest{margin-top:48px}
}
`;

/**
 * The whole reading as one standalone HTML document, in the reader's order:
 * glance → opening → facets → chapters → numbers → maps → teachings.
 * @param {{ locale: Locale, packet: { factors: Factor[] }, stages: Stages, teachings: Teachings, cards: Card[], images: Record<string, string> }} input
 * @returns {string}
 */
export function buildExport({ locale, packet, stages, teachings, cards, images }) {
  const lang = locale === "uk" ? "uk" : "en";
  const w = WORDS[lang];
  const byId = factorsById(packet);
  const a = stages?.a;
  const title = a?.title ?? "";

  const opening = a?.overview?.text ? `<section class="opening"><h2>${e(w.opening)}</h2><p class="prose overview">${e(a.overview.text)}</p></section>` : "";
  const facets = FACETS.flatMap((key) => {
    const f = a?.facets?.[key];
    return f ? [`<section class="facet"><p class="label">${e(w.facetNames[key])}</p><h3>${e(f.heading)}</h3><p class="prose">${e(f.text)}</p></section>`] : [];
  });
  let n = 0;
  const parts = PARTS.map((keys, p) => {
    const chapters = keys.flatMap((key) => {
      const i = n++;
      const chapter = stages?.b?.chapters?.[key] ?? stages?.c?.chapters?.[key];
      return chapter ? [chapterHtml(chapter, i, key, lang)] : [];
    });
    return chapters.length ? `<section class="part"><div class="part-head"><p class="label">${e(w.parts[p].kicker)}</p><h2>${e(w.parts[p].title)}</h2></div>\n${chapters.join("\n")}\n</section>` : "";
  });
  const hasArkan = (packet?.factors ?? []).some((f) => f.kind === "arkan");
  const numbers = hasArkan ? numbersHtml(byId, lang) : "";
  const maps = hasArkan
    ? `<section class="maps"><h2>${e(w.maps)}</h2><p class="hint">${e(w.mapsLede)}</p>
<section class="map"><p class="label">${e(w.cardsKicker)}</p><h3>${e(w.cards)}</h3>${latticeHtml(byId, cards, images, lang)}</section>
<section class="map"><p class="label">${e(w.skyKicker)}</p><h3>${e(w.sky)}</h3>${skyHtml(byId, cards, images, lang)}</section>
</section>`
    : "";

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${e(title)} · Olivia Arcana</title>
<style>${CSS}</style>
</head>
<body>
<main>
${glanceHtml(stages, byId, packet, cards, images, lang)}
${opening}
${facets.length ? `<section class="facets"><h2>${e(w.facets)}</h2>\n${facets.join("\n")}\n</section>` : ""}
${parts.join("\n")}
${numbers ? `<section class="numbers"><p class="label">${e(w.numbersKicker)}</p><h2>${e(w.numbers)}</h2>${numbers}</section>` : ""}
${maps}
${teachingsHtml(teachings, lang)}
<p class="honest">${e(w.honest)}</p>
<p class="colophon">${e(w.written)} · <a href="${SITE}${lang === "uk" ? "/uk/" : "/"}">oliviaarcana.com</a></p>
</main>
</body>
</html>
`;
}
