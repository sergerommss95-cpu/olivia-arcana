/**
 * visitor-archetype.ts — Visitor Archetype System
 *
 * Based on the three most-drawn Major Arcana cards, compute a Jungian
 * archetype. Maps to a subtle nebula palette shift so returning visitors
 * see a sky that reflects their reading patterns.
 */

import { getAllMemories, getTotalDraws } from "./deck-memory";

export interface VisitorArchetype {
  hueShift: number;
  saturation: number;
  warmth: number;
}

// Major Arcana archetype groupings
const ARCHETYPE_GROUPS: Record<string, string[]> = {
  Mystic: ["The High Priestess", "The Hermit", "The Moon", "The Star"],
  Sovereign: ["The Emperor", "The Empress", "The Chariot", "The Sun"],
  Transformer: ["Death", "The Tower", "Wheel of Fortune", "Judgement"],
  Seeker: ["The Fool", "The Magician", "The World", "The Lovers"],
};

const ARCHETYPE_PALETTES: Record<string, VisitorArchetype> = {
  Mystic: {
    hueShift: -12 * (Math.PI / 180),
    saturation: 0.92,
    warmth: -0.03,
  },
  Sovereign: {
    hueShift: 10 * (Math.PI / 180),
    saturation: 1.12,
    warmth: 0.04,
  },
  Transformer: {
    hueShift: -8 * (Math.PI / 180),
    saturation: 1.05,
    warmth: -0.01,
  },
  Seeker: {
    hueShift: 5 * (Math.PI / 180),
    saturation: 1.0,
    warmth: 0.02,
  },
};

// Build a reverse lookup: card name → archetype key
const CARD_TO_ARCHETYPE: Record<string, string> = {};
for (const [archetype, cards] of Object.entries(ARCHETYPE_GROUPS)) {
  for (const card of cards) {
    CARD_TO_ARCHETYPE[card] = archetype;
  }
}

/**
 * Determine the visitor's dominant archetype from their draw history.
 *
 * Returns a neutral palette until enough draw history exists.
 * Otherwise scores each archetype by how many times its Major Arcana cards
 * have been drawn, and returns the dominant palette.
 */
export function getVisitorArchetype(): VisitorArchetype {
  const totalDraws = getTotalDraws();
  if (totalDraws < 5) return { hueShift: 0, saturation: 1, warmth: 0 };

  const memories = getAllMemories();

  // Score each archetype
  const scores: Record<string, number> = {
    Mystic: 0,
    Sovereign: 0,
    Transformer: 0,
    Seeker: 0,
  };

  for (const [cardName, memory] of Object.entries(memories)) {
    const archetype = CARD_TO_ARCHETYPE[cardName];
    if (archetype) {
      scores[archetype] += memory.drawCount;
    }
  }

  // Find dominant archetype
  let dominant = "Seeker";
  let maxScore = 0;
  for (const [key, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominant = key;
    }
  }

  // If no Major Arcana drawn at all, default to Seeker
  if (maxScore === 0) {
    return { hueShift: 0, saturation: 1, warmth: 0 };
  }

  return ARCHETYPE_PALETTES[dominant];
}
