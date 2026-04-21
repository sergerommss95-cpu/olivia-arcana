/**
 * CinematicVeilCard.tsx — R3F + GSAP + post-processing reveal.
 *
 * A real 3D scene with actual mesh geometry, not a fragment-shader
 * wipe. The veil is a 64×96 tessellated plane with a silk shader;
 * when the drop is triggered, a GSAP timeline animates a uFall
 * uniform that drives vertex displacement (gravity + wind + z-ripple)
 * and fragment opacity in concert. Post-processing runs a subtle
 * bloom pass so the card's gold emissive halo reads correctly when
 * the veil clears.
 *
 * Stack:
 *   • React Three Fiber — Canvas + scene
 *   • @react-three/drei — shaderMaterial helper, OrthographicCamera
 *   • @react-three/postprocessing — EffectComposer, Bloom
 *   • GSAP Timeline — choreographed drop (anticipation → release →
 *     fall → bloom surge → settle)
 *   • Motion — UI-level overlays (hint pill, card-name strip, actions)
 *
 * Choreography (2.8s drop):
 *   0.00–0.25  Anticipation — veil brightens, slight inward pull
 *   0.25–0.70  Release — top begins detaching, gentle sway starts
 *   0.70–2.10  Fall — gravity acceleration, wind, z-ripple, bloom
 *              intensity ramps up as card emerges
 *   2.10–2.50  Clear — veil translates fully below frustum, fades
 *   2.50–2.80  Settle — card rim glow pulses to rest, motes drift
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, extend, useFrame, useLoader } from "@react-three/fiber";
import { OrthographicCamera, shaderMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { TextureLoader } from "three";
import gsap from "gsap";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

// ─────────────────────────────────────────────────────────────────────
//  SHADER MATERIAL — silk veil with iridescent flow + gravity deform
// ─────────────────────────────────────────────────────────────────────

const VEIL_VERTEX = /* glsl */ `
  uniform float uFall;
  uniform float uTime;
  varying vec2 vUv;
  varying float vFall;
  varying float vWind;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  void main() {
    vec3 pos = position;

    // Accelerating fall — quadratic gravity feel
    float fallY = uFall * uFall * 4.0;
    pos.y -= fallY;

    // Wind sway — horizontal noise-perturbed motion during fall
    float windAmp = uFall * 0.12;
    float windBase = sin(uTime * 1.6 + position.y * 2.4 + position.x * 1.8) * 0.4;
    float windNoise = (noise(vec2(position.y * 3.0, uTime * 0.6)) - 0.5) * 0.6;
    float wind = (windBase + windNoise) * windAmp;
    pos.x += wind;

    // Subtle outward spread as the cloth catches air
    pos.x *= 1.0 + uFall * 0.03;

    // Z-wobble — cloth rippling through depth during fall
    float zWobble = sin(uTime * 2.0 + position.y * 5.0 + position.x * 3.0) * 0.06 * uFall;
    pos.z += zWobble;

    // Top vertices get slightly more drag — subtle "whipping" at the top
    float topBias = smoothstep(0.7, 1.5, position.y) * uFall * 0.15;
    pos.y += topBias;

    vUv = uv;
    vFall = uFall;
    vWind = wind;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const VEIL_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uFall;
  varying vec2 vUv;
  varying float vFall;
  varying float vWind;

  const float TAU = 6.28318530718;

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
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  // Iridescence — violet → magenta → gold → teal, smooth loop
  vec3 iridescence(float t) {
    t = fract(t) * 4.0;
    vec3 c0 = vec3(0.14, 0.05, 0.28);
    vec3 c1 = vec3(0.46, 0.14, 0.44);
    vec3 c2 = vec3(0.92, 0.72, 0.36);
    vec3 c3 = vec3(0.18, 0.52, 0.60);
    if (t < 1.0) return mix(c0, c1, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(c1, c2, smoothstep(0.0, 1.0, t - 1.0));
    if (t < 3.0) return mix(c2, c3, smoothstep(0.0, 1.0, t - 2.0));
    return mix(c3, c0, smoothstep(0.0, 1.0, t - 3.0));
  }

  void main() {
    vec2 uv = vUv;

    // Domain-warped flow field for liquid color
    vec2 flow = vec2(
      fbm(uv * 1.4 + vec2(0.0, uTime * 0.10)),
      fbm(uv * 1.4 + vec2(5.2, uTime * 0.09))
    ) - 0.5;

    vec2 liqUV = uv * 1.5 + flow * 0.9 + vec2(uTime * 0.05, uTime * 0.07);
    float liqNoise = fbm(liqUV);
    vec3 liquidCol = iridescence(liqNoise + uTime * 0.035);

    // Gloss streaks — bright diagonals
    vec2 streakUV = uv + flow * 0.3 + vec2(uTime * 0.09, uTime * 0.04);
    float streak = fbm(streakUV * 3.0 + vec2(7.3));
    streak = pow(smoothstep(0.60, 0.88, streak), 4.0);
    vec3 col = liquidCol + vec3(1.0, 0.93, 0.74) * streak * 0.55;

    // Uneven vertical curtain folds
    float foldX = uv.x + fbm(vec2(uv.y * 1.2, 0.7)) * 0.08;
    float foldPhase = fbm(vec2(foldX * 2.2, 0.0)) * 3.0;
    float primaryFold = sin(foldX * 7.0 + foldPhase);
    float secondaryFold = sin(foldX * 18.0) * 0.3;
    float foldSignal = (primaryFold + secondaryFold) * 0.5 + 0.5;
    foldSignal = smoothstep(0.15, 0.92, foldSignal);
    col *= 0.58 + 0.42 * foldSignal;

    // Gold ridge highlights on the peaks
    float peakRidge = smoothstep(0.78, 0.98, foldSignal);
    col += vec3(0.94, 0.80, 0.46) * peakRidge * 0.22;

    // Mid-fall whoosh brightening
    float whoosh = smoothstep(0.10, 0.40, vFall) * (1.0 - smoothstep(0.45, 0.85, vFall));
    col += vec3(1.0, 0.86, 0.52) * whoosh * 0.40;

    // Wind-driven highlight — the parts being blown brighten slightly
    col += vec3(1.0, 0.85, 0.55) * abs(vWind) * 1.2;

    // Opacity — fades in the last 22% of the fall
    float alpha = 1.0 - smoothstep(0.78, 1.0, vFall);

    gl_FragColor = vec4(col, alpha);
  }
`;

const VeilMaterial = shaderMaterial(
  { uFall: 0, uTime: 0 },
  VEIL_VERTEX,
  VEIL_FRAGMENT
);
extend({ VeilMaterial });

// TypeScript module-augment so <veilMaterial /> works in JSX
declare module "@react-three/fiber" {
  interface ThreeElements {
    veilMaterial: unknown;
  }
}

// ─────────────────────────────────────────────────────────────────────
//  SCENE COMPONENTS
// ─────────────────────────────────────────────────────────────────────

interface SceneRefs {
  fall: { value: number };
  emissive: { value: number };
}

/** The card — a plane with the tarot texture + emissive rim glow. */
function Card({
  texture,
  emissiveRef,
}: {
  texture: THREE.Texture;
  emissiveRef: React.MutableRefObject<{ value: number }>;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = emissiveRef.current.value;
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[2, 3, 1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        map={texture}
        emissive={new THREE.Color(0xE8C96A)}
        emissiveMap={texture}
        emissiveIntensity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

/** The veil — tessellated plane with silk shader material. */
function Veil({ fallRef }: { fallRef: React.MutableRefObject<{ value: number }> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uFall.value = fallRef.current.value;
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[2.05, 3.05, 48, 72]} />
      <veilMaterial
        ref={matRef}
        transparent
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/** The three-point lighting rig for depth + rim feel. */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#FFE7B5" />
      <pointLight position={[-2, -2, 2]} intensity={0.6} color="#A07AE0" />
    </>
  );
}

/** The scene — mounted inside the Canvas. */
function VeilScene({
  cardImagePath,
  fallRef,
  emissiveRef,
}: {
  cardImagePath: string;
  fallRef: React.MutableRefObject<{ value: number }>;
  emissiveRef: React.MutableRefObject<{ value: number }>;
}) {
  const texture = useLoader(TextureLoader, cardImagePath);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
  }, [texture]);

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={180} near={0.1} far={50} />
      <Lights />
      <Card texture={texture} emissiveRef={emissiveRef} />
      <Veil fallRef={fallRef} />
      <EffectComposer>
        <Bloom
          intensity={0.75}
          luminanceThreshold={0.62}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  REACT WRAPPER — animation orchestration + UI overlays
// ─────────────────────────────────────────────────────────────────────

interface CinematicVeilCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

export default function CinematicVeilCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: CinematicVeilCardProps) {
  const height = Math.round(width * 1.5);
  const fallRef = useRef({ value: 0 });
  const emissiveRef = useRef({ value: 0 });
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset on card change
  useEffect(() => {
    timelineRef.current?.kill();
    fallRef.current.value = 0;
    emissiveRef.current.value = 0;
    setRevealed(false);
  }, [card.name]);

  const toggleVeil = useCallback(() => {
    timelineRef.current?.kill();
    const goingDown = !revealed;
    setRevealed(goingDown);

    if (reducedMotion) {
      fallRef.current.value = goingDown ? 1 : 0;
      emissiveRef.current.value = goingDown ? 0.5 : 0;
      return;
    }

    const tl = gsap.timeline();

    if (goingDown) {
      // ── DROP TIMELINE — 2.8s total, choreographed in 4 beats ──
      tl.to(fallRef.current, {
        value: 1,
        duration: 2.8,
        ease: "power3.in",
      });
      // Bloom: card emissive ramps up starting at 0.8s, peaks at 2.4s
      tl.to(
        emissiveRef.current,
        { value: 0.85, duration: 1.6, ease: "power2.out" },
        "0.8"
      );
      // Settle: emissive pulls back to steady rim glow
      tl.to(
        emissiveRef.current,
        { value: 0.45, duration: 0.7, ease: "power2.inOut" },
        "2.4"
      );
    } else {
      // ── RAISE TIMELINE — 1.6s ──
      tl.to(fallRef.current, {
        value: 0,
        duration: 1.6,
        ease: "power2.inOut",
      });
      tl.to(
        emissiveRef.current,
        { value: 0, duration: 1.0, ease: "power2.inOut" },
        "0"
      );
    }

    timelineRef.current = tl;
  }, [revealed, reducedMotion]);

  const handleClick = useCallback(() => toggleVeil(), [toggleVeil]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleVeil(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); onAdvance?.();
      }
    },
    [toggleVeil, onAdvance]
  );

  return (
    <div className="cvk" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <motion.div
        className="cvk-frame"
        role="button"
        tabIndex={0}
        aria-label={
          revealed
            ? `${card.name} revealed. Tap to re-veil.`
            : `Tap to drop the veil and reveal today's card.`
        }
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        animate={revealed ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
          camera={{ position: [0, 0, 5] }}
        >
          <VeilScene
            cardImagePath={getCardImagePath(card)}
            fallRef={fallRef}
            emissiveRef={emissiveRef}
          />
        </Canvas>

        <AnimatePresence>
          {!revealed && (
            <motion.div
              className="cvk-hint"
              aria-hidden
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="cvk-hint-dot" /> Tap to drop the veil
            </motion.div>
          )}
          {revealed && (
            <motion.div
              className="cvk-strip"
              aria-hidden
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              {numeral && <span className="cvk-numeral">{numeral}.</span>}
              <span>{card.name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="cvk-actions">
        <button type="button" className="cvk-toggle" onClick={toggleVeil}>
          <span aria-hidden>{revealed ? "✦" : "↓"}</span>
          {revealed ? "Re-veil" : "Drop the veil"}
        </button>
        <button type="button" className="cvk-advance" onClick={() => onAdvance?.()}>
          Different card →
        </button>
      </div>

      <style>{`
        .cvk { display: flex; flex-direction: column; gap: 1.1rem; align-items: stretch; margin: 0 auto; }
        .cvk-frame {
          position: relative; border-radius: 18px; overflow: hidden; isolation: isolate;
          box-shadow: 0 36px 60px rgba(0,0,0,0.5), 0 0 32px rgba(212,175,55,0.12);
          outline: none; cursor: pointer;
        }
        .cvk-frame:focus-visible { outline: 2px solid rgba(232,201,106,0.95); outline-offset: 3px; }
        .cvk-frame canvas { width: 100% !important; height: 100% !important; display: block; }

        .cvk-hint, .cvk-strip {
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
        .cvk-hint {
          border: 1px solid rgba(232,201,106,0.58);
          color: rgba(232,201,106,0.98);
          box-shadow: 0 0 24px rgba(212,175,55,0.24);
        }
        .cvk-hint-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(232,201,106,1);
          box-shadow: 0 0 14px rgba(232,201,106,0.95);
        }
        .cvk-strip {
          border: 1px solid rgba(232,201,106,0.42);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic; font-size: 1.1rem; letter-spacing: 0;
          text-transform: none;
          color: rgba(245,240,232,0.98);
          gap: 0.25em; align-items: baseline;
          box-shadow: 0 0 28px rgba(212,175,55,0.22);
        }
        .cvk-numeral { color: rgba(232,201,106,0.92); margin-right: 0.15em; }

        .cvk-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; }
        .cvk-toggle, .cvk-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.62rem 1.15rem; border-radius: 9999px;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer;
          transition: all 220ms cubic-bezier(0.16,1,0.3,1);
        }
        .cvk-toggle {
          background: linear-gradient(135deg, rgba(212,175,55,0.26), rgba(212,175,55,0.12));
          border: 1px solid rgba(232,201,106,0.52);
          color: rgba(232,201,106,1);
          box-shadow: 0 0 22px rgba(212,175,55,0.18);
        }
        .cvk-toggle:hover {
          background: linear-gradient(135deg, rgba(232,201,106,0.38), rgba(212,175,55,0.20));
          border-color: rgba(255,220,130,0.9);
          color: rgba(255,230,150,1);
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(212,175,55,0.3);
        }
        .cvk-toggle:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .cvk-advance {
          background: transparent;
          border: 1px solid rgba(200,185,255,0.20);
          color: rgba(220,210,245,0.72);
        }
        .cvk-advance:hover { color: rgba(245,240,232,0.98); border-color: rgba(200,185,255,0.4); }
        .cvk-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
      `}</style>
    </div>
  );
}
