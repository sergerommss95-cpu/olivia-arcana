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
  href?: string;
  [key: string]: unknown;
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
      background: raised ? "rgba(21, 18, 48, 0.95)" : "rgba(14, 11, 36, 0.98)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    };
  } else if (variant === "veil") {
    look = {
      background: "rgba(8, 6, 26, 0.65)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(8px) ",
      WebkitBackdropFilter: "blur(8px) ",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
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
  as: Tag = "span",
  ...rest
}: {
  children: React.ReactNode;
  tone?: "gold" | "violet" | "muted";
  style?: React.CSSProperties;
  as?: React.ElementType;
  [key: string]: unknown;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const toneColor =
    tone === "gold"
      ? "rgba(232, 201, 106, 0.95)"
      : tone === "violet"
      ? "rgba(178, 150, 240, 0.88)"
      : "rgba(196, 185, 228, 0.82)";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTag = Tag as any;
  return (
    <CustomTag
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
    </CustomTag>
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
      ? "rgba(212, 175, 55, 0.4)"
      : tone === "violet"
      ? "rgba(160, 120, 255, 0.35)"
      : "rgba(200, 190, 235, 0.22)";
  const glyphColor =
    tone === "gold"
      ? "rgba(232, 201, 106, 0.95)"
      : tone === "violet"
      ? "rgba(178, 150, 240, 0.88)"
      : "rgba(196, 185, 228, 0.82)";
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
