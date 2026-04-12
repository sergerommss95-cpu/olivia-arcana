/**
 * Celestial body SVG paths — moon phases, sun, star, planets.
 *
 * 100x100 viewBox, centered. Clean geometry for 3D extrusion.
 */

export const CELESTIAL_PATHS: Record<string, { paths: string[]; name: string }> = {
  crescentMoon: {
    name: "Crescent Moon",
    paths: [
      // Waxing crescent — outer circle subtracted by inner offset circle
      "M 55 15 C 75 20, 85 40, 85 55 C 85 75, 70 90, 50 90 C 35 90, 20 78, 18 60 C 32 78, 55 72, 60 50 C 63 35, 58 20, 55 15 Z",
    ],
  },
  fullMoon: {
    name: "Full Moon",
    paths: [
      // Circle with subtle crater hints
      "M 50 10 C 72 10, 90 28, 90 50 C 90 72, 72 90, 50 90 C 28 90, 10 72, 10 50 C 10 28, 28 10, 50 10 Z",
      // Inner crater suggestion
      "M 38 35 C 42 32, 48 34, 46 38 C 44 42, 38 40, 38 35 Z",
      "M 60 55 C 65 52, 70 56, 68 60 C 66 64, 58 62, 60 55 Z",
    ],
  },
  sun: {
    name: "Sun",
    paths: [
      // Central disc
      "M 50 25 C 64 25, 75 36, 75 50 C 75 64, 64 75, 50 75 C 36 75, 25 64, 25 50 C 25 36, 36 25, 50 25 Z",
      // Rays (8 directions)
      "M 50 8 L 50 18",
      "M 50 82 L 50 92",
      "M 8 50 L 18 50",
      "M 82 50 L 92 50",
      "M 20 20 L 27 27",
      "M 73 73 L 80 80",
      "M 80 20 L 73 27",
      "M 27 73 L 20 80",
    ],
  },
  star: {
    name: "Star",
    paths: [
      // Five-pointed star
      "M 50 10 L 61 38 L 92 38 L 67 58 L 76 88 L 50 70 L 24 88 L 33 58 L 8 38 L 39 38 Z",
    ],
  },
  saturn: {
    name: "Saturn",
    paths: [
      // Planet with ring — cross, arc, ring
      "M 42 18 L 58 18",
      "M 50 18 L 50 55",
      "M 50 55 C 50 70, 35 78, 25 70",
      // Ring
      "M 28 48 C 40 38, 72 38, 82 52",
    ],
  },
  northNode: {
    name: "North Node",
    paths: [
      // Ascending node — horseshoe opening up
      "M 25 70 C 25 35, 50 20, 50 20 C 50 20, 75 35, 75 70",
      // Small circles at endpoints
      "M 25 70 C 20 70, 18 75, 22 78 C 26 81, 30 77, 28 73 C 27 71, 25 70, 25 70 Z",
      "M 75 70 C 80 70, 82 75, 78 78 C 74 81, 70 77, 72 73 C 73 71, 75 70, 75 70 Z",
    ],
  },
};

export type CelestialId = keyof typeof CELESTIAL_PATHS;
