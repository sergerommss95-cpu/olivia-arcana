"use client";

import React, { useState, useMemo } from "react";

/**
 * AspectVisualizer — Angular relationship explorer.
 *
 * AHA moment: "The angle between two planets IS the relationship.
 * 0° = fusion. 60° = opportunity. 90° = tension. 120° = flow. 180° = confrontation."
 *
 * Select two planets and see how their angular distance defines
 * the nature of their interaction. The geometry literally IS the meaning.
 */

interface Aspect {
  name: string;
  degrees: number;
  orb: number;
  nature: "harmonious" | "challenging" | "neutral";
  color: string;
  description: string;
  symbol: string;
}

const ASPECTS: Aspect[] = [
  { name: "Conjunction", degrees: 0,   orb: 8,  nature: "neutral",     color: "#D4AF37", symbol: "☌", description: "Fusion — energies merge completely. Intensified but not inherently good or bad." },
  { name: "Sextile",    degrees: 60,  orb: 4,  nature: "harmonious",  color: "#4ECDC4", symbol: "⚹", description: "Opportunity — talents that flow when you make the effort. Easy but not automatic." },
  { name: "Square",     degrees: 90,  orb: 7,  nature: "challenging", color: "#E8524A", symbol: "□", description: "Tension — forced growth through friction. Uncomfortable but where real change happens." },
  { name: "Trine",      degrees: 120, orb: 7,  nature: "harmonious",  color: "#7B68EE", symbol: "△", description: "Flow — natural gifts that work effortlessly. Harmony so easy it can become complacency." },
  { name: "Opposition",  degrees: 180, orb: 8,  nature: "challenging", color: "#E8524A", symbol: "☍", description: "Confrontation — awareness through the mirror of the other. Integration of polarities." },
];

const PLANETS = [
  { name: "Sun",     glyph: "☉", color: "#D4AF37" },
  { name: "Moon",    glyph: "☽", color: "#C4B4F0" },
  { name: "Mercury", glyph: "☿", color: "#4ECDC4" },
  { name: "Venus",   glyph: "♀", color: "#E8524A" },
  { name: "Mars",    glyph: "♂", color: "#E8524A" },
  { name: "Jupiter", glyph: "♃", color: "#7B68EE" },
  { name: "Saturn",  glyph: "♄", color: "#9B96A8" },
];

export default function AspectVisualizer() {
  const [planet1, setPlanet1] = useState(0); // Sun
  const [planet2, setPlanet2] = useState(4); // Mars
  const [angle, setAngle] = useState(90);    // Default: square

  const CX = 160, CY = 160, R = 120;

  // Find closest aspect
  const matchedAspect = useMemo(() => {
    let best: Aspect | null = null;
    let bestDist = Infinity;
    for (const asp of ASPECTS) {
      const dist = Math.abs(angle - asp.degrees);
      if (dist <= asp.orb && dist < bestDist) {
        best = asp;
        bestDist = dist;
      }
    }
    return best;
  }, [angle]);

  // Positions of two planets on the circle
  const p1Angle = -90 * (Math.PI / 180); // Fixed at top
  const p2Angle = (angle - 90) * (Math.PI / 180);
  const p1x = CX + R * Math.cos(p1Angle), p1y = CY + R * Math.sin(p1Angle);
  const p2x = CX + R * Math.cos(p2Angle), p2y = CY + R * Math.sin(p2Angle);

  const lineColor = matchedAspect?.color ?? "rgba(200,185,255,0.15)";

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Planet selectors */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", color: "rgba(180,170,210,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Planet 1</div>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {PLANETS.map((p, i) => (
              <button key={p.name} onClick={() => setPlanet1(i)} style={{
                width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer",
                background: planet1 === i ? `${p.color}20` : "rgba(232,230,240,0.02)",
                border: `1px solid ${planet1 === i ? `${p.color}40` : "rgba(200,185,255,0.06)"}`,
                color: planet1 === i ? p.color : "rgba(180,170,210,0.4)",
                fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }} title={p.name}>{p.glyph}</button>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", color: "rgba(180,170,210,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Planet 2</div>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {PLANETS.map((p, i) => (
              <button key={p.name} onClick={() => setPlanet2(i)} style={{
                width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer",
                background: planet2 === i ? `${p.color}20` : "rgba(232,230,240,0.02)",
                border: `1px solid ${planet2 === i ? `${p.color}40` : "rgba(200,185,255,0.06)"}`,
                color: planet2 === i ? p.color : "rgba(180,170,210,0.4)",
                fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }} title={p.name}>{p.glyph}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Angle slider */}
      <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: matchedAspect ? matchedAspect.color : "rgba(200,185,255,0.3)", fontWeight: 600 }}>
          {angle}°
          {matchedAspect && <span style={{ fontSize: "0.75rem", marginLeft: "0.4rem" }}>{matchedAspect.symbol} {matchedAspect.name}</span>}
        </div>
        <input
          type="range" min={0} max={180} value={angle}
          onChange={e => setAngle(parseInt(e.target.value))}
          style={{ width: "80%", maxWidth: "280px", accentColor: lineColor, cursor: "pointer" }}
        />
        {/* Quick-jump buttons */}
        <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", marginTop: "0.35rem" }}>
          {ASPECTS.map(asp => (
            <button key={asp.name} onClick={() => setAngle(asp.degrees)} style={{
              padding: "0.2rem 0.5rem", borderRadius: "100px", cursor: "pointer",
              background: angle === asp.degrees ? `${asp.color}15` : "transparent",
              border: `1px solid ${angle === asp.degrees ? `${asp.color}30` : "rgba(200,185,255,0.06)"}`,
              color: angle === asp.degrees ? asp.color : "rgba(180,170,210,0.35)",
              fontSize: "0.55rem", fontWeight: 500, letterSpacing: "0.04em",
              transition: "all 0.2s ease",
            }}>
              {asp.symbol} {asp.degrees}°
            </button>
          ))}
        </div>
      </div>

      {/* Visual circle */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 320 320" style={{ width: "100%", maxWidth: "280px" }}>
          {/* Circle */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(200,185,255,0.06)" strokeWidth={1} />

          {/* Aspect line */}
          <line x1={p1x} y1={p1y} x2={p2x} y2={p2y}
            stroke={lineColor} strokeWidth={matchedAspect ? 2 : 1}
            opacity={matchedAspect ? 0.7 : 0.2}
            strokeDasharray={matchedAspect?.nature === "challenging" ? "6,3" : "none"}
            style={{ transition: "all 0.3s ease" }}
          />

          {/* Arc showing the angle */}
          {angle > 0 && (
            <path
              d={`M${CX + 30 * Math.cos(p1Angle)},${CY + 30 * Math.sin(p1Angle)} A30,30 0 ${angle > 180 ? 1 : 0},1 ${CX + 30 * Math.cos(p2Angle)},${CY + 30 * Math.sin(p2Angle)}`}
              fill="none" stroke={`${lineColor}40`} strokeWidth={1}
            />
          )}

          {/* Planet 1 */}
          <circle cx={p1x} cy={p1y} r={18} fill={`${PLANETS[planet1].color}15`} stroke={`${PLANETS[planet1].color}40`} strokeWidth={1} />
          <text x={p1x} y={p1y + 1} textAnchor="middle" dominantBaseline="central" style={{ fontSize: "1.1rem", fill: PLANETS[planet1].color }}>
            {PLANETS[planet1].glyph}
          </text>

          {/* Planet 2 */}
          <circle cx={p2x} cy={p2y} r={18} fill={`${PLANETS[planet2].color}15`} stroke={`${PLANETS[planet2].color}40`} strokeWidth={1}
            style={{ transition: "all 0.3s ease" }} />
          <text x={p2x} y={p2y + 1} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: "1.1rem", fill: PLANETS[planet2].color, transition: "all 0.3s ease" }}>
            {PLANETS[planet2].glyph}
          </text>

          {/* Center label */}
          <text x={CX} y={CY} textAnchor="middle" style={{ fontSize: "0.4rem", fill: "rgba(180,170,210,0.3)", letterSpacing: "0.1em", fontFamily: "var(--font-body)" }}>
            drag the slider
          </text>
        </svg>
      </div>

      {/* Aspect description */}
      {matchedAspect && (
        <div style={{
          marginTop: "0.5rem", padding: "0.85rem 1rem", borderRadius: "0.75rem",
          background: `${matchedAspect.color}06`,
          border: `1px solid ${matchedAspect.color}15`,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: `${matchedAspect.color}80`, marginBottom: "0.25rem",
          }}>
            {matchedAspect.symbol} {matchedAspect.name} — {matchedAspect.nature === "harmonious" ? "FLOWING" : matchedAspect.nature === "challenging" ? "DYNAMIC" : "POWERFUL"}
          </div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
            lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: "0 0 0.3rem",
          }}>
            {PLANETS[planet1].name} {matchedAspect.symbol} {PLANETS[planet2].name}: {matchedAspect.description}
          </p>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "rgba(180,170,210,0.35)" }}>
            Orb: ±{matchedAspect.orb}° · Exact at {matchedAspect.degrees}° · Currently {angle}° ({Math.abs(angle - matchedAspect.degrees)}° from exact)
          </div>
        </div>
      )}

      {!matchedAspect && angle > 0 && (
        <div style={{
          marginTop: "0.5rem", textAlign: "center",
          fontFamily: "var(--font-body)", fontSize: "0.72rem",
          color: "rgba(180,170,210,0.35)", fontStyle: "italic",
        }}>
          {angle}° &mdash; no major aspect at this angle. Keep sliding to find one!
        </div>
      )}
    </div>
  );
}
