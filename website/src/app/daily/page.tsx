/**
 * Daily Reading — Premium interactive design
 *
 * Magical, readable, immersive. Sign selector as a circular zodiac wheel.
 * Animated transitions between signs. Rich typography hierarchy.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSunPosition, getMoonPosition, getMoonPhase } from "../../lib/celestial";
import { getTodayHoroscope } from "../../lib/zodiac-utils";
import { LIFE_AREAS } from "../../lib/planet-interpretations";
import ZodiacWheel, { type WheelSign } from "../../components/daily/ZodiacWheel";
import WhisperText from "../../components/WhisperText";
import { textWordSpacing } from "../../lib/micro-typography";
import { loadUser } from "../../lib/user-store";
import { useLocale } from "../../lib/i18n/useLocale";
import { useProfile, useStreak } from "../../lib/user/profile-store";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SIGNS: (WheelSign & { color: string })[] = [
  { name: "Aries",       glyph: "♈", element: "Fire",  color: "#FF6B35", dateRange: "Mar 21 — Apr 19" },
  { name: "Taurus",      glyph: "♉", element: "Earth", color: "#7CB342", dateRange: "Apr 20 — May 20" },
  { name: "Gemini",      glyph: "♊", element: "Air",   color: "#B0BEC5", dateRange: "May 21 — Jun 20" },
  { name: "Cancer",      glyph: "♋", element: "Water", color: "#4FC3F7", dateRange: "Jun 21 — Jul 22" },
  { name: "Leo",         glyph: "♌", element: "Fire",  color: "#FFB300", dateRange: "Jul 23 — Aug 22" },
  { name: "Virgo",       glyph: "♍", element: "Earth", color: "#66BB6A", dateRange: "Aug 23 — Sep 22" },
  { name: "Libra",       glyph: "♎", element: "Air",   color: "#CE93D8", dateRange: "Sep 23 — Oct 22" },
  { name: "Scorpio",     glyph: "♏", element: "Water", color: "#E8524A", dateRange: "Oct 23 — Nov 21" },
  { name: "Sagittarius", glyph: "♐", element: "Fire",  color: "#FF7043", dateRange: "Nov 22 — Dec 21" },
  { name: "Capricorn",   glyph: "♑", element: "Earth", color: "#8D6E63", dateRange: "Dec 22 — Jan 19" },
  { name: "Aquarius",    glyph: "♒", element: "Air",   color: "#4FC3F7", dateRange: "Jan 20 — Feb 18" },
  { name: "Pisces",      glyph: "♓", element: "Water", color: "#7E57C2", dateRange: "Feb 19 — Mar 20" },
];

function getLifeAreaReading(sign: string, area: string, dayOfYear: number): { power: string; pressure: string } {
  let h = 0;
  for (let i = 0; i < sign.length; i++) h = (h * 31 + sign.charCodeAt(i)) | 0;
  h = Math.abs((h ^ (dayOfYear * 2654435761) ^ (area.charCodeAt(0) * 16777619)) | 0);

  const powers: Record<string, string[]> = {
    self: ["Your sense of identity is crystallizing. You know who you are today.", "Self-confidence arrives without effort. Trust it.", "An old version of yourself is falling away. Let it."],
    thinking: ["Mental clarity is unusually high. Make the important decisions now.", "A creative breakthrough is forming. Don't force it — let it arrive.", "Your communication lands perfectly today. Say the hard thing."],
    love: ["Magnetic attraction is elevated. You draw the right attention.", "Emotional vulnerability opens a door that was locked.", "A relationship truth becomes clear. Act on it with grace."],
    routine: ["Productivity flows naturally. The system works if you trust it.", "A health insight arrives. Your body is speaking — listen.", "Work feels purposeful today. Effort converts directly to results."],
    spirituality: ["Intuition is unusually sharp. Follow the quiet voice, not the loud one.", "A dream from last night carries a real message. Revisit it.", "The boundary between imagination and insight dissolves. Both are true."],
    social: ["A friendship deepens unexpectedly. Let it happen.", "Your presence shifts group dynamics positively. Show up.", "An invitation arrives that's worth accepting. Say yes."],
  };
  const pressures: Record<string, string[]> = {
    self: ["Self-doubt creeps in without evidence. Name it and it loses power.", "You're comparing yourself to someone else's highlight reel. Stop.", "An identity question resurfaces. Sit with the discomfort."],
    thinking: ["Overthinking threatens to paralyze action. Set a timer and decide.", "A miscommunication needs repair. Clarify before assuming.", "Mental fatigue is real. Rest your mind or it'll rest itself."],
    love: ["Expectations clash with reality in a relationship. Adjust or communicate.", "An old romantic pattern repeats. Recognize it this time.", "Jealousy or comparison poisons the well. Choose trust."],
    routine: ["Your schedule feels like a trap. Build in one spontaneous break.", "A health habit you've been ignoring demands attention. Today.", "Burnout signals are flashing. Ignoring them costs more than pausing."],
    spirituality: ["Spiritual bypassing tempts you. Feel the feeling before transcending it.", "Escapism looks attractive. Face reality first — then dream.", "Your inner critic disguises itself as wisdom. It's not."],
    social: ["A social obligation drains you. It's okay to decline.", "Group dynamics feel off. Trust your read on the room.", "Someone's energy affects yours. Protect your space."],
  };
  return {
    power: (powers[area] || powers.self)[h % 3],
    pressure: (pressures[area] || pressures.self)[(h >> 8) % 3],
  };
}

function getDoDont(sign: string, dayOfYear: number) {
  let h = 0;
  for (let i = 0; i < sign.length; i++) h = (h * 31 + sign.charCodeAt(i)) | 0;
  h = Math.abs((h ^ (dayOfYear * 123457)) | 0);
  const dos = ["Speak first in a difficult conversation", "Take the scenic route", "Write down what you're feeling before reacting", "Let someone help you", "Start the project you've been avoiding", "Say no to one thing today", "Move your body before noon", "Reach out to someone you've been thinking about", "Trust your first instinct", "Create before you consume", "Leave space in your schedule for nothing", "Eat something that makes you feel alive"];
  const donts = ["Respond to messages that trigger you immediately", "Compare your chapter 1 to someone's chapter 20", "Skip the meal that grounds you", "Say yes out of obligation", "Scroll past the 30-minute mark", "Ignore the tension you feel in a relationship", "Work through lunch", "Abandon your routine for someone else's agenda", "Mistake urgency for importance", "Suppress what needs expression", "Perform confidence you don't feel", "Let fear make your decisions"];
  return {
    dos: [dos[h % 12], dos[(h + 3) % 12], dos[(h + 7) % 12]],
    donts: [donts[(h + 1) % 12], donts[(h + 5) % 12], donts[(h + 9) % 12]],
  };
}

export default function DailyPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const { profile } = useProfile();
  const { streak, tick } = useStreak();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount
    setMounted(true);
    // Auto-select user's sun sign (prefer new profile-store, fall back to legacy user-store)
    let idx = -1;
    if (profile) {
      idx = SIGNS.findIndex((s) => s.name === profile.signName);
    } else {
      const user = loadUser();
      if (user) idx = SIGNS.findIndex((s) => s.name === user.sunSign);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync saved sign once at mount
    if (idx >= 0) setSelected(idx);
    // Advance the daily-ritual streak exactly once per local day.
    tick();
    // only fire on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate content when sign changes
  useEffect(() => {
    if (selected === null || !contentRef.current) return;
    contentRef.current.animate(
      [
        { opacity: "0", transform: "translateY(16px)", filter: "blur(4px)" },
        { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
      ],
      { duration: 500, easing: EASE, fill: "forwards" }
    );
  }, [selected]);

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const sun = mounted ? getSunPosition(now) : null;
  const moon = mounted ? getMoonPosition(now) : null;
  const moonPhase = mounted ? getMoonPhase(now) : null;
  const sign = selected !== null ? SIGNS[selected] : null;
  const doDont = sign ? getDoDont(sign.name, dayOfYear) : null;

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* ── Radial element glow — colors the entire page atmosphere ── */}
      {sign && (
        <div style={{
          position: "fixed", top: "15%", left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "800px", borderRadius: "50%",
          background: `radial-gradient(circle, ${sign.color}12 0%, ${sign.color}06 30%, transparent 70%)`,
          pointerEvents: "none", zIndex: 0,
          transition: "background 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
          filter: "blur(40px)",
        }} />
      )}

      {/* ── Editorial hero ── */}
      <div style={{
        maxWidth: "900px", margin: "0 auto",
        padding: "calc(var(--nav-height, 5rem) + 2rem) clamp(1.25rem, 4vw, 2rem) 1.5rem",
        position: "relative", zIndex: 1,
        scrollMarginTop: "var(--nav-height, 5rem)",
      }}>
        <a href="/" style={{
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: "0.68rem", fontWeight: 500,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.55)", textDecoration: "none",
        }}>← {t("common_home")}</a>

        <div style={{
          display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap",
          marginTop: "1.5rem",
        }}>
          <div style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.72rem", fontWeight: 500,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: "rgba(232, 201, 106, 0.78)",
          }}>
            ✦ Today&apos;s almanac
          </div>
          {streak && streak.count > 1 && (
            <span
              aria-label={`You're on a ${streak.count}-day ritual streak`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                padding: "0.3rem 0.7rem", borderRadius: "100px",
                background: "rgba(232, 113, 48, 0.14)",
                border: "1px solid rgba(232, 113, 48, 0.35)",
                fontFamily: "var(--font-body, system-ui), sans-serif",
                fontSize: "0.7rem", fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(255, 190, 130, 0.95)",
              }}
            >
              <span aria-hidden style={{ fontSize: "0.8rem" }}>🔥</span>
              {streak.count}-day ritual
            </span>
          )}
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
          fontStyle: "italic",
          fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
          fontWeight: 400, lineHeight: 1.05,
          color: "#F5F0E8",
          letterSpacing: "-0.015em",
          margin: "0.75rem 0 0.5rem",
        }}>
          {t("daily_title")}
        </h1>

        <p style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
          fontSize: "1.15rem", fontWeight: 400,
          color: "rgba(220, 212, 240, 0.78)",
          margin: 0,
        }}>
          {now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>

        {/* Cosmic-weather pills — inline, not cards */}
        {sun && moon && moonPhase && (
          <div style={{
            display: "flex", gap: "0.55rem",
            marginTop: "1.5rem", flexWrap: "wrap",
          }}>
            {[
              { icon: "☉", text: `Sun in ${sun.sign}`, border: "rgba(232,201,106,0.35)" },
              { icon: moonPhase.emoji, text: moonPhase.phase, border: "rgba(200,200,220,0.2)" },
              { icon: "☽", text: `Moon in ${moon.sign}`, border: "rgba(178,150,240,0.32)" },
            ].map(({ icon, text, border }) => (
              <span key={text} style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 0.85rem", borderRadius: "100px",
                background: "rgba(14, 11, 36, 0.65)",
                border: `1px solid ${border}`,
                fontFamily: "var(--font-body, system-ui), sans-serif",
                fontSize: "0.76rem", fontWeight: 500,
                color: "rgba(240, 232, 220, 0.92)",
                letterSpacing: "0.02em",
              }}>
                <span aria-hidden style={{ fontSize: "0.9rem" }}>{icon}</span> {text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Sign selector — signature zodiac wheel ── */}
      <div style={{
        padding: "0.75rem clamp(1rem, 3vw, 2rem) 1.5rem",
        maxWidth: "720px", margin: "0 auto",
        position: "relative", zIndex: 1,
      }}>
        <ZodiacWheel
          signs={SIGNS}
          selectedIndex={selected}
          onSelect={(i) => setSelected(i)}
          centerGlyph={sign?.glyph}
          centerLabel={sign?.name}
        />
      </div>

      {/* ── Content — liquid glass container ── */}
      <div style={{
        maxWidth: "680px", margin: "0 auto", padding: "0 1.5rem 4rem",
        position: "relative", zIndex: 1,
      }}>
        {sign && doDont ? (
          <div
            ref={contentRef}
            style={{
              opacity: 0,
              background: "rgba(8,6,20,0.45)",
              backdropFilter: "blur(20px) saturate(1.2)",
              WebkitBackdropFilter: "blur(20px) saturate(1.2)",
              border: "1px solid rgba(200,185,255,0.06)",
              borderRadius: "1.5rem",
              padding: "2rem 1.75rem",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            {/* Sign hero */}
            <div style={{
              textAlign: "center", marginBottom: "2.5rem",
              padding: "2rem 0",
            }}>
              <div style={{
                fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.5rem",
                filter: `drop-shadow(0 0 20px ${sign.color}40)`,
              }}>{sign.glyph}</div>
              <h2 style={{
                fontFamily: "var(--font-accent)", fontSize: "1.8rem", fontWeight: 400,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(240,236,255,0.9)", margin: "0 0 0.25rem",
              }}>{sign.name}</h2>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: `${sign.color}88`,
              }}>{sign.element} Sign</span>
            </div>

            {/* ── Do / Don't — side by side, prominent ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2.5rem" }}>
              <div style={{
                padding: "1.5rem",
                background: "rgba(78,205,196,0.04)",
                border: "1px solid rgba(78,205,196,0.1)",
                borderRadius: "1.25rem",
              }}>
                <div style={{
                  fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 400,
                  color: "rgba(78,205,196,0.8)", marginBottom: "1rem",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(78,205,196,0.5)" }} />
                  {t("daily_do")}
                </div>
                {doDont.dos.map((d, i) => (
                  <p key={i} style={{
                    fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
                    lineHeight: 1.65, color: "rgba(220,210,240,0.75)",
                    margin: "0 0 0.6rem",
                    paddingBottom: i < 2 ? "0.6rem" : 0,
                    borderBottom: i < 2 ? "1px solid rgba(78,205,196,0.06)" : "none",
                  }}>{d}</p>
                ))}
              </div>
              <div style={{
                padding: "1.5rem",
                background: "rgba(232,82,74,0.03)",
                border: "1px solid rgba(232,82,74,0.08)",
                borderRadius: "1.25rem",
              }}>
                <div style={{
                  fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 400,
                  color: "rgba(232,82,74,0.7)", marginBottom: "1rem",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(232,82,74,0.4)" }} />
                  {t("daily_dont")}
                </div>
                {doDont.donts.map((d, i) => (
                  <p key={i} style={{
                    fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
                    lineHeight: 1.65, color: "rgba(220,210,240,0.65)",
                    margin: "0 0 0.6rem",
                    paddingBottom: i < 2 ? "0.6rem" : 0,
                    borderBottom: i < 2 ? "1px solid rgba(232,82,74,0.05)" : "none",
                  }}>{d}</p>
                ))}
              </div>
            </div>

            {/* ── Life areas ── */}
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 style={{
                fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 400,
                color: "rgba(240,236,255,0.85)", margin: "0 0 1.25rem",
                textAlign: "center",
              }}>{t("daily_by_life_area")}</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {LIFE_AREAS.map(area => {
                  const reading = getLifeAreaReading(sign.name, area.key, dayOfYear);
                  return (
                    <div key={area.key} style={{
                      padding: "1.25rem 1.5rem",
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(200,185,255,0.04)",
                      borderRadius: "1rem",
                      transition: `all 0.3s ${EASE}`,
                    }}>
                      {/* Area header */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem",
                      }}>
                        <span style={{
                          fontSize: "1.1rem",
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: "rgba(212,175,55,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "rgba(212,175,55,0.6)",
                        }}>{area.icon}</span>
                        <div>
                          <div style={{
                            fontFamily: "var(--font-accent)", fontSize: "0.95rem", fontWeight: 500,
                            color: "rgba(240,236,255,0.88)",
                          }}>{area.label}</div>
                          <div style={{
                            fontFamily: "var(--font-body)", fontSize: "0.6rem",
                            color: "rgba(180,170,210,0.3)",
                          }}>{area.desc}</div>
                        </div>
                      </div>

                      {/* Power + Pressure side by side */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem",
                          }}>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(78,205,196,0.6)" }} />
                            <span style={{
                              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                              letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(78,205,196,0.55)",
                            }}>{t("daily_power")}</span>
                          </div>
                          <p style={{
                            fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                            lineHeight: 1.7, color: "rgba(200,190,235,0.72)", margin: 0,
                          }}>{reading.power}</p>
                        </div>
                        <div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem",
                          }}>
                            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(212,175,55,0.5)" }} />
                            <span style={{
                              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                              letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)",
                            }}>{t("daily_pressure")}</span>
                          </div>
                          <p style={{
                            fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                            lineHeight: 1.7, color: "rgba(200,190,235,0.6)", margin: 0,
                          }}>{reading.pressure}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Today's message ── */}
            <div style={{
              padding: "2rem",
              background: "rgba(212,175,55,0.03)",
              border: "1px solid rgba(212,175,55,0.06)",
              borderRadius: "1.25rem",
              textAlign: "center",
              marginBottom: "2rem",
            }}>
              <div style={{ fontSize: "1.2rem", color: "rgba(212,175,55,0.3)", marginBottom: "0.75rem" }}>✦</div>
              <div className="reading-text" style={{
                fontFamily: "var(--font-body)", fontSize: "1.05rem", fontWeight: 400,
                lineHeight: 1.85, color: "rgba(220,210,240,0.7)",
                fontStyle: "italic", margin: 0,
                maxWidth: "480px", marginLeft: "auto", marginRight: "auto",
                wordSpacing: textWordSpacing(getTodayHoroscope(sign.name)),
              }}>
                &ldquo;<WhisperText text={getTodayHoroscope(sign.name)} delay={400} wordDelay={60} />&rdquo;
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: "center" }}>
              <a href="/portrait" style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.8rem 2rem", borderRadius: "100px",
                background: "linear-gradient(135deg, rgba(160,120,255,0.18), rgba(100,80,220,0.14))",
                border: "1px solid rgba(200,180,255,0.18)",
                color: "rgba(240,235,255,0.9)", fontSize: "0.8rem", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase",
                textDecoration: "none", transition: `all 0.3s ${EASE}`,
              }}>
                {t("daily_get_portrait")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: "center", padding: "5rem 2rem",
            background: "rgba(8,6,20,0.3)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(200,185,255,0.04)",
            borderRadius: "1.5rem",
          }}>
            <div style={{
              fontSize: "3.5rem", color: "rgba(212,175,55,0.15)", marginBottom: "1.5rem",
              filter: "drop-shadow(0 0 40px rgba(212,175,55,0.08))",
              animation: "zodiac-float 6s ease-in-out infinite",
            }}>✦</div>
            <p style={{
              fontFamily: "var(--font-accent)", fontSize: "1.3rem", fontWeight: 400,
              color: "rgba(200,190,230,0.35)", fontStyle: "italic",
              lineHeight: 1.6,
            }}>{t("daily_select_sign")}<br/>
              <span style={{ fontSize: "0.85rem", color: "rgba(180,170,210,0.2)" }}>to reveal today&apos;s cosmic guidance</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
