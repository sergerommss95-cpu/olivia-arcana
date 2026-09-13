/**
 * The card of the day — one card, the same for every reader on a given
 * local day, like the leaf of a printed almanac. Seeded by day-of-year;
 * no reroll here (the Academy keeps the playground).
 */

import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";

export function getDailyCard(now: Date = new Date()): { card: TarotCard; reversed: boolean } {
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear * 2654435761;
  const idx = Math.abs(seed) % ALL_CARDS.length;
  const reversed = (Math.abs(seed >> 8) % 3) === 0;
  return { card: ALL_CARDS[idx], reversed };
}

export function getCardNumeral(card: TarotCard): string {
  if (card.arcana === "major") {
    const n = [
      "0","I","II","III","IV","V","VI","VII","VIII","IX","X",
      "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI",
    ];
    return n[card.number] ?? String(card.number);
  }
  const ranks = ["","Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Page","Knight","Queen","King"];
  return ranks[card.number] ?? String(card.number);
}
