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
  scrollProgress?: number;
}

function InnerIntelligence({ style, isAsking, isProcessing, userInputLength = 0, scrollProgress = 0 }: { style: typeof ELEMENT_STYLES.None } & WitnessProps) {
  const coreRef = useRef<THREE.Group>(null);
  const seedRef = useRef<THREE.Group>(null);
  const oliveRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { mouse } = useThree();
  
  const smoothTarget = useRef(new THREE.Vector3(0, 0, 1));
  const currentDir = useRef(new THREE.Vector3(0, 0, 1));

  useFrame((state) => {
    if (!coreRef.current) return;
    const time = state.clock.getElapsedTime();

    smoothTarget.current.set(mouse.x * 2.5, mouse.y * 2.5, 1).normalize();
    currentDir.current.lerp(smoothTarget.current, isAsking ? 0.15 : 0.08);
    coreRef.current.lookAt(currentDir.current.clone().multiplyScalar(5));
    
    const typingVibe = userInputLength * 0.01;
    const activitySpeed = isProcessing ? 4.0 : isAsking ? (1.5 + typingVibe * 2) : 0.5;
    const scrollSpin = scrollProgress * 8.0;

    // 1. Seed of Life Counter-Rotation
    if (seedRef.current) {
      seedRef.current.rotation.z = time * activitySpeed + scrollSpin;
      seedRef.current.rotation.y = Math.sin(time * 0.5) * 0.2 + scrollSpin * 0.5;
    }

    // 2. Olive Sprig Breathing
    if (oliveRef.current) {
      const breath = 1 + Math.sin(time * 2) * 0.05;
      oliveRef.current.scale.set(breath, breath, breath);
      oliveRef.current.rotation.z = Math.sin(time * 0.8) * 0.1;
    }

    if (lightRef.current) {
      const basePulse = isProcessing ? 3.5 : isAsking ? (1.5 + typingVibe) : 1.0;
      lightRef.current.intensity = (basePulse + Math.sin(time * 3) * 0.5) * (isProcessing ? 60 : 20);
    }
  });

  return (
    <group ref={coreRef}>
      {/* ── THE SEED OF LIFE RINGS ── */}
      <group ref={seedRef}>
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <group key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
            <mesh position={[0.15, 0, 0]}>
              <torusGeometry args={[0.15, 0.002, 16, 64]} />
              <meshStandardMaterial 
                color={style.color} 
                emissive={style.glow} 
                emissiveIntensity={isProcessing ? 40 : 10} 
                toneMapped={false} 
              />
            </mesh>
          </group>
        ))}
        {/* Center Ring */}
        <mesh>
          <torusGeometry args={[0.15, 0.003, 16, 64]} />
          <meshStandardMaterial 
            color={style.color} 
            emissive={style.glow} 
            emissiveIntensity={isProcessing ? 50 : 15} 
            toneMapped={false} 
          />
        </mesh>
      </group>

      {/* ── THE OLIVE SPRIG (Stylized Centerpiece) ── */}
      <group ref={oliveRef} scale={0.4}>
        {/* Stem */}
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
          <meshStandardMaterial color={style.color} emissive={style.glow} emissiveIntensity={20} />
        </mesh>
        {/* Leaves */}
        <mesh position={[0.12, 0.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <sphereGeometry args={[0.08, 16, 16]} scale={[1, 0.3, 0.5]} />
          <meshStandardMaterial color={style.color} emissive={style.glow} emissiveIntensity={15} />
        </mesh>
        <mesh position={[-0.12, -0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
          <sphereGeometry args={[0.08, 16, 16]} scale={[1, 0.3, 0.5]} />
          <meshStandardMaterial color={style.color} emissive={style.glow} emissiveIntensity={15} />
        </mesh>
        {/* The Fruit (Crowning Jewel) */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.05, 32, 32]} scale={[0.8, 1.2, 0.8]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive={style.glow} 
            emissiveIntensity={isProcessing ? 100 : 30} 
            toneMapped={false} 
          />
        </mesh>
      </group>
      
      <pointLight ref={lightRef} color={style.glow} distance={2} decay={2} />
      <Sparkles count={isProcessing ? 40 : 15} scale={0.8} size={2} speed={isProcessing ? 2.5 : 0.6} color={style.glow} />
    </group>
  );
}

function OuterGlassShell({ style, isAsking, isProcessing, userInputLength = 0, scrollProgress = 0 }: WitnessProps & { style: typeof ELEMENT_STYLES.None }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  
  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = state.clock.getElapsedTime();
    
    const currentScrollY = window.scrollY;
    scrollVelocity.current += (Math.abs(currentScrollY - lastScrollY.current) - scrollVelocity.current) * 0.1;
    lastScrollY.current = currentScrollY;
    
    const typingDistortion = userInputLength * 0.012;
    const scrollImpact = scrollProgress * 2.0;
    const activityMorph = isProcessing ? 0.4 : isAsking ? (0.2 + typingDistortion) : 0.1;
    const velocityMorph = scrollVelocity.current * 0.004;
    
    materialRef.current.distortion = style.tension + activityMorph + velocityMorph + scrollImpact + Math.sin(time * 0.5) * 0.1;
    materialRef.current.distortionScale = 0.5 + (Math.sin(time * 0.2) * 0.2) + typingDistortion + scrollImpact;
    materialRef.current.temporalDistortion = 0.3 + activityMorph + scrollImpact * 0.5;
    
    const breath = 1.0 + Math.sin(time * 1.5) * 0.02 + (velocityMorph * 0.1);
    // Exponential descent scale for 'Infinite Descent'
    const descentScale = 1.0 + Math.pow(scrollProgress, 2) * 8.0;
    const scale = (isProcessing ? breath * 1.12 : isAsking ? breath * 1.05 : breath) * descentScale;
    meshRef.current.scale.set(scale, scale, scale);
    
    meshRef.current.rotation.y = time * 0.1 + (scrollVelocity.current * 0.002) + scrollProgress * 4.0;
    meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.05 + scrollProgress * 2.0;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <MeshTransmissionMaterial
        ref={materialRef}
        backside
        samples={16}
        thickness={1.5}
        roughness={0.01}
        transmission={1.0}
        ior={1.5}
        chromaticAberration={0.3}
        anisotropy={1.0}
        distortion={0.2}
        distortionScale={0.5}
        temporalDistortion={0.2}
        clearcoat={1}
        attenuationDistance={1.0}
        attenuationColor="#ffffff"
        color="#08061a" // Darker, matching the site background
        transparent
      />
    </mesh>
  );
}

function NebulaCore({ style }: { style: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.5;
    }
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.75, 32, 32]} />
      <meshStandardMaterial 
        color={style.color} 
        emissive={style.color}
        emissiveIntensity={1.2}
        transparent 
        opacity={0.05} 
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function WitnessScene({ isAsking, isProcessing, userInputLength, scrollProgress = 0 }: WitnessProps) {
  const { profile } = useProfile();
  const element = resolveElement(profile?.signName);
  const style = ELEMENT_STYLES[element];

  return (
    <>
      {/* Remove global environment to avoid 'random photo' reflections. 
          Instead, use specific point lights to simulate website atmosphere. */}
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={0.2 + scrollProgress * 0.5} color={style.glow} />
      
      <Float speed={isProcessing ? 6 : 1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group>
          <InnerIntelligence style={style} isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} scrollProgress={scrollProgress} />
          <NebulaCore style={style} />
          <OuterGlassShell style={style} isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} scrollProgress={scrollProgress} />
        </group>
      </Float>

      <ContactShadows 
        position={[0, -1.5, 0]} 
        opacity={0.4} 
        scale={5} 
        blur={2.5} 
        far={2} 
        color="#000000" 
      />
    </>
  );
}

export default function TheWitness({ isAsking, isProcessing, userInputLength, scrollProgress = 0 }: WitnessProps) {
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
        <WitnessScene 
          isAsking={isAsking} 
          isProcessing={isProcessing} 
          userInputLength={userInputLength} 
          scrollProgress={scrollProgress}
        />
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
