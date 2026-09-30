/** What the sky scene is told about the signs, the planets and its own controls, in either language. */

import { SIGN_CARDS, SIGNS } from "@/lib/astrology/chart.js";
import { formatDegree, type Placement } from "@/lib/astrology/types";
import { placedIn } from "@/lib/astrology/grammar";
import { specificReading, splitQuestion, type AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import type { SceneBody, SceneCard, SceneStrings } from "./SkyScene";

const ELEMENTS = ["fire", "earth", "air", "water"];
const MODES = ["cardinal", "fixed", "mutable"];

export const SCENE_STRINGS: Record<"en" | "uk", SceneStrings> = {
  en: {
    hint: "Drag to turn the sky. Tap a card or a planet to bring it close.", stars: "Look at the stars", cards: "Back to the cards",
    zoomIn: "Closer", zoomOut: "Further", whole: "The whole sky", close: "Close", prev: "Previous", next: "Next",
    readCard: "Read the card", here: "Here", empty: "No planet stands in this sign.", conversations: "In conversation with", controls: "The sky",
  },
  uk: {
    hint: "Потягніть, щоб повернути небо. Торкніться карти чи планети, щоб наблизити її.", stars: "Подивитися на зорі", cards: "Повернутися до карт",
    zoomIn: "Ближче", zoomOut: "Далі", whole: "Усе небо", close: "Закрити", prev: "Попередній", next: "Наступний",
    readCard: "Прочитати карту", here: "Тут", empty: "У цьому знаку немає планет.", conversations: "У розмові з", controls: "Небо",
  },
};

/** The twelve sign cards, Aries first; `house` names each sign's whole-sign house when the Rising sign is known. */
export function sceneSigns(copy: AstroCopy, cards: MajorCard[], risingIndex?: number): SceneCard[] {
  return SIGNS.map((sign: string, i: number) => {
    const card = cards[SIGN_CARDS[i]];
    return {
      image: card.image.replace("/cards/", "/cards/wheel/"), href: card.href, name: card.name,
      sign: copy.signs[sign].name, essence: copy.signs[sign].essence,
      kind: `${copy.elements[ELEMENTS[i % 4]]} · ${copy.modalities[MODES[i % 3]].toLowerCase()}`,
      house: risingIndex === undefined ? undefined : copy.houses[String(((i - risingIndex + 12) % 12) + 1)]?.name,
    };
  });
}

/** Each placement's panel: its name, where it stands, what it describes and (in a chart) a question. */
export function sceneBodies(
  locale: "en" | "uk", copy: AstroCopy, placements: Placement[],
  options: { retrograde: string; rising: string; houses?: boolean; questions?: boolean },
): Record<string, SceneBody> {
  return Object.fromEntries(placements.map((p) => {
    const name = p.key === "ascendant" ? options.rising : copy.bodies[p.key].name;
    const house = options.houses && p.house ? copy.houses[String(p.house)]?.name : undefined;
    return [p.key, {
      name,
      title: placedIn(locale, name, p.sign, copy.signs[p.sign].name),
      meta: [formatDegree(p.degree), house, p.retrograde ? options.retrograde : undefined].filter(Boolean).join(" · "),
      // In a chart, the reading written for this placement; for the sky of the moment, what the planet describes
      ...(() => {
        const specific = options.questions ? specificReading(copy, p.key, p.sign) : undefined;
        if (!specific) return { essence: copy.bodies[p.key].essence, question: options.questions ? copy.bodies[p.key].question : undefined };
        const [essence, question] = splitQuestion(specific);
        return { essence, question };
      })(),
    }];
  }));
}

export const aspectNames = (copy: AstroCopy) => Object.fromEntries(Object.entries(copy.aspects).map(([key, value]) => [key, value.name.toLowerCase()]));
