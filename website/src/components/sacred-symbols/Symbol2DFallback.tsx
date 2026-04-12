"use client";

/**
 * Symbol2DFallback — Inline SVG with CSS glow.
 * Used on mobile or when WebGL contexts are exhausted.
 */

import React from "react";

interface Symbol2DFallbackProps {
  paths: string[];
  size?: number;
  color?: string;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Symbol2DFallback({
  paths,
  size = 80,
  color = "#D4AF37",
  glowColor = "rgba(212,175,55,0.3)",
  className,
  style,
}: Symbol2DFallbackProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        filter: `drop-shadow(0 0 6px ${glowColor})`,
        ...style,
      }}
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      ))}
    </svg>
  );
}
