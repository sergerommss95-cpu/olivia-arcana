/**
 * SlashHero.tsx — Standalone Hero Entry Point.
 */

"use client";

import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, ContactShadows } from "@react-three/drei";
import CardArc from "./CardArc";
import Lighting, { PostFX } from "./Lighting";
import HeroOverlay from "./HeroOverlay";

export default function SlashHero() {
  const arcRef = useRef<THREE.Group>(null);

  return (
    <div className="relative w-full h-screen bg-[#000000] overflow-hidden">
      {/* ── HTML OVERLAY (Top Layer) ── */}
      <HeroOverlay />

      {/* ── 3D SCENE (Background Layer) ── */}
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          toneMapping: 4, // ACESFilmic
          toneMappingExposure: 1.1 
        }}
        className="w-full h-full"
      >
        <PerspectiveCamera 
          makeDefault 
          fov={35} 
          position={[0, 1.2, 4.5]} 
        />
        
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 2, 8]} />

        <Suspense fallback={null}>
          <SceneContent arcRef={arcRef} />
          <Lighting />
          <PostFX />
        </Suspense>
      </Canvas>
    </div>
  );
}

function SceneContent({ arcRef }: { arcRef: React.RefObject<THREE.Group | null> }) {
  useFrame((state, delta) => {
    if (arcRef.current) {
      arcRef.current.rotation.y += 0.08 * delta;
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      <group ref={arcRef}>
        {Array.from({ length: 24 }).map((_, i) => (
          <CardArc key={i} index={i} total={24} radius={2.8} span={200} />
        ))}
      </group>
      
      {/* INVISIBLE GROUND FOR SHADOWS */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.4} />
      </mesh>
      
      <ContactShadows 
        position={[0, -0.7, 0]} 
        opacity={0.6} 
        scale={10} 
        blur={4} 
        far={2} 
      />
    </group>
  );
}
