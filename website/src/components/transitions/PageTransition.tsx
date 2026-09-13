"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import TransitionOverlay, { type WipeVariant } from "./TransitionOverlay";

interface Props {
  children: React.ReactNode;
}

const NIGHT_ROOMS = ["/oracle", "/portrait", "/synastry", "/cosmos"];
const EASE = [0.16, 1, 0.3, 1] as const;

function isNight(path: string): boolean {
  const normalized = path.length > 1 ? path.replace(/\/$/, "") : path;
  return NIGHT_ROOMS.includes(normalized) || normalized.startsWith("/prototype/");
}

/**
 * The page turn as ONE act:
 *   0ms    reader clicks — the leaving page exhales (fade + 10px sink,
 *          300ms) while the night veil starts across and the sky flight
 *          (FLIGHT_MS 950) is already under way beneath both.
 *   ~560ms the veil has covered the view — route swaps under it.
 *   arrive veil retreats (550ms); the new page inhales (fade + rise)
 *          ~220ms into the retreat, so the rise is seen, and settles at
 *          ~1.3s — just as the sky flight's own settle finishes inking
 *          the berth figure. One breath out, one breath in.
 */
export default function PageTransition({ children }: Props) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [variant, setVariant] = useState<WipeVariant>("paper");
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animationKey, setAnimationKey] = useState(pathname);
  const [leaving, setLeaving] = useState(false);
  const [inhaleDelay, setInhaleDelay] = useState(0);
  const [reduce, setReduce] = useState(false);
  const safetyRef = useRef<number | null>(null);
  // Arrivals that came through the veil inhale on the veil's clock;
  // back-button / hard arrivals inhale immediately (no blank beat).
  const veilRef = useRef(false);
  // The very first paint after mount must not re-fade content the
  // reader is already looking at (ClientShell renders it un-wrapped
  // for one frame before this component takes over).
  const firstKeyRef = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Listen for transition events from TransitionLink
  useEffect(() => {
    const handleTransition = (e: Event) => {
      const href = (e as CustomEvent).detail?.href;
      if (!href) return;

      // The wipe speaks the book's grammar: paper leaf between light
      // pages, ink sheet when entering a night room, paper returning
      // when leaving one.
      const from = isNight(pathname);
      const to = isNight(href);
      setVariant(to ? "to-night" : from ? "to-paper" : "paper");

      // Reduced motion: no sheet, no exhale — go straight there.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      // One act begins: the leaving page exhales under the crossing veil.
      setOverlayVisible(true);
      setLeaving(true);
      veilRef.current = true;

      // Push the moment the sheet has covered the view (wipe is 550ms).
      window.setTimeout(() => router.push(href), 560);

      // Safety net for a slow chunk — cleared the instant we arrive, and
      // it tells the page its choreography was interrupted so pieces
      // like SpreadTheater can re-arm instead of freezing mid-dive.
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
      safetyRef.current = window.setTimeout(() => {
        setOverlayVisible(false);
        setLeaving(false);
        veilRef.current = false;
        window.dispatchEvent(new CustomEvent("page:transition-abort"));
      }, 4000);
    };

    window.addEventListener("page:transition", handleTransition);
    return () => window.removeEventListener("page:transition", handleTransition);
  }, [router, pathname]);

  // Arrived: swap content immediately and let the sheet retreat over it.
  useEffect(() => {
    if (safetyRef.current) {
      window.clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setDisplayChildren(children);
    setAnimationKey(pathname);
    setOverlayVisible(false);
    setLeaving(false);
    // The inhale of THIS arrival: keyed to the veil's retreat when there
    // was a veil, immediate otherwise. Consumed once.
    setInhaleDelay(veilRef.current ? 0.22 : 0);
    veilRef.current = false;
  }, [pathname, children]);

  // The first mounted key shows content that is already on screen.
  const firstKey = firstKeyRef.current;
  useEffect(() => {
    firstKeyRef.current = false;
  }, []);

  return (
    <>
      <TransitionOverlay isVisible={overlayVisible} variant={variant} />
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          initial={reduce || firstKey ? false : { opacity: 0, y: 12 }}
          animate={
            leaving && !reduce
              ? { opacity: 0, y: 10 } // the exhale: fade + sink
              : { opacity: 1, y: 0 } //  the inhale: fade + rise
          }
          transition={
            leaving
              ? // the exhale waits one beat so the press's gilt ink dot
                // is seen landing before anything moves
                { duration: 0.3, ease: EASE, delay: 0.14 }
              : {
                  duration: reduce ? 0 : 0.55,
                  ease: EASE,
                  // keyed to the sheet's retreat (~40% through) so the
                  // rise is seen instead of playing under an opaque sheet
                  delay: reduce ? 0 : inhaleDelay,
                }
          }
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>

      {/* House motion vocabulary that must exist on every page:
          the TransitionLink press acknowledgment, and two colophon
          typography mends (the homepage colophon is print — its lines
          must break as verse, not leave orphans). */}
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
    </>
  );
}
