/**
 * GlobalGuide.tsx — The persistent Witness presence.
 * 
 * This component hosts the Witness Orb in a floating, fixed position
 * (bottom right or sidebar). It acts as the "Cognitive Anchor" for the site.
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TheWitness from "./cosmos/TheWitness";
import { usePathname } from "next/navigation";

export default function GlobalGuide() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    // Only show guide after scroll on home, or immediately on internal pages
    const handleScroll = () => {
      if (pathname === "/") {
        setVisible(window.scrollY > 600);
      } else {
        setVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // If we are on a page that already has a Witness (like the new Hero),
  // we might want to hide the global one or merge them.
  // For now, let's keep it as a persistent companion.

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 100,
            pointerEvents: "auto",
          }}
          className="group"
        >
          <div className="relative">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-celestial-gold/5 blur-[40px] rounded-full group-hover:bg-celestial-gold/15 transition-all duration-700" />
            
            <div style={{ transform: "scale(0.4)", transformOrigin: "bottom right" }}>
              <TheWitness isAsking={isAsking} />
            </div>

            {/* Tooltip */}
            <div className="absolute -top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 whitespace-nowrap">
              <span className="font-[family-name:var(--font-mono)] text-[0.55rem] tracking-[0.3em] uppercase text-celestial-gold/60 bg-void-black/80 px-3 py-2 rounded-full border border-celestial-gold/10">
                The Witness is present
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
