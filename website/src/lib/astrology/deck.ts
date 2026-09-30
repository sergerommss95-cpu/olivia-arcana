/**
 * The Major Arcana as the astrology pages need them: name, art, the leaf's
 * essence and first question, in one language. Built on the server so the
 * card library never reaches the browser bundle.
 */

import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { getCardImagePath, getCardThumbPath } from "@/lib/academy/card-images";
import { leafById } from "@/lib/academy/leaf";
import { CARD_SLUGS } from "@/app/cards/card-pages";

export type MajorCard = { id: number; name: string; href: string; image: string; thumb: string; essence: string; question: string };

export function majorCards(locale: "en" | "uk"): MajorCard[] {
  return ALL_CARDS.slice(0, 22).map((card, id) => {
    const leaf = leafById(id);
    const text = leaf?.[locale];
    return {
      id,
      name: locale === "uk" ? TAROT_UK[card.name]?.name ?? card.name : card.name,
      href: `${locale === "uk" ? "/uk" : ""}/cards/${CARD_SLUGS[id]}/`,
      image: getCardImagePath(card),
      thumb: getCardThumbPath(card),
      essence: text?.essence ?? "",
      question: text?.questions[0] ?? "",
    };
  });
}
