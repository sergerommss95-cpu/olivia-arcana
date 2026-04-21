/**
 * SmokeRevealCard.tsx — Option C of the card-shader rethink.
 *
 * Keeps the "hold to reveal" ceremony, but the cover is shader smoke,
 * not cloth. User presses and holds on the card; smoke dissipates from
 * the pressure point outward, card reveals. Release before the 1.2s
 * threshold to let the smoke resettle. Once revealed, stays revealed.
 * Click "Different card" → new card, smoke returns.
 *
 * Pure fragment shader — fbm + domain warping produces the smoke,
 * pressure origin punches a clearing. ~60 lines of GLSL, no physics,
 * no postprocessing.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

const HOLD_THRESHOLD = 1.2; // seconds before smoke fully clears

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
  uniform vec2 uPressure;       // 0..1 uv — where the user is holding
  uniform float uPressureStrength; // 0..1 — how long they've been holding
  uniform float uRevealed;      // 0..1 — set to 1 after threshold is hit
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
    vec2 asp = vec2(uv.x * uAspect, uv.y);
    vec2 pressure = vec2(uPressure.x * uAspect, uPressure.y);

    // Churning smoke via domain-warped fbm
    vec2 q = vec2(
      fbm(asp * 1.3 + vec2(uTime * 0.06, 0.0)),
      fbm(asp * 1.3 + vec2(3.1, 1.7) + vec2(uTime * 0.05, 0.0))
    );
    float smoke = fbm(asp * 2.0 + q * 1.4 + vec2(uTime * 0.04, -uTime * 0.03));
    smoke = smoothstep(0.25, 0.85, smoke);

    // Pressure clearing — radial dispersion from the pressure point
    float dist = distance(asp, pressure);
    float clearingRadius = 0.45 * uPressureStrength;
    float clearing = smoothstep(clearingRadius + 0.22, 0.0, dist) * uPressureStrength;

    // Global reveal (after threshold) — smooth fade to 0 across the whole card
    float mask = mix(
      clamp(smoke * 0.92 - clearing * 1.1, 0.0, 1.0),
      0.0,
      uRevealed
    );

    // Smoke color — deep purple-black with warm amber edges
    vec3 smokeDark = vec3(0.036, 0.024, 0.080);
    vec3 smokeWarm = vec3(0.45, 0.22, 0.12);
    float edge = smoothstep(0.15, 0.70, smoke) * (1.0 - smoothstep(0.70, 0.95, smoke));
    vec3 smokeCol = mix(smokeDark, smokeWarm, edge * 0.45);

    vec4 card = texture2D(uCard, uv);
    vec3 final = mix(card.rgb, smokeCol, mask);

    // Golden glow at the pressure point — grows with hold strength
    float glow = (1.0 - smoothstep(0.0, 0.12, dist)) * uPressureStrength;
    final += vec3(0.95, 0.82, 0.46) * glow * 0.18;

    gl_FragColor = vec4(final, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, src); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error("shader: " + info);
  }
  return shader;
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

interface SmokeRevealCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

export default function SmokeRevealCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: SmokeRevealCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressurePos = useRef({ x: 0.5, y: 0.5 });
  const pressureStrength = useRef(0);
  const holdStartRef = useRef<number | null>(null);
  const revealedRef = useRef(0); // 0..1
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const height = Math.round(width * 1.5);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset when card changes
  useEffect(() => {
    setRevealed(false);
    setHoldProgress(0);
    revealedRef.current = 0;
    pressureStrength.current = 0;
    holdStartRef.current = null;
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
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uvBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const uPressure = gl.getUniformLocation(program, "uPressure");
    const uPressureStrength = gl.getUniformLocation(program, "uPressureStrength");
    const uRevealed = gl.getUniformLocation(program, "uRevealed");
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

      // Smooth pressure strength toward target
      const target = holdStartRef.current !== null
        ? Math.min(1, (now - holdStartRef.current) / (HOLD_THRESHOLD * 1000))
        : 0;
      pressureStrength.current += (target - pressureStrength.current) * 0.10;
      setHoldProgress(pressureStrength.current);

      // Trigger reveal when hold threshold reached
      if (target >= 1 && !revealed) {
        setRevealed(true);
      }
      // Animate revealed uniform smoothly toward 1
      const revealTarget = revealed ? 1 : 0;
      revealedRef.current += (revealTarget - revealedRef.current) * 0.04;

      gl.useProgram(program);
      gl.uniform2f(uPressure, pressurePos.current.x, pressurePos.current.y);
      gl.uniform1f(uPressureStrength, pressureStrength.current);
      gl.uniform1f(uRevealed, revealedRef.current);
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
  }, [card.name, width, height, reducedMotion, revealed]);

  const setPressureFromEvent = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pressurePos.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (revealed) return;
    setPressureFromEvent(e);
    holdStartRef.current = performance.now();
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [revealed, setPressureFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (revealed) return;
    setPressureFromEvent(e);
  }, [revealed, setPressureFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (revealed) return;
    holdStartRef.current = null;
  }, [revealed]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
      e.preventDefault();
      onAdvance?.();
    } else if (!revealed && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      setRevealed(true);
    }
  }, [onAdvance, revealed]);

  const RING_CIRC = 138.23;

  return (
    <div className="sr" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <div
        className="sr-frame"
        role="button"
        tabIndex={0}
        aria-label={`Today's card: ${card.name}. Press and hold to dissipate the smoke.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", aspectRatio: `${width} / ${height}`, cursor: revealed ? "default" : "pointer" }}
      >
        <canvas ref={canvasRef} width={width} height={height} aria-hidden />
        {!ready && <div className="sr-loading" aria-hidden>✦</div>}

        {/* Hold-progress ring at pressure point */}
        {!revealed && holdProgress > 0.02 && (
          <svg
            className="sr-ring"
            style={{
              left: `${pressurePos.current.x * 100}%`,
              bottom: `${pressurePos.current.y * 100}%`,
            }}
            width="54" height="54" viewBox="0 0 54 54" aria-hidden
          >
            <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />
            <circle
              cx="27" cy="27" r="22" fill="none"
              stroke="rgba(240,207,120,0.9)" strokeWidth="2"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - holdProgress)}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          </svg>
        )}

        {/* Hint pill */}
        {ready && !revealed && holdProgress < 0.05 && (
          <div className="sr-hint" aria-hidden>
            <span className="sr-hint-dot" /> Press &amp; hold to dissipate
          </div>
        )}

        <div className="sr-strip" aria-hidden style={{ opacity: revealedRef.current > 0.2 || revealed ? 1 : 0 }}>
          {numeral && <span className="sr-numeral">{numeral}.</span>}
          <span>{card.name}</span>
        </div>
      </div>

      <div className="sr-actions">
        <button type="button" className="sr-advance" onClick={() => onAdvance?.()}>
          <span aria-hidden>✦</span> Different card
        </button>
        <Link href="/academy/card-of-the-day" className="sr-fullscreen">
          Full reading →
        </Link>
      </div>

      <style>{`
        .sr { display: flex; flex-direction: column; gap: 1.1rem; align-items: stretch; margin: 0 auto; }
        .sr-frame {
          position: relative; border-radius: 18px; overflow: hidden; isolation: isolate;
          box-shadow: 0 36px 60px rgba(0,0,0,0.5), 0 0 32px rgba(212,175,55,0.1);
          outline: none; touch-action: none;
        }
        .sr-frame:focus-visible { outline: 2px solid rgba(232,201,106,0.85); outline-offset: 3px; }
        .sr-frame canvas { width: 100%; height: 100%; display: block; }
        .sr-loading {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; color: rgba(232,201,106,0.55);
          animation: srFloat 3.6s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .sr-ring {
          position: absolute; transform: translate(-50%, 50%);
          pointer-events: none; z-index: 3;
          filter: drop-shadow(0 0 12px rgba(240,207,120,0.55));
        }
        .sr-hint {
          position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 0.55em;
          padding: 0.55rem 1.1rem; border-radius: 9999px;
          background: rgba(6,4,26,0.7); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          border: 1px solid rgba(232,201,106,0.55);
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.7rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase; color: rgba(232,201,106,0.95);
          pointer-events: none; z-index: 2;
          animation: srPulse 3s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .sr-hint-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(232,201,106,1); box-shadow: 0 0 12px rgba(232,201,106,0.9);
        }
        .sr-strip {
          position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%);
          display: inline-flex; align-items: baseline; gap: 0.4em;
          padding: 0.5rem 1rem; border-radius: 9999px;
          background: rgba(6,4,26,0.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          border: 1px solid rgba(232,201,106,0.3);
          font-family: var(--font-heading, "Cormorant Garamond"), serif; font-style: italic; font-size: 1.05rem;
          color: rgba(245,240,232,0.98); pointer-events: none; z-index: 2;
          transition: opacity 600ms cubic-bezier(0.16,1,0.3,1);
        }
        .sr-numeral { color: rgba(232,201,106,0.92); margin-right: 0.15em; }
        .sr-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; }
        .sr-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.6rem 1.1rem; border-radius: 9999px;
          background: rgba(212,175,55,0.08); border: 1px solid rgba(232,201,106,0.35);
          color: rgba(232,201,106,0.92);
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .sr-advance:hover { background: rgba(232,201,106,0.18); border-color: rgba(255,220,130,0.8); color: rgba(255,230,150,1); }
        .sr-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .sr-fullscreen {
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.82rem;
          color: rgba(220,210,245,0.78); text-decoration: none;
          border-bottom: 1px solid rgba(220,210,245,0.25); padding-bottom: 2px;
          transition: color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .sr-fullscreen:hover { color: rgba(232,201,106,0.95); border-color: rgba(232,201,106,0.6); }
        .sr-fullscreen:focus-visible { outline: 2px solid #E8C96A; outline-offset: 4px; border-radius: 3px; }
        @keyframes srFloat { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-4px); opacity: 0.85; } }
        @keyframes srPulse { 0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.22); } 50% { box-shadow: 0 0 32px rgba(212,175,55,0.42); } }
        @media (prefers-reduced-motion: reduce) { .sr-loading, .sr-hint { animation: none; } }
      `}</style>
    </div>
  );
}
