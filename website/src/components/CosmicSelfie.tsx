"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useScrollProgress } from "@/hooks/useScrollProgress";

// ── Constants ──────────────────────────────────────────────────────────
type State = "idle" | "requesting" | "streaming" | "denied";

const FEATURES = [
  { icon: "\u2726", label: "AI Birth Chart", href: "/portrait" },
  { icon: "\u263D", label: "Daily Readings", href: "/daily" },
  { icon: "\u22B9", label: "Cosmic Portrait", href: "/portrait" },
];

// ── Analytics helper ───────────────────────────────────────────────────
function track(name: string, detail?: Record<string, string>) {
  window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

// ═══════════════════════════════════════════════════════════════════════
//  CosmicSelfie
// ═══════════════════════════════════════════════════════════════════════
export default function CosmicSelfie() {
  const [state, setState] = useState<State>("idle");
  const isRevealed = state === "streaming" || state === "denied";

  // Refs
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<import("./oracle/LiquidMaskEngine").LiquidMaskEngine | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const viewedRef = useRef(false);

  // Custom cursor refs (desktop only)
  const haloRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Scroll entrance
  const { ref: scrollRef, progress } = useScrollProgress<HTMLElement>();

  // Merge scroll ref into section ref
  const setSectionRef = useCallback(
    (node: HTMLElement | null) => {
      sectionRef.current = node;
      (scrollRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [scrollRef],
  );

  // ── Detect mobile ──
  useEffect(() => {
    setIsMobile("ontouchstart" in window || window.innerWidth < 768);
  }, []);

  // ── Viewport tracking (analytics) ──
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          track("cosmic_selfie_viewed");
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Create engine (only after camera resolves or is denied) ──
  const createEngine = useCallback(
    async (opts: { video?: HTMLVideoElement }) => {
      const el = containerRef.current;
      if (!el) return;
      // Clear any previous children from engine container
      el.innerHTML = "";

      const { LiquidMaskEngine } = await import("./oracle/LiquidMaskEngine");
      const engine = new LiquidMaskEngine(el, {
        baseImage: "/cosmic-selfie/nebula.png",
        ...(opts.video
          ? { revealVideo: opts.video, mirror: true }
          : { revealImage: "/liquid-mask/reveal.png" }),
        maskRadius: isMobile ? 0.32 : 0.26,
        feather: 0.09,
        lerpFactor: 0.09,
      });
      engine.start();
      engineRef.current = engine;
    },
    [isMobile],
  );

  // ── Camera flow ──
  const startCamera = useCallback(async () => {
    track("cosmic_selfie_reveal_clicked");

    if (!navigator.mediaDevices?.getUserMedia) {
      track("cosmic_selfie_camera_denied", { reason: "unsupported" });
      setState("denied");
      await createEngine({});
      return;
    }

    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      videoRef.current = video;

      // Listen for track ended (e.g. user revokes in browser settings)
      const track0 = stream.getVideoTracks()[0];
      if (track0) {
        track0.addEventListener("ended", () => {
          setState("denied");
        });
      }

      track("cosmic_selfie_camera_granted");
      setState("streaming");
      await createEngine({ video });
    } catch {
      track("cosmic_selfie_camera_denied", { reason: "denied" });
      setState("denied");
      await createEngine({});
    }
  }, [createEngine]);

  // ── Pointer events (when engine exists) ──
  useEffect(() => {
    if (!isRevealed) return;
    const el = containerRef.current;
    if (!el) return;

    let lastX = 0;
    let lastY = 0;
    let velocity = 0;

    const update = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const nx = localX / rect.width;
      const ny = localY / rect.height;
      engineRef.current?.updatePointer(nx, ny);

      const dx = clientX - lastX;
      const dy = clientY - lastY;
      velocity = Math.min(Math.sqrt(dx * dx + dy * dy), 40) / 40;
      lastX = clientX;
      lastY = clientY;

      // Multi-layer cursor
      if (coreRef.current) {
        coreRef.current.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0) scale(${1 + velocity * 0.5})`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0) scale(${1 + velocity * 1.2})`;
      }
    };

    const onMouse = (e: MouseEvent) => update(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) update(t.clientX, t.clientY);
    };
    const onEnter = () => engineRef.current?.setPresent(true);
    const onLeave = () => engineRef.current?.setPresent(false);

    el.addEventListener("mousemove", onMouse);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchstart", onTouch, { passive: true });
    el.addEventListener("touchmove", onTouch, { passive: true });
    el.addEventListener("touchstart", onEnter as EventListener, { passive: true });
    el.addEventListener("touchend", onLeave as EventListener, { passive: true });

    return () => {
      el.removeEventListener("mousemove", onMouse);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("touchstart", onEnter as EventListener);
      el.removeEventListener("touchend", onLeave as EventListener);
    };
  }, [isRevealed]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      engineRef.current?.dispose();
    };
  }, []);

  // ── Scroll entrance ──
  const entrance = Math.min(progress / 0.35, 1); // ramp over first 35% of scroll
  const entranceStyle: React.CSSProperties = {
    opacity: entrance,
    transform: `scale(${0.9 + entrance * 0.1})`,
    transition: "transform 0.1s linear, opacity 0.1s linear",
  };

  // ── Headline ──
  const headline = isRevealed
    ? "This is how the cosmos sees you."
    : "The stars already know your face.";

  return (
    <section
      ref={setSectionRef}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "6rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2.5rem",
        background: "var(--c-void, #06041a)",
      }}
    >
      {/* ── Rift edge glow (top) ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,175,55,0.4) 30%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0.4) 70%, transparent)",
          boxShadow: "0 0 20px 2px rgba(212,175,55,0.15)",
        }}
      />

      {/* ── Main content with scroll entrance ── */}
      <div style={entranceStyle}>
        {/* ── Headline ── */}
        <h2
          aria-live="polite"
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 400,
            color: "var(--c-text-primary, rgba(240,236,255,0.95))",
            textAlign: "center",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            marginBottom: "2rem",
          }}
        >
          {headline}
        </h2>

        {/* ── Orb wrapper ── */}
        <div
          style={{
            position: "relative",
            width: "min(420px, 80vw)",
            aspectRatio: "1",
            margin: "0 auto",
          }}
        >
          {/* Aura glow behind the orb */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "130%",
              height: "130%",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(130,90,220,0.18) 0%, rgba(212,175,55,0.08) 40%, transparent 70%)",
              animation: "oracle-aura-breathe 4s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* The orb */}
          <div
            className="cosmic-selfie-orb"
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              zIndex: 1,
            }}
          >
            {/* Idle / requesting: static nebula image */}
            {!isRevealed && (
              <>
                <img
                  src="/cosmic-selfie/nebula.png"
                  alt="Cosmic nebula void"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Shimmer overlay during requesting */}
                {state === "requesting" && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, rgba(160,122,224,0.08) 0%, rgba(212,175,55,0.06) 50%, rgba(160,122,224,0.08) 100%)",
                      animation: "shimmer 1.8s ease-in-out infinite alternate",
                    }}
                  />
                )}
              </>
            )}

            {/* Streaming / denied: engine container */}
            {isRevealed && (
              <div
                ref={containerRef}
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: isMobile ? "default" : "none",
                }}
              >
                {/* 3-layer custom cursor (desktop only) */}
                {!isMobile && (
                  <>
                    <div
                      ref={haloRef}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle, rgba(160,122,224,0.12) 0%, transparent 70%)",
                        pointerEvents: "none",
                        zIndex: 9,
                        transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
                        willChange: "transform",
                        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                    <div
                      ref={ringRef}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "1px solid rgba(212, 175, 55, 0.35)",
                        pointerEvents: "none",
                        zIndex: 10,
                        transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
                        willChange: "transform",
                        transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                    <div
                      ref={coreRef}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "rgba(255, 240, 200, 0.95)",
                        boxShadow:
                          "0 0 12px 3px rgba(255, 215, 130, 0.8), 0 0 30px 6px rgba(180, 160, 220, 0.25)",
                        pointerEvents: "none",
                        zIndex: 11,
                        mixBlendMode: "screen",
                        transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
                        willChange: "transform",
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Action area beneath orb ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {/* Idle / requesting: reveal button */}
          {!isRevealed && (
            <MagneticButton
              variant="glass"
              size="lg"
              onClick={startCamera}
              disabled={state === "requesting"}
            >
              {state === "requesting" ? "Summoning..." : "Reveal Yourself"}
            </MagneticButton>
          )}

          {/* Streaming / denied: feature pills + social proof + CTA */}
          {isRevealed && (
            <>
              {/* Privacy text (streaming only) */}
              {state === "streaming" && (
                <p
                  style={{
                    fontFamily: "var(--font-body, 'Inter', sans-serif)",
                    fontSize: "0.75rem",
                    color: "var(--c-text-muted, rgba(155,145,190,0.60))",
                    letterSpacing: "0.04em",
                    textAlign: "center",
                  }}
                >
                  Camera is live &mdash; nothing is recorded
                </p>
              )}

              {/* Feature pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "0.75rem",
                }}
              >
                {FEATURES.map((f) => (
                  <a
                    key={f.label}
                    href={f.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 1rem",
                      borderRadius: "100px",
                      border: "1px solid var(--c-border, rgba(200,185,255,0.10))",
                      background: "var(--c-surface, rgba(255,255,255,0.04))",
                      color: "var(--c-text-mid, rgba(196,185,228,0.80))",
                      fontFamily: "var(--font-body, 'Inter', sans-serif)",
                      fontSize: "0.8rem",
                      textDecoration: "none",
                      transition: "border-color 0.3s ease, color 0.3s ease",
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{f.icon}</span>
                    {f.label}
                  </a>
                ))}
              </div>

              {/* Social proof */}
              <p
                style={{
                  fontFamily: "var(--font-body, 'Inter', sans-serif)",
                  fontSize: "0.8rem",
                  color: "var(--c-text-muted, rgba(155,145,190,0.60))",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                Trusted by{" "}
                <AnimatedCounter
                  value={12400}
                  suffix="+"
                  duration={2200}
                  style={{ color: "var(--c-text-primary, rgba(240,236,255,0.95))", fontWeight: 600 }}
                />{" "}
                seekers{" "}
                <span style={{ opacity: 0.4 }}>&middot;</span>{" "}
                <AnimatedCounter
                  value={4.9}
                  decimals={1}
                  duration={1800}
                  delay={200}
                  style={{ color: "var(--c-text-primary, rgba(240,236,255,0.95))", fontWeight: 600 }}
                />
                <span style={{ color: "rgba(212,175,55,0.9)" }}>&starf;</span> rating
              </p>

              {/* Gold CTA */}
              <MagneticButton
                variant="gold"
                size="lg"
                href="/portrait"
                onClick={() => track("cosmic_selfie_cta_clicked", { destination: "/portrait" })}
              >
                Get Your Cosmic Portrait
              </MagneticButton>
            </>
          )}
        </div>
      </div>

      {/* ── Rift edge glow (bottom) ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,175,55,0.4) 30%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0.4) 70%, transparent)",
          boxShadow: "0 0 20px 2px rgba(212,175,55,0.15)",
        }}
      />

      {/* ── Inline shimmer keyframe ── */}
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </section>
  );
}
