/**
 * ShareCardModal — Format selector + preview + share/download
 *
 * Three formats: Instagram (1:1), Story (9:16), Twitter (1.91:1)
 * Live canvas preview, share via Web Share API or download PNG.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { renderChartCard, shareChartCard, type CardFormat } from "../lib/chart-card-renderer";
import { useLocale } from "../lib/i18n/useLocale";

interface CardData {
  signName: string;
  signGlyph: string;
  bigThree: string;
  element: string;
  elementEmoji: string;
  cosmicEnergy: number;
  horoscope: string;
  luckyColor: string;
  luckyColorHex: string;
  dateRange: string;
  traits: string[];
}

interface Props {
  data: CardData;
  open: boolean;
  onClose: () => void;
}

const FORMATS: { key: CardFormat; label: string; aspect: string; icon: string }[] = [
  { key: "square", label: "Instagram", aspect: "1:1", icon: "◻" },
  { key: "story", label: "Story", aspect: "9:16", icon: "▯" },
  { key: "twitter", label: "Twitter", aspect: "1.91:1", icon: "▬" },
];

export default function ShareCardModal({ data, open, onClose }: Props) {
  const [format, setFormat] = useState<CardFormat>("square");
  const [preview, setPreview] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const { t } = useLocale();

  // Generate preview when format changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreview(null);
    renderChartCard(data, format).then((blob) => {
      if (cancelled) return;
      setPreview(URL.createObjectURL(blob));
    });
    return () => { cancelled = true; };
  }, [data, format, open]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      await shareChartCard(data, format);
    } catch (e) {
      console.warn("Share failed:", e);
    }
    setSharing(false);
  }, [data, format]);

  if (!open) return null;

  const previewAspects: Record<CardFormat, string> = {
    square: "aspect-square",
    story: "aspect-[9/16]",
    twitter: "aspect-[1.91/1]",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(4,2,13,0.85)", backdropFilter: "blur(8px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-warm-ivory">
              {t("profile_share")}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-muted-lavender hover:text-warm-ivory transition-colors flex items-center justify-center"
            >
              &times;
            </button>
          </div>

          {/* Format selector */}
          <div className="flex gap-2 mb-5">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-center transition-all duration-300 ${
                  format === f.key
                    ? "bg-celestial-gold/15 border border-celestial-gold/30 text-celestial-gold"
                    : "bg-white/3 border border-white/5 text-muted-lavender hover:text-warm-ivory"
                }`}
              >
                <div className="text-lg mb-1">{f.icon}</div>
                <div className="text-xs font-medium">{f.label}</div>
                <div className="text-[0.6rem] opacity-50">{f.aspect}</div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="mb-5 flex justify-center">
            <div
              className="relative overflow-hidden rounded-lg border border-white/5"
              style={{
                width: format === "story" ? "180px" : format === "twitter" ? "280px" : "240px",
                aspectRatio: format === "story" ? "9/16" : format === "twitter" ? "1.91/1" : "1/1",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Chart card preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/3 flex items-center justify-center">
                  <div className="text-muted-lavender/40 text-sm animate-pulse">
                    {t("common_loading")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              disabled={sharing || !preview}
              className="flex-1 py-3 rounded-full bg-gradient-to-r from-celestial-gold to-[#F5E6A3] text-void-black font-semibold text-sm hover:scale-[1.02] transition-all duration-300 disabled:opacity-40"
            >
              {sharing ? t("common_loading") : (typeof navigator !== "undefined" && "share" in navigator) ? "Share" : "Download PNG"}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-full bg-white/5 border border-white/10 text-muted-lavender text-sm hover:text-warm-ivory transition-colors"
            >
              {t("common_back")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
