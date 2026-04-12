"use client";

import React, { useState } from "react";

/**
 * HouseWheel — 12-sector interactive life-area wheel.
 *
 * AHA moments:
 * - Click any house → reveals what life area it governs
 * - Opposite houses highlight as pairs (1↔7, 2↔8, etc.)
 * - Angular houses (1,4,7,10) have a special glow — "the axes of life"
 * - THE REVEAL: The houses form a complete map of human experience
 *   from self (1st) → transcendence (12th)
 */

const HOUSES: { num: number; area: string; rules: string; keywords: string[] }[] = [
  { num: 1,  area: "Self & Identity", rules: "First impressions, physical body, how the world sees you", keywords: ["Self", "Appearance", "Initiative"] },
  { num: 2,  area: "Money & Values", rules: "Possessions, self-worth, what you earn and value", keywords: ["Resources", "Worth", "Security"] },
  { num: 3,  area: "Communication", rules: "Speaking, writing, siblings, local travel, learning", keywords: ["Mind", "Siblings", "Short trips"] },
  { num: 4,  area: "Home & Roots", rules: "Family, ancestry, emotional foundation, private life", keywords: ["Family", "Foundation", "Origins"] },
  { num: 5,  area: "Creativity & Romance", rules: "Self-expression, dating, children, play, joy", keywords: ["Joy", "Romance", "Creation"] },
  { num: 6,  area: "Health & Service", rules: "Daily routines, work, wellness, pets, being useful", keywords: ["Health", "Work", "Service"] },
  { num: 7,  area: "Partnership", rules: "Marriage, committed relationships, contracts", keywords: ["Marriage", "Contracts", "Others"] },
  { num: 8,  area: "Transformation", rules: "Shared resources, sex, death, rebirth, other people's money", keywords: ["Death", "Rebirth", "Depth"] },
  { num: 9,  area: "Philosophy & Travel", rules: "Higher education, foreign lands, belief systems", keywords: ["Travel", "Wisdom", "Beliefs"] },
  { num: 10, area: "Career & Legacy", rules: "Public reputation, ambition, authority, life direction", keywords: ["Career", "Status", "Legacy"] },
  { num: 11, area: "Community & Dreams", rules: "Friendships, groups, hopes, wishes, social causes", keywords: ["Friends", "Hopes", "Community"] },
  { num: 12, area: "Subconscious", rules: "Hidden things, solitude, spirituality, self-undoing", keywords: ["Secrets", "Solitude", "Spirit"] },
];

const ANGULAR = new Set([1, 4, 7, 10]);
const SUCCEDENT = new Set([2, 5, 8, 11]);

export default function HouseWheel({ highlightHouse }: { highlightHouse?: number }) {
  const [selected, setSelected] = useState<number | null>(highlightHouse ?? null);
  const [showPairs, setShowPairs] = useState(false);

  const CX = 180, CY = 180, R = 155, INNER_R = 55;
  const oppositeHouse = selected !== null ? ((selected + 5) % 12) + 1 : null;

  const segmentPath = (index: number) => {
    const startAngle = (index * 30 - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * 30 - 90) * (Math.PI / 180);
    const x1o = CX + R * Math.cos(startAngle), y1o = CY + R * Math.sin(startAngle);
    const x2o = CX + R * Math.cos(endAngle), y2o = CY + R * Math.sin(endAngle);
    const x1i = CX + INNER_R * Math.cos(endAngle), y1i = CY + INNER_R * Math.sin(endAngle);
    const x2i = CX + INNER_R * Math.cos(startAngle), y2i = CY + INNER_R * Math.sin(startAngle);
    return `M${x1o},${y1o} A${R},${R} 0 0,1 ${x2o},${y2o} L${x1i},${y1i} A${INNER_R},${INNER_R} 0 0,0 ${x2i},${y2i} Z`;
  };

  const labelPos = (index: number) => {
    const a = ((index + 0.5) * 30 - 90) * (Math.PI / 180);
    const r = (R + INNER_R) / 2;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };

  const selectedData = selected !== null ? HOUSES[selected - 1] : null;
  const oppositeData = oppositeHouse !== null ? HOUSES[oppositeHouse - 1] : null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Toggle */}
      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        <button
          onClick={() => setShowPairs(!showPairs)}
          style={{
            padding: "0.4rem 0.9rem", borderRadius: "100px", cursor: "pointer",
            background: showPairs ? "rgba(200,168,75,0.12)" : "rgba(232,230,240,0.03)",
            border: `1px solid ${showPairs ? "rgba(200,168,75,0.3)" : "rgba(200,185,255,0.08)"}`,
            color: showPairs ? "rgba(212,175,55,0.9)" : "rgba(180,170,210,0.5)",
            fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.04em",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {showPairs ? "✦ Axis Pairs Visible" : "Show Axis Pairs"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 360 360" style={{ width: "100%", maxWidth: "360px" }}>
          {/* Axis lines when pairs mode */}
          {showPairs && [0,1,2,3,4,5].map(i => {
            const a1 = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
            const a2 = ((i + 6.5) * 30 - 90) * (Math.PI / 180);
            return (
              <line key={i}
                x1={CX + INNER_R * Math.cos(a1)} y1={CY + INNER_R * Math.sin(a1)}
                x2={CX + INNER_R * Math.cos(a2)} y2={CY + INNER_R * Math.sin(a2)}
                stroke="rgba(200,168,75,0.15)" strokeWidth={1} strokeDasharray="4,4"
              />
            );
          })}

          {/* Sectors */}
          {HOUSES.map((house, i) => {
            const isSelected = selected === house.num;
            const isOpposite = oppositeHouse === house.num && selected !== null;
            const isAngular = ANGULAR.has(house.num);
            const pos = labelPos(i);

            let fill = "rgba(232,230,240,0.015)";
            let stroke = "rgba(200,185,255,0.08)";
            if (isSelected) { fill = "rgba(200,168,75,0.1)"; stroke = "rgba(200,168,75,0.3)"; }
            else if (isOpposite) { fill = "rgba(123,104,238,0.08)"; stroke = "rgba(123,104,238,0.2)"; }
            else if (isAngular && showPairs) { fill = "rgba(200,168,75,0.03)"; }

            return (
              <g key={house.num} onClick={() => setSelected(isSelected ? null : house.num)} style={{ cursor: "pointer" }}>
                <path
                  d={segmentPath(i)}
                  fill={fill} stroke={stroke} strokeWidth={isSelected ? 1.5 : 0.5}
                  style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
                <text x={pos.x} y={pos.y - 6} textAnchor="middle" style={{
                  fontSize: isSelected ? "0.85rem" : "0.7rem", fontWeight: 600,
                  fill: isSelected ? "rgba(200,168,75,0.8)" : isOpposite ? "rgba(123,104,238,0.6)" : "rgba(200,185,255,0.35)",
                  fontFamily: "var(--font-mono)", pointerEvents: "none",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                  {house.num}
                </text>
                <text x={pos.x} y={pos.y + 8} textAnchor="middle" style={{
                  fontSize: "0.32rem", fontWeight: 300,
                  fill: isSelected ? "rgba(240,236,255,0.7)" : "rgba(180,170,210,0.25)",
                  fontFamily: "var(--font-body)", pointerEvents: "none",
                  letterSpacing: "0.02em",
                }}>
                  {house.area.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {/* Center */}
          <circle cx={CX} cy={CY} r={INNER_R - 5} fill="none" stroke="rgba(200,185,255,0.04)" strokeWidth={0.5} />
          <text x={CX} y={CY - 4} textAnchor="middle" style={{ fontSize: "0.45rem", fill: "rgba(200,168,75,0.35)", letterSpacing: "0.12em", fontFamily: "var(--font-body)" }}>
            THE HOUSES
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" style={{ fontSize: "0.35rem", fill: "rgba(180,170,210,0.25)", fontFamily: "var(--font-body)" }}>
            tap any sector
          </text>
        </svg>
      </div>

      {/* Selected house detail */}
      {selectedData && (
        <div style={{
          marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "0.75rem",
          background: "rgba(200,168,75,0.04)", border: "1px solid rgba(200,168,75,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700,
              color: "rgba(200,168,75,0.6)", width: "32px",
            }}>{selectedData.num}</span>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 500, color: "rgba(240,236,255,0.9)" }}>
                The {selectedData.area} House
                {ANGULAR.has(selectedData.num) && <span style={{ fontSize: "0.55rem", color: "rgba(200,168,75,0.4)", marginLeft: "0.4rem" }}>ANGULAR</span>}
              </div>
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: "0 0 0.4rem" }}>
            {selectedData.rules}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {selectedData.keywords.map(k => (
              <span key={k} style={{
                padding: "0.15rem 0.5rem", borderRadius: "100px", fontSize: "0.62rem",
                background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.1)",
                color: "rgba(200,168,75,0.55)",
              }}>{k}</span>
            ))}
          </div>

          {/* Opposite house connection */}
          {oppositeData && (
            <div style={{
              marginTop: "0.6rem", paddingTop: "0.6rem",
              borderTop: "1px solid rgba(200,185,255,0.04)",
            }}>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "rgba(123,104,238,0.5)", marginBottom: "0.25rem",
              }}>
                ↔ AXIS PARTNER: {oppositeData.num}th House — {oppositeData.area}
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300,
                lineHeight: 1.6, color: "rgba(196,185,228,0.55)", margin: 0,
              }}>
                The {selectedData.num}th and {oppositeData.num}th houses form an axis.
                Where the {selectedData.num}th house governs {selectedData.keywords[0].toLowerCase()},
                the {oppositeData.num}th governs {oppositeData.keywords[0].toLowerCase()} &mdash;
                two sides of the same cosmic truth.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
