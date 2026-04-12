/**
 * Zodiac glyph SVG paths — 12 signs.
 *
 * Each path is designed within a 100x100 viewBox, centered,
 * with elegant line weights matching the Olivia Arcana aesthetic.
 * Stroke-based glyphs for clean extrusion into 3D.
 */

export const ZODIAC_PATHS: Record<string, { paths: string[]; name: string }> = {
  aries: {
    name: "Aries",
    paths: [
      // Ram horns — two sweeping curves meeting at a point
      "M 50 85 L 50 35 C 50 15, 30 10, 20 25 C 15 32, 18 40, 25 38",
      "M 50 35 C 50 15, 70 10, 80 25 C 85 32, 82 40, 75 38",
    ],
  },
  taurus: {
    name: "Taurus",
    paths: [
      // Bull head — circle with horns
      "M 50 75 C 30 75, 20 60, 20 50 C 20 35, 35 25, 50 25 C 65 25, 80 35, 80 50 C 80 60, 70 75, 50 75 Z",
      "M 25 30 C 22 18, 30 10, 38 18",
      "M 75 30 C 78 18, 70 10, 62 18",
    ],
  },
  gemini: {
    name: "Gemini",
    paths: [
      // Twins pillars with connecting bars
      "M 30 20 L 30 80",
      "M 70 20 L 70 80",
      "M 25 20 C 35 15, 65 15, 75 20",
      "M 25 80 C 35 85, 65 85, 75 80",
    ],
  },
  cancer: {
    name: "Cancer",
    paths: [
      // Crab claws — two interlocking spirals
      "M 28 42 C 28 28, 50 20, 65 30 C 72 35, 72 42, 65 42",
      "M 72 58 C 72 72, 50 80, 35 70 C 28 65, 28 58, 35 58",
    ],
  },
  leo: {
    name: "Leo",
    paths: [
      // Lion's mane spiral + tail
      "M 65 70 C 80 70, 80 50, 65 45 C 50 40, 35 50, 35 60 C 35 75, 55 78, 55 62 C 55 52, 45 48, 40 55",
      "M 65 70 C 68 78, 75 82, 78 78",
    ],
  },
  virgo: {
    name: "Virgo",
    paths: [
      // Three vertical strokes with cross
      "M 25 20 L 25 65 C 25 72, 30 72, 30 65 L 30 20",
      "M 45 20 L 45 65 C 45 72, 50 72, 50 65 L 50 20",
      "M 65 20 L 65 55 C 65 68, 80 72, 82 60",
      "M 72 48 L 82 58",
    ],
  },
  libra: {
    name: "Libra",
    paths: [
      // Scales — balanced beams
      "M 20 70 L 80 70",
      "M 20 55 L 80 55",
      "M 50 55 C 50 35, 35 30, 30 40",
      "M 50 55 C 50 35, 65 30, 70 40",
    ],
  },
  scorpio: {
    name: "Scorpio",
    paths: [
      // Scorpion with arrow tail
      "M 25 20 L 25 65 C 25 72, 30 72, 30 65 L 30 20",
      "M 45 20 L 45 65 C 45 72, 50 72, 50 65 L 50 20",
      "M 65 20 L 65 65 C 65 78, 80 78, 82 68",
      "M 76 74 L 84 66 L 82 76",
    ],
  },
  sagittarius: {
    name: "Sagittarius",
    paths: [
      // Arrow — diagonal with cross
      "M 25 75 L 75 25",
      "M 55 25 L 75 25 L 75 45",
      "M 35 55 L 55 35",
    ],
  },
  capricorn: {
    name: "Capricorn",
    paths: [
      // Sea-goat — horn curve with fish tail loop
      "M 25 25 C 25 55, 40 65, 50 55 C 55 50, 55 40, 50 35 L 50 70 C 50 80, 60 85, 70 78 C 78 72, 75 62, 65 65",
    ],
  },
  aquarius: {
    name: "Aquarius",
    paths: [
      // Water waves — two zigzag lines
      "M 20 40 L 30 32 L 40 40 L 50 32 L 60 40 L 70 32 L 80 40",
      "M 20 58 L 30 50 L 40 58 L 50 50 L 60 58 L 70 50 L 80 58",
    ],
  },
  pisces: {
    name: "Pisces",
    paths: [
      // Two fish arcs with connecting bar
      "M 30 25 C 15 35, 15 65, 30 75",
      "M 70 25 C 85 35, 85 65, 70 75",
      "M 20 50 L 80 50",
    ],
  },
};

export type ZodiacId = keyof typeof ZODIAC_PATHS;
