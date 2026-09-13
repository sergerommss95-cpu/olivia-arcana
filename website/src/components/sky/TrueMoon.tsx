/**
 * TrueMoon.tsx — LUNA VERA, the Moon as she stands.
 *
 * An exact-phase Moon plate for the engraved sky: one hairline circle,
 * a faintly earthlit dark disc, and the lit region cut by the true
 * terminator — a semi-ellipse whose girth follows cos(phase). No glow,
 * no gradient, no blur; printed-almanac crispness only.
 *
 * Plate conventions: northern hemisphere. Waxing (0–180°) lights the
 * RIGHT limb, waning (180–360°) the LEFT. 0° new ✦ 90° first quarter
 * ✦ 180° full ✦ 270° last quarter. The terminator bows toward the lit
 * limb in crescent, away from it in gibbous.
 */

"use client";

import * as React from "react";

/** Round to 3 decimals; SVG path strings stay short and stable. */
function fmt(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * SVG path "d" of the LIT region of the Moon at phaseDeg
 * (0 = new, 90 = first quarter, 180 = full, 270 = last quarter).
 * Returns null when the lit sliver is negligible (phase < 2° or > 358°).
 *
 * Construction: k = cos(phase). The lit region is bounded by
 *  (1) the lit-limb semicircle from top pole (cx, cy−r) to bottom pole
 *      (cx, cy+r) — right limb while waxing, left while waning — and
 *  (2) the terminator, a semi-ellipse rx = |k|·r, ry = r, closing
 *      bottom pole back to top pole. It bows toward the lit limb when
 *      crescent (k > 0) and away from it when gibbous (k < 0), so the
 *      enclosed area is always (1 − k)/2 of the disc.
 */
export function moonPathD(
  phaseDeg: number,
  r: number,
  cx: number,
  cy: number
): string | null {
  const p = ((phaseDeg % 360) + 360) % 360;
  if (p < 2 || p > 358) return null;

  const k = Math.cos((p * Math.PI) / 180);
  const rx = Math.abs(k) * r;

  // Which limb is lit: +1 = right (waxing), −1 = left (waning).
  const side = p < 180 ? 1 : -1;
  // Which way the terminator bows: toward the lit limb when crescent,
  // away from it when gibbous.
  const bulge = k > 0 ? side : -side;

  // Limb semicircle, top pole → bottom pole. In SVG screen coordinates
  // sweep=1 travels clockwise (through the right limb), sweep=0
  // counterclockwise (through the left limb).
  const limbSweep = side === 1 ? 1 : 0;
  // Terminator semi-ellipse, bottom pole → top pole. Passing through
  // the right side is counterclockwise (sweep=0); the left, sweep=1.
  const termSweep = bulge === 1 ? 0 : 1;

  const top = `${fmt(cx)} ${fmt(cy - r)}`;
  const bottom = `${fmt(cx)} ${fmt(cy + r)}`;

  return (
    `M ${top} ` +
    `A ${fmt(r)} ${fmt(r)} 0 0 ${limbSweep} ${bottom} ` +
    `A ${fmt(rx)} ${fmt(r)} 0 0 ${termSweep} ${top} Z`
  );
}

export default function TrueMoon({
  phaseDeg,
  size = 120,
  tone = "#e8e9ff",
  className,
  style,
}: {
  phaseDeg: number;
  size?: number;
  tone?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const p = ((phaseDeg % 360) + 360) % 360;
  const isFull = p >= 178 && p <= 182;
  const d = isFull ? null : moonPathD(p, 48, 50, 50);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Earthlit dark side: the whole disc, barely there. */}
      <circle cx={50} cy={50} r={48} fill={tone} opacity={0.1} />
      {/* Hairline limb. */}
      <circle
        cx={50}
        cy={50}
        r={48}
        fill="none"
        stroke="rgba(232,233,255,0.28)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {/* Lit region, cut by the terminator. */}
      {isFull ? (
        <circle cx={50} cy={50} r={48} fill={tone} opacity={0.92} />
      ) : d ? (
        <path d={d} fill={tone} opacity={0.92} />
      ) : null}
    </svg>
  );
}
