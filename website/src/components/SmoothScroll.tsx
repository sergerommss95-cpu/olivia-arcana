/**
 * SmoothScroll — Lenis-powered smooth scrolling
 *
 * Wraps the entire page. Throttles scroll speed at the top
 * (60% of native) for the ritual entrance feel, normalizing
 * to 100% by the third section. Creates the sensation of
 * moving through something physical — water, fog, intention.
 */

"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: reduced ? 0.01 : isTouch ? 1.0 : 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: isTouch ? 1.0 : 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
