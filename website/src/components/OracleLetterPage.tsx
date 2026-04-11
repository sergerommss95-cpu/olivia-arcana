/**
 * OracleLetterPage.tsx — Full-page oracle reading rendered as an ancient letter
 *
 * Wax seal animation, parchment texture, drop cap, print/save support.
 * Designed to feel like receiving a sealed letter from the cosmos.
 */

"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

export interface OracleLetterProps {
  cardName: string;
  cardGlyph?: string;
  reading: string;
  userName?: string;
  cosmicMoment: {
    planetaryHour: string;
    moonPhase: string;
    season: string;
    romanDate: string;
    romanYear: string;
  };
  onClose: () => void;
}

export default function OracleLetterPage({
  cardName,
  cardGlyph,
  reading,
  userName,
  cosmicMoment,
  onClose,
}: OracleLetterProps) {
  const letterRef = useRef<HTMLDivElement>(null);
  const [sealBroken, setSealBroken] = useState(false);
  const [saving, setSaving] = useState(false);

  // Break the seal after animation
  const handleSealComplete = useCallback(() => {
    setSealBroken(true);
  }, []);

  // Save as image via html2canvas
  const handleSave = useCallback(async () => {
    if (!letterRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(letterRef.current, {
        backgroundColor: "#0c0d18",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `olivia-arcana-${cardName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Silently fail — user can use print instead
    } finally {
      setSaving(false);
    }
  }, [cardName, saving]);

  // Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(.oracle-letter-overlay) { display: none !important; }
          .oracle-letter-overlay {
            position: static !important;
            overflow: visible !important;
            background: #0c0d18 !important;
          }
          .oracle-letter-overlay * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .oracle-letter-actions { display: none !important; }
          .oracle-letter-close { display: none !important; }
        }
      `}</style>

      <AnimatePresence>
        <motion.div
          className="oracle-letter-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            background: "var(--c-deep, #0c0d18)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="oracle-letter-close"
            aria-label="Close oracle letter"
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 110,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid var(--c-border, rgba(255,255,255,0.1))",
              background: "var(--glass-bg, rgba(12,13,24,0.6))",
              backdropFilter: "blur(12px)",
              color: "var(--c-text-muted, #8A87A0)",
              fontSize: "1.25rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--c-text, #E8E6F0)";
              e.currentTarget.style.borderColor = "var(--c-gold-dim, #8A6D2A)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--c-text-muted, #8A87A0)";
              e.currentTarget.style.borderColor = "var(--c-border, rgba(255,255,255,0.1))";
            }}
          >
            &times;
          </button>

          {/* Letter content */}
          <div
            ref={letterRef}
            style={{
              maxWidth: 680,
              margin: "0 auto",
              padding: "60px 32px 80px",
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              /* Parchment noise texture via CSS */
              backgroundImage: `
                radial-gradient(ellipse at 50% 0%, rgba(200,168,75,0.03) 0%, transparent 60%),
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E")
              `,
              backgroundColor: "var(--c-deep, #0c0d18)",
            }}
          >
            {/* Wax seal */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                duration: 1.5,
              }}
              onAnimationComplete={handleSealComplete}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "radial-gradient(circle at 40% 35%, #D4A03A, #8A6D2A 70%)",
                boxShadow: "0 4px 24px rgba(200,168,75,0.3), inset 0 1px 2px rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                color: "var(--c-deep, #0c0d18)",
                marginBottom: 40,
                flexShrink: 0,
              }}
            >
              {cardGlyph || "\u2726"}
            </motion.div>

            {/* Content — fades in after seal */}
            <AnimatePresence>
              {sealBroken && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width: "100%" }}
                >
                  {/* Roman date header */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "var(--text-xs, 0.75rem)",
                      letterSpacing: "0.25em",
                      color: "var(--c-text-faint, #4A4860)",
                      textTransform: "uppercase",
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    {cosmicMoment.romanDate} &middot; {cosmicMoment.romanYear}
                  </div>

                  {/* Cosmic moment stamp */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "var(--text-xs, 0.75rem)",
                      letterSpacing: "0.15em",
                      color: "var(--c-text-faint, #4A4860)",
                      textAlign: "center",
                      marginBottom: 40,
                    }}
                  >
                    {cosmicMoment.moonPhase} &middot; Hour of {cosmicMoment.planetaryHour} &middot; {cosmicMoment.season}
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      width: 40,
                      height: 1,
                      background: "var(--c-gold-dim, #8A6D2A)",
                      margin: "0 auto 32px",
                      opacity: 0.5,
                    }}
                  />

                  {/* Card name heading */}
                  <h1
                    style={{
                      fontFamily: "var(--font-heading, serif)",
                      fontSize: "var(--text-xl, 2.25rem)",
                      fontWeight: 400,
                      color: "var(--c-gold, #C8A84B)",
                      textAlign: "center",
                      marginBottom: 8,
                      lineHeight: 1.2,
                    }}
                  >
                    {cardName}
                  </h1>

                  {/* Salutation */}
                  {userName && (
                    <p
                      style={{
                        fontFamily: "var(--font-heading, serif)",
                        fontSize: "var(--text-md, 1.25rem)",
                        fontStyle: "italic",
                        color: "var(--c-text-muted, #8A87A0)",
                        textAlign: "center",
                        marginBottom: 32,
                      }}
                    >
                      For {userName}
                    </p>
                  )}

                  {/* Reading body with drop cap */}
                  <div
                    className="oracle-reading-body"
                    style={{
                      fontFamily: "var(--font-heading, serif)",
                      fontSize: "var(--text-md, 1.25rem)",
                      lineHeight: 1.8,
                      color: "var(--c-text, #E8E6F0)",
                      textAlign: "left",
                      marginBottom: 48,
                    }}
                  >
                    <style>{`
                      .oracle-reading-body::first-letter {
                        font-family: var(--font-heading, serif);
                        font-size: 4em;
                        float: left;
                        line-height: 0.8;
                        padding-right: 12px;
                        padding-top: 6px;
                        color: var(--c-gold, #C8A84B);
                        font-weight: 400;
                      }
                    `}</style>
                    {reading}
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      width: 40,
                      height: 1,
                      background: "var(--c-gold-dim, #8A6D2A)",
                      margin: "0 auto 32px",
                      opacity: 0.5,
                    }}
                  />

                  {/* Watermark */}
                  <p
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "var(--text-xs, 0.75rem)",
                      letterSpacing: "0.2em",
                      color: "var(--c-text-faint, #4A4860)",
                      textAlign: "center",
                      opacity: 0.5,
                      marginBottom: 48,
                    }}
                  >
                    {"\u2726"} Olivia Arcana
                  </p>

                  {/* Action buttons */}
                  <div
                    className="oracle-letter-actions"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        fontFamily: "var(--font-body, sans-serif)",
                        fontSize: "var(--text-sm, 0.875rem)",
                        padding: "10px 24px",
                        borderRadius: "var(--radius-pill, 9999px)",
                        border: "1px solid var(--c-gold-dim, #8A6D2A)",
                        background: "transparent",
                        color: "var(--c-gold, #C8A84B)",
                        cursor: saving ? "wait" : "pointer",
                        opacity: saving ? 0.6 : 1,
                        transition: "background 0.2s, opacity 0.2s",
                        letterSpacing: "0.05em",
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) e.currentTarget.style.background = "rgba(200,168,75,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {saving ? "Saving..." : "Save as Image"}
                    </button>
                    <button
                      onClick={handlePrint}
                      style={{
                        fontFamily: "var(--font-body, sans-serif)",
                        fontSize: "var(--text-sm, 0.875rem)",
                        padding: "10px 24px",
                        borderRadius: "var(--radius-pill, 9999px)",
                        border: "1px solid var(--c-border, rgba(255,255,255,0.1))",
                        background: "transparent",
                        color: "var(--c-text-muted, #8A87A0)",
                        cursor: "pointer",
                        transition: "background 0.2s, color 0.2s",
                        letterSpacing: "0.05em",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "var(--c-text, #E8E6F0)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--c-text-muted, #8A87A0)";
                      }}
                    >
                      Print
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
