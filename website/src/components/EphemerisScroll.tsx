"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    /** The one smooth-scroll instance — other code may scrollTo through it. */
    __lenis?: Lenis;
    /** Raw scroll velocity (clamped -1..1, lerped to 0) for canvases. */
    __scrollVel?: number;
  }
}

/**
 * EPHEMERIS FOUNDATION — the one clock's carriage. A single Lenis
 * instance driven by the ONE rAF; the same loop lerps scroll velocity
 * into --scroll-vel on <html> (SKY DRIFT) and mirrors it raw on
 * window.__scrollVel for canvases. Reduced motion: never mounted —
 * native scroll, --scroll-vel stays 0.
 */
export default function EphemerisScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09 });
    window.__lenis = lenis;
    const doc = document.documentElement;

    let vel = 0;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      // Clamp Lenis velocity into -1..1; lerp back toward rest so the
      // sky settles instead of snapping.
      const target = Math.max(-1, Math.min(1, (lenis.velocity ?? 0) / 60));
      vel += (target - vel) * 0.12;
      if (Math.abs(vel) < 0.0015 && target === 0) vel = 0;
      doc.style.setProperty("--scroll-vel", vel.toFixed(4));
      window.__scrollVel = vel;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Hash anchors still work — carried by the same carriage.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -16 });
      history.pushState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
      if (window.__lenis === lenis) delete window.__lenis;
      doc.style.setProperty("--scroll-vel", "0");
      window.__scrollVel = 0;
    };
  }, []);

  return null;
}
