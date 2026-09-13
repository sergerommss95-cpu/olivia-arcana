/**
 * StarMotes.tsx — sparse drifting star-motes overlay for The Arrival's
 * night sections (Fig.0 plate, inscription).
 *
 * One <Shader> with a single FloatingParticles generator: moonstone
 * glow-puffs rising slowly (angle 90), lazy orbital wander, gentle
 * twinkle, and a cursor gust (cursorStrength 0.3) that stirs the field
 * when the reader moves. Canvas background stays transparent — this is
 * a pure overlay; whatever the parent paints shows through.
 *
 * The parent sizes/positions this component via `className` (the root
 * div defaults to absolutely filling a relatively-positioned parent).
 * `pointer-events: none` throughout — the shaders library tracks the
 * cursor on window-level listeners, so the gust works while content
 * above and below stays fully clickable. No z-index games needed.
 *
 * Robustness:
 * - prefers-reduced-motion → static transparent div, no <Shader>
 * - IntersectionObserver (160px margin) → shader unmounts offscreen
 * - SSR-safe: mounted gate, no window access during render
 * - No WebGPU (navigator.gpu absent) or shader crash → error boundary
 *   catches, renders the transparent fallback
 */

"use client";

import React, {
  Component,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Shader, FloatingParticles } from "shaders/react";

/** Moonstone — the only color these motes ever wear. */
const MOONSTONE = "#e8e9ff";

type Density = "quiet" | "rich";

const COUNT: Record<Density, number> = { quiet: 260, rich: 600 };
const COUNT_DEFAULT = 420;

interface StarMotesProps {
  /** Parent-provided sizing/positioning for the root wrapper. */
  className?: string;
  /** Mote density: 'quiet' = 260, 'rich' = 600. Omit for 420. */
  density?: Density;
}

/** Catches WebGPU/library failures and falls back to the static div. */
class ShaderBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Static fallback: transparent — the night sky simply holds still. */
function StaticFallback() {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    />
  );
}

export default function StarMotes({ className, density }: StarMotesProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [hasWebGPU, setHasWebGPU] = useState(false);

  // Client-only gates: mount flag, WebGPU feature check, reduced motion.
  useEffect(() => {
    setMounted(true);
    setHasWebGPU("gpu" in navigator);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Mount the shader only while the wrapper is (nearly) on screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const count = density ? COUNT[density] : COUNT_DEFAULT;
  const showShader = mounted && onScreen && hasWebGPU && !reducedMotion;

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {showShader ? (
        <ShaderBoundary fallback={<StaticFallback />}>
          <Shader
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            {/* Transparent canvas — no base layer; pure overlay. */}
            <FloatingParticles
              particleColor={MOONSTONE}
              shape="glow"
              count={count}
              particleSize={1.4}
              softness={0.4}
              speed={0.14}
              angle={90}
              randomness={0.4}
              twinkle={0.8}
              cursorStrength={0.55}
            />
          </Shader>
        </ShaderBoundary>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
