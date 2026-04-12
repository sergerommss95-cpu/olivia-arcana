"use client";

/**
 * FloatingSymbolField — Distributes multiple symbols at
 * deterministic positions within a container as background decoration.
 *
 * Symbols are absolutely positioned, faded, and parallax-enabled.
 * Uses a seeded layout so positions are stable across renders.
 */

import React from "react";
import SymbolElement from "./SymbolElement";
import type { MaterialPreset } from "./materials/presets";

interface SymbolPlacement {
  symbol: string;
  x: string; // CSS percentage
  y: string;
  size: number;
  opacity: number;
  material?: MaterialPreset;
  rotationSpeed?: number;
}

interface FloatingSymbolFieldProps {
  /** Predefined placements. If omitted, uses default cosmic layout. */
  placements?: SymbolPlacement[];
  /** Additional class names. */
  className?: string;
}

const DEFAULT_PLACEMENTS: SymbolPlacement[] = [
  { symbol: "crescentMoon", x: "8%", y: "15%", size: 50, opacity: 0.18, rotationSpeed: 0.1 },
  { symbol: "star", x: "88%", y: "25%", size: 40, opacity: 0.12, rotationSpeed: 0.2 },
  { symbol: "flowerOfLife", x: "92%", y: "70%", size: 55, opacity: 0.10, material: "holo", rotationSpeed: 0.08 },
  { symbol: "ankh", x: "5%", y: "75%", size: 45, opacity: 0.14, rotationSpeed: 0.15 },
  { symbol: "saturn", x: "15%", y: "45%", size: 35, opacity: 0.10, material: "glass", rotationSpeed: 0.12 },
  { symbol: "vesicaPiscis", x: "82%", y: "50%", size: 42, opacity: 0.08, material: "holo", rotationSpeed: 0.06 },
];

export default function FloatingSymbolField({
  placements = DEFAULT_PLACEMENTS,
  className,
}: FloatingSymbolFieldProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {placements.map((p, i) => (
        <div
          key={`${p.symbol}-${i}`}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            transform: "translate(-50%, -50%)",
            opacity: p.opacity,
          }}
        >
          <SymbolElement
            symbol={p.symbol}
            material={p.material}
            size={p.size}
            rotationSpeed={p.rotationSpeed ?? 0.15}
            floatAmplitude={0.08}
            mouseParallax={false}
          />
        </div>
      ))}
    </div>
  );
}
