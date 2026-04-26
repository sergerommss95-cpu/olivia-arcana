/**
 * WhisperText — Word-by-word text reveal
 *
 * Card interpretation text reveals as the user reads — each word
 * clips in with a 40ms stagger. Combined with the reading experience,
 * this turns interpretation into genuinely theatrical experience.
 *
 * Respects prefers-reduced-motion: instant reveal.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  delay?: number;       // ms before starting
  wordDelay?: number;   // ms between words (default 40)
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

export default function WhisperText({
  text,
  delay = 0,
  wordDelay = 40,
  className = "",
  style,
  onComplete,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useRef(false);
  const words = text.split(/\s+/).filter(Boolean);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current) {
      setVisibleCount(words.length);
      onCompleteRef.current?.();
      return;
    }

    // IntersectionObserver — start when visible
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [words.length]);

  useEffect(() => {
    if (!started || reducedMotion.current) return;

    const startTimer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleCount(i);
        if (i >= words.length) {
          clearInterval(interval);
          onCompleteRef.current?.();
        }
      }, wordDelay);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [started, delay, wordDelay, words.length]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.3em",
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? "translateY(0)" : "translateY(4px)",
            fontWeight: i < visibleCount ? "inherit" : 300,
            transition: `
              opacity 0.4s var(--ease-ritual), 
              transform 0.4s var(--ease-ritual), 
              font-weight 0.6s var(--ease-ritual)
            `,
            willChange: i < visibleCount ? "auto" : "opacity, transform, font-weight",
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
