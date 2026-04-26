"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loadChart } from "../../lib/user-store";
import { computeLifeTransits, type LifeTransit } from "../../lib/life-timing-engine";
import LifeTimingCard from "../../components/LifeTimingCard";
import Paywall from "../../components/Paywall";
import { useLocale } from "../../lib/i18n/useLocale";
import type { NatalChart } from "../../lib/natal-chart";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.6rem",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(180,170,210,0.45)",
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

export default function TimingPage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [transits, setTransits] = useState<LifeTransit[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const storedChart = loadChart();
      if (storedChart) {
        setChart(storedChart);
        const result = computeLifeTransits(storedChart);
        setTransits(result);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  // No chart — CTA to portrait
  if (!loading && !chart) {
    return (
      <div
        style={{
          minHeight: "100svh",
          position: "relative",
          zIndex: 1,
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.6rem",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(180,170,210,0.4)",
            textDecoration: "none",
            position: "absolute",
            top: "2rem",
            left: "1.5rem",
          }}
        >
          &larr; Home
        </Link>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.5 }}>&#9790;</div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)",
              fontWeight: 400,
              marginBottom: "0.75rem",
            }}
          >
            <span className="text-gold-gradient">Life Timing</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              fontWeight: 300,
              color: "rgba(196,185,228,0.55)",
              lineHeight: 1.7,
              maxWidth: "380px",
              margin: "0 auto 1.5rem",
            }}
          >
            To reveal your major life transits, we need your birth chart first.
            Enter your birth data to see what the cosmos has planned for you.
          </p>
          <Link
            href="/portrait"
            style={{
              display: "inline-block",
              padding: "0.7rem 2rem",
              borderRadius: "100px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "rgba(212,175,55,0.9)",
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textDecoration: "none",
              transition: `all 0.3s ${EASE}`,
            }}
          >
            Create Your Portrait
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (loading || !transits) {
    return (
      <div
        style={{
          minHeight: "100svh",
          position: "relative",
          zIndex: 1,
          maxWidth: "900px",
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: "1rem",
            color: "rgba(200,185,240,0.5)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>&#9790;</div>
          Scanning your cosmic timeline...
        </div>
      </div>
    );
  }

  const nearest = transits[0] || null;
  const rest = transits.slice(1);

  return (
    <div
      style={{
        minHeight: "100svh",
        position: "relative",
        zIndex: 1,
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.6rem",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(180,170,210,0.4)",
            textDecoration: "none",
          }}
        >
          &larr; Home
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 400,
            marginTop: "0.75rem",
          }}
        >
          <span className="text-gold-gradient">Life Timing</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 300,
            color: "rgba(196,185,228,0.55)",
            marginTop: "0.4rem",
          }}
        >
          Major cosmic transits approaching your chart over the next 3 years
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ ...glass, padding: "1rem", textAlign: "center" }}>
          <div style={label}>Transits Found</div>
          <div
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "1.6rem",
              fontWeight: 400,
              color: "rgba(240,236,255,0.9)",
              marginTop: "0.3rem",
            }}
          >
            {transits.length}
          </div>
        </div>

        <div style={{ ...glass, padding: "1rem", textAlign: "center" }}>
          <div style={label}>Life-Changing</div>
          <div
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "1.6rem",
              fontWeight: 400,
              color: "#D4AF37",
              marginTop: "0.3rem",
            }}
          >
            {transits.filter((t) => t.significance === "life-changing").length}
          </div>
        </div>

        <div style={{ ...glass, padding: "1rem", textAlign: "center" }}>
          <div style={label}>Next In</div>
          <div
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "1.6rem",
              fontWeight: 400,
              color: nearest ? "#D4AF37" : "rgba(240,236,255,0.9)",
              marginTop: "0.3rem",
            }}
          >
            {nearest ? (nearest.daysUntil <= 0 ? "Now" : `${nearest.daysUntil}d`) : "---"}
          </div>
        </div>
      </div>

      {/* Hero — nearest transit (Premium+) */}
      {nearest && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ ...label, marginBottom: "0.75rem" }}>Next Major Transit</div>
          <Paywall requires="premium" priceKey="premium_monthly" featureName="major life-transit forecasts">
            <LifeTimingCard transit={nearest} />
          </Paywall>
        </div>
      )}

      {/* Timeline of remaining transits */}
      {rest.length > 0 && (
        <div>
          <div style={{ ...label, marginBottom: "1rem" }}>Upcoming Timeline</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {rest.map((transit, i) => (
              <motion.div
                key={`${transit.name}-${transit.estimatedDate}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  ...glass,
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {/* Planet glyph */}
                <div
                  style={{
                    fontSize: "1.3rem",
                    opacity: 0.5,
                    width: "2rem",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {PLANET_GLYPHS[transit.transitPlanet] || "\u2736"}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "0.95rem",
                        fontWeight: 400,
                        color: "rgba(240,236,255,0.9)",
                      }}
                    >
                      {transit.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.5rem",
                        fontWeight: 600,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: SIGNIFICANCE_COLORS[transit.significance],
                        background: `${SIGNIFICANCE_COLORS[transit.significance]}12`,
                        border: `1px solid ${SIGNIFICANCE_COLORS[transit.significance]}25`,
                        borderRadius: "100px",
                        padding: "0.15rem 0.5rem",
                      }}
                    >
                      {transit.significance}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.72rem",
                      fontWeight: 300,
                      color: "rgba(196,185,228,0.5)",
                      marginTop: "0.2rem",
                    }}
                  >
                    {transit.lifeArea} &middot; {transit.transitPlanet} {transit.aspectType} natal{" "}
                    {transit.natalPlanet}
                  </div>
                </div>

                {/* Countdown */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-accent)",
                      fontSize: "1.1rem",
                      fontWeight: 400,
                      color: SIGNIFICANCE_COLORS[transit.significance] || "rgba(240,236,255,0.9)",
                    }}
                  >
                    {transit.daysUntil <= 0 ? "Active" : `${transit.daysUntil}d`}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.6rem",
                      fontWeight: 300,
                      color: "rgba(180,170,210,0.35)",
                    }}
                  >
                    {transit.estimatedDate}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {transits.length === 0 && (
        <div
          style={{
            ...glass,
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", opacity: 0.3, marginBottom: "0.75rem" }}>&#10024;</div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              fontWeight: 300,
              color: "rgba(196,185,228,0.5)",
              lineHeight: 1.7,
            }}
          >
            No major life transits detected in the next 3 years. Your cosmic weather is calm — a
            rare window for intentional building.
          </p>
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
