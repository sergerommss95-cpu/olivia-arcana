/**
 * CurtainVeilCard.tsx — a dense, layered, ceremonial shader veil.
 *
 * Not a mask-with-noise. A twelve-layer composition meant to feel
 * MATERIAL and magical.
 *
 *  1.  Base cosmic nebula — domain-warped fbm, deep void → violet → magenta
 *  2.  Silk fabric weave — cross-hatched sine patterns with fbm shear
 *  3.  Gold shimmer — catches on the fabric's high-noise folds
 *  4.  Stitched constellation — multi-layer twinkling starfield woven in
 *  5.  Arcing leading edge — not a straight line; a sine-arced, noise-
 *      wispy seam that falls in a wave, not a wipe
 *  6.  Plasma hairline — a hot gold line at the leading edge (bloom-feel)
 *  7.  Edge spark burst — hash-based gold sparks along the seam
 *  8.  Trailing tendrils — thin vertical gold fibers below the edge
 *  9.  Anticipation pulse — brief full-veil gold flash at drop trigger
 * 10.  Card rim aura — soft gold halo around the revealed card
 * 11.  Ambient motes — post-drop drifting gold dust
 * 12.  Cursor halo + breath — soft attention glow, gentle brightness throb
 *
 * Choreography (5 phases, 2.8s total drop):
 *
 *   0.00–0.22s  Anticipation — the fabric "tenses" (golden pulse), cursor
 *               glow brightens, stars flash
 *   0.22–1.20s  Initial fall — arcing sine edge begins to descend, gold
 *               plasma seam, first spark burst, tendrils extend
 *   1.20–2.00s  Rolling wave — edge sweeps down in an arc, constellation
 *               stars glow through like they're stepping forward
 *   2.00–2.60s  Dissolution — remaining veil frays into motes near the
 *               bottom edge, card's rim-glow fades in
 *   2.60–2.80s  Settlement — motes drift up and away, card is revealed
 *               with a golden halo; ambient dust continues forever
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

const DROP_DURATION = 2.8;
const RAISE_DURATION = 1.4;
const FLASH_DURATION = 0.28; // anticipation flash length

const VERTEX_SRC = /* glsl */ `
  attribute vec2 aPosition;
  attribute vec2 aUV;
  varying vec2 vUV;
  void main() {
    vUV = aUV;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SRC = /* glsl */ `
  precision highp float;

  uniform sampler2D uCard;
  uniform float uDropProgress;    // 0 veiled, 1 fully revealed
  uniform float uFlash;           // anticipation flash, 0..1, fades after trigger
  uniform float uTime;
  uniform float uAspect;          // card width / height
  uniform vec2  uCursor;          // 0..1 UV, for attention halo
  uniform float uAttention;       // 0..1 smoothed cursor-in-bounds

  varying vec2 vUV;

  const float TAU = 6.28318530718;

  // ── Utilities ──────────────────────────────────────────────────────
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hash1(float x) { return fract(sin(x * 91.3458) * 43758.5453); }

  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.13; a *= 0.52; }
    return v;
  }
  float fbm3(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  // ── Stitched starfield — a hash-based twinkling star layer ─────────
  float starField(vec2 uv, float density, float seed) {
    vec2 id = floor(uv);
    float h = hash(id + seed);
    if (h > density) return 0.0;
    vec2 fp = fract(uv) - 0.5;
    float star = exp(-dot(fp, fp) * 80.0);
    float twinkle = 0.5 + 0.5 * sin(uTime * 2.5 + h * TAU);
    return star * twinkle;
  }

  // ── Gold dust motes drifting upward ────────────────────────────────
  // Tight Gaussian points on a coarse grid. Density threshold is high
  // so only a few cells per layer emit, and the falloff is aggressive
  // enough that each mote reads as an individual spark, not a blob.
  float motes(vec2 uv, float seed) {
    float driftY = mod(uv.y - uTime * 0.065 + seed, 1.0);
    vec2 cell = vec2(floor(uv.x * 28.0), floor(driftY * 28.0 + hash1(seed) * 30.0));
    float h = hash(cell + seed);
    if (h < 0.992) return 0.0;
    vec2 fp = vec2(fract(uv.x * 28.0) - 0.5, fract(driftY * 28.0) - 0.5);
    float m = exp(-dot(fp, fp) * 180.0);
    float flicker = 0.5 + 0.5 * sin(uTime * 3.5 + h * TAU);
    return m * flicker;
  }

  void main() {
    vec2 uv = vUV;
    vec2 asp = vec2(uv.x * uAspect, uv.y);
    float drop = uDropProgress;

    // ══ EDGE CHOREOGRAPHY ════════════════════════════════════════════
    // Arc offset — bottom of the falling edge dips lower in the middle,
    // so it reads as a piece of cloth catching its center on the fall.
    float arc = sin(uv.x * 3.14159) * 0.07 * (1.0 - smoothstep(0.85, 1.0, drop));

    // Extra dip as the drop progresses past 50% — the center sags
    float sagBoost = smoothstep(0.2, 0.85, drop) * 0.05;

    // Core fall line
    float baseFall = 1.22 - drop * 1.44;

    // Wispy noise displacement — fabric-edge tearing
    float wispy = (fbm(vec2(uv.x * 5.5, uTime * 0.4 + drop * 5.0)) - 0.5) * 0.17;

    // Combined falling edge
    float edgeY = baseFall + wispy + arc + sagBoost;

    // Primary veil mask — 1 BELOW the falling edge (where veil remains),
    // 0 ABOVE the falling edge (where the card is revealed). At rest
    // (drop=0) edgeY is above the card so veilMask = 1 everywhere (fully
    // veiled). At full drop edgeY is below the card so veilMask = 0
    // everywhere (fully revealed).
    float veilMask = 1.0 - smoothstep(edgeY - 0.04, edgeY + 0.025, uv.y);

    // Dissolution — in the last 25% of the drop, the upper veil (just
    // above the falling edge) frays into particles. Hash-based hole
    // punching with a noise threshold so the fray feels granular, not
    // regular-tiled. Tighter cell grid so it reads as dust, not blocks.
    if (drop > 0.72 && uv.y > edgeY - 0.05 && uv.y < edgeY + 0.35) {
      float dissolve = hash(floor(asp * 95.0) + floor(uTime * 8.0));
      float dissolveMask = smoothstep(0.72, 0.95, drop)
                         * smoothstep(edgeY - 0.05, edgeY + 0.18, uv.y);
      if (dissolve < dissolveMask * 0.80) veilMask *= 0.0;
    }

    veilMask = clamp(veilMask, 0.0, 1.0);

    // ══ LAYER 1 — BASE COSMIC NEBULA ═════════════════════════════════
    // Slow, domain-warped fbm. The veil is lit from behind by the void.
    vec2 flow = vec2(
      fbm(vec2(asp.x * 1.1, asp.y * 1.1 + uTime * 0.03)),
      fbm(vec2(asp.x * 1.1 + 4.7, asp.y * 1.1 + 2.1 + uTime * 0.027))
    );
    float nebula = fbm(asp * 1.6 + flow * 1.3 + vec2(uTime * 0.035, -uTime * 0.025));

    vec3 cVoid        = vec3(0.022, 0.016, 0.068);
    vec3 cViolet      = vec3(0.14, 0.07, 0.22);
    vec3 cMagenta     = vec3(0.28, 0.10, 0.26);
    vec3 nebulaCol = mix(cVoid, cViolet, smoothstep(0.22, 0.70, nebula));
    nebulaCol = mix(nebulaCol, cMagenta, smoothstep(0.62, 0.94, nebula));

    // ══ LAYER 2 — SILK FABRIC WEAVE ══════════════════════════════════
    // Cross-hatched sine lines with fbm shear. Frequencies chosen to
    // stay well below Nyquist at 2× DPR so there's no moire on the
    // weave — it reads as a subtle woven texture, not stairsteps.
    float shearX = fbm(asp * 2.2) * 1.3;
    float shearY = fbm(asp * 2.2 + 3.7) * 1.3;
    float weaveV = sin(asp.x * 62.0 + shearX) * 0.5 + 0.5;
    float weaveH = sin(asp.y * 70.0 + shearY) * 0.5 + 0.5;
    float fabric = pow(weaveV * weaveH, 0.75) * 0.16;
    nebulaCol += vec3(0.14, 0.11, 0.18) * fabric;

    // ══ LAYER 3 — GOLD SHIMMER ON FOLDS ══════════════════════════════
    // Where fbm peaks, gold catches the light.
    vec3 cGold = vec3(0.95, 0.80, 0.42);
    float shimmer = smoothstep(0.60, 0.92, nebula);
    nebulaCol = mix(nebulaCol, cGold, shimmer * 0.50);

    // ══ LAYER 4 — STITCHED CONSTELLATION ═════════════════════════════
    // Three octaves of starfield, getting brighter during the drop as
    // the stars "step forward" from behind the veil.
    float stars = 0.0;
    stars += starField(asp * 7.0,  0.040, 0.0);
    stars += starField(asp * 12.0, 0.025, 4.3) * 0.85;
    stars += starField(asp * 18.0, 0.018, 8.7) * 0.6;
    // Stars glow brighter during the mid-drop phase (rolling-wave moment)
    float starBoost = 0.55 + smoothstep(0.15, 0.75, drop) * 1.8;
    nebulaCol += vec3(1.0, 0.93, 0.68) * stars * starBoost;

    // ══ LAYER 5 — LEADING EDGE PLASMA ════════════════════════════════
    // Hot gold hairline at the exact falling edge. Bloom-feel via
    // inverse-square falloff.
    float edgeDist = abs(uv.y - edgeY);
    float plasma = exp(-edgeDist * 42.0);
    // Wider soft bloom beneath the plasma
    float plasmaBloom = exp(-edgeDist * 12.0) * 0.45;
    float plasmaGate = smoothstep(0.01, 0.05, drop) * (1.0 - smoothstep(0.94, 1.0, drop));
    vec3 plasmaCol = vec3(1.0, 0.86, 0.52) * (plasma * 2.4 + plasmaBloom) * plasmaGate;

    // ══ LAYER 6 — EDGE SPARK BURST ═══════════════════════════════════
    // Random gold dust sparks along the seam.
    float sparkUV = hash(floor(asp * 85.0) + floor(uTime * 6.0));
    float sparkBand = smoothstep(0.10, 0.0, abs(uv.y - edgeY));
    float sparkMask = step(0.983, sparkUV) * sparkBand * plasmaGate;
    plasmaCol += vec3(1.0, 0.90, 0.58) * sparkMask * 1.4;

    // ══ LAYER 7 — TRAILING TENDRILS ══════════════════════════════════
    // Thin vertical gold streaks BELOW the falling edge — the veil
    // leaving light behind as it descends.
    if (uv.y < edgeY && drop > 0.08 && drop < 0.92) {
      float tendrilNoise = fbm(vec2(uv.x * 22.0, uv.y * 7.0 - uTime * 1.8));
      float tendrilMask = smoothstep(edgeY - 0.32, edgeY, uv.y);
      float tendrils = pow(max(tendrilNoise, 0.0), 3.2) * tendrilMask;
      plasmaCol += vec3(0.95, 0.78, 0.42) * tendrils * 0.55;
    }

    // ══ LAYER 8 — ANTICIPATION FLASH ═════════════════════════════════
    // Brief golden pulse over the entire fabric at the moment of
    // trigger. Driven by uFlash uniform (decays over ~0.28s).
    vec3 flashCol = vec3(1.0, 0.84, 0.48) * uFlash * 0.55;

    // ══ VEIL DENSITY ═════════════════════════════════════════════════
    float density = 0.90 + 0.10 * nebula;
    float veil = veilMask * density;

    // ══ LAYER 12 — BREATH & CURSOR HALO (at-rest only) ═══════════════
    float breath = sin(uTime * 0.85) * 0.04 * (1.0 - drop);
    float cursorDist = distance(asp, vec2(uCursor.x * uAspect, uCursor.y));
    float cursorHalo = exp(-cursorDist * 4.2) * uAttention * (1.0 - drop);

    // Composite veil color
    vec3 veilColor = nebulaCol + plasmaCol + flashCol;
    veilColor += vec3(0.22, 0.14, 0.26) * breath;
    veilColor += vec3(1.0, 0.82, 0.45) * cursorHalo * 0.42;

    // ══ CARD — LAYER 10: RIM AURA ════════════════════════════════════
    vec4 card = texture2D(uCard, uv);

    // Soft gold rim around the card — grows as the drop reveals it.
    vec2 cardCenter = uv - 0.5;
    float cardRadial = length(cardCenter * vec2(uAspect, 1.0));
    float rim = smoothstep(0.52, 0.44, cardRadial);
    vec3 cardLit = card.rgb + vec3(0.95, 0.78, 0.40) * rim * 0.18 * drop;

    // ══ FINAL COMPOSITE ══════════════════════════════════════════════
    vec3 final = mix(cardLit, veilColor, veil);

    // ══ LAYER 11 — AMBIENT MOTES (post-drop only) ════════════════════
    // Floating gold dust that drifts upward once the card is revealed.
    // Reduced strength so motes read as individual sparks — never a
    // blocky cell-grid effect.
    float motesStrength = smoothstep(0.80, 1.0, drop);
    if (motesStrength > 0.01) {
      float m = motes(asp, 0.0) + motes(asp, 3.1) * 0.7 + motes(asp, 7.3) * 0.5;
      final += vec3(0.95, 0.82, 0.46) * m * motesStrength * 0.42;
    }

    gl_FragColor = vec4(final, 1.0);
  }
`;

// ── WebGL boilerplate ──────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type); if (!s) throw new Error("shader");
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error("shader: " + info);
  }
  return s;
}
function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const p = gl.createProgram(); if (!p) throw new Error("program");
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(p); gl.deleteProgram(p); throw new Error("link: " + info);
  }
  return p;
}

// ── Eases ─────────────────────────────────────────────────────────────
// Drop — out-expo: fast initial acceleration (gravity), long tail settlement
function easeOutExpo(t: number): number { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
// Raise — in-out-cubic: intentional, even-paced
function easeInOutCubic(t: number): number { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }

interface CurtainVeilCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

export default function CurtainVeilCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: CurtainVeilCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropProgress = useRef(0);
  const flashRef = useRef(0);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });
  const attentionRef = useRef(0);
  const cursorInBounds = useRef(false);
  const animationRef = useRef<{ direction: "drop" | "raise"; startTime: number; from: number } | null>(null);
  const flashStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const height = Math.round(width * 1.5);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset on card change
  useEffect(() => {
    dropProgress.current = 0;
    animationRef.current = null;
    flashRef.current = 0;
    flashStartRef.current = null;
    setRevealed(false);
  }, [card.name]);

  // Mount WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const program = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    gl.useProgram(program);

    const positions = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const uvs = new Float32Array([0,1, 1,1, 0,0, 0,0, 1,1, 1,0]);
    const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uvBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const uDropProgress = gl.getUniformLocation(program, "uDropProgress");
    const uFlash = gl.getUniformLocation(program, "uFlash");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uCursor = gl.getUniformLocation(program, "uCursor");
    const uAttention = gl.getUniformLocation(program, "uAttention");
    const uCard = gl.getUniformLocation(program, "uCard");
    gl.uniform1f(uAspect, width / height);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10,8,26,255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(uCard, 0);

    const img = new Image();
    img.src = getCardImagePath(card);
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      setReady(true);
    };

    const start = performance.now();
    const render = () => {
      const now = performance.now();
      const elapsed = reducedMotion ? 0 : (now - start) / 1000;

      // Drive drop/raise animation
      const anim = animationRef.current;
      if (anim) {
        const duration = anim.direction === "drop" ? DROP_DURATION : RAISE_DURATION;
        const t = Math.min(1, (now - anim.startTime) / (duration * 1000));
        const eased = anim.direction === "drop" ? easeOutExpo(t) : easeInOutCubic(t);
        const target = anim.direction === "drop" ? 1 : 0;
        dropProgress.current = anim.from + (target - anim.from) * eased;
        if (t >= 1) {
          dropProgress.current = target;
          animationRef.current = null;
        }
      }

      // Anticipation flash — decays over FLASH_DURATION
      if (flashStartRef.current !== null) {
        const ft = (now - flashStartRef.current) / (FLASH_DURATION * 1000);
        if (ft >= 1) {
          flashRef.current = 0;
          flashStartRef.current = null;
        } else {
          // Up-and-down: peak at ~0.35
          flashRef.current = ft < 0.35
            ? ft / 0.35
            : 1.0 - (ft - 0.35) / 0.65;
        }
      }

      // Attention smoothing
      const target = cursorInBounds.current && dropProgress.current < 0.05 ? 1 : 0;
      attentionRef.current += (target - attentionRef.current) * 0.08;

      gl.useProgram(program);
      gl.uniform1f(uDropProgress, dropProgress.current);
      gl.uniform1f(uFlash, flashRef.current);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uCursor, cursorRef.current.x, cursorRef.current.y);
      gl.uniform1f(uAttention, attentionRef.current);

      gl.clearColor(0.024, 0.016, 0.102, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteTexture(tex);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.name, width, height, reducedMotion]);

  const toggleVeil = useCallback(() => {
    const current = dropProgress.current;
    const goingDown = current < 0.5;
    animationRef.current = {
      direction: goingDown ? "drop" : "raise",
      startTime: performance.now(),
      from: current,
    };
    // Flash triggers on every toggle — anticipation for the drop,
    // or a "reseating" flash for the rise.
    flashStartRef.current = performance.now();
    flashRef.current = 0;
    setRevealed(goingDown);
  }, []);

  const handleClick = useCallback(() => { toggleVeil(); }, [toggleVeil]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleVeil(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); onAdvance?.(); }
  }, [toggleVeil, onAdvance]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cursorRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    };
    cursorInBounds.current = true;
  }, []);
  const handlePointerLeave = useCallback(() => { cursorInBounds.current = false; }, []);
  const handlePointerEnter = useCallback(() => { cursorInBounds.current = true; }, []);

  return (
    <div className="cv" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <div
        className={`cv-frame${revealed ? " cv-frame-revealed" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={revealed ? `${card.name} revealed. Tap to re-veil.` : `Today's card is beneath the veil. Tap to drop it.`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      >
        <canvas ref={canvasRef} width={width} height={height} aria-hidden />
        {!ready && <div className="cv-loading" aria-hidden>✦</div>}

        {/* Hint pill — only at rest when veiled */}
        {ready && !revealed && (
          <div className="cv-hint" aria-hidden>
            <span className="cv-hint-dot" /> Tap to drop the veil
          </div>
        )}

        {/* Card name pill — only after revealed, with stagger entrance */}
        {revealed && (
          <div className="cv-strip" aria-hidden>
            {numeral && <span className="cv-numeral" style={{ animationDelay: "0.1s" }}>{numeral}.</span>}
            {card.name.split(" ").map((word, i) => (
              <span key={i} className="cv-word" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                {word}{i < card.name.split(" ").length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="cv-actions">
        <button type="button" className="cv-toggle" onClick={toggleVeil}>
          <span aria-hidden>{revealed ? "✦" : "↓"}</span>
          {revealed ? "Re-veil" : "Drop the veil"}
        </button>
        <button type="button" className="cv-advance" onClick={() => onAdvance?.()}>
          Different card →
        </button>
      </div>

      <style>{`
        .cv { display: flex; flex-direction: column; gap: 1.1rem; align-items: stretch; margin: 0 auto; }
        .cv-frame {
          position: relative; border-radius: 18px; overflow: hidden; isolation: isolate;
          box-shadow:
            0 36px 60px rgba(0,0,0,0.5),
            0 0 32px rgba(212,175,55,0.12),
            inset 0 0 0 1px rgba(232,201,106,0.18);
          outline: none; cursor: pointer;
          animation: cvBreath 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          transition: box-shadow 800ms cubic-bezier(0.16,1,0.3,1),
                      transform 600ms cubic-bezier(0.16,1,0.3,1);
        }
        .cv-frame-revealed {
          box-shadow:
            0 36px 70px rgba(0,0,0,0.55),
            0 0 48px rgba(232,201,106,0.28),
            inset 0 0 0 1px rgba(232,201,106,0.42);
        }
        .cv-frame:focus-visible {
          outline: 2px solid rgba(232,201,106,0.95);
          outline-offset: 4px;
        }
        .cv-frame canvas { width: 100%; height: 100%; display: block; }
        .cv-loading {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; color: rgba(232,201,106,0.55);
          animation: cvFloat 3.6s cubic-bezier(0.16,1,0.3,1) infinite;
          pointer-events: none;
        }

        /* ── Hint & strip ─────────────────────────────────────────── */
        .cv-hint, .cv-strip {
          position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 0.55em;
          padding: 0.55rem 1.1rem; border-radius: 9999px;
          background: rgba(6,4,26,0.72);
          -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.7rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          pointer-events: none; z-index: 2;
        }
        .cv-hint {
          border: 1px solid rgba(232,201,106,0.58);
          color: rgba(232,201,106,0.98);
          box-shadow: 0 0 24px rgba(212,175,55,0.24);
          animation: cvHintPulse 3s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .cv-hint-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(232,201,106,1);
          box-shadow: 0 0 14px rgba(232,201,106,0.95);
          animation: cvDotPulse 2s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .cv-strip {
          border: 1px solid rgba(232,201,106,0.42);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic; font-size: 1.1rem; letter-spacing: 0;
          text-transform: none;
          color: rgba(245,240,232,0.98);
          gap: 0.25em; align-items: baseline;
          box-shadow: 0 0 28px rgba(212,175,55,0.22);
        }
        .cv-numeral, .cv-word {
          opacity: 0;
          display: inline-block;
          animation: cvWordRise 700ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .cv-numeral { color: rgba(232,201,106,0.92); margin-right: 0.15em; }

        /* ── Actions ──────────────────────────────────────────────── */
        .cv-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; }
        .cv-toggle, .cv-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.62rem 1.15rem; border-radius: 9999px;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer;
          transition: all 220ms cubic-bezier(0.16,1,0.3,1);
        }
        .cv-toggle {
          background: linear-gradient(135deg, rgba(212,175,55,0.26), rgba(212,175,55,0.12));
          border: 1px solid rgba(232,201,106,0.52);
          color: rgba(232,201,106,1);
          box-shadow: 0 0 22px rgba(212,175,55,0.18);
        }
        .cv-toggle:hover {
          background: linear-gradient(135deg, rgba(232,201,106,0.38), rgba(212,175,55,0.20));
          border-color: rgba(255,220,130,0.9);
          color: rgba(255,230,150,1);
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(212,175,55,0.3);
        }
        .cv-toggle:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .cv-advance {
          background: transparent;
          border: 1px solid rgba(200,185,255,0.20);
          color: rgba(220,210,245,0.72);
        }
        .cv-advance:hover {
          color: rgba(245,240,232,0.98);
          border-color: rgba(200,185,255,0.4);
        }
        .cv-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }

        /* ── Keyframes ────────────────────────────────────────────── */
        @keyframes cvBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.012); }
        }
        @keyframes cvFloat {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 0.85; }
        }
        @keyframes cvHintPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.22); opacity: 0.9; }
          50% { box-shadow: 0 0 36px rgba(212,175,55,0.52); opacity: 1; }
        }
        @keyframes cvDotPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(232,201,106,0.85); }
          50% { transform: scale(1.35); box-shadow: 0 0 18px rgba(232,201,106,1); }
        }
        @keyframes cvWordRise {
          0% { opacity: 0; transform: translateY(12px) blur(4px); filter: blur(4px); }
          50% { filter: blur(1.5px); }
          100% { opacity: 1; transform: translateY(0) blur(0); filter: blur(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cv-frame { animation: none !important; }
          .cv-loading, .cv-hint, .cv-hint-dot { animation: none !important; }
          .cv-numeral, .cv-word { animation: none !important; opacity: 1 !important; }
          .cv-toggle:hover { transform: none !important; }
        }
      `}</style>
    </div>
  );
}
