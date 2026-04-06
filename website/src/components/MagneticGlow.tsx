/**
 * MagneticGlow.tsx — Cursor glow that intensifies near interactive elements
 *
 * A fixed-position radial gradient that follows the cursor.
 * Grows brighter and larger when hovering over .glass-card or button elements.
 * Pure CSS — no Canvas or WebGL overhead.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

export default function MagneticGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [intense, setIntense] = useState(false);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window) return; // no glow on touch devices

    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (ref.current) {
        ref.current.style.left = `${e.clientX}px`;
        ref.current.style.top = `${e.clientY}px`;
      }

      // Check if hovering an interactive element
      const target = e.target as HTMLElement;
      const isInteractive = !!(
        target.closest(".glass-card") ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input")
      );
      setIntense(isInteractive);
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 2,
        width: intense ? "400px" : "250px",
        height: intense ? "400px" : "250px",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        background: intense
          ? "radial-gradient(circle, rgba(160,120,255,0.06) 0%, rgba(120,80,220,0.03) 40%, transparent 70%)"
          : "radial-gradient(circle, rgba(160,120,255,0.03) 0%, transparent 60%)",
        transition: "width 0.5s cubic-bezier(0.16,1,0.3,1), height 0.5s cubic-bezier(0.16,1,0.3,1), background 0.5s ease",
        mixBlendMode: "screen",
      }}
    />
  );
}
