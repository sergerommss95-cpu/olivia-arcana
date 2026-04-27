/**
 * CosmicStatus.tsx — Real-time celestial status bar
 *
 * More visible: larger text, brighter colors, glass background, clear contrast.
 */

"use client";

import React, { useState, useEffect } from "react";
import { getSunPosition, getMoonPosition, getMoonPhase, getLiveEphemeris } from "../lib/celestial";
import { getUpcomingEvents, EVENT_TYPE_META } from "../lib/astro-events";
import { useLocale } from "../lib/i18n/useLocale";
import { getCosmicMoment } from "../lib/cosmic-time";

export default function CosmicStatus() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => { 
    setMounted(true); 
    const timer = setInterval(() => setTick(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!mounted) return null;

  const now = new Date();
  const moment = getCosmicMoment(now);
  const sun = getSunPosition(now);
  const eph = getLiveEphemeris();
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
    fontFamily: "var(--font-body)",
    fontSize: "0.72rem",
    fontWeight: 400,
    color: "rgba(220, 210, 240, 0.7)",
    letterSpacing: "0.03em",
  };

  const divider: React.CSSProperties = {
    width: "1px",
    height: "12px",
    background: "rgba(200, 185, 255, 0.12)",
    margin: "0 0.25rem",
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
      {/* Ephemeris Ticker — Scientific Proof */}
      <div className="hidden lg:flex" style={{
        ...item,
        fontFamily: "var(--font-mono)",
        fontSize: "0.58rem",
        color: "rgba(180, 170, 210, 0.35)",
        background: "transparent",
        border: "none",
        gap: "0.8rem",
        letterSpacing: "0.05em",
      }}>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <span style={{ color: "rgba(212,175,55,0.4)" }}>RA</span>
          <span>{eph.ra}h</span>
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <span style={{ color: "rgba(212,175,55,0.4)" }}>DEC</span>
          <span>{eph.dec}&deg;</span>
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <span style={{ color: "rgba(212,175,55,0.4)" }}>JD</span>
          <span>{eph.jd}</span>
        </div>
      </div>

      <div style={divider} className="hidden lg:block" />

      {/* Sun */}
      <div style={item}>
        <span style={{ fontSize: "0.85rem", color: "rgba(255,215,0,0.7)" }}>☉</span>
        <span style={text}>{sun.sign} {sun.degree}°</span>
      </div>

      {/* Planetary Hour */}
      <div style={{
        ...item,
        background: "rgba(232,201,106,0.08)",
        border: "1px solid rgba(232,201,106,0.15)",
      }}>
        <span style={{ fontSize: "0.85rem", color: "#E8C96A" }}>{moment.planetaryHourGlyph}</span>
        <span style={{ ...text, color: "#F4E9D0", fontWeight: 500 }}>{moment.planetaryHour}</span>
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
