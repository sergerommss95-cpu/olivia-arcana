// website/src/lib/portrait/why.js
/**
 * What the Why drawer says about a passage: each cited factor as one plain
 * line (how a card was found, a number, a planet's sign and house, an aspect),
 * and the cited teachings in the same order. Names come from seals.js; the
 * few joining words live here, beside the grammar they need (Ukrainian
 * locatives and у/в). Plain JS with JSDoc for the node test runner.
 */

import { BODY_GLYPHS } from "../astrology/constants.js";
import { LINKS } from "./arkan.js";
import { READING_ORDER, ROLES } from "./lattice.js";
import { NUMBER_ROLES } from "./numbers.js";
import { PLANETS } from "./packet.js";
import { ANGLE_NAMES, ASPECT_NAMES, NUMBER_TITLES, PLANET_NAMES, SIGN_NAMES } from "./seals.js";

/**
 * @typedef {"en" | "uk"} Locale
 * @typedef {{ key: string, pos: number, card: number, role: string, name: string, from: number[], found: string }} CardLine
 * @typedef {{ key: string, role: string, value: number, master: boolean, text: string }} NumberLine
 * @typedef {{ key: string, glyph: string, text: string, retrograde: boolean, uncertain: boolean }} SkyLine
 * @typedef {{ key: string, glyph: string, text: string }} AspectLine
 */

const WORDS = {
  en: { position: "Position", fromCards: "from cards", fromBirth: "from your birth date", or: "or" },
  uk: { position: "Позиція", fromCards: "з карт", fromBirth: "з вашої дати народження", or: "або" },
};
/** Where a sign is: «у Водолії». */
const SIGNS_IN = {
  aries: "Овні", taurus: "Тельці", gemini: "Близнюках", cancer: "Раку", leo: "Леві", virgo: "Діві",
  libra: "Терезах", scorpio: "Скорпіоні", sagittarius: "Стрільці", capricorn: "Козорозі", aquarius: "Водолії", pisces: "Рибах",
};
const ASPECT_GLYPHS = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍" };
const ANGLE_GLYPHS = { asc: BODY_GLYPHS.ascendant, mc: BODY_GLYPHS.midheaven };
const ANGLE_ORDER = ["asc", "mc"];
const VOWELS = "аеєиіїоуюя";

/** "1st", "2nd", "3rd", "8th", "11th", "12th". */
export function ordinal(n) {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" })[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/**
 * Ukrainian у/в between two words: «у» before в/ф and between consonants,
 * «в» before a vowel and after one.
 * @param {string} before  the word in front (the planet's name)
 * @param {string} after   the word that follows (the sign, located)
 */
export function ukIn(before, after) {
  const first = after[0]?.toLowerCase() ?? "", last = before.at(-1)?.toLowerCase() ?? "";
  if ("вф".includes(first)) return "у";
  if (VOWELS.includes(first)) return "в";
  return VOWELS.includes(last) ? "в" : "у";
}

/** "Taurus or Gemini", "Aries, Taurus or Gemini". */
function either(names, or) {
  return names.length < 2 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} ${or} ${names.at(-1)}`;
}

/** "Mercury in Aquarius" / «Меркурій у Водолії»; with several signs, «Місяць у Тельці або Близнюках». */
function placed(subject, signs, lang) {
  if (lang === "uk") {
    const where = signs.map((s) => SIGNS_IN[s]);
    return `${subject} ${ukIn(subject, where[0])} ${either(where, WORDS.uk.or)}`;
  }
  return `${subject} in ${either(signs.map((s) => SIGN_NAMES[s].en), WORDS.en.or)}`;
}

/**
 * How a card was found: "Position 4 · from cards 1 + 2"; the first three come
 * from the birth date itself.
 * @param {number} pos
 * @param {Locale} locale
 */
export function foundLine(pos, locale) {
  const w = WORDS[locale === "uk" ? "uk" : "en"];
  const from = /** @type {Record<number, number[]>} */ (LINKS)[pos];
  // No-break spaces keep the sum whole; a narrow line breaks after the position.
  return `${w.position}\u00a0${pos} · ${from ? `${w.fromCards.replace(" ", "\u00a0")}\u00a0${from.join("\u00a0+\u00a0")}` : w.fromBirth}`;
}

/** The factor a teaching speaks of, from its id: card-8-strength → arkan-8, natal-moon-sign-taurus → natal-moon. */
export function teachingFactor(id) {
  const card = /^card-(\d+)-/.exec(id);
  if (card) return `arkan-${card[1]}`;
  const num = /^num-([a-zA-Z]+)-/.exec(id);
  if (num) return `num-${num[1]}`;
  const natal = /^natal-([a-z]+)-(sign|house)/.exec(id);
  if (natal) return `natal-${natal[1]}`;
  return id;
}

const GROUP = { arkan: 0, number: 1, planet: 2, angle: 2, aspect: 3 };

/**
 * Everything the drawer lists for one passage: cards in reading order, numbers
 * in role order, planets then angles in the sky's order, aspects as cited, and
 * the cited teachings the status holds, grouped in that same order (cards
 * first), each group as cited. Refs and teachings that are missing are skipped.
 * @param {{ refs: string[], teachings: string[] } | undefined} passage
 * @param {{ factors: any[] } | undefined} packet
 * @param {Locale} locale
 * @param {{ name: string }[]} cards  majorCards(locale), indexed by card id
 * @param {Record<string, unknown> | undefined} teachings  the status's cited teachings, by id
 */
export function explain(passage, packet, locale, cards, teachings) {
  const lang = locale === "uk" ? "uk" : "en";
  const byId = new Map((packet?.factors ?? []).map((f) => [f.id, f]));
  const cited = [...new Set(passage?.refs ?? [])].map((ref) => byId.get(ref)).filter(Boolean);
  const of = (kind) => cited.filter((f) => f.kind === kind);

  /** @type {CardLine[]} */
  const cardLines = of("arkan")
    .sort((a, b) => READING_ORDER.indexOf(a.position) - READING_ORDER.indexOf(b.position))
    .map((f) => ({
      key: f.id, pos: f.position, card: f.card, role: ROLES[f.position][lang], name: cards?.[f.card]?.name ?? "",
      from: /** @type {Record<number, number[]>} */ (LINKS)[f.position] ?? [], found: foundLine(f.position, lang),
    }));

  /** @type {NumberLine[]} */
  const numbers = of("number")
    .sort((a, b) => NUMBER_ROLES.indexOf(a.role) - NUMBER_ROLES.indexOf(b.role))
    .map((f) => {
      const role = NUMBER_TITLES[f.role][lang];
      return { key: f.id, role, value: f.value, master: Boolean(f.master), text: `${role} ${f.value}` };
    });

  /** @type {SkyLine[]} */
  const planets = of("planet")
    .sort((a, b) => PLANETS.indexOf(a.body) - PLANETS.indexOf(b.body))
    .map((f) => {
      const signs = f.alternatives?.length > 1 ? f.alternatives : [f.sign];
      const house = f.house ? (lang === "uk" ? `${f.house}-й дім` : `${ordinal(f.house)} house`) : "";
      const text = placed(PLANET_NAMES[f.body][lang], signs, lang) + (house ? `, ${house}` : "");
      return { key: f.id, glyph: BODY_GLYPHS[f.body], text, retrograde: Boolean(f.retrograde), uncertain: signs.length > 1 };
    });
  /** @type {SkyLine[]} */
  const angles = of("angle")
    .sort((a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle))
    .map((f) => {
      // In English the ascendant is said the everyday way: "Cancer rising".
      const text = lang === "en" && f.angle === "asc" ? `${SIGN_NAMES[f.sign].en} rising` : placed(ANGLE_NAMES[f.angle][lang], [f.sign], lang);
      return { key: f.id, glyph: ANGLE_GLYPHS[f.angle], text, retrograde: false, uncertain: false };
    });

  const point = (key) => (PLANET_NAMES[key] ?? ANGLE_NAMES[key])?.[lang] ?? key;
  /** @type {AspectLine[]} */
  const aspects = of("aspect").map((f) => ({ key: f.id, glyph: ASPECT_GLYPHS[f.aspect] ?? "", text: `${point(f.a)} ${ASPECT_NAMES[f.aspect][lang]} ${point(f.b)}` }));

  const group = (id) => {
    const f = byId.get(teachingFactor(id));
    return f ? GROUP[f.kind] ?? 4 : 4;
  };
  const teachingIds = [...new Set(passage?.teachings ?? [])]
    .filter((id) => teachings && Object.hasOwn(teachings, id))
    .map((id, i) => ({ id, i, g: group(id) }))
    .sort((a, b) => a.g - b.g || a.i - b.i)
    .map((x) => x.id);

  return { cards: cardLines, numbers, sky: [...planets, ...angles], aspects, teachings: teachingIds };
}
