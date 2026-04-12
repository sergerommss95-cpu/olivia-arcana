"use client";

import React, { useState } from "react";

/**
 * PlanetaryJourney — Orbit speed & period comparison.
 *
 * AHA moment: "THIS is why Saturn Return hits at 29 — because Saturn
 * takes 29 years to orbit the Sun once. Every planet has its own clock."
 *
 * - Visual timeline showing each planet's orbital period
 * - Tap a planet → see its speed, period, and what life events it governs
 * - "Age ruler" slider: see which planet governs each phase of life
 * - Saturn Return, Jupiter Return, Chiron Return highlighted
 */

interface PlanetOrbit {
  name: string;
  glyph: string;
  period: number;        // orbital period in years
  color: string;
  governs: string;
  returnAge: number[];   // ages when the planet returns
  speed: string;         // degrees per day
  lifePhase: string;     // what life phase it rules
  insight: string;
}

const PLANETS: PlanetOrbit[] = [
  {
    name: "Moon", glyph: "☽", period: 0.074, color: "#C4B4F0",
    governs: "Emotions, instincts, daily rhythms",
    returnAge: [], speed: "13.2°/day",
    lifePhase: "Monthly emotional cycles",
    insight: "The Moon completes its cycle every 27.3 days. That's why your mood shifts — your emotional landscape literally resets each month.",
  },
  {
    name: "Mercury", glyph: "☿", period: 0.24, color: "#4ECDC4",
    governs: "Communication, thinking, learning",
    returnAge: [], speed: "1.4°/day",
    lifePhase: "Daily mental processing",
    insight: "Mercury orbits so fast it returns to its natal position roughly every 3 months. This is why Mercury retrograde (3× yearly) feels so disruptive — you notice when something this constant stutters.",
  },
  {
    name: "Venus", glyph: "♀", period: 0.62, color: "#E8A4C8",
    governs: "Love, beauty, values, pleasure",
    returnAge: [], speed: "1.2°/day",
    lifePhase: "Relationship seasons",
    insight: "Venus returns to your birth position every 7-8 months. Each Venus Return is a mini-renewal of what you value and desire.",
  },
  {
    name: "Sun", glyph: "☉", period: 1, color: "#D4AF37",
    governs: "Identity, vitality, life purpose",
    returnAge: [1, 2, 3], speed: "0.99°/day",
    lifePhase: "Your birthday — annual self-renewal",
    insight: "Your birthday IS your Solar Return — the Sun returning to its exact natal position. That's why birthdays feel meaningful: it's a literal astronomical reset of your identity.",
  },
  {
    name: "Mars", glyph: "♂", period: 1.88, color: "#E8524A",
    governs: "Drive, ambition, conflict, energy",
    returnAge: [2, 4, 6], speed: "0.52°/day",
    lifePhase: "~2-year ambition cycles",
    insight: "Mars returns every ~2 years, sparking new cycles of ambition and drive. Notice how your energy and motivation shift on roughly a 2-year rhythm.",
  },
  {
    name: "Jupiter", glyph: "♃", period: 11.86, color: "#7B68EE",
    governs: "Growth, luck, expansion, wisdom",
    returnAge: [12, 24, 36, 48, 60, 72, 84],
    speed: "0.08°/day",
    lifePhase: "12-year growth cycles",
    insight: "Jupiter Return at age 12 (puberty's expansion), 24 (first adult luck), 36 (wisdom integration), 48 (second harvest). Each return opens a door of opportunity — if you're ready to walk through it.",
  },
  {
    name: "Saturn", glyph: "♄", period: 29.46, color: "#9B96A8",
    governs: "Discipline, karma, maturity, structure",
    returnAge: [29, 58, 87],
    speed: "0.03°/day",
    lifePhase: "29-year mastery cycles",
    insight: "The Saturn Return at 29 is the most famous transit in astrology. It's when Saturn returns to its birth position and demands: 'Have you built something real?' The second return at 58 asks: 'Was it meaningful?' This is why your late 20s feel like a crucible.",
  },
  {
    name: "Uranus", glyph: "♅", period: 84, color: "#00C9DB",
    governs: "Revolution, awakening, sudden change",
    returnAge: [84],
    speed: "0.01°/day",
    lifePhase: "84-year liberation arc",
    insight: "Most people never experience a Uranus Return — it takes 84 years. But the Uranus Opposition at ~42 (midlife crisis) is when you feel the electric urge to break free from everything that isn't authentically you.",
  },
  {
    name: "Neptune", glyph: "♆", period: 165, color: "#6A5ACD",
    governs: "Dreams, illusion, spirituality, transcendence",
    returnAge: [],
    speed: "0.006°/day",
    lifePhase: "165-year dream cycle",
    insight: "No human experiences a Neptune Return. Neptune dissolves boundaries across generations. The Neptune Square at ~41 brings a spiritual reckoning: what's real, and what was always an illusion?",
  },
  {
    name: "Pluto", glyph: "♇", period: 248, color: "#8B0000",
    governs: "Death, rebirth, power, transformation",
    returnAge: [],
    speed: "0.003°/day",
    lifePhase: "248-year civilizational reset",
    insight: "No person lives to see their Pluto Return, but nations do. The United States experienced its first Pluto Return in 2022 — 248 years after 1776. Pluto destroys what's decayed and forces total rebirth.",
  },
];

const MAX_BAR = 248;

export default function PlanetaryJourney() {
  const [selected, setSelected] = useState<number | null>(6); // Saturn
  const [age, setAge] = useState(29);
  const [showReturns, setShowReturns] = useState(true);

  const selectedPlanet = selected !== null ? PLANETS[selected] : null;

  // Find which returns are active at the current age
  const activeReturns = PLANETS.flatMap(p =>
    p.returnAge.filter(a => Math.abs(a - age) <= 1).map(a => ({ planet: p, age: a }))
  );

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Age slider */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", marginBottom: "0.25rem",
        }}>
          YOUR AGE
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700,
          color: activeReturns.length > 0 ? "rgba(212,175,55,0.9)" : "rgba(240,236,255,0.8)",
          transition: "color 0.3s ease",
        }}>
          {age}
        </div>
        <input
          type="range" min={0} max={90} value={age}
          onChange={e => setAge(parseInt(e.target.value))}
          style={{ width: "80%", maxWidth: "320px", accentColor: "#D4AF37", cursor: "pointer" }}
        />
        {activeReturns.length > 0 && (
          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500,
            color: "rgba(212,175,55,0.8)", marginTop: "0.25rem",
          }}>
            {activeReturns.map(r => `${r.planet.glyph} ${r.planet.name} Return`).join(" · ")}
          </div>
        )}
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        <button
          onClick={() => setShowReturns(!showReturns)}
          style={{
            padding: "0.35rem 0.8rem", borderRadius: "100px", cursor: "pointer",
            background: showReturns ? "rgba(200,168,75,0.1)" : "rgba(232,230,240,0.03)",
            border: `1px solid ${showReturns ? "rgba(200,168,75,0.25)" : "rgba(200,185,255,0.06)"}`,
            color: showReturns ? "rgba(212,175,55,0.8)" : "rgba(180,170,210,0.4)",
            fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.04em",
            transition: "all 0.3s ease",
          }}
        >
          {showReturns ? "✦ Return Ages Visible" : "Show Return Ages"}
        </button>
      </div>

      {/* Orbital period bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {PLANETS.map((p, i) => {
          const isSelected = selected === i;
          const barWidth = Math.max(4, (p.period / MAX_BAR) * 100);
          const hasReturn = p.returnAge.some(a => Math.abs(a - age) <= 1);

          return (
            <button
              key={p.name}
              onClick={() => setSelected(isSelected ? null : i)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.45rem 0.6rem", borderRadius: "0.5rem",
                background: isSelected ? `${p.color}10` : hasReturn ? "rgba(200,168,75,0.04)" : "rgba(232,230,240,0.015)",
                border: `1px solid ${isSelected ? `${p.color}30` : hasReturn ? "rgba(200,168,75,0.12)" : "rgba(200,185,255,0.04)"}`,
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Glyph */}
              <span style={{
                fontSize: "1rem", color: isSelected ? p.color : `${p.color}80`,
                width: "24px", textAlign: "center", flexShrink: 0,
              }}>{p.glyph}</span>

              {/* Name + period */}
              <div style={{ width: "70px", flexShrink: 0 }}>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: isSelected ? 500 : 300,
                  color: isSelected ? "rgba(240,236,255,0.9)" : "rgba(220,210,240,0.6)",
                }}>{p.name}</div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                  color: "rgba(180,170,210,0.3)",
                }}>
                  {p.period < 1 ? `${Math.round(p.period * 365)}d` : `${p.period.toFixed(p.period < 10 ? 1 : 0)}y`}
                </div>
              </div>

              {/* Bar */}
              <div style={{ flex: 1, position: "relative", height: "16px" }}>
                <div style={{
                  position: "absolute", top: "50%", transform: "translateY(-50%)",
                  width: `${barWidth}%`, height: "6px", borderRadius: "3px",
                  background: `linear-gradient(90deg, ${p.color}40, ${p.color}15)`,
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }} />
                {/* Return markers */}
                {showReturns && p.returnAge.filter(a => a <= 90).map(returnAge => (
                  <div key={returnAge} style={{
                    position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
                    left: `${(returnAge / 90) * 100}%`,
                    width: Math.abs(returnAge - age) <= 1 ? "10px" : "6px",
                    height: Math.abs(returnAge - age) <= 1 ? "10px" : "6px",
                    borderRadius: "50%",
                    background: Math.abs(returnAge - age) <= 1 ? "rgba(212,175,55,0.8)" : `${p.color}30`,
                    border: `1px solid ${Math.abs(returnAge - age) <= 1 ? "rgba(212,175,55,0.6)" : `${p.color}15`}`,
                    transition: "all 0.3s ease",
                  }} title={`${p.name} Return at age ${returnAge}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected planet detail */}
      {selectedPlanet && (
        <div style={{
          marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "0.75rem",
          background: `${selectedPlanet.color}06`,
          border: `1px solid ${selectedPlanet.color}15`,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem", color: selectedPlanet.color }}>{selectedPlanet.glyph}</span>
            <div>
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 500,
                color: "rgba(240,236,255,0.9)",
              }}>{selectedPlanet.name}</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                color: "rgba(180,170,210,0.4)",
              }}>
                {selectedPlanet.speed} · {selectedPlanet.period < 1 ? `${Math.round(selectedPlanet.period * 365)} days` : `${selectedPlanet.period.toFixed(selectedPlanet.period < 10 ? 2 : 0)} years`} per orbit
              </div>
            </div>
          </div>

          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: `${selectedPlanet.color}60`, marginBottom: "0.2rem",
          }}>
            GOVERNS: {selectedPlanet.governs}
          </div>

          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
            lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: "0.4rem 0",
          }}>
            {selectedPlanet.insight}
          </p>

          {selectedPlanet.returnAge.length > 0 && (
            <div style={{
              marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
              background: "rgba(200,168,75,0.04)", border: "1px solid rgba(200,168,75,0.08)",
            }}>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(200,168,75,0.5)",
              }}>
                {selectedPlanet.name} Returns at ages:
              </span>
              <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                {selectedPlanet.returnAge.map(a => (
                  <span key={a} style={{
                    padding: "0.15rem 0.5rem", borderRadius: "100px", fontSize: "0.65rem",
                    fontFamily: "var(--font-mono)",
                    background: Math.abs(a - age) <= 1 ? "rgba(212,175,55,0.15)" : "rgba(200,168,75,0.06)",
                    border: `1px solid ${Math.abs(a - age) <= 1 ? "rgba(212,175,55,0.3)" : "rgba(200,168,75,0.1)"}`,
                    color: Math.abs(a - age) <= 1 ? "rgba(212,175,55,0.9)" : "rgba(200,168,75,0.5)",
                    fontWeight: Math.abs(a - age) <= 1 ? 600 : 400,
                  }}>{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
