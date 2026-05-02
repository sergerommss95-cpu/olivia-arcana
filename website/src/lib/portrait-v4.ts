/**
 * portrait-v4.ts — 3D Generative Alchemical Engine
 * 
 * Maps natal data to 3D physical parameters for the "Relic" portrait.
 */

import { type NatalChart } from "./natal-chart";

export interface Portrait3DConfig {
  element: "Fire" | "Water" | "Air" | "Earth";
  modality: "Cardinal" | "Fixed" | "Mutable";
  complexity: number; // based on aspect count
  innerRadius: number;
  outerRadius: number;
  rotationSpeed: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  planetPositions: { name: string; angle: number; house: number; glyph: string }[];
  aspectLinks: { from: number; to: number; type: string; color: string; strength: number }[];
}

const ELEMENT_STYLES = {
  Fire: { primary: "#e8524a", secondary: "#D4AF37", accent: "#ff9500", glow: "rgba(232, 82, 74, 0.4)" },
  Water: { primary: "#6b8dd6", secondary: "#4ECDC4", accent: "#00d2ff", glow: "rgba(107, 141, 214, 0.4)" },
  Air: { primary: "#7b68ee", secondary: "#c8b4ff", accent: "#ffffff", glow: "rgba(123, 104, 238, 0.4)" },
  Earth: { primary: "#4ecdc4", secondary: "#C6A962", accent: "#d4af37", glow: "rgba(78, 205, 196, 0.4)" },
};

export function build3DPortraitConfig(chart: NatalChart): Portrait3DConfig {
  const element = chart.elementBalance.dominant as keyof typeof ELEMENT_STYLES;
  const style = ELEMENT_STYLES[element] || ELEMENT_STYLES.Air;
  
  const planetPositions = chart.planets.map(p => ({
    name: p.name,
    angle: (p.degree / 360) * Math.PI * 2,
    house: p.house,
    glyph: p.glyph
  }));

  const aspectLinks = chart.aspects.map(a => {
    let color = style.secondary;
    if (a.harmony === "tense") color = style.primary;
    if (a.type === "trine") color = style.accent;
    
    // Find planet indices
    const fromIdx = chart.planets.findIndex(p => p.name === a.planet1);
    const toIdx = chart.planets.findIndex(p => p.name === a.planet2);
    const strength = Math.max(0.2, 1 - a.orb / 10);
    
    return { from: fromIdx, to: toIdx, type: a.type, color, strength };
  });

  return {
    element: element as "Fire" | "Water" | "Air" | "Earth",
    modality: chart.modalityBalance.dominant as "Cardinal" | "Fixed" | "Mutable",
    complexity: chart.aspects.length,
    innerRadius: 0.5,
    outerRadius: 2.2,
    rotationSpeed: 0.05,
    colors: style,
    planetPositions,
    aspectLinks
  };
}
