/**
 * TheWitness.tsx — Flagship Intelligence Orb
 * 
 * Replaces standard CTA buttons with a living navigation object.
 * Translates Attention → Direction.
 */

"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WitnessVertexShader, WitnessFragmentShader } from "./engine/WitnessShader";

import { useProfile } from "../../lib/user/profile-store";

const ELEMENT_COLORS = {
  Fire:  { primary: "#D4AF37", light: "#f79a9a", speed: 2.8 },
  Water: { primary: "#D4AF37", light: "#9ac4f7", speed: 0.8 },
  Air:   { primary: "#D4AF37", light: "#c8b4ff", speed: 1.8 },
  Earth: { primary: "#D4AF37", light: "#9af7c4", speed: 0.5 },
  None:  { primary: "#D4AF37", light: "#D4AF37", speed: 1.0 },
};

type ElementKey = keyof typeof ELEMENT_COLORS;

function resolveElement(sign?: string): ElementKey {
  if (!sign) return "None";
  if (["Aries", "Leo", "Sagittarius"].includes(sign)) return "Fire";
  if (["Cancer", "Scorpio", "Pisces"].includes(sign)) return "Water";
  if (["Gemini", "Libra", "Aquarius"].includes(sign)) return "Air";
  if (["Taurus", "Virgo", "Capricorn"].includes(sign)) return "Earth";
  return "None";
}

function WitnessOrbInner() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { mouse } = useThree();
  const { profile } = useProfile();
  
  const element = resolveElement(profile?.signName);
  const elementStyle = ELEMENT_COLORS[element];

  // Spring-smoothed vectors for internal trace alignment
  const smoothCursor = useRef(new THREE.Vector3(0, 0, 1));
  const targetCursor = useRef(new THREE.Vector3(0, 0, 1));

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("#06041a") },
    uLightColor: { value: new THREE.Color(elementStyle.light) },
    uAttention: { value: 0 },
    uCursorDir: { value: new THREE.Vector3(0, 0, 1) },
    uDistortion: { value: 0.2 },
    uBeam: { value: 0 },
  }), [elementStyle]);

  useFrame((state) => {
    if (!materialRef.current) return;
    
    const time = state.clock.getElapsedTime() * elementStyle.speed;
    uniforms.uTime.value = time;
    
    // Proximity logic: how close is the mouse to the center (0,0)?
    const dist = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
    const attentionTarget = dist < 0.6 ? 1.0 : 0.2;
    
    // Smooth attention transitions
    uniforms.uAttention.value += (attentionTarget - uniforms.uAttention.value) * 0.1;
    
    // Distortion: breathe more when ignored, sharpen when focused
    uniforms.uDistortion.value = 0.4 - uniforms.uAttention.value * 0.3;
    
    // Map 2D mouse to 3D direction vector for the gold trace
    targetCursor.current.set(mouse.x * 2.0, mouse.y * 2.0, 1.0).normalize();
    smoothCursor.current.lerp(targetCursor.current, 0.1);
    uniforms.uCursorDir.value.copy(smoothCursor.current);
    
    // Idle float
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.05;
      meshRef.current.rotation.z = time * 0.1;
    }
    
    // Beam logic (active state)
    uniforms.uBeam.value *= 0.92;
  });

  const handleClick = () => {
    uniforms.uBeam.value = 1.0;
    // Dispatch global event for the system to respond
    window.dispatchEvent(new CustomEvent("witness:activated"));
  };

  return (
    <mesh 
      ref={meshRef} 
      onClick={handleClick}
    >
      <icosahedronGeometry args={[1, 15]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={WitnessVertexShader}
        fragmentShader={WitnessFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function TheWitness() {
  return (
    <div style={{ width: "300px", height: "300px", cursor: "pointer" }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <WitnessOrbInner />
      </Canvas>
    </div>
  );
}
