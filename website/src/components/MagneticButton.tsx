"use client";

import React, { useEffect, useState } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "gold" | "glass" | "outline";
  className?: string;
  external?: boolean;
  sound?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /**
   * Holographic shimmer + foil sweep — distilled from the Veil V2 card.
   * Defaults to `true` for `gold` and `glass` variants, `false` for `outline`.
   * Set explicitly to opt in/out per usage. Respects prefers-reduced-motion.
   */
  veil?: boolean;
}

// ── Shimmer keyframes, injected once ──────────────────────────────────────
// Rebuild marker: v2
const VEIL_STYLE_ID = "mb-veil-keyframes";
function ensureVeilStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VEIL_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = VEIL_STYLE_ID;
  el.textContent = `
@keyframes mb-holo-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes mb-foil-sweep {
  0%   { background-position: 200% 0; }
  100% { background-position: -100% 0; }
}
@keyframes mb-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
  30% { transform: scale(0.96); box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .mb-holo, .mb-foil { animation: none !important; }
}
`;
  document.head.appendChild(el);
}

// Conic gradient shared by all variants. Colors picked to harmonize with gold
// and violet palettes without looking like a rainbow sticker.
const HOLO_CONIC =
  "conic-gradient(from 0deg at 50% 50%, " +
  "rgba(212,175,55,0.0) 0deg, rgba(212,175,55,0.35) 40deg, " +
  "rgba(255,220,170,0.28) 80deg, rgba(160,120,255,0.30) 140deg, " +
  "rgba(120,200,255,0.22) 200deg, rgba(220,170,255,0.28) 260deg, " +
  "rgba(212,175,55,0.32) 320deg, rgba(212,175,55,0.0) 360deg)";

const FOIL_STRIPE =
  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)";

const VARIANTS = {
  gold: {
    bg: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)",
    text: "var(--c-void)",
    border: "none",
    shadow: "0 0 0px rgba(212,175,55,0)",
    shadowHover: "0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15)",
    glowColor: "rgba(212,175,55,0.2)",
  },
  glass: {
    bg: "linear-gradient(135deg, rgba(160,120,255,0.18) 0%, rgba(100,80,220,0.14) 100%)",
    text: "rgba(240,235,255,0.95)",
    border: "1px solid rgba(200,180,255,0.22)",
    shadow: "0 0 0px rgba(160,120,255,0)",
    shadowHover: "0 0 25px rgba(160,120,255,0.3), 0 0 50px rgba(160,120,255,0.1)",
    glowColor: "rgba(160,120,255,0.15)",
  },
  outline: {
    bg: "transparent",
    text: "var(--c-accent)",
    border: "1px solid rgba(160,120,255,0.3)",
    shadow: "0 0 0px rgba(160,120,255,0)",
    shadowHover: "0 0 20px rgba(160,120,255,0.2)",
    glowColor: "rgba(160,120,255,0.1)",
  },
} as const;

const SIZES = {
  sm: "px-5 py-2 text-sm",
  md: "px-8 py-3 text-base",
  lg: "px-10 py-4 text-lg",
} as const;

export default function MagneticButton({
  children,
  href,
  onClick,
  variant = "glass",
  className = "",
  external = false,
  sound = true,
  size = "md",
  disabled = false,
  veil,
}: MagneticButtonProps) {
  const { ref, x, y, active, pressed } = useMagnetic<HTMLElement>(60, 0.3);
  const v = VARIANTS[variant];
  const [clicked, setClicked] = useState(false);

  // Default veil on for gold/glass, off for outline (outline is the "quiet" variant).
  const veilEnabled = veil ?? variant !== "outline";

  // Client-only mount flag: the veil overlays are purely decorative and invisible
  // until hover, so we skip them during SSR to avoid hydration style-mismatch noise
  // (inline `animation` shorthand is normalized differently on server vs client).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!veilEnabled) return;
    ensureVeilStyles();
    requestAnimationFrame(() => setMounted(true));
  }, [veilEnabled]);

  const handleClick = () => {
    if (disabled) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 400);
    if (sound) {
      window.dispatchEvent(new CustomEvent("cosmos:chime"));
    }
    onClick?.();
  };

  // On touch devices, useMagnetic returns static {x:0, y:0, active:false}
  // so we only need to handle the press/active states for desktop
  const scale = pressed ? 0.97 : active ? 1.06 : 1;
  const translateX = x * 12;
  const translateY = y * 12;

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    position: "relative",
    borderRadius: "100px",
    background: v.bg,
    color: v.text,
    border: v.border,
    fontWeight: 600,
    letterSpacing: "0.02em",
    textDecoration: "none",
    cursor: "pointer",
    opacity: disabled ? 0.55 : undefined,
    overflow: "hidden",
    pointerEvents: disabled ? "none" : undefined,
    backdropFilter: variant === "glass" ? "blur(8px)" : undefined,
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    boxShadow: active ? v.shadowHover : v.shadow,
    transition: pressed
      ? "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 100ms ease"
      : "transform 400ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1)",
    animation: clicked ? "mb-pulse 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : undefined,
    willChange: active ? "transform, box-shadow" : "auto",
    minHeight: "46px",
    minWidth: "44px",
  };

  const glowStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: `radial-gradient(circle at ${50 + x * 50}% ${50 + y * 50}%, ${v.glowColor}, transparent 70%)`,
    opacity: active ? 1 : 0,
    transition: "opacity 300ms ease",
    pointerEvents: "none",
  };

  // Holographic conic gradient — rotates continuously, only shown on active.
  // mix-blend-mode: overlay keeps it tasteful over both gold and glass variants.
  const holoStyle: React.CSSProperties = {
    position: "absolute",
    // inset negative so rotation doesn't clip the corners
    inset: "-50%",
    borderRadius: "inherit",
    background: HOLO_CONIC,
    opacity: active ? (variant === "gold" ? 0.45 : 0.55) : 0,
    transition: "opacity 380ms ease",
    mixBlendMode: "overlay",
    pointerEvents: "none",
    animation: "mb-holo-rotate 9s linear infinite",
    // Hint to the compositor only while animating
    willChange: active ? "transform, opacity" : "auto",
  };

  // Classic trading-card foil sweep — slides across on active.
  const foilStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: FOIL_STRIPE,
    backgroundSize: "300% 100%",
    opacity: active ? 0.9 : 0,
    transition: "opacity 250ms ease",
    mixBlendMode: variant === "gold" ? "soft-light" : "screen",
    pointerEvents: "none",
    animation: "mb-foil-sweep 2.2s linear infinite",
    willChange: active ? "background-position, opacity" : "auto",
  };

  const content = (
    <>
      <span style={glowStyle} aria-hidden />
      {veilEnabled && mounted && (
        <>
          <span className="mb-holo" style={holoStyle} aria-hidden />
          <span className="mb-foil" style={foilStyle} aria-hidden />
        </>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={handleClick}
        className={`${SIZES[size]} ${className}`}
        style={style}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={handleClick}
      className={`${SIZES[size]} ${className}`}
      style={style}
      type="button"
      disabled={disabled}
    >
      {content}
    </button>
  );
}
