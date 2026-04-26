/**
 * SectionReveal — Scroll-driven section entrance
 *
 * Each section rises from darkness using clip-path reveal.
 * Content doesn't fade in — it RISES to meet the viewer.
 * clip-path: inset(100% 0 0 0) → inset(0% 0 0 0)
 *
 * Also applies subtle parallax: the content translates up
 * slower than the scroll, creating depth.
 */

"use client";

import React, { useRef, useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** Delay before reveal starts (in ms) */
  delay?: number;
  /** Extra className */
  className?: string;
}

export default function SectionReveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = setTimeout(() => setProgress(1), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start reveal with optional delay
          const timer = setTimeout(() => {
            // Animate progress from 0 to 1 over 800ms
            const start = performance.now();
            const duration = 900;
            const animate = (now: number) => {
              const elapsed = now - start;
              const t = Math.min(elapsed / duration, 1);
              // Ease out expo
              const eased = 1 - Math.pow(2, -10 * t);
              setProgress(eased);
              if (t < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }, delay);

          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // clip-path: reveal from bottom up
  const clipInset = 100 - progress * 100;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        clipPath: `inset(${clipInset}% 0 0 0)`,
        transform: `translateY(${(1 - progress) * 30}px)`,
        willChange: progress < 1 ? "clip-path, transform" : "auto",
        transition: progress >= 1 ? "none" : undefined,
      }}
    >
      {children}
    </div>
  );
}
