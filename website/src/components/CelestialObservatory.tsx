"use client";

import React, { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

/**
 * ObservatoryPlane — Renders a large cosmic plane with smooth parallax.
 * Only runs if device memory/motion allows.
 */
function ObservatoryPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  // Use a high-quality cosmic texture from public assets
  const texture = useTexture("/nebula-bg.webp", (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
  });
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Subtle parallax via pointer events
    const targetX = state.pointer.x * 0.15;
    const targetY = state.pointer.y * 0.15;
    
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.02;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.02;
    
    // Constant slow rotation for "alive" feel
    meshRef.current.rotation.z += 0.00015;
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width * 1.4, viewport.height * 1.4, 1]}>
      <planeGeometry />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0.55} 
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * StaticFallback — Renders when WebGL is disabled or memory is low.
 */
function StaticFallback() {
  return (
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
      style={{ 
        backgroundImage: "url('/nebula-bg.webp')",
        opacity: 0.5
      }}
    />
  );
}

export default function CelestialObservatory() {
  const [{ mounted, shouldRenderWebGL }, setRenderState] = useState({
    mounted: false,
    shouldRenderWebGL: false
  });

  useEffect(() => {
    // Hardware & User Preference Detection
    const checkCapabilities = () => {
      // 1. Check prefers-reduced-motion
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return false;

      // 2. Check Device Memory (if available)
      const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
      if (memory !== undefined && memory < 4) return false;

      // 3. Check Hardware Concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency;
      if (cores !== undefined && cores < 4) return false;

      return true;
    };

    const canRender = checkCapabilities();
    
    requestAnimationFrame(() => {
      setRenderState({
        mounted: true,
        shouldRenderWebGL: canRender
      });
    });
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Dynamic Background */}
      {shouldRenderWebGL ? (
        <Canvas 
          gl={{ 
            antialias: false, 
            powerPreference: "high-performance",
            alpha: true 
          }}
          dpr={[1, 1.5]} // Limit DPR for performance
        >
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
          <Suspense fallback={null}>
            <ObservatoryPlane />
          </Suspense>
        </Canvas>
      ) : (
        <StaticFallback />
      )}

      {/* 
          Readability Architecture: 
          1. Deep base void
          2. Radial focal center (behind content)
          3. Vignette edges
      */}
      <div className="absolute inset-0 bg-[#020106]/40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_10%,rgba(2,1,6,0.8)_85%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020106] via-transparent to-[#020106]/40 pointer-events-none" />
    </div>
  );
}
