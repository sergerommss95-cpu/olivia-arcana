/**
 * ConstellationOverlay.tsx — Full-screen overlay when clicking a constellation
 *
 * Listens for 'zodiac:click' events. Shows a Cosmic Profile in a centered
 * overlay with a dark backdrop. Click backdrop or X to dismiss.
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { getCosmicProfile, type CosmicProfile as CosmicProfileData } from "../lib/zodiac-utils";
import CosmicProfile from "./CosmicProfile";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function ConstellationOverlay() {
  const [profile, setProfile] = useState<CosmicProfileData | null>(null);
  const [visible, setVisible] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const open = useCallback((sign: { name: string; glyph: string; index: number }) => {
    const p = getCosmicProfile(sign.name, sign.glyph, sign.index);
    if (!p) return;
    setProfile(p);
    setVisible(true);

    // Animate constellation to focus
    window.dispatchEvent(new CustomEvent("zodiac:activate", { detail: { index: sign.index } }));

    requestAnimationFrame(() => {
      backdropRef.current?.animate(
        [{ opacity: "0" }, { opacity: "1" }],
        { duration: 400, easing: EASE, fill: "forwards" }
      );
      cardRef.current?.animate(
        [
          { opacity: "0", transform: "scale(0.95) translateY(20px)", filter: "blur(6px)" },
          { opacity: "1", transform: "scale(1) translateY(0)", filter: "blur(0px)" },
        ],
        { duration: 600, delay: 200, easing: EASE, fill: "forwards" }
      );
    });
  }, []);

  const close = useCallback(() => {
    backdropRef.current?.animate(
      [{ opacity: "1" }, { opacity: "0" }],
      { duration: 300, easing: EASE, fill: "forwards" }
    );
    cardRef.current?.animate(
      [
        { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
        { opacity: "0", transform: "scale(0.97)", filter: "blur(4px)" },
      ],
      { duration: 300, easing: EASE, fill: "forwards" }
    );

    setTimeout(() => {
      setVisible(false);
      setProfile(null);
      window.dispatchEvent(new CustomEvent("zodiac:activate", { detail: { index: -1 } }));
    }, 320);
  }, []);

  useEffect(() => {
    const handle = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) open(detail);
    };
    window.addEventListener("zodiac:click", handle as EventListener);
    return () => window.removeEventListener("zodiac:click", handle as EventListener);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  if (!visible || !profile) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "rgba(4,2,13,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: 0,
        overflowY: "auto",
      }}
    >
      {/* Close button */}
      <button
        onClick={close}
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 51,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(200,185,255,0.1)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(200,185,240,0.6)",
          fontSize: "1.2rem",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        &times;
      </button>

      <div
        ref={cardRef}
        style={{
          opacity: 0,
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <CosmicProfile profile={profile} />
      </div>
    </div>
  );
}
