/**
 * Olivia Arcana — Zodiac Daily Video Props
 */

export type ZodiacVideoProps = {
  sign: string;
  glyph: string;
  element: "fire" | "earth" | "air" | "water";
  hook: string;
  body: string;
  cta: string;
  audioSrc: string | null;
  cardImage?: string;
  durationInFrames: number;
};

export const COLORS = {
  voidBlack: "#0D0D1A",
  deepCosmos: "#1A1A3E",
  celestialGold: "#D4AF37",
  slateBlue: "#7B68EE",
  warmIvory: "#F5F0E8",
  mutedLavender: "#9B96A8",
  cosmicTeal: "#4ECDC4",
  marsRed: "#E8524A",
} as const;

export const ELEMENT_COLORS: Record<ZodiacVideoProps["element"], string> = {
  fire: "#E8524A",
  earth: "#4ECDC4",
  air: "#7B68EE",
  water: "#5B8DEF",
} as const;
