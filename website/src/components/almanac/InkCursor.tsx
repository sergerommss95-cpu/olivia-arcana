"use client";

/**
 * InkCursor — the almanac's cursor identity on light pages.
 *
 * A small ink dot rides the pointer; a hairline ring follows with a
 * fountain-pen lag. Over anything interactive the ring inks oxblood and
 * tightens — the nib touching paper. Desktop fine-pointers only; gone
 * entirely under reduced motion. The native cursor stays visible (we
 * decorate, we don't replace — usability first).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function InkCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  // Portaled to <body>: ancestors may carry transforms during page
  // transitions, which would re-anchor position:fixed to the page.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHost(document.body));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let visible = false;
    let overInk = false;

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${overInk ? 0.62 : 1})`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      const target = e.target as HTMLElement | null;
      overInk = Boolean(target?.closest("a, button, summary, [role='radio'], input, select, textarea, [role='button']"));
      // Difference blend hue-flips colors, so the hover cue is weight,
      // not hue: the ring brightens and tightens over anything live.
      ring.style.borderColor = overInk ? "rgba(216, 210, 196, 0.95)" : "rgba(216, 210, 196, 0.5)";
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
    // Re-run once the portal host exists — before that the refs are null.
  }, [host]);

  if (!host) return null;
  return createPortal(
    <>
      <div ref={dotRef} className="ink-dot" aria-hidden />
      <div ref={ringRef} className="ink-ring" aria-hidden />

      <style jsx>{`
        .ink-dot,
        .ink-ring {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9980;
          pointer-events: none;
          opacity: 0;
          will-change: transform;
        }

        /* Difference blend: dark ink on the paper pages, bone over the
           hero's night plate — one cursor, both registers. */
        .ink-dot {
          width: 5px;
          height: 5px;
          margin: -2.5px 0 0 -2.5px;
          border-radius: 50%;
          background: #d8d2c4;
          mix-blend-mode: difference;
          transition: opacity 300ms ease;
        }

        .ink-ring {
          width: 30px;
          height: 30px;
          margin: -15px 0 0 -15px;
          border-radius: 50%;
          border: 1px solid rgba(216, 210, 196, 0.5);
          mix-blend-mode: difference;
          transition: opacity 300ms ease, border-color 250ms ease;
        }

        @media (hover: none), (pointer: coarse) {
          .ink-dot,
          .ink-ring {
            display: none;
          }
        }
      `}</style>
    </>,
    host,
  );
}
