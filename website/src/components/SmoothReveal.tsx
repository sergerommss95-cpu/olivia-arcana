/**
 * SmoothReveal.tsx — Staggered entrance choreography for groups
 *
 * Wraps a set of children and reveals them with staggered timing
 * when the container enters the viewport. Each child gets a unique
 * entrance with configurable direction and spring physics.
 *
 * Unlike ScrollFloat (scroll-scrubbed), this triggers ONCE on viewport
 * entry — like the staggered card entrances Awwwards judges love.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface SmoothRevealProps {
  children: React.ReactNode;
  /** Stagger delay between children in ms (default: 80) */
  stagger?: number;
  /** Animation duration per child in ms (default: 700) */
  duration?: number;
  /** Initial delay before first child animates in ms (default: 0) */
  delay?: number;
  /** Direction of entrance (default: "up") */
  direction?: "up" | "down" | "left" | "right" | "scale";
  /** Translation distance in px (default: 30) */
  distance?: number;
  /** Easing function (default: "cubic-bezier(0.16, 1, 0.3, 1)") */
  ease?: string;
  /** Add blur to entrance (default: false) */
  blur?: boolean;
  /** IntersectionObserver threshold (default: 0.1) */
  threshold?: number;
  /** Wrapper className */
  className?: string;
  /** Wrapper style */
  style?: React.CSSProperties;
}

export default function SmoothReveal({
  children,
  stagger = 80,
  duration = 700,
  delay = 0,
  direction = "up",
  distance = 30,
  ease = "cubic-bezier(0.16, 1, 0.3, 1)",
  blur = false,
  threshold = 0.1,
  className = "",
  style,
}: SmoothRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Viewport trigger
  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setVisible(true);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion, threshold]);

  // Animate children when visible
  useEffect(() => {
    if (!visible || reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const items = el.querySelectorAll<HTMLElement>("[data-reveal-child]");
    items.forEach((item, i) => {
      const getFrom = () => {
        switch (direction) {
          case "up": return `translateY(${distance}px)`;
          case "down": return `translateY(-${distance}px)`;
          case "left": return `translateX(${distance}px)`;
          case "right": return `translateX(-${distance}px)`;
          case "scale": return "scale(0.85)";
          default: return `translateY(${distance}px)`;
        }
      };
      const getTo = () => {
        return direction === "scale" ? "scale(1)" : "translate(0)";
      };

      item.animate(
        [
          {
            opacity: 0,
            transform: getFrom(),
            filter: blur ? "blur(6px)" : "blur(0px)",
          },
          {
            opacity: 1,
            transform: getTo(),
            filter: "blur(0px)",
          },
        ],
        {
          duration,
          delay: delay + i * stagger,
          easing: ease,
          fill: "forwards",
        }
      );
    });
  }, [visible, reducedMotion, direction, distance, duration, delay, stagger, ease, blur]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {React.Children.map(children, (child, i) => (
        <div
          key={i}
          data-reveal-child
          style={{
            opacity: reducedMotion ? 1 : 0,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
