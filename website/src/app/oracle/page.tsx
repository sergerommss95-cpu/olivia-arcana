/**
 * OraclePage.tsx — The Luxury Framer Motion Edition.
 * 
 * Re-engineered to use DOM-based Framer Motion for cinematic interaction.
 * Removed WebGL overhead in favor of pure CSS/Spring performance.
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const FramerTarotOracle = dynamic(() => import("@/components/oracle/FramerTarotOracle"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-[#d4af37]/40 font-mono text-[10px] tracking-[0.6em] animate-pulse uppercase">
        Calibrating the stars…
      </div>
    </div>
  ),
});

function OracleContainer() {
  const searchParams = useSearchParams();
  const hasDraw = searchParams.get("draw") !== null;
  const [started, setStarted] = useState(hasDraw);

  return (
    <>
      {!started && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(30,15,60,0.2)_0%,_transparent_70%)] pointer-events-none" />
          <h1 className="font-serif text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-[#f5f0e8] to-[#888] mb-8 font-light tracking-tight">
            Draw the <span className="italic text-[#d4af37]">Threads</span>
          </h1>
          <button 
            onClick={() => setStarted(true)}
            className="pointer-events-auto group relative px-10 py-5 rounded-full overflow-hidden border border-[#d4af37]/20 bg-black/60 backdrop-blur-md transition-all duration-500 hover:border-[#d4af37]/60 shadow-[0_0_40px_rgba(212,175,55,0.05)]"
          >
            <span className="relative z-10 text-xs tracking-[0.3em] uppercase text-[#d4af37] group-hover:text-white transition-colors duration-500">
              Awaken the Deck
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          </button>
        </div>
      )}

      {started && (
        <div className="absolute inset-0 z-10">
          <FramerTarotOracle />
        </div>
      )}
    </>
  );
}

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
      <Suspense fallback={<div />}>
        <OracleContainer />
      </Suspense>

      <style jsx global>{`
        body { background: #08061a; cursor: crosshair; overflow: hidden; }
        ::selection { background: transparent; }
      `}</style>
    </main>
  );
}
