"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Returns a ref to attach to any element and a `progress` value (0→1)
 * tracking how far the element has scrolled through the viewport.
 *
 * 0 = element's top edge is at viewport bottom
 * 1 = element's bottom edge is at viewport top
 *
 * Uses IntersectionObserver for activation + RAF scroll listener
 * for smooth per-frame updates. Self-cleans when element leaves.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  offsetTop = "0px",
  offsetBottom = "0px"
) {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const isVisible = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = setTimeout(() => setProgress(1), 0);
      return () => clearTimeout(timer);
    }

    const update = () => {
      if (!isVisible.current || !el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    let rafId: number;
    const loop = () => {
      update();
      if (isVisible.current) rafId = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          update();
          rafId = requestAnimationFrame(loop);
        }
      },
      { rootMargin: `${offsetTop} 0px ${offsetBottom} 0px`, threshold: 0 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [offsetTop, offsetBottom]);

  return { ref, progress };
}
