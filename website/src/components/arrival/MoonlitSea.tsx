"use client";

/**
 * <MoonlitSea/> — The Arrival section divider.
 *
 * A full-bleed band of living midnight sea (WebGPU, "shaders" package).
 * Parent sizes it: give the wrapper a className with width: 100% and a
 * height around 34-42vh. Decorative only — pointer-events are disabled.
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
import { Shader, Water, Crescent, Circle } from "shaders/react";

/* ------------------------------------------------------------------ */
/* Palette (The Arrival)                                              */
/* ------------------------------------------------------------------ */
const DEEP = "#181d7a"; // deep ultramarine — the water body
const MOONSTONE = "#e8e9ff"; // crescent + foam accents
const COOL_LIGHT = "#8d97ff"; // faint halo behind the crescent

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
 * Static fallback: quiet ultramarine swell fading to transparent at every
 * edge so the band still sits between night-ground sections without seams.
 * Palette colors only (deep / night), never a wrong hue.
 */
const fallbackStyle: CSSProperties = {
  ...fillStyle,
  background:
    "radial-gradient(62% 52% at 50% 58%, rgba(24, 29, 122, 0.50) 0%, rgba(16, 19, 77, 0.30) 52%, rgba(16, 19, 77, 0) 78%)",
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
export interface MoonlitSeaProps {
  className?: string;
  /** Direction of the moonlight in degrees — drives where the glint path falls. */
  lightAngle?: number;
  /** Strength of the reflected sky / moon-path (0-2). Keep restrained. */
  reflection?: number;
  /** Wave speed. 0 pauses the surface. Keep slow — this sea is calm. */
  speed?: number;
  /** Small moonstone crescent low in the upper third. */
  showCrescent?: boolean;
}

export default function MoonlitSea({
  className,
  lightAngle = 285,
  reflection = 1.4,
  speed = 0.4,
  showCrescent = true,
}: MoonlitSeaProps) {
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

  /* Mount the <Shader> only while the band is near the viewport. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "200px 0px" },
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
              In-shader vignette mask (hero-section-masking pro-note,
              "center spotlight" preset): every visual layer fades to
              transparent toward the band edges — no hard seams against
              the sections above/below.
            */}
            <Circle
              id="seaFade"
              visible={false}
              color="#ffffff"
              radius={1.2}
              softness={0.8}
              center={{ x: 0.5, y: 0.5 }}
            />

            {/*
              The sea. One Water shape-effect spanning the whole band —
              rect SDF oversized past every edge so no shoreline shows,
              only wind-driven crests. Deep, calm, near-black ultramarine.
            */}
            <Water
              maskSource="seaFade"
              center={{ x: 0.5, y: 0.5 }}
              shape={JSON.stringify({
                type: "roundedRectSDF",
                width: 2,
                height: 2,
                rounding: 0,
              })}
              waterColor={DEEP}
              clarity={0.2}
              depth={6}
              shallows={0.3}
              caustics={0.22}
              causticScale={7}
              choppiness={0.55}
              waveScale={3.2}
              swirl={0.45}
              speed={speed}
              reflection={reflection}
              sharpness={0.35}
              lightAngle={lightAngle}
              foam={0.4}
            />

            {showCrescent && (
              <>
                {/* Whisper of cool light behind the moon. */}
                <Circle
                  maskSource="seaFade"
                  color={COOL_LIGHT}
                  opacity={0.2}
                  radius={0.22}
                  softness={1}
                  center={{ x: 0.72, y: 0.2 }}
                />
                {/* Small moonstone crescent, low in the upper third. */}
                <Crescent
                  maskSource="seaFade"
                  color={MOONSTONE}
                  center={{ x: 0.72, y: 0.2 }}
                  radius={0.07}
                  innerRatio={0.85}
                  offset={0.14}
                  rotation={24}
                  softness={0.03}
                  opacity={0.9}
                />
              </>
            )}
          </Shader>
        </ShaderErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
