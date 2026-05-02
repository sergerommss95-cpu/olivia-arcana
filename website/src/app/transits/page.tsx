"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { loadChart } from "../../lib/user-store";
import { computeTransits, type Transit } from "../../lib/transit-calculator";
import TransitTimeline from "../../components/TransitTimeline";
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

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TransitsPage() {
  const [mounted, setMounted] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [transits, setTransits] = useState<Transit[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
      const storedChart = loadChart();
      if (storedChart) {
        setChart(storedChart);
        // Compute transits (can be CPU-intensive, so defer a tick)
        setTimeout(() => {
          const result = computeTransits(storedChart, 6);
          setTransits(result);
          setLoading(false);
        }, 50);
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (!mounted) return null;

  // No chart data — CTA to go to portrait
  if (!loading && !chart) {
    return (
      <div style={{
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
      }}>
        <Link href="/" style={{
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
        }}>
          &larr; Home
        </Link>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.5 }}>&#9795;</div>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)",
            fontWeight: 400,
            marginBottom: "0.75rem",
          }}>
            <span className="text-gold-gradient">Transit Timeline</span>
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            fontWeight: 300,
            color: "rgba(196,185,228,0.55)",
            lineHeight: 1.7,
            maxWidth: "380px",
            margin: "0 auto 1.5rem",
          }}>
            To see your personal transits, we need your birth chart first.
            Enter your birth data to unlock your cosmic timeline.
          </p>
          <a
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
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !transits) {
    return (
      <div style={{
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
      }}>
        <div style={{
          fontFamily: "var(--font-accent)",
          fontSize: "1rem",
          color: "rgba(200,185,240,0.5)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>&#9790;</div>
          Computing your transits...
        </div>
      </div>
    );
  }

  // Stats
  const now = new Date();
  const thisMonth = transits.filter((tr) => {
    const m = tr.exactDate.getMonth();
    const y = tr.exactDate.getFullYear();
    return m === now.getMonth() && y === now.getFullYear();
  });

  const nextMajor = transits.find(
    (tr) => tr.significance === "high" && tr.exactDate.getTime() > now.getTime()
  );
  const daysToMajor = nextMajor ? daysBetween(now, nextMajor.exactDate) : null;

  return (
    <div style={{
      minHeight: "100svh",
      position: "relative",
      zIndex: 1,
      maxWidth: "900px",
      margin: "0 auto",
      padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.6rem",
          fontWeight: 400,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)",
          textDecoration: "none",
        }}>
          &larr; Home
        </Link>
        <h1 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 400,
          marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">Transit Timeline</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.82rem",
          fontWeight: 300,
          color: "rgba(196,185,228,0.55)",
          marginTop: "0.4rem",
        }}>
          Planetary movements activating your natal chart
        </p>
      </div>

      {/* Stats summary */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <div style={{ ...glass, padding: "1rem", textAlign: "center" }}>
          <div style={label}>Total Transits</div>
          <div style={{
            fontFamily: "var(--font-accent)",
            fontSize: "1.6rem",
            fontWeight: 400,
            color: "rgba(240,236,255,0.9)",
            marginTop: "0.3rem",
          }}>
            {transits.length}
          </div>
        </div>

        <div style={{ ...glass, padding: "1rem", textAlign: "center" }}>
          <div style={label}>This Month</div>
          <div style={{
            fontFamily: "var(--font-accent)",
            fontSize: "1.6rem",
            fontWeight: 400,
            color: "rgba(240,236,255,0.9)",
            marginTop: "0.3rem",
          }}>
            {thisMonth.length}
          </div>
        </div>

        <div style={{ ...glass, padding: "1rem", textAlign: "center" }}>
          <div style={label}>Next Major</div>
          <div style={{
            fontFamily: "var(--font-accent)",
            fontSize: "1.6rem",
            fontWeight: 400,
            color: daysToMajor !== null ? "#D4AF37" : "rgba(240,236,255,0.9)",
            marginTop: "0.3rem",
          }}>
            {daysToMajor !== null
              ? daysToMajor <= 0
                ? "Now"
                : `${daysToMajor}d`
              : "---"
            }
          </div>
          {nextMajor && (
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.6rem",
              fontWeight: 300,
              color: "rgba(180,170,210,0.4)",
              marginTop: "0.2rem",
            }}>
              {nextMajor.transitPlanet} {nextMajor.aspectType} {nextMajor.natalPlanet}
            </div>
          )}
        </div>
      </div>

      {/* Timeline — gated for Insight+ */}
      <Paywall requires="insight" priceKey="insight_monthly" featureName="your transit timeline">
        <TransitTimeline transits={transits} />
      </Paywall>

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
