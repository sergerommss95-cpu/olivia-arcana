"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import TransitionOverlay from "./TransitionOverlay";

interface Props {
  children: React.ReactNode;
}

/**
 * Page transition orchestrator.
 *
 * Lifecycle:
 * 1. TransitionLink dispatches 'page:transition' event
 * 2. PageTransition shows overlay (wipe in: 600ms)
 * 3. At midpoint, navigates to new URL
 * 4. New page mounts — overlay wipes out (600ms)
 * 5. Page content fades in (400ms)
 */
export default function PageTransition({ children }: Props) {
  const pathname = usePathname() ?? "/";
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animationKey, setAnimationKey] = useState(pathname);

  // Listen for transition events from TransitionLink
  useEffect(() => {
    const handleTransition = (e: Event) => {
      const href = (e as CustomEvent).detail?.href;
      if (!href) return;

      // Phase 1: Show overlay
      setOverlayVisible(true);

      // Phase 2: Navigate after overlay covers screen
      setTimeout(() => {
        window.location.href = href;
      }, 600); // Match overlay animation duration
    };

    window.addEventListener("page:transition", handleTransition);
    return () => window.removeEventListener("page:transition", handleTransition);
  }, []);

  // When pathname changes (new page loaded), animate in
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setAnimationKey(pathname);
      setOverlayVisible(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <>
      <TransitionOverlay isVisible={overlayVisible} />
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1,
          }}
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
