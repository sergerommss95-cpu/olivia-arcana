/**
 * TarotCard3D.tsx — PRINCIPAL ARCHITECT EDITION.
 * 
 * MATERIALS: Matte Velvet + Stamped Gold Foil.
 * PHYSICS: Dynamic Arc Recalculation & Elegant 3-Stage Draw.
 */

"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

// ── PHASE 1: GOLD FOIL SHADER ──
const FoilShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uLogo: null,
    uGold: new THREE.Color("#d4af37"),
    uBackground: new THREE.Color("#050508"), // Deep Velvet Black
    uHover: 0.0,
  },
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  `
  uniform float uTime;
  uniform sampler2D uLogo;
  uniform vec3 uGold;
  uniform vec3 uBackground;
  uniform float uHover;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 logo = texture2D(uLogo, vUv);
    
    // 1. Matte Velvet Background
    vec3 color = uBackground;
    
    // 2. Gold Foil Simulation
    // Use view direction for a subtle metallic glint on the logo
    float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
    float glint = smoothstep(0.4, 0.6, sin(vUv.x * 10.0 + vUv.y * 5.0 + uTime * 0.5));
    vec3 foilColor = uGold * (0.8 + glint * 0.4 + fresnel * 0.5);
    
    // Mix based on logo alpha
    color = mix(color, foilColor, logo.r);
    
    // Add subtle galaxy "stardust" (extremely low intensity)
    float stardust = fract(sin(dot(vUv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    color += uGold * step(0.9995, stardust) * 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
  `
);

import { extend } from "@react-three/fiber";
extend({ FoilShaderMaterial });

interface CardProps {
  index: number;
  relativeIndex: number; // For arc recalculation
  activeTotal: number;   // For arc recalculation
  hoveredIndex: number | null;
  selectedCards: number[];
  onClick: (index: number) => void;
  onHover: (index: number | null) => void;
}

export default function TarotCard3D({ 
  index, 
  relativeIndex,
  activeTotal,
  hoveredIndex,
  selectedCards,
  onClick, 
  onHover
}: CardProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const isSelected = selectedCards.includes(index);
  const selIdx = selectedCards.indexOf(index);

  // ── CINEMATIC ARC MATH (Slash Spec: Radius 2.8, Span 200°) ──
  const radius = 2.8;
  const span = (200 * Math.PI) / 180;
  const step = span / Math.max(1, activeTotal - 1);
  const angle = -span / 2 + step * relativeIndex;

  // ── PROCEDURAL LOGO (Card Back) ──
  const backTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 819; // Vertical aspect ratio
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

    // Central "Card of the Day" Logo (Wheel / Star)
    ctx.translate(256, 409);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(0, i % 2 === 0 ? -120 : -60);
      ctx.rotate(Math.PI / 4);
    }
    ctx.stroke();
    
    // Center Circle
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Reset transform
    ctx.translate(-256, -409);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // ── CARD MATERIAL SPECS ──
  const isCrimson = index === 4;
  const isGold = index === 12;
  const isIce = index === 18;

  const cardColor = isCrimson ? "#a01525" : isGold ? "#c9a961" : isIce ? "#b8d4e8" : "#0a0e2a";
  const metalness = isGold ? 0.9 : 0.6;
  const roughness = isIce ? 0.15 : 0.3;

  // ── MOTION DIRECTED ANIMATION ──
  useEffect(() => {
    if (!groupRef.current) return;

    if (isSelected) {
      const tl = gsap.timeline({ overwrite: "auto" });
      tl.to(groupRef.current.position, {
        x: (selIdx - 1) * 1.8,
        y: 0.6,
        z: 2.2,
        duration: 0.8,
        ease: "expo.out"
      })
      .to(groupRef.current.rotation, {
        x: 0,
        y: Math.PI * 2, // Spin to show front
        z: 0,
        duration: 1.2,
        ease: "power3.inOut"
      }, "-=0.6");
    } else {
      const tx = Math.sin(angle) * radius;
      let tz = Math.cos(angle) * radius;
      let ty = 0;
      const ry = angle + (8 * Math.PI) / 180; 

      if (hoveredIndex === index) {
        ty += 0.15;
        tz += 0.4;
      }

      gsap.to(groupRef.current.position, {
        x: tx, y: ty, z: tz,
        duration: 1.0,
        ease: "power4.out",
        overwrite: "auto"
      });
      gsap.to(groupRef.current.rotation, {
        x: 0, y: Math.PI + ry, z: 0, // Face backwards in the arc
        duration: 1.0,
        ease: "power4.out"
      });
    }
  }, [relativeIndex, activeTotal, isSelected, hoveredIndex, angle, selIdx, index]);

  useFrame((state) => {
    if (!groupRef.current || isSelected) return;
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(time * 0.4 + index * 0.2) * 0.015;
    groupRef.current.position.y += Math.sin(time * 0.6 + index) * 0.005;
  });

  return (
    <group 
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(index); }}
    >
      <RoundedBox args={[1.0, 1.6, 0.04]} radius={0.03} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial 
          color={cardColor}
          roughness={roughness} 
          metalness={metalness}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={0.8}
          envMapIntensity={1.5}
          emissive={cardColor}
          emissiveIntensity={0.02}
        />
        {/* Card Back Mesh */}
        <mesh position={[0, 0, 0.021]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.96, 1.56]} />
          <meshBasicMaterial map={backTexture} />
        </mesh>
      </RoundedBox>
    </group>
  );
}
