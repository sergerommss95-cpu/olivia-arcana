"use client";

/**
 * <CrescentSeal/> — the moon-seal rite above the site footer (The Arrival).
 *
 * A dark crescent whose edges leak light: one Irradiance shape-effect with a
 * crescentSDF silhouette as a near-black occluder, struck by two point lights
 * — gilt on one side, cool periwinkle on the other. The lights breathe on a
 * slow (~40s) cycle via the library's auto-animate prop drivers, so the seal
 * never sits perfectly still and never strobes.
 *
 * Parent sizes it (~220px square, centered). Decorative only — pointer-events
 * are disabled; no cursor interaction.
 *
 * Robustness:
 * - SSR-safe (mounted gate, no window access during render)
 * - prefers-reduced-motion -> static gradient fallback, no <Shader>
 * - IntersectionObserver -> <Shader> mounts only near/on screen
 * - navigator.gpu feature check + error boundary -> static fallback
 */

import React, {
  Component,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Shader, Irradiance } from "shaders/react";

/* ------------------------------------------------------------------ */
/* Palette (The Arrival)                                              */
/* ------------------------------------------------------------------ */
const ABYSS = "#0a0d38"; // the crescent body — near-black occluder
const GILT = "#e0b768"; // the one warm light
const COOL_LIGHT = "#8d97ff"; // periwinkle counter-light

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */
const rootStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  pointerEvents: "none",
};

const fillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

/**
 * Static fallback: the seal as a plain layered gradient — dark abyss core
 * with a faint gilt breath on one side and a cooler one on the other,
 * transparent everywhere else. Palette colors only, no motion.
 */
const fallbackStyle: CSSProperties = {
  ...fillStyle,
  background: [
    "radial-gradient(32% 32% at 32% 42%, rgba(224, 183, 104, 0.14) 0%, rgba(224, 183, 104, 0) 72%)",
    "radial-gradient(36% 36% at 72% 60%, rgba(141, 151, 255, 0.12) 0%, rgba(141, 151, 255, 0) 72%)",
    "radial-gradient(circle at 50% 50%, rgba(10, 13, 56, 0.92) 0%, rgba(10, 13, 56, 0.85) 30%, rgba(10, 13, 56, 0) 47%)",
  ].join(", "),
};

/* ------------------------------------------------------------------ */
/* Error boundary — WebGPU/library failure -> static fallback         */
/* ------------------------------------------------------------------ */
interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

class ShaderErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export interface CrescentSealProps {
  className?: string;
  /** Strength of the gilt light (default 2.6). */
  giltIntensity?: number;
  /** Strength of the periwinkle light (default 1.6). */
  periIntensity?: number;
  /** How far the spilled light is gathered, relative to the shape (default 2.2 — moderate). */
  reach?: number;
  /** Slow ~40s light breathing. Set false to hold the lights perfectly still. */
  breathing?: boolean;
}

export default function CrescentSeal({
  className,
  giltIntensity = 3.6,
  periIntensity = 2.2,
  reach = 3.2,
  breathing = true,
}: CrescentSealProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webgpuOk, setWebgpuOk] = useState(false);

  /* Mount gate + capability checks (client only). */
  useEffect(() => {
    setMounted(true);
    setWebgpuOk("gpu" in navigator && !!(navigator as { gpu?: unknown }).gpu);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Mount the <Shader> only while the seal is near the viewport. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "160px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showShader = mounted && inView && webgpuOk && !reducedMotion;
  const fallback = <div style={fallbackStyle} />;

  return (
    <div ref={rootRef} className={className} style={rootStyle} aria-hidden="true">
      {showShader ? (
        <ShaderErrorBoundary fallback={fallback}>
          <Shader style={fillStyle}>
            {/*
              The rite. One Irradiance shape-effect, front and center
              (shape-effects-placement pro-note): a crescentSDF silhouette
              as a near-black occluder on the transparent canvas
              (composition pro-note — no base layer, the footer ground
              shows through). Two lights either side; cast shadows keep
              the concave pocket of the crescent dark, so light only
              leaks around the limbs.

              The seal breathes via the library's auto-animate drivers
              (dynamic-prop-mapping pro-note): light positions in the
              `lights` list accept only cursor drivers, so the time-based
              drift lives on the driver-enabled light-geometry props —
              lightHeight (the lights settle and rise above the plane)
              and lightRange (their throw swells and recedes). Periods
              ~40s and ~53s, deliberately out of phase so the breath
              slowly evolves and never loops visibly. Nothing strobes.
            */}
            <Irradiance
              center={{ x: 0.5, y: 0.5 }}
              shape={JSON.stringify({
                type: "crescentSDF",
                radius: 0.24,
                innerRatio: 0.82,
                offset: 0.16,
                rotation: 24,
              })}
              bodyColor={ABYSS}
              bodyLight={0.3}
              bevelWidth={0.012}
              edgeSoftness={0.02}
              lights={[
                { position: { x: 0.2, y: 0.42 }, color: GILT, intensity: giltIntensity },
                { position: { x: 0.82, y: 0.6 }, color: COOL_LIGHT, intensity: periIntensity },
              ]}
              reach={reach}
              core={0.9}
              wrap={0.12}
              shadows
              shadowSoftness={0.25}
              lightHeight={
                breathing
                  ? {
                      type: "auto-animate",
                      mode: "ping-pong",
                      outputMin: 0.42,
                      outputMax: 0.64,
                      speed: 0.125, // ~40s per cycle (base rate ~5s at speed 1)
                      easing: "sine",
                    }
                  : 0.5
              }
              lightRange={
                breathing
                  ? {
                      type: "auto-animate",
                      mode: "ping-pong",
                      outputMin: 1.05,
                      outputMax: 1.35,
                      speed: 0.095, // ~53s — out of phase with lightHeight
                      easing: "sine",
                    }
                  : 1.2
              }
            />
          </Shader>
        </ShaderErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
