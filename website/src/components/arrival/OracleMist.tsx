/**
 * OracleMist.tsx — cursor-parted table-mist for the oracle dealing table.
 *
 * A full-area SmokeFlow layer (shaders/react, WebGPU): the reader's hand
 * stirs pale mist (#b7bce9) that ages into lapis (#20279b), rises lazily
 * (slightly negative gravity) and slowly heals (~0.25 dissipation).
 * Renders on a transparent canvas so the page's abyss ground shows through.
 *
 * The PARENT sizes and positions the wrapper (e.g. `fixed inset-0 z-0`
 * behind the cards). Wrapper stays `pointer-events: none` — SmokeFlow
 * tracks the cursor via window-level mousemove/touchmove listeners (not
 * canvas events; verified in shaders dist), so the mist still parts under
 * the cursor while cards layered above remain fully clickable.
 *
 * Robustness: SSR-gated (mounted state), prefers-reduced-motion → static
 * gradient (no <Shader>), WebGPU checked via getWebGPUSupport() +
 * onUnavailable → same static fallback, and the <Shader> only mounts
 * while the wrapper is on screen (IntersectionObserver, 160px margin).
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Shader, SmokeFlow, getWebGPUSupport } from "shaders/react";

/** The Arrival tokens — cool hues only. */
const MIST = "#b7bce9"; // fresh smoke
const LAPIS = "#20279b"; // aged smoke

/**
 * Static fallback: a faint pool of table-mist along the bottom edge,
 * transparent everywhere else so the abyss ground reads through.
 * Used for reduced motion, missing WebGPU, offscreen, and pre-mount.
 */
const FALLBACK_BACKGROUND =
  "radial-gradient(120% 60% at 50% 100%, rgba(32,39,155,0.26) 0%, rgba(24,29,122,0.14) 42%, rgba(16,19,77,0.06) 66%, transparent 86%)";

interface OracleMistProps {
  className?: string;
}

export default function OracleMist({ className }: OracleMistProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [gpuOk, setGpuOk] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);

  // SSR gate — nothing browser-dependent runs during render.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Honor prefers-reduced-motion, live.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // WebGPU feature check (also catches blocklisted drivers; cached per page).
  useEffect(() => {
    let cancelled = false;
    getWebGPUSupport().then(({ supported }: { supported: boolean }) => {
      if (!cancelled) setGpuOk(supported);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mount the shader only while the wrapper is (nearly) on screen.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const showShader = mounted && !reducedMotion && gpuOk === true && inView;

  return (
    <div
      ref={wrapperRef}
      className={className}
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      {showShader ? (
        <Shader
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          onUnavailable={() => setGpuOk(false)}
        >
          {/* Transparent background is deliberate (composition pro-note):
              the page's abyss ground is the base; the mist floats over it. */}
          <SmokeFlow
            colorA={MIST}
            colorB={LAPIS}
            intensity={1.2}
            emitRadius={0.12}
            momentum={22}
            dissipation={0.16}
            detail={26}
            gravity={-0.6}
            colorDecay={0.4}
            colorSpace="oklab"
          />
        </Shader>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: FALLBACK_BACKGROUND,
          }}
        />
      )}
    </div>
  );
}
