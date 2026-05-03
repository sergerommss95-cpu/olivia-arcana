"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Element-based gradients ──

const ELEMENT_GRADIENTS: Record<string, string> = {
  Fire: "linear-gradient(145deg, #1a0a00 0%, #2d1106 25%, #3d1a0a 50%, #1a0505 100%)",
  Water: "linear-gradient(145deg, #000a1a 0%, #061128 25%, #0a1a3d 50%, #05101a 100%)",
  Air: "linear-gradient(145deg, #0a0a12 0%, #121220 25%, #1a1a30 50%, #0d0d18 100%)",
  Earth: "linear-gradient(145deg, #0a0d00 0%, #111806 25%, #1a200a 50%, #0a0d05 100%)",
};

const ELEMENT_PARTICLE_COLORS: Record<string, string[]> = {
  Fire: ["#C8A84B", "#A08840", "#B4A0D4", "#9B8EC4"],
  Water: ["#4FC3F7", "#0288D1", "#80DEEA", "#26C6DA"],
  Air: ["#E0E0E0", "#B0BEC5", "#CFD8DC", "#CE93D8"],
  Earth: ["#7CB342", "#C6A962", "#8D6E63", "#A5D6A7"],
};

// ── Particle system ──

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

function generateParticles(element: string, count: number = 20): Particle[] {
  const colors = ELEMENT_PARTICLE_COLORS[element] || ELEMENT_PARTICLE_COLORS.Fire;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    color: colors[i % colors.length],
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 4,
  }));
}

// ── Props ──

interface AnimatedHoroscopeCardProps {
  signName: string;
  signGlyph: string;
  element: string;
  elementEmoji: string;
  horoscope: string;
  dateRange: string;
  luckyColorHex: string;
}

// ── Component ──

export default function AnimatedHoroscopeCard({
  signName,
  signGlyph,
  element,
  elementEmoji,
  horoscope,
  dateRange,
  luckyColorHex,
}: AnimatedHoroscopeCardProps) {
  const [cycle, setCycle] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-generate particles when element changes
  useEffect(() => {
    setParticles(generateParticles(element));
  }, [element]);

  // Loop the animation cycle every 12 seconds
  useEffect(() => {
    function tick() {
      setCycle((c) => c + 1);
      timerRef.current = setTimeout(tick, 12000);
    }
    timerRef.current = setTimeout(tick, 12000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Split horoscope into sentences for paragraph animation
  const sentences = horoscope
    .split(/(?<=\.)\s+/)
    .filter((s) => s.trim().length > 0);

  const bg = ELEMENT_GRADIENTS[element] || ELEMENT_GRADIENTS.Fire;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "360px",
        aspectRatio: "9 / 16",
        borderRadius: "1rem",
        overflow: "hidden",
        position: "relative",
        background: bg,
        boxShadow: `0 0 80px ${luckyColorHex}10, 0 20px 60px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Floating particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              opacity: 0,
            }}
            animate={{
              y: [0, -60, -120],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cycle}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "2.5rem 1.8rem",
            textAlign: "center",
          }}
        >
          {/* Sign glyph */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "3.5rem",
              marginBottom: "0.75rem",
              lineHeight: 1,
            }}
          >
            {signGlyph}
          </motion.div>

          {/* Sign name — types in letter by letter */}
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.8rem",
              fontWeight: 400,
              color: "rgba(240,236,255,0.95)",
              marginBottom: "0.25rem",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {signName.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 1.2 + i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Date range */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.6rem",
              fontWeight: 400,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(180,170,210,0.4)",
              marginBottom: "1.5rem",
            }}
          >
            {dateRange}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "3rem",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${luckyColorHex}50, transparent)`,
              marginBottom: "1.5rem",
            }}
          />

          {/* Daily reading — fade in paragraph by paragraph */}
          <div style={{ marginBottom: "1.5rem" }}>
            {sentences.map((sentence, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 2.5 + i * 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.78rem",
                  fontWeight: 300,
                  color: "rgba(220,215,245,0.7)",
                  lineHeight: 1.8,
                  margin: "0 0 0.5rem",
                }}
              >
                {sentence}
              </motion.p>
            ))}
          </div>

          {/* Element badge + energy bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 4.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: luckyColorHex,
                background: `${luckyColorHex}12`,
                border: `1px solid ${luckyColorHex}25`,
                borderRadius: "100px",
                padding: "0.25rem 0.7rem",
              }}
            >
              {elementEmoji} {element}
            </span>

            {/* Energy bar */}
            <div
              style={{
                width: "60px",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1, delay: 4.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: "100%",
                  borderRadius: "2px",
                  background: `linear-gradient(90deg, ${luckyColorHex}80, ${luckyColorHex})`,
                }}
              />
            </div>
          </motion.div>

          {/* Watermark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 5.5 }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.5rem",
              fontWeight: 500,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(180,170,210,0.2)",
              position: "absolute",
              bottom: "1.5rem",
            }}
          >
            &#10022; OLIVIA ARCANA
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
