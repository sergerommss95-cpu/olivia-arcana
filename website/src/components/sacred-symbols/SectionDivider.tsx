"use client";

/**
 * SectionDivider — Horizontal rule with centered sacred symbol.
 * Uses 3dsvg for 3D rendering.
 */

import React from "react";
import SymbolElement from "./SymbolElement";

interface SectionDividerProps {
  symbol?: string;
  color?: string;
  size?: number;
  className?: string;
}

export default function SectionDivider({
  symbol = "star",
  color,
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
      <div style={{
        flex: 1, height: "1px", maxWidth: "200px",
        background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)",
      }} />
      <SymbolElement symbol={symbol} color={color} size={size} />
      <div style={{
        flex: 1, height: "1px", maxWidth: "200px",
        background: "linear-gradient(to left, transparent, rgba(212,175,55,0.3), transparent)",
      }} />
    </div>
  );
}
