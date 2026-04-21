/**
 * CausticsCard.tsx — Option A of the card-shader rethink.
 *
 * The card is always fully visible. A shader caustics pattern (the
 * wavy bright lines you see on the bottom of a pool) plays across the
 * card's surface as multiplicative light. Cursor attention shifts
 * where the brightest peaks fall, so the light feels responsive to
 * the viewer's focus — like candlelight on a reading table.
 *
 * Multiplicative blend mode means the shader can only brighten the
 * card, never obscure it. No hold-gate. No cover. Just light on a
 * real object.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarotCard } from "@/lib/academy/tarot-cards";
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
  uniform vec2 uCursor;
  uniform float uAttention;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUV;

  // Caustics — layered sin/cos at shifting offsets produces the
  // characteristic wavy bright-line pattern of refracted light.
  float caustics(vec2 uv, float t) {
    vec2 p = uv * 6.5;
    float c = 0.0;
    for (int i = 1; i <= 4; i++) {
      float fi = float(i);
      vec2 q = p + vec2(
        sin(t * 0.28 * fi + fi * 1.7),
        cos(t * 0.23 * fi + fi * 2.3)
      );
      c += sin(q.x + sin(q.y + t * 0.34 / fi)) * (0.28 / fi);
    }
    return clamp(c * 0.85 + 0.55, 0.0, 1.0);
  }

  void main() {
    vec2 uv = vUV;
    vec2 asp = vec2(uv.x * uAspect, uv.y);
    vec2 cur = vec2(uCursor.x * uAspect, uCursor.y);

    float c = caustics(asp, uTime);

    // Base caustic lighting — reflected light shimmering across the card
    // surface. Strong enough to be obviously present, not so strong it
    // washes out the card art.
    float base = 0.35 * pow(c, 2.2);

    // Cursor attention — brighter hotspot where the user looks, as if
    // they're holding a candle closer to that part of the card.
    float dist = distance(asp, cur);
    float lens = 1.0 - smoothstep(0.0, 0.50, dist);
    float focus = lens * uAttention * 0.55 * pow(c, 1.8);

    float brighten = base + focus;

    // Card — always fully visible. Multiplicative brighten only.
    vec4 card = texture2D(uCard, uv);
    vec3 final = card.rgb * (1.0 + brighten);

    // On the brightest caustic peaks, add a warm-gold candlelight tint.
    float peak = smoothstep(0.72, 1.0, c);
    final = mix(final, final * vec3(1.45, 1.15, 0.72), peak * 0.55);

    // Darker valleys — deepens the contrast so peaks read as light, not noise.
    float valley = 1.0 - smoothstep(0.0, 0.25, c);
    final *= (1.0 - valley * 0.12);

    // Cursor halo — pale gold disc that follows attention.
    float halo = (1.0 - smoothstep(0.0, 0.12, dist)) * uAttention;
    final += vec3(0.95, 0.82, 0.46) * halo * 0.22;

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

interface CausticsCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

export default function CausticsCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: CausticsCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });
  const attentionRef = useRef(0);
  const cursorInBounds = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const height = Math.round(width * 1.5);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
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

    const uCursor = gl.getUniformLocation(program, "uCursor");
    const uAttention = gl.getUniformLocation(program, "uAttention");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uCard = gl.getUniformLocation(program, "uCard");
    gl.uniform1f(uAspect, width / height);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 8, 26, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(uCard, 0);

    const img = new Image();
    img.src = getCardImagePath(card);
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      setReady(true);
    };

    const start = performance.now();
    const render = () => {
      const elapsed = reducedMotion ? 0 : (performance.now() - start) / 1000;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.name, width, height, reducedMotion]);

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
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowRight", "ArrowLeft", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
      onAdvance?.();
    }
  }, [onAdvance]);

  return (
    <div className="cc" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <div
        className="cc-frame"
        role="button"
        tabIndex={0}
        aria-label={`Today's card: ${card.name}. Move cursor over to shift the light.`}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      >
        <canvas ref={canvasRef} width={width} height={height} aria-hidden />
        {!ready && <div className="cc-loading" aria-hidden>✦</div>}
        <div className="cc-strip" aria-hidden>
          {numeral && <span className="cc-numeral">{numeral}.</span>}
          <span>{card.name}</span>
        </div>
      </div>

      <div className="cc-actions">
        <button type="button" className="cc-advance" onClick={() => onAdvance?.()}>
          <span aria-hidden>✦</span> Different card
        </button>
        <Link href="/academy/card-of-the-day" className="cc-fullscreen">
          Full reading →
        </Link>
      </div>

      <style>{`
        .cc { display: flex; flex-direction: column; gap: 1.1rem; align-items: stretch; margin: 0 auto; }
        .cc-frame {
          position: relative; border-radius: 18px; overflow: hidden; isolation: isolate;
          box-shadow: 0 36px 60px rgba(0, 0, 0, 0.5), 0 0 32px rgba(212, 175, 55, 0.1);
          cursor: crosshair; outline: none;
        }
        .cc-frame:focus-visible { outline: 2px solid rgba(232, 201, 106, 0.85); outline-offset: 3px; }
        .cc-frame canvas { width: 100%; height: 100%; display: block; }
        .cc-loading {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; color: rgba(232, 201, 106, 0.55);
          animation: ccFloat 3.6s cubic-bezier(0.16,1,0.3,1) infinite;
        }
        .cc-strip {
          position: absolute; left: 50%; bottom: 1rem; transform: translateX(-50%);
          display: inline-flex; align-items: baseline; gap: 0.4em; padding: 0.5rem 1rem; border-radius: 9999px;
          background: rgba(6, 4, 26, 0.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          border: 1px solid rgba(232, 201, 106, 0.3);
          font-family: var(--font-heading, "Cormorant Garamond"), serif; font-style: italic; font-size: 1.05rem;
          color: rgba(245, 240, 232, 0.98); pointer-events: none; z-index: 2;
        }
        .cc-numeral { color: rgba(232, 201, 106, 0.92); margin-right: 0.15em; }
        .cc-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; }
        .cc-advance {
          display: inline-flex; align-items: center; gap: 0.45em; padding: 0.6rem 1.1rem; border-radius: 9999px;
          background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(232, 201, 106, 0.35);
          color: rgba(232, 201, 106, 0.92);
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer;
          transition: all 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .cc-advance:hover { background: rgba(232, 201, 106, 0.18); border-color: rgba(255, 220, 130, 0.8); color: rgba(255, 230, 150, 1); }
        .cc-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .cc-fullscreen {
          font-family: var(--font-body, system-ui), sans-serif; font-size: 0.82rem;
          color: rgba(220, 210, 245, 0.78); text-decoration: none;
          border-bottom: 1px solid rgba(220, 210, 245, 0.25); padding-bottom: 2px;
          transition: color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .cc-fullscreen:hover { color: rgba(232, 201, 106, 0.95); border-color: rgba(232, 201, 106, 0.6); }
        .cc-fullscreen:focus-visible { outline: 2px solid #E8C96A; outline-offset: 4px; border-radius: 3px; }
        @keyframes ccFloat { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-4px); opacity: 0.85; } }
        @media (prefers-reduced-motion: reduce) { .cc-loading { animation: none; } }
      `}</style>
    </div>
  );
}
