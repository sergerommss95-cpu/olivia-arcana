/**
 * HeroOverlay.tsx — Editorial Typography Layer.
 */

"use client";

import React from "react";

export default function HeroOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-[30vh] pointer-events-none">
      <div className="text-center max-w-4xl px-6">
        <h1 className="font-serif text-[clamp(2.5rem,8vw,5.5rem)] leading-[1.05] text-[#f5f0e8] mb-6 drop-shadow-2xl">
          Celestial Clarity. <br />
          <span className="italic">Complete Resonance.</span>
        </h1>
        
        <p className="font-sans text-base text-[#888] max-w-[480px] mx-auto mb-12 leading-relaxed tracking-wide">
          Unlock the editorial cosmic almanac. A new dimension of 
          self-discovery through mathematical arcana.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Your birthday (MM/DD/YYYY)"
              className="w-72 px-8 py-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-[#f5f0e8] placeholder:text-white/20 focus:outline-none focus:border-[#d4af37]/50 transition-all duration-500"
            />
          </div>
          <button className="px-10 py-4 bg-[#f5f0e8] text-black font-semibold rounded-full hover:bg-[#d4af37] transition-all duration-500 transform hover:scale-105">
            Begin Journey
          </button>
        </div>
      </div>
    </div>
  );
}
