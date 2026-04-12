/**
 * HorizontalScroll.tsx — Pinned horizontal scroll gallery
 *
 * Converts a container of items into a horizontal scrolling section
 * that pins at the top and scrolls horizontally as the user scrolls
 * vertically. Each card scales, fades, and parallaxes as it crosses
 * the viewport center.
 *
 * Uses native scroll + transform (no GSAP dependency).
 */

"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

interface HorizontalScrollProps {
  children: React.ReactNode[];
  /** Height multiplier for scroll distance (default: 3 = 300vh) */
  scrollMultiplier?: number;
  /** Gap between items in px (default: 40) */
  gap?: number;
  /** Card width in px (default: 400) */
  cardWidth?: number;
  /** Title above the section */
  title?: string;
  /** Subtitle / eyebrow */
  eyebrow?: string;
  className?: string;
}

export default function HorizontalScroll({
  children,
  scrollMultiplier = 3,
  gap = 40,
  cardWidth = 420,
  title,
  eyebrow,
  className = "",
}: HorizontalScrollProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const itemCount = React.Children.count(children);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Calculate scroll progress within the pinned section
  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      if (sectionHeight <= 0) return;
      // How far we've scrolled through the section
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / sectionHeight));
      setProgress(p);
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  // Total track width
  const totalWidth = useMemo(
    () => itemCount * cardWidth + (itemCount - 1) * gap,
    [itemCount, cardWidth, gap]
  );

  // How far to translate the track
  const translateX = useMemo(() => {
    const maxTranslate = totalWidth - (typeof window !== "undefined" ? window.innerWidth : 1200) + 100;
    return -progress * Math.max(0, maxTranslate);
  }, [progress, totalWidth]);

  if (reducedMotion) {
    // Fallback: regular horizontal scroll
    return (
      <section className={`py-20 px-6 ${className}`}>
        {eyebrow && (
          <p className="text-center font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-center font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-12">
            {title}
          </h2>
        )}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {React.Children.map(children, (child, i) => (
            <div key={i} className="flex-shrink-0 snap-center" style={{ width: cardWidth }}>
              {child}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={className}
      style={{
        height: `${scrollMultiplier * 100}vh`,
        position: "relative",
      }}
    >
      {/* Sticky container */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Section header */}
        {(eyebrow || title) && (
          <div
            style={{
              textAlign: "center",
              paddingBottom: "2rem",
              opacity: 1 - Math.max(0, progress - 0.8) * 5,
              transform: `translateY(${progress > 0.8 ? (progress - 0.8) * -100 : 0}px)`,
              transition: "opacity 0.1s, transform 0.1s",
            }}
          >
            {eyebrow && (
              <p
                className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4"
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Horizontal track */}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: `${gap}px`,
            paddingLeft: "max(2rem, calc((100vw - ${cardWidth}px) / 2))",
            paddingRight: "4rem",
            transform: `translateX(${translateX}px)`,
            willChange: "transform",
          }}
        >
          {React.Children.map(children, (child, i) => {
            // Calculate per-card progress (0 = entering, 0.5 = centered, 1 = exiting)
            const cardProgress = progress * (itemCount - 1) - i + 0.5;
            const distFromCenter = Math.abs(cardProgress);
            const isCentered = distFromCenter < 0.6;
            const cardScale = isCentered ? 1 : 0.92 + 0.08 * Math.max(0, 1 - distFromCenter);
            const cardOpacity = isCentered ? 1 : 0.5 + 0.5 * Math.max(0, 1 - distFromCenter * 0.8);

            return (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: cardWidth,
                  transform: `scale(${cardScale})`,
                  opacity: cardOpacity,
                  transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
                }}
              >
                {child}
              </div>
            );
          })}
        </div>

        {/* Progress indicator dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            paddingTop: "2rem",
          }}
        >
          {Array.from({ length: itemCount }, (_, i) => {
            const cardIdx = Math.round(progress * (itemCount - 1));
            const isActive = i === cardIdx;
            return (
              <div
                key={i}
                style={{
                  width: isActive ? "24px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: isActive
                    ? "rgba(212,175,55,0.6)"
                    : "rgba(200,185,255,0.15)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
