/**
 * /oracle-letter — Displays the last tarot reading as an ancient sealed letter.
 * Reads from localStorage (key: "olivia-last-reading").
 * If no reading is saved, shows a CTA to draw a card.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OracleLetterPage from "@/components/OracleLetterPage";

interface SavedReading {
  cardName: string;
  cardGlyph?: string;
  reading: string;
  userName?: string;
  cosmicMoment: {
    planetaryHour: string;
    moonPhase: string;
    season: string;
    romanDate: string;
    romanYear: string;
  };
}

export default function OracleLetterRoute() {
  const router = useRouter();
  const [data, setData] = useState<SavedReading | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem("olivia-last-reading");
        if (raw) {
          const parsed = JSON.parse(raw) as SavedReading;
          // Basic validation
          if (parsed.cardName && parsed.reading && parsed.cosmicMoment) {
            setData(parsed);
          }
        }
      } catch {
        // Invalid data — fall through to empty state
      }
      setChecked(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Loading state
  if (!checked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--c-deep, #0c0d18)",
        }}
      />
    );
  }

  // Has reading — show the letter
  if (data) {
    return (
      <OracleLetterPage
        cardName={data.cardName}
        cardGlyph={data.cardGlyph}
        reading={data.reading}
        userName={data.userName}
        cosmicMoment={data.cosmicMoment}
        onClose={() => router.back()}
      />
    );
  }

  // No reading — CTA
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--c-deep, #0c0d18)",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          marginBottom: 24,
          opacity: 0.4,
        }}
      >
        {"\u2726"}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-heading, serif)",
          fontSize: "var(--text-lg, 1.625rem)",
          fontWeight: 400,
          color: "var(--c-text, #E8E6F0)",
          marginBottom: 12,
        }}
      >
        No Reading Yet
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "var(--text-base, 1rem)",
          color: "var(--c-text-muted, #8A87A0)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Draw a card from the Oracle to receive your sealed letter.
        The cosmos has something to say — but first, you must ask.
      </p>
      <Link
        href="/oracle"
        style={{
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "var(--text-sm, 0.875rem)",
          padding: "12px 32px",
          borderRadius: "var(--radius-pill, 9999px)",
          border: "1px solid var(--c-gold-dim, #8A6D2A)",
          background: "transparent",
          color: "var(--c-gold, #C8A84B)",
          textDecoration: "none",
          letterSpacing: "0.08em",
          transition: "background 0.2s",
          display: "inline-block",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(200,168,75,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        Draw a Card
      </Link>
    </div>
  );
}
