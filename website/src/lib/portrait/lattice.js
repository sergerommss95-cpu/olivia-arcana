// website/src/lib/portrait/lattice.js
/**
 * Where the eleven Arkan cards sit, the threads between them, and which of
 * them a passage lights. Plain JS with JSDoc so the node test runner can
 * import it directly.
 */

import { LINKS } from "./arkan.js";

/** The order the cards turn in and are read in. */
export const READING_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 14];
/** Rows top to bottom, each read left to right. */
export const ROWS = [[1, 2, 3], [4, 5], [7, 6, 8], [13, 12, 14]];
/** Role of each position, as netlify/portrait/teachings.ts names it. */
export const ROLES = {
  1: { en: "Early foundation", uk: "Ранні основи" }, 2: { en: "Adult development", uk: "Дорослий розвиток" },
  3: { en: "Longer perspective", uk: "Довша перспектива" }, 4: { en: "Inner tension", uk: "Внутрішня напруга" },
  5: { en: "Conscious aim", uk: "Усвідомлена мета" }, 6: { en: "Integrating potential", uk: "Інтеграційний потенціал" },
  7: { en: "Contribution", uk: "Внесок" }, 8: { en: "Resource", uk: "Ресурс" },
  12: { en: "Restoration", uk: "Відновлення" }, 13: { en: "Self-image", uk: "Образ себе" },
  14: { en: "Outward presence", uk: "Зовнішній прояв" },
};

const COMPACT_BELOW = 720;
const DESIGN_WIDTH = 820;
const CARD_RATIO = 149 / 86;
/** Column centres as a share of the width; two-card rows sit between them. */
const THREE = [0.17, 0.5, 0.83];
const DESKTOP_THREE = [0.15, 0.5, 0.85];
const between = (cols) => [(cols[0] + cols[1]) / 2, (cols[1] + cols[2]) / 2];

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ positions: Record<number, Point>, card: { w: number, h: number }, height: number }} Layout
 */

/**
 * Desktop (width ≥ 720): the 820-wide design box scaled to `width`.
 * Compact: 54 px cards in three columns.
 * @param {number} width
 * @returns {Layout}
 */
export function layout(width) {
  const compact = width < COMPACT_BELOW;
  const scale = width / DESIGN_WIDTH;
  const w = compact ? 54 : 86 * scale;
  const h = w * CARD_RATIO;
  const cols = compact ? THREE : DESKTOP_THREE;
  const rowsY = compact ? [0.5 * h, 1.75 * h, 3 * h, 4.25 * h] : [95, 285, 475, 662].map((y) => y * scale);
  /** @type {Record<number, Point>} */
  const positions = {};
  ROWS.forEach((row, r) => {
    const xs = row.length === 2 ? between(cols) : cols;
    row.forEach((pos, c) => { positions[pos] = { x: xs[c] * width, y: rowsY[r] }; });
  });
  return { positions, card: { w, h }, height: compact ? 4.85 * h : rowsY[3] + h / 2 };
}

const round = (n) => Math.round(n * 10) / 10;

/**
 * One straight thread per dependency, from each source card to the card it feeds.
 * @param {Layout} l
 * @returns {{ from: number, to: number, d: string }[]}
 */
export function threads(l) {
  return Object.entries(LINKS).flatMap(([key, sources]) => {
    const to = Number(key), end = l.positions[to];
    return sources.map((from) => {
      const start = l.positions[from];
      return { from, to, d: `M ${round(start.x)} ${round(start.y)} L ${round(end.x)} ${round(end.y)}` };
    });
  });
}

/**
 * The Arkan positions a passage cites, in reading order, once each.
 * Refs to factors the packet does not hold are ignored.
 * @param {string[]} refs
 * @param {{ factors: { id: string, kind: string, position?: number }[] }} packet
 * @returns {number[]}
 */
export function litPositions(refs, packet) {
  const cited = new Set(refs);
  const present = new Set((packet?.factors ?? []).filter((f) => f.kind === "arkan").map((f) => f.position));
  return READING_ORDER.filter((pos) => present.has(pos) && cited.has(`arkan-${pos}`));
}
