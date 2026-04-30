/**
 * Card.tsx — Individual Card with Brushed Metal & Embossing.
 */

"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface CardProps {
  index: number;
  total: number;
  radius: number;
  span: number;
}

export default function Card({ index, total, radius, span }: CardProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // ── MATH: POSITIONING ──
  const angle = ((index / (total - 1)) - 0.5) * (span * Math.PI / 180);
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius - radius;
  // Face backwards in the arc to show the card back to the camera
  const rotationY = angle + Math.PI;

  // ── MATERIAL SELECTION ──
  const materialProps = useMemo(() => {
    let color = "#0a0e2a"; // Deep Navy
    let metalness = 0.6;
    let roughness = 0.35;
    let iridescence = 0;

    if (index === 4) color = "#a01525"; // Crimson
    if (index === 12) {
      color = "#c9a961"; // Brushed Gold
      metalness = 0.85;
      roughness = 0.25;
    }
    if (index === 18) {
      color = "#b8d4e8"; // Ice Blue
      iridescence = 1;
    }

    return { color, metalness, roughness, iridescence };
  }, [index]);

  // ── PROCEDURAL CARD BACK ──
  const backTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 819;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Background: Cosmic Dark
    const grad = ctx.createRadialGradient(256, 409, 0, 256, 409, 500);
    grad.addColorStop(0, "#221348");
    grad.addColorStop(1, "#04030c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 819);

    // Gold Border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 452, 759);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 432, 739);

    // Central Star
    ctx.translate(256, 409);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(0, i % 2 === 0 ? -120 : -60);
      ctx.rotate(Math.PI / 4);
    }
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.translate(-256, -409);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Subtle Individual Sway
    meshRef.current.rotation.z = Math.sin(time * 0.5 + index * 0.3) * 0.02;
    // Slight Y-Bob
    meshRef.current.position.y = Math.sin(time * 0.7 + index) * 0.008;
  });

  return (
    <group 
      ref={meshRef} 
      position={[x, 0, z]} 
      rotation={[8 * Math.PI / 180, rotationY, 0]}
    >
      <RoundedBox args={[1.0, 1.6, 0.04]} radius={0.03} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial 
          {...materialProps}
          clearcoat={1.0}
          clearcoatRoughness={0.15}
          iridescence={materialProps.iridescence}
          iridescenceIOR={1.3}
          envMapIntensity={0.5}
        />
        
        {/* CARD BACK */}
        <mesh position={[0, 0, 0.021]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.96, 1.56]} />
          <meshBasicMaterial map={backTexture} />
        </mesh>
      </RoundedBox>
    </group>
  );
}

/**
 * CardArc.tsx — Collective Arc Orchestration.
 */
export function CardArc() {
  const groupRef = useRef<THREE.Group>(null);
  const total = 24;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Rotate entire arc group
    groupRef.current.rotation.y += 0.08 * delta;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: total }).map((_, i) => (
        <Card key={i} index={i} total={total} radius={2.8} span={200} />
      ))}
    </group>
  );
}
