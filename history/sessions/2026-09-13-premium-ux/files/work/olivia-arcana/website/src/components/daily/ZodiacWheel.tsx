/**
 * ZodiacWheel.tsx — Circular zodiac navigator for /daily
 *
 * Personal-Almanac register: the wheel is drawn as a plate engraving —
 * ink hairlines on bone paper, twelve wedges around a center axis.
 * Click a sector → select that sign. Selection inks the wedge in the
 * one oxblood accent; everything else stays warm-black line work.
 *
 * Implementation: pure SVG, no dependencies. Each sector is a clickable
 * <g> with a wedge path and the zodiac glyph positioned on the ring.
 *
 * Sized fluidly via `width="100%"` on an aspect-ratio:1 wrapper.
 */

"use client";

import React, { useMemo } from "react";

export interface WheelSign {
  name: string;
  glyph: string;
  element: "Fire" | "Water" | "Air" | "Earth";
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

// Ink & paper — the almanac palette, self-contained so the wheel reads
// correctly even outside an AlmanacShell.
const INK = "#e8dcc8";
const INK_SOFT = "rgba(232, 233, 255, 0.68)";
const HAIRLINE = "rgba(232, 233, 255, 0.22)";
const OX = "#e0b768";
const OX_TINT = "rgba(224, 183, 104, 0.08)";

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
        {/* Ring hairlines — outer, main, inner */}
        <circle cx={CX} cy={CY} r={OUTER_R + 7} fill="none" stroke={HAIRLINE} strokeWidth="0.6" />
        <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke={INK} strokeWidth="1" opacity="0.8" />
        <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke={HAIRLINE} strokeWidth="0.8" />

        {/* Wedges */}
        {sectors.map(({ sign, i, path, glyphX, glyphY }) => {
          const selected = selectedIndex === i;
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
                fill={selected ? OX_TINT : "rgba(232, 233, 255, 0.015)"}
                stroke={selected ? OX : HAIRLINE}
                strokeWidth={selected ? 1.4 : 0.6}
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
                fill={selected ? OX : INK_SOFT}
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  transition: "fill 260ms ease, font-size 260ms ease",
                }}
              >
                {`${sign.glyph}\uFE0E`}
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
              stroke={HAIRLINE}
              strokeWidth="0.6"
            />
          );
        })}

        {/* Center disc — a fine double rule around the axis */}
        <circle cx={CX} cy={CY} r={INNER_R - 8} fill="none" stroke={HAIRLINE} strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r={3} fill={INK} opacity={centerGlyph ? 0 : 0.6} />

        {/* Center content */}
        {centerGlyph && (
          <text
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-heading, 'Cormorant Garamond'), serif"
            fontSize="56"
            fill={OX}
            style={{ userSelect: "none" }}
          >
            {`${centerGlyph}\uFE0E`}
          </text>
        )}
        {centerLabel && (
          <text
            x={CX}
            y={centerGlyph ? CY + 38 : CY}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-mono, ui-monospace), monospace"
            fontSize="10"
            letterSpacing="3"
            fill={INK_SOFT}
            style={{ textTransform: "uppercase", userSelect: "none" }}
          >
            {centerLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
