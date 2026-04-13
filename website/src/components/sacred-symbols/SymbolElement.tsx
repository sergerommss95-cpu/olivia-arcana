"use client";

/**
 * SymbolElement — Renders a sacred symbol as 3D (desktop) or 2D (mobile).
 *
 * Uses IntersectionObserver to lazy-mount/unmount the SVG3D component,
 * preventing WebGL context exhaustion (Chrome limits ~16 contexts).
 * Only symbols currently in viewport get a 3D canvas.
 */

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ALL_SYMBOLS, getSymbolCategory } from "./paths";
import Symbol2DFallback from "./Symbol2DFallback";

const Symbol3D = dynamic(() => import("./Symbol3D"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100%" }} />,
});

const CATEGORY_STYLE: Record<string, { material: string; color: string; glow: string }> = {
  zodiac:            { material: "gold", color: "#D4AF37", glow: "rgba(212,175,55,0.35)" },
  celestial:         { material: "glass", color: "#a07ae0", glow: "rgba(160,122,224,0.3)" },
  mystical:          { material: "chrome", color: "#D4AF37", glow: "rgba(212,175,55,0.35)" },
  "sacred-geometry": { material: "holographic", color: "#c8b4ff", glow: "rgba(200,180,255,0.35)" },
};

interface SymbolElementProps {
  symbol: string;
  color?: string;
  material?: string;
  size?: number;
  animate?: "none" | "spin" | "float" | "pulse" | "wobble" | "spinFloat" | "swing";
  className?: string;
  style?: React.CSSProperties;
}

export default function SymbolElement({
  symbol,
  color,
  material,
  size = 100,
  animate = "float",
  className,
  style,
}: SymbolElementProps) {
  const [use3D, setUse3D] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect 3D capability
  useEffect(() => {
    const isMobile = "ontouchstart" in window || window.innerWidth < 768;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setUse3D(!isMobile && !reducedMotion);
  }, []);

  // IntersectionObserver — only mount SVG3D when visible
  useEffect(() => {
    if (!use3D || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "100px" }, // pre-load slightly before entering viewport
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [use3D]);

  const data = ALL_SYMBOLS[symbol];
  if (!data) return null;

  const category = getSymbolCategory(symbol);
  const catStyle = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.zodiac;

  if (!use3D) {
    return (
      <Symbol2DFallback
        paths={data.paths}
        size={size}
        color={color ?? catStyle.color}
        glowColor={catStyle.glow}
        className={className}
        style={style}
      />
    );
  }

  return (
    <div ref={containerRef} style={{ width: size, height: size, ...style }} className={className}>
      {isVisible ? (
        <Symbol3D
          paths={data.paths}
          color={color ?? catStyle.color}
          materialPreset={(material ?? catStyle.material) as any}
          size={size}
          animate={animate}
        />
      ) : (
        <Symbol2DFallback
          paths={data.paths}
          size={size}
          color={color ?? catStyle.color}
          glowColor={catStyle.glow}
        />
      )}
    </div>
  );
}
