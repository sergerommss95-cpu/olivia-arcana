/**
 * Surface.tsx — Container primitive with three archetypes
 *
 * The whole site defaulted to `.glass-card` — which means every surface
 * looks identical and nothing reads as important. Use this instead.
 *
 * Variants:
 *   - "solid"  — opaque dark surface; use for primary content containers
 *                (forms, data tables, essential reading panels)
 *   - "veil"   — the classic glass blur; use SPARINGLY for gestures that
 *                deserve a signature moment (the palette, the veil reveal)
 *   - "bare"   — no visual container; use when the page layout itself
 *                carries the composition (hero text, editorial typography)
 *
 * Why three?  Three archetypes (solid/veil/bare) give us real hierarchy
 * via container CHOICE rather than just size or color.
 */

"use client";

import React from "react";

export type SurfaceVariant = "solid" | "veil" | "bare";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  /** Use the "raised" tint (slightly lighter) for card-on-card situations. */
  raised?: boolean;
  /** Rounded corner radius. Defaults to the card radius token. */
  radius?: "sm" | "md" | "lg" | "pill" | "none";
  /** Extra inner padding. Use "none" to style padding yourself. */
  pad?: "none" | "sm" | "md" | "lg";
  as?: React.ElementType;
  children?: React.ReactNode;
}

const RADIUS: Record<NonNullable<SurfaceProps["radius"]>, string> = {
  none: "0",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  pill: "9999px",
};

const PAD: Record<NonNullable<SurfaceProps["pad"]>, string> = {
  none: "0",
  sm: "0.75rem 1rem",
  md: "1.25rem 1.5rem",
  lg: "1.75rem 2rem",
};

export default function Surface({
  variant = "solid",
  raised = false,
  radius = "md",
  pad = "md",
  as: Tag = "div",
  style,
  children,
  ...rest
}: SurfaceProps) {
  const base: React.CSSProperties = {
    position: "relative",
    borderRadius: RADIUS[radius],
    padding: PAD[pad],
    isolation: "isolate",
  };

  let look: React.CSSProperties = {};
  if (variant === "solid") {
    look = {
      background: raised ? "var(--surface-raised, #151230)" : "var(--surface-solid, #0e0b24)",
      border: "1px solid rgba(200,185,255,0.08)",
      boxShadow: "0 2px 28px rgba(0,0,0,0.35)",
    };
  } else if (variant === "veil") {
    look = {
      background: "var(--glass-bg, rgba(255,255,255,0.05))",
      border: "1px solid var(--glass-border, rgba(255,255,255,0.09))",
      backdropFilter: "var(--glass-blur, blur(18px) saturate(1.25))",
      WebkitBackdropFilter: "var(--glass-blur, blur(18px) saturate(1.25))",
      boxShadow: "0 2px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
    };
  } // "bare" → look stays {}

  return React.createElement(
    Tag,
    { style: { ...base, ...look, ...style }, ...rest },
    children
  );
}

// ── Eyebrow component ─────────────────────────────────────────────────────
// Small-caps label used above section headings. Signature typographic tell.

export function Eyebrow({
  children,
  tone = "gold",
  style,
  ...rest
}: {
  children: React.ReactNode;
  tone?: "gold" | "violet" | "muted";
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const toneColor =
    tone === "gold"
      ? "rgba(232, 201, 106, 0.82)"
      : tone === "violet"
      ? "rgba(178, 150, 240, 0.78)"
      : "rgba(180, 170, 210, 0.55)";
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "var(--font-body, system-ui), sans-serif",
        fontSize: "0.7rem",
        fontWeight: 500,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: toneColor,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

// ── Rule divider ──────────────────────────────────────────────────────────
// A very thin centered rule with a single small glyph. Editorial feel.

export function Rule({
  glyph = "\u2726",
  tone = "gold",
  style,
}: {
  glyph?: string;
  tone?: "gold" | "violet" | "muted";
  style?: React.CSSProperties;
}) {
  const lineColor =
    tone === "gold"
      ? "rgba(212, 175, 55, 0.28)"
      : tone === "violet"
      ? "rgba(160, 120, 255, 0.22)"
      : "rgba(200, 190, 235, 0.14)";
  const glyphColor =
    tone === "gold"
      ? "rgba(232, 201, 106, 0.85)"
      : tone === "violet"
      ? "rgba(178, 150, 240, 0.82)"
      : "rgba(200, 190, 235, 0.55)";
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: glyphColor,
        ...style,
      }}
    >
      <span style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)` }} />
      <span style={{ fontSize: "0.8rem", lineHeight: 1 }}>{glyph}</span>
      <span style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)` }} />
    </div>
  );
}
