"use client";

/**
 * SectionDivider — Horizontal rule with centered sacred symbol.
 *
 * Replaces the existing .star-divider pattern with a 3D symbol
 * that rotates and floats between page sections.
 */

import React from "react";
import SymbolElement from "./SymbolElement";
import type { MaterialPreset } from "./materials/presets";

interface SectionDividerProps {
  symbol?: string;
  material?: MaterialPreset;
  size?: number;
  className?: string;
}

export default function SectionDivider({
  symbol = "star",
  material,
  size = 60,
  className,
}: SectionDividerProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem 0",
        opacity: 0.6,
      }}
    >
      <div
        style={{
          flex: 1,
          height: "1px",
          maxWidth: "200px",
          background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)",
        }}
      />
      <SymbolElement
        symbol={symbol}
        material={material}
        size={size}
        rotationSpeed={0.15}
        floatAmplitude={0.06}
        mouseParallax={false}
      />
      <div
        style={{
          flex: 1,
          height: "1px",
          maxWidth: "200px",
          background: "linear-gradient(to left, transparent, rgba(212,175,55,0.3), transparent)",
        }}
      />
    </div>
  );
}
