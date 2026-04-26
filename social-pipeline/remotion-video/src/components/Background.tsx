import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../types";

/**
 * Animated radial gradient background with subtle CSS particle dots.
 * The gradient "breathes" — a slow pulse on the radial center.
 * Particle dots drift slightly using interpolate, no canvas needed.
 */

// Deterministic particle positions seeded by golden angle
const PARTICLES = Array.from({ length: 80 }, (_, i) => ({
  x: ((Math.sin(i * 137.508) * 0.5 + 0.5) * 100).toFixed(1),
  y: ((Math.cos(i * 137.508 * 0.618) * 0.5 + 0.5) * 100).toFixed(1),
  size: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  phase: i * 2.39996,
  isGold: i % 11 === 0,
}));

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slow breathing pulse on gradient center
  const pulseProgress = interpolate(
    frame,
    [0, durationInFrames],
    [0, Math.PI * 4],
  );
  const gradientSize = 60 + Math.sin(pulseProgress) * 8;

  // Subtle shift in gradient center
  const centerX = 50 + Math.sin(pulseProgress * 0.3) * 3;
  const centerY = 45 + Math.cos(pulseProgress * 0.4) * 3;

  // Fade-in at start, fade-out at end
  const fadeIn = interpolate(frame, [0, 1.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 1.2 * fps, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const masterOpacity = fadeIn * fadeOut;

  // Golden light leak drift
  const leakX = 25 + Math.sin(pulseProgress * 0.15) * 15;
  const leakY = 20 + Math.cos(pulseProgress * 0.2) * 10;
  const leakOpacity = 0.04 + Math.sin(pulseProgress * 0.5) * 0.02;

  return (
    <AbsoluteFill style={{ opacity: masterOpacity }}>
      {/* Base gradient — deep cosmic */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${gradientSize}% ${gradientSize + 10}% at ${centerX}% ${centerY}%, ${COLORS.deepCosmos} 0%, #0a0a20 50%, ${COLORS.voidBlack} 100%)`,
        }}
      />

      {/* Secondary nebula wash — purple/indigo */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 45% 40% at ${65 + Math.sin(pulseProgress * 0.25) * 8}% ${55 + Math.cos(pulseProgress * 0.3) * 6}%, rgba(60,30,120,0.15) 0%, transparent 100%)`,
        }}
      />

      {/* Golden light leak — warm atmospheric glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 35% 30% at ${leakX}% ${leakY}%, rgba(212,175,55,${leakOpacity}) 0%, transparent 100%)`,
        }}
      />

      {/* Vignette — stronger for depth */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, transparent 0%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Star particles — varied sizes, some gold */}
      {PARTICLES.map((p, i) => {
        const twinkle = Math.sin(frame * 0.04 + p.phase) * 0.5 + 0.5;
        const drift = Math.sin(frame * 0.008 + p.phase) * 0.4;
        const driftY = Math.cos(frame * 0.006 + p.phase * 1.3) * 0.2;
        const color = p.isGold ? COLORS.celestialGold : COLORS.warmIvory;
        const maxOpacity = p.size >= 3 ? 0.6 : p.isGold ? 0.5 : 0.3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${parseFloat(p.x) + drift}%`,
              top: `${parseFloat(p.y) + driftY}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: twinkle * maxOpacity,
              boxShadow: p.size >= 3 ? `0 0 ${p.size * 2}px ${color}40` : "none",
            }}
          />
        );
      })}

      {/* Film grain texture overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
          opacity: 0.03,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};
