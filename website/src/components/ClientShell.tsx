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

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import PageTransition from "@/components/transitions/PageTransition";
// LANE-COORDINATION(ParlorLayer): the sibling lane's component has not
// landed yet (src/components/ritual/ParlorLayer.tsx). A live import 500s
// the whole dev server, so the mount ships parked. To arm it, uncomment
// this import and the <ParlorLayer /> line below — nothing else changes.
import ParlorLayer from "@/components/ParlorLayer";
import SkyVoyageCanvas from "@/components/sky/SkyVoyageCanvas";
import LiquidNight from "@/components/arrival/LiquidNight";
import SkyAtlas, { SkyAtlasButton } from "@/components/sky/SkyAtlas";
import { markCharted } from "@/components/sky/voyage";
import InstallPrompt from "@/components/InstallPrompt";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { ownsExperienceStage } from "@/lib/experience-shell";

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
function EphemerisScroll() {
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

/** Carta Incognita scribe — every page travelled inks its berth. */
function ChartScribe() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) markCharted(pathname);
  }, [pathname]);
  return null;
}

function StudiesGate({ children }: { children: React.ReactNode }) {
  // The studies are quiet lab rooms — no floating atlas or parlor chrome.
  const pathname = usePathname();
  if (pathname?.startsWith("/studies")) return null;
  return <>{children}</>;
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    // Also cover programmatic Next navigation and browser history entries
    // created before this boundary was installed.
    if (previous !== pathname && (ownsExperienceStage(previous) || ownsExperienceStage(pathname))) {
      window.location.reload();
    }
  }, [pathname]);
  useEffect(() => {
    const navigateNativeDocument = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && !["_self", "_top"].includes(anchor.target))) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || !["http:", "https:"].includes(url.protocol)) return;
      if (!ownsExperienceStage(location.pathname) && !ownsExperienceStage(url.pathname)) return;
      // Hash changes belong to the tarot application's existing router.
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      event.preventDefault();
      location.assign(url.href);
    };
    // Handoff links must save their text (or cancel on storage failure) first.
    // Native anchors then cross the renderer boundary in a fresh document.
    // Next-managed navigation still has the pathname reload fallback above.
    document.addEventListener("click", navigateNativeDocument);
    return () => document.removeEventListener("click", navigateNativeDocument);
  }, []);
  // The question conversation and localized library share the tarot product's
  // own ground; legacy sky controls and extra renderers do not belong here.
  const questionPage = ["/ask", "/ask/", "/uk/ask", "/uk/ask/"].includes(pathname || "");
  const ownsStage = ownsExperienceStage(pathname) || questionPage || pathname === "/uk/cards" || pathname?.startsWith("/uk/cards/");
  // Tier 2 gate — basic client-only render
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {/* EPHEMERIS — one Lenis, one rAF, one velocity for the sky. */}
      {!ownsStage && <EphemerisScroll />}

      {/* LIQUID NIGHT — the living silk-water ground, deepest layer. */}
      {!ownsStage && <LiquidNight />}

      {/* CARTA COELI — the one sky under the whole edition. Fixed canvas
          at z-index 0 (after the liquid in DOM order): above the ground,
          below every page. */}
      {!ownsStage && <SkyVoyageCanvas />}

      {/* Subscription context — provides useSubscription() to all components */}
      <SubscriptionProvider>
        {/* Page content — promoted into its own stacking context so it
            always paints above the sky canvas (z 0). */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {mounted && !ownsStage ? (
            <PageTransition>{children}</PageTransition>
          ) : (
            <>{children}</>
          )}
        </div>
      </SubscriptionProvider>

      {/* PARLOR LAYER — the ritual's ambient hands (oa-ritual bus).
          Parked until the sibling lane lands; see the import note. */}
      {!ownsStage && <ParlorLayer />}

      {/* PWA — registers the service worker on mount; renders nothing
          until the browser fires beforeinstallprompt (then a bottom
          banner, 12s delayed, dismissal remembered 7 days). */}
      {!ownsStage && <InstallPrompt />}

      {/* The Atlas: the engraved chart of the edition, and its opener. */}
      {!ownsStage && <ChartScribe />}
      {!ownsStage && <StudiesGate>
        <SkyAtlas />
        <SkyAtlasButton />
      </StudiesGate>}
    </>
  );
}
