/**
 * CelestialAltar.tsx — Flagship Card of the Day Restoration
 * 
 * A high-end ritual section that brings back the daily tarot draw.
 * Styled as a 3D altar on a pedestal with the V3 FlipRevealCard.
 */

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import FlipRevealCard from "./shaders/FlipRevealCard";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { useLocale } from "@/lib/i18n/useLocale";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function CelestialAltar() {
  const { t } = useLocale();

  // Daily-seeded card logic (consistent with Hero)
  const card = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const seed = dayOfYear * 2654435761;
    return ALL_CARDS[Math.abs(seed) % ALL_CARDS.length];
  }, []);

  return (
    <section className="relative py-24 md:py-48 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Editorial Header */}
        <div className="text-center mb-16 md:mb-24">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="font-[family-name:var(--font-body)] text-[0.65rem] md:text-xs font-medium tracking-[0.3em] uppercase text-celestial-gold/60 mb-4"
          >
            ✦ Daily Alignment
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1, ease: EASE }}
            className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl font-normal text-warm-ivory italic"
          >
            The Card of the Day
          </motion.h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-celestial-gold/30 to-transparent mx-auto mt-8" />
        </div>

        {/* The Altar — Pedestal Design */}
        <div className="relative group perspective-2000">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-celestial-gold/5 blur-[100px] rounded-full scale-150 animate-pulse" />
          
          {/* The Pedestal (CSS 3D) */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-4 bg-void-black/80 blur-xl rounded-full border border-celestial-gold/10" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease: EASE }}
            className="relative z-10"
          >
            <FlipRevealCard
              card={card}
              width={340}
              onFlip={(rev) => {
                if (rev && "vibrate" in navigator) window.navigator.vibrate(15);
              }}
            />
          </motion.div>
          
          {/* Floating Sacred Elements */}
          <div className="absolute -top-12 -left-12 opacity-20 pointer-events-none animate-bounce-slow">
            <span className="text-4xl text-celestial-gold">✧</span>
          </div>
          <div className="absolute -bottom-12 -right-12 opacity-20 pointer-events-none animate-bounce-delayed">
            <span className="text-3xl text-celestial-gold">✧</span>
          </div>
        </div>

        {/* Interpretation CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20 text-center"
        >
          <p className="font-[family-name:var(--font-body)] text-sm text-muted-lavender/40 italic max-w-sm mx-auto">
            Focus on the archetype above. What is the cosmos trying to communicate to you in this specific hour?
          </p>
          <a 
            href="/academy/card-of-the-day"
            className="inline-block mt-8 text-[0.7rem] font-medium tracking-[0.2em] uppercase text-celestial-gold border-b border-celestial-gold/20 pb-1 hover:border-celestial-gold transition-colors"
          >
            View Full Significance &rarr;
          </a>
        </motion.div>
      </div>

      <style jsx>{`
        .perspective-2000 { perspective: 2000px; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        .animate-bounce-slow { animation: bounce-slow 8s ease-in-out infinite; }
        .animate-bounce-delayed { animation: bounce-delayed 10s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
