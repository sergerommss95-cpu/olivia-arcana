/**
 * InfiniteMarquee.tsx — God Mode proof system.
 * 
 * Performance Refinements:
 * - GSAP-driven infinite loop
 * - Scroll-velocity skew (kinetic physics)
 * - Motion-blur simulation on fast scroll
 * - Editorial style consistency
 */

"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  speed?: number;
  gap?: number;
  direction?: "left" | "right";
  className?: string;
}

export default function InfiniteMarquee({
  children,
  speed = 30, // seconds per full loop
  gap = 64,
  direction = "left",
  className = "",
}: InfiniteMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;
    if (window.matchMedia("(max-width: 640px)").matches) return;

    const track = trackRef.current;
    const scrollDirection = direction === "left" ? -1 : 1;

    // Animation timeline
    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: "none" }
    });

    const totalWidth = track.scrollWidth / 2;
    
    tl.to(track, {
      x: scrollDirection * totalWidth,
      duration: speed,
    });

    // Velocity Skew & Blur (God Mode)
    const proxy = { skew: 0 };
    const skewSetter = gsap.quickSetter(track, "skewX", "deg");
    const clamp = gsap.utils.clamp(-12, 12);

    const scrollTrigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        const skew = clamp(velocity / 180);
        
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, {
            skew: 0,
            duration: 0.8,
            ease: "power3",
            overwrite: true,
            onUpdate: () => {
              skewSetter(proxy.skew);
              // Simulated motion blur based on skew
              track.style.filter = `blur(${Math.abs(proxy.skew) * 0.5}px)`;
            }
          });
        }
      }
    });

    return () => {
      tl.kill();
      scrollTrigger.kill();
    };
  }, [speed, direction]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden py-12 border-y border-white/5 bg-void-black/10 backdrop-blur-sm ${className}`}
      style={{
        contain: "layout paint",
        maxWidth: "100vw",
        maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
      }}
    >
      <div
        ref={trackRef}
        className="marquee-track flex items-center whitespace-nowrap will-change-transform"
        style={{ gap: `${gap}px` }}
      >
        <div className="marquee-set flex items-center gap-[inherit]">
          {children}
        </div>
        {/* Duplicate for infinite effect */}
        <div className="marquee-set marquee-duplicate flex items-center gap-[inherit]" aria-hidden="true">
          {children}
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 640px) {
          .marquee-track {
            transform: none !important;
            filter: none !important;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.1rem !important;
            white-space: normal;
            will-change: auto;
            padding-inline: 1rem;
          }
          .marquee-set {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.1rem !important;
          }
          .marquee-duplicate {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
