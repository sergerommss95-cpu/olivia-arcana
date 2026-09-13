"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import TransitionOverlay, { type WipeVariant } from "./TransitionOverlay";

interface Props {
  children: React.ReactNode;
}

const NIGHT_ROOMS = ["/oracle", "/portrait", "/synastry", "/cosmos"];

function isNight(path: string): boolean {
  const normalized = path.length > 1 ? path.replace(/\/$/, "") : path;
  return NIGHT_ROOMS.includes(normalized) || normalized.startsWith("/prototype/");
}

export default function PageTransition({ children }: Props) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [variant, setVariant] = useState<WipeVariant>("paper");
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animationKey, setAnimationKey] = useState(pathname);
  const [reduce, setReduce] = useState(false);
  const safetyRef = useRef<number | null>(null);

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

      // Reduced motion: no sheet at all — go straight there.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      setOverlayVisible(true);

      // Push the moment the sheet has covered the view (wipe is 550ms).
      window.setTimeout(() => router.push(href), 560);

      // Safety net for a slow chunk — cleared the instant we arrive, and
      // it tells the page its choreography was interrupted so pieces
      // like SpreadTheater can re-arm instead of freezing mid-dive.
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
      safetyRef.current = window.setTimeout(() => {
        setOverlayVisible(false);
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
  }, [pathname, children]);

  return (
    <>
      <TransitionOverlay isVisible={overlayVisible} variant={variant} />
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduce ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
            // keyed to the sheet's retreat (~40% through) so the rise is
            // actually seen instead of playing under an opaque sheet
            delay: reduce ? 0 : 0.22,
          }}
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
