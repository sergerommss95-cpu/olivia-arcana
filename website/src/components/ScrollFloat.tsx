"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface ScrollFloatProps {
  children: React.ReactNode;
  index?: number;
  intensity?: "subtle" | "medium" | "dramatic";
  className?: string;
  offsetTop?: string;
  offsetBottom?: string;
  disableRotate?: boolean;
  disableScale?: boolean;
  disableParallax?: boolean;
}

const INTENSITY = {
  subtle:   { rotate: 1.5,  scale: 0.03, parallax: 15,  opacity: 0.15 },
  medium:   { rotate: 3,    scale: 0.06, parallax: 30,  opacity: 0.3  },
  dramatic: { rotate: 5,    scale: 0.10, parallax: 50,  opacity: 0.5  },
} as const;

export default function ScrollFloat({
  children,
  index = 0,
  intensity = "medium",
  className = "",
  offsetTop = "100px",
  offsetBottom = "0px",
  disableRotate = false,
  disableScale = false,
  disableParallax = false,
}: ScrollFloatProps) {
  const { ref, progress } = useScrollProgress(offsetTop, offsetBottom);
  const cfg = INTENSITY[intensity];

  // Detect reduced motion safely (avoids SSR hydration mismatch)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const eased = useMemo(() => {
    if (reducedMotion) return 1;
    const staggerDelay = index * 0.04;
    const adjusted = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay)));
    return 1 - Math.pow(2, -10 * adjusted);
  }, [progress, index, reducedMotion]);

  const rotateX = disableRotate || reducedMotion ? 0 : (1 - eased) * cfg.rotate;
  const rotateY = disableRotate || reducedMotion ? 0 : (1 - eased) * cfg.rotate * 0.5;
  const scale = disableScale || reducedMotion ? 1 : 1 - (1 - eased) * cfg.scale;
  const translateY = disableParallax || reducedMotion ? 0 : (1 - eased) * cfg.parallax;
  const opacity = reducedMotion ? 1 : 1 - (1 - eased) * cfg.opacity;
  const clipInset = reducedMotion ? 0 : (1 - eased) * 100;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateY(${translateY}px)`,
        clipPath: eased < 0.99 ? `inset(${clipInset}% 0 0 0)` : "none",
        opacity,
        willChange: eased < 0.99 && !reducedMotion ? "transform, clip-path, opacity" : "auto",
        transformOrigin: "center bottom",
      }}
    >
      {children}
    </div>
  );
}
