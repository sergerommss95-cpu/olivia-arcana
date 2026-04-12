"use client";

import React, { useState } from "react";

/**
 * SecretReveal — Guess-before-answer AHA amplifier.
 *
 * Psychology: prediction error is the strongest learning signal.
 * When you guess wrong, the correction is MEMORABLE.
 * When you guess right, the confidence boost is MOTIVATING.
 *
 * Flow:
 * 1. Question displayed prominently
 * 2. User selects from multiple choice options
 * 3. After selecting, dramatic reveal animation
 * 4. Right → celebration + reinforcement
 * 5. Wrong → gentle correction + "here's why" explanation
 */

interface Props {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
  revealTitle?: string;
}

export default function SecretReveal({
  question, options, correctIndex, explanation, hint, revealTitle,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
  };

  const handleReveal = () => {
    if (selected === null || revealed) return;
    setRevealed(true);
  };

  const isCorrect = selected === correctIndex;
  const correctAnswer = options[correctIndex];

  return (
    <div style={{
      marginBottom: "1.25rem", borderRadius: "0.75rem", overflow: "hidden",
      background: revealed
        ? isCorrect
          ? "rgba(78,205,196,0.04)"
          : "rgba(200,168,75,0.04)"
        : "rgba(232,230,240,0.02)",
      border: `1px solid ${
        revealed
          ? isCorrect ? "rgba(78,205,196,0.15)" : "rgba(200,168,75,0.15)"
          : "rgba(200,185,255,0.06)"
      }`,
      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      <div style={{ padding: "1.25rem" }}>
        {/* Question header */}
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: revealed ? (isCorrect ? "rgba(78,205,196,0.5)" : "rgba(200,168,75,0.5)") : "rgba(200,185,255,0.3)",
          marginBottom: "0.4rem",
        }}>
          {revealed ? (isCorrect ? "✦ YOU GOT IT" : "✦ SECRET REVEALED") : "✦ TEST YOUR KNOWLEDGE"}
        </div>

        {/* Question */}
        <p style={{
          fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 400,
          color: "rgba(240,236,255,0.9)", margin: "0 0 0.3rem",
          lineHeight: 1.4,
        }}>
          {question}
        </p>

        {/* Hint */}
        {hint && !revealed && (
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 300,
            fontStyle: "italic", color: "rgba(180,170,210,0.35)", margin: "0 0 0.75rem",
          }}>
            Hint: {hint}
          </p>
        )}

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.5rem" }}>
          {options.map((opt, i) => {
            const isThis = selected === i;
            const isAnswer = i === correctIndex;
            let bg = "rgba(232,230,240,0.025)";
            let border = "rgba(200,185,255,0.06)";
            let textColor = "rgba(220,210,240,0.7)";

            if (revealed && isAnswer) {
              bg = "rgba(78,205,196,0.1)";
              border = "rgba(78,205,196,0.25)";
              textColor = "rgba(78,205,196,0.9)";
            } else if (revealed && isThis && !isAnswer) {
              bg = "rgba(232,82,74,0.06)";
              border = "rgba(232,82,74,0.15)";
              textColor = "rgba(232,82,74,0.6)";
            } else if (isThis && !revealed) {
              bg = "rgba(200,168,75,0.08)";
              border = "rgba(200,168,75,0.2)";
              textColor = "rgba(212,175,55,0.9)";
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                style={{
                  padding: "0.6rem 0.85rem", borderRadius: "0.5rem", textAlign: "left",
                  background: bg, border: `1px solid ${border}`,
                  fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: isThis ? 500 : 300,
                  color: textColor,
                  cursor: revealed ? "default" : "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                  color: revealed && isAnswer ? "rgba(78,205,196,0.7)" : "rgba(180,170,210,0.3)",
                  width: "16px", flexShrink: 0,
                }}>
                  {revealed && isAnswer ? "✓" : revealed && isThis ? "✗" : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Reveal button */}
        {selected !== null && !revealed && (
          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button
              onClick={handleReveal}
              style={{
                padding: "0.55rem 1.5rem", borderRadius: "100px", cursor: "pointer",
                background: "linear-gradient(135deg, rgba(200,168,75,0.15), rgba(160,120,80,0.1))",
                border: "1px solid rgba(200,168,75,0.2)",
                color: "rgba(212,175,55,0.9)", fontSize: "0.75rem", fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              ✦ Reveal the Answer
            </button>
          </div>
        )}

        {/* Explanation (after reveal) */}
        {revealed && (
          <div style={{
            marginTop: "0.75rem", padding: "0.75rem 0.85rem", borderRadius: "0.5rem",
            background: isCorrect ? "rgba(78,205,196,0.04)" : "rgba(200,168,75,0.04)",
            border: `1px solid ${isCorrect ? "rgba(78,205,196,0.08)" : "rgba(200,168,75,0.08)"}`,
          }}>
            {!isCorrect && (
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500,
                color: "rgba(78,205,196,0.7)", marginBottom: "0.3rem",
              }}>
                The answer is: {correctAnswer}
              </div>
            )}
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
              lineHeight: 1.7, color: "rgba(220,210,240,0.7)", margin: 0,
            }}>
              {explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
