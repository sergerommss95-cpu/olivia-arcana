"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type WipeVariant = "paper" | "to-night" | "to-paper";

interface Props {
  isVisible: boolean;
  /** Kept for callers; every page now crosses the same lapis. */
  variant?: WipeVariant;
}

/**
 * Between inner pages the view settles into lapis and the next page fades up
 * out of it: opacity only, in the site's ground colour (BRAND.md, Motion).
 * It replaces an earlier sweeping violet sheet, which read as a blue flash
 * and could hang over a slow page.
 */
export default function TransitionOverlay({ isVisible }: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          aria-hidden
          style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none", background: "#0b192a" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } }}
        />
      )}
    </AnimatePresence>
  );
}
