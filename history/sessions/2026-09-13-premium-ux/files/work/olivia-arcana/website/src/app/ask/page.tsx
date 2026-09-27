/**
 * Ask the Stars — Astrological Q&A interface
 *
 * Chat-style UI where users ask cosmic questions.
 * Currently uses pre-written responses (Claude API integration when backend is ready).
 * Set in the Personal Almanac print register: paper correspondence — the
 * reader's notes on the right, Olivia's letters on the left.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { useLocale } from "@/lib/i18n/useLocale";
import { loadUser, type StoredUser } from "../../lib/user-store";

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
        <span className="ask-caret" style={{
          display: "inline-block", width: "1px", height: "0.85em",
          background: "var(--ox, #e0b768)", marginLeft: "1px",
          animation: "cursorBlink 0.8s step-end infinite",
          verticalAlign: "text-bottom",
        }} />
      )}
      <style>{`@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} } @media (prefers-reduced-motion: reduce) { .ask-caret { animation: none !important; } }`}</style>
    </span>
  );
}

export default function AskPage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(loadUser());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
    <AlmanacShell narrow>
      <div className="ask">
        {/* Header */}
        <header className="ask-head">
          <p className="alm-kicker">{isUk ? "ЛИСТИ ВІД ДРУКАРНІ" : "LETTERS FROM THE PRESS"}</p>
          <h1 className="alm-h1">Ask the Stars</h1>
          <p className="ask-sub alm-caption">
            {user ? `Answering as a ${user.sunSign} Sun, ${user.moonSign} Moon` : "Ask any question — receive cosmic guidance"}
          </p>
        </header>

        {/* Chat area */}
        <div ref={chatRef} className="ask-chat">
          {messages.length === 0 && (
            <div className="ask-empty">
              <div className="ask-empty-mark" aria-hidden>✦</div>
              <p className="ask-empty-copy">
                The cosmos awaits your question. Ask about love, career, purpose, or anything on your heart.
              </p>
              <div className="ask-suggestions">
                {suggestions.map(s => (
                  <button
                    key={s}
                    className="ask-suggestion"
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === "user" ? "msg-user" : "msg-oracle"}`}>
              {msg.role === "oracle" && <div className="msg-label">Olivia</div>}
              <p className="msg-text">
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
        <div className="ask-input-row">
          <input
            ref={inputRef}
            type="text"
            className="alm-input"
            placeholder={waiting ? "The stars are speaking..." : "Ask the cosmos anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            disabled={waiting}
          />
          <button
            className="alm-btn"
            onClick={send}
            disabled={waiting || !input.trim()}
          >Ask</button>
        </div>
      </div>

      <style jsx>{`
        .ask {
          display: flex;
          flex-direction: column;
          min-height: 68svh;
        }

        .ask-head {
          text-align: center;
          padding-bottom: 1.4rem;
          border-bottom: 1px solid var(--hairline);
        }

        .ask-head :global(.alm-h1) {
          font-size: clamp(1.9rem, 4vw, 2.6rem);
        }

        .ask-sub {
          margin: 0.7rem 0 0;
        }

        .ask-chat {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          min-height: 50vh;
        }

        .ask-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 3rem 0;
        }

        .ask-empty-mark {
          color: var(--ox);
          font-size: 1.6rem;
          opacity: 0.7;
        }

        .ask-empty-copy {
          margin: 0;
          max-width: 34ch;
          text-align: center;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.65;
        }

        .ask-suggestions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ask-suggestion {
          padding: 0.55rem 1.2rem;
          border-radius: 999px;
          background: rgba(250, 246, 236, 0.6);
          border: 1px solid var(--hairline);
          color: var(--ink-soft);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          cursor: pointer;
          text-align: left;
          transition: border-color 200ms var(--ease), color 200ms var(--ease);
        }

        .ask-suggestion:hover {
          border-color: var(--ox);
          color: var(--ox);
        }

        .msg {
          max-width: 85%;
          padding: 0.85rem 1.2rem;
        }

        .msg-user {
          align-self: flex-end;
          background: var(--ink);
          color: #f6f1e5;
          border-radius: 0.9rem 0.9rem 0.2rem 0.9rem;
        }

        .msg-oracle {
          align-self: flex-start;
          background: #0f1240;
          border: 1px solid var(--hairline);
          border-radius: 0.2rem;
          box-shadow: 0 0.5rem 1.2rem rgba(4, 6, 32, 0.06);
        }

        .msg-label {
          margin-bottom: 0.4rem;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .msg-text {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.7;
        }

        .msg-user .msg-text {
          font-family: var(--font-body, system-ui), sans-serif;
        }

        .msg-oracle .msg-text {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.02rem;
          font-style: italic;
          color: var(--ink);
        }

        .ask-input-row {
          display: flex;
          gap: 0.6rem;
          padding: 1rem 0 0.5rem;
          border-top: 1px solid var(--hairline);
        }

        .ask-input-row :global(.alm-input) {
          border-radius: 999px;
        }

        .ask-input-row :global(.alm-input:disabled) {
          opacity: 0.5;
        }

        @media (prefers-reduced-motion: reduce) {
          .ask-suggestion {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
