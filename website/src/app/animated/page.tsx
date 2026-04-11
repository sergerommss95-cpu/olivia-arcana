"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import AnimatedHoroscopeCard from "../../components/AnimatedHoroscopeCard";
import { getCosmicProfile, getTodayHoroscope } from "../../lib/zodiac-utils";
import { loadUser } from "../../lib/user-store";
import { useLocale } from "../../lib/i18n/useLocale";
import html2canvas from "html2canvas";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const SIGNS = [
  { name: "Aries", glyph: "\u2648", index: 0 },
  { name: "Taurus", glyph: "\u2649", index: 1 },
  { name: "Gemini", glyph: "\u264A", index: 2 },
  { name: "Cancer", glyph: "\u264B", index: 3 },
  { name: "Leo", glyph: "\u264C", index: 4 },
  { name: "Virgo", glyph: "\u264D", index: 5 },
  { name: "Libra", glyph: "\u264E", index: 6 },
  { name: "Scorpio", glyph: "\u264F", index: 7 },
  { name: "Sagittarius", glyph: "\u2650", index: 8 },
  { name: "Capricorn", glyph: "\u2651", index: 9 },
  { name: "Aquarius", glyph: "\u2652", index: 10 },
  { name: "Pisces", glyph: "\u2653", index: 11 },
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#FF6B35",
  Water: "#4FC3F7",
  Air: "#CE93D8",
  Earth: "#7CB342",
};

export default function AnimatedPage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-select user's sign
  useEffect(() => {
    setMounted(true);

    // Check URL param first
    const params = new URLSearchParams(window.location.search);
    const signParam = params.get("sign");
    if (signParam) {
      const found = SIGNS.findIndex(
        (s) => s.name.toLowerCase() === signParam.toLowerCase()
      );
      if (found >= 0) {
        setSelectedIdx(found);
        return;
      }
    }

    // Then check user data
    const user = loadUser();
    if (user) {
      const found = SIGNS.findIndex((s) => s.name === user.sunSign);
      if (found >= 0) setSelectedIdx(found);
    }
  }, []);

  const selected = SIGNS[selectedIdx];
  const profile = getCosmicProfile(selected.name, selected.glyph, selected.index);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `olivia-arcana-${selected.name.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
    }
  }, [selected.name]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/animated?sign=${selected.name.toLowerCase()}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [selected.name]);

  if (!mounted || !profile) return null;

  return (
    <div
      style={{
        minHeight: "100svh",
        position: "relative",
        zIndex: 1,
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "2rem 1.5rem 4rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <a
          href="/"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.6rem",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(180,170,210,0.4)",
            textDecoration: "none",
          }}
        >
          &larr; Home
        </a>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 400,
            marginTop: "0.75rem",
          }}
        >
          <span className="text-gold-gradient">Animated Horoscope</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 300,
            color: "rgba(196,185,228,0.55)",
            marginTop: "0.4rem",
          }}
        >
          Instagram-ready animated horoscope cards
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left: Sign selector + stats */}
        <div>
          {/* Sign grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.6rem",
              marginBottom: "1.5rem",
            }}
          >
            {SIGNS.map((sign, i) => {
              const signProfile = getCosmicProfile(sign.name, sign.glyph, sign.index);
              const isActive = i === selectedIdx;
              const elColor = signProfile
                ? ELEMENT_COLORS[signProfile.element] || "#D4AF37"
                : "#D4AF37";

              return (
                <motion.button
                  key={sign.name}
                  onClick={() => setSelectedIdx(i)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    ...glass,
                    padding: "0.6rem 0.3rem",
                    textAlign: "center",
                    cursor: "pointer",
                    border: isActive
                      ? `1px solid ${elColor}50`
                      : "1px solid rgba(200,185,255,0.08)",
                    background: isActive
                      ? `${elColor}08`
                      : "rgba(255,255,255,0.03)",
                    transition: `all 0.3s ${EASE}`,
                  }}
                >
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>
                    {sign.glyph}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.55rem",
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: "0.08em",
                      color: isActive ? elColor : "rgba(200,185,255,0.5)",
                    }}
                  >
                    {sign.name}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ ...glass, padding: "1.25rem", marginBottom: "1rem" }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(180,170,210,0.4)",
                marginBottom: "0.75rem",
              }}
            >
              {selected.name} Overview
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Element
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.85)",
                  }}
                >
                  {profile.elementEmoji} {profile.element}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Modality
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.85)",
                  }}
                >
                  {profile.modality}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Ruler
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.85)",
                  }}
                >
                  {profile.rulerEmoji} {profile.ruler}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Lucky Day
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.85)",
                  }}
                >
                  {profile.luckyDay}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Lucky Color
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.85)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: profile.luckyColorHex,
                      display: "inline-block",
                    }}
                  />
                  {profile.luckyColor}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.5rem",
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Gemstone
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                    color: "rgba(240,236,255,0.85)",
                  }}
                >
                  {profile.gemstone}
                </div>
              </div>
            </div>

            {/* Traits */}
            <div style={{ marginTop: "1rem" }}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.5rem",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(180,170,210,0.35)",
                  marginBottom: "0.4rem",
                }}
              >
                Key Traits
              </div>
              {profile.traits.map((trait, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    fontWeight: 300,
                    color: "rgba(196,185,228,0.55)",
                    lineHeight: 1.6,
                    paddingLeft: "0.6rem",
                    borderLeft: `1px solid ${profile.luckyColorHex}20`,
                    marginBottom: "0.3rem",
                  }}
                >
                  {trait}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: "0.65rem 1rem",
                borderRadius: "100px",
                background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "rgba(212,175,55,0.9)",
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: `all 0.3s ${EASE}`,
              }}
            >
              Download PNG
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1,
                padding: "0.65rem 1rem",
                borderRadius: "100px",
                background: "rgba(200,185,255,0.05)",
                border: "1px solid rgba(200,185,255,0.15)",
                color: "rgba(200,185,255,0.7)",
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: `all 0.3s ${EASE}`,
              }}
            >
              {linkCopied ? "Link Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Right: Live preview */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            position: "sticky",
            top: "2rem",
          }}
        >
          <div ref={cardRef}>
            <AnimatedHoroscopeCard
              key={selected.name}
              signName={selected.name}
              signGlyph={selected.glyph}
              element={profile.element}
              elementEmoji={profile.elementEmoji}
              horoscope={profile.horoscope}
              dateRange={profile.dateRange}
              luckyColorHex={profile.luckyColorHex}
            />
          </div>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"][style*="gap: 2rem"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
