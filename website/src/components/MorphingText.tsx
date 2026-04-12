/**
 * MorphingText.tsx — Cycling text with smooth morphing transition
 *
 * Cycles through an array of strings with a blurry cross-fade
 * morphing effect. Perfect for hero taglines that rotate through
 * different value propositions.
 *
 * The morph uses overlapping blur + opacity for a smooth transition
 * that looks organic, not mechanical.
 */

"use client";

import React, { useEffect, useState, useRef } from "react";

interface MorphingTextProps {
  texts: string[];
  /** Time each text stays visible in ms (default: 3000) */
  interval?: number;
  /** Morph transition duration in ms (default: 1200) */
  morphDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function MorphingText({
  texts,
  interval = 3000,
  morphDuration = 1200,
  className = "",
  style,
}: MorphingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMorphing, setIsMorphing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (texts.length <= 1 || reducedMotion) return;

    const cycle = setInterval(() => {
      setIsMorphing(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsMorphing(false);
      }, morphDuration);
    }, interval);

    return () => clearInterval(cycle);
  }, [texts, interval, morphDuration, reducedMotion]);

  const nextIndex = (currentIndex + 1) % texts.length;

  if (reducedMotion || texts.length <= 1) {
    return (
      <span className={className} style={style}>
        {texts[currentIndex]}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        ...style,
      }}
    >
      {/* Current text */}
      <span
        ref={text1Ref}
        style={{
          display: "inline-block",
          opacity: isMorphing ? 0 : 1,
          filter: isMorphing ? "blur(8px)" : "blur(0px)",
          transform: isMorphing ? "translateY(-4px)" : "translateY(0)",
          transition: `all ${morphDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {texts[currentIndex]}
      </span>

      {/* Next text (overlaid during morph) */}
      <span
        ref={text2Ref}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "inline-block",
          opacity: isMorphing ? 1 : 0,
          filter: isMorphing ? "blur(0px)" : "blur(8px)",
          transform: isMorphing ? "translateY(0)" : "translateY(4px)",
          transition: `all ${morphDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      >
        {texts[nextIndex]}
      </span>
    </span>
  );
}
