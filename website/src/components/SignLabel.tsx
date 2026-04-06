/**
 * SignLabel.tsx — Floating zodiac sign name on constellation hover
 *
 * Thin ultra-light sans-serif (Inter 200). Letter-by-letter reveal.
 * Clears immediately when mouse leaves constellation range.
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface HoverData {
  name: string;
  glyph: string;
  x: number;
  y: number;
}

export default function SignLabel() {
  const [hover, setHover] = useState<HoverData | null>(null);
  const [displayed, setDisplayed] = useState<HoverData | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Animate letters in
  useEffect(() => {
    if (!hover) return;
    setDisplayed(hover);
    setRevealCount(0);
    setExiting(false);

    let i = 0;
    const total = hover.name.length;
    const tick = () => {
      i++;
      setRevealCount(i);
      if (i < total) {
        revealTimer.current = setTimeout(tick, 35 + Math.random() * 15);
      }
    };
    revealTimer.current = setTimeout(tick, 60);

    return () => clearTimeout(revealTimer.current);
  }, [hover]);

  // Skip entirely on touch devices (no hover = no label)
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if ("ontouchstart" in window) setIsTouch(true);
  }, []);

  // Listen for hover events
  useEffect(() => {
    if (isTouch) return;
    const handle = (e: Event) => {
      const detail = (e as CustomEvent).detail as HoverData | null;
      clearTimeout(exitTimer.current);

      if (detail) {
        setHover(detail);
      } else {
        // Exit: fade out, then clear
        setExiting(true);
        clearTimeout(revealTimer.current);
        exitTimer.current = setTimeout(() => {
          setHover(null);
          setDisplayed(null);
          setRevealCount(0);
          setExiting(false);
        }, 300);
      }
    };

    window.addEventListener("zodiac:hover", handle as EventListener);
    return () => {
      window.removeEventListener("zodiac:hover", handle as EventListener);
      clearTimeout(exitTimer.current);
      clearTimeout(revealTimer.current);
    };
  }, [isTouch]);

  if (isTouch || !displayed) return null;

  const left = Math.max(80, Math.min(displayed.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 80));
  const top = displayed.y + 45;
  const letters = displayed.name.toUpperCase().split("");

  return (
    <div
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
        gap: "0.3rem",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.25s ease-out",
      }}
    >
      {/* Sign name — letter by letter */}
      <span
        style={{
          display: "flex",
          gap: "0.12em",
          fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
          fontWeight: 200,
          fontSize: "0.95rem",
          letterSpacing: "0.28em",
          color: "rgba(240,236,255,0.8)",
          textShadow: "0 0 20px rgba(160,140,220,0.25)",
          whiteSpace: "nowrap",
        }}
      >
        {letters.map((ch, i) => (
          <span
            key={`${displayed.name}-${i}`}
            style={{
              display: "inline-block",
              opacity: i < revealCount ? 1 : 0,
              transform: i < revealCount ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
            }}
          >
            {ch}
          </span>
        ))}
      </span>
    </div>
  );
}
