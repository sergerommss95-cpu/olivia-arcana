/**
 * Daily Reading — Co-Star inspired but 10x better
 *
 * Life area categories: Self, Thinking, Sex & Love, Routine, Spirituality, Social
 * Power / Pressure / Trouble per category
 * Do / Don't list
 * Current transit context
 * Planet-in-sign explanations
 */

"use client";

import React, { useState, useEffect } from "react";
import { getSunPosition, getMoonPosition, getMoonPhase, getAllPositions } from "../../lib/celestial";
import { getTodayHoroscope } from "../../lib/zodiac-utils";
import { LIFE_AREAS } from "../../lib/planet-interpretations";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SIGNS = [
  { name: "Aries", glyph: "♈" }, { name: "Taurus", glyph: "♉" },
  { name: "Gemini", glyph: "♊" }, { name: "Cancer", glyph: "♋" },
  { name: "Leo", glyph: "♌" }, { name: "Virgo", glyph: "♍" },
  { name: "Libra", glyph: "♎" }, { name: "Scorpio", glyph: "♏" },
  { name: "Sagittarius", glyph: "♐" }, { name: "Capricorn", glyph: "♑" },
  { name: "Aquarius", glyph: "♒" }, { name: "Pisces", glyph: "♓" },
];

// ── Life area readings per sign (deterministic from sign + day) ──
function getLifeAreaReading(sign: string, area: string, dayOfYear: number): { power: string; pressure: string } {
  // Seeded hash for deterministic daily variation
  let h = 0;
  for (let i = 0; i < sign.length; i++) h = (h * 31 + sign.charCodeAt(i)) | 0;
  h = Math.abs((h ^ (dayOfYear * 2654435761) ^ (area.charCodeAt(0) * 16777619)) | 0);

  const powers: Record<string, string[]> = {
    self: [
      "Your sense of identity is crystallizing. You know who you are today.",
      "Self-confidence arrives without effort. Trust it.",
      "An old version of yourself is falling away. Let it.",
    ],
    thinking: [
      "Mental clarity is unusually high. Make the important decisions now.",
      "A creative breakthrough is forming. Don't force it — let it arrive.",
      "Your communication lands perfectly today. Say the hard thing.",
    ],
    love: [
      "Magnetic attraction is elevated. You draw the right attention.",
      "Emotional vulnerability opens a door that was locked.",
      "A relationship truth becomes clear. Act on it with grace.",
    ],
    routine: [
      "Productivity flows naturally. The system works if you trust it.",
      "A health insight arrives. Your body is speaking — listen.",
      "Work feels purposeful today. Effort converts directly to results.",
    ],
    spirituality: [
      "Intuition is unusually sharp. Follow the quiet voice, not the loud one.",
      "A dream from last night carries a real message. Revisit it.",
      "The boundary between imagination and insight dissolves. Both are true.",
    ],
    social: [
      "A friendship deepens unexpectedly. Let it happen.",
      "Your presence shifts group dynamics positively. Show up.",
      "An invitation arrives that's worth accepting. Say yes.",
    ],
  };

  const pressures: Record<string, string[]> = {
    self: [
      "Self-doubt creeps in without evidence. Name it and it loses power.",
      "You're comparing yourself to someone else's highlight reel. Stop.",
      "An identity question resurfaces. Sit with the discomfort.",
    ],
    thinking: [
      "Overthinking threatens to paralyze action. Set a timer and decide.",
      "A miscommunication needs repair. Clarify before assuming.",
      "Mental fatigue is real. Rest your mind or it'll rest itself.",
    ],
    love: [
      "Expectations clash with reality in a relationship. Adjust or communicate.",
      "An old romantic pattern repeats. Recognize it this time.",
      "Jealousy or comparison poisons the well. Choose trust.",
    ],
    routine: [
      "Your schedule feels like a trap. Build in one spontaneous break.",
      "A health habit you've been ignoring demands attention. Today.",
      "Burnout signals are flashing. Ignoring them costs more than pausing.",
    ],
    spirituality: [
      "Spiritual bypassing tempts you. Feel the feeling before transcending it.",
      "Escapism looks attractive. Face reality first — then dream.",
      "Your inner critic disguises itself as wisdom. It's not.",
    ],
    social: [
      "A social obligation drains you. It's okay to decline.",
      "Group dynamics feel off. Trust your read on the room.",
      "Someone's energy affects yours. Protect your space.",
    ],
  };

  const pArr = powers[area] || powers.self;
  const prArr = pressures[area] || pressures.self;

  return {
    power: pArr[h % pArr.length],
    pressure: prArr[(h >> 8) % prArr.length],
  };
}

// ── Do / Don't lists ──
function getDoDont(sign: string, dayOfYear: number): { dos: string[]; donts: string[] } {
  let h = 0;
  for (let i = 0; i < sign.length; i++) h = (h * 31 + sign.charCodeAt(i)) | 0;
  h = Math.abs((h ^ (dayOfYear * 123457)) | 0);

  const allDos = [
    "Speak first in a difficult conversation",
    "Take the scenic route",
    "Write down what you're feeling before reacting",
    "Let someone help you",
    "Start the project you've been avoiding",
    "Say no to one thing today",
    "Move your body before noon",
    "Reach out to someone you've been thinking about",
    "Trust your first instinct",
    "Eat something that makes you feel alive",
    "Create before you consume",
    "Leave space in your schedule for nothing",
  ];

  const allDonts = [
    "Respond to messages that trigger you immediately",
    "Compare your chapter 1 to someone's chapter 20",
    "Skip the meal that grounds you",
    "Say yes out of obligation",
    "Scroll past the 30-minute mark",
    "Ignore the tension you feel in a relationship",
    "Work through lunch",
    "Abandon your routine for someone else's agenda",
    "Mistake urgency for importance",
    "Suppress what needs expression",
    "Perform confidence you don't feel",
    "Let fear make your decisions",
  ];

  const dos = [allDos[h % allDos.length], allDos[(h + 3) % allDos.length], allDos[(h + 7) % allDos.length]];
  const donts = [allDonts[(h + 1) % allDonts.length], allDonts[(h + 5) % allDonts.length], allDonts[(h + 9) % allDonts.length]];

  return { dos, donts };
}

export default function DailyPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const sun = mounted ? getSunPosition(now) : null;
  const moon = mounted ? getMoonPosition(now) : null;
  const moonPhase = mounted ? getMoonPhase(now) : null;

  const doDont = selected ? getDoDont(selected, dayOfYear) : null;

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <a href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</a>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 400, margin: "0 0 0.3rem",
          }}>
            <span className="text-gold-gradient">Your Day</span>
          </h1>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
            color: "rgba(196,185,228,0.5)",
          }}>
            {now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>

          {/* Transit bar */}
          {sun && moon && moonPhase && (
            <div style={{
              display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.6rem",
              flexWrap: "wrap",
            }}>
              {[
                { icon: "☉", text: `${sun.sign} ${sun.degree}°` },
                { icon: moonPhase.emoji, text: moonPhase.phase },
                { icon: "☽", text: `${moon.sign}` },
              ].map(({ icon, text }) => (
                <span key={text} style={{
                  fontFamily: "var(--font-body)", fontSize: "0.68rem",
                  color: "rgba(200,190,235,0.4)", display: "flex", alignItems: "center", gap: "0.3rem",
                }}>
                  <span style={{ fontSize: "0.75rem" }}>{icon}</span> {text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sign selector — compact grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
        gap: "0.35rem", marginBottom: "2.5rem",
      }}>
        {SIGNS.map(s => (
          <button
            key={s.name}
            onClick={() => setSelected(s.name)}
            style={{
              padding: "0.5rem 0.2rem", borderRadius: "0.6rem",
              background: selected === s.name ? "rgba(240,236,255,0.08)" : "transparent",
              border: `1px solid ${selected === s.name ? "rgba(200,185,255,0.15)" : "rgba(200,185,255,0.04)"}`,
              cursor: "pointer", transition: `all 0.2s ${EASE}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem",
            }}
          >
            <span style={{ fontSize: "1.1rem", opacity: selected === s.name ? 1 : 0.5 }}>{s.glyph}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.5rem", fontWeight: 400,
              color: selected === s.name ? "rgba(240,236,255,0.8)" : "rgba(180,170,210,0.3)",
              letterSpacing: "0.03em",
            }}>{s.name.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {/* Reading content */}
      {selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Sign header — minimal */}
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.3rem" }}>
              {SIGNS.find(s => s.name === selected)?.glyph}
            </span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.4)",
            }}>{selected}</span>
          </div>

          {/* Do / Don't */}
          {doDont && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{
                padding: "1.25rem",
                background: "rgba(78,205,196,0.04)",
                border: "1px solid rgba(78,205,196,0.08)",
                borderRadius: "1rem",
              }}>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(78,205,196,0.6)", marginBottom: "0.6rem",
                }}>Do</div>
                {doDont.dos.map((d, i) => (
                  <p key={i} style={{
                    fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
                    lineHeight: 1.6, color: "rgba(200,190,235,0.72)",
                    margin: "0 0 0.4rem",
                  }}>{d}</p>
                ))}
              </div>
              <div style={{
                padding: "1.25rem",
                background: "rgba(232,82,74,0.03)",
                border: "1px solid rgba(232,82,74,0.06)",
                borderRadius: "1rem",
              }}>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "rgba(232,82,74,0.5)", marginBottom: "0.6rem",
                }}>Don&apos;t</div>
                {doDont.donts.map((d, i) => (
                  <p key={i} style={{
                    fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 300,
                    lineHeight: 1.6, color: "rgba(200,190,235,0.72)",
                    margin: "0 0 0.4rem",
                  }}>{d}</p>
                ))}
              </div>
            </div>
          )}

          {/* Life area cards */}
          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(180,170,210,0.35)", marginTop: "0.5rem",
          }}>By Life Area</div>

          {LIFE_AREAS.map(area => {
            const reading = getLifeAreaReading(selected, area.key, dayOfYear);
            return (
              <div key={area.key} style={{
                padding: "1.25rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(200,185,255,0.05)",
                borderRadius: "1rem",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem",
                }}>
                  <span style={{ fontSize: "0.9rem", color: "rgba(212,175,55,0.5)" }}>{area.icon}</span>
                  <div>
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 500,
                      color: "rgba(240,236,255,0.85)",
                    }}>{area.label}</span>
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 300,
                      color: "rgba(180,170,210,0.35)", marginLeft: "0.5rem",
                    }}>{area.desc}</span>
                  </div>
                </div>

                {/* Power */}
                <div style={{ marginBottom: "0.6rem" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem",
                  }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(78,205,196,0.5)" }} />
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                      letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(78,205,196,0.5)",
                    }}>Power</span>
                  </div>
                  <p style={{
                    fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                    lineHeight: 1.7, color: "rgba(196,185,228,0.75)", margin: 0,
                  }}>{reading.power}</p>
                </div>

                {/* Pressure */}
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem",
                  }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(212,175,55,0.4)" }} />
                    <span style={{
                      fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                      letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)",
                    }}>Pressure</span>
                  </div>
                  <p style={{
                    fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                    lineHeight: 1.7, color: "rgba(196,185,228,0.65)", margin: 0,
                  }}>{reading.pressure}</p>
                </div>
              </div>
            );
          })}

          {/* Today's message */}
          <div style={{
            padding: "1.25rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(200,185,255,0.05)",
            borderRadius: "1rem",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.35)", marginBottom: "0.5rem",
            }}>Today&apos;s Message</div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
              lineHeight: 1.8, color: "rgba(196,185,228,0.7)", margin: 0, fontStyle: "italic",
            }}>
              &ldquo;{getTodayHoroscope(selected)}&rdquo;
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <a href="/portrait" style={{
              display: "inline-block", padding: "0.7rem 2rem",
              borderRadius: "100px",
              background: "linear-gradient(135deg, rgba(160,120,255,0.18), rgba(100,80,220,0.14))",
              border: "1px solid rgba(200,180,255,0.18)",
              color: "rgba(240,235,255,0.9)", fontSize: "0.76rem", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase",
              textDecoration: "none",
            }}>Get Your Full Portrait</a>
          </div>
        </div>
      )}

      {!selected && (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ fontSize: "2rem", color: "rgba(212,175,55,0.15)", marginBottom: "1rem" }}>✦</div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
            color: "rgba(180,170,210,0.3)",
          }}>Select your sign above</p>
        </div>
      )}
    </div>
  );
}
