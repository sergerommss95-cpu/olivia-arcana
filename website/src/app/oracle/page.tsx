/**
 * OraclePage.tsx — The Luxury Framer Motion Edition.
 * 
 * Re-engineered to use DOM-based Framer Motion for cinematic interaction.
 * Removed WebGL overhead in favor of pure CSS/Spring performance.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FramerTarotOracle = dynamic(() => import("@/components/oracle/FramerTarotOracle"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-[#f5f2e1]/20 font-mono text-xs tracking-widest animate-pulse uppercase">
        Concentrate
      </div>
    </div>
  ),
});

export default function OraclePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#08061a]" />;

  return (
    <main className="fixed inset-0 bg-[#08061a] overflow-hidden select-none">
      {/* ── MINIMALIST PORTAL EXIT ── */}
      <nav className="absolute top-12 left-12 z-[100]">
        <Link href="/" className="group flex items-center gap-4 no-underline">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#d4af37]/50 transition-all duration-500 bg-black/20 backdrop-blur-md">
             <span className="text-[#f5f2e1]/40 group-hover:text-[#d4af37] text-lg leading-none">&larr;</span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-20 group-hover:opacity-100 transition-opacity duration-500 text-[#f5f2e1]">
            Exit Oracle
          </span>
        </Link>
      </nav>

      {/* ── THE ORACLE ENGINE (DOM-BASED) ── */}
      <div className="absolute inset-0 z-10">
        <FramerTarotOracle />
      </div>

      <style jsx global>{`
        body { background: #08061a; cursor: crosshair; overflow: hidden; }
        ::selection { background: transparent; }
      `}</style>
    </main>
  );
}
