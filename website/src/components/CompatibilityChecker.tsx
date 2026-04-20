/**
 * CompatibilityChecker.tsx — Enter two birthdays, see animated match scores
 *
 * Two MM/DD inputs side by side. On both filled:
 *   - Animated score bars for Love, Communication, Trust, Passion
 *   - Overall compatibility percentage with ring animation
 *   - Sign-specific verdict
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { getSunSign } from "../lib/zodiac-utils";
import { useLocale } from "../lib/i18n/useLocale";
import CosmicField from "./CosmicField";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Deterministic compatibility scores from two sign indices
function getCompatScores(a: number, b: number) {
  const seed = (a + 1) * 13 + (b + 1) * 7;
  const h = (n: number) => Math.abs(((seed * 2654435761 + n * 31) | 0) % 100);
  // Element harmony boosts
  const elements = ["Fire","Earth","Air","Water","Fire","Earth","Air","Water","Fire","Earth","Air","Water"];
  const sameElement = elements[a] === elements[b];
  const boost = sameElement ? 15 : 0;
  return {
    love: Math.min(55 + h(1) % 40 + boost, 99),
    communication: Math.min(50 + h(2) % 42 + boost, 99),
    trust: Math.min(52 + h(3) % 38 + boost, 99),
    passion: Math.min(48 + h(4) % 44 + boost, 99),
  };
}

// getVerdict moved inside component to access t()

const GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function BirthdayInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const handleChange = (raw: string) => {
    let v = raw.replace(/[^\d\/\-\.]/g, "");
    if (v.length === 2 && !v.includes("/") && !v.includes("-") && value.length < v.length) v += "/";
    if (v.length > 5) v = v.slice(0, 5);
    onChange(v);
  };

  return (
    <div style={{ flex: 1, maxWidth: "140px" }}>
      <CosmicField
        size="sm"
        label={label}
        placeholder="MM / DD"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        style={{ textAlign: "center" }}
      />
    </div>
  );
}

function ScoreBar({ label, score, delay, color }: { label: string; score: number; delay: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 400,
        color: "rgba(200,190,235,0.7)", width: "90px", textAlign: "right",
      }}>{label}</span>
      <div style={{
        flex: 1, height: "4px", borderRadius: "2px",
        background: "rgba(255,255,255,0.04)", overflow: "hidden",
      }}>
        <div style={{
          width: `${width}%`, height: "100%", borderRadius: "2px",
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          transition: `width 1.8s ${EASE}`,
          boxShadow: `0 0 8px ${color}33`,
        }} />
      </div>
      <span style={{
        fontFamily: "var(--font-accent)", fontSize: "0.85rem", fontWeight: 500,
        color: "rgba(200,180,255,0.85)", width: "32px",
      }}>{score}%</span>
    </div>
  );
}

export default function CompatibilityChecker() {
  const { t } = useLocale();
  const [bdayA, setBdayA] = useState("");
  const [bdayB, setBdayB] = useState("");

  const getVerdict = (overall: number): string => {
    if (overall >= 85) return t("compat_v1");
    if (overall >= 70) return t("compat_v2");
    if (overall >= 55) return t("compat_v3");
    return t("compat_v4");
  };
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const parseSign = (v: string) => {
    const match = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/) || v.match(/^(\d{2})(\d{2})$/);
    if (!match) return null;
    return getSunSign(parseInt(match[1]), parseInt(match[2]));
  };

  const signA = parseSign(bdayA);
  const signB = parseSign(bdayB);
  const hasResult = signA && signB;

  const scores = hasResult ? getCompatScores(signA.index, signB.index) : null;
  const overall = scores ? Math.round((scores.love + scores.communication + scores.trust + scores.passion) / 4) : 0;

  // Animate result in
  useEffect(() => {
    if (!hasResult || !resultRef.current) return;
    resultRef.current.animate(
      [
        { opacity: "0", transform: "translateY(16px)" },
        { opacity: "1", transform: "translateY(0)" },
      ],
      { duration: 600, easing: EASE, fill: "forwards" }
    );
  }, [hasResult, signA?.name, signB?.name]);

  // IntersectionObserver for section reveal
  useEffect(() => {
    if (!sectionRef.current) return;
    const el = sectionRef.current;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="compatibility"
      style={{
        padding: "5rem 1.5rem",
        maxWidth: "600px",
        margin: "0 auto",
        opacity: 0,
        transform: "translateY(30px)",
        transition: `opacity 0.8s ${EASE}, transform 0.8s ${EASE}`,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div className="star-divider" style={{ marginBottom: "1.5rem" }}>&#10022;</div>
        <h2 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 600, marginBottom: "0.75rem",
        }}>
          <span className="text-gold-gradient">{t("compat_title")}</span>
        </h2>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 300,
          color: "rgba(196,185,228,0.7)", maxWidth: "400px", margin: "0 auto",
        }}>
          {t("compat_subtitle")}
        </p>
      </div>

      {/* Inputs */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem",
        justifyContent: "center", marginBottom: "2rem",
      }}>
        <BirthdayInput value={bdayA} onChange={setBdayA} label={t("compat_person1")} />
        <span style={{
          fontSize: "1.2rem", color: "rgba(212,175,55,0.4)", marginTop: "1rem",
        }}>&#10022;</span>
        <BirthdayInput value={bdayB} onChange={setBdayB} label={t("compat_person2")} />
      </div>

      {/* Results */}
      {hasResult && scores && (
        <div ref={resultRef} style={{ opacity: 0 }}>
          {/* Sign badges */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "1.5rem", marginBottom: "2rem",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{signA.glyph}</div>
              <div style={{
                fontFamily: "var(--font-accent)", fontSize: "0.9rem",
                color: "rgba(230,220,255,0.85)", letterSpacing: "0.06em",
              }}>{signA.name}</div>
            </div>
            <div style={{
              fontFamily: "var(--font-accent)", fontSize: "1.8rem", fontWeight: 300,
              color: "rgba(212,175,55,0.5)",
            }}>&times;</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{signB.glyph}</div>
              <div style={{
                fontFamily: "var(--font-accent)", fontSize: "0.9rem",
                color: "rgba(230,220,255,0.85)", letterSpacing: "0.06em",
              }}>{signB.name}</div>
            </div>
          </div>

          {/* Overall score */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              fontFamily: "var(--font-accent)", fontSize: "3.5rem", fontWeight: 300,
              color: "rgba(240,236,255,0.92)",
              textShadow: "0 0 30px rgba(200,180,255,0.2)",
              lineHeight: 1,
            }}>{overall}%</div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.45)", marginTop: "0.3rem",
            }}>{t("compat_overall")}</div>
          </div>

          {/* Score bars */}
          <div style={{
            display: "flex", flexDirection: "column", gap: "0.75rem",
            marginBottom: "2rem",
            padding: "1.25rem 1.5rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(200,185,255,0.08)",
            borderRadius: "1rem",
          }}>
            <ScoreBar label={t("compat_love")} score={scores.love} delay={200} color="#E8524A" />
            <ScoreBar label={t("compat_comm")} score={scores.communication} delay={400} color="#7B68EE" />
            <ScoreBar label={t("compat_trust")} score={scores.trust} delay={600} color="#4ECDC4" />
            <ScoreBar label={t("compat_passion")} score={scores.passion} delay={800} color="#D4AF37" />
          </div>

          {/* Verdict */}
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
            lineHeight: 1.7, color: "rgba(196,185,228,0.72)",
            textAlign: "center", fontStyle: "italic",
          }}>
            &ldquo;{getVerdict(overall)}&rdquo;
          </p>
        </div>
      )}
    </section>
  );
}
