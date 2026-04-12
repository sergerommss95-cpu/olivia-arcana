/**
 * ClientShell.tsx — Single client boundary for all global overlays
 *
 * Wraps all global client-side components in one "use client" boundary.
 * This prevents the Next.js 16 webpack dev mode bug where multiple
 * client component imports in a Server Component cause errors.
 *
 * Only GlobalBackground uses dynamic(ssr:false) since it needs WebGL.
 * Everything else uses regular imports since this file IS the client boundary.
 */

"use client";

import React, { useEffect, useState } from "react";
import GlobalBackground from "@/components/GlobalBackground";
import EclipseOverlay from "@/components/EclipseOverlay";
import CosmicCursor from "@/components/CosmicCursor";
import SoundEngine from "@/components/SoundEngine";
import AmbientSound from "@/components/AmbientSound";
import CosmicIndicators from "@/components/CosmicIndicators";
import CosmicToast from "@/components/CosmicToast";
import InstallPrompt from "@/components/InstallPrompt";
import SmoothScroll from "@/components/SmoothScroll";
import FilmGrain from "@/components/FilmGrain";
import PageTransition from "@/components/transitions/PageTransition";
import { SubscriptionProvider } from "@/hooks/useSubscription";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  // Ensure we only render browser-dependent overlays on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {mounted && (
        <>
          {/* Layer 0 — The Void (persistent WebGL) */}
          <GlobalBackground />

          {/* Eclipse/astronomical event visual overlay */}
          <EclipseOverlay />

          {/* Layer 3 — Custom Cursor (desktop only) */}
          <CosmicCursor />

          {/* Layer 4 — Sound systems */}
          <SoundEngine />
          <AmbientSound />

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
