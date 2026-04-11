/**
 * CosmicStatus.tsx — Real-time celestial status bar
 *
 * More visible: larger text, brighter colors, glass background, clear contrast.
 */

"use client";

import React, { useState, useEffect } from "react";
import { getSunPosition, getMoonPosition, getMoonPhase } from "../lib/celestial";
import { getUpcomingEvents, EVENT_TYPE_META } from "../lib/astro-events";
import { useLocale } from "../lib/i18n/useLocale";

export default function CosmicStatus() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const now = new Date();
  const sun = getSunPosition(now);
  const moon = getMoonPosition(now);
  const moonPhase = getMoonPhase(now);
  const nextEvent = getUpcomingEvents(1)[0];
  const nextMeta = nextEvent ? EVENT_TYPE_META[nextEvent.type] : null;
  const daysUntil = nextEvent
    ? Math.ceil((new Date(nextEvent.date + "T00:00:00").getTime() - now.getTime()) / 86400000)
    : null;

  const item: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.25rem 0.65rem", borderRadius: "100px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200,185,255,0.06)",
  };

  const text: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 400,
    color: "rgba(220,210,240,0.7)", letterSpacing: "0.03em",
  };

  return (
    <div style={{
      position: "relative", zIndex: 10,
      display: "flex", justifyContent: "center", alignItems: "center",
      gap: "0.5rem", padding: "0.6rem 1.5rem",
      flexWrap: "wrap",
      background: "rgba(4,2,13,0.5)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(200,185,255,0.06)",
    }}>
      {/* Sun */}
      <div style={item}>
        <span style={{ fontSize: "0.85rem", color: "rgba(255,215,0,0.7)" }}>☉</span>
        <span style={text}>{sun.sign} {sun.degree}°</span>
      </div>

      {/* Moon */}
      <div style={item}>
        <span style={{ fontSize: "0.85rem" }}>{moonPhase.emoji}</span>
        <span style={text}>{moonPhase.phase}</span>
      </div>

      {/* Next event */}
      {nextEvent && nextMeta && (
        <a href="/cosmos" style={{
          ...item,
          textDecoration: "none",
          background: `${nextMeta.color}10`,
          border: `1px solid ${nextMeta.color}20`,
        }}>
          <span style={{ fontSize: "0.75rem" }}>{nextMeta.emoji}</span>
          <span style={{
            ...text,
            color: `${nextMeta.color}bb`,
            fontWeight: 500,
          }}>
            {nextEvent.title.split(" ").slice(0, 4).join(" ")}
            {daysUntil !== null && daysUntil > 0 && ` · ${daysUntil}d`}
          </span>
        </a>
      )}

      {/* Cosmos link */}
      <a href="/cosmos" style={{
        ...item,
        textDecoration: "none",
        background: "rgba(212,175,55,0.06)",
        border: "1px solid rgba(212,175,55,0.12)",
      }}>
        <span style={{ fontSize: "0.7rem", color: "rgba(212,175,55,0.6)" }}>✦</span>
        <span style={{
          ...text,
          color: "rgba(212,175,55,0.65)",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "0.65rem",
        }}>{t("nav_cosmos")}</span>
      </a>
    </div>
  );
}
