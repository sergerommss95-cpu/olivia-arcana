/**
 * Barrel export for all symbol path data.
 */

export { ZODIAC_PATHS, type ZodiacId } from "./zodiac";
export { CELESTIAL_PATHS, type CelestialId } from "./celestial";
export { MYSTICAL_PATHS, type MysticalId } from "./mystical";
export { SACRED_GEOMETRY_PATHS, type SacredGeometryId } from "./sacred-geometry";

import { ZODIAC_PATHS } from "./zodiac";
import { CELESTIAL_PATHS } from "./celestial";
import { MYSTICAL_PATHS } from "./mystical";
import { SACRED_GEOMETRY_PATHS } from "./sacred-geometry";

/** All symbol path data merged into one lookup. */
export const ALL_SYMBOLS: Record<string, { paths: string[]; name: string }> = {
  ...ZODIAC_PATHS,
  ...CELESTIAL_PATHS,
  ...MYSTICAL_PATHS,
  ...SACRED_GEOMETRY_PATHS,
};

/** Union of all valid symbol IDs. */
export type SymbolId = keyof typeof ALL_SYMBOLS;

/** Category for material preset selection. */
export type SymbolCategory = "zodiac" | "celestial" | "mystical" | "sacred-geometry";

/** Determine category from symbol ID for auto material selection. */
export function getSymbolCategory(id: string): SymbolCategory {
  if (id in ZODIAC_PATHS) return "zodiac";
  if (id in CELESTIAL_PATHS) return "celestial";
  if (id in MYSTICAL_PATHS) return "mystical";
  return "sacred-geometry";
}
