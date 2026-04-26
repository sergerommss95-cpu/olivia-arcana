/**
 * InfiniteMarquee.tsx — Smooth infinite scrolling text/element strip
 *
 * Used for trust signals, partner logos, testimonial quotes, or
 * any content that should flow continuously. Supports:
 *   - Configurable speed and direction
 *   - Pause on hover
 *   - Gradient fade edges
 *   - Reverse direction option
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  /** Speed in pixels per second (default: 40) */
  speed?: number;
  /** Scroll direction (default: "left") */
  direction?: "left" | "right";
  /** Pause on hover (default: true) */
  pauseOnHover?: boolean;
  /** Show gradient fade on edges (default: true) */
  fadeEdges?: boolean;
  /** Gap between repeated items in px (default: 48) */
  gap?: number;
  className?: string;
}

export default function InfiniteMarquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = true,
  fadeEdges = true,
  gap = 48,
  className = "",
}: InfiniteMarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Calculate animation duration based on content width
  const [animDuration, setAnimDuration] = useState(20);
  useEffect(() => {
    if (!trackRef.current) return;
    const firstSet = trackRef.current.querySelector("[data-marquee-set]") as HTMLElement;
    if (!firstSet) return;
    const width = firstSet.offsetWidth;
    const timer = setTimeout(() => {
      setAnimDuration(width / speed);
    }, 0);
    return () => clearTimeout(timer);
  }, [speed, children]);

  if (reducedMotion) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div style={{ display: "flex", gap: `${gap}px`, justifyContent: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  const directionValue = direction === "left" ? "-50%" : "0%";
  const directionFrom = direction === "left" ? "0%" : "-50%";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        maskImage: fadeEdges
          ? "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
          : undefined,
        WebkitMaskImage: fadeEdges
          ? "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
          : undefined,
      }}
    >
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: "max-content",
          // Use longhand only — React warns if shorthand `animation` and
          // longhand `animationDirection` are both set on re-renders.
          animationName: "marqueeScroll",
          animationDuration: `${animDuration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: "normal",
        }}
        onMouseEnter={(e) => {
          if (pauseOnHover) {
            (e.currentTarget as HTMLElement).style.animationPlayState = "paused";
          }
        }}
        onMouseLeave={(e) => {
          if (pauseOnHover) {
            (e.currentTarget as HTMLElement).style.animationPlayState = "running";
          }
        }}
      >
        {/* Two copies for seamless loop */}
        <div data-marquee-set style={{ display: "flex", gap: `${gap}px`, paddingRight: `${gap}px` }}>
          {children}
        </div>
        <div aria-hidden="true" style={{ display: "flex", gap: `${gap}px`, paddingRight: `${gap}px` }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(${directionFrom}); }
          to   { transform: translateX(${directionValue}); }
        }
      `}</style>
    </div>
  );
}
