// website/src/lib/portrait/export.js
/**
 * A portrait as one standalone page to download: the whole reading, its maps
 * and the teachings it cites, with inline CSS (the site's lapis on screen,
 * ink on white in print) and every card image inlined as a data: URI. No
 * script and nothing fetched from anywhere. Names come from the tables the
 * reader uses (lattice.js, seals.js, why.js); the few headings live here,
 * because the node test runner cannot read the components' copy.ts.
 * Plain JS with JSDoc for the node test runner.
 */

import { BODY_GLYPHS, SIGN_CARDS, SIGN_GLYPHS, SIGNS } from "../astrology/constants.js";
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
const CHAPTERS = ["mind", "heart", "work", "shadow", "love", "becoming"];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const PLATE = ["lifePath", "expression", "soulUrge", "personality"];
/** Text presentation, so a glyph is never drawn as an emoji. */
const TEXT = "︎";

const WORDS = {
  en: {
    kicker: "Birth portrait",
    sections: { mind: "Mind", heart: "Heart", work: "Work", shadow: "Shadow", love: "Love", becoming: "Becoming" },
    practice: "Practice",
    keep: "Three sentences to keep",
    maps: "Your maps",
    mapsLede: "The cards, numbers and sky this portrait was read from.",
    cards: "Your cards",
    cardsKicker: "From your birth date",
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
    kicker: "Портрет народження",
    sections: { mind: "Розум", heart: "Серце", work: "Справа", shadow: "Тінь", love: "Любов", becoming: "Становлення" },
    practice: "Практика",
    keep: "Три речення, які варто зберегти",
    maps: "Ваші карти",
    mapsLede: "Аркани, числа й небо, з яких прочитано цей портрет.",
    cards: "Ваші аркани",
    cardsKicker: "З вашої дати народження",
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

/** @param {Chapter} chapter @param {string} kicker @param {string} practice */
function chapterHtml(chapter, kicker, practice) {
  return `<section class="chapter">
<p class="fleuron" aria-hidden="true">❦</p>
<p class="kicker">${e(kicker)}</p>
<h2>${e(chapter.title)}</h2>
<p class="lede">${e(chapter.lede)}</p>
${paragraphs(chapter.paragraphs ?? [])}
<div class="practice"><p class="kicker">${e(practice)}</p><p class="prose">${e(chapter.practice)}</p></div>
</section>`;
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

function numbersHtml(byId, lang) {
  const w = WORDS[lang];
  const cells = PLATE.flatMap((role) => {
    const f = byId.get(`num-${role}`);
    if (f?.value === undefined) return [];
    return [`<div class="cell"><dt>${e(NUMBER_TITLES[role][lang])}</dt><dd class="numeral">${f.value}${f.master ? ` <span class="master">${e(w.master)}</span>` : ""}</dd><dd class="meaning">${e(w.roles[role])}</dd></div>`];
  });
  const birthday = byId.get("num-birthday");
  const day = birthday?.value !== undefined ? `<p class="birthday">${e(NUMBER_TITLES.birthday[lang])} <b>${birthday.value}</b> · ${e(w.birthday)}</p>` : "";
  return cells.length ? `<dl class="plate">${cells.join("")}</dl>${day}` : day;
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
    return `<li class="sky-item"><p class="kicker"><span aria-hidden="true">${e(glyph(s.glyph))}</span> ${e(s.label)}</p><div class="sky-cards${s.dealt.length > 1 ? " pair" : ""}">${art}</div>${sign}</li>`;
  });
  const others = PLANETS.filter((p) => p !== "sun" && p !== "moon").flatMap((body) => {
    const f = byId.get(`natal-${body}`);
    if (!f) return [];
    const house = f.house ? ` · ${e(houseName(f.house, lang))}` : "";
    const retro = f.retrograde ? ` <span class="retro" title="${e(w.retrograde)}">℞${TEXT}</span>` : "";
    return [`<li><span class="glyph" aria-hidden="true">${e(glyph(BODY_GLYPHS[body]))}</span> <span class="planet">${e(PLANET_NAMES[body][lang])}</span> <span class="where">${e(eitherSigns(signsOf(f), lang))}${house}</span>${retro}</li>`];
  });
  return `<ul class="sky">${items.join("")}</ul>${others.length ? `<h4>${e(w.others)}</h4><ul class="planets">${others.join("")}</ul>` : ""}`;
}

function teachingsHtml(teachings, lang) {
  const w = WORDS[lang];
  const items = Object.values(teachings ?? {}).map((t) => {
    const sources = (t.sources ?? []).filter((s) => s && s.url).map((s) => `<li><a href="${e(s.url)}">${e(s.title)}</a></li>`).join("");
    return `<li class="teaching"><p class="kicker">${e(t.label)}</p><p>${e(t.text)}</p>${sources ? `<ul class="sources" aria-label="${e(w.sources)}">${sources}</ul>` : ""}</li>`;
  });
  // Every source once, with its address written out: what a printed page can still point to.
  const unique = new Map();
  for (const t of Object.values(teachings ?? {})) for (const s of t.sources ?? []) if (s?.url && !unique.has(s.url)) unique.set(s.url, s.title);
  const bibliography = unique.size
    ? `<section class="bibliography"><h3>${e(w.sources)}</h3><ul>${[...unique].map(([url, title]) => `<li>${e(title)}<br><a href="${e(url)}">${e(url)}</a></li>`).join("")}</ul></section>`
    : "";
  return items.length ? `<section class="teachings"><p class="fleuron" aria-hidden="true">❦</p><h2>${e(w.teachings)}</h2><p class="section-lede">${e(w.teachingsLede)}</p><ul>${items.join("\n")}</ul>${bibliography}</section>` : "";
}

const CSS = `
:root{--ground:#0b1c2c;--deep:#07121d;--ink:#eee6d4;--body:rgba(238,230,212,.86);--soft:rgba(238,230,212,.72);--gilt:#c9b182;--hair:rgba(238,230,212,.14);--plate:rgba(7,18,29,.5);
--display:"Cormorant","Cormorant Garamond","EB Garamond",Garamond,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
--heading:"Cormorant Garamond","Cormorant","EB Garamond",Garamond,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
--sans:"DM Sans","Onest",-apple-system,"Segoe UI",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace}
*{box-sizing:border-box}
html{background:var(--ground);color:var(--ink);-webkit-text-size-adjust:100%}
body{margin:0;font:400 17px/1.8 var(--sans)}
main{max-width:680px;margin:0 auto;padding:72px 24px 48px}
p{margin:0}
a{color:inherit;text-decoration-color:rgba(201,177,130,.55);text-underline-offset:3px}
h1,h2,h3,h4{font-weight:400;margin:0;text-wrap:balance}
.kicker{font:400 11px/1.5 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--gilt)}
.fleuron{text-align:center;font:400 17px/1 var(--heading);color:var(--gilt);margin-bottom:10px}
header{text-align:center}
h1{margin:18px 0 16px;font:300 60px/1.02 var(--display)}
.epigraph{max-width:30em;margin:0 auto 40px;font:italic 400 23px/1.4 var(--heading);color:var(--gilt)}
.prose{color:var(--body);hanging-punctuation:first}
.prose+.prose{text-indent:1.6em}
.overview::first-letter{float:left;padding:8px 10px 0 0;font:400 74px/.8 var(--display);color:var(--gilt)}
.facet{margin-top:44px}
.facet h2,.chapter h2{margin-bottom:14px;font:400 32px/1.15 var(--heading);text-align:center}
.chapter{margin-top:88px}
.chapter>.kicker{text-align:center;margin-bottom:12px}
.lede{max-width:30em;margin:0 auto 26px;font:italic 400 22px/1.45 var(--heading);text-align:center}
.practice{margin:26px 0 0 2px;padding:2px 0 2px 22px;border-left:2px solid var(--gilt)}
.practice .kicker{font-size:10px;margin-bottom:6px}
.practice .prose{font-size:16px;line-height:1.7;color:var(--ink)}
.keep{position:relative;margin-top:96px;padding:40px clamp(20px,7%,56px) 30px;border:1px solid var(--hair);background:var(--plate);text-align:center}
.keep::before{content:"";position:absolute;inset:6px;border:1px solid rgba(201,177,130,.2);pointer-events:none}
.keep h2{font:400 11px/1.5 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--gilt);margin-bottom:8px}
.keep ul{list-style:none;margin:0;padding:0}
.keep li{padding:22px 0;font:400 26px/1.35 var(--heading);text-wrap:balance}
.keep li+li{border-top:1px solid var(--hair)}
.maps{margin-top:120px;text-align:center}
.maps>h2,.teachings>h2{font:300 48px/1.05 var(--display)}
.section-lede{max-width:26em;margin:12px auto 0;font:italic 400 21px/1.45 var(--heading);color:var(--soft)}
.map{margin-top:56px;padding-top:48px;border-top:1px solid var(--hair)}
.map h3{margin:8px 0 32px;font:400 30px/1.15 var(--heading)}
.lattice{display:grid;gap:26px 0;max-width:560px;margin:0 auto}
.row{display:grid;grid-template-columns:repeat(3,1fr)}
.row.pair{grid-template-columns:repeat(2,1fr);padding:0 16.66%}
figure{margin:0;display:grid;justify-items:center;gap:8px;break-inside:avoid}
.art{display:block;width:84px;height:auto;aspect-ratio:120/206;border-radius:5px;object-fit:cover;box-shadow:0 0 0 1px rgba(201,177,130,.32),0 14px 30px rgba(0,0,0,.4)}
.art.missing{background:var(--deep)}
figcaption{display:grid;gap:2px}
.cap{font:400 10px/1.35 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.cap b{font-weight:400;color:var(--gilt)}
.name{font:400 16px/1.3 var(--heading);color:var(--ink)}
.name a{text-decoration:none}
.plate{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;border:1px solid var(--hair)}
.cell{padding:22px 14px 20px}
.cell+.cell{border-left:1px solid var(--hair)}
.cell dt{font:400 10px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--gilt)}
.cell dd{margin:0}
.numeral{font:300 44px/1.1 var(--display);margin:8px 0 6px!important}
.master{display:block;font:400 9px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--gilt)}
.meaning{font-size:13px;line-height:1.55;color:var(--soft)}
.birthday{margin-top:18px;font-size:14px;color:var(--soft)}
.birthday b{font-weight:400;color:var(--ink)}
.sky{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.sky-item{display:grid;justify-items:center;align-content:start;gap:10px}
.sky-cards{display:flex;gap:8px;align-items:center}
.art.unknown{background:none;box-shadow:none;border:1px dashed rgba(201,177,130,.45)}
.sky-cards.pair .art{width:64px}
.sign{font:400 19px/1.3 var(--heading)}
.glyphs{color:var(--gilt)}
.missing-sign{font:italic 400 17px/1.4 var(--heading);color:var(--soft)}
.maps h4{margin:40px 0 14px;font:400 11px/1.5 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--gilt)}
.planets{list-style:none;margin:0 auto;padding:0;max-width:560px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px;text-align:left}
.planets li{display:flex;align-items:baseline;gap:8px;padding:9px 0;border-bottom:1px solid var(--hair);font-size:15px}
.planet{min-width:5.6em}
.glyph{display:inline-block;width:1.4em;color:var(--gilt);font-family:var(--heading)}
.where{color:var(--soft);white-space:nowrap}
.retro{color:var(--gilt)}
.teachings{margin-top:120px;text-align:center}
.teachings>ul{list-style:none;margin:40px 0 0;padding:0;text-align:left}
.teaching{padding:22px 0;border-top:1px solid var(--hair);font-size:15px;line-height:1.7;color:var(--body);break-inside:avoid}
.teaching .kicker{margin-bottom:6px}
.sources{list-style:none;margin:8px 0 0;padding:0;font:400 12px/1.6 var(--mono);color:var(--soft)}
.sources a::before{content:"↗\\FE0E  ";color:var(--gilt)}
.bibliography{margin-top:40px;padding-top:28px;border-top:1px solid var(--hair);text-align:left}
.bibliography h3{font:400 11px/1.5 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--gilt);margin-bottom:12px}
.bibliography ul{list-style:none;margin:0;padding:0;display:grid;gap:12px;font-size:14px;line-height:1.55;color:var(--body)}
.bibliography a{font:400 12px/1.5 var(--mono);color:var(--soft);word-break:break-all}
.honest{margin:88px auto 0;max-width:30em;text-align:center;font:italic 400 20px/1.5 var(--heading);color:var(--soft)}
.colophon{margin-top:48px;padding-top:24px;border-top:1px solid var(--hair);text-align:center;font:400 11px/1.6 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}
.colophon a{text-decoration:none;color:var(--gilt)}
@media (max-width:600px){main{padding:48px 20px 40px}h1{font-size:42px}.epigraph{font-size:20px}.facet h2,.chapter h2{font-size:28px}.lede{font-size:20px}.prose{font-size:16.5px}.keep li{font-size:22px}
.plate{grid-template-columns:repeat(2,minmax(0,1fr))}.cell:nth-child(3){border-left:0}.cell:nth-child(n+3){border-top:1px solid var(--hair)}
.sky{grid-template-columns:1fr}.planets{grid-template-columns:1fr}.art{width:62px}.cap{font-size:9px;letter-spacing:.08em}.name{font-size:14px}}
@page{margin:18mm 16mm}
@media print{
:root{--ink:#16161a;--body:#26262b;--soft:#55555c;--gilt:#6f5b33;--hair:#d6d2c8;--plate:transparent}
html,body{background:#fff;color:var(--ink)}
body{font-size:11.5pt;line-height:1.65}
main{max-width:none;padding:0}
a{color:inherit;text-decoration:none}
.art{box-shadow:0 0 0 .5pt #b9b2a2}
.chapter,.maps,.teachings{break-before:page;margin-top:0}
.keep{break-inside:avoid;margin-top:56px}
.facet,.practice,.cell,.sky-item,.planets li,.lattice,.row,.plate,.sky,.bibliography li{break-inside:avoid}
h1,h2,h3,h4,.kicker,.lede{break-after:avoid}
.map{margin-top:24px;padding-top:20px}
.cell{padding:14px 10px 12px}
.numeral{font-size:34px}
.meaning{font-size:9pt;line-height:1.45}
.birthday{margin-top:10px}
.sky-item{gap:6px}
.sign{font-size:14pt}
.maps h4{margin:22px 0 8px}
.planets{max-width:none;gap:0 28px;break-inside:avoid}
.planets li{padding:5px 0;font-size:10pt}
.map h3{margin-bottom:20px}
.art{width:60px}
.lattice{gap:14px 0}
.teachings>ul{columns:2;column-gap:28px;margin-top:24px}
.teaching{padding:12px 0;font-size:9.5pt;line-height:1.55}
.sources{font-size:8pt}
.sources a::before{content:""}
.bibliography{break-before:avoid}
.honest{margin-top:48px}
}
`;

/**
 * The whole reading as one standalone HTML document.
 * @param {{ locale: Locale, packet: { factors: Factor[] }, stages: Stages, teachings: Teachings, cards: Card[], images: Record<string, string> }} input
 * @returns {string}
 */
export function buildExport({ locale, packet, stages, teachings, cards, images }) {
  const lang = locale === "uk" ? "uk" : "en";
  const w = WORDS[lang];
  const byId = factorsById(packet);
  const a = stages?.a;
  const title = a?.title ?? "";

  const facets = FACETS.flatMap((key) => {
    const f = a?.facets?.[key];
    return f ? [`<section class="facet"><p class="fleuron" aria-hidden="true">❦</p><h2>${e(f.heading)}</h2><p class="prose">${e(f.text)}</p></section>`] : [];
  });
  const chapters = CHAPTERS.flatMap((key, i) => {
    const chapter = stages?.b?.chapters?.[key] ?? stages?.c?.chapters?.[key];
    return chapter ? [chapterHtml(chapter, `${NUMERALS[i]} · ${w.sections[key]}`, w.practice)] : [];
  });
  const keep = stages?.c?.keep?.length
    ? `<section class="keep"><p class="fleuron" aria-hidden="true">❦</p><h2>${e(w.keep)}</h2><ul>${stages.c.keep.map((line) => `<li>${e(line)}</li>`).join("")}</ul></section>`
    : "";
  const hasArkan = (packet?.factors ?? []).some((f) => f.kind === "arkan");
  const maps = hasArkan
    ? `<section class="maps"><p class="fleuron" aria-hidden="true">❦</p><h2>${e(w.maps)}</h2><p class="section-lede">${e(w.mapsLede)}</p>
<section class="map"><p class="kicker">${e(w.cardsKicker)}</p><h3>${e(w.cards)}</h3>${latticeHtml(byId, cards, images, lang)}</section>
<section class="map"><p class="kicker">${e(w.numbersKicker)}</p><h3>${e(w.numbers)}</h3>${numbersHtml(byId, lang)}</section>
<section class="map"><p class="kicker">${e(w.skyKicker)}</p><h3>${e(w.sky)}</h3>${skyHtml(byId, cards, images, lang)}</section>
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
<header>
<p class="kicker">${e(w.kicker)}</p>
<h1>${e(title)}</h1>
<p class="epigraph">${e(a?.epigraph)}</p>
</header>
<p class="prose overview">${e(a?.overview?.text)}</p>
${facets.join("\n")}
${chapters.join("\n")}
${keep}
${maps}
${teachingsHtml(teachings, lang)}
<p class="honest">${e(w.honest)}</p>
<p class="colophon">${e(w.written)} · <a href="${SITE}${lang === "uk" ? "/uk/" : "/"}">oliviaarcana.com</a></p>
</main>
</body>
</html>
`;
}
