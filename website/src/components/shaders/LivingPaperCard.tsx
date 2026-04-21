/**
 * LivingPaperCard.tsx — the card is always visible; cursor attention
 * clears a "living paper" veil locally. No hold-gate. No navigation.
 *
 * Implementation: raw WebGL, one fullscreen quad, one fragment shader.
 * Domain-warped fbm drives the paper texture; a cursor-distance
 * attention field punches a soft lens through it so the card reads
 * clearly under focus and softens when attention drifts.
 *
 * ~200 lines including the GLSL. No Three.js, no physics, no
 * postprocessing. Runs on the GPU as a single draw call per frame.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

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
  uniform vec2 uCursor;       // 0..1 in UV space
  uniform float uAttention;   // 0..1 — strength of cursor lens (fades in/out)
  uniform float uTime;        // seconds
  uniform float uAspect;      // width / height
  varying vec2 vUV;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.52;
    }
    return v;
  }

  void main() {
    vec2 uv = vUV;
    vec2 asp = vec2(uv.x * uAspect, uv.y);
    vec2 cur = vec2(uCursor.x * uAspect, uCursor.y);

    // Domain-warped fbm — organic ink-like flow
    vec2 q = vec2(
      fbm(asp * 1.5 + vec2(0.0, uTime * 0.06)),
      fbm(asp * 1.5 + vec2(3.1, 1.7) + vec2(uTime * 0.05, 0.0))
    );
    float n = fbm(asp * 2.4 + q * 1.2 + vec2(uTime * 0.04, -uTime * 0.03));

    // Cursor attention — clears the paper in a radius around the pointer
    float dist = distance(asp, cur);
    float lens = 1.0 - smoothstep(0.0, 0.32, dist);
    lens = pow(lens, 1.6) * uAttention;

    // Baseline paper — visibly present as a living ink texture, but the
    // card underneath is always readable. Cursor attention thins it
    // locally so the card crisps up under focus.
    float basePaper = 0.20 + 0.18 * n;       // range 0.20..0.38
    float paper = clamp(basePaper - lens * 0.34, 0.0, 1.0);

    // Paper color — void base with gold shimmer on "folds" (high n regions)
    vec3 paperVoid = vec3(0.024, 0.016, 0.102);     // --c-void
    vec3 paperGold = vec3(0.914, 0.788, 0.416);     // --c-gold
    float shimmer = smoothstep(0.62, 0.95, n);
    vec3 paperColor = mix(paperVoid, paperGold, shimmer * 0.55);

    vec4 card = texture2D(uCard, uv);
    vec3 final = mix(card.rgb, paperColor, paper);

    // Soft gold rim glow around the cursor lens — gives feedback that
    // focus is doing something, without being a heavy UI element.
    float rim = smoothstep(0.28, 0.32, dist) - smoothstep(0.32, 0.38, dist);
    final += vec3(0.92, 0.79, 0.42) * rim * 0.22 * uAttention;

    gl_FragColor = vec4(final, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("shader compile: " + info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("createProgram failed");
  const v = compileShader(gl, gl.VERTEX_SHADER, vs);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("program link: " + info);
  }
  return program;
}

interface LivingPaperCardProps {
  card: TarotCard;
  numeral?: string;
  /** Width in px (height auto from 2:3 aspect). Default 360. */
  width?: number;
  /** Callback when user advances to another card (keyboard or button). */
  onAdvance?: () => void;
}

export default function LivingPaperCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: LivingPaperCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });
  const attentionRef = useRef(0); // smoothed 0..1
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const height = Math.round(width * 1.5); // 2:3 tarot aspect

  // Track reduced-motion — keep shader running but freeze time
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Mount WebGL once; reload the card texture whenever the card prop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.warn("[LivingPaperCard] WebGL unavailable — card will fall back to plain image");
      return;
    }

    // Pixel ratio — cap at 2 for perf
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const program = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    gl.useProgram(program);

    // Fullscreen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]); // flipped Y so card is upright
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uCursor = gl.getUniformLocation(program, "uCursor");
    const uAttention = gl.getUniformLocation(program, "uAttention");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uCard = gl.getUniformLocation(program, "uCard");

    gl.uniform1f(uAspect, width / height);

    // Texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // 1-pixel placeholder while image loads
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([10, 8, 26, 255])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(uCard, 0);

    // No crossOrigin — same-origin images; setting it can break loading
    // in some browsers even when the request is same-origin.
    const img = new Image();
    img.src = getCardImagePath(card);
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      setReady(true);
    };

    startTimeRef.current = performance.now();

    const render = () => {
      const now = performance.now();
      const elapsed = reducedMotion ? 0 : (now - startTimeRef.current) / 1000;

      // Smooth the attention value — ease toward target
      const target = cursorInBounds.current ? 1 : 0;
      attentionRef.current += (target - attentionRef.current) * 0.08;

      gl.useProgram(program);
      gl.uniform2f(uCursor, cursorRef.current.x, cursorRef.current.y);
      gl.uniform1f(uAttention, attentionRef.current);
      gl.uniform1f(uTime, elapsed);

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
    // card.name in deps so a new card triggers texture reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.name, width, height, reducedMotion]);

  // Cursor tracking
  const cursorInBounds = useRef(false);
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      cursorRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      };
      cursorInBounds.current = true;
    },
    []
  );
  const handlePointerLeave = useCallback(() => {
    cursorInBounds.current = false;
  }, []);
  const handlePointerEnter = useCallback(() => {
    cursorInBounds.current = true;
  }, []);

  // Keyboard navigation — Left/Right advance, Enter activates
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onAdvance?.();
      }
    },
    [onAdvance]
  );

  return (
    <div className="lpc" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <div
        className="lpc-frame"
        role="button"
        tabIndex={0}
        aria-label={`Today's card: ${card.name}. Move cursor over to focus, or press arrow keys to draw another.`}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          aria-hidden
        />

        {!ready && (
          <div className="lpc-loading" aria-hidden>
            <span>✦</span>
          </div>
        )}

        {/* Card name strip — always visible at bottom, small caps */}
        <div className="lpc-strip" aria-hidden>
          {numeral && <span className="lpc-numeral">{numeral}.</span>}
          <span className="lpc-name">{card.name}</span>
        </div>
      </div>

      {/* Secondary controls below the card */}
      <div className="lpc-actions">
        <button
          type="button"
          className="lpc-advance"
          onClick={() => onAdvance?.()}
          aria-label="Draw a different card"
        >
          <span aria-hidden>✦</span> Different card
        </button>
        <Link href="/academy/card-of-the-day" className="lpc-fullscreen">
          Full reading →
        </Link>
      </div>

      <style>{`
        .lpc {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          align-items: stretch;
          margin: 0 auto;
        }
        .lpc-frame {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 36px 60px rgba(0, 0, 0, 0.5),
            0 0 32px rgba(212, 175, 55, 0.1);
          isolation: isolate;
          cursor: crosshair;
          outline: none;
        }
        .lpc-frame:focus-visible {
          outline: 2px solid rgba(232, 201, 106, 0.85);
          outline-offset: 3px;
        }
        .lpc-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          color: rgba(232, 201, 106, 0.55);
          animation: lpcFloat 3.6s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .lpc-strip {
          position: absolute;
          left: 50%;
          bottom: 1rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: baseline;
          gap: 0.4em;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.55);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(232, 201, 106, 0.3);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.05rem;
          color: rgba(245, 240, 232, 0.98);
          pointer-events: none;
          z-index: 2;
        }
        .lpc-numeral {
          color: rgba(232, 201, 106, 0.92);
          margin-right: 0.15em;
        }
        .lpc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
          justify-content: center;
          align-items: center;
        }
        .lpc-advance {
          display: inline-flex;
          align-items: center;
          gap: 0.45em;
          padding: 0.6rem 1.1rem;
          border-radius: 9999px;
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(232, 201, 106, 0.35);
          color: rgba(232, 201, 106, 0.92);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .lpc-advance:hover {
          background: rgba(232, 201, 106, 0.18);
          border-color: rgba(255, 220, 130, 0.8);
          color: rgba(255, 230, 150, 1);
        }
        .lpc-advance:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 3px;
        }
        .lpc-fullscreen {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.82rem;
          color: rgba(220, 210, 245, 0.78);
          text-decoration: none;
          border-bottom: 1px solid rgba(220, 210, 245, 0.25);
          padding-bottom: 2px;
          transition: color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .lpc-fullscreen:hover {
          color: rgba(232, 201, 106, 0.95);
          border-color: rgba(232, 201, 106, 0.6);
        }
        .lpc-fullscreen:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
        @keyframes lpcFloat {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lpc-loading { animation: none; }
        }
      `}</style>
    </div>
  );
}
