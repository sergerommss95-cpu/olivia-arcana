/**
 * CosmicProfile.tsx — Luxury cosmic identity panel
 *
 * MOTION RULES:
 *   - ONE easing curve everywhere: cubic-bezier(0.16, 1, 0.3, 1) (expo ease-out)
 *   - No double-fade: container starts at opacity:1, Hero handles wrapper entrance
 *   - Variable stagger: grouped by content blocks, not uniform
 *   - Typewriter starts when its section appears, not on a fixed timer
 *   - Energy bar fills when its section appears
 *   - Scan line completes in 2.5s
 *   - Total internal sequence: ~2s
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CosmicProfile as CosmicProfileData } from "../lib/zodiac-utils";
import { getCosmicEnergy } from "../lib/zodiac-utils";
import WhisperText from "./WhisperText";
import { textWordSpacing } from "../lib/micro-typography";
import ShareCardModal from "./ShareCardModal";
import { useLocale } from "../lib/i18n/useLocale";
import { getZodiacRoast, type ZodiacRoast } from "../lib/viral-roast";
import { loadUser } from "../lib/user-store";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface Props {
  profile: CosmicProfileData;
}

function Typewriter({ text, delay, speed = 32 }: { text: string; delay: number; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setDisplayed("");
      setStarted(false);
    });
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  useEffect(() => {
    if (!started || displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed]);

  return (
    <span>
      {displayed}
      {started && displayed.length < text.length && (
        <span style={{
          display: "inline-block", width: "1px", height: "0.85em",
          background: "rgba(200,180,255,0.5)", marginLeft: "1px",
          animation: "cursorBlink 0.8s step-end infinite",
          verticalAlign: "text-bottom",
        }} />
      )}
    </span>
  );
}

export default function CosmicProfile({ profile }: Props) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const energy = getCosmicEnergy(profile.name);
  const [energyWidth, setEnergyWidth] = useState(0);
  const [traitsReady, setTraitsReady] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [roast, setRoast] = useState<ZodiacRoast | null>(null);
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setRoast(getZodiacRoast(profile.name));
      const user = loadUser();
      if (user) {
        const now = new Date();
        if (now.getMonth() + 1 === user.input.month && now.getDate() === user.input.day) {
          setIsBirthday(true);
        }
      }
    });
  }, [profile.name]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!containerRef.current) return;

    // NO container fade — Hero.tsx handles the wrapper entrance.
    // We only do the glow pulse and scan line here.

    // Subtle glow pulse on card border (one-shot)
    containerRef.current.animate(
      [
        { boxShadow: "0 0 0px rgba(180,160,255,0), 0 4px 40px rgba(80,50,160,0.08)" },
        { boxShadow: "0 0 40px rgba(180,160,255,0.12), 0 4px 40px rgba(80,50,160,0.12)", offset: 0.5 },
        { boxShadow: "0 0 0px rgba(180,160,255,0), 0 4px 40px rgba(80,50,160,0.08)" },
      ],
      { duration: 2500, easing: "ease-in-out", fill: "forwards" }
    );

    // Golden scan line — 2.5s
    scanRef.current?.animate(
      [
        { top: "-2px", opacity: "0" },
        { top: "3%", opacity: "0.7", offset: 0.04 },
        { top: "97%", opacity: "0.4", offset: 0.94 },
        { top: "100%", opacity: "0" },
      ],
      { duration: 2500, delay: 100, easing: EASE, fill: "forwards" }
    );

    // ── Variable stagger — grouped by content blocks ──
    // Group 1: header + divider (fast, 80ms gap)
    // Group 2: trio (150ms after group 1)
    // Group 3: traits (180ms)
    // Group 4: energy + compat + lucky (100ms rapid-fire)
    // Group 5: reading + CTAs (120ms)
    const delays = [
      100,   // [0] glyph + name
      180,   // [1] divider
      350,   // [2] trio
      550,   // [3] traits
      750,   // [4] energy
      850,   // [5] compatibility
      950,   // [6] lucky stats
      1100,  // [7] reading
      1220,  // [8] CTAs
    ];

    const items = containerRef.current.querySelectorAll<HTMLElement>("[data-r]");
    items.forEach((el, i) => {
      const d = delays[i] ?? (1200 + i * 100);
      el.animate(
        [
          { opacity: "0", transform: "translateY(10px)" },
          { opacity: "1", transform: "translateY(0)" },
        ],
        { duration: 500, delay: d, easing: EASE, fill: "forwards" }
      );
    });

    // Traits typewriter starts when traits section appears
    setTimeout(() => setTraitsReady(true), delays[3]);

    // Energy bar fill starts when energy section appears
    setTimeout(() => setEnergyWidth(energy), delays[4]);

  }, [profile.name, energy]);

  const glass: React.CSSProperties = {
    background: "rgba(10, 8, 30, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "1rem",
    backdropFilter: "blur(24px) saturate(1.2)",
    WebkitBackdropFilter: "blur(24px) saturate(1.2)",
  };

  const label: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "var(--c-gold)",
    opacity: 0.85,
  };

  const elBg: Record<string, string> = {
    Fire: "rgba(255,107,53,0.1)", Water: "rgba(79,195,247,0.1)",
    Air: "rgba(224,224,224,0.06)", Earth: "rgba(124,179,66,0.1)",
  };

  const GLYPHS: Record<string, string> = {
    Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
    Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
    Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "1.25rem", maxWidth: "440px", width: "100%",
        padding: "clamp(1.25rem, 4vw, 2.25rem) clamp(1rem, 3vw, 2rem) clamp(1.25rem, 3vw, 1.75rem)",
        // opacity: 1 — Hero wrapper handles the entrance fade
        ...glass,
        border: "1px solid rgba(200,185,255,0.1)",
        borderRadius: "1.5rem",
        overflow: "hidden",
      }}
    >
      {/* Scan line */}
      <div ref={scanRef} style={{
        position: "absolute", left: "8%", right: "8%", top: "-2px", height: "1px",
        opacity: 0, pointerEvents: "none", zIndex: 10,
        background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), rgba(255,230,150,0.5), rgba(212,175,55,0.4), transparent)",
        boxShadow: "0 0 12px rgba(212,175,55,0.2)",
      }} />

      {/* Solar Return Banner */}
      {isBirthday && (
        <div data-r style={{
          width: "calc(100% + 4rem)", margin: "-1rem -2rem 0.5rem",
          padding: "0.6rem", textAlign: "center",
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(255,230,150,0.3), rgba(212,175,55,0.2), transparent)",
          borderTop: "1px solid rgba(212,175,55,0.2)",
          borderBottom: "1px solid rgba(212,175,55,0.2)",
        }}>
          <span style={{ ...label, color: "#F4E9D0", letterSpacing: "0.25em" }}>Solar Return Peak &bull; Happy Birthday</span>
        </div>
      )}

      {/* Glyph + Name */}
      <div data-r style={{ opacity: 0, textAlign: "center" }}>
        <div style={{
          fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.75rem",
          textShadow: "0 0 40px rgba(212,175,55,0.2)",
        }}>
          {profile.glyph}
        </div>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.75rem", fontWeight: 500, letterSpacing: "0.14em",
          color: "#f5f2e1", textTransform: "uppercase",
        }}>
          {profile.name}
        </div>
        <div style={{ ...label, marginTop: "0.5rem", opacity: 1 }}>{profile.dateRange}</div>
      </div>

      {/* Divider */}
      <div data-r style={{ opacity: 0, width: "80px", height: "1.5px", background: "rgba(212,175,55,0.3)" }} />

      {/* Trio */}
      <div data-r style={{
        opacity: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: "0.75rem", width: "100%",
      }}>
        {[
          { emoji: profile.elementEmoji, value: profile.element, lbl: t("common_element") },
          { emoji: "✧", value: profile.modality, lbl: t("common_modality") },
          { emoji: profile.rulerEmoji, value: profile.ruler, lbl: t("common_ruler") },
        ].map(({ emoji, value, lbl }) => (
          <div key={lbl} style={{
            ...glass,
            background: lbl === "Element" ? elBg[profile.element] : "rgba(255,255,255,0.03)",
            padding: "1rem 0.5rem", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <span style={{ fontSize: "1.25rem", opacity: 0.9 }}>{emoji}</span>
            <span style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.95rem", fontWeight: 600,
              color: "#f5f2e1", letterSpacing: "0.04em",
            }}>{value}</span>
            <span style={{ ...label, fontSize: '0.55rem' }}>{lbl}</span>
          </div>
        ))}
      </div>

      {/* Traits */}
      <div data-r style={{ opacity: 0, width: "100%", padding: "0 0.25rem" }}>
        <div style={{ ...label, marginBottom: "0.75rem", opacity: 1 }}>{t("profile_your_cosmic_traits")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {profile.traits.map((trait, i) => (
            <div key={i} style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.6,
              color: "var(--c-text-secondary)", paddingLeft: "1rem", position: "relative",
              minHeight: "1.25em",
            }}>
              <span style={{
                position: "absolute", left: 0, top: "0.15em",
                color: "var(--c-gold)", fontSize: "0.6rem", opacity: 0.8
              }}>▸</span>
              {traitsReady ? (
                <Typewriter text={trait} delay={i * 400} speed={i === 0 ? 36 : 28} />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div data-r style={{ opacity: 0, width: "100%", padding: "0 0.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ ...label, opacity: 1 }}>{t("profile_cosmic_energy")}</span>
          <span style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.1rem", fontWeight: 600, color: "#f5f2e1",
          }}>{energy}%</span>
        </div>
        <div style={{
          width: "100%", height: "6px", borderRadius: "3px",
          background: "rgba(255,255,255,0.06)", overflow: "hidden",
        }}>
          <div style={{
            width: `${energyWidth}%`, height: "100%", borderRadius: "3px",
            background: `linear-gradient(90deg, ${profile.luckyColorHex}88, ${profile.luckyColorHex})`,
            transition: `width 2s ${EASE}`,
            boxShadow: `0 0 12px ${profile.luckyColorHex}44`,
          }} />
        </div>
      </div>

      {/* Compatibility */}
      <div data-r style={{ opacity: 0, width: "100%", padding: "0 0.25rem" }}>
        <div style={{ ...label, marginBottom: "0.75rem", opacity: 1 }}>{t("profile_best_match")}</div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {profile.bestMatch.map(m => (
            <div key={m} style={{
              ...glass, padding: "0.6rem 1rem",
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontSize: "1rem", opacity: 0.9 }}>{GLYPHS[m]}</span>
              <span style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem", color: "#f5f2e1", letterSpacing: "0.04em",
                fontWeight: 600
              }}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lucky Stats */}
      <div data-r style={{
        opacity: 0, width: "100%", display: "grid",
        gridTemplateColumns: "1fr 1fr", gap: "0.75rem", padding: "0 0.25rem",
      }}>
        {[
          { l: t("profile_lucky_numbers"), v: profile.luckyNumbers.join(", ") },
          { l: t("profile_lucky_day"), v: profile.luckyDay },
          { l: t("profile_lucky_color"), v: profile.luckyColor, sw: profile.luckyColorHex },
          { l: t("profile_gemstone"), v: profile.gemstone },
        ].map(({ l, v, sw }) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <span style={{ ...label, fontSize: '0.55rem', opacity: 0.7 }}>{l}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem",
              fontWeight: 600, color: "var(--c-text-primary)",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              {sw && <span style={{
                display: "inline-block", width: "10px", height: "10px",
                borderRadius: "50%", background: sw, boxShadow: `0 0 8px ${sw}66`,
              }} />}
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Zodiac Roast */}
      {roast && (
        <div data-r style={{ opacity: 0, width: "100%", padding: "0 0.25rem" }}>
          <div style={{ ...label, marginBottom: "0.75rem", color: "#E8524A", opacity: 1 }}>Cosmic Reality Check</div>
          <div style={{
            ...glass, padding: "1.25rem", background: "rgba(232,82,74,0.06)",
            border: "1px solid rgba(232,82,74,0.25)",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontStyle: "italic",
              color: "#f5f2e1", marginBottom: "0.6rem", fontWeight: 600
            }}>{roast.tagline}</div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 400,
              lineHeight: 1.6, color: "var(--c-text-secondary)", margin: 0,
            }}>{roast.roast}</p>
            <div style={{
              marginTop: "0.75rem", fontSize: "0.7rem", fontFamily: "var(--font-mono)",
              color: "var(--c-gold)", textTransform: "uppercase", letterSpacing: "0.12em",
              fontWeight: 700
            }}>Advice: {roast.advice}</div>
          </div>
        </div>
      )}

      {/* Reading */}
      <div data-r style={{ opacity: 0, width: "100%", padding: "0 0.25rem" }}>
        <div style={{
          width: "100%", height: "1px", marginBottom: "1rem",
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)",
        }} />
        <div style={{ ...label, marginBottom: "0.75rem", opacity: 1 }}>{t("profile_todays_reading")}</div>
        <div className="reading-text" style={{
          fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 400,
          lineHeight: 1.7, color: "var(--c-text-primary)", margin: 0,
          fontStyle: "italic", wordSpacing: textWordSpacing(profile.horoscope),
          textShadow: '0 2px 20px rgba(0,0,0,0.5)'
        }}>
          &ldquo;<WhisperText text={profile.horoscope} delay={1200} wordDelay={55} />&rdquo;
        </div>
      </div>

      {/* CTAs */}
      <div data-r style={{ opacity: 0, display: "flex", gap: "0.75rem", width: "100%", marginTop: "0.5rem" }}>
        <a href="/portrait" style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0.85rem 1rem", borderRadius: "100px",
          background: "linear-gradient(135deg, #d4af37 0%, #f3dd8e 100%)",
          color: "var(--c-void)", fontSize: "0.8rem", fontWeight: 800,
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          textDecoration: "none", cursor: "pointer", transition: `all 300ms ${EASE}`,
          boxShadow: '0 10px 30px rgba(212,175,55,0.25)'
        }}>{t("profile_celestial_portrait")}</a>
        <button onClick={() => setShareModalOpen(true)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0.85rem 1rem", borderRadius: "100px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#f5f2e1", fontSize: "0.8rem", fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          cursor: "pointer", transition: `all 300ms ${EASE}`,
        }}>{t("profile_share")}</button>
      </div>

      <ShareCardModal
        data={{
          signName: profile.name,
          signGlyph: profile.glyph,
          bigThree: `Sun in ${profile.name}`,
          element: profile.element,
          elementEmoji: profile.elementEmoji,
          cosmicEnergy: energy,
          horoscope: profile.horoscope,
          luckyColor: profile.luckyColor,
          luckyColorHex: profile.luckyColorHex,
          dateRange: profile.dateRange,
          traits: profile.traits,
          roast: roast ? { tagline: roast.tagline, roast: roast.roast } : undefined,
        }}
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
