/**
 * CurtainVeilCard.tsx — dense animated veil that drops to reveal the card.
 *
 * At rest: the shader covers the card ~90% — obviously a veil, not just
 * ambient texture. Flowing fbm gives it fabric-like density variation;
 * gold shimmer catches on the "folds".
 *
 * Interaction: tap/click or press Enter/Space — the veil drops. A
 * wispy noise-warped edge falls from top of card past the bottom over
 * ~1.8s, with a warm gold highlight at the leading edge and trailing
 * wisps of veil material. Tap again → veil rises back over ~1.2s.
 *
 * No hold threshold. Single decisive gesture. GPU-only — one fragment
 * shader, one draw call per frame.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

const DROP_DURATION = 1.8;  // seconds for veil to fall
const RAISE_DURATION = 1.2; // seconds for veil to return

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
  uniform float uDropProgress;   // 0 veil up, 1 veil fully dropped
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUV;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.52; }
    return v;
  }

  void main() {
    vec2 uv = vUV;

    // Falling edge: at drop=0, edge sits above the card (1.15); at
    // drop=1, it has fallen past the bottom (−0.15). This gives a clean
    // off-screen start/end so the edge is never visible at either
    // extreme.
    float fallY = 1.15 - uDropProgress * 1.30;

    // Wispy displacement — noise-warped so the edge is fabric-like, not a line
    float wisp = (fbm(vec2(uv.x * 5.5, uTime * 0.35)) - 0.5) * 0.14;
    float edgeY = fallY + wisp;

    // Veil mask — 1 above edge, 0 below, with a soft 5% gradient so the
    // edge is a fade, not a hard cut.
    float veil = smoothstep(edgeY - 0.04, edgeY + 0.03, uv.y);

    // Trailing wisps — thin fibers of veil material below the edge
    if (uv.y < edgeY + 0.12 && uv.y > edgeY - 0.30) {
      float fibers = fbm(vec2(uv.x * 9.0, uv.y * 18.0 - uTime * 1.6));
      float fiberMask = smoothstep(edgeY - 0.25, edgeY, uv.y);
      veil += pow(fibers, 1.5) * fiberMask * 0.45;
    }

    veil = clamp(veil, 0.0, 1.0);

    // Flowing veil texture — domain-warped fbm so the density pulses
    vec2 flow = vec2(
      fbm(vec2(uv.x * 1.7, uv.y * 1.7 + uTime * 0.04)),
      fbm(vec2(uv.x * 1.7 + 3.1, uv.y * 1.7 + 1.7 + uTime * 0.05))
    );
    float texture = fbm(uv * vec2(2.4 * uAspect, 2.4) + flow * 0.9 + uTime * 0.06);

    // Veil color — deep purple-black with occasional gold shimmer on folds
    vec3 deep = vec3(0.036, 0.026, 0.082);
    vec3 nebula = vec3(0.18, 0.08, 0.24);
    vec3 gold = vec3(0.90, 0.76, 0.40);
    float shimmer = smoothstep(0.60, 0.92, texture);
    vec3 veilColor = mix(deep, nebula, smoothstep(0.25, 0.75, texture));
    veilColor = mix(veilColor, gold, shimmer * 0.45);

    // Modulate density so it's not flat
    float density = 0.90 + 0.10 * texture;
    veil *= density;

    // Pull card through veil
    vec4 card = texture2D(uCard, uv);
    vec3 final = mix(card.rgb, veilColor, veil);

    // Leading-edge glow: a warm hairline at the dropping edge,
    // visible only while dropping (fades in at drop ~0.02 and
    // out at drop ~0.98 so there's no residual glow at rest).
    float edgeDist = abs(uv.y - edgeY);
    float edgeGlow = (1.0 - smoothstep(0.0, 0.028, edgeDist));
    float glowGate = smoothstep(0.0, 0.05, uDropProgress) * (1.0 - smoothstep(0.94, 1.0, uDropProgress));
    final += vec3(0.96, 0.82, 0.46) * edgeGlow * glowGate * 0.75;

    // Subtle gold sparkle on the veil while it's present — catches the
    // eye at rest without being over-busy.
    float sparkle = step(0.96, hash(floor(uv * 160.0) + floor(uTime * 2.0)));
    final += vec3(0.95, 0.82, 0.46) * sparkle * veil * 0.08;

    gl_FragColor = vec4(final, 1.0);
  }
`;

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

// Ease-out cubic — the drop starts fast (gravity), settles gently
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
// Ease-in-out sine for the rise — symmetrical, feels intentional
function easeInOutSine(t: number) { return -(Math.cos(Math.PI * t) - 1) / 2; }

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
  const dropProgress = useRef(0); // live value passed to uniform
  const animationRef = useRef<{ direction: "drop" | "raise" | null; startTime: number; from: number } | null>(null);
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

  // Reset to veiled state when card changes
  useEffect(() => {
    dropProgress.current = 0;
    animationRef.current = null;
    setRevealed(false);
  }, [card.name]);

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
    gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uvBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(uvLoc); gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const uDropProgress = gl.getUniformLocation(program, "uDropProgress");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
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

      // Drive the drop/raise animation
      const anim = animationRef.current;
      if (anim && anim.direction) {
        const duration = anim.direction === "drop" ? DROP_DURATION : RAISE_DURATION;
        const t = Math.min(1, (now - anim.startTime) / (duration * 1000));
        const eased = anim.direction === "drop" ? easeOutCubic(t) : easeInOutSine(t);
        if (anim.direction === "drop") {
          dropProgress.current = anim.from + (1 - anim.from) * eased;
        } else {
          dropProgress.current = anim.from + (0 - anim.from) * eased;
        }
        if (t >= 1) {
          dropProgress.current = anim.direction === "drop" ? 1 : 0;
          animationRef.current = null;
        }
      }

      gl.useProgram(program);
      gl.uniform1f(uDropProgress, dropProgress.current);
      gl.uniform1f(uTime, elapsed);
      gl.clearColor(0.024, 0.016, 0.102, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program); gl.deleteTexture(tex);
      gl.deleteBuffer(posBuf); gl.deleteBuffer(uvBuf);
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
    setRevealed(goingDown);
  }, []);

  const handleClick = useCallback(() => { toggleVeil(); }, [toggleVeil]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleVeil();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      onAdvance?.();
    }
  }, [toggleVeil, onAdvance]);

  return (
    <div className="cv" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <div
        className="cv-frame"
        role="button"
        tabIndex={0}
        aria-label={revealed ? `${card.name} revealed. Tap to re-veil.` : `Today's card is beneath the veil. Tap to drop it.`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      >
        <canvas ref={canvasRef} width={width} height={height} aria-hidden />
        {!ready && <div className="cv-loading" aria-hidden>✦</div>}

        {/* Hint pill — shown when veiled and at rest */}
        {ready && !revealed && !animationRef.current && (
          <div className="cv-hint" aria-hidden>
            <span className="cv-hint-dot" /> Tap to drop the veil
          </div>
        )}

        {/* Card name pill — shown when revealed */}
        {revealed && (
          <div className="cv-strip" aria-hidden>
            {numeral && <span className="cv-numeral">{numeral}.</span>}
            <span>{card.name}</span>
          </div>
        )}
      </div>

      <div className="cv-actions">
        <button
          type="button"
          className="cv-toggle"
          onClick={toggleVeil}
          aria-label={revealed ? "Re-veil the card" : "Drop the veil"}
        >
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
          box-shadow: 0 36px 60px rgba(0,0,0,0.5), 0 0 32px rgba(212,175,55,0.1);
          outline: none; cursor: pointer;
        }
        .cv-frame:focus-visible { outline: 2px solid rgba(232,201,106,0.85); outline-offset: 3px; }
        .cv-frame canvas { width: 100%; height: 100%; display: block; }
        .cv-loading {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; color: rgba(232,201,106,0.55);
          animation: cvFloat 3.6s cubic-bezier(0.16,1,0.3,1) infinite;
          pointer-events: none;
        }
        .cv-hint, .cv-strip {
          position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 0.55em;
          padding: 0.55rem 1.1rem; border-radius: 9999px;
          background: rgba(6,4,26,0.7); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.7rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          pointer-events: none; z-index: 2;
        }
        .cv-hint {
          border: 1px solid rgba(232,201,106,0.55);
          color: rgba(232,201,106,0.95);
          box-shadow: 0 0 24px rgba(212,175,55,0.22);
          animation: cvPulse 3.2s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .cv-hint-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(232,201,106,1); box-shadow: 0 0 12px rgba(232,201,106,0.9);
        }
        .cv-strip {
          border: 1px solid rgba(232,201,106,0.32);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic; font-size: 1.05rem; letter-spacing: 0;
          text-transform: none; color: rgba(245,240,232,0.98);
          gap: 0.4em; align-items: baseline;
          animation: cvStripIn 500ms cubic-bezier(0.16,1,0.3,1) both;
        }
        .cv-numeral { color: rgba(232,201,106,0.92); margin-right: 0.15em; }

        .cv-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; }
        .cv-toggle, .cv-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.6rem 1.1rem; border-radius: 9999px;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .cv-toggle {
          background: linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.10));
          border: 1px solid rgba(232,201,106,0.5);
          color: rgba(232,201,106,0.98);
        }
        .cv-toggle:hover {
          background: linear-gradient(135deg, rgba(232,201,106,0.35), rgba(212,175,55,0.18));
          border-color: rgba(255,220,130,0.85);
          color: rgba(255,230,150,1);
        }
        .cv-toggle:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .cv-advance {
          background: transparent;
          border: 1px solid rgba(200,185,255,0.18);
          color: rgba(220,210,245,0.72);
        }
        .cv-advance:hover { color: rgba(245,240,232,0.98); border-color: rgba(200,185,255,0.36); }
        .cv-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }

        @keyframes cvFloat { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-4px); opacity: 0.85; } }
        @keyframes cvPulse { 0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.22); } 50% { box-shadow: 0 0 34px rgba(212,175,55,0.46); } }
        @keyframes cvStripIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .cv-loading, .cv-hint { animation: none; }
          .cv-strip { animation: none; }
        }
      `}</style>
    </div>
  );
}
