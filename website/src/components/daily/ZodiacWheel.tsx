/**
 * ZodiacWheel.tsx — Circular zodiac navigator for /daily
 *
 * Replaces the identical-card grid / horizontal icon scroller with a
 * single circular composition: 12 sectors around a center axis. Click
 * a sector → select that sign. The zodiac is, after all, literally a
 * wheel — it's the one layout that doesn't feel arbitrary.
 *
 * Implementation: pure SVG, no dependencies. Each sector is a clickable
 * <g> with a filled wedge (low-opacity tint in the sign's element color)
 * and the zodiac glyph positioned on the ring. Selection highlights
 * with a gold ring + raised opacity.
 *
 * Sized fluidly via `width="100%"` on an aspect-ratio:1 wrapper.
 */

"use client";

import React, { useMemo } from "react";

export interface WheelSign {
  name: string;
  glyph: string;
  element: "Fire" | "Water" | "Air" | "Earth";
  color: string;
  dateRange: string;
}

interface Props {
  signs: WheelSign[]; // length === 12, in zodiac order starting at Aries
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  /** Optional label for the center of the wheel */
  centerLabel?: string;
  /** Optional glyph for the center (e.g. the current user's sun sign) */
  centerGlyph?: string;
}

// SVG geometry: 12 wedges around 360°
const N = 12;
const SLICE_DEG = 360 / N;
const ROOT_SIZE = 400;
const CX = ROOT_SIZE / 2;
const CY = ROOT_SIZE / 2;
const OUTER_R = 195;
const INNER_R = 108;
const GLYPH_R = 152; // where glyphs sit on the ring

const ELEMENT_TINT: Record<WheelSign["element"], string> = {
  Fire: "#FF6B35",
  Water: "#4FC3F7",
  Air: "#CEB5F0",
  Earth: "#7CB342",
};

// Convert polar (deg) to Cartesian. 0° = top (12 o'clock), clockwise.
function polar(deg: number, r: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function wedgePath(startDeg: number, endDeg: number, rOuter: number, rInner: number): string {
  const p1 = polar(startDeg, rOuter);
  const p2 = polar(endDeg, rOuter);
  const p3 = polar(endDeg, rInner);
  const p4 = polar(startDeg, rInner);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export default function ZodiacWheel({
  signs,
  selectedIndex,
  onSelect,
  centerLabel,
  centerGlyph,
}: Props) {
  // Precompute geometry to avoid recalculating on re-render
  const sectors = useMemo(() => {
    return signs.map((sign, i) => {
      const startDeg = i * SLICE_DEG - SLICE_DEG / 2;
      const endDeg = startDeg + SLICE_DEG;
      const midDeg = i * SLICE_DEG;
      const glyphPos = polar(midDeg, GLYPH_R);
      return {
        sign,
        i,
        startDeg,
        endDeg,
        midDeg,
        path: wedgePath(startDeg, endDeg, OUTER_R, INNER_R),
        glyphX: glyphPos.x,
        glyphY: glyphPos.y,
      };
    });
  }, [signs]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "520px",
        aspectRatio: "1",
        margin: "0 auto",
      }}
    >
      <svg
        viewBox={`0 0 ${ROOT_SIZE} ${ROOT_SIZE}`}
        style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
        role="radiogroup"
        aria-label="Zodiac wheel — select a sign"
      >
        <defs>
          <radialGradient id="wheel-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232, 201, 106, 0.22)" />
            <stop offset="60%" stopColor="rgba(14, 11, 36, 0.4)" />
            <stop offset="100%" stopColor="rgba(14, 11, 36, 0)" />
          </radialGradient>
          <filter id="wheel-glyph-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring glow */}
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_R + 6}
          fill="none"
          stroke="rgba(232, 201, 106, 0.12)"
          strokeWidth="1"
        />
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_R}
          fill="none"
          stroke="rgba(232, 201, 106, 0.32)"
          strokeWidth="1"
        />
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="none"
          stroke="rgba(232, 201, 106, 0.18)"
          strokeWidth="1"
        />

        {/* Wedges */}
        {sectors.map(({ sign, i, path, glyphX, glyphY, midDeg }) => {
          const selected = selectedIndex === i;
          const tint = ELEMENT_TINT[sign.element];
          return (
            <g
              key={sign.name}
              role="radio"
              aria-checked={selected}
              aria-label={`${sign.name} — ${sign.dateRange}`}
              tabIndex={0}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <path
                d={path}
                fill={selected ? `${tint}22` : "rgba(14, 11, 36, 0.38)"}
                stroke={selected ? "rgba(232, 201, 106, 0.9)" : "rgba(200, 185, 255, 0.08)"}
                strokeWidth={selected ? 1.4 : 0.75}
                style={{ transition: "fill 240ms ease, stroke 240ms ease" }}
              />
              <text
                x={glyphX}
                y={glyphY}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-heading, 'Cormorant Garamond'), serif"
                fontSize={selected ? "22" : "18"}
                fontWeight="500"
                fill={selected ? "#F5F0E8" : "rgba(220, 210, 240, 0.7)"}
                filter={selected ? "url(#wheel-glyph-glow)" : undefined}
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  transition: "fill 260ms ease, font-size 260ms ease",
                  transformOrigin: `${glyphX}px ${glyphY}px`,
                  transform: `rotate(${midDeg}deg)`,
                }}
              >
                {sign.glyph}
              </text>
            </g>
          );
        })}

        {/* Tick marks between sectors */}
        {sectors.map(({ startDeg }, i) => {
          const outer = polar(startDeg, OUTER_R);
          const inner = polar(startDeg, INNER_R);
          return (
            <line
              key={`tick-${i}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(232, 201, 106, 0.16)"
              strokeWidth="0.6"
            />
          );
        })}

        {/* Center disc */}
        <circle cx={CX} cy={CY} r={INNER_R - 8} fill="url(#wheel-center)" />

        {/* Center content */}
        {centerGlyph && (
          <text
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-heading, 'Cormorant Garamond'), serif"
            fontSize="56"
            fill="rgba(232, 201, 106, 0.88)"
            style={{ userSelect: "none" }}
          >
            {centerGlyph}
          </text>
        )}
        {centerLabel && (
          <text
            x={CX}
            y={centerGlyph ? CY + 38 : CY}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-body, system-ui), sans-serif"
            fontSize="10"
            letterSpacing="3"
            fill="rgba(200, 190, 230, 0.6)"
            style={{ textTransform: "uppercase", userSelect: "none" }}
          >
            {centerLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
