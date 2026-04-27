/**
 * StoryMarkers.tsx — Vertical narrative progress indicator
 * 
 * Tracks scroll position across the homepage sections and 
 * provides a high-end "Chapter" visual.
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "hero", label: "Discovery" },
  { id: "daily", label: "Guidance" },
  { id: "features", label: "The System" },
  { id: "how-it-works", label: "Mechanism" },
  { id: "pricing", label: "Exchange" },
  { id: "faq", label: "Clarity" },
];

export default function StoryMarkers() {
  const [active, setActive] = useState("hero");
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollY / height);
      
      // Visibility: only show after hero start
      setVisible(scrollY > 200);

      // Active section detection
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
            setActive(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{
            position: "fixed",
            right: "2rem",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 45,
            display: "none", // Desktop only
          }}
          className="lg:flex flex-col items-end gap-6"
        >
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <div 
                key={s.id} 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
              >
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: isActive ? "#D4AF37" : "rgba(180, 170, 210, 0.3)",
                  transition: "color 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateX(0)" : "translateX(10px)",
                }}
                className="group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-celestial-gold/60"
                >
                  {s.label}
                </span>
                
                <div style={{
                  width: isActive ? "12px" : "4px",
                  height: "1px",
                  background: isActive ? "#D4AF37" : "rgba(180, 170, 210, 0.2)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }} />
              </div>
            );
          })}
          
          {/* Progress track */}
          <div style={{
            position: "absolute",
            right: "0",
            top: "-20px",
            bottom: "-20px",
            width: "1px",
            background: "rgba(200, 185, 255, 0.05)",
            zIndex: -1,
          }}>
            <motion.div 
              style={{
                width: "100%",
                height: `${progress * 100}%`,
                background: "linear-gradient(180deg, transparent, #D4AF37)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
