/**
 * CinematicLoader.tsx — Awwwards-grade loading sequence
 *
 * A 4-second branded intro that tells the brand story:
 *   Phase 0 (0-300ms): Black void
 *   Phase 1 (300-1200ms): Constellation trace draws a star glyph
 *   Phase 2 (1200-2200ms): "Olivia Arcana" per-character reveal with gold gradient
 *   Phase 3 (2200-3000ms): Tagline morphs in with blur
 *   Phase 4 (3000-3600ms): Count-up progress indicator
 *   Phase 5 (3600-4200ms): Everything dissolves with upward drift + blur
 *
 * The loader IS the first impression. It introduces the visual language.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const TOTAL_DURATION = 3200;

export default function CinematicLoader() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const startTime = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("olivia-loaded")) return;

    setShow(true);
    document.body.style.overflow = "hidden";
    startTime.current = performance.now();

    // Tightened phase timeline
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 2600),
      setTimeout(() => {
        setShow(false);
        document.body.style.overflow = "";
        sessionStorage.setItem("olivia-loaded", "1");
      }, TOTAL_DURATION),
    ];

    // Progress counter animation
    const animateProgress = () => {
      const elapsed = performance.now() - startTime.current;
      const p = Math.min(1, elapsed / (TOTAL_DURATION - 600));
      setProgress(Math.round(p * 100));
      if (p < 1) rafRef.current = requestAnimationFrame(animateProgress);
    };
    rafRef.current = requestAnimationFrame(animateProgress);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!show) return null;

  const name = "Olivia Arcana";
  const isExiting = phase >= 5;

  // SVG constellation path points (stylized star/compass)
  const constellationPath = "M 50,10 L 55,40 L 85,25 L 60,45 L 90,50 L 60,55 L 85,75 L 55,60 L 50,90 L 45,60 L 15,75 L 40,55 L 10,50 L 40,45 L 15,25 L 45,40 Z";

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#06041a",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(1.02)" : "scale(1)",
        filter: isExiting ? "blur(8px)" : "blur(0px)",
        transition: `all 0.6s ${EASE}`,
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      {/* Subtle radial glow behind constellation */}
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,122,224,0.08) 0%, transparent 70%)",
          opacity: phase >= 1 ? 1 : 0,
          transform: `scale(${phase >= 1 ? 1.5 : 0.5})`,
          transition: `all 2s ${EASE}`,
          pointerEvents: "none",
        }}
      />

      {/* Constellation trace SVG */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        width="80"
        height="80"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-30deg)",
          transition: `all 1s ${EASE}`,
        }}
      >
        <path
          d={constellationPath}
          fill="none"
          stroke="rgba(212,175,55,0.6)"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 500,
            strokeDashoffset: phase >= 1 ? 0 : 500,
            transition: `stroke-dashoffset 1.5s ${EASE}`,
            filter: "drop-shadow(0 0 6px rgba(212,175,55,0.3))",
          }}
        />
        {/* Center dot */}
        <circle
          cx="50"
          cy="50"
          r="2"
          fill="rgba(212,175,55,0.8)"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transition: `opacity 0.5s ${EASE} 0.8s`,
            filter: "drop-shadow(0 0 8px rgba(212,175,55,0.5))",
          }}
        />
      </svg>

      {/* Brand name — per-character reveal with gold gradient */}
      <div
        style={{
          display: "flex",
          gap: "0.02em",
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
          fontWeight: 400,
          letterSpacing: "0.12em",
          background: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 40%, #D4AF37 70%, #E2C070 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {name.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0) rotateX(0deg)" : "translateY(16px) rotateX(40deg)",
              filter: phase >= 2 ? "blur(0px)" : "blur(4px)",
              transition: `all 0.6s ${EASE} ${i * 45}ms`,
              width: ch === " " ? "0.35em" : undefined,
              transformOrigin: "center bottom",
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* Tagline with blur morph */}
      <div
        style={{
          fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
          fontSize: "0.72rem",
          fontWeight: 300,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(180,170,210,0.5)",
          opacity: phase >= 3 ? 1 : 0,
          filter: phase >= 3 ? "blur(0px)" : "blur(6px)",
          transform: phase >= 3 ? "translateY(0)" : "translateY(8px)",
          transition: `all 0.8s ${EASE}`,
        }}
      >
        Written in Your Stars
      </div>

      {/* Progress line */}
      <div
        style={{
          position: "absolute",
          bottom: "8vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          opacity: phase >= 1 && phase < 5 ? 1 : 0,
          transition: `opacity 0.4s ${EASE}`,
        }}
      >
        {/* Thin progress bar */}
        <div
          style={{
            width: "min(120px, 30vw)",
            height: "1px",
            background: "rgba(200,185,255,0.1)",
            borderRadius: "1px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, rgba(212,175,55,0.4), rgba(212,175,55,0.8))",
              transition: "width 0.1s linear",
            }}
          />
        </div>

        {/* Progress number */}
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color: "rgba(200,185,255,0.25)",
          }}
        >
          {String(progress).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
