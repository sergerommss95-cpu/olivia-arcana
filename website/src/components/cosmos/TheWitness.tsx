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
import { getCosmicMoment } from "../../lib/cosmic-time";

const PLANET_COLORS: Record<string, { color: string; glow: string }> = {
  Mars:    { color: "#ff4d4d", glow: "#ff1a1a" },
  Venus:   { color: "#ff99cc", glow: "#ff3399" },
  Saturn:  { color: "#9999ff", glow: "#3333ff" },
  Jupiter: { color: "#ffcc66", glow: "#ff9900" },
  Mercury: { color: "#99ffff", glow: "#33ffff" },
  Moon:    { color: "#ffffff", glow: "#ccd9ff" },
  Sun:     { color: "#ffffcc", glow: "#ffd700" },
};

const ELEMENT_STYLES = {
  Fire:  { color: "#ff4d4d", glow: "#ff1a1a", speed: 2.5, tension: 0.2, ior: 1.4 },
  Water: { color: "#6b8dd6", glow: "#9ac4f7", speed: 0.6, tension: 0.05, ior: 1.6 },
  Air:   { color: "#D4AF37", glow: "#f5f2e1", speed: 1.5, tension: 0.1, ior: 1.5 },
  Earth: { color: "#818cf8", glow: "#a5b4fc", speed: 0.4, tension: 0.02, ior: 1.7 },
  None:  { color: "#f5f2e1", glow: "#d4af37", speed: 1.0, tension: 0.1, ior: 1.5 },
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
  const transitRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();
  
  const moment = useMemo(() => getCosmicMoment(), []);
  const planetName = moment.planetaryHour.replace("Hour of ", "");
  const atmosColor = PLANET_COLORS[planetName] || style;

  useFrame((state) => {
    if (!coreRef.current) return;
    const time = state.clock.getElapsedTime();

    // Kinetic Mouse Tracking (Physical Inertia)
    const targetX = mouse.x * 0.8;
    const targetY = mouse.y * 0.8;
    coreRef.current.position.x = THREE.MathUtils.lerp(coreRef.current.position.x, targetX, 0.05);
    coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, targetY, 0.05);
    coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, targetX * 0.5, 0.05);
    coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, -targetY * 0.5, 0.05);
    
    const activitySpeed = isProcessing ? 4.0 : isAsking ? 2.0 : 0.8;

    if (seedRef.current) {
      seedRef.current.rotation.z = time * activitySpeed;
      const pulse = 1 + Math.sin(time * 2) * 0.05;
      seedRef.current.scale.set(pulse, pulse, pulse);
    }

    if (transitRef.current) {
      transitRef.current.rotation.z = -time * activitySpeed * 0.5;
      transitRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    }
  });

  return (
    <group ref={coreRef}>
      {/* ── THE TRANSIT RING (The functional soul) ── */}
      <group ref={transitRef}>
        <mesh>
          <torusGeometry args={[0.35, 0.001, 16, 128]} />
          <meshStandardMaterial 
            color={atmosColor.color} 
            emissive={atmosColor.glow} 
            emissiveIntensity={10} 
            transparent 
            opacity={0.3} 
          />
        </mesh>
        {/* Pulsing activity dots */}
        {[0, 120, 240].map((a, i) => (
          <mesh key={i} position={[Math.cos(a * Math.PI/180) * 0.35, Math.sin(a * Math.PI/180) * 0.35, 0]}>
            <sphereGeometry args={[0.015, 16, 16]} />
            <meshStandardMaterial color="#fff" emissive={atmosColor.glow} emissiveIntensity={20} />
          </mesh>
        ))}
      </group>

      {/* ── THE SEED OF LIFE RINGS ── */}
      <group ref={seedRef} scale={0.8}>
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <group key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
            <mesh position={[0.12, 0, 0]}>
              <torusGeometry args={[0.12, 0.0015, 16, 64]} />
              <meshStandardMaterial 
                color={style.color} 
                emissive={style.glow} 
                emissiveIntensity={isProcessing ? 15 : 2} 
                toneMapped={false} 
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── THE HEART (Atmospheric Core) ── */}
      <mesh>
        <sphereGeometry args={[0.04, 32, 32]} />
        <meshStandardMaterial 
          color="#fff" 
          emissive={atmosColor.glow} 
          emissiveIntensity={isProcessing ? 40 : 12} 
          toneMapped={false} 
        />
      </mesh>
      
      <pointLight color={atmosColor.glow} intensity={2} distance={1.5} />
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
    
    // Gravitational Momentum
    const currentScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    scrollVelocity.current = THREE.MathUtils.lerp(scrollVelocity.current, Math.abs(currentScrollY - lastScrollY.current), 0.1);
    lastScrollY.current = currentScrollY;
    
    const typingDistortion = userInputLength * 0.005;
    const scrollImpact = scrollProgress * 0.5;
    const velocityImpact = scrollVelocity.current * 0.001;
    
    // God Mode: High-End Refraction Physics
    materialRef.current.distortion = style.tension + (isProcessing ? 0.3 : isAsking ? 0.15 : 0.05) + velocityImpact;
    materialRef.current.distortionScale = 0.4 + scrollImpact;
    materialRef.current.temporalDistortion = 0.1 + (isProcessing ? 0.4 : 0.05);
    materialRef.current.ior = style.ior + scrollImpact;
    materialRef.current.chromaticAberration = 0.4 + (scrollVelocity.current * 0.01);
    
    const breath = 1.0 + Math.sin(time * 1.5) * 0.01;
    const scale = (isProcessing ? breath * 1.1 : isAsking ? breath * 1.04 : breath) * (1 + scrollProgress * 2);
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        ref={materialRef}
        backside
        samples={8}
        thickness={2.0}
        roughness={0.02}
        transmission={1.0}
        ior={1.5}
        chromaticAberration={0.4}
        anisotropy={0.5}
        distortion={0.1}
        distortionScale={0.5}
        temporalDistortion={0.1}
        clearcoat={1}
        attenuationDistance={1.0}
        attenuationColor="#ffffff"
        color="#ffffff"
        transparent
        // @ts-ignore
        dispersion={0.6} // The 'Awwwards' sparkle
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
      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={1.0} color={style.glow} />
      
      {/* Dynamic Rim Light for God Mode depth */}
      <spotLight 
        position={[0, 10, 0]} 
        intensity={2} 
        penumbra={1} 
        distance={20} 
        color="#fff" 
      />

      <group>
        <InnerIntelligence style={style} isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} scrollProgress={scrollProgress} />
        <NebulaCore style={style} />
        <OuterGlassShell style={style} isAsking={isAsking} isProcessing={isProcessing} userInputLength={userInputLength} scrollProgress={scrollProgress} />
      </group>

      <ContactShadows 
        position={[0, -1.5, 0]} 
        opacity={0.3} 
        scale={8} 
        blur={3} 
        far={2} 
        color="#000" 
      />
    </>
  );
}

export default function TheWitness({ isAsking, isProcessing, userInputLength, scrollProgress = 0 }: WitnessProps) {
  return (
    <div className="witness-orb-container" style={{ width: "400px", height: "400px", cursor: "pointer" }}>
      <Canvas 
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]} // Performance optimization for high-density screens
        gl={{ 
          antialias: true, 
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          alpha: true 
        }}
      >
        <WitnessScene 
          isAsking={isAsking} 
          isProcessing={isProcessing} 
          userInputLength={userInputLength} 
          scrollProgress={scrollProgress}
        />
      </Canvas>

      <style jsx>{`
        .witness-orb-container {
          filter: drop-shadow(0 0 50px rgba(0,0,0,0.5));
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          /* Gravitational Lensing Effect */
          backdrop-filter: blur(4px) saturate(1.2);
          border-radius: 50%;
          mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
        }
        .witness-orb-container:hover {
          transform: scale(1.02) translateY(-5px);
        }
      `}</style>
    </div>
  );
}
