/**
 * DeckStats — Living deck usage statistics
 *
 * Glass morphism card showing total draws, most-drawn cards,
 * never-drawn count, and favorites. Can be used as a standalone
 * page section or inside a modal.
 */

"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  getAllMemories,
  getMostDrawn,
  getTotalDraws,
} from "@/lib/deck-memory";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";

export default function DeckStats() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { 
    requestAnimationFrame(() => setMounted(true)); 
  }, []);

  const stats = useMemo(() => {
    if (!mounted) return null;

    const memories = getAllMemories();
    const totalDraws = getTotalDraws();
    const topCards = getMostDrawn(5);
    const drawnCardIds = new Set(Object.keys(memories));
    const neverDrawn = ALL_CARDS.filter((c) => !drawnCardIds.has(c.name)).length;
    const favorites = Object.entries(memories)
      .filter(([, m]) => m.isFavorite)
      .map(([cardId, memory]) => ({ cardId, memory }));

    return { totalDraws, topCards, neverDrawn, favorites };
  }, [mounted]);

  if (!mounted || !stats) {
    return null;
  }

  const { totalDraws, topCards, neverDrawn, favorites } = stats;

  return (
    <div style={glassCard}>
      <h3 style={heading}>Your Living Deck</h3>

      {/* Total draws */}
      <div style={statRow}>
        <span style={statLabel}>Total readings</span>
        <span style={statValue}>{totalDraws}</span>
      </div>

      <div style={statRow}>
        <span style={statLabel}>Cards never drawn</span>
        <span style={statValue}>{neverDrawn} of {ALL_CARDS.length}</span>
      </div>

      {/* Most drawn */}
      {topCards.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <h4 style={subHeading}>Most Drawn</h4>
          <ol style={list}>
            {topCards.map(({ cardId, memory }) => (
              <li key={cardId} style={listItem}>
                <span style={cardName}>
                  {memory.isFavorite && (
                    <span style={{ marginRight: "0.35rem", color: "var(--c-gold, #c8a84b)" }}>
                      *
                    </span>
                  )}
                  {cardId}
                </span>
                <span style={drawCount}>
                  {memory.drawCount} draw{memory.drawCount !== 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <h4 style={subHeading}>Favorites</h4>
          <div style={chipContainer}>
            {favorites.map(({ cardId }) => (
              <span key={cardId} style={chip}>{cardId}</span>
            ))}
          </div>
        </div>
      )}

      {totalDraws === 0 && (
        <p style={emptyText}>
          Your deck is fresh and unread. Each reading leaves
          an invisible mark on the cards you draw.
        </p>
      )}
    </div>
  );
}

/* ── Inline styles (glass morphism) ── */

const glassCard: React.CSSProperties = {
  background: "rgba(12, 13, 24, 0.45)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(200, 168, 75, 0.1)",
  borderRadius: "1rem",
  padding: "1.5rem 1.75rem",
  color: "rgba(220, 215, 200, 0.9)",
  maxWidth: "420px",
  width: "100%",
};

const heading: React.CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 600,
  color: "var(--c-gold, #c8a84b)",
  marginBottom: "1rem",
  letterSpacing: "0.02em",
};

const subHeading: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 500,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "rgba(200, 168, 75, 0.6)",
  marginBottom: "0.5rem",
};

const statRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.35rem 0",
  borderBottom: "1px solid rgba(200, 168, 75, 0.06)",
};

const statLabel: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "rgba(220, 215, 200, 0.65)",
};

const statValue: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "rgba(220, 215, 200, 0.95)",
  fontVariantNumeric: "tabular-nums",
};

const list: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const listItem: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.3rem 0",
  fontSize: "0.88rem",
};

const cardName: React.CSSProperties = {
  color: "rgba(220, 215, 200, 0.85)",
};

const drawCount: React.CSSProperties = {
  color: "rgba(200, 168, 75, 0.5)",
  fontSize: "0.8rem",
  fontVariantNumeric: "tabular-nums",
};

const chipContainer: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
};

const chip: React.CSSProperties = {
  background: "rgba(200, 168, 75, 0.08)",
  border: "1px solid rgba(200, 168, 75, 0.15)",
  borderRadius: "2rem",
  padding: "0.2rem 0.65rem",
  fontSize: "0.78rem",
  color: "rgba(200, 168, 75, 0.7)",
};

const emptyText: React.CSSProperties = {
  fontSize: "0.88rem",
  color: "rgba(220, 215, 200, 0.45)",
  fontStyle: "italic",
  marginTop: "0.75rem",
  lineHeight: 1.5,
};
