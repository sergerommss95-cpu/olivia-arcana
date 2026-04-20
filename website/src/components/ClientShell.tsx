/**
 * ClientShell.tsx — Single client boundary for all global overlays
 *
 * Wraps all global client-side components in one "use client" boundary.
 * This prevents the Next.js 16 webpack dev mode bug where multiple
 * client component imports in a Server Component cause errors.
 *
 * Three tiers of mounting:
 *   1. Eagerly imported + mounted on first render  — everything visual,
 *      structural, or that the user actively interacts with before
 *      scrolling (background, cursor, indicators, smooth scroll, etc.)
 *   2. Eagerly imported, mounted on client after useEffect fires
 *      (same as before — gated by `mounted` flag)
 *   3. Dynamic-imported and only mounted after first real user intent
 *      (scroll or keydown). This covers ambient audio, astronomical
 *      overlays, and the Cmd+K palette — none of which matter until the
 *      user engages. Cuts initial JS by ~several hundred KB.
 */

"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import GlobalBackground from "@/components/GlobalBackground";
import CosmicCursor from "@/components/CosmicCursor";
import SoundEngine from "@/components/SoundEngine";
import CosmicIndicators from "@/components/CosmicIndicators";
import CosmicToast from "@/components/CosmicToast";
import InstallPrompt from "@/components/InstallPrompt";
import SmoothScroll from "@/components/SmoothScroll";
import FilmGrain from "@/components/FilmGrain";
import PageTransition from "@/components/transitions/PageTransition";
import TimeOfDayTheme from "@/components/TimeOfDayTheme";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SubscriptionProvider } from "@/hooks/useSubscription";

/* ── Deferred trio — don't matter until first user intent ─────────────── */
const AmbientSoundLazy = dynamic(() => import("@/components/AmbientSound"), {
  ssr: false,
  loading: () => null,
});
const EclipseOverlayLazy = dynamic(() => import("@/components/EclipseOverlay"), {
  ssr: false,
  loading: () => null,
});
const CommandPaletteLazy = dynamic(() => import("@/components/CommandPalette"), {
  ssr: false,
  loading: () => null,
});

export default function ClientShell({ children }: { children: React.ReactNode }) {
  // Tier 2 gate — basic client-only render
  const [mounted, setMounted] = useState(false);
  // Tier 3 gate — user has shown intent (scrolled or pressed a key)
  const [engaged, setEngaged] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Gate heavy-ish / non-visual overlays behind the first scroll or keydown
    // so a user who bounces on the hero never pays their JS cost.
    const activate = () => setEngaged(true);
    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("scroll", activate, opts);
    window.addEventListener("keydown", activate, { once: true });
    window.addEventListener("pointerdown", activate, opts);
    // Safety net: if the user is still on the page after ~4s, load anyway so
    // Cmd+K isn't silent for patient readers who haven't scrolled yet.
    const fallback = window.setTimeout(activate, 4000);
    return () => {
      window.removeEventListener("scroll", activate);
      window.removeEventListener("keydown", activate);
      window.removeEventListener("pointerdown", activate);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <>
      {mounted && (
        <>
          {/* Layer 0 — The Void (persistent WebGL) */}
          <GlobalBackground />

          {/* Layer 3 — Custom Cursor (desktop only) */}
          <CosmicCursor />

          {/* Layer 4 — Sound routing (event bus; lightweight) */}
          <SoundEngine />

          {/* Live indicators — Moon Phase + Planetary Hour */}
          <CosmicIndicators />

          {/* Daily cosmic toast notification */}
          <CosmicToast />

          {/* PWA install prompt */}
          <InstallPrompt />

          {/* Smooth scroll (Lenis) */}
          <SmoothScroll />

          {/* Film grain + vignette (analog texture) */}
          <FilmGrain opacity={0.03} vignetteIntensity={0.35} />

          {/* Time-of-day palette shift (dawn/day/dusk/night) */}
          <TimeOfDayTheme />

          {/* Mobile-only bottom navigation (thumb-reach) */}
          <MobileBottomNav />

          {/* Deferred tier — only mounts once the user engages */}
          {engaged && (
            <>
              <AmbientSoundLazy />
              <EclipseOverlayLazy />
              <CommandPaletteLazy />
            </>
          )}
        </>
      )}

      {/* Subscription context — provides useSubscription() to all components */}
      <SubscriptionProvider>
        {/* Page content — always rendered (with transition choreography once mounted) */}
        {mounted ? (
          <PageTransition>{children}</PageTransition>
        ) : (
          <>{children}</>
        )}
      </SubscriptionProvider>
    </>
  );
}
