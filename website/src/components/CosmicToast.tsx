/**
 * CosmicToast — Bold daily one-liner notification
 *
 * Shows on page visit if user has birth data saved.
 * Glass morphism slide-down, auto-dismiss 8s, shareable.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadUser } from "../lib/user-store";
import { getDailyToast, hasSeenToday, markToastSeen } from "../lib/cosmic-toasts";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function CosmicToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [signGlyph, setSignGlyph] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasSeenToday()) return;
    const user = loadUser();
    if (!user) return;

    const toast = getDailyToast(user.sunSign);
    const GLYPHS: Record<string, string> = {
      Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
      Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
      Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
    };

    requestAnimationFrame(() => {
      setMessage(toast);
      setSignGlyph(GLYPHS[user.sunSign] || "✦");
    });

    // Delay appearance for smooth entry
    const showTimer = setTimeout(() => setVisible(true), 1500);

    // Auto-dismiss after 12s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      markToastSeen();
    }, 13500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    markToastSeen();
  }, []);

  const share = useCallback(() => {
    if (message && navigator.share) {
      navigator.share({
        title: "Olivia Arcana — Daily Cosmic Message",
        text: message + "\n\n✦ oliviaarcana.com",
      }).catch(() => {});
    } else if (message) {
      navigator.clipboard?.writeText(message + "\n\n✦ oliviaarcana.com");
    }
  }, [message]);

  if (!message) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{
            position: "fixed",
            top: "5.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 55,
            width: "min(90vw, 520px)",
          }}
        >
          <div
            style={{
              background: "rgba(8,6,20,0.75)",
              backdropFilter: "blur(20px) saturate(1.3)",
              WebkitBackdropFilter: "blur(20px) saturate(1.3)",
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(212,175,55,0.05)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            {/* Glyph */}
            <span style={{
              fontSize: "1.3rem",
              color: "rgba(212,175,55,0.6)",
              flexShrink: 0,
              marginTop: "0.1rem",
            }}>
              {signGlyph}
            </span>

            {/* Message */}
            <p style={{
              flex: 1,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "0.82rem",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "rgba(240,236,255,0.88)",
              margin: 0,
            }}>
              {message}
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0, marginTop: "0.1rem" }}>
              <button
                onClick={share}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "rgba(200,185,240,0.4)",
                  padding: "0.25rem",
                  transition: "color 0.2s",
                }}
                title="Share"
              >
                ↗
              </button>
              <button
                onClick={dismiss}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "rgba(200,185,240,0.4)",
                  padding: "0.25rem",
                  transition: "color 0.2s",
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 12, ease: "linear" }}
            style={{
              height: "2px",
              background: "linear-gradient(90deg, rgba(212,175,55,0.4), rgba(160,120,255,0.3))",
              borderRadius: "0 0 1rem 1rem",
              marginTop: "-1px",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
