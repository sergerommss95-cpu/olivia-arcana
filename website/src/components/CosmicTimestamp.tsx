/**
 * CosmicTimestamp — Renders the current cosmic moment
 *
 * Three variants:
 *   - "full":    Multi-line ritual timestamp with all fields
 *   - "compact": Single line "HOUR OF VENUS . WAXING CRESCENT"
 *   - "stamp":   Tiny inline monospace stamp
 *
 * Uses font-mono exclusively with letter-spacing for the
 * tiny-caps esoteric aesthetic.
 */

"use client";

import React, { useEffect, useState } from "react";
import { getCosmicMoment, type CosmicMoment } from "@/lib/cosmic-time";

interface CosmicTimestampProps {
  variant: "full" | "compact" | "stamp";
}

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  color: "var(--c-text-faint)",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
};

export default function CosmicTimestamp({ variant }: CosmicTimestampProps) {
  const [moment, setMoment] = useState<CosmicMoment | null>(null);

  useEffect(() => {
    setMoment(getCosmicMoment());

    // Refresh every 60s (planetary hours change on the hour,
    // but moon illumination drifts slowly)
    const interval = setInterval(() => {
      setMoment(getCosmicMoment());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  if (!moment) return null;

  if (variant === "full") {
    return (
      <div style={{ ...BASE_STYLE, fontSize: "0.625rem", lineHeight: 2 }}>
        <div>
          {moment.planetaryHourGlyph} {moment.planetaryHour.toUpperCase()}
        </div>
        <div>
          {moment.moonEmoji} {moment.moonPhase.toUpperCase()}
        </div>
        <div>{moment.season.toUpperCase()}</div>
        <div style={{ marginTop: "0.25rem", opacity: 0.6 }}>
          {moment.romanDate} {"\u00B7"} {moment.romanYear}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span style={{ ...BASE_STYLE, fontSize: "0.625rem" }}>
        {moment.planetaryHour.toUpperCase()} {"\u00B7"}{" "}
        {moment.moonPhase.toUpperCase()}
      </span>
    );
  }

  // variant === "stamp"
  return (
    <span style={{ ...BASE_STYLE, fontSize: "0.5rem", opacity: 0.5 }}>
      {moment.fullStamp}
    </span>
  );
}
