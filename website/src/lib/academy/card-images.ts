/**
 * card-images.ts — Maps TarotCard objects to their processed card image paths.
 *
 * The 78 card PNGs live at /public/cards/{paddedIndex}_{slug}.png
 * Index matches the position in ALL_CARDS (0-77):
 *   Major Arcana: 0-21
 *   Wands: 22-35
 *   Cups: 36-49
 *   Swords: 50-63
 *   Pentacles: 64-77
 */

import { ALL_CARDS, type TarotCard } from "./tarot-cards";

/** Slugify a card name: "The Fool" → "the_fool" */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_");
}

/** Get the image path for a card. */
export function getCardImagePath(card: TarotCard): string {
  const index = ALL_CARDS.indexOf(card);
  if (index === -1) return "/cards/00_the_fool.webp";
  const padded = String(index).padStart(2, "0");
  return `/cards/${padded}_${slugify(card.name)}.webp`;
}

/**
 * "Portal" variant — same figure, flat indigo backdrop removed so the card
 * can sit over a nebula gradient (matching the card back's atmosphere).
 * Use in contexts that render their own rich backdrop behind the figure.
 */
export function getCardPortalImagePath(card: TarotCard): string {
  const index = ALL_CARDS.indexOf(card);
  if (index === -1) return "/cards-portal/00_the_fool.webp";
  const padded = String(index).padStart(2, "0");
  return `/cards-portal/${padded}_${slugify(card.name)}.webp`;
}
