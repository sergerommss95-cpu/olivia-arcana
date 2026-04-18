# Cosmic Selfie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the OraclePreview homepage section with a "Cosmic Selfie" experience where the user's live webcam feed is revealed beneath a cosmic nebula via the existing liquid mask WebGL engine.

**Architecture:** Extend `LiquidMaskEngine` with a `revealVideo` option that uploads a `<video>` element as a WebGL texture each frame. Build a new `CosmicSelfie.tsx` component that manages a 4-state machine (idle → requesting → streaming → denied), instantiates the engine directly (not via LiquidMaskCanvas), and handles webcam lifecycle. Swap it into the homepage.

**Tech Stack:** WebGL (existing engine), getUserMedia API, Next.js 16, React 19

**Spec:** `docs/superpowers/specs/2026-04-13-cosmic-selfie-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/oracle/LiquidMaskEngine.ts` | Modify | Add `revealVideo` option, per-frame video texture upload, `uMirror` uniform for U-flip |
| `src/components/CosmicSelfie.tsx` | Create | Main component: state machine, webcam lifecycle, engine instantiation, pointer events, cursor layers, UI |
| `src/components/OraclePreview.tsx` | Delete | Replaced by CosmicSelfie |
| `src/app/page.tsx` | Modify | Swap import OraclePreview → CosmicSelfie |
| `src/app/globals.css` | Modify | Remove `.oracle-circular-canvas` hack, add `.cosmic-selfie-orb` mask-image |
| `public/cosmic-selfie/nebula.png` | Create | Base layer cosmic void image |

---

### Task 1: Extend LiquidMaskEngine with video texture support

**Files:**
- Modify: `src/components/oracle/LiquidMaskEngine.ts`

This task adds video texture support while keeping all existing static-image behavior intact. The `/oracle` page continues to work unchanged.

- [ ] **Step 1: Add `uMirror` uniform to the fragment shader**

In the `FRAG` string, add a uniform declaration and use it when sampling the reveal texture. Find this line:

```glsl
uniform float uPresence;      // 0 = cursor outside, 1 = inside (animated)
```

Add after it:

```glsl
uniform float uMirror;        // 1.0 = flip reveal U for selfie mirror, 0.0 = normal
```

Then find these lines where the reveal texture is sampled:

```glsl
vec4 reveal = texture2D(uReveal, uv);
```

Replace with:

```glsl
vec2 revealUv = uMirror > 0.5 ? vec2(1.0 - uv.x, uv.y) : uv;
vec4 reveal = texture2D(uReveal, revealUv);
```

Also update the chromatic aberration sampling (two lines that sample uReveal) to use `revealUv` instead of `uv`:

```glsl
float rShift = texture2D(uReveal, revealUv + caDir * caAmount).r;
float bShift = texture2D(uReveal, revealUv - caDir * caAmount).b;
```

- [ ] **Step 2: Update the options interface**

Replace the existing interface:

```typescript
export interface LiquidMaskOptions {
  baseImage: string
  revealImage: string
  maskRadius?: number
  feather?: number
  lerpFactor?: number
  onReady?: () => void
}
```

With:

```typescript
export interface LiquidMaskOptions {
  baseImage: string
  revealImage?: string
  revealVideo?: HTMLVideoElement
  mirror?: boolean              // flip reveal U for selfie view (default: false)
  maskRadius?: number
  feather?: number
  lerpFactor?: number
  onReady?: () => void
}
```

- [ ] **Step 3: Update the constructor to handle video textures**

In the constructor, after the uniform location setup (`for (const name of [...])`), add `'uMirror'` to the uniform names array:

```typescript
for (const name of [
  'uBase','uReveal','uMouse','uTime','uAspect',
  'uRadius','uFeather','uVelocity','uPresence','uMirror'
]) {
```

Then replace the texture loading block:

```typescript
let loaded = 0
const check = () => { if (++loaded >= 2) this.onReady?.() }
this.loadTexture(opts.baseImage, 0, check)
this.loadTexture(opts.revealImage, 1, check)
gl.uniform1i(this.locs.uBase, 0)
gl.uniform1i(this.locs.uReveal, 1)
```

With:

```typescript
// Store video ref and mirror flag
this.revealVideo = opts.revealVideo ?? null
this.mirror = opts.mirror ?? false

// Load textures
let loaded = 0
const total = opts.revealVideo ? 1 : 2  // video doesn't need async load
const check = () => { if (++loaded >= total) this.onReady?.() }

this.loadTexture(opts.baseImage, 0, check)

if (opts.revealVideo) {
  // Create texture for video — will be updated each frame
  this.revealTex = this.createVideoTexture(1)
  // Already "loaded"
} else if (opts.revealImage) {
  this.loadTexture(opts.revealImage, 1, check)
} else {
  throw new Error('LiquidMaskEngine: provide revealImage or revealVideo')
}

gl.uniform1i(this.locs.uBase, 0)
gl.uniform1i(this.locs.uReveal, 1)
gl.uniform1f(this.locs.uMirror!, this.mirror ? 1.0 : 0.0)
```

- [ ] **Step 4: Add private fields and helper methods**

Add to the private fields section (after `private onReady?`):

```typescript
private revealVideo: HTMLVideoElement | null
private revealTex: WebGLTexture | null = null
private mirror: boolean
```

Add a new method after `loadTexture`:

```typescript
private createVideoTexture(unit: number): WebGLTexture {
  const gl = this.gl
  const tex = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  // Start with a 1x1 placeholder
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([10, 8, 20, 255]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  return tex
}
```

- [ ] **Step 5: Update the render loop to upload video frames**

In the `loop` method, add this block right before `gl.drawArrays(...)`:

```typescript
// Upload video frame as texture each frame
if (this.revealVideo && this.revealTex && this.revealVideo.readyState >= 2) {
  const gl = this.gl
  gl.activeTexture(gl.TEXTURE0 + 1)
  gl.bindTexture(gl.TEXTURE_2D, this.revealTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.revealVideo)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
}
```

- [ ] **Step 6: Run type check to verify no regressions**

Run: `npx tsc --noEmit` (or `npm run build` if available)
Expected: No type errors. The existing `LiquidMaskCanvas.tsx` passes `revealImage` as a string and should still compile since the field is now optional but still accepted. The `/oracle` page should also be tested visually: open `http://localhost:3333/oracle` — the marble bust liquid mask effect works exactly as before.

- [ ] **Step 7: Commit**

```bash
git add src/components/oracle/LiquidMaskEngine.ts
git commit -m "feat(engine): add video texture + mirror support to LiquidMaskEngine"
```

---

### Task 2: Generate the nebula base image

**Files:**
- Create: `public/cosmic-selfie/nebula.png`

- [ ] **Step 1: Generate the nebula image**

Use Vertex AI (existing project credentials) or find a suitable cosmic void image. Requirements:
- Square (1024x1024 or similar)
- Swirling cosmic gas / nebula
- Darker in the center (where the face will be), brighter at edges
- Deep void colors: indigo, purple, touches of gold
- Should look like a portal surface, not a flat photo of space

If using the existing Vertex AI setup from the liquid mask handoff:

```bash
cd /Users/macbookpro/olivia-arcana
# Use the existing image generation script or generate manually
```

Alternatively, crop/process an existing nebula image from the starfield assets.

- [ ] **Step 2: Place the file**

```bash
mkdir -p public/cosmic-selfie
# Copy/move the generated image
cp <generated-image> public/cosmic-selfie/nebula.png
```

Verify it's accessible at `http://localhost:3333/cosmic-selfie/nebula.png`.

- [ ] **Step 3: Commit**

```bash
git add public/cosmic-selfie/nebula.png
git commit -m "asset: add cosmic nebula base image for selfie section"
```

---

### Task 3: Add CSS for the cosmic selfie orb

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remove the old `.oracle-circular-canvas` hack**

Find and delete this block:

```css
/* Oracle circular canvas override */
.oracle-circular-canvas > div {
  border-radius: 50% !important;
  border: none !important;
  background: transparent !important;
}
.oracle-circular-canvas > div,
.oracle-circular-canvas canvas {
  -webkit-mask-image: radial-gradient(circle at 50% 50%,
    black 0%, black 55%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.15) 85%, transparent 100%) !important;
  mask-image: radial-gradient(circle at 50% 50%,
    black 0%, black 55%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.15) 85%, transparent 100%) !important;
}
```

- [ ] **Step 2: Add the cosmic selfie orb styles**

Add in the Oracle Preview CSS section:

```css
/* Cosmic Selfie orb — circular mask-image fade */
.cosmic-selfie-orb {
  border-radius: 50%;
  overflow: hidden;
}
.cosmic-selfie-orb canvas,
.cosmic-selfie-orb img {
  -webkit-mask-image: radial-gradient(circle at 50% 50%,
    black 0%, black 50%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.2) 82%, transparent 100%);
  mask-image: radial-gradient(circle at 50% 50%,
    black 0%, black 50%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.2) 82%, transparent 100%);
}
/* Engine container inside the orb */
.cosmic-selfie-orb > div {
  border-radius: 50% !important;
  border: none !important;
  background: transparent !important;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add cosmic-selfie-orb CSS, remove oracle-circular-canvas hack"
```

---

### Task 4: Build the CosmicSelfie component

**Files:**
- Create: `src/components/CosmicSelfie.tsx`

This is the main component. It manages the webcam lifecycle, instantiates the engine directly, handles pointer events, and renders the full UI with state transitions.

- [ ] **Step 1: Create the component file**

Write `src/components/CosmicSelfie.tsx` with the following structure:

```typescript
"use client";

import { useEffect, useRef, useState, useMemo, type CSSProperties } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";

type SelfieState = "idle" | "requesting" | "streaming" | "denied";

const FEATURES = [
  { icon: "\u2726", label: "AI Birth Chart", href: "/portrait" },
  { icon: "\u263D", label: "Daily Readings", href: "/daily" },
  { icon: "\u22B9", label: "Cosmic Portrait", href: "/portrait" },
];

export default function CosmicSelfie() {
  const { ref, progress } = useScrollProgress("200px", "0px");
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<import("./oracle/LiquidMaskEngine").LiquidMaskEngine | null>(null);

  const [state, setState] = useState<SelfieState>("idle");
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Cursor refs (desktop only)
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Scroll-driven entrance (simple opacity + scale)
  const e = useMemo(() => {
    if (reducedMotion) return 1;
    return 1 - Math.pow(2, -10 * progress);
  }, [progress, reducedMotion]);
  const entrance = Math.max(0, Math.min(1, e * 2.5)); // 0→1 over first 40% of scroll

  // ── Webcam start ──
  const startCamera = async () => {
    // Pre-check: is getUserMedia available?
    if (!navigator.mediaDevices?.getUserMedia) {
      window.dispatchEvent(new CustomEvent("cosmic_selfie_camera_denied", {
        detail: { reason: "unsupported" },
      }));
      setState("denied");
      // Create engine with static fallback (same as denied path below)
      try {
        const { LiquidMaskEngine } = await import("./oracle/LiquidMaskEngine");
        if (!containerRef.current) return;
        const engine = new LiquidMaskEngine(containerRef.current, {
          baseImage: "/cosmic-selfie/nebula.png",
          revealImage: "/liquid-mask/reveal.png",
          maskRadius: isMobile ? 0.32 : 0.26,
          feather: 0.09,
          lerpFactor: 0.09,
        });
        engine.start();
        engineRef.current = engine;
      } catch { /* WebGL not supported */ }
      return;
    }

    setState("requesting");

    // Analytics
    window.dispatchEvent(new CustomEvent("cosmic_selfie_reveal_clicked"));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("No video element");
      video.srcObject = stream;
      await video.play();

      // Dynamically import engine (avoid SSR)
      const { LiquidMaskEngine } = await import("./oracle/LiquidMaskEngine");

      if (!containerRef.current) throw new Error("No container");

      const engine = new LiquidMaskEngine(containerRef.current, {
        baseImage: "/cosmic-selfie/nebula.png",
        revealVideo: video,
        mirror: true,
        maskRadius: isMobile ? 0.32 : 0.26,
        feather: 0.09,
        lerpFactor: 0.09,
        onReady: () => {}, // textures already available
      });
      engine.start();
      engineRef.current = engine;
      setState("streaming");

      // Analytics
      window.dispatchEvent(new CustomEvent("cosmic_selfie_camera_granted"));

      // Handle camera disconnection
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setState("denied");
      });
    } catch {
      // Permission denied or no camera — fall back to static
      window.dispatchEvent(new CustomEvent("cosmic_selfie_camera_denied", {
        detail: { reason: "denied" },
      }));

      try {
        const { LiquidMaskEngine } = await import("./oracle/LiquidMaskEngine");
        if (!containerRef.current) return;
        const engine = new LiquidMaskEngine(containerRef.current, {
          baseImage: "/cosmic-selfie/nebula.png",
          revealImage: "/liquid-mask/reveal.png",
          maskRadius: isMobile ? 0.32 : 0.26,
          feather: 0.09,
          lerpFactor: 0.09,
        });
        engine.start();
        engineRef.current = engine;
      } catch {
        // WebGL not supported at all — stay in denied with static image
      }
      setState("denied");
    }
  };

  // ── Pointer events (attached when engine is running) ──
  useEffect(() => {
    const el = containerRef.current;
    const engine = engineRef.current;
    if (!el || !engine) return;

    let lastX = 0, lastY = 0, velocity = 0;

    const update = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const nx = localX / rect.width;
      const ny = localY / rect.height;
      engine.updatePointer(nx, ny);

      const dx = clientX - lastX;
      const dy = clientY - lastY;
      velocity = Math.min(Math.sqrt(dx * dx + dy * dy), 40) / 40;
      lastX = clientX;
      lastY = clientY;

      // Cursor layers (desktop)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0) scale(${1 + velocity * 0.5})`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0) scale(${1 + velocity * 1.2})`;
      }
    };

    const onMouse = (e: MouseEvent) => update(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) update(t.clientX, t.clientY); };
    const onEnter = () => engine.setPresent(true);
    const onLeave = () => engine.setPresent(false);

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
  }, [state]); // Re-attach when state changes (engine created)

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      engineRef.current?.dispose();
    };
  }, []);

  // ── Viewport analytics (fire once) ──
  const viewedRef = useRef(false);
  useEffect(() => {
    if (entrance > 0.5 && !viewedRef.current) {
      viewedRef.current = true;
      window.dispatchEvent(new CustomEvent("cosmic_selfie_viewed", {
        detail: { section: "cosmic-selfie" },
      }));
    }
  }, [entrance]);

  const isRevealed = state === "streaming" || state === "denied";

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        padding: isMobile ? "4rem 1rem" : "6rem 2rem",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isMobile ? "1.25rem" : "1.5rem",
        isolation: "isolate",
        opacity: entrance,
        transform: `scale(${0.9 + entrance * 0.1})`,
        willChange: entrance < 0.99 ? "transform, opacity" : "auto",
      }}
    >
      {/* ── Rift edge glow (top + bottom) ── */}
      {[false, true].map((isBottom) => (
        <div
          key={isBottom ? "b" : "t"}
          style={{
            position: "absolute",
            [isBottom ? "bottom" : "top"]: -1,
            left: 0, right: 0, height: 100,
            background: `linear-gradient(${isBottom ? "to top" : "to bottom"},
              transparent 0%, rgba(160,122,224,0.03) 35%,
              rgba(212,175,55,0.10) 49%, rgba(160,122,224,0.06) 51%,
              transparent 100%)`,
            pointerEvents: "none", zIndex: 1,
          }}
        >
          <div style={{
            position: "absolute", top: "50%", left: "8%", right: "8%", height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.35) 20%, rgba(240,236,255,0.55) 50%, rgba(212,175,55,0.35) 80%, transparent 100%)",
            boxShadow: "0 0 18px rgba(212,175,55,0.25), 0 0 50px rgba(160,122,224,0.12)",
          }} />
        </div>
      ))}

      {/* ── Aura glow behind the orb ── */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        width: isMobile ? 400 : 600, height: isMobile ? 400 : 600,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(160,122,224,0.07) 0%, rgba(212,175,55,0.035) 35%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
        animation: "oracle-aura-breathe 7s ease-in-out infinite",
      }} />

      {/* ── Headline ── */}
      <div
        style={{
          position: "relative", zIndex: 6, textAlign: "center",
          transition: "opacity 0.4s ease",
        }}
        aria-live="polite"
      >
        <p style={{
          fontFamily: "var(--font-accent)",
          fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)",
          fontWeight: 300, fontStyle: "italic", lineHeight: 1.7,
          color: "var(--c-text-mid)",
        }}>
          {isRevealed
            ? "This is how the cosmos sees you."
            : "The stars already know your face."}
        </p>
      </div>

      {/* ── Hidden video element for webcam ── */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: "none" }}
      />

      {/* ── The Orb ── */}
      <div
        className="cosmic-selfie-orb"
        style={{
          position: "relative", zIndex: 4,
          maxWidth: isMobile ? "80vw" : 420, width: "100%", aspectRatio: "1 / 1",
        }}
      >
        {/* Engine mounts here when active */}
        <div
          ref={containerRef}
          style={{
            width: "100%", height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            cursor: isRevealed ? "none" : "default",
            position: "relative",
          }}
        >
          {/* Idle state: show static nebula image */}
          {state === "idle" && (
            <img
              src="/cosmic-selfie/nebula.png"
              alt="Cosmic void"
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          )}

          {/* Requesting state: nebula with shimmer overlay */}
          {state === "requesting" && (
            <>
              <img
                src="/cosmic-selfie/nebula.png"
                alt="Summoning..."
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(160,122,224,0.1) 0%, transparent 60%)",
                animation: "oracle-aura-breathe 2s ease-in-out infinite",
              }} />
            </>
          )}
        </div>

        {/* Outer glow ring */}
        {isRevealed && (
          <div style={{
            position: "absolute", inset: -3, borderRadius: "50%", pointerEvents: "none",
            animation: "oracle-rim-pulse 6s ease-in-out infinite",
          }} />
        )}

        {/* 3-layer cursor (desktop, when engine active) */}
        {!isMobile && isRevealed && (
          <>
            <div ref={haloRef} style={{
              position: "absolute", top: 0, left: 0, width: 80, height: 80,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(160,122,224,0.12) 0%, transparent 70%)",
              pointerEvents: "none", zIndex: 9,
              transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
              willChange: "transform",
              transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
            <div ref={ringRef} style={{
              position: "absolute", top: 0, left: 0, width: 36, height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              pointerEvents: "none", zIndex: 10,
              transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
              willChange: "transform",
              transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
            <div ref={cursorRef} style={{
              position: "absolute", top: 0, left: 0, width: 8, height: 8,
              borderRadius: "50%",
              background: "rgba(255, 240, 200, 0.95)",
              boxShadow: "0 0 12px 3px rgba(255, 215, 130, 0.8), 0 0 30px 6px rgba(180, 160, 220, 0.25)",
              pointerEvents: "none", zIndex: 11,
              mixBlendMode: "screen" as const,
              transform: "translate(-50%, -50%) translate3d(-200px, -200px, 0)",
              willChange: "transform",
            }} />
          </>
        )}
      </div>

      {/* ── Action area ── */}
      <div style={{
        position: "relative", zIndex: 6,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "1rem",
      }}>
        {/* Idle / Requesting: "Reveal Yourself" button */}
        {(state === "idle" || state === "requesting") && (
          <MagneticButton
            onClick={startCamera}
            variant="glass"
            size="lg"
            disabled={state === "requesting"}
          >
            {state === "requesting" ? "Summoning..." : "Reveal Yourself"}
          </MagneticButton>
        )}

        {/* Streaming / Denied: conversion elements */}
        {isRevealed && (
          <>
            {/* Feature pills */}
            <div style={{
              display: "flex", flexWrap: "wrap",
              justifyContent: "center", gap: isMobile ? "0.5rem" : "0.75rem",
            }}>
              {FEATURES.map((f, i) => (
                <a key={i} href={f.href} style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.45rem 1rem",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  backdropFilter: "blur(12px) saturate(1.2)",
                  fontFamily: "var(--font-accent)",
                  fontSize: "clamp(0.75rem, 1.1vw, 0.85rem)",
                  fontWeight: 400, letterSpacing: "0.04em",
                  color: "var(--c-text-mid)",
                  textDecoration: "none",
                }}>
                  <span style={{ color: "var(--color-celestial-gold)", fontSize: "0.7rem" }}>{f.icon}</span>
                  {f.label}
                </a>
              ))}
            </div>

            {/* Social proof */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: isMobile ? "0.6rem" : "1rem", flexWrap: "wrap",
            }}>
              <span style={{
                fontFamily: "var(--font-accent)", fontWeight: 300,
                fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
                letterSpacing: "0.06em", color: "var(--c-text-muted)",
              }}>
                Trusted by{" "}
                <AnimatedCounter value={12400} suffix="+" duration={2200}
                  style={{ color: "var(--c-text-mid)", fontWeight: 500 }} />
                {" "}seekers
              </span>
              <span style={{ color: "rgba(212,175,55,0.25)", fontSize: "0.4rem" }}>{"\u2726"}</span>
              <span style={{
                fontFamily: "var(--font-accent)", fontWeight: 300,
                fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
                letterSpacing: "0.06em", color: "var(--c-text-muted)",
              }}>
                <AnimatedCounter value={4.9} decimals={1} duration={1800} delay={300}
                  style={{ color: "var(--c-text-mid)", fontWeight: 500 }} />
                {" "}{"\u2605"} rating
              </span>
            </div>

            {/* Gold CTA */}
            <MagneticButton
              href="/portrait"
              variant="gold"
              size="lg"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("cosmic_selfie_cta_clicked", {
                  detail: { destination: "/portrait" },
                }));
              }}
            >
              Get Your Full Cosmic Portrait
            </MagneticButton>

            {/* Privacy text (streaming only) */}
            {state === "streaming" && (
              <p style={{
                fontFamily: "var(--font-accent)",
                fontSize: "0.65rem", letterSpacing: "0.1em",
                color: "var(--c-text-muted)", opacity: 0.6,
                marginTop: "-0.25rem",
              }}>
                Camera is live — nothing is recorded
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the component renders in idle state**

Open `http://localhost:3333` and scroll to the section. Expected: See the nebula orb image, the headline "The stars already know your face.", and the glass "Reveal Yourself" button.

- [ ] **Step 3: Test camera flow**

Click "Reveal Yourself". Expected:
1. Button shows "Summoning..."
2. Browser prompts for camera access
3. If granted: your face appears beneath the cosmos when you hover over the orb
4. Headline changes to "This is how the cosmos sees you."
5. Feature pills, social proof, and gold CTA appear below

- [ ] **Step 4: Test denied flow**

Deny camera permission. Expected: Static portrait image appears as the reveal layer. Same UI (CTA, pills, social proof) appears. No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/CosmicSelfie.tsx
git commit -m "feat: add CosmicSelfie component with webcam liquid mask reveal"
```

---

### Task 5: Wire into homepage and clean up

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/OraclePreview.tsx`

- [ ] **Step 1: Update homepage imports**

In `src/app/page.tsx`, replace:

```typescript
import OraclePreview from "@/components/OraclePreview"; // v2
```

With:

```typescript
import CosmicSelfie from "@/components/CosmicSelfie";
```

And in the JSX, replace:

```tsx
<OraclePreview />
```

With:

```tsx
<CosmicSelfie />
```

- [ ] **Step 2: Delete OraclePreview**

```bash
rm src/components/OraclePreview.tsx
```

- [ ] **Step 3: Run build check**

Run: `npx tsc --noEmit`
Expected: No errors. The deleted `OraclePreview.tsx` should have no remaining importers.

- [ ] **Step 4: Verify homepage works end-to-end**

Open `http://localhost:3333` in an incognito window. Scroll to the section between Testimonials and Pricing. Expected:
- Nebula orb visible with radial mask-image fade
- "The stars already know your face." headline
- "Reveal Yourself" glass button
- Click → camera prompt → webcam face reveal OR static fallback
- Gold CTA appears after reveal
- No console errors
- `/oracle` page still works independently

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git rm src/components/OraclePreview.tsx
git commit -m "feat: swap OraclePreview for CosmicSelfie on homepage"
```

---

### Task 6: Final polish and edge cases

**Files:**
- Modify: `src/components/CosmicSelfie.tsx` (if needed)

- [ ] **Step 1: Test mobile (touch + front camera)**

Open on a phone or use Chrome DevTools device emulation with webcam. Expected:
- Touch reveals the mask
- Front-facing camera (selfie view)
- Orb scales to 80vw
- Feature pills wrap

- [ ] **Step 2: Test reduced motion**

Enable `prefers-reduced-motion: reduce` in Chrome DevTools. Expected:
- Section appears at full opacity immediately (no scroll entrance animation)
- Webcam flow still works
- Liquid mask effect still works (cursor-driven, not time-animated)

- [ ] **Step 3: Test camera disconnection**

Grant camera, then disable camera in system preferences or unplug external webcam. Expected: Section transitions to `denied` state with static fallback (no crash).

- [ ] **Step 4: Test the selfie mirror (left/right)**

When camera is active, raise your RIGHT hand. Expected: It appears on the RIGHT side of the screen (mirrored, like a real mirror). If it appears on the LEFT, the `uMirror` uniform needs to be toggled.

- [ ] **Step 5: Test Y-axis orientation (up/down)**

When camera is active, check that your face is right-side-up (not flipped vertically). If the face appears upside-down, toggle the `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, ...)` value in the render loop (change `true` to `false` or vice versa).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "polish: cosmic selfie edge cases and mobile testing"
```
