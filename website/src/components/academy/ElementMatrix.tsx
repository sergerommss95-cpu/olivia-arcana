"use client";

import React, { useState, useCallback } from "react";

/**
 * ElementMatrix — 4×3 grid revealing the zodiac's mathematical structure.
 *
 * AHA moment: "The zodiac isn't random — it's a perfect 4×3 matrix.
 * Every element has exactly one Cardinal, one Fixed, one Mutable sign."
 *
 * Cells start hidden. Click to reveal one by one, or hit "Reveal All"
 * for a dramatic cascade that shows the entire structure at once.
 */

interface Cell {
  name: string;
  glyph: string;
  element: string;
  modality: string;
}

const MATRIX: Cell[][] = [
  // Cardinal row
  [
    { name: "Aries",      glyph: "♈", element: "Fire",  modality: "Cardinal" },
    { name: "Capricorn",  glyph: "♑", element: "Earth", modality: "Cardinal" },
    { name: "Libra",      glyph: "♎", element: "Air",   modality: "Cardinal" },
    { name: "Cancer",     glyph: "♋", element: "Water", modality: "Cardinal" },
  ],
  // Fixed row
  [
    { name: "Leo",        glyph: "♌", element: "Fire",  modality: "Fixed" },
    { name: "Taurus",     glyph: "♉", element: "Earth", modality: "Fixed" },
    { name: "Aquarius",   glyph: "♒", element: "Air",   modality: "Fixed" },
    { name: "Scorpio",    glyph: "♏", element: "Water", modality: "Fixed" },
  ],
  // Mutable row
  [
    { name: "Sagittarius", glyph: "♐", element: "Fire",  modality: "Mutable" },
    { name: "Virgo",       glyph: "♍", element: "Earth", modality: "Mutable" },
    { name: "Gemini",      glyph: "♊", element: "Air",   modality: "Mutable" },
    { name: "Pisces",      glyph: "♓", element: "Water", modality: "Mutable" },
  ],
];

const ELEMENTS = ["Fire", "Earth", "Air", "Water"];
const MODALITIES = ["Cardinal", "Fixed", "Mutable"];

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#E8524A", Earth: "#4ECDC4", Air: "#D4AF37", Water: "#7B68EE",
};
const ELEMENT_EMOJI: Record<string, string> = {
  Fire: "🔥", Earth: "🌍", Air: "💨", Water: "💧",
};
const MODALITY_DESC: Record<string, string> = {
  Cardinal: "Initiates — starts new things",
  Fixed: "Sustains — maintains and deepens",
  Mutable: "Adapts — transforms and evolves",
};

export default function ElementMatrix() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [allRevealed, setAllRevealed] = useState(false);
  const [cascading, setCascading] = useState(false);

  const isRevealed = useCallback(
    (r: number, c: number) => allRevealed || revealed.has(`${r}-${c}`),
    [allRevealed, revealed]
  );

  const toggleCell = (r: number, c: number) => {
    if (allRevealed) return;
    setRevealed(prev => {
      const next = new Set(prev);
      const key = `${r}-${c}`;
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const revealAll = () => {
    if (allRevealed) return;
    setCascading(true);
    // Cascade reveal: one cell at a time with delay
    let delay = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        setTimeout(() => {
          setRevealed(prev => new Set(prev).add(`${r}-${c}`));
        }, delay);
        delay += 80;
      }
    }
    setTimeout(() => {
      setAllRevealed(true);
      setCascading(false);
    }, delay + 200);
  };

  const totalRevealed = allRevealed ? 12 : revealed.size;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(200,168,75,0.4)", marginBottom: "0.25rem",
        }}>
          {totalRevealed === 0 ? "TAP CELLS TO DISCOVER" : `${totalRevealed}/12 REVEALED`}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", minWidth: "300px" }}>
          {/* Column headers (Elements) */}
          <thead>
            <tr>
              <th style={{ width: "70px" }} />
              {ELEMENTS.map(elem => (
                <th key={elem} style={{
                  padding: "0.5rem 0.25rem", textAlign: "center",
                  fontFamily: "var(--font-body)", fontSize: "0.62rem", fontWeight: 600,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: ELEMENT_COLORS[elem],
                }}>
                  <span style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.15rem" }}>
                    {ELEMENT_EMOJI[elem]}
                  </span>
                  {elem}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODALITIES.map((mod, ri) => (
              <tr key={mod}>
                {/* Row header (Modality) */}
                <td style={{
                  padding: "0.4rem 0.5rem", verticalAlign: "middle",
                  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600,
                  letterSpacing: "0.04em", color: "rgba(180,170,210,0.5)", textAlign: "right",
                }}>
                  <div>{mod}</div>
                  <div style={{ fontSize: "0.48rem", fontWeight: 300, color: "rgba(180,170,210,0.3)", marginTop: "0.1rem" }}>
                    {MODALITY_DESC[mod]}
                  </div>
                </td>
                {MATRIX[ri].map((cell, ci) => {
                  const shown = isRevealed(ri, ci);
                  return (
                    <td
                      key={cell.name}
                      onClick={() => toggleCell(ri, ci)}
                      style={{
                        padding: "0.75rem 0.4rem", textAlign: "center", cursor: allRevealed ? "default" : "pointer",
                        borderRadius: "0.5rem",
                        background: shown ? `${ELEMENT_COLORS[cell.element]}10` : "rgba(232,230,240,0.025)",
                        border: `1px solid ${shown ? `${ELEMENT_COLORS[cell.element]}25` : "rgba(200,185,255,0.05)"}`,
                        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        position: "relative", overflow: "hidden",
                      }}
                    >
                      {shown ? (
                        <>
                          <div style={{
                            fontSize: "1.3rem", marginBottom: "0.15rem",
                            color: ELEMENT_COLORS[cell.element],
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}>
                            {cell.glyph}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 500,
                            color: "rgba(240,236,255,0.8)",
                          }}>
                            {cell.name}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontSize: "1.2rem", color: "rgba(200,185,255,0.15)",
                          userSelect: "none",
                        }}>
                          ?
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reveal All button */}
      {!allRevealed && (
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button
            onClick={revealAll}
            disabled={cascading}
            style={{
              padding: "0.55rem 1.5rem", borderRadius: "100px", cursor: cascading ? "wait" : "pointer",
              background: "linear-gradient(135deg, rgba(160,120,255,0.15), rgba(100,80,220,0.1))",
              border: "1px solid rgba(200,180,255,0.15)",
              color: "rgba(240,235,255,0.85)", fontSize: "0.75rem", fontWeight: 500,
              letterSpacing: "0.04em", textTransform: "uppercase",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {cascading ? "Revealing..." : "✦ Reveal the Pattern"}
          </button>
        </div>
      )}

      {/* AHA insight (appears when all revealed) */}
      {allRevealed && (
        <div style={{
          marginTop: "0.75rem", padding: "0.85rem 1rem", borderRadius: "0.75rem",
          background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.12)",
        }}>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(200,168,75,0.5)", marginBottom: "0.3rem",
          }}>
            ✦ AHA — THE ZODIAC&apos;S SECRET STRUCTURE
          </div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
            lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: 0,
          }}>
            The zodiac is a perfect 4&times;3 matrix. Every element has exactly one Cardinal, one Fixed, and one Mutable sign.
            Every modality has exactly one sign from each element. This isn&apos;t a coincidence &mdash; it&apos;s the deep mathematical
            structure that makes astrology a complete system for describing human experience.
          </p>
        </div>
      )}
    </div>
  );
}
