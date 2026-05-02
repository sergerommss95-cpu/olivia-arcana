/**
 * FilmGrain.tsx — Analog film grain + vignette overlay
 *
 * Adds cinematic texture to the entire site using SVG noise filters.
 * This is one of the three pillars of dark luxury web aesthetic
 * (grain + custom cursor + dark background).
 *
 * Uses SVG feTurbulence for performant GPU-accelerated noise.
 * The grain animates subtly via CSS animation to avoid static patterns.
 */

"use client";

import React, { useState, useEffect } from "react";

interface FilmGrainProps {
  opacity?: number; // 0-1 (default: 0.035)
  blendMode?: string; // CSS mix-blend-mode (default: "overlay")
  animate?: boolean; // animate grain (default: true)
  vignette?: boolean; // add vignette (default: true)
  vignetteIntensity?: number; // 0-1 (default: 0.4)
}

export default function FilmGrain({
  opacity = 0.035,
  blendMode = "overlay",
  animate = true,
  vignette = true,
  vignetteIntensity = 0.4,
}: FilmGrainProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const shouldAnimate = animate && !reducedMotion;

  return (
    <>
      {/* SVG filter definition (hidden, referenced by CSS) */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="cosmic-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="desaturatedNoise"
            />
            <feComponentTransfer in="desaturatedNoise" result="adjustedNoise">
              <feFuncR type="linear" slope="1.5" intercept="-0.15" />
              <feFuncG type="linear" slope="1.5" intercept="-0.15" />
              <feFuncB type="linear" slope="1.5" intercept="-0.15" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="adjustedNoise" mode="overlay" />
          </filter>
        </defs>
      </svg>

      {/* Grain layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          pointerEvents: "none",
          opacity,
          mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
          animation: shouldAnimate ? "grainShift 0.5s steps(4) infinite" : undefined,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: "absolute",
            // Oversized to allow translate animation without edges showing
            inset: "-50%",
            width: "200%",
            height: "200%",
            filter: "url(#cosmic-grain)",
            background: "transparent",
          }}
        />
      </div>

      {/* Vignette overlay */}
      {vignette && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9989,
            pointerEvents: "none",
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(4,2,13,${vignetteIntensity}) 100%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Inline keyframes for grain animation */}
      <style>{`
        @keyframes grainShift {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-2%, -3%); }
          50%  { transform: translate(1%, 2%); }
          75%  { transform: translate(-1%, 1%); }
          100% { transform: translate(2%, -1%); }
        }
      `}</style>
    </>
  );
}
