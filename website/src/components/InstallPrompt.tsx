/**
 * InstallPrompt.tsx — PWA install banner
 *
 * Listens for `beforeinstallprompt` event.
 * Shows a subtle bottom banner with install + dismiss buttons.
 * Remembers dismissal in localStorage for 7 days.
 * Also registers the service worker on mount.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";

const DISMISS_KEY = "olivia-arcana-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const PROMPT_DELAY = 12000;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPromptRef = useRef<Event | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — that's okay
      });
    }

    // Check if dismissed recently
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION) {
        return;
      }
    } catch {}

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      showTimerRef.current = setTimeout(() => setShow(true), PROMPT_DELAY);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current as (Event & { prompt?: () => Promise<void> }) | null;
    if (!prompt?.prompt) return;
    await prompt.prompt();
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    setShow(false);
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9998,
      padding: "0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      background: "rgba(8,6,20,0.92)",
      backdropFilter: "blur(8px) ",
      WebkitBackdropFilter: "blur(8px) ",
      borderTop: "1px solid rgba(200,185,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
      animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <span style={{
        fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
        color: "rgba(196,185,228,0.7)", flex: 1, textAlign: "center",
      }}>
        Install Olivia Arcana for the full experience
      </span>

      <button onClick={handleInstall} style={{
        padding: "0.45rem 1rem", borderRadius: "100px",
        background: "linear-gradient(135deg, rgba(160,120,255,0.22), rgba(100,80,220,0.18))",
        border: "1px solid rgba(200,180,255,0.22)",
        color: "rgba(240,235,255,0.95)", fontSize: "0.68rem", fontWeight: 500,
        letterSpacing: "0.06em", textTransform: "uppercase",
        cursor: "pointer", transition: `all 0.3s ${EASE}`,
        whiteSpace: "nowrap",
        minHeight: "44px",
      }}>Install</button>

      <button onClick={handleDismiss} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(180,170,210,0.35)", fontSize: "1rem",
        padding: "0.2rem 0.4rem", lineHeight: 1,
        minWidth: "44px",
        minHeight: "44px",
        transition: "color 0.2s",
      }} aria-label="Dismiss">{"\u2715"}</button>
    </div>
  );
}
