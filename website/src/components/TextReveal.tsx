/**
 * TextReveal.tsx — Awwwards-grade text split animation
 *
 * Splits text into characters, words, or lines and animates each with
 * staggered spring physics. Supports scroll-triggered and on-mount modes.
 *
 * Every SOTD winner uses per-character text animation — this is it.
 */

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

type SplitMode = "chars" | "words" | "lines";
type TriggerMode = "viewport" | "mount" | "manual";

interface TextRevealProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  split?: SplitMode;
  trigger?: TriggerMode;
  revealed?: boolean; // for manual trigger mode
  stagger?: number; // ms between each element (default: 35)
  duration?: number; // ms per element (default: 800)
  delay?: number; // initial delay ms (default: 0)
  direction?: "up" | "down" | "left" | "right" | "scale" | "rotate";
  ease?: string;
  intensity?: number; // translation distance in px (default: 40)
  blur?: boolean; // add blur to entrance (default: false)
  clipReveal?: boolean; // use clip-path reveal (default: true)
  randomize?: boolean; // slight random variation on stagger timing
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

export default function TextReveal({
  children,
  as: Tag = "div",
  split = "words",
  trigger = "viewport",
  revealed: manualRevealed,
  stagger = 35,
  duration = 800,
  delay = 0,
  direction = "up",
  ease = "cubic-bezier(0.16, 1, 0.3, 1)",
  intensity = 40,
  blur = false,
  clipReveal = true,
  randomize = false,
  className = "",
  style,
  onComplete,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(trigger === "mount");
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasAnimated = useRef(false);
  const completeCount = useRef(0);

  // Split text into elements
  const elements = useMemo(() => {
    if (split === "chars") {
      return children.split("").map((ch, i) => ({
        text: ch,
        key: `${ch}-${i}`,
        isSpace: ch === " ",
      }));
    }
    if (split === "lines") {
      return children.split("\n").map((line, i) => ({
        text: line,
        key: `line-${i}`,
        isSpace: false,
      }));
    }
    // words (default)
    return children.split(/(\s+)/).map((word, i) => ({
      text: word,
      key: `${word}-${i}`,
      isSpace: /^\s+$/.test(word),
    }));
  }, [children, split]);

  const nonSpaceCount = elements.filter(e => !e.isSpace).length;

  // Detect reduced motion
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Viewport trigger
  useEffect(() => {
    if (trigger !== "viewport" || reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setIsVisible(true);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger, reducedMotion]);

  // Manual trigger
  useEffect(() => {
    if (trigger === "manual" && manualRevealed) {
      setIsVisible(true);
    }
  }, [trigger, manualRevealed]);

  // Animate elements when visible
  useEffect(() => {
    if (!isVisible || reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const spans = el.querySelectorAll<HTMLSpanElement>("[data-reveal-item]");
    let nonSpaceIdx = 0;

    spans.forEach((span) => {
      if (span.dataset.space === "true") return;
      const idx = nonSpaceIdx++;

      // Random stagger variation (Awwwards sites do this for organic feel)
      const jitter = randomize ? (Math.random() - 0.5) * stagger * 0.6 : 0;
      const itemDelay = delay + idx * stagger + jitter;

      // Compute transform based on direction
      const getFrom = () => {
        switch (direction) {
          case "up": return `translateY(${intensity}px)`;
          case "down": return `translateY(-${intensity}px)`;
          case "left": return `translateX(${intensity}px)`;
          case "right": return `translateX(-${intensity}px)`;
          case "scale": return `scale(0.5)`;
          case "rotate": return `rotateX(90deg)`;
          default: return `translateY(${intensity}px)`;
        }
      };

      const fromTransform = getFrom();
      const fromFilter = blur ? "blur(8px)" : "blur(0px)";
      const fromClip = clipReveal ? "inset(0 0 100% 0)" : "none";

      const keyframes: Keyframe[] = [
        {
          opacity: 0,
          transform: fromTransform,
          filter: fromFilter,
          clipPath: fromClip,
        },
        {
          opacity: 1,
          transform: direction === "scale" ? "scale(1)" : direction === "rotate" ? "rotateX(0deg)" : "translate(0)",
          filter: "blur(0px)",
          clipPath: "inset(0 0 0% 0)",
        },
      ];

      const anim = span.animate(keyframes, {
        duration,
        delay: itemDelay,
        easing: ease,
        fill: "forwards",
      });

      anim.onfinish = () => {
        completeCount.current++;
        if (completeCount.current >= nonSpaceCount && onComplete) {
          onComplete();
        }
      };
    });
  }, [isVisible, reducedMotion, split, stagger, duration, delay, direction, ease, intensity, blur, clipReveal, randomize, nonSpaceCount, onComplete]);

  if (reducedMotion) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={containerRef as React.RefObject<HTMLElement & HTMLDivElement>}
      className={className}
      style={{
        ...style,
        perspective: direction === "rotate" ? "1200px" : undefined,
      }}
    >
      {elements.map(({ text, key, isSpace }) =>
        isSpace ? (
          <span key={key} data-reveal-item data-space="true" style={{ display: "inline" }}>
            {text}
          </span>
        ) : (
          <span
            key={key}
            data-reveal-item
            style={{
              display: split === "lines" ? "block" : "inline-block",
              opacity: 0,
              whiteSpace: split === "chars" ? "pre" : undefined,
              transformOrigin: direction === "rotate" ? "center bottom" : undefined,
            }}
          >
            {text}
          </span>
        )
      )}
    </Tag>
  );
}
