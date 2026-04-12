"use client";

/**
 * SymbolElement — Public API for rendering a sacred symbol.
 *
 * Picks 3D (desktop + WebGL) or 2D fallback (mobile / context exhausted).
 * Falls back to 2D automatically if WebGL init fails (context limit hit).
 */

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { ALL_SYMBOLS, getSymbolCategory } from "./paths";
import { defaultPreset, type MaterialPreset } from "./materials/presets";
import Symbol2DFallback from "./Symbol2DFallback";

const Symbol3D = dynamic(() => import("./Symbol3D"), { ssr: false });

interface SymbolElementProps {
  symbol: string;
  material?: MaterialPreset;
  size?: number;
  rotationSpeed?: number;
  floatAmplitude?: number;
  mouseParallax?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FALLBACK_COLORS: Record<MaterialPreset, { color: string; glow: string }> = {
  gold: { color: "#D4AF37", glow: "rgba(212,175,55,0.35)" },
  glass: { color: "#a07ae0", glow: "rgba(160,122,224,0.3)" },
  holo: { color: "#c8b4ff", glow: "rgba(200,180,255,0.35)" },
};

export default function SymbolElement({
  symbol,
  material,
  size = 100,
  rotationSpeed = 0.3,
  floatAmplitude = 0.12,
  mouseParallax = true,
  className,
  style,
}: SymbolElementProps) {
  const [mode, setMode] = useState<"pending" | "3d" | "2d">("pending");

  useEffect(() => {
    const isMobile = "ontouchstart" in window || window.innerWidth < 768;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isMobile || reducedMotion) {
      setMode("2d");
      return;
    }

    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      setMode(gl ? "3d" : "2d");
    } catch {
      setMode("2d");
    }
  }, []);

  // If 3D init fails (context limit), fall back to 2D
  const handleWebGLError = useCallback(() => setMode("2d"), []);

  const data = ALL_SYMBOLS[symbol];
  if (!data) return null;

  const category = getSymbolCategory(symbol);
  const preset = material ?? defaultPreset(category);
  const colors = FALLBACK_COLORS[preset];

  if (mode === "3d") {
    return (
      <Symbol3D
        paths={data.paths}
        material={preset}
        size={size}
        rotationSpeed={rotationSpeed}
        floatAmplitude={floatAmplitude}
        mouseParallax={mouseParallax}
        onError={handleWebGLError}
        className={className}
        style={style}
      />
    );
  }

  if (mode === "2d") {
    return (
      <Symbol2DFallback
        paths={data.paths}
        size={size}
        color={colors.color}
        glowColor={colors.glow}
        className={className}
        style={style}
      />
    );
  }

  // Pending — show placeholder
  return <div style={{ width: size, height: size }} />;
}
