"use client";

/**
 * FloatingSymbolField — Background symbol distribution.
 * Uses 3dsvg for 3D rendering.
 */

import React from "react";
import SymbolElement from "./SymbolElement";

interface SymbolPlacement {
  symbol: string;
  x: string;
  y: string;
  size: number;
  opacity: number;
  color?: string;
}

interface FloatingSymbolFieldProps {
  placements?: SymbolPlacement[];
  className?: string;
}

const DEFAULT_PLACEMENTS: SymbolPlacement[] = [
  { symbol: "crescentMoon", x: "8%", y: "15%", size: 50, opacity: 0.18 },
  { symbol: "star", x: "88%", y: "25%", size: 40, opacity: 0.12 },
  { symbol: "flowerOfLife", x: "92%", y: "70%", size: 55, opacity: 0.10, color: "#c8b4ff" },
  { symbol: "ankh", x: "5%", y: "75%", size: 45, opacity: 0.14 },
  { symbol: "saturn", x: "15%", y: "45%", size: 35, opacity: 0.10, color: "#a07ae0" },
  { symbol: "vesicaPiscis", x: "82%", y: "50%", size: 42, opacity: 0.08, color: "#c8b4ff" },
];

export default function FloatingSymbolField({
  placements = DEFAULT_PLACEMENTS,
  className,
}: FloatingSymbolFieldProps) {
  return (
    <div className={className} style={{
      position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0,
    }}>
      {placements.map((p, i) => (
        <div key={`${p.symbol}-${i}`} style={{
          position: "absolute", left: p.x, top: p.y,
          transform: "translate(-50%, -50%)", opacity: p.opacity,
        }}>
          <SymbolElement symbol={p.symbol} color={p.color} size={p.size} />
        </div>
      ))}
    </div>
  );
}
