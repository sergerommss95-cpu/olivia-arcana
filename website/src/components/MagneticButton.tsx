"use client";

import React from "react";
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
}

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
}: MagneticButtonProps) {
  const { ref, x, y, active, pressed } = useMagnetic<HTMLElement>(60, 0.3);
  const v = VARIANTS[variant];

  const handleClick = () => {
    if (sound) {
      window.dispatchEvent(new CustomEvent("cosmos:chime"));
    }
    onClick?.();
  };

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
    overflow: "hidden",
    backdropFilter: variant === "glass" ? "blur(16px) saturate(1.35)" : undefined,
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    boxShadow: active ? v.shadowHover : v.shadow,
    transition: pressed
      ? "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 100ms ease"
      : "transform 400ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: active ? "transform, box-shadow" : "auto",
    minHeight: "44px",
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

  const content = (
    <>
      <span style={glowStyle} aria-hidden />
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
    >
      {content}
    </button>
  );
}
