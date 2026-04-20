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
    let handleScrollRhythm: (() => void) | null = null;
    let archetypeInterval: ReturnType<typeof setInterval> | null = null;

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

        const isMobile = "ontouchstart" in window || window.innerWidth < 768;

        const engine = new engineMod.WebGLEngine(containerRef.current);
        engineRef.current = engine;

        const nebula = new nebulaMod.NebulaPlane();
        const stars = new starMod.StarSystem(isMobile);
        const zodiac = new zodiacMod.ZodiacGL();
        const shooting = new shootMod.ShootingStars();

        // Register in render order
        engine.registerSystem(nebula, "nebula");

        // Skip flowmap on mobile (no hover, saves 2 FBOs)
        if (!isMobile) {
          const flowmap = new flowMod.FlowmapSystem();
          engine.registerSystem(flowmap, "flowmap");
          if (nebula.uniforms) {
            flowmap.connectTo(nebula.uniforms.uFlowmap);
            nebula.uniforms.uFlowmapEnabled.value = 1.0;
          }
        }

        engine.registerSystem(stars, "stars");
        engine.registerSystem(zodiac, "zodiac");
        // Fewer shooting stars on mobile (handled inside the system)
        engine.registerSystem(shooting, "shooting");

        try {
          const { getVisitorArchetype } = await import("../lib/visitor-archetype");
          const { getAnniversaryWarmth } = await import("../lib/anniversary");
          const { loadUser } = await import("../lib/user-store");

          const applyArchetype = () => {
            const nebulaSystem = engine.getSystem<import("./cosmos/engine/NebulaPlane").NebulaPlane>("nebula");
            if (!nebulaSystem) return;

            const archetype = getVisitorArchetype();
            const user = loadUser();
            const anniversaryWarmth =
              user?.input?.year && user?.input?.month && user?.input?.day
                ? getAnniversaryWarmth(
                    new Date(user.input.year, user.input.month - 1, user.input.day),
                  )
                : 0;

            nebulaSystem.setArchetype(
              archetype.hueShift,
              archetype.saturation,
              archetype.warmth + anniversaryWarmth,
            );
          };

          applyArchetype();
          archetypeInterval = setInterval(applyArchetype, 30_000);
        } catch {
          // graceful degradation
        }

        // Breath mirror — detect scroll rhythm and bias nebula frequency toward user cadence
        let lastScrollTime = 0;
        const scrollIntervals: number[] = [];
        const MAX_RHYTHM_SAMPLES = 8;

        handleScrollRhythm = () => {
          const now = performance.now();
          const interval = now - lastScrollTime;
          lastScrollTime = now;

          if (interval > 300 && interval < 3000) {
            scrollIntervals.push(interval);
            if (scrollIntervals.length > MAX_RHYTHM_SAMPLES) {
              scrollIntervals.shift();
            }
          }

          if (scrollIntervals.length >= 3 && engineRef.current) {
            const meanMs = scrollIntervals.reduce((a, b) => a + b, 0) / scrollIntervals.length;
            const detectedHz = 1000 / meanMs;
            const clampedHz = Math.max(0.12, Math.min(0.4, detectedHz * 0.5));
            (engineRef.current as import("./cosmos/engine/WebGLEngine").WebGLEngine & { __breathHz?: number }).__breathHz = clampedHz;
          }
        };

        window.addEventListener("scroll", handleScrollRhythm, { passive: true });

        engine.start();
      } catch (err) {
        console.warn("WebGL init failed:", err);
      }
    };

    init();

    return () => {
      disposed = true;
      if (handleScrollRhythm) {
        window.removeEventListener("scroll", handleScrollRhythm);
      }
      if (archetypeInterval) {
        clearInterval(archetypeInterval);
      }
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
        style={{ position: "fixed", inset: 0, zIndex: -2, backgroundColor: "#06041a" }}
      />
    </>
  );
}
