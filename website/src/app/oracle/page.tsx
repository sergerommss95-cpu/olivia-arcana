"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import FlipRevealCard from "@/components/shaders/FlipRevealCard"
import { ALL_CARDS } from "@/lib/academy/tarot-cards"
import { recordDraw } from "@/lib/deck-memory"

export default function OraclePage() {
  const [mounted, setMounted] = useState(false);
  const [card, setCard] = useState(ALL_CARDS[0]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Pick random card
    setCard(ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)]);
  }, []);

  const handleReveal = () => {
    setRevealed(true);
    recordDraw(card.name);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ─── Minimal glass nav ─── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          background: "rgba(8, 6, 20, 0.92)",
          backdropFilter: "blur(18px) saturate(1.25)",
          WebkitBackdropFilter: "blur(18px) saturate(1.25)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "#D4AF37",
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>&larr;</span>
          <span>Olivia Arcana</span>
        </Link>

        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-accent)",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(155,145,190,0.6)",
          }}
        >
          Oracle
        </span>
      </nav>

      {/* ─── Main content ─── */}
      <main
        id="main-content"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "calc(60px + 4rem)",
          paddingBottom: "3rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          width: "100%",
          maxWidth: 700,
        }}
      >
        {/* Flip reveal card */}
        <FlipRevealCard
          card={card}
          width={340}
          onFlip={(rev) => {
            if (rev) handleReveal();
          }}
        />

        {/* Below-canvas content */}
        <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 400,
              lineHeight: 1.2,
              color: "rgba(240,236,255,0.95)",
              margin: 0,
            }}
          >
            {revealed ? card.name : "Consult the Oracle"}
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              fontWeight: 300,
              lineHeight: 1.6,
              color: "rgba(196,185,228,0.80)",
              maxWidth: 440,
              margin: "1rem auto 0",
            }}
          >
            {revealed 
              ? card.upright
              : "Focus on your question. Reach out and touch the card to flip it and reveal your cosmic answer."}
          </p>

          {/* CTA */}
          <Link
            href="/portrait"
            style={{
              display: "inline-block",
              marginTop: "2rem",
              padding: "0.9rem 2.4rem",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, rgba(160,122,224,0.25), rgba(78,205,196,0.15))",
              border: "1px solid rgba(160,122,224,0.35)",
              color: "rgba(240,236,255,0.95)",
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
          >
            {revealed ? "Get Your Full Portrait" : "Begin Your Journey"}
          </Link>
        </div>
      </main>
    </div>
  )
}
