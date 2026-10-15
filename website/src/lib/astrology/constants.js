/**
 * Astrology vocabulary: signs, bodies, glyphs, card correspondences, aspects.
 *
 * No imports, on purpose. The portrait API (netlify/portrait) reads these
 * names on the server, and chart.js pulls in astronomy-engine, a CommonJS
 * package the Netlify function cannot load. chart.js re-exports everything
 * here, so browser code keeps importing from "@/lib/astrology/chart.js".
 *
 * Plain JS with JSDoc so the node test runner can import it directly.
 */

export const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
export const ELEMENTS = ["fire", "earth", "air", "water"];
export const MODALITIES = ["cardinal", "fixed", "mutable"];

/** Ten bodies in the traditional order, then the Moon's north node. */
export const BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"];
/** @type {Record<string, string>} */
export const BODY_GLYPHS = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇", node: "☊", ascendant: "AC", midheaven: "MC" };

/**
 * Golden Dawn correspondences, as index into the 78-card deck
 * (src/lib/academy/tarot-cards.ts carries the same values on each Major).
 */
export const SIGN_CARDS = [4, 5, 6, 7, 8, 9, 11, 13, 14, 15, 17, 18];
/** @type {Record<string, number>} */
export const BODY_CARDS = { sun: 19, moon: 2, mercury: 1, venus: 3, mars: 16, jupiter: 10, saturn: 21, uranus: 0, neptune: 12, pluto: 20 };

/** Major aspects and their orbs in degrees. */
export const ASPECTS = [
  { key: "conjunction", angle: 0, orb: 8 },
  { key: "sextile", angle: 60, orb: 5 },
  { key: "square", angle: 90, orb: 7 },
  { key: "trine", angle: 120, orb: 7 },
  { key: "opposition", angle: 180, orb: 8 },
];
