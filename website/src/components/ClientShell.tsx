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
import PageTransition from "@/components/transitions/PageTransition";
import SkyVoyageCanvas from "@/components/sky/SkyVoyageCanvas";
import LiquidNight from "@/components/arrival/LiquidNight";
import SkyAtlas, { SkyAtlasButton } from "@/components/sky/SkyAtlas";
import { markCharted } from "@/components/sky/voyage";
import { SubscriptionProvider } from "@/hooks/useSubscription";

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
      {/* LIQUID NIGHT — the living silk-water ground, deepest layer. */}
      <LiquidNight />

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

      {/* The Atlas: the engraved chart of the edition, and its opener. */}
      <ChartScribe />
      <SkyAtlas />
      <SkyAtlasButton />
    </>
  );
}
