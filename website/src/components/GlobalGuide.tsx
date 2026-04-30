/**
 * GlobalGuide.tsx — The 'Dynamic Island' Oracle Hub.
 * 
 * Re-engineered for God-tier navigation.
 * Positioning: Centered Bottom.
 * Interaction: Magnetic & Atmospheric.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import TheWitness from "./cosmos/TheWitness";
import { usePathname } from "next/navigation";
import { useLocale } from "../lib/i18n/useLocale";
import { getCosmicMoment } from "../lib/cosmic-time";
import TransitionLink from "./transitions/TransitionLink";

export default function GlobalGuide() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [moment] = useState(() => getCosmicMoment());
  
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  if (pathname === "/oracle") return null;

  return (
    <div className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="pointer-events-auto relative flex flex-col items-center"
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute bottom-full mb-6 w-64 glass-portal p-6 rounded-[24px] text-center"
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="label-mono opacity-50">Current Hour</p>
                  <p className="font-[family-name:var(--font-heading)] text-xl text-warm-ivory">
                    {moment.planetaryHour}
                  </p>
                </div>
                
                <div className="h-px w-full bg-gradient-to-r from-transparent via-celestial-gold/20 to-transparent" />
                
                <div className="space-y-1">
                  <p className="label-mono opacity-50">Atmosphere</p>
                  <p className="text-sm italic text-warm-ivory/80">
                    {moment.moonPhase} • {moment.season}
                  </p>
                </div>

                <TransitionLink
                  href="/oracle"
                  className="block w-full py-3 rounded-full bg-celestial-gold text-void-black text-[10px] font-bold tracking-[0.3em] uppercase hover:scale-[1.02] transition-transform active:scale-[0.98]"
                >
                  Enter The Oracle
                </TransitionLink>              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── THE ANCHOR ── */}
        <div className="relative group cursor-pointer">
          {/* Haptic Ring */}
          <div className={`absolute inset-0 bg-white/5 blur-[40px] rounded-full transition-all duration-1000 ${isHovered ? 'scale-150 bg-celestial-gold/5' : 'scale-100'}`} />
          
          <div className="relative w-24 h-24 flex items-center justify-center transition-transform duration-700 group-hover:scale-110 active:scale-95">
             <div style={{ transform: "scale(0.28)", transformOrigin: "center" }}>
                <TheWitness isAsking={isHovered} scrollProgress={0} />
             </div>
             
             {/* Progress Halo */}
             <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <motion.circle
                  cx="48" cy="48" r="46"
                  fill="none"
                  stroke="rgba(212, 175, 55, 0.2)"
                  strokeWidth="0.5"
                />
                <motion.circle
                  cx="48" cy="48" r="46"
                  fill="none"
                  stroke="rgba(212, 175, 55, 0.8)"
                  strokeWidth="1.5"
                  strokeDasharray="1"
                  style={{ pathLength: smoothProgress }}
                />
             </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
