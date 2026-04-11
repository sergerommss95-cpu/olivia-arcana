"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

interface VeilRevealWrapperProps {
  cardImagePath: string;
  cardName: string;
  cardNumeral: string;
  onRevealComplete: () => void;
  onDrawAgain: () => void;
}

export default function VeilRevealWrapper({
  cardImagePath,
  cardName,
  cardNumeral,
  onRevealComplete,
  onDrawAgain,
}: VeilRevealWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import("./VeilRevealScene").VeilRevealScene | null>(null);

  const [holdProgress, setHoldProgress] = useState(0);
  const [holdRingProgress, setHoldRingProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [eyebrowOpacity, setEyebrowOpacity] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  const handleRevealComplete = useCallback(() => {
    setRevealed(true);
    setShowButton(true);
    onRevealComplete();
  }, [onRevealComplete]);

  const handleProgress = useCallback((p: number) => {
    setHoldProgress(p);
    // Eyebrow fades in at 60% wipe progress
    if (p > 0.6) {
      setEyebrowOpacity(Math.min(1, (p - 0.6) / 0.4));
    }
  }, []);

  // Mount Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const mobile = "ontouchstart" in window || window.innerWidth < 768;
    setIsMobile(mobile);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scene: import("./VeilRevealScene").VeilRevealScene | null = null;

    // Dynamic import to avoid SSR issues with Three.js
    import("./VeilRevealScene").then(({ VeilRevealScene }) => {
      if (!containerRef.current) return;
      try {
        scene = new VeilRevealScene({
          container: containerRef.current,
          cardImagePath,
          isMobile: mobile,
          reducedMotion,
          onRevealComplete: handleRevealComplete,
          onProgress: handleProgress,
          onHoldProgress: (p: number) => setHoldRingProgress(p),
        });
        scene.start();
        sceneRef.current = scene;
        setSceneReady(true);
        console.log("[VeilReveal] scene mounted successfully");
      } catch (err) {
        console.error("[VeilReveal] failed to create scene:", err);
      }
    }).catch((err) => {
      console.error("[VeilReveal] failed to import module:", err);
    });

    return () => {
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle draw again
  const handleDrawAgain = useCallback(() => {
    setRevealed(false);
    setShowButton(false);
    setEyebrowOpacity(0);
    setHoldProgress(0);
    setHoldRingProgress(0);
    onDrawAgain();
  }, [onDrawAgain]);

  // Update card when drawing again
  useEffect(() => {
    if (sceneRef.current && !revealed) {
      sceneRef.current.reset(cardImagePath);
    }
  }, [cardImagePath, revealed]);

  const RING_CIRC = 138.23;

  return (
    <div className="relative w-full" style={{ height: "100dvh" }}>
      <style>{`
        @keyframes veil-pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ cursor: isMobile ? "auto" : "none", zIndex: 1 }}
      />

      {/* Loading indicator while Three.js boots */}
      {!sceneReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className="text-center"
            style={{ color: "rgba(212,175,55,0.4)", fontFamily: "var(--font-accent)" }}
          >
            <div style={{ fontSize: "2.5rem", animation: "zodiac-float 4s ease-in-out infinite" }}>✦</div>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "1rem" }}>
              Preparing the veil...
            </div>
          </div>
        </div>
      )}

      {/* Eyebrow — card name (fades in during reveal) */}
      <div
        className="fixed top-[38px] left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none"
        style={{
          fontFamily: "var(--font-accent)",
          letterSpacing: "0.42em",
          fontSize: "clamp(8px, 2.5vw, 12px)",
          textTransform: "uppercase",
          color: "rgba(232,220,180,0.55)",
          textShadow: "0 0 24px rgba(140,150,220,0.4)",
          opacity: eyebrowOpacity,
          transition: "opacity 0.3s ease",
        }}
      >
        ✦ {cardName} · {cardNumeral} ✦
      </div>

      {/* Hint text — "Press & Hold to Lift the Veil" */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            className="fixed bottom-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none"
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "clamp(9px, 2.5vw, 12px)",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: "rgba(232,218,170,0.55)",
              textShadow: "0 0 18px rgba(140,150,220,0.45)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.45, 1, 0.45] }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            {isMobile ? "Touch & Hold to Lift the Veil" : "Press & Hold to Lift the Veil"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom cursor with progress ring (desktop only) */}
      {!isMobile && (
        <div
          id="veil-cursor"
          className="fixed top-0 left-0 z-20 pointer-events-none"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle
              cx="30" cy="30" r="22"
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"
            />
            <circle
              cx="30" cy="30" r="22"
              fill="none" stroke="rgba(240,207,120,0.7)" strokeWidth="2"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - holdRingProgress)}
              strokeLinecap="round"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "center",
                transition: holdRingProgress > 0 ? "none" : "stroke-dashoffset 0.3s ease",
              }}
            />
            {holdRingProgress > 0.95 && (
              <circle
                cx="30" cy="30" r="22"
                fill="none"
                stroke="rgba(240,207,120,0.4)"
                strokeWidth="3"
                style={{
                  transformOrigin: "center",
                  animation: "veil-pulse-ring 0.6s ease-out infinite",
                }}
              />
            )}
            <circle cx="30" cy="30" r="3" fill="rgba(240,207,120,0.85)" />
          </svg>
        </div>
      )}

      {/* Draw Again button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            className="fixed bottom-14 left-1/2 z-10"
            style={{
              transform: "translateX(-50%)",
              background: "transparent",
              border: "1px solid rgba(240,207,120,0.35)",
              color: "rgba(240,207,120,0.85)",
              fontFamily: "var(--font-accent)",
              fontSize: "11px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              padding: "14px 32px",
              cursor: "pointer",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.9, ease: EASE }}
            onClick={handleDrawAgain}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(240,207,120,0.08)";
              e.currentTarget.style.borderColor = "rgba(240,207,120,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(240,207,120,0.35)";
            }}
          >
            ↺ Draw Again
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
