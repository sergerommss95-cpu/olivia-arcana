"use client";

/**
 * CardInspector — the plate under glass.
 *
 * A drawn card is a carved panel: it deserves to be looked AT, not just
 * looked past. This lifts one card onto its own dark table where the
 * reader can zoom (wheel, pinch, double-tap, +/−), drag the plate around
 * under the loupe, and read the carving — the Milky Way vein, the gilt
 * inlay, the chisel texture — at full resolution.
 *
 * Gestures: wheel/trackpad zoom at the cursor, drag to pan, pinch on
 * touch, double-click/tap to toggle 1× ↔ 2.4×, Escape to close,
 * arrow keys to step between the cards of the spread.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardPortalImagePath } from "@/lib/academy/card-images";
import { ukCard } from "@/lib/academy/tarot-cards-uk";
import { createGyroscope } from "@/lib/gyroscope";

const CSS = `
            .ci-scrim {
              position: fixed;
              inset: 0;
              z-index: 9995;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: clamp(0.6rem, 2vw, 1.1rem);
              padding: clamp(0.9rem, 3vw, 2rem);
              perspective: 1150px;
              background:
                radial-gradient(60rem 40rem at 50% 40%, rgba(24, 29, 122, 0.55), transparent 70%),
                rgba(10, 13, 56, 0.94);
            }

            .ci-tilt {
              will-change: transform;
              transform-style: preserve-3d;
            }

            .ci-glare {
              position: absolute;
              inset: -25%;
              z-index: 3;
              pointer-events: none;
              mix-blend-mode: screen;
              opacity: 0;
              will-change: transform, opacity;
              background: radial-gradient(
                40% 32% at 50% 45%,
                rgba(232, 233, 255, 0.22),
                rgba(232, 233, 255, 0.06) 45%,
                transparent 72%
              );
            }

            .ci-bar {
              width: min(72rem, 100%);
              display: flex;
              align-items: baseline;
              justify-content: space-between;
              gap: 1rem;
              flex-wrap: wrap;
            }

            .ci-title {
              margin: 0;
              font-family: var(--font-heading, "Cormorant Garamond"), serif;
              font-size: clamp(1.25rem, 3vw, 1.9rem);
              color: #e8e9ff;
            }

            .ci-pos {
              display: block;
              font-family: var(--font-mono, ui-monospace), monospace;
              font-size: 0.6rem;
              letter-spacing: 0.3em;
              text-transform: uppercase;
              color: #b7bce9;
              margin-bottom: 0.2rem;
            }

            .ci-rev {
              font-size: 0.75em;
              font-style: italic;
              color: rgba(232, 233, 255, 0.62);
            }

            .ci-tools {
              display: flex;
              align-items: center;
              gap: 0.45rem;
              font-family: var(--font-mono, ui-monospace), monospace;
            }

            .ci-tools button {
              min-width: 2.5rem;
              min-height: 2.5rem;
              padding: 0 0.7rem;
              background: transparent;
              border: 1px solid rgba(232, 233, 255, 0.24);
              border-radius: 2px;
              color: rgba(232, 233, 255, 0.86);
              font-family: inherit;
              font-size: 0.72rem;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              cursor: pointer;
              transition: border-color 300ms cubic-bezier(0.16, 1, 0.3, 1), color 300ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms cubic-bezier(0.16, 1, 0.3, 1);
            }

            .ci-tools button:hover,
            .ci-tools button:focus-visible {
              border-color: #e0b768;
              color: #e8e9ff;
              background: rgba(224, 183, 104, 0.12);
            }

            .ci-zoom {
              min-width: 3.4rem;
              text-align: center;
              font-size: 0.66rem;
              letter-spacing: 0.16em;
              color: rgba(232, 233, 255, 0.62);
            }

            .ci-frame {
              position: relative;
              height: min(74vh, 50rem);
              aspect-ratio: 896 / 1536;
              width: auto;
              max-width: 92vw;
              overflow: hidden;
              border: 0;
              border-radius: 14px;
              background: #0a0d38;
              box-shadow:
                0 3rem 6rem rgba(5, 7, 32, 0.75),
                0 0.6rem 1.6rem rgba(5, 7, 32, 0.55);
              cursor: grab;
              touch-action: none;
            }

            .ci-frame.is-zoomed {
              cursor: grab;
            }

            .ci-frame:active {
              cursor: grabbing;
            }

            .ci-plate {
              position: absolute;
              inset: 0;
              will-change: transform;
              transform-origin: 50% 50%;
            }

            .ci-foot {
              width: min(72rem, 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.6rem;
            }

            .ci-steps {
              display: flex;
              gap: 0.55rem;
            }

            .ci-step {
              width: 2.2rem;
              height: 2.2rem;
              padding: 0;
              background: transparent;
              border: 0;
              cursor: pointer;
              position: relative;
            }

            .ci-step::after {
              content: "";
              position: absolute;
              left: 50%;
              top: 50%;
              width: 1.5rem;
              height: 1px;
              transform: translate(-50%, -50%);
              background: rgba(232, 233, 255, 0.28);
              transition: background 220ms ease;
            }

            .ci-step.is-on::after {
              background: #e0b768;
            }

            .ci-hint {
              margin: 0;
              font-family: var(--font-mono, ui-monospace), monospace;
              font-size: 0.58rem;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: rgba(232, 233, 255, 0.5);
              text-align: center;
            }

            .ci-carve {
              margin: 0;
              font-family: var(--font-mono, ui-monospace), monospace;
              font-size: 0.62rem;
              letter-spacing: 0.24em;
              text-transform: uppercase;
              color: rgba(224, 183, 104, 0.85);
              text-align: center;
            }

            .ci-astro {
              margin: 0;
              font-family: var(--font-heading, "Cormorant Garamond"), serif;
              font-style: italic;
              font-size: 0.95rem;
              color: rgba(183, 188, 233, 0.75);
              text-align: center;
            }

            @media (max-width: 700px) {
              .ci-frame {
                height: min(66vh, 40rem);
                max-width: 88vw;
              }
              .ci-hint {
                font-size: 0.52rem;
                letter-spacing: 0.12em;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .ci-tools button {
                transition: none;
              }
            }
          `;

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

interface Props {
  cards: Array<{ card: TarotCard; label?: string; reversed?: boolean }>;
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  uk?: boolean;
}

export default function CardInspector({ cards, index, onClose, onIndexChange, uk = false }: Props) {
  const open = index !== null && index >= 0 && index < cards.length;
  const entry = open ? cards[index as number] : null;

  const plateRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ d: number; z: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const paint = useCallback(() => {
    const el = plateRef.current;
    if (!el) return;
    const z = zoomRef.current;
    // At rest the plate is centred; panning is only meaningful once the
    // card is larger than its frame, so clamp travel to the overflow.
    const f = frameRef.current;
    if (f) {
      const maxX = Math.max(0, (f.clientWidth * z - f.clientWidth) / 2);
      const maxY = Math.max(0, (f.clientHeight * z - f.clientHeight) / 2);
      posRef.current.x = Math.max(-maxX, Math.min(maxX, posRef.current.x));
      posRef.current.y = Math.max(-maxY, Math.min(maxY, posRef.current.y));
    }
    el.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0) scale(${z.toFixed(3)})`;
  }, []);

  const setZoomAt = useCallback(
    (next: number, cx?: number, cy?: number) => {
      const f = frameRef.current;
      const z0 = zoomRef.current;
      const z1 = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
      if (f && cx !== undefined && cy !== undefined) {
        // keep the point under the cursor pinned while scaling
        const r = f.getBoundingClientRect();
        const ox = cx - (r.left + r.width / 2);
        const oy = cy - (r.top + r.height / 2);
        const k = z1 / z0;
        posRef.current.x = ox - (ox - posRef.current.x) * k;
        posRef.current.y = oy - (oy - posRef.current.y) * k;
      }
      zoomRef.current = z1;
      if (z1 === MIN_ZOOM) posRef.current = { x: 0, y: 0 };
      setZoom(z1);
      paint();
    },
    [paint]
  );

  // reset whenever a different card is lifted
  useEffect(() => {
    zoomRef.current = 1;
    posRef.current = { x: 0, y: 0 };
    setZoom(1);
    paint();
  }, [index, paint]);

  // keyboard: escape closes, arrows walk the spread, +/- zoom
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight") { onIndexChange(((index as number) + 1) % cards.length); return; }
      if (e.key === "ArrowLeft") { onIndexChange(((index as number) - 1 + cards.length) % cards.length); return; }
      if (e.key === "+" || e.key === "=") { setZoomAt(zoomRef.current * 1.35); return; }
      if (e.key === "-" || e.key === "_") { setZoomAt(zoomRef.current / 1.35); return; }
      if (e.key === "0") setZoomAt(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, index, cards.length, onClose, onIndexChange, setZoomAt]);

  /* ── The plate in hand ─────────────────────────────────────────
     While the loupe is at rest the whole framed plate leans after the
     pointer (or the phone's own tilt), moonlight sliding across the
     carving. Zooming in steadies the hand: the tilt fades out so the
     loupe can pan precisely. */
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tiltEl = tiltRef.current;
    if (!tiltEl) return;
    const tgt = { rx: 0, ry: 0 };
    const cur = { rx: 0, ry: 0 };
    let raf = 0;

    const damp = () => {
      raf = requestAnimationFrame(damp);
      // zoomed past ~1.05 the plate steadies for precise panning
      const steady = Math.max(0, Math.min(1, 1 - (zoomRef.current - 1.05) * 1.8));
      cur.rx += (tgt.rx * steady - cur.rx) * 0.09;
      cur.ry += (tgt.ry * steady - cur.ry) * 0.09;
      tiltEl.style.transform = `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
      const g = glareRef.current;
      if (g) {
        g.style.opacity = (Math.min(0.9, Math.hypot(cur.rx, cur.ry) / 7 + 0.12) * steady).toFixed(2);
        g.style.transform = `translate3d(${(-cur.ry * 2.6).toFixed(1)}%, ${(cur.rx * 2.6).toFixed(1)}%, 0)`;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (dragRef.current) return; // panning — keep the plate steady
      const f = frameRef.current;
      if (!f) return;
      const r = f.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tgt.ry = Math.max(-1.35, Math.min(1.35, nx)) * 8.5;
      tgt.rx = Math.max(-1.35, Math.min(1.35, -ny)) * 7.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // On touch, the device itself is the hand: tilt the phone, tilt the plate.
    let gyro: ReturnType<typeof createGyroscope> | null = null;
    let base: { b: number; g: number } | null = null;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      gyro = createGyroscope((s) => {
        if (!base) base = { b: s.beta, g: s.gamma };
        tgt.ry = Math.max(-10, Math.min(10, (s.gamma - base.g) * 0.55));
        tgt.rx = Math.max(-9, Math.min(9, -(s.beta - base.b) * 0.45));
      });
      gyro.start().catch(() => {});
    }

    raf = requestAnimationFrame(damp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      gyro?.stop();
      tiltEl.style.transform = "";
    };
  }, [open]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomAt(zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: posRef.current.x, oy: posRef.current.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    posRef.current.x = d.ox + (e.clientX - d.x);
    posRef.current.y = d.oy + (e.clientY - d.y);
    paint();
  };
  const onPointerUp = () => { dragRef.current = null; };

  // pinch
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchRef.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoomRef.current };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const p = pinchRef.current;
    if (p && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setZoomAt(p.z * (d / p.d), (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    }
  };
  const onTouchEnd = () => { pinchRef.current = null; };

  // The dealing table lives inside transformed ancestors, which would
  // trap a position:fixed overlay. The loupe belongs to the document.
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && entry && (
        <motion.div
          className="ci-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={`${entry.card.name} — inspect the plate`}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <style dangerouslySetInnerHTML={{ __html: CSS }} />
          <div className="ci-bar">
            <p className="ci-title">
              {entry.label && <span className="ci-pos">{entry.label}</span>}
              {(uk && ukCard(entry.card.name)?.name) || entry.card.name}
              {entry.reversed && <span className="ci-rev"> · {uk ? "перевернута" : "reversed"}</span>}
            </p>
            <div className="ci-tools">
              <button type="button" onClick={() => setZoomAt(zoomRef.current / 1.4)} aria-label="Zoom out">−</button>
              <span className="ci-zoom" aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoomAt(zoomRef.current * 1.4)} aria-label="Zoom in">+</button>
              <button type="button" className="ci-close" onClick={onClose} aria-label="Close the plate">Close ✕</button>
            </div>
          </div>

          <div ref={tiltRef} className="ci-tilt">
            <motion.div
              ref={frameRef}
              className={`ci-frame ${zoom > 1 ? "is-zoomed" : ""}`}
              initial={{ scale: 0.92, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onDoubleClick={(e) => setZoomAt(zoomRef.current > 1.05 ? 1 : 2.4, e.clientX, e.clientY)}
            >
              <div ref={plateRef} className="ci-plate">
                <NextImage
                  src={getCardPortalImagePath(entry.card)}
                  alt={entry.card.name}
                  fill
                  quality={100}
                  sizes="(max-width: 700px) 92vw, 60vh"
                  priority
                  draggable={false}
                  style={{ objectFit: "cover", transform: entry.reversed ? "rotate(180deg)" : undefined }}
                />
              </div>
              <div ref={glareRef} className="ci-glare" aria-hidden />
            </motion.div>
          </div>

          <div className="ci-foot">
            <p className="ci-carve">{((uk && ukCard(entry.card.name)?.keywords) || entry.card.keywords).join(" ✦ ")}</p>
            <p className="ci-astro">
              {entry.card.astrology} · {entry.card.element}
            </p>
            {cards.length > 1 && (
              <div className="ci-steps">
                {cards.map((c, i) => (
                  <button
                    key={c.card.name + i}
                    type="button"
                    className={`ci-step ${i === index ? "is-on" : ""}`}
                    onClick={() => onIndexChange(i)}
                    aria-label={c.card.name}
                    aria-current={i === index}
                  />
                ))}
              </div>
            )}
            <p className="ci-hint">
              {uk
                ? "Рухайте рукою — карта нахиляється · скрол чи щипок = лупа · тягніть · подвійний клік — назад"
                : "Move the hand — the plate leans · scroll or pinch to magnify · drag to roam · double-click to spring back"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
