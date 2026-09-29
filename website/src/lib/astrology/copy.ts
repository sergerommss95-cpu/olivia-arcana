/** Astrology copy in one language, sliced on the server from copy.json. */

import all from "./copy.json";

type Pair<T> = { en: T; uk: T };
type Named = { name: string; essence: string };

export type AstroCopy = {
  signs: Record<string, Named>;
  elements: Record<string, string>;
  modalities: Record<string, string>;
  bodies: Record<string, Named & { question: string }>;
  houses: Record<string, Named & { area: string }>;
  aspects: Record<string, Named>;
  bigThree: Record<"sun" | "moon" | "ascendant", Record<string, string>>;
  ui: Record<"timeUnknownMoon" | "timeUnknownRising" | "method" | "boundary", string>;
  /** A reading for each planet (beyond the Sun, Moon and Rising) in each sign. */
  placements: Record<string, Record<string, string>>;
  /** A question for the house the Moon is crossing today, by house number. */
  today: Record<string, string>;
};

const pick = <T,>(group: Record<string, Pair<T>>, locale: "en" | "uk") =>
  Object.fromEntries(Object.entries(group).map(([key, value]) => [key, value[locale]]));

export function astroCopy(locale: "en" | "uk"): AstroCopy {
  return {
    signs: pick(all.signs, locale),
    elements: pick(all.elements, locale),
    modalities: pick(all.modalities, locale),
    bodies: pick(all.bodies, locale),
    houses: pick(all.houses, locale),
    aspects: pick(all.aspects, locale),
    bigThree: {
      sun: pick(all.bigThree.sun, locale),
      moon: pick(all.bigThree.moon, locale),
      ascendant: pick(all.bigThree.ascendant, locale),
    },
    ui: pick(all.ui, locale) as AstroCopy["ui"],
    placements: Object.fromEntries(Object.entries(all.placements).map(([body, signs]) => [body, pick(signs, locale)])),
    today: pick(all.today, locale),
  };
}

/** A reading's text, and the question that closes it. */
export function splitQuestion(text: string): [string, string] {
  const match = text.match(/[^.!?…]*\?\s*$/);
  if (!match || match.index === undefined) return [text, ""];
  return [text.slice(0, match.index).trim(), match[0].trim()];
}

/** The reading written for this exact placement, where there is one. */
export function specificReading(copy: AstroCopy, key: string, sign: string): string | undefined {
  if (key === "sun" || key === "moon" || key === "ascendant") return copy.bigThree[key][sign];
  return copy.placements[key]?.[sign];
}
