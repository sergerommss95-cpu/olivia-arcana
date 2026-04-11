"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { LifeTransit } from "../lib/life-timing-engine";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1.25rem",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const SIGNIFICANCE_COLORS: Record<string, string> = {
  "life-changing": "#D4AF37",
  major: "#C8A2E8",
  significant: "#7FBEEB",
};

const PLANET_GLYPHS: Record<string, string> = {
  Saturn: "\u2644",
  Jupiter: "\u2643",
  Uranus: "\u2645",
  Neptune: "\u2646",
  Pluto: "\u2647",
};

function getCyclePercent(transit: LifeTransit): number {
  // Rough cycle durations in days
  const cycleDays: Record<string, number> = {
    Saturn: 29.457 * 365.25,
    Jupiter: 11.862 * 365.25,
    Uranus: 84.01 * 365.25,
    Neptune: 164.8 * 365.25,
    Pluto: 247.94 * 365.25,
  };

  const total = cycleDays[transit.transitPlanet] || 10000;
  const multipliers: Record<string, number> = {
    conjunction: 1,
    opposition: 0.5,
    square: 0.25,
  };
  const fraction = multipliers[transit.aspectType] || 1;
  const segmentDays = total * fraction;
  const elapsed = segmentDays - transit.daysUntil;
  return Math.max(0, Math.min(100, (elapsed / segmentDays) * 100));
}

interface LifeTimingCardProps {
  transit: LifeTransit;
}

export default function LifeTimingCard({ transit }: LifeTimingCardProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(transit.estimatedDate).getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setCountdown({ days, hours, minutes });
    }

    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [transit.estimatedDate]);

  const percent = getCyclePercent(transit);
  const accentColor = SIGNIFICANCE_COLORS[transit.significance] || "#D4AF37";
  const glyph = PLANET_GLYPHS[transit.transitPlanet] || "\u2736";

  // SVG progress ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percent / 100) * circumference;

  function handleShare() {
    const text = `${transit.name} is approaching on ${transit.estimatedDate}.\n${transit.description}\n\nAdvice: ${transit.advice}\n\n-- Olivia Arcana`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        ...glass,
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
        }}
      />

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Progress ring */}
        <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
          <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
            {/* Background ring */}
            <circle
              cx={60}
              cy={60}
              r={radius}
              fill="none"
              stroke="rgba(200,185,255,0.06)"
              strokeWidth={6}
            />
            {/* Progress ring */}
            <motion.circle
              cx={60}
              cy={60}
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </svg>
          {/* Center glyph */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "1.6rem", opacity: 0.7 }}>{glyph}</span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                color: "rgba(200,185,255,0.4)",
                marginTop: "0.15rem",
              }}
            >
              {Math.round(percent)}% of cycle
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: "240px" }}>
          {/* Significance badge + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}25`,
                borderRadius: "100px",
                padding: "0.2rem 0.6rem",
              }}
            >
              {transit.significance}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(180,170,210,0.45)",
              }}
            >
              {transit.lifeArea}
            </span>
          </div>

          {/* Transit name */}
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)",
              fontWeight: 400,
              margin: "0 0 0.5rem",
            }}
          >
            <span className="text-gold-gradient">{transit.name}</span>
          </h2>

          {/* Countdown */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {[
              { value: countdown.days, label: "days" },
              { value: countdown.hours, label: "hrs" },
              { value: countdown.minutes, label: "min" },
            ].map((unit) => (
              <div key={unit.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "1.5rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.9)",
                    lineHeight: 1,
                  }}
                >
                  {unit.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.4)",
                    marginTop: "0.15rem",
                  }}
                >
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              fontWeight: 300,
              color: "rgba(196,185,228,0.6)",
              lineHeight: 1.75,
              marginBottom: "1rem",
            }}
          >
            {transit.description}
          </p>

          {/* Advice */}
          <div
            style={{
              ...glass,
              padding: "1rem",
              borderLeft: `2px solid ${accentColor}40`,
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: accentColor,
                marginBottom: "0.4rem",
              }}
            >
              Guidance
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                fontWeight: 300,
                color: "rgba(220,215,245,0.7)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {transit.advice}
            </p>
          </div>

          {/* Aspect + Date + Share */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                fontWeight: 400,
                color: "rgba(180,170,210,0.5)",
              }}
            >
              {transit.transitPlanet} {transit.aspectType} natal {transit.natalPlanet}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                fontWeight: 400,
                color: "rgba(180,170,210,0.35)",
              }}
            >
              ~{transit.estimatedDate}
            </span>
            <button
              onClick={handleShare}
              style={{
                marginLeft: "auto",
                padding: "0.4rem 1rem",
                borderRadius: "100px",
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "rgba(212,175,55,0.8)",
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: `all 0.3s ${EASE}`,
              }}
            >
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
