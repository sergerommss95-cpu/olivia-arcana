"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * One block's entry, once. 'rest' is the finished state and the default CSS, so prerender, JS-off, reduced
 * motion, hidden tabs, browsers without IntersectionObserver and anything already on (or above) the screen
 * simply show the page. Entry styles apply only under 'armed', which happens while the block waits below the
 * fold; 'play' follows when it is seen. It never returns to 'armed'.
 */
export type EntryState = "rest" | "armed" | "play";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Arm only when motion may run and the block is wholly below the viewport, so nothing visible can vanish. */
export function entryAtArm(env: { observer: boolean; reduced: boolean; hidden: boolean; top: number; viewport: number }): "rest" | "armed" {
  return env.observer && !env.reduced && !env.hidden && env.top >= env.viewport ? "armed" : "rest";
}

/**
 * Observer thresholds. A block taller than viewport ÷ threshold can never show that share of itself, so its
 * last threshold is the ratio at which it fills that share of the viewport instead.
 */
export function entryThresholds(threshold: number, height: number, viewport: number): number[] {
  const reach = height * threshold > viewport ? (threshold * viewport) / height : threshold;
  return reach > 0 ? [0, reach / 2, reach] : [0];
}

/** Seen: `threshold` of the block is visible, or the block fills that share of the viewport. */
export function entrySeen(seen: { intersecting: boolean; ratio: number; visible: number; viewport: number }, threshold: number): boolean {
  // Observer ratios land a hair under the threshold they fired for; tolerate rounding, not a real shortfall.
  return seen.intersecting && (seen.ratio >= threshold - 0.005 || seen.visible >= threshold * seen.viewport - 1);
}

export function useEntry(ref: RefObject<Element | null>, threshold = 0.35): EntryState {
  const [state, setState] = useState<EntryState>("rest");
  // Survives effect re-runs (StrictMode, a new threshold): a decided block is never re-armed, and an armed
  // one keeps waiting to play rather than being stranded invisible.
  const phase = useRef<"new" | "armed" | "done">("new");

  useEffect(() => {
    const el = ref.current;
    if (!el || phase.current === "done") return;
    const viewport = window.innerHeight;
    const box = el.getBoundingClientRect();
    if (phase.current === "new" && entryAtArm({
      observer: typeof IntersectionObserver === "function",
      reduced: prefersReducedMotion(),
      hidden: document.hidden,
      top: box.top,
      viewport,
    }) === "rest") {
      phase.current = "done";
      return;
    }

    // The first report confirms, after layout, that the block is still below the fold and only then arms
    // it: state changes in the observer callback, never synchronously in this effect.
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      const view = entry.rootBounds?.height ?? window.innerHeight;
      if (phase.current === "new") {
        if (entry.boundingClientRect.top < view) {
          phase.current = "done";
          observer.disconnect();
        } else {
          phase.current = "armed";
          setState("armed");
        }
        return;
      }
      if (entrySeen({ intersecting: entry.isIntersecting, ratio: entry.intersectionRatio, visible: entry.intersectionRect.height, viewport: view }, threshold)) {
        phase.current = "done";
        observer.disconnect();
        setState("play");
      }
    }, { threshold: entryThresholds(threshold, box.height, viewport) });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return state;
}
