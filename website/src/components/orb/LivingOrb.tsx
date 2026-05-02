"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sparkles, Preload } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Object3D } from "three";

const ORB_IMAGE = "/orb/your-orb-image.webp";

interface LivingOrbProps {
  isAsking?: boolean;
  isProcessing?: boolean;
  userInputLength?: number;
  scrollProgress?: number;
  className?: string;
}

function OrbShimmerLayer({ hover, pressed, reducedMotion }: { hover: boolean; pressed: boolean; reducedMotion: boolean }) {
  const glowRef = useRef<Object3D & { distort?: number; speed?: number; factor?: number } | null>(null);
  const ringRef = useRef<Object3D | null>(null);

  useFrame((state) => {
    if (!glowRef.current || !ringRef.current) return;
    const t = state.clock.getElapsedTime();
    const baseDistort = reducedMotion ? 0.015 : 0.02 + Math.sin(t * 0.4) * 0.004 + (hover ? 0.015 : 0);
    glowRef.current.distort = baseDistort + (pressed ? 0.01 : 0);
    glowRef.current.speed = 0.06 + (hover ? 0.08 : 0.02);
    glowRef.current.factor = 1.2 + (pressed ? 0.08 : 0);

    ringRef.current.rotation.z = t * (hover ? -0.16 : -0.08);
    ringRef.current.rotation.x = Math.sin(t * 0.12) * 0.05;
  });

  return (
    <>
      <mesh ref={ringRef} position={[0, 0, 0.015]}>
        <circleGeometry args={[1.06, 96]} />
        <meshBasicMaterial
          color="#ffe8b1"
          transparent
          opacity={0.12}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={glowRef} position={[0, 0, 0.02]} scale={1.02}>
        <circleGeometry args={[1.04, 96]} />
        <MeshDistortMaterial
          color="#f8e4b6"
          emissive="#fff1c7"
          emissiveIntensity={0.6}
          roughness={0.35}
          metalness={0.3}
          transparent
          opacity={0.18}
          clearcoat={0.55}
          clearcoatRoughness={0.45}
          radius={1}
          speed={0.08}
          distort={0.03}
          factor={1.2}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Sparkles
        count={12}
        size={0.04}
        speed={0.06}
        scale={[1.08, 1.08, 0.14]}
        noise={0.5}
        color="#ffe6af"
        opacity={0.65}
        position={[0, 0, 0.02]}
      />
    </>
  );
}

function LivingOrbCanvas({ hover, pressed, reducedMotion }: { hover: boolean; pressed: boolean; reducedMotion: boolean }) {
  const dpr = useMemo(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5), []);

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, dpr]}
      frameloop={reducedMotion ? "demand" : "always"}
      style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      camera={{ position: [0, 0, 3.2], fov: 45 }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[0.5, 1.2, 2]} intensity={0.9} color="#fff8e6" />
      <directionalLight position={[-1.3, -0.8, 1]} intensity={0.7} color="#ffd7a3" />
      <OrbShimmerLayer hover={hover} pressed={pressed} reducedMotion={reducedMotion} />
      <Preload all />
    </Canvas>
  );
}

export default function LivingOrb({ className = "" }: LivingOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [supportsWebGL] = useState(() => {
    if (typeof window === "undefined") return false;
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  });
  const [finePointer, setFinePointer] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(pointer: fine)").matches;
  });
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    
    // Intersection Observer for visibility gating
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.1 });
    
    if (containerRef.current) observer.observe(containerRef.current);

    const pointerQuery = window.matchMedia("(pointer: fine)");
    const updatePointer = () => setFinePointer(pointerQuery.matches);
    pointerQuery.addEventListener("change", updatePointer);

    const updateVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      pointerQuery.removeEventListener("change", updatePointer);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const showCanvas = mounted && isVisible && supportsWebGL && finePointer && !reducedMotion && tabVisible;

  const handleTap = () => {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 220);
  };

  return (
    <div
      ref={containerRef}
      className={`living-orb-root ${className} ${hovered ? "hovered" : ""} ${pressed ? "pressed" : ""}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onPointerDown={handleTap}
      onPointerUp={() => setPressed(false)}
      role="img"
      aria-label="Golden celestial orb with living shimmer"
    >
      <div className="living-orb-inner">
        <div className="orb-aura" aria-hidden="true" />

        <div className="orb-base">
          <Image
            src={ORB_IMAGE}
            alt="Golden celestial orb"
            fill
            sizes="(max-width: 640px) 80vw, 420px"
            className="orb-image"
            priority={false}
          />

          <div className="orb-layer orb-glow" aria-hidden="true" />
          <div className="orb-layer orb-surface" aria-hidden="true" />
          <div className="orb-layer orb-highlight" aria-hidden="true" />

          {showCanvas && <LivingOrbCanvas hover={hovered} pressed={pressed} reducedMotion={Boolean(reducedMotion)} />}
        </div>
      </div>

      <style jsx>{`
        .living-orb-root {
          position: relative;
          width: 100%;
          max-width: 420px;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
          will-change: transform, box-shadow;
        }

        .living-orb-root.hovered {
          transform: translateY(-6px) rotateX(1deg) rotateY(1deg);
          box-shadow: 0 34px 80px rgba(134, 87, 255, 0.12), 0 18px 42px rgba(255, 211, 126, 0.12);
        }

        .living-orb-root.pressed {
          transform: translateY(-2px) scale(0.99);
          box-shadow: 0 18px 42px rgba(255, 211, 126, 0.16);
        }

        .living-orb-inner {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          pointer-events: none;
        }

        .orb-aura {
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          background: radial-gradient(circle at 44% 32%, rgba(255, 232, 164, 0.22), transparent 28%),
            radial-gradient(circle at 60% 60%, rgba(163, 119, 255, 0.12), transparent 32%);
          filter: blur(26px);
          opacity: 0.95;
          pointer-events: none;
        }

        .orb-base {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: radial-gradient(circle at 50% 45%, rgba(255, 250, 236, 0.05), transparent 55%);
          box-shadow: inset 0 0 45px rgba(255, 230, 190, 0.12);
        }

        .orb-image {
          position: absolute;
          inset: 0;
          object-fit: cover;
          border-radius: 50%;
          transform: translateZ(0);
        }

        .orb-layer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .orb-glow {
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), transparent 18%),
            radial-gradient(circle at 65% 70%, rgba(255, 205, 115, 0.24), transparent 26%);
          filter: blur(8px);
          opacity: 0.95;
        }

        .orb-surface {
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08), transparent 52%);
          opacity: 0.72;
          transform: translateY(-8px);
        }

        .orb-highlight {
          background: linear-gradient(140deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.0) 38%, rgba(255, 255, 255, 0.16) 63%, rgba(255, 255, 255, 0) 100%);
          opacity: 0.85;
          transform: translateY(-12%) rotate(-18deg);
        }

        .living-orb-root::after {
          content: "";
          position: absolute;
          inset: -10%;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(255, 221, 141, 0.06), transparent 45%);
          pointer-events: none;
        }

        @keyframes orb-breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.0035) translateY(-4px); }
        }

        .living-orb-root {
          animation: orb-breathe 9s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .living-orb-root,
          .living-orb-root.hovered,
          .living-orb-root.pressed {
            animation: none;
            transition: none;
            transform: none;
          }

          .orb-layer,
          .orb-aura {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
