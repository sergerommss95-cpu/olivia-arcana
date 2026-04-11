/**
 * CosmicCursor — Custom cursor with gold particle trail
 *
 * Layer 3 of the design system. Three cursor states:
 *   1. Default: 8px gold circle + 2px ring
 *   2. Over interactive: 36px expanded, "✦" glyph
 *   3. Reading active: Eye glyph, fades out
 *
 * Gold particle trail: 24 pooled particles drift upward while fading.
 * Magnetic pull toward interactive elements within 80px.
 *
 * Desktop only — hidden on touch devices via CSS.
 */

"use client";

import React, { useEffect, useRef, useCallback } from "react";

const TRAIL_COUNT = 24;
const TRAIL_LIFETIME = 800;
const MAGNETIC_RANGE = 80;
const MAGNETIC_STRENGTH = 0.15;

interface Particle {
  x: number;
  y: number;
  born: number;
  active: boolean;
}

export default function CosmicCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const stateRef = useRef<"default" | "interactive" | "reading">("default");
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: TRAIL_COUNT }, () => ({
      x: 0, y: 0, born: 0, active: false,
    }))
  );
  const lastEmit = useRef(0);
  const rafRef = useRef(0);
  const isTouchRef = useRef(false);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia("(pointer: coarse)").matches) {
      isTouchRef.current = true;
      return;
    }

    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!canvas || !cursor || !ring) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse move
    const onMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;

      // Check for interactive elements
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isInteractive = el?.closest("a, button, [role='button'], input, select, textarea, [data-cursor='interactive']");
      stateRef.current = isInteractive ? "interactive" : "default";
    };

    // Magnetic pull toward interactive elements
    const applyMagnetic = () => {
      const interactives = document.querySelectorAll("a, button, [role='button']");
      let minDist = MAGNETIC_RANGE;
      let bestCx = 0, bestCy = 0;
      let found = false;

      interactives.forEach(el => {
        const rect = el.getBoundingClientRect();
        const ecx = rect.left + rect.width / 2;
        const ecy = rect.top + rect.height / 2;
        const dist = Math.hypot(targetRef.current.x - ecx, targetRef.current.y - ecy);
        if (dist < minDist) {
          minDist = dist;
          bestCx = ecx;
          bestCy = ecy;
          found = true;
        }
      });

      if (found) {
        const pull = (1 - minDist / MAGNETIC_RANGE) * MAGNETIC_STRENGTH;
        targetRef.current.x = lerp(targetRef.current.x, bestCx, pull);
        targetRef.current.y = lerp(targetRef.current.y, bestCy, pull);
      }
    };

    document.addEventListener("mousemove", onMove);

    // Animation loop
    const animate = () => {
      const now = performance.now();

      // Lerp cursor position
      posRef.current.x = lerp(posRef.current.x, targetRef.current.x, 0.15);
      posRef.current.y = lerp(posRef.current.y, targetRef.current.y, 0.15);

      applyMagnetic();

      const { x, y } = posRef.current;
      const state = stateRef.current;

      // Update cursor elements
      const size = state === "interactive" ? 36 : 8;
      const ringSize = state === "interactive" ? 38 : 24;
      cursor.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
      cursor.style.width = `${size}px`;
      cursor.style.height = `${size}px`;
      cursor.style.opacity = state === "reading" ? "0" : "1";

      ring.style.transform = `translate(${x - ringSize / 2}px, ${y - ringSize / 2}px)`;
      ring.style.width = `${ringSize}px`;
      ring.style.height = `${ringSize}px`;
      ring.style.opacity = state === "reading" ? "0" : "0.4";
      ring.style.borderWidth = state === "interactive" ? "1px" : "1.5px";

      // Emit particles
      if (now - lastEmit.current > 30 && state !== "reading") {
        const speed = Math.hypot(
          targetRef.current.x - posRef.current.x,
          targetRef.current.y - posRef.current.y
        );
        if (speed > 1.5) {
          const p = particlesRef.current.find(p => !p.active);
          if (p) {
            p.x = x;
            p.y = y;
            p.born = now;
            p.active = true;
            lastEmit.current = now;
          }
        }
      }

      // Draw particles
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      for (const p of particlesRef.current) {
        if (!p.active) continue;
        const age = now - p.born;
        if (age > TRAIL_LIFETIME) {
          p.active = false;
          continue;
        }
        const t = age / TRAIL_LIFETIME;
        const alpha = 0.5 * (1 - t);
        const py = p.y - t * 10; // drift upward
        const r = 1.5 * (1 - t * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,168,75,${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Don't render on touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Particle trail canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Cursor dot */}
      <div
        ref={cursorRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--c-gold)",
          mixBlendMode: "difference",
          pointerEvents: "none",
          zIndex: 9999,
          transition: "width 0.3s var(--ease-ritual), height 0.3s var(--ease-ritual), opacity 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden="true"
      />

      {/* Cursor ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "1.5px solid var(--c-gold)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.4,
          transition: "width 0.4s var(--ease-ritual), height 0.4s var(--ease-ritual), opacity 0.3s, border-width 0.3s",
        }}
        aria-hidden="true"
      />
    </>
  );
}
