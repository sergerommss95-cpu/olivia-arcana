/**
 * Birth Chart Wheel — Interactive SVG natal chart visualization
 *
 * Static demo with placeholder planet positions (real positions require backend).
 * Shows: 12 houses, zodiac ring, planet positions, aspect lines.
 * Click a planet to see its meaning.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Demo chart data (Pisces sun, Cancer moon, Scorpio rising)
const PLANETS = [
  { name: "Sun", glyph: "☉", sign: "Pisces", degree: 346, color: "#FFD700", desc: "Your core identity and ego expression. In Pisces: deeply intuitive, creative, compassionate." },
  { name: "Moon", glyph: "☽", sign: "Cancer", degree: 102, color: "#C0C0C0", desc: "Your emotional nature and inner world. In Cancer: nurturing, sensitive, deeply connected to home." },
  { name: "Mercury", glyph: "☿", sign: "Aquarius", degree: 315, color: "#7B68EE", desc: "How you think and communicate. In Aquarius: original thinker, unconventional ideas." },
  { name: "Venus", glyph: "♀", sign: "Aries", degree: 15, color: "#FF69B4", desc: "How you love and what you value. In Aries: passionate, direct, spontaneous in love." },
  { name: "Mars", glyph: "♂", sign: "Gemini", degree: 78, color: "#E8524A", desc: "Your drive and how you take action. In Gemini: versatile, intellectually motivated." },
  { name: "Jupiter", glyph: "♃", sign: "Taurus", degree: 42, color: "#4ECDC4", desc: "Where you find growth and abundance. In Taurus: expansion through material security." },
  { name: "Saturn", glyph: "♄", sign: "Capricorn", degree: 280, color: "#8B7355", desc: "Your discipline and life lessons. In Capricorn: mastery through structure and ambition." },
  { name: "Uranus", glyph: "♅", sign: "Sagittarius", degree: 255, color: "#00BFFF", desc: "Where you break conventions. In Sagittarius: revolutionary through philosophy and travel." },
  { name: "Neptune", glyph: "♆", sign: "Pisces", degree: 340, color: "#9370DB", desc: "Your dreams and spiritual connection. In Pisces: heightened intuition and artistic vision." },
  { name: "Pluto", glyph: "♇", sign: "Scorpio", degree: 220, color: "#800020", desc: "Your transformation power. In Scorpio: profound regeneration and psychological depth." },
];

const SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function ChartPage() {
  const [selected, setSelected] = useState<typeof PLANETS[0] | null>(null);
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const cx = 250, cy = 250;
  const outerR = 220, innerR = 170, planetR = 145, houseR = 125;

  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.5rem",
      position: "relative",
      zIndex: 1,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <a href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
          transition: "color 0.2s",
        }}>← Back to Home</a>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 400, marginTop: "1rem",
        }}>
          <span className="text-gold-gradient">Your Birth Chart</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
          color: "rgba(196,185,228,0.6)", marginTop: "0.5rem",
        }}>Demo chart — connect birth data for your real positions</p>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
        {/* SVG Wheel */}
        <svg
          ref={svgRef}
          viewBox="0 0 500 500"
          style={{
            width: "min(90vw, 500px)",
            height: "min(90vw, 500px)",
            opacity: mounted ? 1 : 0,
            transition: `opacity 0.8s ${EASE}`,
          }}
        >
          {/* Outer zodiac ring */}
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(200,185,255,0.08)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(200,185,255,0.08)" strokeWidth="1" />

          {/* Zodiac sign divisions + glyphs */}
          {SIGNS.map((glyph, i) => {
            const angle = i * 30;
            const lineStart = polarToCart(cx, cy, innerR, angle);
            const lineEnd = polarToCart(cx, cy, outerR, angle);
            const labelPos = polarToCart(cx, cy, (outerR + innerR) / 2, angle + 15);
            return (
              <g key={i}>
                <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y}
                  stroke="rgba(200,185,255,0.06)" strokeWidth="0.5" />
                <text x={labelPos.x} y={labelPos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fill="rgba(212,175,55,0.35)" fontSize="14"
                  style={{ fontFamily: "serif" }}
                >{glyph}</text>
              </g>
            );
          })}

          {/* House lines */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30 + 5; // offset from signs
            const start = polarToCart(cx, cy, 30, angle);
            const end = polarToCart(cx, cy, innerR, angle);
            return (
              <line key={`h${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                stroke="rgba(200,185,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
            );
          })}

          {/* Aspect lines between planets */}
          {PLANETS.map((p1, i) =>
            PLANETS.slice(i + 1).map((p2, j) => {
              const diff = Math.abs(p1.degree - p2.degree);
              const aspect = diff > 180 ? 360 - diff : diff;
              // Only show major aspects (conjunction, trine, opposition, square)
              if (![0, 60, 90, 120, 180].some(a => Math.abs(aspect - a) < 10)) return null;
              const pos1 = polarToCart(cx, cy, planetR, p1.degree);
              const pos2 = polarToCart(cx, cy, planetR, p2.degree);
              const isTense = Math.abs(aspect - 90) < 10 || Math.abs(aspect - 180) < 10;
              return (
                <line key={`a${i}-${j}`}
                  x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y}
                  stroke={isTense ? "rgba(232,82,74,0.15)" : "rgba(78,205,196,0.15)"}
                  strokeWidth="0.5" strokeDasharray={isTense ? "3 3" : "none"}
                />
              );
            })
          )}

          {/* Planet markers */}
          {PLANETS.map((p, i) => {
            const pos = polarToCart(cx, cy, planetR, p.degree);
            const isSelected = selected?.name === p.name;
            return (
              <g key={p.name} onClick={() => setSelected(isSelected ? null : p)} style={{ cursor: "pointer" }}>
                <circle cx={pos.x} cy={pos.y} r={isSelected ? 16 : 12}
                  fill="rgba(4,2,13,0.8)" stroke={p.color}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isSelected ? 1 : 0.7}
                  style={{ transition: `all 0.3s ${EASE}` }}
                />
                <text x={pos.x} y={pos.y + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fill={p.color} fontSize={isSelected ? 14 : 11}
                  style={{ transition: `all 0.3s ${EASE}`, pointerEvents: "none" }}
                >{p.glyph}</text>
              </g>
            );
          })}

          {/* Center */}
          <circle cx={cx} cy={cy} r="25" fill="rgba(4,2,13,0.9)" stroke="rgba(200,185,255,0.08)" strokeWidth="0.5" />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
            fill="rgba(212,175,55,0.5)" fontSize="16" style={{ fontFamily: "serif" }}>✦</text>
        </svg>

        {/* Planet detail panel */}
        <div style={{
          maxWidth: "280px",
          width: "100%",
          padding: "1.5rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(200,185,255,0.08)",
          borderRadius: "1.25rem",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          minHeight: "200px",
        }}>
          {selected ? (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem",
              }}>
                <span style={{ fontSize: "1.8rem", color: selected.color }}>{selected.glyph}</span>
                <div>
                  <div style={{
                    fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 500,
                    color: "rgba(240,236,255,0.9)", letterSpacing: "0.06em",
                  }}>{selected.name}</div>
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 500,
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    color: "rgba(180,170,210,0.45)",
                  }}>in {selected.sign}</div>
                </div>
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                lineHeight: 1.7, color: "rgba(196,185,228,0.72)", margin: 0,
              }}>{selected.desc}</p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
                color: "rgba(180,170,210,0.4)",
              }}>Click a planet to explore its meaning in your chart</p>
            </div>
          )}
        </div>
      </div>

      {/* Planet legend */}
      <div style={{
        marginTop: "2rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        justifyContent: "center",
        maxWidth: "600px",
      }}>
        {PLANETS.map(p => (
          <button
            key={p.name}
            onClick={() => setSelected(selected?.name === p.name ? null : p)}
            style={{
              display: "flex", alignItems: "center", gap: "0.3rem",
              padding: "0.35rem 0.7rem", borderRadius: "100px",
              background: selected?.name === p.name ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${selected?.name === p.name ? "rgba(200,185,255,0.18)" : "rgba(200,185,255,0.06)"}`,
              color: p.color, fontSize: "0.7rem", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 400,
              transition: `all 200ms ${EASE}`,
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>{p.glyph}</span>
            <span style={{ color: "rgba(200,190,235,0.7)" }}>{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
