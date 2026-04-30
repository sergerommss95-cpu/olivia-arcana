/**
 * AnimatedCounter.tsx — Spring-interpolated number counter
 *
 * Counts up from 0 → target when the element enters the viewport.
 *
 * Key safety rules:
 *   - The initial render shows the FINAL value (not 0), so the number is
 *     always meaningful even if the IntersectionObserver never fires or
 *     the user has prefers-reduced-motion set.
 *   - When the observer fires we briefly drop to 0 and animate up.
 *   - With prefers-reduced-motion we skip the animation entirely.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number; // ms (default: 2000)
  delay?: number; // ms (default: 0)
  separator?: string; // thousands separator (default: ",")
  className?: string;
  style?: React.CSSProperties;
}

function formatNumber(n: number, decimals: number, separator: string): string {
  const fixed = n.toFixed(decimals);
  if (!separator) return fixed;
  const [int, dec] = fixed.split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return dec !== undefined ? `${withSep}.${dec}` : withSep;
}

export default function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 2000,
  delay = 0,
  separator = ",",
  className = "",
  style,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Start with the REAL value — never show 0 by default.
  const [displayValue, setDisplayValue] = useState(() => formatNumber(value, decimals, separator));
  const animatedRef = useRef(false);
  const rafRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || animatedRef.current) return;

    // Respect reduced-motion — don't animate at all.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animatedRef.current = true;
      return;
    }

    // Small delay to allow mobile layout to settle before checking viewport
    const timer = setTimeout(() => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inViewportOnMount =
        rect.bottom > 0 && rect.top < window.innerHeight;
      
      if (inViewportOnMount) {
        animatedRef.current = true;
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting || animatedRef.current) return;
          animatedRef.current = true;

          // Drop to 0 then animate up.
          setDisplayValue(formatNumber(0, decimals, separator));
          let startTime: number | null = null;
          const animate = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = timestamp - startTime - delay;
            if (elapsed < 0) {
              rafRef.current = requestAnimationFrame(animate);
              return;
            }
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            const current = eased * value;
            setDisplayValue(formatNumber(current, decimals, separator));
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(animate);
            } else {
              setDisplayValue(formatNumber(value, decimals, separator));
            }
          };
          rafRef.current = requestAnimationFrame(animate);
        },
        { threshold: 0.1 }, // Lower threshold for more reliable trigger
      );
      observerRef.current = observer;
      observer.observe(el);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) observerRef.current.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay, decimals, separator]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
