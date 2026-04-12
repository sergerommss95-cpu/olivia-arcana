/**
 * AnimatedCounter.tsx — Spring-interpolated number counter
 *
 * Counts up from 0 to target value with spring physics,
 * triggered when scrolling into viewport. Supports:
 *   - Integer and decimal values
 *   - Prefix/suffix (e.g., "12,400+" or "4.9 ★" or "97%")
 *   - Custom formatting
 *   - Spring-like deceleration curve
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
  const [displayValue, setDisplayValue] = useState("0");
  const [started, setStarted] = useState(false);
  const rafRef = useRef(0);

  // Format number with separators
  const format = (n: number) => {
    const fixed = n.toFixed(decimals);
    if (!separator) return fixed;
    const [int, dec] = fixed.split(".");
    const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return dec !== undefined ? `${withSep}.${dec}` : withSep;
  };

  // Viewport detection
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Animate when started
  useEffect(() => {
    if (!started) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime - delay;

      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);

      // Spring-like ease-out: fast start, smooth deceleration
      // Using exponential ease-out for that satisfying counting feel
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = eased * value;
      setDisplayValue(format(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(format(value));
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, value, duration, delay, decimals, separator]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
