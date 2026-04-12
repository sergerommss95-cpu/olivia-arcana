"use client";

import React, { useState, useMemo } from "react";

/**
 * ZodiacWheel — Interactive SVG wheel with element/modality pattern reveals.
 *
 * AHA moments:
 * - Click any sign → details expand with glyph, ruler, traits
 * - Toggle "Elements" → fire/earth/air/water signs glow in triangles
 * - Toggle "Modalities" → cardinal/fixed/mutable groupings appear
 * - Toggle "Polarities" → yin/yang pairs highlight across the wheel
 *
 * The hidden pattern: the zodiac is a perfectly balanced 4×3 matrix.
 */

interface SignData {
  name: string;
  glyph: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  modality: "Cardinal" | "Fixed" | "Mutable";
  ruler: string;
  rulerGlyph: string;
  polarity: "Yang" | "Yin";
  motto: string;
}

const SIGNS: SignData[] = [
  { name: "Aries",       glyph: "♈", element: "Fire",  modality: "Cardinal", ruler: "Mars",    rulerGlyph: "♂", polarity: "Yang", motto: "I Am" },
  { name: "Taurus",      glyph: "♉", element: "Earth", modality: "Fixed",    ruler: "Venus",   rulerGlyph: "♀", polarity: "Yin",  motto: "I Have" },
  { name: "Gemini",      glyph: "♊", element: "Air",   modality: "Mutable",  ruler: "Mercury", rulerGlyph: "☿", polarity: "Yang", motto: "I Think" },
  { name: "Cancer",      glyph: "♋", element: "Water", modality: "Cardinal", ruler: "Moon",    rulerGlyph: "☽", polarity: "Yin",  motto: "I Feel" },
  { name: "Leo",         glyph: "♌", element: "Fire",  modality: "Fixed",    ruler: "Sun",     rulerGlyph: "☉", polarity: "Yang", motto: "I Will" },
  { name: "Virgo",       glyph: "♍", element: "Earth", modality: "Mutable",  ruler: "Mercury", rulerGlyph: "☿", polarity: "Yin",  motto: "I Analyze" },
  { name: "Libra",       glyph: "♎", element: "Air",   modality: "Cardinal", ruler: "Venus",   rulerGlyph: "♀", polarity: "Yang", motto: "I Balance" },
  { name: "Scorpio",     glyph: "♏", element: "Water", modality: "Fixed",    ruler: "Pluto",   rulerGlyph: "♇", polarity: "Yin",  motto: "I Transform" },
  { name: "Sagittarius", glyph: "♐", element: "Fire",  modality: "Mutable",  ruler: "Jupiter", rulerGlyph: "♃", polarity: "Yang", motto: "I See" },
  { name: "Capricorn",   glyph: "♑", element: "Earth", modality: "Cardinal", ruler: "Saturn",  rulerGlyph: "♄", polarity: "Yin",  motto: "I Use" },
  { name: "Aquarius",    glyph: "♒", element: "Air",   modality: "Fixed",    ruler: "Uranus",  rulerGlyph: "♅", polarity: "Yang", motto: "I Know" },
  { name: "Pisces",      glyph: "♓", element: "Water", modality: "Mutable",  ruler: "Neptune", rulerGlyph: "♆", polarity: "Yin",  motto: "I Dream" },
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#E8524A", Earth: "#4ECDC4", Air: "#D4AF37", Water: "#7B68EE",
};

const ELEMENT_BG: Record<string, string> = {
  Fire: "rgba(232,82,74,0.12)", Earth: "rgba(78,205,196,0.12)",
  Air: "rgba(212,175,55,0.12)", Water: "rgba(123,104,238,0.12)",
};

type OverlayMode = "none" | "elements" | "modalities" | "polarities";

export default function ZodiacWheel({ highlightElement, highlightModality }: {
  highlightElement?: string;
  highlightModality?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<OverlayMode>(
    highlightElement ? "elements" : highlightModality ? "modalities" : "none"
  );
  const [revealed, setRevealed] = useState(false);

  const CX = 180, CY = 180, R = 150, INNER_R = 85;

  // Generate SVG path for a segment
  const segmentPath = (index: number) => {
    const startAngle = (index * 30 - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * 30 - 90) * (Math.PI / 180);
    const x1o = CX + R * Math.cos(startAngle);
    const y1o = CY + R * Math.sin(startAngle);
    const x2o = CX + R * Math.cos(endAngle);
    const y2o = CY + R * Math.sin(endAngle);
    const x1i = CX + INNER_R * Math.cos(endAngle);
    const y1i = CY + INNER_R * Math.sin(endAngle);
    const x2i = CX + INNER_R * Math.cos(startAngle);
    const y2i = CY + INNER_R * Math.sin(startAngle);
    return `M${x1o},${y1o} A${R},${R} 0 0,1 ${x2o},${y2o} L${x1i},${y1i} A${INNER_R},${INNER_R} 0 0,0 ${x2i},${y2i} Z`;
  };

  // Midpoint of segment for glyph placement
  const glyphPos = (index: number) => {
    const midAngle = ((index + 0.5) * 30 - 90) * (Math.PI / 180);
    const gr = (R + INNER_R) / 2;
    return { x: CX + gr * Math.cos(midAngle), y: CY + gr * Math.sin(midAngle) };
  };

  // Get opacity for overlay mode
  const getOpacity = (sign: SignData, index: number): number => {
    if (overlay === "none") return selected === index ? 1 : 0.7;
    if (overlay === "elements") return sign.element === (highlightElement || sign.element) ? 1 : 0.15;
    if (overlay === "modalities") return 1;
    if (overlay === "polarities") return 1;
    return 0.7;
  };

  // Lines connecting same-element signs (triangles/squares)
  const elementLines = useMemo(() => {
    if (overlay !== "elements") return null;
    const groups: Record<string, number[]> = {};
    SIGNS.forEach((s, i) => { (groups[s.element] ??= []).push(i); });
    return Object.entries(groups).map(([elem, indices]) => {
      const points = indices.map(i => {
        const a = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
        return `${CX + (R - 15) * Math.cos(a)},${CY + (R - 15) * Math.sin(a)}`;
      });
      return (
        <polygon
          key={elem}
          points={points.join(" ")}
          fill="none"
          stroke={ELEMENT_COLORS[elem]}
          strokeWidth={1.5}
          opacity={0.6}
          style={{ transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      );
    });
  }, [overlay]);

  // Lines connecting same-modality signs (squares)
  const modalityLines = useMemo(() => {
    if (overlay !== "modalities") return null;
    const colors: Record<string, string> = {
      Cardinal: "#D4AF37", Fixed: "#7B68EE", Mutable: "#4ECDC4",
    };
    const groups: Record<string, number[]> = {};
    SIGNS.forEach((s, i) => { (groups[s.modality] ??= []).push(i); });
    return Object.entries(groups).map(([mod, indices]) => {
      const points = indices.map(i => {
        const a = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
        return `${CX + (R - 15) * Math.cos(a)},${CY + (R - 15) * Math.sin(a)}`;
      });
      return (
        <polygon
          key={mod}
          points={points.join(" ")}
          fill={`${colors[mod]}08`}
          stroke={colors[mod]}
          strokeWidth={1.5}
          opacity={0.5}
          strokeDasharray={mod === "Mutable" ? "4,4" : mod === "Fixed" ? "8,4" : "none"}
          style={{ transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      );
    });
  }, [overlay]);

  // Polarity lines (opposite signs)
  const polarityLines = useMemo(() => {
    if (overlay !== "polarities") return null;
    return [0,1,2,3,4,5].map(i => {
      const a1 = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
      const a2 = ((i + 6.5) * 30 - 90) * (Math.PI / 180);
      return (
        <line
          key={i}
          x1={CX + INNER_R * Math.cos(a1)} y1={CY + INNER_R * Math.sin(a1)}
          x2={CX + INNER_R * Math.cos(a2)} y2={CY + INNER_R * Math.sin(a2)}
          stroke={SIGNS[i].polarity === "Yang" ? "rgba(212,175,55,0.4)" : "rgba(123,104,238,0.4)"}
          strokeWidth={1}
          strokeDasharray="3,3"
          style={{ transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      );
    });
  }, [overlay]);

  const selectedSign = selected !== null ? SIGNS[selected] : null;

  // AHA insight based on current overlay
  const ahaInsight = overlay === "elements"
    ? "Each element forms a perfect equilateral triangle (trine) — signs of the same element are always 120\u00b0 apart. This geometric harmony is why they understand each other so naturally."
    : overlay === "modalities"
    ? "Each modality forms a cross (square) — 4 signs at 90\u00b0 intervals. Cardinal signs initiate, Fixed signs sustain, Mutable signs adapt. Every season of the zodiac follows this pattern."
    : overlay === "polarities"
    ? "Opposite signs are complementary, not contradictory. Aries (I Am) faces Libra (I Balance). Each pair represents two sides of the same cosmic truth."
    : null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Toggle buttons */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem", justifyContent: "center" }}>
        {(["none", "elements", "modalities", "polarities"] as OverlayMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => { setOverlay(mode); if (mode !== "none") setRevealed(true); }}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: "100px", cursor: "pointer",
              background: overlay === mode ? "rgba(200,168,75,0.12)" : "rgba(232,230,240,0.03)",
              border: `1px solid ${overlay === mode ? "rgba(200,168,75,0.3)" : "rgba(200,185,255,0.08)"}`,
              color: overlay === mode ? "rgba(212,175,55,0.9)" : "rgba(180,170,210,0.5)",
              fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.04em", textTransform: "capitalize",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {mode === "none" ? "Explore" : mode}
          </button>
        ))}
      </div>

      {/* SVG Wheel */}
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <svg viewBox="0 0 360 360" style={{ width: "100%", maxWidth: "360px" }}>
          {/* Connection lines (behind segments) */}
          {elementLines}
          {modalityLines}
          {polarityLines}

          {/* Segments */}
          {SIGNS.map((sign, i) => {
            const isSelected = selected === i;
            const opacity = getOpacity(sign, i);
            const pos = glyphPos(i);
            return (
              <g key={sign.name} onClick={() => setSelected(isSelected ? null : i)} style={{ cursor: "pointer" }}>
                <path
                  d={segmentPath(i)}
                  fill={isSelected ? ELEMENT_BG[sign.element] : `rgba(232,230,240,${0.02 + (overlay === "elements" && opacity > 0.5 ? 0.04 : 0)})`}
                  stroke={isSelected ? ELEMENT_COLORS[sign.element] : `rgba(200,185,255,${0.08 * opacity})`}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  opacity={opacity}
                  style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="central"
                  style={{
                    fontSize: isSelected ? "1.3rem" : "1.1rem",
                    fill: isSelected ? ELEMENT_COLORS[sign.element] : `rgba(220,210,240,${0.6 * opacity})`,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    pointerEvents: "none",
                  }}
                >
                  {sign.glyph}
                </text>
              </g>
            );
          })}

          {/* Center label */}
          <text x={CX} y={CY - 8} textAnchor="middle" style={{ fontSize: "0.55rem", fill: "rgba(200,168,75,0.4)", letterSpacing: "0.15em", fontFamily: "var(--font-body)" }}>
            {overlay === "none" ? "TAP A SIGN" : overlay.toUpperCase()}
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" style={{ fontSize: "0.4rem", fill: "rgba(180,170,210,0.3)", letterSpacing: "0.1em", fontFamily: "var(--font-body)" }}>
            {overlay === "none" ? "to explore" : "pattern revealed"}
          </text>
        </svg>
      </div>

      {/* Selected sign detail */}
      {selectedSign && (
        <div style={{
          marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "0.75rem",
          background: ELEMENT_BG[selectedSign.element],
          border: `1px solid ${ELEMENT_COLORS[selectedSign.element]}22`,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>{selectedSign.glyph}</span>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 500, color: ELEMENT_COLORS[selectedSign.element] }}>
                {selectedSign.name}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "rgba(180,170,210,0.5)", letterSpacing: "0.08em" }}>
                {selectedSign.element} · {selectedSign.modality} · {selectedSign.polarity} · {selectedSign.rulerGlyph} {selectedSign.ruler}
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: "var(--font-accent)", fontSize: "0.95rem", fontStyle: "italic",
            color: "rgba(220,210,240,0.7)", marginTop: "0.25rem",
          }}>
            &ldquo;{selectedSign.motto}&rdquo;
          </div>
        </div>
      )}

      {/* AHA insight box */}
      {ahaInsight && (
        <div style={{
          marginTop: "0.75rem", padding: "0.85rem 1rem", borderRadius: "0.75rem",
          background: "rgba(200,168,75,0.04)", border: "1px solid rgba(200,168,75,0.1)",
        }}>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(200,168,75,0.5)", marginBottom: "0.3rem",
          }}>
            ✦ SECRET PATTERN REVEALED
          </div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
            lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: 0,
          }}>
            {ahaInsight}
          </p>
        </div>
      )}
    </div>
  );
}
