/**
 * EdgeLitCard.tsx — Option D of the card-shader rethink.
 *
 * The card image itself is untouched — a plain, crisp <img>. The
 * shader lives in a ring AROUND the card. Signed-distance-field
 * rectangle defines the "corridor" outside the card bounds; inside
 * that corridor a drifting aurora / liquid-metal ribbon plays.
 *
 * Cursor attention brightens the ring, as if leaning toward the card
 * pulls more light around it.
 *
 * Card stays a finished artifact; the shader is the atmosphere around
 * it. Most conservative of the four options visually — the card is
 * what it is.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

// Canvas extends PAD pixels beyond the card on each side to host the shader.
const PAD = 80;

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
  uniform float uTime;
  uniform float uAttention;   // 0..1 — cursor proximity
  uniform vec2 uCardHalf;     // half-size of the card in 0..1 canvas coords
  uniform float uCornerRadius; // rounded corner, same space
  varying vec2 vUV;

  // Signed distance function for a rounded rectangle
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  // Cheap noise for ribbon modulation
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  void main() {
    // Canvas uv centered at origin
    vec2 p = vUV - 0.5;

    // Distance to card edge (positive outside the card)
    float d = sdRoundedBox(p, uCardHalf, uCornerRadius);

    // Inside the card — let through to the <img> below
    if (d <= 0.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Aurora ribbon, modulated by position around the card and time
    float angle = atan(p.y, p.x);            // -π .. π
    float ribbon1 = sin(angle * 3.0 + uTime * 0.55);
    float ribbon2 = sin(angle * 2.0 - uTime * 0.32 + 1.7);
    float ribbon = ribbon1 * 0.55 + ribbon2 * 0.45;
    ribbon = ribbon * 0.5 + 0.5; // 0..1

    // Subtle fbm-ish wobble so the ribbon has depth
    float wobble = noise(vec2(angle * 6.0 + uTime * 0.4, d * 20.0));

    // Aurora color ramp: violet → gold → teal
    vec3 violet = vec3(0.45, 0.28, 0.68);
    vec3 gold   = vec3(0.92, 0.79, 0.42);
    vec3 teal   = vec3(0.28, 0.76, 0.72);
    vec3 rib = mix(violet, gold, smoothstep(0.25, 0.65, ribbon));
    rib = mix(rib, teal, smoothstep(0.75, 0.95, ribbon));

    // Fall-off from card edge — strong right at the edge, tapers out to
    // the canvas padding. Wider than before so the ring is obviously
    // drawn even at rest.
    float falloff = 1.0 - smoothstep(0.0, 0.16, d);
    falloff = pow(falloff, 1.1);

    // Baseline glow + attention boost
    float strength = falloff * (0.95 + 0.6 * uAttention);
    strength *= (0.78 + 0.22 * wobble);

    vec3 col = rib * strength;

    // Warm bloom at the immediate edge — makes the card feel rim-lit.
    float bloom = falloff * falloff * 0.7;
    col += gold * bloom * (0.35 + 0.35 * uAttention);

    // Final alpha — pre-multiply for additive blending with the page
    gl_FragColor = vec4(col, strength);
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

interface EdgeLitCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

export default function EdgeLitCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: EdgeLitCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const attentionRef = useRef(0);
  const cursorInBounds = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const cardHeight = Math.round(width * 1.5);
  const canvasW = width + PAD * 2;
  const canvasH = cardHeight + PAD * 2;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    // Additive blend so the aurora adds light on top of the dark page
    gl.blendFunc(gl.ONE, gl.ONE);

    const program = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    gl.useProgram(program);

    const positions = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const uvs = new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]); // standard
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

    const uTime = gl.getUniformLocation(program, "uTime");
    const uAttention = gl.getUniformLocation(program, "uAttention");
    const uCardHalf = gl.getUniformLocation(program, "uCardHalf");
    const uCornerRadius = gl.getUniformLocation(program, "uCornerRadius");

    // Card takes up `width / canvasW` of the canvas, half-size in 0..1 space
    const halfW = width / 2 / canvasW;
    const halfH = cardHeight / 2 / canvasH;
    gl.uniform2f(uCardHalf, halfW, halfH);
    gl.uniform1f(uCornerRadius, 18 / canvasW);

    const start = performance.now();
    const render = () => {
      const elapsed = reducedMotion ? 0 : (performance.now() - start) / 1000;
      const target = cursorInBounds.current ? 1 : 0;
      attentionRef.current += (target - attentionRef.current) * 0.06;

      gl.useProgram(program);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uAttention, attentionRef.current);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteBuffer(posBuf); gl.deleteBuffer(uvBuf);
    };
  }, [canvasW, canvasH, width, cardHeight, reducedMotion]);

  const handlePointerEnter = useCallback(() => { cursorInBounds.current = true; }, []);
  const handlePointerLeave = useCallback(() => { cursorInBounds.current = false; }, []);
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowRight", "ArrowLeft", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
      onAdvance?.();
    }
  }, [onAdvance]);

  return (
    <div className="el" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <div
        className="el-container"
        role="button"
        tabIndex={0}
        aria-label={`Today's card: ${card.name}. Hover to intensify the ring around it.`}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        style={{ width: `${canvasW}px`, height: `${canvasH}px` }}
      >
        {/* Canvas — absolute, fills container, behind the card */}
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className="el-canvas"
          aria-hidden
        />

        {/* Card image — untouched, centered over the canvas */}
        <div className="el-card-wrap" style={{ width: `${width}px`, height: `${cardHeight}px` }}>
          <img
            src={getCardImagePath(card)}
            alt={card.name}
            width={width}
            height={cardHeight}
            className="el-card-img"
          />
          <div className="el-strip" aria-hidden>
            {numeral && <span className="el-numeral">{numeral}.</span>}
            <span>{card.name}</span>
          </div>
        </div>
      </div>

      <div className="el-actions">
        <button type="button" className="el-advance" onClick={() => onAdvance?.()}>
          <span aria-hidden>✦</span> Different card
        </button>
        <Link href="/academy/card-of-the-day" className="el-fullscreen">
          Full reading →
        </Link>
      </div>

      <style>{`
        .el {
          display: flex; flex-direction: column; gap: 1.1rem; align-items: center; margin: 0 auto;
        }
        .el-container {
          position: relative; outline: none;
          display: flex; align-items: center; justify-content: center;
          margin: -${PAD}px; /* counteract canvas padding so layout stays card-sized */
        }
        .el-container:focus-visible { outline: none; }
        .el-container:focus-visible .el-card-wrap {
          outline: 2px solid rgba(232,201,106,0.85); outline-offset: 3px;
          border-radius: 18px;
        }
        .el-canvas {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          display: block; pointer-events: none; z-index: 1;
        }
        .el-card-wrap {
          position: relative; z-index: 2;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 28px 50px rgba(0,0,0,0.45);
        }
        .el-card-img {
          display: block; width: 100%; height: auto;
          border-radius: 18px;
        }
        .el-strip {
          position: absolute; left: 50%; bottom: 0.9rem; transform: translateX(-50%);
          display: inline-flex; align-items: baseline; gap: 0.4em;
          padding: 0.45rem 0.95rem; border-radius: 9999px;
          background: rgba(6,4,26,0.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          border: 1px solid rgba(232,201,106,0.3);
          font-family: var(--font-heading, "Cormorant Garamond"), serif; font-style: italic; font-size: 1.02rem;
          color: rgba(245,240,232,0.98); pointer-events: none;
        }
        .el-numeral { color: rgba(232,201,106,0.92); margin-right: 0.15em; }
        .el-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; }
        .el-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.6rem 1.1rem; border-radius: 9999px;
          background: rgba(212,175,55,0.08); border: 1px solid rgba(232,201,106,0.35);
          color: rgba(232,201,106,0.92);
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .el-advance:hover { background: rgba(232,201,106,0.18); border-color: rgba(255,220,130,0.8); color: rgba(255,230,150,1); }
        .el-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .el-fullscreen {
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.82rem;
          color: rgba(220,210,245,0.78); text-decoration: none;
          border-bottom: 1px solid rgba(220,210,245,0.25); padding-bottom: 2px;
          transition: color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .el-fullscreen:hover { color: rgba(232,201,106,0.95); border-color: rgba(232,201,106,0.6); }
        .el-fullscreen:focus-visible { outline: 2px solid #E8C96A; outline-offset: 4px; border-radius: 3px; }
      `}</style>
    </div>
  );
}
