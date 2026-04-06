/**
 * CosmicStatus.tsx — Real-time status bar with live celestial data
 *
 * Shows below navbar: moon phase, Sun sign, Mercury status, link to /cosmos.
 * Uses the real celestial calculator.
 */

"use client";

import React, { useState, useEffect } from "react";
import { getSunPosition, getMoonPosition, getMoonPhase } from "../lib/celestial";
import { getUpcomingEvents, EVENT_TYPE_META } from "../lib/astro-events";

export default function CosmicStatus() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const now = new Date();
  const sun = getSunPosition(now);
  const moon = getMoonPosition(now);
  const moonPhase = getMoonPhase(now);
  const nextEvent = getUpcomingEvents(1)[0];
  const nextMeta = nextEvent ? EVENT_TYPE_META[nextEvent.type] : null;

  // Days until next event
  const daysUntil = nextEvent
    ? Math.ceil((new Date(nextEvent.date + "T00:00:00").getTime() - now.getTime()) / 86400000)
    : null;

  return (
    <div style={{
      position: "relative", zIndex: 10,
      display: "flex", justifyContent: "center", alignItems: "center",
      gap: "1.25rem", padding: "0.5rem 1.5rem",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(200,185,255,0.04)",
    }}>
      {/* Sun position */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,215,0,0.5)" }}>☉</span>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          color: "rgba(200,190,235,0.45)", letterSpacing: "0.04em",
        }}>{sun.signGlyph} {sun.sign} {sun.degree}°</span>
      </div>

      {/* Moon */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <span style={{ fontSize: "0.75rem" }}>{moonPhase.emoji}</span>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          color: "rgba(200,190,235,0.45)", letterSpacing: "0.04em",
        }}>{moon.signGlyph} {moonPhase.phase}</span>
      </div>

      {/* Next event */}
      {nextEvent && nextMeta && (
        <a href="/cosmos" style={{
          display: "flex", alignItems: "center", gap: "0.3rem",
          textDecoration: "none",
          padding: "0.15rem 0.6rem", borderRadius: "100px",
          background: `${nextMeta.color}08`, border: `1px solid ${nextMeta.color}12`,
          transition: "all 0.2s ease",
        }}>
          <span style={{ fontSize: "0.6rem" }}>{nextMeta.emoji}</span>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 400,
            color: `${nextMeta.color}88`, letterSpacing: "0.04em",
          }}>
            {nextEvent.title.split(" ").slice(0, 3).join(" ")}
            {daysUntil !== null && ` · ${daysUntil}d`}
          </span>
        </a>
      )}

      {/* Link to full cosmos page */}
      <a href="/cosmos" style={{
        fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: "rgba(212,175,55,0.35)", textDecoration: "none",
        transition: "color 0.2s",
      }}>View Cosmos →</a>
    </div>
  );
}
