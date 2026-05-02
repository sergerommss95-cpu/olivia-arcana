/**
 * TarotDeck3D.tsx — SYNASTRY EDITION.
 * 
 * FEATURES:
 * - Hyper-sharable URL Sync (?draw=x,y,z).
 * - Editorial Data Mapping.
 * - Dynamic Arc Gap Filling.
 */

"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Center, ContactShadows, Environment, PerspectiveCamera } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import TarotCard3D from "./TarotCard3D";

// ── TASK 7: EDITORIAL DATA ──
export const ORACLE_DATA = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  name: i === 4 ? "The Crimson Pivot" : i === 12 ? "The Golden Rule" : i === 18 ? "The Ice Mirror" : `Arcana ${i}`,
  meaning: "The interpretation of this resonance is unfolding."
}));

export default function TarotDeck3D() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const totalCards = 24;

  // ── SYNASTRY LINK (URL HYDRATION) ──
  useEffect(() => {
    const drawParam = searchParams.get("draw");
    if (drawParam) {
      const indices = drawParam.split(",").map(Number).filter(n => !isNaN(n) && n < totalCards);
      requestAnimationFrame(() => setSelectedCards(indices.slice(0, 3))); 
    }
  }, [searchParams]);

  // Sync URL when selection changes
  useEffect(() => {
    const draw = selectedCards.join(",");
    const params = new URLSearchParams(searchParams.toString());
    if (draw) {
      params.set("draw", draw);
    } else {
      params.delete("draw");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedCards, router, searchParams]);

  // ── DYNAMIC ARC RECALCULATION ──
  const remainingIndices = useMemo(() => {
    return Array.from({ length: totalCards })
      .map((_, i) => i)
      .filter(i => !selectedCards.includes(i));
  }, [selectedCards]);

  const handleCardClick = useCallback((index: number) => {
    setSelectedCards(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length < 3) return [...prev, index];
      return prev;
    });
  }, []);

  const handleHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  // ── CONTINUOUS ARC ROTATION ──
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.08 * delta;
    }
  });

  return (
    <>
      {/* ── CINEMATIC CAMERA ── */}
      <PerspectiveCamera 
        makeDefault 
        fov={35} 
        position={[0, 1.2, 4.5]} 
      />

      <Center position={[0, -0.5, 0]}>
        <group ref={groupRef}>
          {Array.from({ length: totalCards }).map((_, i) => {
            const relativeIndex = remainingIndices.indexOf(i);
            const activeTotal = remainingIndices.length;

            return (
              <TarotCard3D
                key={i}
                index={i}
                relativeIndex={relativeIndex}
                activeTotal={activeTotal}
                hoveredIndex={hoveredIndex}
                selectedCards={selectedCards}
                onClick={handleCardClick}
                onHover={handleHover}
              />
            );
          })}
        </group>
      </Center>

      {/* ── LIGHTING (THE SECRET SAUCE) ── */}
      <ambientLight intensity={0.08} color="#1a1a2e" />
      
      <spotLight 
        position={[2, 4, 3]} 
        intensity={8} 
        angle={0.4} 
        penumbra={0.8} 
        color="#fff5e6" 
        castShadow 
      />

      <directionalLight 
        position={[-3, 1, -2]} 
        intensity={1.2} 
        color="#4a6fa5" 
      />

      <pointLight 
        position={[0, -1, 2]} 
        intensity={0.5} 
        color="#2a1f3d" 
      />

      {/* ── POST-PROCESSING ── */}
      <EffectComposer enableNormalPass={false} multisampling={8}>
        <Bloom 
          intensity={0.4} 
          luminanceThreshold={0.9} 
          mipmapBlur 
          radius={0.6} 
        />
        <Vignette offset={0.3} darkness={0.7} />
        <ChromaticAberration 
          offset={new THREE.Vector2(0.0005, 0.0005)} 
        />
        <Noise opacity={0.04} />
      </EffectComposer>

      <Environment preset="studio" environmentIntensity={0.3} />
      
      {/* Contact Shadows for grounding */}
      <ContactShadows 
        position={[0, -1.2, 0]} 
        opacity={0.6} 
        scale={10} 
        blur={4} 
        far={2} 
      />
    </>
  );
}
