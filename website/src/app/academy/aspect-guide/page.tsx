/**
 * Aspect Guide — Interactive reference for all astrological aspects
 *
 * Visual SVG showing each aspect angle, harmony classification,
 * detailed meaning, and example planet pairs.
 */

"use client";

import React, { useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface Aspect {
  name: string;
  symbol: string;
  angle: number;
  orb: number;
  harmony: "harmonious" | "tense" | "neutral";
  color: string;
  keywords: string[];
  meaning: string;
  inYourChart: string;
  examples: string[];
}

const ASPECTS: Aspect[] = [
  {
    name: "Conjunction", symbol: "☌", angle: 0, orb: 8,
    harmony: "neutral", color: "#D4AF37",
    keywords: ["fusion", "intensity", "amplification", "unity"],
    meaning: "Two planets occupy the same degree of the zodiac, merging their energies into a single, amplified force. A conjunction is neither inherently good nor bad — it depends entirely on which planets are involved. Sun conjunct Venus radiates warmth and charm. Mars conjunct Pluto radiates volcanic power. The key is that the energies cannot be separated — they operate as one.",
    inYourChart: "Conjunctions show where you have concentrated power. These are your signature themes — the energies that define you most strongly. They can be your greatest gifts or your biggest blind spots, because the planets are so fused you may not even notice them as separate forces.",
    examples: ["Sun ☌ Moon = unified identity and emotions, wholeness", "Venus ☌ Mars = passion and attraction fused, magnetic presence", "Mercury ☌ Jupiter = expansive mind, big ideas, gifted communicator"],
  },
  {
    name: "Sextile", symbol: "⚹", angle: 60, orb: 5,
    harmony: "harmonious", color: "#4ECDC4",
    keywords: ["opportunity", "talent", "cooperation", "ease"],
    meaning: "Two planets are 60 degrees apart, creating a gentle, cooperative flow of energy. Sextiles represent talents and opportunities that are available but require conscious effort to activate. Unlike trines (which flow automatically), sextiles are like doors that are unlocked but not open — you still need to turn the handle.",
    inYourChart: "Sextiles show where you have natural aptitude that can be developed into real skill. These are your 'easy wins' — areas where a little effort produces disproportionate results. Don't take them for granted; actively work with these energies to unlock their potential.",
    examples: ["Moon ⚹ Venus = emotional grace, easy charm, artistic sensitivity", "Mercury ⚹ Uranus = inventive thinking, quick wit, original ideas", "Jupiter ⚹ Saturn = balanced growth, disciplined expansion"],
  },
  {
    name: "Square", symbol: "□", angle: 90, orb: 7,
    harmony: "tense", color: "#E8524A",
    keywords: ["tension", "challenge", "growth", "drive", "friction"],
    meaning: "Two planets are 90 degrees apart, creating persistent friction that demands action. Squares are the engine of your chart — they create the internal pressure that forces growth, achievement, and change. They are uncomfortable, but without them, nothing would ever move. The greatest accomplishments in history were fueled by squares.",
    inYourChart: "Squares show where you experience ongoing tension that you can never fully resolve — only manage and channel. These are your growth edges. The areas where you struggle most are also the areas where you develop the most strength. Lean into squares rather than avoiding them.",
    examples: ["Moon □ Saturn = emotional restriction that builds resilience", "Venus □ Pluto = intense, transformative love that demands authenticity", "Mars □ Uranus = sudden bursts of rebellious energy, accident-prone but innovative"],
  },
  {
    name: "Trine", symbol: "△", angle: 120, orb: 7,
    harmony: "harmonious", color: "#7B68EE",
    keywords: ["flow", "natural talent", "ease", "grace", "gift"],
    meaning: "Two planets are 120 degrees apart (usually in the same element), creating an effortless flow of complementary energy. Trines are your innate gifts — abilities so natural you may not even recognize them as special. They represent areas of life where things come easily, where you're 'a natural.'",
    inYourChart: "Trines show where you have been given cosmic gifts. The danger is complacency — because these areas feel easy, you may never push to develop them fully. A trine without effort becomes wasted potential. The most successful people are those who build on their trines rather than resting on them.",
    examples: ["Sun △ Jupiter = natural confidence, optimism, luck that expands", "Venus △ Neptune = artistic vision, romantic idealism, aesthetic beauty", "Mars △ Saturn = disciplined energy, stamina, ability to work tirelessly"],
  },
  {
    name: "Opposition", symbol: "☍", angle: 180, orb: 8,
    harmony: "tense", color: "#FF9800",
    keywords: ["awareness", "polarity", "projection", "balance", "relationship"],
    meaning: "Two planets sit directly across from each other on the zodiac wheel, creating a seesaw dynamic between two valid but competing needs. Oppositions often manifest through relationships — you may project one end of the opposition onto partners, friends, or rivals. The goal is not to choose one side, but to integrate both.",
    inYourChart: "Oppositions show where you swing between extremes and often attract people who embody the qualities you've disowned in yourself. These are your relationship patterns. The person who triggers you most is usually carrying the other end of your opposition. Integration means owning BOTH sides.",
    examples: ["Sun ☍ Moon = head vs heart, public self vs private self", "Venus ☍ Saturn = desire for love vs fear of commitment", "Mars ☍ Neptune = assertive action vs passive surrender, motivation vs escapism"],
  },
  {
    name: "Quincunx", symbol: "⚻", angle: 150, orb: 3,
    harmony: "tense", color: "#795548",
    keywords: ["adjustment", "disconnect", "irritation", "health", "recalibration"],
    meaning: "Two planets are 150 degrees apart — close enough to affect each other but with nothing in common (different element, different modality). This creates a persistent, low-grade sense that something is 'off.' Quincunxes require constant adjustment, like wearing shoes that almost fit. They are associated with health issues because the body often expresses what the psyche cannot resolve.",
    inYourChart: "Quincunxes show where you experience a nagging disconnect that can never be fully reconciled — only managed through ongoing adjustment. These are your 'splinters' — small enough to ignore, painful enough to notice. Pay attention to health signals in these areas.",
    examples: ["Sun ⚻ Neptune = identity confusion, difficulty seeing yourself clearly", "Moon ⚻ Uranus = emotional disruptions, need for independence clashing with need for security", "Venus ⚻ Saturn = love that requires constant compromise and recalibration"],
  },
];

function AspectSVG({ angle, color, selected }: { angle: number; color: string; selected: boolean }) {
  const cx = 80, cy = 80, r = 65;
  const rad1 = (-90) * Math.PI / 180;
  const rad2 = (angle - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(rad1);
  const y1 = cy + r * Math.sin(rad1);
  const x2 = cx + r * Math.cos(rad2);
  const y2 = cy + r * Math.sin(rad2);

  return (
    <svg viewBox="0 0 160 160" style={{ width: "120px", height: "120px" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,185,255,0.06)" strokeWidth="1" />
      {/* Zodiac ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const inner = r - 4;
        const outer = r;
        return <line key={i} x1={cx + inner * Math.cos(a)} y1={cy + inner * Math.sin(a)}
          x2={cx + outer * Math.cos(a)} y2={cy + outer * Math.sin(a)}
          stroke="rgba(200,185,255,0.1)" strokeWidth="0.5" />;
      })}
      {/* Aspect line */}
      {angle > 0 && (
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={selected ? color : `${color}66`}
          strokeWidth={selected ? 2 : 1}
          strokeDasharray={angle === 90 || angle === 180 ? "4 3" : "none"}
        />
      )}
      {/* Planet dots */}
      <circle cx={x1} cy={y1} r={selected ? 5 : 4} fill={color} opacity={selected ? 1 : 0.6} />
      <circle cx={x2} cy={y2} r={selected ? 5 : 4} fill={color} opacity={selected ? 1 : 0.6} />
      {/* Angle label */}
      <text x={cx} y={cx + 4} textAnchor="middle" dominantBaseline="central"
        fill={selected ? "rgba(240,236,255,0.7)" : "rgba(180,170,210,0.3)"}
        fontSize="11" style={{ fontFamily: "var(--font-accent)" }}>{angle}°</text>
    </svg>
  );
}

export default function AspectGuidePage() {
  const [selected, setSelected] = useState<number>(0);
  const aspect = ASPECTS[selected];

  const glass: React.CSSProperties = {
    background: "rgba(8,6,20,0.45)",
    backdropFilter: "blur(20px) saturate(1.2)",
    WebkitBackdropFilter: "blur(20px) saturate(1.2)",
    border: "1px solid rgba(200,185,255,0.06)",
    borderRadius: "1.25rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  };

  const labelSt: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
    letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
  };

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <a href="/academy" style={{ ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>← Academy</a>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">Aspect Guide</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", marginTop: "0.3rem",
        }}>How planets talk to each other — the geometry of your chart</p>
      </div>

      {/* Aspect selector */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "0.5rem",
        marginBottom: "2rem", flexWrap: "wrap",
      }}>
        {ASPECTS.map((a, i) => (
          <button
            key={a.name}
            onClick={() => setSelected(i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.3rem", padding: "0.6rem 0.8rem",
              borderRadius: "1rem", minWidth: "80px",
              background: selected === i ? `${a.color}12` : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${selected === i ? `${a.color}35` : "rgba(200,185,255,0.04)"}`,
              cursor: "pointer", transition: `all 0.3s ${EASE}`,
            }}
          >
            <span style={{ fontSize: "1.2rem", color: selected === i ? a.color : "rgba(200,190,235,0.4)" }}>{a.symbol}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: selected === i ? 600 : 400,
              color: selected === i ? "rgba(240,236,255,0.85)" : "rgba(180,170,210,0.3)",
            }}>{a.name}</span>
          </button>
        ))}
      </div>

      {/* Selected aspect detail */}
      <div style={{ ...glass, padding: "2rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* SVG diagram */}
          <div style={{ textAlign: "center" }}>
            <AspectSVG angle={aspect.angle} color={aspect.color} selected={true} />
          </div>

          {/* Header info */}
          <div style={{ flex: 1, minWidth: "250px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.8rem", color: aspect.color }}>{aspect.symbol}</span>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-accent)", fontSize: "1.5rem", fontWeight: 400,
                  color: "rgba(240,236,255,0.92)", margin: 0,
                }}>{aspect.name}</h2>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
                  <span style={{
                    padding: "0.1rem 0.4rem", borderRadius: "100px",
                    background: `${aspect.color}15`, border: `1px solid ${aspect.color}25`,
                    fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: `${aspect.color}aa`,
                  }}>{aspect.angle}° · Orb ±{aspect.orb}°</span>
                  <span style={{
                    padding: "0.1rem 0.4rem", borderRadius: "100px",
                    background: aspect.harmony === "harmonious" ? "rgba(78,205,196,0.1)" : aspect.harmony === "tense" ? "rgba(232,82,74,0.08)" : "rgba(212,175,55,0.08)",
                    border: `1px solid ${aspect.harmony === "harmonious" ? "rgba(78,205,196,0.2)" : aspect.harmony === "tense" ? "rgba(232,82,74,0.15)" : "rgba(212,175,55,0.15)"}`,
                    fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: aspect.harmony === "harmonious" ? "rgba(78,205,196,0.6)" : aspect.harmony === "tense" ? "rgba(232,82,74,0.5)" : "rgba(212,175,55,0.5)",
                  }}>{aspect.harmony}</span>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {aspect.keywords.map(k => (
                <span key={k} style={{
                  padding: "0.15rem 0.45rem", borderRadius: "100px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.06)",
                  fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(200,190,235,0.55)",
                }}>{k}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Meaning */}
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ ...labelSt, marginBottom: "0.5rem" }}>What It Means</div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
            lineHeight: 1.8, color: "rgba(220,210,240,0.75)", margin: 0,
          }}>{aspect.meaning}</p>
        </div>

        {/* In your chart */}
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ ...labelSt, marginBottom: "0.5rem" }}>In Your Chart</div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
            lineHeight: 1.75, color: "rgba(196,185,228,0.65)", margin: 0,
          }}>{aspect.inYourChart}</p>
        </div>

        {/* Examples */}
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Examples</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {aspect.examples.map((ex, i) => (
              <div key={i} style={{
                padding: "0.6rem 0.85rem", borderRadius: "0.6rem",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,185,255,0.04)",
                fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
                lineHeight: 1.5, color: "rgba(200,190,235,0.7)",
              }}>{ex}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Link to course */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <a href="/academy/conversation-between-planets" style={{
          display: "inline-block", padding: "0.65rem 1.5rem", borderRadius: "100px",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.08)",
          color: "rgba(200,185,240,0.6)", fontSize: "0.72rem",
          letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
        }}>Take the Full Aspects Course →</a>
      </div>
    </div>
  );
}
