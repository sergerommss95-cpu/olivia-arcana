/**
 * Starfield — Olivia Arcana
 * ─────────────────────────
 * Mounts the Three.js WebGL engine with all systems in one unified scene:
 *   - NebulaPlane: shader-driven background with flowmap displacement
 *   - StarSystem: GPU instanced star particles
 *   - FlowmapSystem: mouse displacement field
 *   - ZodiacGL: constellation lines + nodes + sacred geometry rings
 *
 * Everything lives in the same WebGL context — no separate Canvas 2D.
 */

"use client";

import React, { useRef, useEffect } from "react";

export default function Starfield() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<import("./cosmos/engine/WebGLEngine").WebGLEngine | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;

    const init = async () => {
      try {
        const [engineMod, nebulaMod, starMod, flowMod, zodiacMod, shootMod] = await Promise.all([
          import("./cosmos/engine/WebGLEngine"),
          import("./cosmos/engine/NebulaPlane"),
          import("./cosmos/engine/StarSystem"),
          import("./cosmos/engine/FlowmapSystem"),
          import("./cosmos/engine/ZodiacGL"),
          import("./cosmos/engine/ShootingStars"),
        ]);

        if (disposed || !containerRef.current) return;
        if (!engineMod.WebGLEngine.isSupported()) return;

        const engine = new engineMod.WebGLEngine(containerRef.current);
        engineRef.current = engine;

        const nebula = new nebulaMod.NebulaPlane();
        const flowmap = new flowMod.FlowmapSystem();
        const stars = new starMod.StarSystem();
        const zodiac = new zodiacMod.ZodiacGL();
        const shooting = new shootMod.ShootingStars();

        // Register in render order (with names for cosmic activation)
        engine.registerSystem(nebula, "nebula");     // layer 0: background
        engine.registerSystem(flowmap, "flowmap");   // updates flowmap RT each frame
        engine.registerSystem(stars, "stars");        // layer 1: star particles
        engine.registerSystem(zodiac, "zodiac");      // layer 2: constellation lines + nodes
        engine.registerSystem(shooting, "shooting");  // layer 3: shooting stars

        // Connect flowmap → nebula shader
        if (nebula.uniforms) {
          flowmap.connectTo(nebula.uniforms.uFlowmap);
          nebula.uniforms.uFlowmapEnabled.value = 1.0;
        }

        engine.start();
      } catch (err) {
        console.warn("WebGL init failed:", err);
      }
    };

    init();

    return () => {
      disposed = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      />
      {/* Dark fallback if WebGL fails */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: -2, backgroundColor: "#04020d" }}
      />
    </>
  );
}
