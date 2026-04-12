"use client";

import React, { useState } from "react";
import { ALL_CARDS } from "../../lib/academy/tarot-cards";

/**
 * TarotRevealCard — Progressive multi-layer card reveal.
 *
 * AHA moment: Each tap reveals a deeper layer of the card's meaning,
 * building from surface symbolism to deep wisdom to astrology connections.
 *
 * Layers:
 * 0 — Card back (mystery state)
 * 1 — Card name + number + "tap to explore"
 * 2 — Upright meaning
 * 3 — Reversed meaning
 * 4 — Keywords + astrology + element
 * 5 — Deep wisdom (advice) + "Secret Connection" to astrology
 */

const SUIT_COLORS: Record<string, string> = {
  wands: "#E8524A", cups: "#7B68EE", swords: "#D4AF37", pentacles: "#4ECDC4",
};

const ELEMENT_MAP: Record<string, string> = {
  Fire: "🔥", Water: "💧", Air: "💨", Earth: "🌍",
};

export default function TarotRevealCard({ cardName }: { cardName?: string }) {
  const card = cardName
    ? ALL_CARDS.find(c => c.name === cardName)
    : ALL_CARDS.find(c => c.arcana === "major" && c.number === 0); // Default: The Fool
  const [layer, setLayer] = useState(0);

  if (!card) return <div style={{ color: "rgba(180,170,210,0.4)" }}>Card not found: {cardName ?? "unknown"}</div>;

  const maxLayers = 5;
  const accentColor = card.suit ? SUIT_COLORS[card.suit] : "#D4AF37";
  const progress = layer / maxLayers;

  const advance = () => {
    if (layer < maxLayers) setLayer(l => l + 1);
    else setLayer(0); // Reset to beginning
  };

  return (
    <div
      onClick={advance}
      style={{
        marginBottom: "1rem", cursor: "pointer", userSelect: "none",
        borderRadius: "1rem", overflow: "hidden",
        background: layer === 0
          ? "linear-gradient(135deg, rgba(18,12,40,0.95) 0%, rgba(4,2,13,0.98) 100%)"
          : `linear-gradient(135deg, ${accentColor}08 0%, rgba(4,2,13,0.95) 100%)`,
        border: `1px solid ${layer === 0 ? "rgba(200,185,255,0.08)" : `${accentColor}20`}`,
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
      }}
    >
      {/* Progress bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, height: "2px",
        width: `${progress * 100}%`,
        background: `linear-gradient(90deg, ${accentColor}60, ${accentColor}20)`,
        transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        borderRadius: "0 1px 1px 0",
      }} />

      <div style={{ padding: "1.25rem 1.5rem" }}>
        {/* Layer 0: Mystery back */}
        {layer === 0 && (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{
              fontSize: "2.5rem", marginBottom: "0.5rem",
              color: "rgba(200,185,255,0.15)",
              textShadow: "0 0 30px rgba(160,130,255,0.1)",
            }}>
              🂠
            </div>
            <div style={{
              fontFamily: "var(--font-accent)", fontSize: "0.85rem", fontStyle: "italic",
              color: "rgba(200,185,255,0.3)",
            }}>
              Tap to reveal this card...
            </div>
          </div>
        )}

        {/* Layer 1+: Card identity */}
        {layer >= 1 && (
          <div style={{ marginBottom: layer >= 2 ? "0.75rem" : 0, textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: `${accentColor}60`,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.25rem",
            }}>
              {card.arcana === "major" ? `Major Arcana · ${card.number}` : `${card.suit} · ${card.number}`}
            </div>
            <div style={{
              fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 500,
              color: accentColor, marginBottom: "0.15rem",
            }}>
              {card.name}
            </div>
            {layer === 1 && (
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(180,170,210,0.35)",
                marginTop: "0.5rem",
              }}>
                tap to go deeper ↓
              </div>
            )}
          </div>
        )}

        {/* Layer 2: Upright meaning */}
        {layer >= 2 && (
          <div style={{
            marginBottom: "0.75rem", padding: "0.75rem 0.85rem", borderRadius: "0.6rem",
            background: "rgba(78,205,196,0.04)", border: "1px solid rgba(78,205,196,0.08)",
            opacity: layer >= 2 ? 1 : 0,
            transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(78,205,196,0.6)", marginBottom: "0.25rem",
            }}>
              ↑ Upright
            </div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
              lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: 0,
            }}>
              {card.upright}
            </p>
          </div>
        )}

        {/* Layer 3: Reversed meaning */}
        {layer >= 3 && (
          <div style={{
            marginBottom: "0.75rem", padding: "0.75rem 0.85rem", borderRadius: "0.6rem",
            background: "rgba(232,82,74,0.04)", border: "1px solid rgba(232,82,74,0.08)",
          }}>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(232,82,74,0.6)", marginBottom: "0.25rem",
            }}>
              ↓ Reversed
            </div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
              lineHeight: 1.7, color: "rgba(220,210,240,0.6)", margin: 0,
            }}>
              {card.reversed}
            </p>
          </div>
        )}

        {/* Layer 4: Keywords + correspondence */}
        {layer >= 4 && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.5rem" }}>
              {card.keywords.map(kw => (
                <span key={kw} style={{
                  padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.65rem",
                  background: `${accentColor}0a`, border: `1px solid ${accentColor}18`,
                  color: `${accentColor}90`,
                }}>{kw}</span>
              ))}
            </div>
            <div style={{
              display: "flex", gap: "1rem", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(180,170,210,0.45)",
            }}>
              <span>{ELEMENT_MAP[card.element] || "✦"} {card.element}</span>
              <span>✦ {card.astrology}</span>
              <span>{card.yesNo === "yes" ? "✓" : card.yesNo === "no" ? "✗" : "~"} {card.yesNo}</span>
            </div>
          </div>
        )}

        {/* Layer 5: Deep wisdom */}
        {layer >= 5 && (
          <div style={{
            padding: "0.85rem 1rem", borderRadius: "0.6rem",
            background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.12)",
          }}>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(200,168,75,0.5)", marginBottom: "0.3rem",
            }}>
              ✦ DEEP WISDOM
            </div>
            <p style={{
              fontFamily: "var(--font-accent)", fontSize: "0.9rem", fontWeight: 300,
              fontStyle: "italic", lineHeight: 1.7, color: "rgba(220,210,240,0.8)", margin: 0,
            }}>
              {card.advice}
            </p>
            <div style={{
              marginTop: "0.5rem", fontFamily: "var(--font-body)", fontSize: "0.68rem",
              color: "rgba(200,168,75,0.4)",
            }}>
              Ruled by {card.astrology} &mdash; this card channels the energy of {card.element.toLowerCase()}.
              {card.arcana === "major"
                ? ` As Major Arcana ${card.number}, it represents a major life theme, not a passing event.`
                : ` As a ${card.suit} card, it speaks to the realm of ${
                    card.suit === "wands" ? "passion, creativity, and willpower" :
                    card.suit === "cups" ? "emotions, relationships, and intuition" :
                    card.suit === "swords" ? "thought, truth, and mental clarity" :
                    "material reality, work, and physical world"
                  }.`}
            </div>
            <div style={{
              textAlign: "center", marginTop: "0.6rem",
              fontFamily: "var(--font-body)", fontSize: "0.6rem",
              color: "rgba(180,170,210,0.3)",
            }}>
              tap to start over ↻
            </div>
          </div>
        )}

        {/* Layer indicator */}
        {layer > 0 && layer < maxLayers && (
          <div style={{
            textAlign: "center", marginTop: "0.5rem",
            fontFamily: "var(--font-body)", fontSize: "0.6rem",
            color: "rgba(180,170,210,0.3)",
          }}>
            layer {layer} of {maxLayers} &mdash; tap to go deeper
          </div>
        )}
      </div>
    </div>
  );
}
