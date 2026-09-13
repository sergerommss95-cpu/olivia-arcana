"use client";

/**
 * MagnetRig — the nib drawn to the seal.
 *
 * Primary actions (ink pills, the masthead cta, night buttons) attract
 * the cursor within a small field: the element leans toward the hand,
 * settles back when it leaves. One delegated rAF rig, rects cached and
 * refreshed cheaply. Fine pointers only; still under reduced motion.
 */

import { useEffect } from "react";

const SELECTOR = ".btn-ink, .masthead-cta, .night-btn, .svcp-btn";
const SKIP = ":disabled, [aria-disabled=\"true\"]";
const RADIUS = 110;
const PULL = 0.3;
const MAX = 9;

export default function MagnetRig() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    type M = { el: HTMLElement; cx: number; cy: number; x: number; y: number; tx: number; ty: number };
    let mags: M[] = [];
    let mx = -1e4;
    let my = -1e4;
    let raf = 0;
    let collectT = 0;
    let dirty = true;
    const markDirty = () => { dirty = true; };

    const collect = () => {
      const seen = new Set(mags.map((m) => m.el));
      const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => {
        // a dead control must not perform the come-hither lean
        if (el.matches(SKIP)) {
          el.style.transform = "";
          return false;
        }
        return true;
      });
      mags = els.map((el) => {
        el.dataset.magnet = "1";
        const r = el.getBoundingClientRect();
        const prev = seen.has(el) ? mags.find((m) => m.el === el) : undefined;
        return {
          el,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          x: prev?.x ?? 0,
          y: prev?.y ?? 0,
          tx: 0,
          ty: 0,
        };
      });
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      // Rects drift with scroll/resize — refreshed by event (below), with
      // a slow clock only as a backstop for layout the events miss.
      if (dirty || performance.now() > collectT) {
        dirty = false;
        collectT = performance.now() + 1000;
        collect();
      }
      for (const m of mags) {
        const dx = mx - m.cx;
        const dy = my - m.cy;
        const d = Math.hypot(dx, dy);
        if (d < RADIUS) {
          const f = 1 - d / RADIUS;
          m.tx = Math.max(-MAX, Math.min(MAX, dx * PULL * f));
          m.ty = Math.max(-MAX, Math.min(MAX, dy * PULL * f));
        } else {
          m.tx = 0;
          m.ty = 0;
        }
        m.x += (m.tx - m.x) * 0.14;
        m.y += (m.ty - m.y) * 0.14;
        if (Math.abs(m.x) > 0.05 || Math.abs(m.y) > 0.05) {
          m.el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px)`;
        } else if (m.el.style.transform) {
          m.el.style.transform = "";
        }
      }
    };

    const onGone = () => {
      mx = -1e4;
      my = -1e4;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty, { passive: true });
    document.documentElement.addEventListener("pointerleave", onGone);
    window.addEventListener("blur", onGone);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
      document.documentElement.removeEventListener("pointerleave", onGone);
      window.removeEventListener("blur", onGone);
      mags.forEach((m) => {
        m.el.style.transform = "";
      });
    };
  }, []);

  return null;
}
