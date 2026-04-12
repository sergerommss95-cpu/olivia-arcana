"use client";

/**
 * Test page — renders all 30 sacred symbols in a grid.
 * Visit /symbols-test to verify rendering.
 * DELETE THIS FILE before production.
 */

import React from "react";
import { SymbolElement, SectionDivider, ALL_SYMBOLS, getSymbolCategory } from "@/components/sacred-symbols";

export default function SymbolsTestPage() {
  const ids = Object.keys(ALL_SYMBOLS);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#04020d",
      padding: "3rem 2rem",
      position: "relative",
      zIndex: 1,
    }}>
      <h1 style={{
        fontFamily: "var(--font-heading)",
        fontSize: "2rem",
        color: "rgba(240,236,255,0.9)",
        textAlign: "center",
        marginBottom: "1rem",
      }}>
        Sacred Symbols Gallery
      </h1>
      <p style={{
        textAlign: "center",
        color: "rgba(196,185,228,0.6)",
        fontSize: "0.85rem",
        marginBottom: "3rem",
      }}>
        {ids.length} symbols / gold (zodiac) / glass (celestial) / holo (sacred-geometry)
      </p>

      <SectionDivider symbol="star" />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 0",
      }}>
        {ids.map((id) => {
          const data = ALL_SYMBOLS[id];
          const cat = getSymbolCategory(id);
          return (
            <div key={id} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1.5rem",
              borderRadius: "1rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(200,185,255,0.08)",
            }}>
              <SymbolElement symbol={id} size={100} />
              <span style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.75rem",
                color: "rgba(240,236,255,0.7)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                {data.name}
              </span>
              <span style={{
                fontSize: "0.6rem",
                color: "rgba(160,145,200,0.5)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {cat}
              </span>
            </div>
          );
        })}
      </div>

      <SectionDivider symbol="crescentMoon" material="glass" />
      <SectionDivider symbol="flowerOfLife" material="holo" />
    </div>
  );
}
