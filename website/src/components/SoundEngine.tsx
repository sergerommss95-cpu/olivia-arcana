/**
 * SoundEngine.tsx — Web Audio API ambient sounds + micro-interactions
 *
 * Generates all sounds procedurally (no audio files needed):
 *   - Ambient cosmic drone (low pad)
 *   - Shimmer on birthday reveal
 *   - Soft chime on section reveal
 *   - Whoosh on shooting stars
 *
 * Opt-in: muted by default, toggle button in bottom-right corner.
 * Uses Web Audio API oscillators + noise for everything.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { playZodiacTone, ZODIACFREQ } from "../lib/zodiac-sounds";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

class CosmicAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private active = false;

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15;
    this.masterGain.connect(this.ctx.destination);
  }

  async start(planetName = "Sun") {
    await this.init();
    if (!this.ctx || !this.masterGain || this.active) return;
    this.active = true;

    // Frequencies based on planetary archetypes
    const baseFreqs: Record<string, number> = {
      Mars: 43.65,    // F1 - low, grounding
      Venus: 221.23,  // A3 - harmonious
      Saturn: 73.42,  // D2 - structured, somber
      Jupiter: 183.58, // F#3 - expansive
      Mercury: 141.27, // C#3 - mental
      Moon: 210.42,   // G#3 - reflective
      Sun: 126.22,    // B2 - warm, center
    };
    const base = baseFreqs[planetName] || 126.22;

    // Ambient drone: two detuned oscillators for richness
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0;
    this.droneGain.connect(this.masterGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = base;
    osc1.connect(this.droneGain);
    osc1.start();

    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = base * 1.005; // slightly detuned → beating
    osc2.connect(this.droneGain);
    osc2.start();

    // Fade in drone
    this.droneGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 3);
  }

  /** The Witness — Deep, magnetic pulse on activation */
  playWitnessActivation() {
    if (!this.ctx || !this.masterGain || !this.active) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

    filter.type = "lowpass";
    filter.frequency.value = 400;

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.85);
  }

  stop() {
    if (!this.ctx || !this.droneGain) return;
    this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    this.active = false;
  }

  /** Soft shimmer — ascending tones for profile reveal */
  playShimmer() {
    if (!this.ctx || !this.masterGain || !this.active) return;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = this.ctx!.createGain();
      g.gain.value = 0;
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(this.ctx!.currentTime + i * 0.12);
      g.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + i * 0.12 + 0.05);
      g.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + i * 0.12 + 0.5);
      osc.stop(this.ctx!.currentTime + i * 0.12 + 0.6);
    });
  }

  /** Subtle chime — single tone for interactions */
  playChime(freq = 880) {
    if (!this.ctx || !this.masterGain || !this.active) return;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    g.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.02);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    osc.stop(this.ctx.currentTime + 0.9);
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}

// Singleton
let audioInstance: CosmicAudio | null = null;
function getAudio(): CosmicAudio {
  if (!audioInstance) audioInstance = new CosmicAudio();
  return audioInstance;
}

export default function SoundEngine() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    // Listen for cosmic events to trigger sounds
    const onShockwave = () => getAudio().playShimmer();
    const onChime = () => getAudio().playChime(1200);
    const onWitness = () => getAudio().playWitnessActivation();
    const onHover = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name && enabledRef.current) {
        playZodiacTone(detail.name, ZODIACFREQ[detail.name] ?? 528);
      }
    };

    window.addEventListener("cosmos:shockwave", onShockwave);
    window.addEventListener("cosmos:chime", onChime);
    window.addEventListener("witness:activated", onWitness);
    window.addEventListener("zodiac:hover", onHover as EventListener);

    return () => {
      window.removeEventListener("cosmos:shockwave", onShockwave);
      window.removeEventListener("cosmos:chime", onChime);
      window.removeEventListener("witness:activated", onWitness);
      window.removeEventListener("zodiac:hover", onHover as EventListener);
    };
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) {
      getAudio().stop();
      setEnabled(false);
    } else {
      const { getCosmicMoment } = await import("../lib/cosmic-time");
      const moment = getCosmicMoment(new Date());
      const planet = moment.planetaryHour.replace("Hour of ", "");
      getAudio().start(planet);
      setEnabled(true);
    }
  }, [enabled]);

  return (
    <>
    <button
      className="sound-engine-toggle"
      onClick={toggle}
      aria-label={enabled ? "Mute cosmic sounds" : "Enable cosmic sounds"}
      aria-pressed={enabled}
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 40,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(200,185,255,0.1)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        color: enabled ? "rgba(212,175,55,0.7)" : "rgba(180,170,210,0.3)",
        fontSize: "0.85rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: `all 0.3s ${EASE}`,
      }}
    >
      {enabled ? "♪" : "♪̸"}
    </button>
    <style jsx>{`
      @media (max-width: 767px) {
        .sound-engine-toggle {
          bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px)) !important;
        }
      }
    `}</style>
    </>
  );
}
