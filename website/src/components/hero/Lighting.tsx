/**
 * Lighting.tsx — The Secret Sauce.
 */

"use client";

import React from "react";
import { Environment } from "@react-three/drei";

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.08} color="#1a1a2e" />
      
      {/* KEY LIGHT (Warm) */}
      <spotLight 
        position={[2, 4, 3]} 
        intensity={15} 
        angle={0.4} 
        penumbra={0.8} 
        color="#fff5e6" 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* RIM LIGHT (Cool Blue) */}
      <directionalLight 
        position={[-3, 1, -2]} 
        intensity={1.5} 
        color="#4a6fa5" 
      />
      
      {/* FILL LIGHT */}
      <pointLight 
        position={[0, -1, 2]} 
        intensity={0.5} 
        color="#2a1f3d" 
      />

      <Environment preset="studio" environmentIntensity={0.3} />
    </>
  );
}

/**
 * PostFX.tsx — Cinematic Finish.
 */
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";

export function PostFX() {
  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom intensity={0.4} luminanceThreshold={0.9} radius={0.6} mipmapBlur />
      <Vignette offset={0.3} darkness={0.7} />
      <ChromaticAberration offset={[0.0005, 0.0005]} />
      <Noise opacity={0.04} />
    </EffectComposer>
  );
}

/**
 * HeroOverlay.tsx — HTML Composition.
 */
export function HeroOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center pointer-events-none">
      <div className="mt-[35vh] flex flex-col items-center text-center max-w-[90vw]">
        <h1 className="text-[#f5f0e8] text-[clamp(2.5rem,6vw,5.5rem)] font-serif leading-tight mb-4">
          Financial Intelligence with <br />
          <span className="italic">complete control</span>
        </h1>
        
        <p className="text-[#888888] text-base max-w-[480px] mb-8 font-sans">
          The next generation of corporate banking. Designed for speed, 
          built for scale, and engineered for total transparency.
        </p>

        {/* GLASSMORPHIC CTA */}
        <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full pointer-events-auto">
          <input 
            type="email" 
            placeholder="Work email" 
            className="bg-transparent border-none outline-none px-4 py-2 text-white text-sm w-48 placeholder:text-gray-500"
          />
          <button className="bg-white text-black text-sm font-medium px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors">
            Get early access
          </button>
        </div>
      </div>
      
      {/* RADIAL VIGNETTE (CSS) */}
      <div className="absolute inset-0 bg-radial-vignette opacity-50 pointer-events-none" />
    </div>
  );
}
