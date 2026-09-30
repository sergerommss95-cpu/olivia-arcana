/**
 * MeshAtmosphere.tsx — site-wide shader background driven by time of day.
 *
 * Uses @paper-design/shaders-react's <MeshGradient> as a fullscreen
 * atmospheric layer that drifts slowly in the background. The palette
 * rotates through four time-of-day presets (dawn / day / dusk / night)
 * matching the tokens in globals.css, and crossfades between them
 * gently when the hour boundary crosses.
 *
 * Mounted as `position: fixed` behind all content. z-index negative
 * so starfields and content render on top. Honors prefers-reduced-
 * motion (speed goes to 0).
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

type ToD = "dawn" | "day" | "dusk" | "night";

/** Colors matched to The Arrival token set (abyss → night → deep → lapis, gilt at dawn only). */
const PALETTES: Record<ToD, string[]> = {
  dawn:  ["#071522", "#0b192a", "#12283d", "#e0b768"], // abyss → night → deep → gilt (the one warm moment)
  day:   ["#071522", "#0b192a", "#1e3a5b", "#8d97ff"], // abyss → night → lapis → cool light
  dusk:  ["#071522", "#10273a", "#12283d", "#274c75"], // abyss → band → deep → lapis-lit
  night: ["#071522", "#0b192a", "#12283d", "#1e3a5b"], // abyss → night → deep → lapis
};

function currentToD(date: Date = new Date()): ToD {
  const h = date.getHours();
  if (h >= 5 && h < 9) return "dawn";
  if (h >= 9 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

interface MeshAtmosphereProps {
  /** Opacity of the shader layer (0-1). Default 0.85. */
  opacity?: number;
  /** Optional ToD override (for testing). */
  forceTod?: ToD;
}

export default function MeshAtmosphere({
  opacity = 0.85,
  forceTod,
}: MeshAtmosphereProps) {
  const [tod, setTod] = useState<ToD>(() => forceTod ?? currentToD());
  const [reducedMotion, setReducedMotion] = useState(false);

  // Re-check the ToD every 10 minutes so the background catches sunrise/set
  useEffect(() => {
    if (forceTod) return;
    const update = () => setTod(currentToD());
    update();
    const id = window.setInterval(update, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [forceTod]);

  // Respect reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const colors = useMemo(() => PALETTES[tod], [tod]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -3,
        pointerEvents: "none",
        opacity,
        // Smooth crossfade between palettes when ToD flips
        transition: "opacity 4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <MeshGradient
        colors={colors}
        speed={reducedMotion ? 0 : 0.24}
        distortion={0.85}
        swirl={0.45}
        style={{ width: "100%", height: "100%" }}
      />
      {/* Soft vignette to keep text legible near edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(7,21,34,0.6) 100%)",
        }}
      />
    </div>
  );
}
