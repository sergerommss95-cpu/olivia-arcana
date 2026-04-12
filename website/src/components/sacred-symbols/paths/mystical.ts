/**
 * Mystical symbol SVG paths — occult and esoteric iconography.
 *
 * 100x100 viewBox, centered. Elegant, respectful depictions
 * of traditional mystical symbology for the Olivia Arcana brand.
 */

export const MYSTICAL_PATHS: Record<string, { paths: string[]; name: string }> = {
  allSeeingEye: {
    name: "All-Seeing Eye",
    paths: [
      // Eye outline — almond shape
      "M 10 50 C 25 25, 45 18, 50 18 C 55 18, 75 25, 90 50 C 75 75, 55 82, 50 82 C 45 82, 25 75, 10 50 Z",
      // Iris circle
      "M 50 35 C 58 35, 65 42, 65 50 C 65 58, 58 65, 50 65 C 42 65, 35 58, 35 50 C 35 42, 42 35, 50 35 Z",
      // Pupil
      "M 50 42 C 54 42, 58 46, 58 50 C 58 54, 54 58, 50 58 C 46 58, 42 54, 42 50 C 42 46, 46 42, 50 42 Z",
      // Upper rays
      "M 50 8 L 50 15",
      "M 35 10 L 38 17",
      "M 65 10 L 62 17",
    ],
  },
  crystalBall: {
    name: "Crystal Ball",
    paths: [
      // Sphere
      "M 50 15 C 72 15, 85 32, 85 50 C 85 68, 72 82, 50 82 C 28 82, 15 68, 15 50 C 15 32, 28 15, 50 15 Z",
      // Reflection highlight
      "M 35 30 C 38 25, 45 22, 48 28",
      // Base/stand
      "M 30 82 C 30 88, 35 92, 50 92 C 65 92, 70 88, 70 82",
      // Inner mist swirl
      "M 38 55 C 42 48, 55 45, 62 52 C 68 58, 58 65, 50 60",
    ],
  },
  tarotCard: {
    name: "Tarot Card",
    paths: [
      // Card outline with rounded corners
      "M 28 12 C 28 10, 30 8, 32 8 L 68 8 C 70 8, 72 10, 72 12 L 72 88 C 72 90, 70 92, 68 92 L 32 92 C 30 92, 28 90, 28 88 Z",
      // Inner border
      "M 33 15 L 67 15 L 67 85 L 33 85 Z",
      // Star in center
      "M 50 30 L 55 44 L 68 44 L 58 54 L 62 68 L 50 60 L 38 68 L 42 54 L 32 44 L 45 44 Z",
    ],
  },
  pentagram: {
    name: "Pentagram",
    paths: [
      // Outer circle
      "M 50 8 C 73 8, 92 27, 92 50 C 92 73, 73 92, 50 92 C 27 92, 8 73, 8 50 C 8 27, 27 8, 50 8 Z",
      // Five-pointed star inscribed
      "M 50 14 L 62 42 L 90 42 L 68 60 L 76 88 L 50 72 L 24 88 L 32 60 L 10 42 L 38 42 Z",
    ],
  },
  ouroboros: {
    name: "Ouroboros",
    paths: [
      // Serpent forming a circle, eating its tail
      "M 78 50 C 78 34, 66 18, 50 18 C 34 18, 22 34, 22 50 C 22 66, 34 82, 50 82 C 62 82, 72 74, 76 64",
      // Head (wider, eating the tail)
      "M 76 64 C 80 58, 84 54, 82 48 C 80 44, 76 46, 78 50",
      // Eye dot
      "M 79 52 L 80 52",
      // Scale texture hints
      "M 50 18 C 48 22, 52 22, 50 18",
      "M 30 28 C 28 32, 32 32, 30 28",
      "M 22 50 C 26 48, 26 52, 22 50",
    ],
  },
  ankh: {
    name: "Ankh",
    paths: [
      // Loop at top
      "M 50 20 C 60 20, 68 28, 68 36 C 68 44, 60 50, 50 50 C 40 50, 32 44, 32 36 C 32 28, 40 20, 50 20 Z",
      // Vertical bar
      "M 50 50 L 50 90",
      // Horizontal arms
      "M 32 62 L 68 62",
    ],
  },
};

export type MysticalId = keyof typeof MYSTICAL_PATHS;
