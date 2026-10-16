/**
 * The whole deck as the daily page needs it, in one language: name, art and the leaf's
 * essence, first upright and reversed paragraph and first question. Built on the server
 * (like the astrology pages' majorCards) so the card library itself never reaches the browser;
 * the card of the day is chosen on the reader's device because the export was built on another day.
 */

import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { getCardImagePath, getCardThumbPath } from "@/lib/academy/card-images";
import { leafById } from "@/lib/academy/leaf";
import { CARD_SLUGS } from "@/app/cards/card-pages";

export type DeckCard = {
  id: number; name: string; href: string; image: string; thumb: string;
  essence: string; upright: string; reversed: string; question: string;
};

export function dailyDeck(locale: "en" | "uk"): DeckCard[] {
  return ALL_CARDS.map((card, id) => {
    const text = leafById(id)?.[locale];
    return {
      id,
      name: locale === "uk" ? TAROT_UK[card.name]?.name ?? card.name : card.name,
      href: `${locale === "uk" ? "/uk" : ""}/cards/${CARD_SLUGS[id]}/`,
      image: getCardImagePath(card),
      thumb: getCardThumbPath(card),
      essence: text?.essence ?? "",
      upright: text?.upright[0] ?? "",
      reversed: text?.reversed[0] ?? "",
      question: text?.questions[0] ?? "",
    };
  });
}
