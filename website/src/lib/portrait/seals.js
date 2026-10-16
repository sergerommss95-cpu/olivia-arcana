// website/src/lib/portrait/seals.js
/**
 * The small marks under a passage that name what it was read from: cards,
 * planets, angles, numbers and aspects. Names match netlify/portrait/teachings.ts
 * and its knowledge bank; the tables are copied because client code must not
 * import netlify/ modules. Plain JS with JSDoc for the node test runner.
 */

import { BODY_GLYPHS } from "../astrology/constants.js";

/**
 * @typedef {"en" | "uk"} Locale
 * @typedef {{ en: string, uk: string }} Text
 * @typedef {{ kind: "card" | "planet" | "angle" | "number" | "aspect", key: string, label: string, image?: string, glyph?: string, value?: number }} Seal
 */

const MAX_SEALS = 4;
const KIND_ORDER = ["card", "planet", "angle", "number", "aspect"];

/** @type {Record<string, Text>} */
const PLANETS = {
  sun: { en: "Sun", uk: "Сонце" }, moon: { en: "Moon", uk: "Місяць" }, mercury: { en: "Mercury", uk: "Меркурій" },
  venus: { en: "Venus", uk: "Венера" }, mars: { en: "Mars", uk: "Марс" }, jupiter: { en: "Jupiter", uk: "Юпітер" },
  saturn: { en: "Saturn", uk: "Сатурн" }, uranus: { en: "Uranus", uk: "Уран" }, neptune: { en: "Neptune", uk: "Нептун" },
  pluto: { en: "Pluto", uk: "Плутон" },
};
/** @type {Record<string, Text>} */
const SIGNS = {
  aries: { en: "Aries", uk: "Овен" }, taurus: { en: "Taurus", uk: "Телець" }, gemini: { en: "Gemini", uk: "Близнюки" },
  cancer: { en: "Cancer", uk: "Рак" }, leo: { en: "Leo", uk: "Лев" }, virgo: { en: "Virgo", uk: "Діва" },
  libra: { en: "Libra", uk: "Терези" }, scorpio: { en: "Scorpio", uk: "Скорпіон" }, sagittarius: { en: "Sagittarius", uk: "Стрілець" },
  capricorn: { en: "Capricorn", uk: "Козоріг" }, aquarius: { en: "Aquarius", uk: "Водолій" }, pisces: { en: "Pisces", uk: "Риби" },
};
/** Angle seals read "Rising" in English; aspects use the full names, as teachings.ts does. @type {Record<string, Text>} */
const ANGLE_SEALS = { asc: { en: "Rising", uk: "Асцендент" }, mc: { en: "Midheaven", uk: "Середина неба" } };
/** @type {Record<string, Text>} */
const ANGLE_NAMES = { asc: { en: "Ascendant", uk: "Асцендент" }, mc: { en: "Midheaven", uk: "Середина неба" } };
const ANGLE_GLYPHS = { asc: BODY_GLYPHS.ascendant, mc: BODY_GLYPHS.midheaven };
/** @type {Record<string, Text>} */
const NUMBER_TITLES = {
  lifePath: { en: "Life path", uk: "Життєвий шлях" },
  expression: { en: "Expression", uk: "Вираження" },
  soulUrge: { en: "Inner motivation", uk: "Внутрішній мотив" },
  personality: { en: "Outward personality", uk: "Зовнішній прояв" },
  birthday: { en: "Birthday", uk: "День народження" },
};
/** Lower case: they sit mid-phrase, "Sun trine Moon". @type {Record<string, Text>} */
const ASPECTS = {
  conjunction: { en: "conjunction", uk: "з’єднання" }, opposition: { en: "opposition", uk: "опозиція" },
  square: { en: "square", uk: "квадрат" }, trine: { en: "trine", uk: "трин" }, sextile: { en: "sextile", uk: "секстиль" },
};

/**
 * @param {any} f  a packet factor
 * @param {Locale} lang
 * @param {{ name: string, thumb: string }[]} cards
 * @returns {Seal | null}
 */
function sealOf(f, lang, cards) {
  const signs = (list) => list.map((s) => SIGNS[s]?.[lang]).join(" / ");
  const point = (key) => (PLANETS[key] ?? ANGLE_NAMES[key])?.[lang];
  switch (f.kind) {
    case "arkan": {
      const card = cards?.[f.card];
      return card ? { kind: "card", key: f.id, label: card.name, image: card.thumb } : null;
    }
    case "planet":
      return { kind: "planet", key: f.id, label: `${PLANETS[f.body][lang]} · ${signs(f.alternatives ?? [f.sign])}`, glyph: BODY_GLYPHS[f.body] };
    case "angle":
      return { kind: "angle", key: f.id, label: `${ANGLE_SEALS[f.angle][lang]} · ${signs([f.sign])}`, glyph: ANGLE_GLYPHS[f.angle] };
    case "number":
      return { kind: "number", key: f.id, label: `${NUMBER_TITLES[f.role][lang]} ${f.value}`, value: f.value };
    case "aspect":
      return { kind: "aspect", key: f.id, label: `${point(f.a)} ${ASPECTS[f.aspect][lang]} ${point(f.b)}` };
    default:
      return null;
  }
}

/**
 * Seals for a passage's refs: card → planet → angle → number → aspect, in ref
 * order within a kind, at most four. Refs the packet does not hold are ignored.
 * @param {string[]} refs
 * @param {{ factors: any[] }} packet
 * @param {Locale} locale
 * @param {{ name: string, thumb: string }[]} cards  majorCards(locale), indexed by card id
 * @returns {Seal[]}
 */
export function sealsFor(refs, packet, locale, cards) {
  const lang = locale === "uk" ? "uk" : "en";
  const byId = new Map((packet?.factors ?? []).map((f) => [f.id, f]));
  /** @type {Seal[]} */
  const seals = [];
  for (const ref of new Set(refs)) {
    const f = byId.get(ref);
    const seal = f && sealOf(f, lang, cards);
    if (seal) seals.push(seal);
  }
  return seals.sort((x, y) => KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind)).slice(0, MAX_SEALS);
}

/** Sign names in both languages, for captions outside the seals. */
export const SIGN_NAMES = SIGNS;
/** The other name tables, for the Why drawer's longer lines (why.js). */
export { PLANETS as PLANET_NAMES, ANGLE_NAMES, NUMBER_TITLES, ASPECTS as ASPECT_NAMES };
