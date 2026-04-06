/**
 * Ask the Stars — Astrological Q&A interface
 *
 * Chat-style UI where users ask cosmic questions.
 * Currently uses pre-written responses (Claude API integration when backend is ready).
 * Glass morphism chat bubbles, typewriter response animation.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface Message {
  role: "user" | "oracle";
  text: string;
  typing?: boolean;
}

// Pre-written oracle responses keyed by simple pattern matching
const ORACLE_RESPONSES: [RegExp, string][] = [
  [/love|relationship|partner|dating|romance/i,
    "The stars reveal a period of deep emotional transformation in your love life. Venus is moving through your intimacy sector, inviting you to release old patterns and open to a more authentic connection. Trust what your heart whispers in the quiet moments — that voice knows the truth your mind is still catching up to."],
  [/career|job|work|money|business|success/i,
    "Saturn's influence on your professional sector demands patience and strategic thinking. The foundation you're building now may feel invisible, but the cosmos rewards those who build with integrity. A significant shift is forming around the next lunar cycle — prepare by clarifying what success truly means to you, beyond titles and numbers."],
  [/health|energy|wellness|tired|stress/i,
    "Your cosmic energy flow is asking for recalibration. The Moon's current transit through your wellness house suggests your body is holding emotional tension that needs release. Prioritize rest as sacred practice, not luxury. Water — both drinking it and being near it — will be particularly healing for you this week."],
  [/friend|social|lonely|connection/i,
    "The stars show your social sphere is undergoing a quiet revolution. Some connections that once felt vital may be fading — this isn't loss, it's curation. The universe is clearing space for people who match the frequency you're growing into. Be patient. The right souls are finding their way to you."],
  [/future|what.*happen|predict|upcoming/i,
    "The celestial currents point toward a period of awakening and clarity. Jupiter's expansive energy is amplifying your intuition, making this an exceptional time for decisions that align with your deepest truth. What you plant in the next three weeks — intentions, conversations, commitments — will bear fruit for years to come."],
  [/purpose|meaning|lost|direction|confused/i,
    "Your north node is calling you toward a purpose that may not fit neatly into conventional categories. The confusion you feel isn't weakness — it's the growing pains of transformation. You're being asked to trust a path that hasn't fully revealed itself yet. Look for clues in what makes you lose track of time, in what moves you to tears, in what you'd do even if no one was watching."],
  [/.*/,
    "The cosmic patterns surrounding your question reveal a moment of transition. The planets are aligning in a way that favors introspection and bold honesty with yourself. The answer you seek is closer than you think — it lives in the space between what you know and what you're afraid to know. Sit with your question under the night sky tonight. The stars have a way of whispering truths to those who are still enough to listen."],
];

function getOracleResponse(question: string): string {
  for (const [pattern, response] of ORACLE_RESPONSES) {
    if (pattern.test(question)) return response;
  }
  return ORACLE_RESPONSES[ORACLE_RESPONSES.length - 1][1];
}

function TypingText({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        setTimeout(tick, 12 + Math.random() * 8);
      } else {
        setDone(true);
        onDone();
      }
    };
    setTimeout(tick, 600); // slight pause before oracle speaks
  }, [text, onDone]);

  return (
    <span>
      {displayed}
      {!done && (
        <span style={{
          display: "inline-block", width: "1px", height: "0.85em",
          background: "rgba(212,175,55,0.5)", marginLeft: "1px",
          animation: "cursorBlink 0.8s step-end infinite",
          verticalAlign: "text-bottom",
        }} />
      )}
      <style>{`@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  );
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const send = () => {
    const q = input.trim();
    if (!q || waiting) return;
    setInput("");
    setWaiting(true);

    const userMsg: Message = { role: "user", text: q };
    const oracleMsg: Message = { role: "oracle", text: getOracleResponse(q), typing: true };

    setMessages(prev => [...prev, userMsg, oracleMsg]);
  };

  const handleTypingDone = () => {
    setWaiting(false);
    setMessages(prev => prev.map(m => m.typing ? { ...m, typing: false } : m));
    inputRef.current?.focus();
  };

  const suggestions = [
    "What does my love life look like?",
    "Will I find my purpose?",
    "What's coming in my career?",
  ];

  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      zIndex: 1,
      maxWidth: "640px",
      margin: "0 auto",
      padding: "0 1.5rem",
    }}>
      {/* Header */}
      <div style={{
        padding: "1.5rem 0",
        textAlign: "center",
        borderBottom: "1px solid rgba(200,185,255,0.06)",
      }}>
        <a href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</a>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "1.5rem",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">Ask the Stars</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", marginTop: "0.3rem",
        }}>Ask any question — receive cosmic guidance</p>
      </div>

      {/* Chat area */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          minHeight: "50vh",
        }}
      >
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "3rem 0",
          }}>
            <div style={{ fontSize: "2.5rem", opacity: 0.3 }}>✦</div>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
              color: "rgba(180,170,210,0.4)", textAlign: "center",
              maxWidth: "300px",
            }}>
              The cosmos awaits your question. Ask about love, career, purpose, or anything on your heart.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{
                    padding: "0.55rem 1.2rem",
                    borderRadius: "100px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(200,185,255,0.08)",
                    color: "rgba(200,190,235,0.6)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: `all 200ms ${EASE}`,
                    textAlign: "left",
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "0.85rem 1.2rem",
              borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
              background: msg.role === "user"
                ? "linear-gradient(135deg, rgba(160,120,255,0.15), rgba(100,80,220,0.1))"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${msg.role === "user" ? "rgba(200,180,255,0.15)" : "rgba(200,185,255,0.06)"}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {msg.role === "oracle" && (
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: "rgba(212,175,55,0.45)", marginBottom: "0.4rem",
              }}>Olivia</div>
            )}
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              fontWeight: 300,
              lineHeight: 1.7,
              color: msg.role === "user" ? "rgba(240,236,255,0.9)" : "rgba(196,185,228,0.78)",
              margin: 0,
              fontStyle: msg.role === "oracle" ? "italic" : "normal",
            }}>
              {msg.typing ? (
                <TypingText text={msg.text} onDone={handleTypingDone} />
              ) : (
                msg.text
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: "1rem 0 2rem",
        display: "flex",
        gap: "0.6rem",
        borderTop: "1px solid rgba(200,185,255,0.06)",
      }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={waiting ? "The stars are speaking..." : "Ask the cosmos anything..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          disabled={waiting}
          style={{
            flex: 1,
            padding: "0.75rem 1.2rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            fontWeight: 300,
            color: "rgba(240,236,255,0.9)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(200,185,255,0.1)",
            borderRadius: "9999px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            outline: "none",
            transition: "border-color 0.3s",
            opacity: waiting ? 0.5 : 1,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(200,185,255,0.25)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(200,185,255,0.1)"; }}
        />
        <button
          onClick={send}
          disabled={waiting || !input.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "100px",
            background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
            border: "1px solid rgba(200,180,255,0.2)",
            color: "rgba(240,235,255,0.9)",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: waiting || !input.trim() ? "not-allowed" : "pointer",
            opacity: waiting || !input.trim() ? 0.3 : 1,
            transition: `all 200ms ${EASE}`,
          }}
        >Ask</button>
      </div>
    </div>
  );
}
