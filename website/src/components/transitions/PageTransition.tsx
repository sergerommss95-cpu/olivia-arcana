"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import TransitionOverlay from "./TransitionOverlay";

/** A brief turn of the leaf. Routing starts on press; content never waits for motion. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [turning, setTurning] = useState(false);
  const routeRef = useRef(pathname);
  const cleanupRef = useRef<(() => void) | null>(null);
  const safetyRef = useRef<number | undefined>(undefined);
  const focusOnArrival = useRef(false);

  useEffect(() => {
    const handleTransition = (event: Event) => {
      const href = (event as CustomEvent<{ href?: string }>).detail?.href;
      if (!href) return;
      let destination: URL;
      try { destination = new URL(href, window.location.href); } catch { return; }
      if (destination.origin !== window.location.origin) return;
      const normalize = (path: string) => path.replace(/\/+$/, "") || "/";
      if (normalize(destination.pathname) === normalize(window.location.pathname)) {
        router.push(href);
        return;
      }
      cleanupRef.current?.();
      focusOnArrival.current = true;
      setPending(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTurning(!reduced);
      // The decorative veil has a bounded lifetime even if a chunk is slow.
      const reveal = window.setTimeout(() => setTurning(false), 240);
      const safety = window.setTimeout(() => {
        setPending(false);
        setTurning(false);
        window.dispatchEvent(new CustomEvent("page:transition-abort"));
      }, 5000);
      safetyRef.current = safety;
      cleanupRef.current = () => { window.clearTimeout(reveal); window.clearTimeout(safety); };
      router.push(href);
    };
    window.addEventListener("page:transition", handleTransition);
    return () => {
      window.removeEventListener("page:transition", handleTransition);
      cleanupRef.current?.();
    };
  }, [router]);

  useEffect(() => {
    if (routeRef.current === pathname) return;
    routeRef.current = pathname;
    window.clearTimeout(safetyRef.current);
    // Preserve Next's page tree and scroll handling. No transformed ancestor
    // around fixed tarot tables, no cached children, no hydration remount.
    const shouldFocus = focusOnArrival.current;
    focusOnArrival.current = false;
    const frame = requestAnimationFrame(() => {
      setPending(false);
      if (!shouldFocus) return;
      const target = document.querySelector<HTMLElement>("main h1, #main-content h1, h1, main, #main-content");
      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <TransitionOverlay isVisible={turning} variant="to-night" />
      <div aria-busy={pending || undefined}>{children}</div>
      <span className="oa-navigation-progress" data-pending={pending} aria-hidden />
      <style jsx global>{`
        /* ── press acknowledgment: a gilt ink dot lands under the
              pressed link in the beat before anything else moves ── */
        .oa-press-ink {
          position: absolute;
          left: 50%;
          bottom: -0.34em;
          width: 4px;
          height: 4px;
          margin-left: -2px;
          border-radius: 50%;
          background: #e0b768;
          pointer-events: none;
          opacity: 0;
          animation: oa-press-ink 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes oa-press-ink {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          25% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.8);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .oa-press-ink {
            display: none;
          }
        }

        /* ── colophon mends ──
           "founded under a lunar eclipse · the press keeps sidereal
           hours" must break as balanced verse, never orphan its last
           two words; the twelve zodiac glyphs stay one unbroken row
           at every width. */
        footer.colophon .colophon-end p {
          text-wrap: balance;
        }
        .almanac footer.colophon .colophon-zodiac {
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        @media (max-width: 560px) {
          .almanac footer.colophon .colophon-zodiac {
            gap: 0.45rem;
            font-size: 0.82rem;
          }
        }
        @media (max-width: 390px) {
          .almanac footer.colophon .colophon-zodiac {
            gap: 0.34rem;
            font-size: 0.78rem;
          }
        }
      `}</style>
      <style jsx>{`
        .oa-navigation-progress { position: fixed; z-index: 9991; left: 0; top: 0; width: 100%; height: 2px; background: #e0b768; transform: scaleX(0); transform-origin: left; opacity: 0; transition: transform 240ms ease-out, opacity 160ms; pointer-events: none; }
        .oa-navigation-progress[data-pending="true"] { opacity: 1; transform: scaleX(.72); }
        @media (prefers-reduced-motion: reduce) { .oa-navigation-progress { transition: none; } }
      `}</style>
    </>
  );
}
