/**
 * ClientShell.tsx — single client boundary around every page.
 *
 * The Personal Almanac era: pages own their entire look (light almanac
 * shells or night plates). This shell only provides the subscription
 * context and the page-turn transition choreography. The 2022-era cosmic
 * chrome (WebGL background, cursor, sound, film grain, bottom nav) is
 * gone — see NightShell/AlmanacShell for per-register grounds.
 */

"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import PageTransition from "@/components/transitions/PageTransition";
import ParlorLayer from "@/components/ParlorLayer";
import SkyVoyageCanvas from "@/components/sky/SkyVoyageCanvas";
import SkyAtlas, { SkyAtlasButton } from "@/components/sky/SkyAtlas";
import { markCharted } from "@/components/sky/voyage";
import { SubscriptionProvider } from "@/hooks/useSubscription";

declare global {
  interface Window {
    /** The one smooth-scroll instance — other code may scrollTo through it. */
    __lenis?: Lenis;
    /** Raw scroll velocity (clamped -1..1, lerped to 0) for canvases. */
    __scrollVel?: number;
  }
}

/** Native scrolling supplies a brief, settling drift; no idle animation clock. */
function EphemerisScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const doc = document.documentElement;
    let frame = 0;
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let velocity = 0;
    const write = () => {
      doc.style.setProperty("--scroll-vel", velocity.toFixed(4));
      window.__scrollVel = velocity;
    };
    const settle = () => {
      frame = 0;
      velocity *= 0.82;
      if (Math.abs(velocity) < 0.002) velocity = 0;
      write();
      if (velocity) frame = requestAnimationFrame(settle);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      velocity = 0;
      lastY = window.scrollY;
      lastTime = performance.now();
      write();
    };
    const onScroll = () => {
      if (reduced.matches || document.hidden) return;
      const now = performance.now();
      velocity = Math.max(-1, Math.min(1, (window.scrollY - lastY) / Math.max(16, now - lastTime) / 3));
      lastY = window.scrollY;
      lastTime = now;
      if (!frame) frame = requestAnimationFrame(settle);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", reset);
    reduced.addEventListener("change", reset);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", reset);
      reset();
    };
  }, []);
  return null;
}

/** Carta Incognita scribe — every page travelled inks its berth. */
function ChartScribe() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) markCharted(pathname);
  }, [pathname]);
  return null;
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* A shared, event-driven drift follows native scroll. */}
      <EphemerisScroll />

      {/* CARTA COELI — the one sky under the whole edition. Fixed canvas
          at z-index 0 (after the liquid in DOM order): above the ground,
          below every page. */}
      <SkyVoyageCanvas />

      {/* Subscription context — provides useSubscription() to all components */}
      <SubscriptionProvider>
        {/* Page content — promoted into its own stacking context so it
            always paints above the sky canvas (z 0). */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <PageTransition>{children}</PageTransition>
        </div>
      </SubscriptionProvider>

      {/* One optional sound and ambient interaction controller. */}
      <ParlorLayer />

      {/* The Atlas: the engraved chart of the edition, and its opener. */}
      <ChartScribe />
      <SkyAtlas />
      <SkyAtlasButton />
    </>
  );
}
