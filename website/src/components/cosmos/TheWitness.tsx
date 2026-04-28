/**
 * TheWitness.tsx — Masterpiece Navigation Intelligence
 * 
 * An Apple-grade interactive object. 
 * Multi-layered: 
 *   - OuterShell: High-end refractive glass (Transmission + Dispersion)
 *   - InnerCore: Molten gold intelligence that physically tracks cursor
 *   - Atmosphere: Internal lighting and environment reflections
 */

"use client";

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Float, 
  MeshTransmissionMaterial, 
  Environment, 
  Sparkles,
  ContactShadows
} from "@react-three/drei";
import * as THREE from "three";
import { useProfile } from "../../lib/user/profile-store";

const ELEMENT_COLORS = {
  Fire:  { color: "#e8524a", glow: "#f79a9a", speed: 2.8 },
  Water: { color: "#6b8dd6", glow: "#9ac4f7", speed: 0.8 },
  Air:   { primary: "#D4AF37", light: "#c8b4ff", speed: 1.8 },
  Earth: { primary: "#D4AF37", light: "#9af7c4", speed: 0.5 },
  None:  { primary: "#D4AF37", light: "#D4AF37", speed: 1.0 },
};

const ELEMENT_STYLES = {
  Fire:  { color: "#e8524a", glow: "#f79a9a", speed: 2.5, tension: 0.2 },
  Water: { color: "#6b8dd6", glow: "#9ac4f7", speed: 0.6, tension: 0.05 },
  Air:   { color: "#7b68ee", glow: "#c8b4ff", speed: 1.5, tension: 0.1 },
  Earth: { color: "#4ecdc4", glow: "#9af7c4", speed: 0.4, tension: 0.02 },
  None:  { color: "#D4AF37", glow: "#F5E6A3", speed: 1.0, tension: 0.1 },
};

type ElementKey = keyof typeof ELEMENT_STYLES;

function resolveElement(sign?: string): ElementKey {
  if (!sign) return "None";
  if (["Aries", "Leo", "Sagittarius"].includes(sign)) return "Fire";
  if (["Cancer", "Scorpio", "Pisces"].includes(sign)) return "Water";
  if (["Gemini", "Libra", "Aquarius"].includes(sign)) return "Air";
  if (["Taurus", "Virgo", "Capricorn"].includes(sign)) return "Earth";
  return "None";
}

interface WitnessProps {
  isAsking?: boolean;
  isProcessing?: boolean;
  userInputLength?: number;
}

function InnerIntelligence({ style, isAsking, isProcessing, userInputLength = 0 }: { style: typeof ELEMENT_STYLES.None } & WitnessProps) {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const sentinelRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { mouse } = useThree();
  
  // Spring vectors for intelligent rotation
  const smoothTarget = useRef(new THREE.Vector3(0, 0, 1));
  const currentDir = useRef(new THREE.Vector3(0, 0, 1));

  useFrame((state) => {
    if (!coreRef.current) return;
    const time = state.clock.getElapsedTime();

    // 1. Calculate Cursor Intent
    smoothTarget.current.set(mouse.x * 2.5, mouse.y * 2.5, 1).normalize();
    currentDir.current.lerp(smoothTarget.current, isAsking ? 0.15 : 0.08);
    
    // 2. Physical Look-At
    coreRef.current.lookAt(currentDir.current.clone().multiplyScalar(5));
    
    // 3. Ambient Vibration + Typing Reaction
    const typingVibe = userInputLength * 0.01;
    coreRef.current.position.y = Math.sin(time * 0.8) * (isProcessing ? 0.08 : 0.02) + (Math.random() * typingVibe * 0.1);
    
    // 4. Ring Rotation (Sacred Geometry feel)
    const ringSpeed = isProcessing ? 4.0 : isAsking ? (1.2 + typingVibe * 2) : 0.4;
    if (ring1Ref.current) ring1Ref.current.rotation.z = time * ringSpeed;
    if (ring2Ref.current) ring2Ref.current.rotation.x = time * -ringSpeed * 1.5;

    // 5. Sentinel Orbit (The tiny moving point of light)
    if (sentinelRef.current) {
      const orbSpeed = isProcessing ? 10.0 : (2.5 + typingVibe * 5);
      sentinelRef.current.position.x = Math.cos(time * orbSpeed) * 0.45;
      sentinelRef.current.position.z = Math.sin(time * orbSpeed) * 0.45;
      sentinelRef.current.position.y = Math.sin(time * (orbSpeed * 0.75)) * 0.2;
    }

    // 6. Reactive Light Pulse
    if (lightRef.current) {
      const basePulse = isProcessing ? 2.5 : isAsking ? (1.2 + typingVibe) : 0.8;
      const pulse = basePulse + Math.sin(time * 3.0 * style.speed) * (isProcessing ? 1.0 : 0.2);
      lightRef.current.intensity = pulse * (isProcessing ? 45 : 15);
    }
  });

  return (
    <group ref={coreRef}>
      {/* The Core — Concentric Golden Rings */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[0.35, 0.003, 16, 100]} />
          <meshStandardMaterial color={style.color} emissive={style.glow} emissiveIntensity={isProcessing ? 50 : 10} toneMapped={false} />
        </mesh>
      </group>
      <group ref={ring2Ref}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.003, 16, 100]} />
          <meshStandardMaterial color={style.color} emissive={style.glow} emissiveIntensity={isProcessing ? 50 : 10} toneMapped={false} />
        </mesh>
      </group>

      {/* The Central Seed */}
      <mesh>
        <sphereGeometry args={[0.04, 32, 32]} />
        <meshStandardMaterial color={style.color} emissive={style.glow} emissiveIntensity={isProcessing ? 60 : 20} toneMapped={false} />
      </mesh>

      {/* The Sentinel — one tiny moving point of light */}
      <mesh ref={sentinelRef}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={style.glow} 
          emissiveIntensity={isProcessing ? 100 : 20} 
          toneMapped={false} 
        />
      </mesh>
      
      {/* Tiny internal light source to illuminate the glass shell from within */}
      <pointLight ref={lightRef} color={style.glow} distance={2} decay={2} />
      
      {/* Micro-sparkles representing data-points (Intelligence) */}
      <Sparkles count={isProcessing ? 30 : 12} scale={0.6} size={1} speed={isProcessing ? 2.0 : 0.4} color={style.glow} />
    </group>
  );
}

function OuterGlassShell({ style, isAsking, isProcessing, userInputLength = 0 }: WitnessProps & { style: typeof ELEMENT_STYLES.None }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  
  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // 1. Calculate Scroll & Mouse Velocity for Physical Reaction
    const currentScrollY = window.scrollY;
    scrollVelocity.current += (Math.abs(currentScrollY - lastScrollY.current) - scrollVelocity.current) * 0.1;
    lastScrollY.current = currentScrollY;
    
    // 2. Multi-Layered Morphing (The Liquid Effect)
    // base distortion + noise modulation
    const idleMorph = Math.sin(time * 0.5) * 0.05;
    const typingDistortion = userInputLength * 0.015;
    const activityMorph = isProcessing ? 0.3 : isAsking ? (0.15 + typingDistortion) : 0;
    const velocityMorph = scrollVelocity.current * 0.003;
    
    materialRef.current.distortion = style.tension + idleMorph + activityMorph + velocityMorph;
    materialRef.current.distortionScale = 0.4 + (Math.sin(time * 0.2) * 0.1) + typingDistortion;
    materialRef.current.temporalDistortion = 0.2 + activityMorph;
    
    // 3. Physical Scale Pulse
    const breath = 1.0 + Math.sin(time * 0.4) * 0.02 + (scrollVelocity.current * 0.0005) + (typingDistortion * 0.1);
    const scale = isProcessing ? breath * 1.15 : isAsking ? breath * 1.05 : breath;
    meshRef.current.scale.set(scale, scale, scale);
    
    // 4. Atmospheric Rotation
    meshRef.current.rotation.y = time * 0.08 + (scrollVelocity.current * 0.001);
    meshRef.current.rotation.z = Math.sin(time * 0.1) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} /> {/* Higher resolution for smoother morphing */}
      <MeshTransmissionMaterial
        ref={materialRef}
        backside
        samples={16}
        thickness={1.2}
        roughness={0.04}
        transmission={1.0}
        ior={1.5}
        chromaticAberration={0.12}
        anisotropy={0.5}
        distortion={style.tension}
        distortionScale={0.5}
        temporalDistortion={0.2}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
        color="#06041a" 
      />
    </mesh>
  );
}

function WitnessScene({ isAsking, isProcessing, userInputLength }: WitnessProps) {
  const { profile } = useProfile();
  
  const element = resolveElement(profile?.signName);
  const style = ELEMENT_STYLES[element];

  return (
    <>
      <Environment preset="night" />
      
      <Float speed={isProcessing ? 8 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group>
          <InnerIntelligence style={style} isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} />
          <OuterGlassShell style={style} isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} />
        </group>
      </Float>

      <ContactShadows 
        position={[0, -1.5, 0]} 
        opacity={0.4} 
        scale={4} 
        blur={2} 
        far={2} 
        color="#000000" 
      />
    </>
  );
}

export default function TheWitness({ isAsking, isProcessing, userInputLength }: WitnessProps) {
  return (
    <div className="witness-orb-container" style={{ width: "320px", height: "320px", cursor: "pointer" }}>
      <Canvas 
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ 
          antialias: true, 
          powerPreference: "high-performance",
          alpha: true 
        }}
      >
        <ambientLight intensity={0.1} />
        <WitnessScene isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} />
      </Canvas>

      <style jsx>{`
        .witness-orb-container {
          filter: drop-shadow(0 0 30px rgba(0,0,0,0.6));
          transition: transform 0.6s var(--ease-ritual);
        }
        .witness-orb-container:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
