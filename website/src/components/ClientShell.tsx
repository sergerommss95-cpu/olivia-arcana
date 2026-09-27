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
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import PageTransition from "@/components/transitions/PageTransition";
import { markCharted } from "@/components/sky/voyage";
import InstallPrompt from "@/components/InstallPrompt";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { ownsExperienceStage } from "@/lib/experience-shell";

// Night-room chrome is split out of the shared bundle: only /cosmos, /oracle,
// /portrait and /synastry download the smooth scroll, the two WebGL grounds,
// the audio parlor and the Sky Atlas.
const EphemerisScroll = dynamic(() => import("@/components/EphemerisScroll"), { ssr: false });
const LiquidNight = dynamic(() => import("@/components/arrival/LiquidNight"), { ssr: false });
const SkyVoyageCanvas = dynamic(() => import("@/components/sky/SkyVoyageCanvas"), { ssr: false });
const ParlorLayer = dynamic(() => import("@/components/ParlorLayer"), { ssr: false });
const SkyAtlas = dynamic(() => import("@/components/sky/SkyAtlas"), { ssr: false });
const SkyAtlasButton = dynamic(() => import("@/components/sky/SkyAtlas").then((m) => m.SkyAtlasButton), { ssr: false });

/** Carta Incognita scribe — every page travelled inks its berth. */
function ChartScribe() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) markCharted(pathname);
  }, [pathname]);
  return null;
}

const NIGHT_ROOMS = ["/cosmos", "/oracle", "/portrait", "/synastry"];
function isNightRoom(pathname: string | null) {
  return !!pathname && NIGHT_ROOMS.some(room => pathname === room || pathname.startsWith(room + "/"));
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
  // The sky chrome (smooth scroll, two WebGL grounds, audio parlor, Sky Atlas)
  // belongs to the earlier night rooms. Almanac and legal pages paint an
  // opaque lapis page over it, so elsewhere it only cost battery and put the
  // "Sky Atlas" control on top of the text.
  const nightRoom = !ownsStage && isNightRoom(pathname);
  // Tier 2 gate — basic client-only render
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      {/* EPHEMERIS — one Lenis, one rAF, one velocity for the sky. */}
      {nightRoom && <EphemerisScroll />}

      {/* LIQUID NIGHT — the living silk-water ground, deepest layer. */}
      {nightRoom && <LiquidNight />}

      {/* CARTA COELI — the one sky under the night rooms. Fixed canvas
          at z-index 0 (after the liquid in DOM order): above the ground,
          below every page. */}
      {nightRoom && <SkyVoyageCanvas />}

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

      {/* PARLOR LAYER — the ritual's ambient hands (oa-ritual bus). */}
      {nightRoom && <ParlorLayer />}

      {/* PWA — registers the service worker on mount; renders nothing
          until the browser fires beforeinstallprompt (then a bottom
          banner, 12s delayed, dismissal remembered 7 days). */}
      {!ownsStage && <InstallPrompt />}

      {/* The Atlas: the engraved chart of the night rooms, and its opener. */}
      {nightRoom && <ChartScribe />}
      {nightRoom && <StudiesGate>
        <SkyAtlas />
        <SkyAtlasButton />
      </StudiesGate>}
    </>
  );
}
