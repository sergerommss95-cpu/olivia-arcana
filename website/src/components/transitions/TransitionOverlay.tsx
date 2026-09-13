"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type WipeVariant = "paper" | "to-night" | "to-paper";

interface Props {
  isVisible: boolean;
  variant?: WipeVariant;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Page-turn overlay in the almanac's grammar.
 *
 * "paper"    — a bone sheet sweeps across with a shadowed leading edge:
 *              turning a leaf of the book. Used between light pages.
 * "to-night" — the sheet is ink: the book closing as the reader enters
 *              a night room (oracle, chart, synastry, cosmos).
 * "to-paper" — leaving a night room: the paper returns.
 */
export default function TransitionOverlay({ isVisible, variant = "paper" }: Props) {
  const isInk = variant === "to-night";
  const sheet = isInk ? "#10134d" : "#181d7a";
  const edge = isInk ? "rgba(232, 233, 255, 0.22)" : "rgba(232, 233, 255, 0.18)";

  // The letterpress slips out of register while the leaf turns: display
  // type across the site briefly shows its second (oxblood) pull, then
  // registers back. Driven by a root class so every page inherits it.
  const [prefersReduced, setPrefersReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("is-turning", isVisible);
    return () => document.documentElement.classList.remove("is-turning");
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9990,
            pointerEvents: "none",
            background: sheet,
          }}
          initial={prefersReduced ? { opacity: 0 } : { x: "100%" }}
          animate={prefersReduced ? { opacity: 1 } : { x: "0%" }}
          exit={prefersReduced ? { opacity: 0 } : { x: "-100%" }}
          transition={{
            duration: prefersReduced ? 0.18 : 0.55,
            ease: [0.76, 0, 0.24, 1],
          }}
        >
          {/* Paper grain on the passing sheet */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: isInk ? 0.08 : 0.07,
              mixBlendMode: "screen",
              backgroundImage: GRAIN,
            }}
          />
          {/* The meniscus: the sheet's leading edge bulges like poured
              ink crossing the page — surface tension, then it settles. */}
          <motion.svg
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "-7vw",
              width: "7vw",
              height: "100%",
              fill: sheet,
            }}
            initial={{ scaleX: 1.5 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0.6 }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          >
              <path d="M 100 0 Q -70 500 100 1000 Z" />
            <path d="M 100 0 Q -54 500 100 1000 Z" fill="none" stroke="rgba(10, 13, 56, 0.6)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </motion.svg>

          {/* The leading page-edge: a hairline plus a soft fold shadow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "2.5rem",
              background: `linear-gradient(90deg, ${edge}, transparent)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 1,
              background: edge,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
