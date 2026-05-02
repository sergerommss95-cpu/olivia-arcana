/**
 * CosmicLoader.tsx — Cinematic loading sequence
 *
 * 3-second intro sequence:
 *   1. Black screen → star glyph fades in with glow
 *   2. "Olivia Arcana" letter-by-letter reveal
 *   3. Tagline fades up
 *   4. Everything dissolves out, revealing the site
 *
 * Only shows once per session (sessionStorage flag).
 */

"use client";

import React, { useState, useEffect, useRef } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function CosmicLoader() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0); // 0=mount, 1=glyph, 2=name, 3=tagline, 4=exit
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only show once per session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("olivia-loaded")) {
      requestAnimationFrame(() => setShow(false));
      return;
    }
    requestAnimationFrame(() => setShow(true));
    // Prevent scroll during loader
    document.body.style.overflow = "hidden";

    // Phase timeline
    const timers = [
      setTimeout(() => setPhase(1), 200),    // glyph appears
      setTimeout(() => setPhase(2), 900),    // name reveals
      setTimeout(() => setPhase(3), 1800),   // tagline
      setTimeout(() => setPhase(4), 2800),   // exit
      setTimeout(() => {
        setShow(false);
        document.body.style.overflow = "";
        sessionStorage.setItem("olivia-loaded", "1");
      }, 3400),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!show) return null;

  const name = "Olivia Arcana";

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "#06041a",
        opacity: phase >= 4 ? 0 : 1,
        transition: `opacity 0.6s ${EASE}`,
        pointerEvents: phase >= 4 ? "none" : "auto",
      }}
    >
      {/* Glyph */}
      <div
        style={{
          fontSize: "2.5rem",
          color: "rgba(212,175,55,0.8)",
          textShadow: "0 0 40px rgba(212,175,55,0.3), 0 0 80px rgba(212,175,55,0.1)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.8)",
          transition: `all 0.8s ${EASE}`,
        }}
      >
        ✦
      </div>

      {/* Name — letter by letter */}
      <div
        style={{
          display: "flex",
          gap: "0.05em",
          fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 400,
          letterSpacing: "0.1em",
          color: "rgba(240,236,255,0.9)",
        }}
      >
        {name.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 0.4s ${EASE} ${i * 40}ms, transform 0.4s ${EASE} ${i * 40}ms`,
              width: ch === " " ? "0.3em" : undefined,
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: "var(--font-body), 'Inter', sans-serif",
          fontSize: "0.75rem",
          fontWeight: 300,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(180,170,210,0.5)",
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(6px)",
          transition: `all 0.6s ${EASE}`,
        }}
      >
        Written in Your Stars
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginTop: "2rem",
          opacity: phase >= 1 && phase < 4 ? 1 : 0,
          transition: `opacity 0.3s ${EASE}`,
        }}
      >
        {[1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: phase >= i ? "rgba(212,175,55,0.6)" : "rgba(200,185,255,0.15)",
              transition: `background 0.4s ${EASE}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
