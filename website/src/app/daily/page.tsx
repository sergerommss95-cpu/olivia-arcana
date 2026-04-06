/**
 * Daily Reading — Power / Pressure / Trouble format
 *
 * Select your sign → see today's personalized reading in 3 categories.
 * Includes current transits context.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSunPosition, getMoonPosition, getMoonPhase } from "../../lib/celestial";
import { getTodayHoroscope } from "../../lib/zodiac-utils";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SIGNS = [
  { name: "Aries", glyph: "♈" }, { name: "Taurus", glyph: "♉" },
  { name: "Gemini", glyph: "♊" }, { name: "Cancer", glyph: "♋" },
  { name: "Leo", glyph: "♌" }, { name: "Virgo", glyph: "♍" },
  { name: "Libra", glyph: "♎" }, { name: "Scorpio", glyph: "♏" },
  { name: "Sagittarius", glyph: "♐" }, { name: "Capricorn", glyph: "♑" },
  { name: "Aquarius", glyph: "♒" }, { name: "Pisces", glyph: "♓" },
];

const POWER: Record<string, string> = {
  Aries: "Your initiative is magnetic today. Lead with confidence — others will follow your energy naturally.",
  Taurus: "Financial instincts are razor-sharp. Trust the slow strategy that's been quietly building value.",
  Gemini: "Words carry unusual weight today. A conversation could change the trajectory of a key relationship.",
  Cancer: "Your emotional radar is calibrated perfectly. Use it to nurture the connections that truly matter.",
  Leo: "Creative fire burns at full intensity. Express yourself boldly — your audience is ready and receptive.",
  Virgo: "Your analytical gifts solve what others can't see. The answer is hiding in the details today.",
  Libra: "Harmony flows naturally from your presence. Every room you enter becomes more balanced.",
  Scorpio: "Intuitive power is at its peak. You see what's hidden — wield this insight to heal, not control.",
  Sagittarius: "Expansion calls from an unexpected direction. An opportunity arrives disguised as coincidence.",
  Capricorn: "Discipline meets opportunity at the perfect crossroads. Today's focused effort creates lasting impact.",
  Aquarius: "Your unconventional approach is about to be vindicated. The future you imagined is becoming present.",
  Pisces: "Creative and spiritual channels are wide open. Flow with what comes — resistance is futile and unnecessary.",
};

const PRESSURE: Record<string, string> = {
  Aries: "Impatience could sabotage what patience would win. The warrior's greatest battle is with their own timing.",
  Taurus: "Stubbornness masks a deeper fear of change. Flex one degree today and feel the relief wash through.",
  Gemini: "Mental overload threatens your ability to focus. Choose one lane and commit for the next 24 hours.",
  Cancer: "Over-giving is depleting your emotional reserves. Today, fill your own cup before pouring for others.",
  Leo: "Ego sensitivity spikes under this transit. Not everything is a reflection of you — and that's liberating.",
  Virgo: "Perfectionism is becoming paralysis. Good enough today beats perfect never — release the impossible standard.",
  Libra: "People-pleasing is pulling you away from your own center. Your needs are not up for negotiation.",
  Scorpio: "Control instincts are intensifying. Practice releasing your grip — what's truly yours won't leave.",
  Sagittarius: "Restlessness is masking something you're avoiding. What are you running from? Face it today.",
  Capricorn: "The work-life balance is tipping dangerously. Step away before the cost becomes compounding.",
  Aquarius: "Emotional detachment feels safe but it's costing you real connection. Let someone in today.",
  Pisces: "Boundaries are blurring under Neptune's current influence. Define clearly where you end and others begin.",
};

const TROUBLE: Record<string, string> = {
  Aries: "A conflict invites you to prove yourself through force. The real victory today is in walking away with grace.",
  Taurus: "An unexpected expense or shift tests your sense of security. Remember: you have more than enough.",
  Gemini: "Miscommunication risk is elevated. Re-read every important message before sending. Then read it again.",
  Cancer: "Old emotional patterns are resurfacing with urgency. You've healed more than you realize — trust that.",
  Leo: "Someone challenges your authority or vision. Respond with grace, not fire — dignity is your shield.",
  Virgo: "A system fails or a carefully laid plan falls apart. Improvisation is also a skill — one you have.",
  Libra: "A relationship reveals an uncomfortable imbalance. Address it with love today, not avoidance.",
  Scorpio: "A secret surfaces at the worst possible time. Truth, though uncomfortable in the moment, always liberates.",
  Sagittarius: "Overcommitment catches up with you today. Cancel something guilt-free — your future self will thank you.",
  Capricorn: "Authority figures disappoint or contradict themselves. Your own standards are the only ones that matter.",
  Aquarius: "A group dynamic turns unexpectedly toxic. Your independence is your greatest asset — use it.",
  Pisces: "Escapism tempts you away from an uncomfortable reality. Face the discomfort — it passes faster than you think.",
};

function ReadingCard({ type, title, text, color, delay }: {
  type: string; title: string; text: string; color: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.animate(
      [
        { opacity: "0", transform: "translateY(16px)" },
        { opacity: "1", transform: "translateY(0)" },
      ],
      { duration: 600, delay, easing: EASE, fill: "forwards" }
    );
  }, [text, delay]);

  return (
    <div ref={ref} style={{
      opacity: 0,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${color}18`,
      borderRadius: "1.25rem",
      padding: "1.5rem",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem",
      }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: color, boxShadow: `0 0 8px ${color}44`,
        }} />
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase", color: `${color}99`,
        }}>{title}</span>
      </div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
        lineHeight: 1.8, color: "rgba(196,185,228,0.78)", margin: 0,
      }}>{text}</p>
    </div>
  );
}

export default function DailyPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const now = new Date();
  const sun = mounted ? getSunPosition(now) : null;
  const moon = mounted ? getMoonPosition(now) : null;
  const moonPhase = mounted ? getMoonPhase(now) : null;

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "700px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <a href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</a>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">Daily Cosmic Reading</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", marginTop: "0.3rem",
        }}>
          {now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>

        {/* Current transit context */}
        {sun && moon && moonPhase && (
          <div style={{
            display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.75rem",
            flexWrap: "wrap",
          }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(200,190,235,0.4)" }}>
              ☉ Sun in {sun.sign} {sun.degree}°
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(200,190,235,0.4)" }}>
              {moonPhase.emoji} {moonPhase.phase}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(200,190,235,0.4)" }}>
              ☽ Moon in {moon.sign}
            </span>
          </div>
        )}
      </div>

      {/* Sign selector */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.5rem", marginBottom: "2rem",
      }}>
        {SIGNS.map(s => (
          <button
            key={s.name}
            onClick={() => setSelected(s.name)}
            style={{
              padding: "0.6rem 0.4rem", borderRadius: "0.75rem",
              background: selected === s.name ? "rgba(160,120,255,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${selected === s.name ? "rgba(200,180,255,0.2)" : "rgba(200,185,255,0.06)"}`,
              cursor: "pointer", transition: `all 0.2s ${EASE}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{s.glyph}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 400,
              color: selected === s.name ? "rgba(240,236,255,0.85)" : "rgba(180,170,210,0.45)",
              letterSpacing: "0.04em",
            }}>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Reading */}
      {selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Sign header */}
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "2.5rem" }}>{SIGNS.find(s => s.name === selected)?.glyph}</span>
            <h2 style={{
              fontFamily: "var(--font-accent)", fontSize: "1.5rem", fontWeight: 400,
              letterSpacing: "0.1em", color: "rgba(240,236,255,0.9)",
              textTransform: "uppercase", margin: "0.3rem 0",
            }}>{selected}</h2>
          </div>

          <ReadingCard type="power" title="Power" text={POWER[selected]} color="#4ECDC4" delay={0} />
          <ReadingCard type="pressure" title="Pressure" text={PRESSURE[selected]} color="#D4AF37" delay={150} />
          <ReadingCard type="trouble" title="Trouble" text={TROUBLE[selected]} color="#E8524A" delay={300} />

          {/* General horoscope */}
          <div style={{
            marginTop: "0.5rem", padding: "1.25rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(200,185,255,0.06)",
            borderRadius: "1rem",
          }}>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.4)", marginBottom: "0.5rem",
            }}>Today&apos;s Message</div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
              lineHeight: 1.75, color: "rgba(196,185,228,0.7)", margin: 0, fontStyle: "italic",
            }}>
              &ldquo;{getTodayHoroscope(selected)}&rdquo;
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <a href="/portrait" style={{
              display: "inline-block", padding: "0.7rem 2rem",
              borderRadius: "100px",
              background: "linear-gradient(135deg, rgba(160,120,255,0.18), rgba(100,80,220,0.14))",
              border: "1px solid rgba(200,180,255,0.18)",
              color: "rgba(240,235,255,0.9)", fontSize: "0.76rem", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase",
              textDecoration: "none", transition: `all 0.3s ${EASE}`,
            }}>Get Your Full Celestial Portrait</a>
          </div>
        </div>
      )}

      {!selected && (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ fontSize: "2rem", color: "rgba(212,175,55,0.2)", marginBottom: "1rem" }}>✦</div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
            color: "rgba(180,170,210,0.35)",
          }}>Select your sign to reveal today&apos;s reading</p>
        </div>
      )}
    </div>
  );
}
