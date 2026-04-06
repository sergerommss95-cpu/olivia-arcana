/**
 * SignLabel.tsx — Floating zodiac sign name on constellation hover
 *
 * Listens for 'zodiac:hover' events from ZodiacGL.
 * Renders a positioned HTML label with luxury typography.
 * Uses Playfair Display italic — editorial, marvelous feel.
 * Smooth fade/blur in-out with expo ease-out.
 */

"use client";

import React, { useEffect, useState, useRef } from "react";

interface HoverData {
  name: string;
  glyph: string;
  x: number;
  y: number;
}

export default function SignLabel() {
  const [hover, setHover] = useState<HoverData | null>(null);
  const [visible, setVisible] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handle = (e: Event) => {
      const detail = (e as CustomEvent).detail as HoverData | null;

      if (detail) {
        // New sign hovered
        clearTimeout(timeoutRef.current);
        setHover(detail);
        // Slight delay so DOM positions first, then fade in
        requestAnimationFrame(() => setVisible(true));
      } else {
        // Hover ended — fade out, then clear
        setVisible(false);
        timeoutRef.current = setTimeout(() => setHover(null), 400);
      }
    };

    window.addEventListener("zodiac:hover", handle as EventListener);
    return () => {
      window.removeEventListener("zodiac:hover", handle as EventListener);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!hover) return null;

  // Position: below the constellation center, offset to stay readable
  const left = Math.max(60, Math.min(hover.x, window.innerWidth - 60));
  const top = hover.y + 40; // below the constellation

  return (
    <div
      ref={labelRef}
      style={{
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
        transform: "translate(-50%, 0)",
        zIndex: 5,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.15rem",

        // Animation state
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0px)" : "blur(4px)",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s cubic-bezier(0.16, 1, 0.3, 1), top 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Glyph */}
      <span
        style={{
          fontSize: "1.1rem",
          color: "rgba(212,175,55,0.6)",
          textShadow: "0 0 20px rgba(212,175,55,0.2)",
          lineHeight: 1,
        }}
      >
        {hover.glyph}
      </span>

      {/* Sign name — Playfair Display italic */}
      <span
        style={{
          fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: "1.3rem",
          letterSpacing: "0.08em",
          color: "rgba(240,236,255,0.85)",
          textShadow: "0 0 30px rgba(160,140,220,0.3), 0 2px 8px rgba(0,0,0,0.4)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {hover.name}
      </span>

      {/* Subtle underline accent */}
      <span
        style={{
          width: "24px",
          height: "1px",
          marginTop: "0.15rem",
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)",
        }}
      />
    </div>
  );
}
