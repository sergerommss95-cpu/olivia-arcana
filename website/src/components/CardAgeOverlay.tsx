/**
 * CardAgeOverlay — CSS-only aging effect for tarot card images
 *
 * Reads draw count from deck memory and applies imperceptibly warm
 * tinting + faint noise texture. Most-drawn cards "feel different"
 * without users noticing it as an explicit feature.
 */

"use client";

import React, { useMemo } from "react";
import { getCardAge } from "@/lib/deck-memory";

interface Props {
  cardId: string;
  children: React.ReactNode;
}

/**
 * Inline SVG noise encoded as a data URI.
 * Produces a subtle film-grain texture at very low opacity.
 */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export default function CardAgeOverlay({ cardId, children }: Props) {
  const age = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return getCardAge(cardId);
  }, [cardId]);

  // No effect at all for fresh cards
  if (age === 0) {
    return <>{children}</>;
  }

  const filterValue = [
    `sepia(${(age * 0.08).toFixed(3)})`,
    `saturate(${(1 + age * 0.05).toFixed(3)})`,
    `brightness(${(1 + age * 0.02).toFixed(3)})`,
  ].join(" ");

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Card image with warm aging filter */}
      <div style={{ filter: filterValue }}>
        {children}
      </div>

      {/* Faint noise texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: NOISE_SVG,
          backgroundRepeat: "repeat",
          opacity: age * 0.05,
          pointerEvents: "none",
          mixBlendMode: "overlay",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
