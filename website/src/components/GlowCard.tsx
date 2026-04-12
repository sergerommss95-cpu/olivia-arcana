/**
 * GlowCard.tsx — 3D perspective tilt with dynamic light reflection
 *
 * Awwwards-grade card interaction:
 *   - 3D perspective tilt following cursor position
 *   - Dynamic light spot that follows mouse across surface
 *   - Gradient border glow that intensifies on hover
 *   - Subtle shadow depth shift
 *   - Smooth spring-like return to rest
 *   - Touch-device aware (disabled on mobile)
 */

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees (default: 8)
  glowColor?: string; // CSS color (default: accent purple)
  glowIntensity?: number; // 0-1 (default: 0.15)
  borderGlow?: boolean; // animated border (default: true)
  lightSpot?: boolean; // cursor light (default: true)
  scale?: number; // hover scale (default: 1.02)
  style?: React.CSSProperties;
}

export default function GlowCard({
  children,
  className = "",
  maxTilt = 8,
  glowColor = "rgba(160,122,224,0.35)",
  glowIntensity = 0.15,
  borderGlow = true,
  lightSpot = true,
  scale = 1.02,
  style,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const rafRef = useRef(0);
  const currentRef = useRef({ rotateX: 0, rotateY: 0, lightX: 50, lightY: 50 });
  const targetRef = useRef({ rotateX: 0, rotateY: 0, lightX: 50, lightY: 50 });

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (isTouch) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Map to tilt (center = 0, edges = maxTilt)
    targetRef.current.rotateY = (x - 0.5) * maxTilt * 2;
    targetRef.current.rotateX = (0.5 - y) * maxTilt * 2;
    // Light position as percentage
    targetRef.current.lightX = x * 100;
    targetRef.current.lightY = y * 100;
  }, [isTouch, maxTilt]);

  const handleEnter = useCallback(() => {
    if (isTouch) return;
    setIsHovered(true);
  }, [isTouch]);

  const handleLeave = useCallback(() => {
    setIsHovered(false);
    targetRef.current = { rotateX: 0, rotateY: 0, lightX: 50, lightY: 50 };
  }, []);

  // Spring animation loop
  useEffect(() => {
    if (isTouch) return;

    const animate = () => {
      const c = currentRef.current;
      const t = targetRef.current;
      const speed = isHovered ? 0.1 : 0.06; // faster approach, slower return

      c.rotateX = lerp(c.rotateX, t.rotateX, speed);
      c.rotateY = lerp(c.rotateY, t.rotateY, speed);
      c.lightX = lerp(c.lightX, t.lightX, 0.12);
      c.lightY = lerp(c.lightY, t.lightY, 0.12);

      const card = cardRef.current;
      if (card) {
        const s = isHovered ? scale : 1;
        card.style.transform = `perspective(1000px) rotateX(${c.rotateX}deg) rotateY(${c.rotateY}deg) scale(${s})`;
      }

      // Light spot
      if (lightRef.current && lightSpot) {
        lightRef.current.style.background = `radial-gradient(circle at ${c.lightX}% ${c.lightY}%, ${glowColor} 0%, transparent 60%)`;
        lightRef.current.style.opacity = isHovered ? String(glowIntensity) : "0";
      }

      // Border glow
      if (borderRef.current && borderGlow) {
        borderRef.current.style.background = `radial-gradient(circle at ${c.lightX}% ${c.lightY}%, rgba(212,175,55,0.4) 0%, rgba(160,122,224,0.2) 40%, transparent 70%)`;
        borderRef.current.style.opacity = isHovered ? "1" : "0";
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isHovered, isTouch, scale, glowColor, glowIntensity, borderGlow, lightSpot]);

  return (
    <div
      ref={cardRef}
      className={`relative group ${className}`}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        transformStyle: "preserve-3d",
        willChange: isHovered ? "transform" : "auto",
        transition: isHovered ? "none" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
    >
      {/* Animated border glow layer */}
      {borderGlow && !isTouch && (
        <div
          ref={borderRef}
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "inherit",
            opacity: 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
            zIndex: 0,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
          aria-hidden="true"
        />
      )}

      {/* Light reflection overlay */}
      {lightSpot && !isTouch && (
        <div
          ref={lightRef}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            opacity: 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
            zIndex: 1,
            mixBlendMode: "soft-light",
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
