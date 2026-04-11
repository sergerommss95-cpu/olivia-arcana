/**
 * constellation-memory.ts — Constellation of Return
 *
 * Maps drawn cards to zodiac signs and computes a brightness map
 * for the ZodiacGL constellation renderer.
 *
 * Most-drawn cards brighten their corresponding zodiac constellation.
 * After 3+ visits, the sky becomes personalized.
 */

import { getAllMemories, getTotalDraws } from "./deck-memory";

// Major Arcana zodiac correspondences (Golden Dawn tradition)
const MAJOR_ARCANA_SIGNS: Record<string, string> = {
  "The Emperor": "Aries",
  "The Hierophant": "Taurus",
  "The Lovers": "Gemini",
  "The Chariot": "Cancer",
  "Strength": "Leo",
  "The Hermit": "Virgo",
  "Justice": "Libra",
  "Death": "Scorpio",
  "Temperance": "Sagittarius",
  "The Devil": "Capricorn",
  "The Star": "Aquarius",
  "The Moon": "Pisces",
};

// Minor Arcana suit → element → signs
const SUIT_SIGNS: Record<string, string[]> = {
  Wands: ["Aries", "Leo", "Sagittarius"],
  Cups: ["Cancer", "Scorpio", "Pisces"],
  Swords: ["Gemini", "Libra", "Aquarius"],
  Pentacles: ["Taurus", "Virgo", "Capricorn"],
};

const ALL_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/**
 * Extract the suit from a Minor Arcana card name.
 * e.g. "Three of Wands" → "Wands", "Queen of Cups" → "Cups"
 */
function extractSuit(cardName: string): string | null {
  const match = cardName.match(/of (Wands|Cups|Swords|Pentacles)$/i);
  return match ? match[1] : null;
}

/**
 * Return zodiac sign(s) associated with a card.
 * Major Arcana → single sign (Golden Dawn).
 * Minor Arcana → three signs via suit-element mapping.
 */
function getCardSigns(cardName: string): string[] {
  // Check Major Arcana direct mapping
  const majorSign = MAJOR_ARCANA_SIGNS[cardName];
  if (majorSign) return [majorSign];

  // Check Minor Arcana suit mapping
  const suit = extractSuit(cardName);
  if (suit) {
    const key = suit.charAt(0).toUpperCase() + suit.slice(1).toLowerCase();
    return SUIT_SIGNS[key] ?? [];
  }

  return [];
}

/**
 * Compute brightness for each zodiac constellation based on draw history.
 *
 * Returns a map of sign name → brightness (0.3 base to 1.0 max).
 * If fewer than 3 total draws, returns uniform base brightness.
 */
export function computeConstellationBrightness(): Record<string, number> {
  const base = 0.3;
  const result: Record<string, number> = {};
  for (const sign of ALL_SIGNS) {
    result[sign] = base;
  }

  const totalDraws = getTotalDraws();
  if (totalDraws < 3) return result;

  const memories = getAllMemories();

  // Accumulate draw weight per sign
  const signWeight: Record<string, number> = {};
  for (const sign of ALL_SIGNS) {
    signWeight[sign] = 0;
  }

  for (const [cardName, memory] of Object.entries(memories)) {
    const signs = getCardSigns(cardName);
    if (signs.length === 0) continue;

    // Major Arcana maps to 1 sign → full weight
    // Minor Arcana maps to 3 signs → weight split evenly
    const weightPerSign = memory.drawCount / signs.length;
    for (const sign of signs) {
      signWeight[sign] = (signWeight[sign] ?? 0) + weightPerSign;
    }
  }

  // Find max weight for normalization
  const maxWeight = Math.max(...Object.values(signWeight), 1);

  // Normalize to base..1.0
  for (const sign of ALL_SIGNS) {
    const normalized = signWeight[sign] / maxWeight;
    result[sign] = base + normalized * (1.0 - base);
  }

  return result;
}
