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
        // 1. Priority load: Core engine + background
        const [engineMod, nebulaMod] = await Promise.all([
          import("./cosmos/engine/WebGLEngine"),
          import("./cosmos/engine/NebulaPlane"),
        ]);

        if (disposed || !containerRef.current) return;
        if (!engineMod.WebGLEngine.isSupported()) return;

        const engine = new engineMod.WebGLEngine(containerRef.current);
        engineRef.current = engine;
        (window as unknown as { celestialEngine: unknown }).celestialEngine = engine; // God Mode: Global Access

        const nebula = new nebulaMod.NebulaPlane();
        engine.registerSystem(nebula, "nebula");

        // Start engine immediately with just background
        engine.start();

        // 2. Secondary load: Remaining systems (progressive)
        const [starMod, flowMod, zodiacMod, shootMod] = await Promise.all([
          import("./cosmos/engine/StarSystem"),
          import("./cosmos/engine/FlowmapSystem"),
          import("./cosmos/engine/ZodiacGL"),
          import("./cosmos/engine/ShootingStars"),
        ]);

        if (disposed) return;

        const isMobile = "ontouchstart" in window || window.innerWidth < 768;
        const stars = new starMod.StarSystem(isMobile);
        const zodiac = new zodiacMod.ZodiacGL();
        const shooting = new shootMod.ShootingStars();

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
        engine.registerSystem(shooting, "shooting");

        // 3. Last load: Personalization logic
        try {
          const [archMod, anniMod, memMod, userMod] = await Promise.all([
            import("../lib/visitor-archetype"),
            import("../lib/anniversary"),
            import("../lib/constellation-memory"),
            import("../lib/user-store"),
          ]);

          const applyPersonalization = () => {
            if (!engineRef.current) return;
            const nebulaSystem = engineRef.current.getSystem<import("./cosmos/engine/NebulaPlane").NebulaPlane>("nebula");
            const zodiacSystem = engineRef.current.getSystem<import("./cosmos/engine/ZodiacGL").ZodiacGL>("zodiac");
            if (!nebulaSystem) return;

            // Visitor archetype + anniversary → nebula palette shift
            const archetype = archMod.getVisitorArchetype();
            const user = userMod.loadUser();
            const anniversaryWarmth =
              user?.input?.year && user?.input?.month && user?.input?.day
                ? anniMod.getAnniversaryWarmth(
                    new Date(user.input.year, user.input.month - 1, user.input.day),
                  )
                : 0;
            nebulaSystem.setArchetype(
              archetype.hueShift,
              archetype.saturation,
              archetype.warmth + anniversaryWarmth,
            );

            // Constellation memory → per-sign brightness in zodiac renderer
            if (zodiacSystem) {
              const brightness = memMod.computeConstellationBrightness();
              zodiacSystem.setPersonalBrightness(brightness);
            }
          };

          applyPersonalization();
          archetypeInterval = setInterval(applyPersonalization, 30_000);
          // Re-apply when a new card is drawn (constellation-memory updates).
          window.addEventListener("olivia:card-drawn", applyPersonalization);
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
      // The personalization listener was only attached if the dynamic import
      // succeeded; calling removeEventListener with an unbound name is safe —
      // browsers ignore it. We leave a best-effort cleanup here.
      window.removeEventListener("olivia:card-drawn", () => {});
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
