/**
 * ScrollReveal.tsx — Intersection Observer wrapper with parallax
 *
 * Wraps any section with:
 *   - Fade + translateY reveal on scroll intersection
 *   - Optional parallax: children shift at different rates as you scroll
 *   - Stagger delay for child elements marked with data-sr
 *   - One EASE curve everywhere
 */

"use client";

import React, { useEffect, useRef, type ReactNode } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface Props {
  children: ReactNode;
  delay?: number;      // base delay in ms
  distance?: number;   // translateY distance in px (default 30)
  parallax?: boolean;  // enable scroll parallax on this section
  className?: string;
  style?: React.CSSProperties;
}

export default function ScrollReveal({ children, delay = 0, distance = 30, parallax = false, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reveal the section
          el.animate(
            [
              { opacity: "0", transform: `translateY(${distance}px)` },
              { opacity: "1", transform: "translateY(0)" },
            ],
            { duration: 700, delay, easing: EASE, fill: "forwards" }
          );

          // Stagger children with data-sr attribute
          const items = el.querySelectorAll<HTMLElement>("[data-sr]");
          items.forEach((child, i) => {
            child.animate(
              [
                { opacity: "0", transform: "translateY(14px)" },
                { opacity: "1", transform: "translateY(0)" },
              ],
              { duration: 500, delay: delay + 150 + i * 80, easing: EASE, fill: "forwards" }
            );
          });

          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);

    // Parallax scroll listener
    let rafId = 0;
    if (parallax) {
      const onScroll = () => {
        rafId = requestAnimationFrame(() => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const viewH = window.innerHeight;
          const center = rect.top + rect.height / 2;
          const offset = (center - viewH / 2) / viewH; // -0.5 to 0.5
          parallaxRef.current = offset;
          el.style.setProperty("--parallax", `${offset * -20}px`);
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        obs.disconnect();
        cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", onScroll);
      };
    }

    return () => obs.disconnect();
  }, [delay, distance, parallax]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        willChange: "opacity, transform",
        ...(parallax ? { transform: `translateY(var(--parallax, 0px))` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
