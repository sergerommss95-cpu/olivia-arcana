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
  };
}
