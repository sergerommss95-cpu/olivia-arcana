/** Shared service context, direct navigation and optional tools. */

"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";
import PageTransition from "@/components/transitions/PageTransition";
import ParlorLayer from "@/components/ParlorLayer";
import SkyAtlasAccess from "@/components/sky/SkyAtlasAccess";
import { markCharted } from "@/components/sky/voyage";
import { SubscriptionProvider } from "@/hooks/useSubscription";

declare global {
  interface Window {
    /** The one smooth-scroll instance — other code may scrollTo through it. */
    __lenis?: Lenis;
  }
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
      {/* Subscription context — provides useSubscription() to all components */}
      <SubscriptionProvider>
        {/* Pages own their artwork; the shared ground stays still. */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <PageTransition>{children}</PageTransition>
        </div>
      </SubscriptionProvider>

      {/* One optional sound and ambient interaction controller. */}
      <ParlorLayer />

      {/* The Atlas: the engraved chart of the edition, and its opener. */}
      <ChartScribe />
      <SkyAtlasAccess />
    </>
  );
}
