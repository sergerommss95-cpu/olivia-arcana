"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isVisible: boolean;
}

/**
 * Cosmic wipe overlay for page transitions.
 *
 * A gradient curtain sweeps from right to left (exit),
 * then from left to right (enter). The gradient uses
 * the site's nebula palette for continuity.
 */
export default function TransitionOverlay({ isVisible }: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9990,
            pointerEvents: "none",
            background: `linear-gradient(
              135deg,
              rgba(4,2,13,0.98) 0%,
              rgba(18,12,40,0.95) 40%,
              rgba(4,2,13,0.98) 100%
            )`,
          }}
          initial={{ clipPath: "inset(0 0 0 100%)" }}
          animate={{ clipPath: "inset(0 0 0 0%)" }}
          exit={{ clipPath: "inset(0 100% 0 0)" }}
          transition={{
            duration: 0.6,
            ease: [0.76, 0, 0.24, 1],
          }}
        >
          {/* Subtle stars/dots during wipe */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.3,
              background: `
                radial-gradient(1px 1px at 20% 30%, rgba(200,180,255,0.6), transparent),
                radial-gradient(1px 1px at 50% 70%, rgba(212,175,55,0.4), transparent),
                radial-gradient(1px 1px at 80% 20%, rgba(200,180,255,0.5), transparent),
                radial-gradient(1px 1px at 30% 80%, rgba(212,175,55,0.3), transparent),
                radial-gradient(1px 1px at 70% 50%, rgba(200,180,255,0.4), transparent)
              `,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
