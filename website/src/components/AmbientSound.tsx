/**
 * AmbientSound — Cosmic generative score toggle
 *
 * Layer 4 of the design system. Single toggle — never auto-play.
 * Uses CosmicSynthesizer for a multi-layer procedural score that
 * responds to real-time astronomical state (Sun sign, Moon phase,
 * time of day). Updates config every 60 seconds.
 */

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { CosmicSynthesizer, computeCosmicConfig } from "@/lib/procedural-audio";

export default function AmbientSound() {
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const synthRef = useRef<CosmicSynthesizer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      synthRef.current?.stop();
    };
  }, []);

  const startAudio = useCallback(() => {
    if (synthRef.current?.isPlaying()) return;

    const synth = new CosmicSynthesizer();
    const config = computeCosmicConfig();
    synth.updateConfig(config);
    synth.start();

    synthRef.current = synth;

    // Update cosmic config every 60 seconds
    intervalRef.current = setInterval(() => {
      const newConfig = computeCosmicConfig();
      synthRef.current?.updateConfig(newConfig);
    }, 60_000);
  }, []);

  const stopAudio = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    synthRef.current?.stop();
    synthRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stopAudio();
    } else {
      startAudio();
    }
    setPlaying(!playing);
  }, [playing, startAudio, stopAudio]);

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Disable ambient sound" : "Enable ambient sound"}
      title={playing ? "Sound on" : "Sound off"}
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 45,
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: playing ? "rgba(200,168,75,0.12)" : "rgba(12,13,24,0.6)",
        border: `1px solid ${playing ? "rgba(200,168,75,0.3)" : "rgba(200,168,75,0.1)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.85rem",
        color: playing ? "var(--c-gold)" : "var(--c-text-faint)",
        transition: "all 0.3s var(--ease-ritual)",
        cursor: "pointer",
      }}
    >
      {playing ? "\u266B" : "\u266A"}
    </button>
  );
}
