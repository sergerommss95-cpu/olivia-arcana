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

function InnerIntelligence({ style }: { style: typeof ELEMENT_STYLES.None }) {
  const coreRef = useRef<THREE.Group>(null);
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
    smoothTarget.current.set(mouse.x * 2, mouse.y * 2, 1).normalize();
    currentDir.current.lerp(smoothTarget.current, 0.08);
    
    // 2. Physical Look-At
    coreRef.current.lookAt(currentDir.current.clone().multiplyScalar(5));
    
    // 3. Ambient Vibration
    coreRef.current.position.y = Math.sin(time * 0.8) * 0.02;
    
    // 4. Sentinel Orbit (The tiny moving point of light)
    if (sentinelRef.current) {
      sentinelRef.current.position.x = Math.cos(time * 2) * 0.45;
      sentinelRef.current.position.z = Math.sin(time * 2) * 0.45;
      sentinelRef.current.position.y = Math.sin(time * 1.5) * 0.2;
    }

    // 5. Reactive Light Pulse
    if (lightRef.current) {
      const pulse = 0.8 + Math.sin(time * 2.0 * style.speed) * 0.2;
      lightRef.current.intensity = pulse * 15;
    }
  });

  return (
    <group ref={coreRef}>
      {/* The "Brain" — a thin, glowing, molten filament */}
      <mesh>
        <torusKnotGeometry args={[0.3, 0.005, 128, 16]} />
        <meshStandardMaterial 
          color={style.color} 
          emissive={style.glow} 
          emissiveIntensity={12} 
          toneMapped={false} 
        />
      </mesh>

      {/* The Sentinel — one tiny moving point of light */}
      <mesh ref={sentinelRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive={style.glow} 
          emissiveIntensity={20} 
          toneMapped={false} 
        />
      </mesh>
      
      {/* Tiny internal light source to illuminate the glass shell from within */}
      <pointLight ref={lightRef} color={style.glow} distance={2} decay={2} />
      
      {/* Micro-sparkles representing data-points (Intelligence) */}
      <Sparkles count={12} scale={0.6} size={1} speed={0.4} color={style.glow} />
    </group>
  );
}

function OuterGlassShell({ style }: { style: typeof ELEMENT_STYLES.None }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const breath = 1.0 + Math.sin(time * 0.2) * 0.015;
    meshRef.current.scale.set(breath, breath, breath);
    meshRef.current.rotation.y = time * 0.05;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        backside
        samples={8}
        thickness={0.8}
        roughness={0.08}
        transmission={1.0}
        ior={1.45}
        chromaticAberration={0.06}
        anisotropy={0.2}
        distortion={style.tension}
        distortionScale={0.2}
        temporalDistortion={0.1}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
        color="#050310" 
      />
    </mesh>
  );
}

function WitnessScene() {
  const { profile } = useProfile();
  
  const element = resolveElement(profile?.signName);
  const style = ELEMENT_STYLES[element];

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("witness:activated"));
    if ("vibrate" in navigator) window.navigator.vibrate(25);
  };

  return (
    <>
      <Environment preset="night" />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group 
          onClick={handleClick}
        >
          <InnerIntelligence style={style} />
          <OuterGlassShell style={style} />
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

export default function TheWitness() {
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
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.1} />
        
        <WitnessScene />
      </Canvas>

      <style jsx>{`
        .witness-orb-container {
          filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
          transition: transform 0.6s var(--ease-ritual);
        }
        .witness-orb-container:hover {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
