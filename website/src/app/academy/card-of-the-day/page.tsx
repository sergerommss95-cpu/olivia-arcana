/**
 * Card of the Day — Daily tarot draw with full meaning
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function getDailyCard(): { card: TarotCard; reversed: boolean } {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = dayOfYear * 2654435761;
  const idx = Math.abs(seed) % ALL_CARDS.length;
  const reversed = (Math.abs(seed >> 8) % 3) === 0; // ~33% chance reversed
  return { card: ALL_CARDS[idx], reversed };
}

export default function CardOfTheDayPage() {
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const { card, reversed } = mounted ? getDailyCard() : { card: ALL_CARDS[0], reversed: false };

  const reveal = () => {
    setRevealed(true);
    cardRef.current?.animate(
      [
        { transform: "rotateY(180deg) scale(0.9)", filter: "blur(4px)" },
        { transform: "rotateY(360deg) scale(1)", filter: "blur(0)" },
      ],
      { duration: 800, easing: EASE, fill: "forwards" }
    );
  };

  const glass: React.CSSProperties = {
    background: "rgba(8,6,20,0.45)",
    backdropFilter: "blur(20px) saturate(1.2)",
    WebkitBackdropFilter: "blur(20px) saturate(1.2)",
    border: "1px solid rgba(200,185,255,0.08)",
    borderRadius: "1.5rem",
    boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const label: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
    letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
  };

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "600px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <a href="/academy" style={{ ...label, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>← Academy</a>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">Card of the Day</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", marginTop: "0.3rem",
        }}>
          {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Card area */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
        {!revealed ? (
          /* Face down card */
          <button onClick={reveal} style={{
            width: "200px", height: "300px",
            ...glass, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "1rem",
            transition: `all 0.3s ${EASE}`,
            border: "2px solid rgba(212,175,55,0.15)",
          }}>
            <div style={{
              fontSize: "2.5rem", color: "rgba(212,175,55,0.3)",
              animation: "zodiac-float 4s ease-in-out infinite",
            }}>✦</div>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 400,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(212,175,55,0.4)",
            }}>Tap to reveal</span>
          </button>
        ) : (
          /* Revealed card */
          <div ref={cardRef} style={{ width: "100%", maxWidth: "500px" }}>
            {/* Card header */}
            <div style={{
              ...glass, padding: "2rem", textAlign: "center", marginBottom: "1.5rem",
              border: `2px solid ${card.arcana === "major" ? "rgba(212,175,55,0.2)" : "rgba(200,185,255,0.1)"}`,
            }}>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: card.arcana === "major" ? "rgba(212,175,55,0.5)" : "rgba(180,170,210,0.4)",
                marginBottom: "0.5rem",
              }}>
                {card.arcana === "major" ? "Major Arcana" : `${card.suit} · Minor Arcana`}
                {reversed && " · Reversed"}
              </div>

              <h2 style={{
                fontFamily: "var(--font-accent)", fontSize: "1.8rem", fontWeight: 400,
                letterSpacing: "0.08em", color: "rgba(240,236,255,0.92)",
                margin: "0 0 0.5rem",
              }}>{card.name}</h2>

              {/* Keywords */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                {card.keywords.map(k => (
                  <span key={k} style={{
                    padding: "0.2rem 0.5rem", borderRadius: "100px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.06)",
                    fontFamily: "var(--font-body)", fontSize: "0.65rem",
                    color: "rgba(200,190,235,0.55)",
                  }}>{k}</span>
                ))}
              </div>
            </div>

            {/* Meaning */}
            <div style={{ ...glass, padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ ...label, marginBottom: "0.5rem", color: reversed ? "rgba(232,82,74,0.5)" : "rgba(78,205,196,0.5)" }}>
                {reversed ? "Reversed Meaning" : "Upright Meaning"}
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 300,
                lineHeight: 1.8, color: "rgba(220,210,240,0.75)", margin: 0,
              }}>{reversed ? card.reversed : card.upright}</p>
            </div>

            {/* Advice */}
            <div style={{
              ...glass, padding: "1.5rem", marginBottom: "1rem",
              textAlign: "center",
              background: "rgba(212,175,55,0.03)",
              border: "1px solid rgba(212,175,55,0.06)",
            }}>
              <div style={{ ...label, marginBottom: "0.4rem", color: "rgba(212,175,55,0.45)" }}>Today&apos;s Advice</div>
              <p style={{
                fontFamily: "var(--font-accent)", fontSize: "1rem", fontWeight: 400,
                lineHeight: 1.7, color: "rgba(220,210,240,0.8)", margin: 0,
                fontStyle: "italic",
              }}>{card.advice}</p>
            </div>

            {/* Correspondence */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem",
            }}>
              {[
                { label: "Astrology", value: card.astrology },
                { label: "Element", value: card.element },
                { label: "Yes / No", value: card.yesNo.charAt(0).toUpperCase() + card.yesNo.slice(1) },
              ].map(({ label: l, value }) => (
                <div key={l} style={{
                  ...glass, padding: "0.75rem", textAlign: "center",
                }}>
                  <div style={{ ...label, marginBottom: "0.2rem", fontSize: "0.5rem" }}>{l}</div>
                  <div style={{
                    fontFamily: "var(--font-accent)", fontSize: "0.85rem", fontWeight: 500,
                    color: "rgba(230,220,255,0.8)",
                  }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Journal prompt */}
            <div style={{
              ...glass, padding: "1.25rem", marginTop: "1rem",
            }}>
              <div style={{ ...label, marginBottom: "0.4rem" }}>Journal Prompt</div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                lineHeight: 1.7, color: "rgba(196,185,228,0.65)", margin: 0,
              }}>
                How does the energy of {card.name} {reversed ? "(reversed)" : ""} show up in your life right now?
                What is it asking you to pay attention to today?
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes zodiac-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  );
}
