/**
 * LessonList — Interactive expandable lesson list with rich content
 *
 * Each lesson expands to show real educational content generated
 * by the content engine. Renders different section types:
 * text, callout, sign profiles, planet profiles, house profiles,
 * tarot cards, quizzes, exercises, comparison tables, keyword maps.
 */

"use client";

import React, { useState, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateFullLessonContent } from "../lib/academy/content";
import type { ContentSection, QuizQuestion, ExerciseStep, LessonContent } from "../lib/academy/content/types";
import { SIGN_PAGES } from "../lib/sign-data";
import { PLANET_MEANING, HOUSE_MEANING } from "../lib/planet-interpretations";
import { ALL_CARDS } from "../lib/academy/tarot-cards";
import { useLocale } from "@/lib/i18n/useLocale";

// Lazy-load interactive academy widgets (heavy SVG components)
const ZodiacWheel = lazy(() => import("./academy/ZodiacWheel"));
const ElementMatrix = lazy(() => import("./academy/ElementMatrix"));
const TarotRevealCard = lazy(() => import("./academy/TarotRevealCard"));
const SecretReveal = lazy(() => import("./academy/SecretReveal"));
const HouseWheel = lazy(() => import("./academy/HouseWheel"));
const AspectVisualizer = lazy(() => import("./academy/AspectVisualizer"));
const PlanetaryJourney = lazy(() => import("./academy/PlanetaryJourney"));
const FoolsJourneyMap = lazy(() => import("./academy/FoolsJourneyMap"));

interface Lesson {
  slug: string;
  title: string;
  description: string;
  duration: number;
  type: string;
}

const TYPE_ICON_DEFS: Record<string, { icon: string; labelKey: "academy_lesson_type" | "academy_interactive_type" | "academy_quiz_type" | "academy_practice_type"; color: string }> = {
  reading: { icon: "\u25C7", labelKey: "academy_lesson_type", color: "rgba(200,190,235,0.4)" },
  interactive: { icon: "\u25C8", labelKey: "academy_interactive_type", color: "rgba(78,205,196,0.5)" },
  quiz: { icon: "\u25C9", labelKey: "academy_quiz_type", color: "rgba(212,175,55,0.5)" },
  practice: { icon: "\u25CE", labelKey: "academy_practice_type", color: "rgba(123,104,238,0.5)" },
};

// ── Section Renderers ──────────────────────────────────────────

function TextSection({ title, body }: { title?: string; body: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      {title && (
        <h4 style={{
          fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 500,
          color: "var(--c-text)", marginBottom: "0.5rem", letterSpacing: "0.02em",
        }}>{title}</h4>
      )}
      {body.split("\n\n").map((para, i) => (
        <p key={i} className="reading-text" style={{
          fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
          lineHeight: 1.8, color: "rgba(196,185,228,0.75)",
          margin: i > 0 ? "0.75rem 0 0" : 0,
        }}>{para}</p>
      ))}
    </div>
  );
}

function CalloutBox({ style, body, labels }: { style: "insight" | "warning" | "tip"; body: string; labels: { insight: string; note: string; tip: string } }) {
  const colors = {
    insight: { bg: "rgba(200,168,75,0.06)", border: "rgba(200,168,75,0.15)", icon: "\u2726", label: labels.insight },
    warning: { bg: "rgba(232,82,74,0.06)", border: "rgba(232,82,74,0.15)", icon: "\u26A0", label: labels.note },
    tip: { bg: "rgba(78,205,196,0.06)", border: "rgba(78,205,196,0.15)", icon: "\uD83D\uDCA1", label: labels.tip },
  };
  const c = colors[style];
  return (
    <div style={{
      padding: "1rem 1.25rem", borderRadius: "0.75rem", marginBottom: "1rem",
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <div style={{
        fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: c.border.replace("0.15", "0.6"), marginBottom: "0.35rem",
      }}>{c.icon} {c.label}</div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
        lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: 0,
      }}>{body}</p>
    </div>
  );
}

function SignProfileCard({ sign }: { sign: string }) {
  const data = SIGN_PAGES[sign.toLowerCase()];
  if (!data) return <div style={{ color: "rgba(180,170,210,0.4)" }}>Sign not found: {sign}</div>;
  return (
    <div style={{
      padding: "1.25rem", borderRadius: "1rem", marginBottom: "0.75rem",
      background: "rgba(232,230,240,0.02)", border: "1px solid rgba(200,185,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "1.8rem" }}>{data.glyph}</span>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 500, color: "var(--c-text)" }}>{data.name}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(180,170,210,0.4)", letterSpacing: "0.1em" }}>
            {data.dateRange} · {data.element} · {data.modality} · {data.ruler}
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: "0 0 0.5rem" }}>{data.description}</p>
      {data.lightTraits && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
          {data.lightTraits.slice(0, 3).map((t: string) => (
            <span key={t} style={{
              padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.68rem",
              background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.12)",
              color: "rgba(200,168,75,0.6)",
            }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanetProfileCard({ planet }: { planet: string }) {
  const meaning = PLANET_MEANING[planet];
  if (!meaning) return null;
  const glyphs: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
    Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  };
  return (
    <div style={{
      padding: "1.25rem", borderRadius: "1rem", marginBottom: "0.75rem",
      background: "rgba(232,230,240,0.02)", border: "1px solid rgba(200,185,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem", color: "rgba(200,168,75,0.5)" }}>{glyphs[planet] || "✦"}</span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 500, color: "var(--c-text)" }}>{planet}</span>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: 0 }}>{meaning}</p>
    </div>
  );
}

function HouseProfileCard({ house }: { house: number }) {
  const data = HOUSE_MEANING[house];
  if (!data) return null;
  return (
    <div style={{
      padding: "1.25rem", borderRadius: "1rem", marginBottom: "0.75rem",
      background: "rgba(232,230,240,0.02)", border: "1px solid rgba(200,185,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 600,
          color: "rgba(200,168,75,0.5)", width: "32px", textAlign: "center",
        }}>{house}</span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 500, color: "var(--c-text)" }}>
          The {data.area} House
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: 0 }}>{data.rules}</p>
    </div>
  );
}

function TarotCardDisplay({ cardName, showReversed, uprightLabel, reversedLabel }: { cardName: string; showReversed?: boolean; uprightLabel: string; reversedLabel: string }) {
  const card = ALL_CARDS.find(c => c.name === cardName);
  if (!card) return <div style={{ color: "rgba(180,170,210,0.4)" }}>Card not found: {cardName}</div>;
  return (
    <div style={{
      padding: "1.25rem", borderRadius: "1rem", marginBottom: "0.75rem",
      background: "rgba(232,230,240,0.02)", border: "1px solid rgba(200,185,255,0.06)",
    }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 500, color: "var(--c-text)" }}>
          {card.arcana === "major" ? `${card.number} — ` : ""}{card.name}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(180,170,210,0.35)", marginLeft: "0.5rem" }}>
          {card.astrology} · {card.element}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.6rem" }}>
        {card.keywords.map(kw => (
          <span key={kw} style={{
            padding: "0.15rem 0.5rem", borderRadius: "100px", fontSize: "0.65rem",
            background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.1)",
            color: "rgba(200,168,75,0.55)",
          }}>{kw}</span>
        ))}
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(78,205,196,0.5)", marginBottom: "0.25rem" }}>{uprightLabel}</div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: 0 }}>{card.upright}</p>
      </div>
      {showReversed && (
        <div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(232,82,74,0.5)", marginBottom: "0.25rem" }}>{reversedLabel}</div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(196,185,228,0.6)", margin: 0 }}>{card.reversed}</p>
        </div>
      )}
    </div>
  );
}

function CardGrid({ cards }: { cards: string[] }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
      gap: "0.5rem", marginBottom: "1rem",
    }}>
      {cards.map(name => {
        const card = ALL_CARDS.find(c => c.name === name);
        if (!card) return null;
        return (
          <div key={name} style={{
            padding: "0.75rem", borderRadius: "0.75rem",
            background: "rgba(232,230,240,0.015)", border: "1px solid rgba(200,185,255,0.04)",
          }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 400, color: "rgba(240,236,255,0.8)" }}>{card.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "rgba(180,170,210,0.35)", marginTop: "0.15rem" }}>
              {card.keywords.slice(0, 3).join(" · ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: "1rem", WebkitOverflowScrolling: "touch" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(0.65rem, 2vw, 0.78rem)", minWidth: "320px" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "0.5rem 0.75rem", textAlign: "left", borderBottom: "1px solid rgba(200,185,255,0.08)",
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.7rem",
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: "rgba(200,168,75,0.5)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(200,185,255,0.03)",
                  fontFamily: "var(--font-body)", fontWeight: ci === 0 ? 400 : 300,
                  color: ci === 0 ? "rgba(240,236,255,0.8)" : "rgba(196,185,228,0.6)",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeywordMap({ items }: { items: { term: string; definition: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
      {items.map(({ term, definition }) => (
        <div key={term} style={{
          display: "flex", gap: "0.75rem", padding: "0.6rem 0.75rem",
          borderRadius: "0.5rem", background: "rgba(232,230,240,0.015)",
          border: "1px solid rgba(200,185,255,0.03)",
        }}>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 500,
            color: "rgba(200,168,75,0.6)", minWidth: "80px", flexShrink: 0,
          }}>{term}</span>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
            color: "rgba(196,185,228,0.6)", lineHeight: 1.5,
          }}>{definition}</span>
        </div>
      ))}
    </div>
  );
}

function QuizWidget({ questions, checkLabel, perfectMsg, greatMsg, keepStudyingMsg }: { questions: QuizQuestion[]; checkLabel: string; perfectMsg: string; greatMsg: string; keepStudyingMsg: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = useCallback((qi: number, oi: number) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [qi]: oi }));
  }, [showResults]);

  const score = Object.entries(answers).filter(
    ([qi, oi]) => questions[parseInt(qi)]?.correctIndex === oi
  ).length;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {questions.map((q, qi) => {
        const answered = answers[qi] !== undefined;
        const correct = answered && answers[qi] === q.correctIndex;
        return (
          <div key={qi} style={{
            padding: "1rem", borderRadius: "0.75rem", marginBottom: "0.6rem",
            background: "rgba(232,230,240,0.015)", border: "1px solid rgba(200,185,255,0.04)",
          }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 400,
              color: "var(--c-text)", marginBottom: "0.6rem",
            }}>{qi + 1}. {q.question}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const isCorrect = oi === q.correctIndex;
                let bg = "rgba(232,230,240,0.02)";
                let border = "rgba(200,185,255,0.06)";
                if (showResults && selected && isCorrect) { bg = "rgba(78,205,196,0.08)"; border = "rgba(78,205,196,0.2)"; }
                else if (showResults && selected && !isCorrect) { bg = "rgba(232,82,74,0.08)"; border = "rgba(232,82,74,0.2)"; }
                else if (showResults && isCorrect) { bg = "rgba(78,205,196,0.04)"; border = "rgba(78,205,196,0.12)"; }
                else if (selected) { bg = "rgba(200,168,75,0.06)"; border = "rgba(200,168,75,0.15)"; }
                return (
                  <button key={oi} onClick={() => handleAnswer(qi, oi)} style={{
                    padding: "0.5rem 0.75rem", borderRadius: "0.5rem", textAlign: "left",
                    background: bg, border: `1px solid ${border}`,
                    fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
                    color: "rgba(220,210,240,0.75)", cursor: showResults ? "default" : "pointer",
                    transition: "all 0.2s var(--ease-ritual)",
                  }}>{opt}</button>
                );
              })}
            </div>
            {showResults && answered && (
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
                color: correct ? "rgba(78,205,196,0.6)" : "rgba(232,82,74,0.6)",
                marginTop: "0.4rem", fontStyle: "italic",
              }}>
                {correct ? "✓ " : "✗ "}{q.explanation}
              </p>
            )}
          </div>
        );
      })}
      {!showResults && Object.keys(answers).length >= questions.length && (
        <button onClick={() => setShowResults(true)} style={{
          padding: "0.75rem 2rem", borderRadius: "100px", display: "block", margin: "1rem auto",
          background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
          border: "1px solid rgba(200,180,255,0.2)",
          color: "rgba(240,235,255,0.9)", fontSize: "0.82rem", fontWeight: 500,
          letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
        }}>{checkLabel}</button>
      )}
      {showResults && (
        <div style={{
          textAlign: "center", padding: "1rem", marginTop: "0.5rem",
          background: "rgba(200,168,75,0.04)", borderRadius: "0.75rem",
          border: "1px solid rgba(200,168,75,0.1)",
        }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--c-gold)" }}>
            {score}/{questions.length}
          </span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(196,185,228,0.6)", margin: "0.25rem 0 0" }}>
            {score === questions.length ? perfectMsg :
             score >= questions.length * 0.7 ? greatMsg :
             keepStudyingMsg}
          </p>
        </div>
      )}
    </div>
  );
}

function ExerciseGuide({ steps, completeLabel }: { steps: ExerciseStep[]; completeLabel: string }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const typeIcons: Record<string, string> = {
    reflect: "💭", lookup: "🔍", "draw-card": "🃏", journal: "📝", observe: "👁",
  };
  return (
    <div style={{ marginBottom: "1rem" }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: "flex", gap: "0.75rem", padding: "0.85rem 1rem", marginBottom: "0.4rem",
          borderRadius: "0.75rem",
          background: completed.has(i) ? "rgba(78,205,196,0.04)" : "rgba(232,230,240,0.015)",
          border: `1px solid ${completed.has(i) ? "rgba(78,205,196,0.12)" : "rgba(200,185,255,0.04)"}`,
          cursor: "pointer", transition: "all 0.2s var(--ease-ritual)",
        }} onClick={() => setCompleted(prev => {
          const next = new Set(prev);
          if (next.has(i)) next.delete(i); else next.add(i);
          return next;
        })}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>{typeIcons[step.type] || "◎"}</span>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 400,
              color: completed.has(i) ? "rgba(78,205,196,0.6)" : "rgba(220,210,240,0.75)",
              margin: 0, textDecoration: completed.has(i) ? "line-through" : "none",
            }}>{step.instruction}</p>
            {step.hint && (
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 300,
                color: "rgba(180,170,210,0.4)", margin: "0.2rem 0 0", fontStyle: "italic",
              }}>{step.hint}</p>
            )}
          </div>
          <span style={{
            fontSize: "0.8rem", color: completed.has(i) ? "rgba(78,205,196,0.5)" : "rgba(200,185,255,0.15)",
          }}>{completed.has(i) ? "✓" : "○"}</span>
        </div>
      ))}
      {completed.size === steps.length && (
        <div style={{
          textAlign: "center", padding: "0.75rem", marginTop: "0.5rem",
          background: "rgba(78,205,196,0.04)", borderRadius: "0.75rem",
          border: "1px solid rgba(78,205,196,0.1)",
        }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "rgba(78,205,196,0.6)" }}>
            &#10022; {completeLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Widget Loading Fallback ────────────────────────────────────

function WidgetLoader({ label }: { label: string }) {
  return (
    <div style={{
      padding: "2rem", textAlign: "center", marginBottom: "1rem",
      borderRadius: "0.75rem", background: "rgba(232,230,240,0.015)",
      border: "1px solid rgba(200,185,255,0.04)",
    }}>
      <div style={{
        fontFamily: "var(--font-body)", fontSize: "0.72rem",
        color: "rgba(180,170,210,0.35)", fontStyle: "italic",
      }}>{label}</div>
    </div>
  );
}

// ── I18n bag for section rendering ────────────────────────────

interface I18nBag {
  upright: string;
  reversed: string;
  checkAnswers: string;
  quizPerfect: string;
  quizGreat: string;
  quizKeepStudying: string;
  exerciseComplete: string;
  widgetLoading: string;
  calloutInsight: string;
  calloutNote: string;
  calloutTip: string;
  keyTakeaway: string;
  minAbbr: string;
  lessonType: string;
  interactiveType: string;
  quizType: string;
  practiceType: string;
}

// ── Section Renderer ───────────────────────────────────────────

function SectionRenderer({ section, i18n }: { section: ContentSection; i18n: I18nBag }) {
  const wl = <WidgetLoader label={i18n.widgetLoading} />;
  switch (section.type) {
    case "text": return <TextSection title={section.title} body={section.body} />;
    case "callout": return <CalloutBox style={section.style} body={section.body} labels={{ insight: i18n.calloutInsight, note: i18n.calloutNote, tip: i18n.calloutTip }} />;
    case "sign-profile": return <SignProfileCard sign={section.sign} />;
    case "planet-profile": return <PlanetProfileCard planet={section.planet} />;
    case "house-profile": return <HouseProfileCard house={section.house} />;
    case "card-display": return <TarotCardDisplay cardName={section.cardName} showReversed={section.showReversed} uprightLabel={i18n.upright} reversedLabel={i18n.reversed} />;
    case "card-grid": return <CardGrid cards={section.cards} />;
    case "quiz": return <QuizWidget questions={section.questions} checkLabel={i18n.checkAnswers} perfectMsg={i18n.quizPerfect} greatMsg={i18n.quizGreat} keepStudyingMsg={i18n.quizKeepStudying} />;
    case "exercise": return <ExerciseGuide steps={section.steps} completeLabel={i18n.exerciseComplete} />;
    case "comparison-table": return <ComparisonTable headers={section.headers} rows={section.rows} />;
    case "keyword-map": return <KeywordMap items={section.items} />;
    // Interactive academy widgets
    case "zodiac-wheel":
      return <Suspense fallback={wl}><ZodiacWheel /></Suspense>;
    case "element-matrix":
      return <Suspense fallback={wl}><ElementMatrix /></Suspense>;
    case "tarot-reveal":
      return <Suspense fallback={wl}><TarotRevealCard cardName={section.cardName} /></Suspense>;
    case "secret-reveal":
      return <Suspense fallback={wl}><SecretReveal question={section.question} options={section.options} correctIndex={section.correctIndex} explanation={section.explanation} hint={section.hint} /></Suspense>;
    case "house-wheel":
      return <Suspense fallback={wl}><HouseWheel highlightHouse={section.highlightHouse} /></Suspense>;
    case "aspect-visualizer":
      return <Suspense fallback={wl}><AspectVisualizer /></Suspense>;
    case "planetary-journey":
      return <Suspense fallback={wl}><PlanetaryJourney /></Suspense>;
    case "fools-journey":
      return <Suspense fallback={wl}><FoolsJourneyMap /></Suspense>;
    default: return null;
  }
}

// ── Main Component ─────────────────────────────────────────────

export default function LessonList({ lessons, courseSlug }: { lessons: Lesson[]; courseSlug: string }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState<string | null>(null);

  const i18n: I18nBag = {
    upright: t("academy_upright"),
    reversed: t("academy_reversed"),
    checkAnswers: t("academy_check_answers"),
    quizPerfect: t("academy_quiz_perfect"),
    quizGreat: t("academy_quiz_great"),
    quizKeepStudying: t("academy_quiz_keep_studying"),
    exerciseComplete: t("academy_exercise_complete"),
    widgetLoading: t("academy_widget_loading"),
    calloutInsight: t("academy_callout_insight"),
    calloutNote: t("academy_callout_note"),
    calloutTip: t("academy_callout_tip"),
    keyTakeaway: t("academy_key_takeaway"),
    minAbbr: t("academy_min_abbr"),
    lessonType: t("academy_lesson_type"),
    interactiveType: t("academy_interactive_type"),
    quizType: t("academy_quiz_type"),
    practiceType: t("academy_practice_type"),
  };

  const typeLabels: Record<string, string> = {
    reading: i18n.lessonType,
    interactive: i18n.interactiveType,
    quiz: i18n.quizType,
    practice: i18n.practiceType,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {lessons.map((lesson, i) => {
        const def = TYPE_ICON_DEFS[lesson.type] || TYPE_ICON_DEFS.reading;
        const typeInfo = { icon: def.icon, label: typeLabels[lesson.type] || i18n.lessonType, color: def.color };
        const isOpen = expanded === lesson.slug;

        // Generate content only when expanded (performance)
        const content: LessonContent | null = isOpen
          ? generateFullLessonContent(courseSlug, lesson.slug, lesson.title, lesson.description, lesson.duration)
          : null;

        return (
          <div key={lesson.slug}>
            <button
              onClick={() => setExpanded(isOpen ? null : lesson.slug)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.85rem 1rem", width: "100%",
                background: isOpen ? "rgba(200,168,75,0.04)" : "rgba(232,230,240,0.015)",
                border: `1px solid ${isOpen ? "rgba(200,168,75,0.12)" : "rgba(200,185,255,0.04)"}`,
                borderRadius: isOpen ? "0.75rem 0.75rem 0 0" : "0.75rem",
                transition: "all 0.3s var(--ease-ritual)",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 600,
                color: isOpen ? "rgba(200,168,75,0.5)" : "rgba(180,170,210,0.25)",
                width: "24px", textAlign: "center", flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{
                fontSize: "0.75rem", color: typeInfo.color,
                width: "20px", textAlign: "center", flexShrink: 0,
              }}>{typeInfo.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 400,
                  color: isOpen ? "rgba(240,236,255,0.95)" : "rgba(240,236,255,0.82)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{lesson.title}</div>
                {!isOpen && (
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 300,
                    color: "rgba(180,170,210,0.4)", marginTop: "0.1rem",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{lesson.description}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.3)" }}>{lesson.duration}{i18n.minAbbr}</span>
                <span style={{
                  padding: "0.1rem 0.4rem", borderRadius: "100px",
                  background: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}20`,
                  fontFamily: "var(--font-body)", fontSize: "0.5rem", fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase", color: typeInfo.color,
                }}>{typeInfo.label}</span>
                <span style={{
                  fontSize: "0.7rem", color: "rgba(180,170,210,0.3)",
                  transition: "transform 0.3s var(--ease-ritual)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}>▾</span>
              </div>
            </button>

            <AnimatePresence>
              {isOpen && content && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{
                    padding: "1.5rem 1.25rem",
                    background: "rgba(200,168,75,0.02)",
                    borderLeft: "1px solid rgba(200,168,75,0.12)",
                    borderRight: "1px solid rgba(200,168,75,0.12)",
                    borderBottom: "1px solid rgba(200,168,75,0.12)",
                    borderRadius: "0 0 0.75rem 0.75rem",
                  }}>
                    {content.sections.map((section, si) => (
                      <SectionRenderer key={si} section={section} i18n={i18n} />
                    ))}

                    {content.keyTakeaway && (
                      <div style={{
                        marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                        background: "rgba(200,168,75,0.04)", border: "1px solid rgba(200,168,75,0.08)",
                      }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(200,168,75,0.4)" }}>{i18n.keyTakeaway}</span>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(220,210,240,0.7)", margin: "0.25rem 0 0" }}>{content.keyTakeaway}</p>
                      </div>
                    )}

                    <div style={{
                      marginTop: "1rem", paddingTop: "0.75rem",
                      borderTop: "1px solid rgba(200,185,255,0.04)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(180,170,210,0.25)" }}>
                        {content.estimatedMinutes} {i18n.minAbbr}
                      </span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(200,168,75,0.4)" }}>
                        ✦ Lesson {i + 1} of {lessons.length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
