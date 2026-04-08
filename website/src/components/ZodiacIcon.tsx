/**
 * ZodiacIcon.tsx — Animated magical zodiac sign icons
 *
 * Each sign gets:
 *   - Pulsing glow aura in element color
 *   - Rotating ring of tiny dots (orbiting particles)
 *   - Gentle floating animation on the glyph
 *   - Shimmer sweep on hover/selection
 *   - Element-specific background gradient
 *
 * Fully CSS-animated, no Canvas/JS overhead.
 */

"use client";

import React from "react";

interface Props {
  glyph: string;
  name: string;
  color: string;
  element: "Fire" | "Water" | "Air" | "Earth";
  selected: boolean;
  onClick: () => void;
  size?: number;
}

const ELEMENT_GRADIENTS: Record<string, string> = {
  Fire: "radial-gradient(circle, rgba(255,107,53,0.12) 0%, rgba(255,180,0,0.04) 60%, transparent 80%)",
  Water: "radial-gradient(circle, rgba(79,195,247,0.10) 0%, rgba(126,87,194,0.04) 60%, transparent 80%)",
  Air: "radial-gradient(circle, rgba(200,200,240,0.08) 0%, rgba(206,147,216,0.03) 60%, transparent 80%)",
  Earth: "radial-gradient(circle, rgba(124,179,66,0.10) 0%, rgba(141,110,99,0.04) 60%, transparent 80%)",
};

export default function ZodiacIcon({ glyph, name, color, element, selected, onClick, size = 72 }: Props) {
  const id = `zi-${name.toLowerCase()}`;

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.5rem",
        minWidth: `${size}px`,
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: selected ? "scale(1.08)" : "scale(1)",
      }}
    >
      {/* Outer container for the icon */}
      <div
        style={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pulsing glow aura */}
        <div
          style={{
            position: "absolute",
            inset: selected ? "-6px" : "-2px",
            borderRadius: "50%",
            background: selected ? ELEMENT_GRADIENTS[element] : "transparent",
            animation: selected ? `${id}-pulse 3s ease-in-out infinite` : "none",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />

        {/* Rotating orbit ring */}
        <div
          style={{
            position: "absolute",
            inset: "-4px",
            borderRadius: "50%",
            border: `1px solid ${selected ? `${color}25` : "rgba(200,185,255,0.04)"}`,
            animation: selected ? "zodiac-orbit 12s linear infinite" : "none",
            transition: "border-color 0.5s ease",
          }}
        >
          {/* Orbiting dot */}
          {selected && (
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 6px ${color}88`,
            }} />
          )}
        </div>

        {/* Second orbit (counter-rotating, only when selected) */}
        {selected && (
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              border: `1px dashed ${color}12`,
              animation: "zodiac-orbit-reverse 20s linear infinite",
            }}
          >
            <div style={{
              position: "absolute",
              bottom: "-1.5px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: `${color}66`,
            }} />
          </div>
        )}

        {/* Glass circle background */}
        <div
          style={{
            width: `${size - 12}px`,
            height: `${size - 12}px`,
            borderRadius: "50%",
            background: selected
              ? `linear-gradient(135deg, ${color}18, ${color}08)`
              : "rgba(255,255,255,0.02)",
            border: `1.5px solid ${selected ? `${color}35` : "rgba(200,185,255,0.06)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: selected
              ? `0 0 20px ${color}15, inset 0 0 15px ${color}08`
              : "none",
          }}
        >
          {/* Shimmer sweep */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(120deg, transparent 30%, ${color}15 50%, transparent 70%)`,
              animation: selected ? "zodiac-shimmer 3s ease-in-out infinite" : "none",
              opacity: selected ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />

          {/* The glyph */}
          <span
            style={{
              fontSize: `${size * 0.38}px`,
              lineHeight: 1,
              position: "relative",
              zIndex: 1,
              animation: selected ? "zodiac-float 4s ease-in-out infinite" : "none",
              filter: selected ? `drop-shadow(0 0 8px ${color}50)` : "none",
              transition: "filter 0.4s ease",
              color: selected ? "rgba(255,255,255,0.95)" : "rgba(200,190,230,0.5)",
            }}
          >
            {glyph}
          </span>
        </div>

        {/* Tiny sparkle dots (only when selected) */}
        {selected && [0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "2px",
              height: "2px",
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 4px ${color}`,
              animation: `zodiac-sparkle-${i} ${2 + i * 0.5}s ease-in-out infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Name */}
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.58rem",
          fontWeight: selected ? 600 : 400,
          letterSpacing: selected ? "0.08em" : "0.04em",
          color: selected ? "rgba(240,236,255,0.9)" : "rgba(180,170,210,0.3)",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          textTransform: "uppercase",
        }}
      >
        {name}
      </span>

      {/* Global keyframes (injected once per component type via CSS) */}
      <style>{`
        @keyframes zodiac-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes zodiac-orbit-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes zodiac-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes zodiac-shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes zodiac-sparkle-0 {
          0%, 100% { top: 8px; left: 12px; opacity: 0; }
          50% { top: 4px; left: 8px; opacity: 0.8; }
        }
        @keyframes zodiac-sparkle-1 {
          0%, 100% { top: 50px; right: 8px; left: auto; opacity: 0; }
          50% { top: 46px; right: 4px; opacity: 0.6; }
        }
        @keyframes zodiac-sparkle-2 {
          0%, 100% { bottom: 14px; left: 6px; top: auto; opacity: 0; }
          50% { bottom: 10px; left: 2px; opacity: 0.7; }
        }
        @keyframes ${id}-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </button>
  );
}
