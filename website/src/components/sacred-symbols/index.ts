/**
 * Sacred Symbols — barrel export.
 *
 * Usage:
 *   import { SymbolElement, SectionDivider, FloatingSymbolField } from "@/components/sacred-symbols";
 */

export { default as SymbolElement } from "./SymbolElement";
export { default as SectionDivider } from "./SectionDivider";
export { default as FloatingSymbolField } from "./FloatingSymbolField";
export { default as Symbol3D } from "./Symbol3D";
export { default as Symbol2DFallback } from "./Symbol2DFallback";

// Re-export types and data
export { ALL_SYMBOLS, getSymbolCategory } from "./paths";
export type { SymbolId, SymbolCategory } from "./paths";
export type { MaterialPreset } from "./materials/presets";
