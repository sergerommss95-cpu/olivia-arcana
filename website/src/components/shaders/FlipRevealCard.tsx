/**
 * FlipRevealCard.tsx — a proper tarot-card flip reveal.
 *
 * Dropping shader physics entirely. The universally correct reveal
 * for a tarot card is how a tarot reader actually does it: the card
 * sits face-down, you flip it, it shows its face. This is the motion
 * grammar the gesture deserves — immediate, clear, emotionally
 * legible, and an excuse to design a gorgeous card BACK.
 *
 * Motion discipline (the twelve principles, applied):
 *   • Anticipation — before the flip, the card scales up ~3% and
 *     drops slightly (pulling down to wind up). Like lifting a
 *     playing card's corner off the table before flipping it.
 *   • Primary action — a 180° Y-rotation with a stiff spring.
 *     Overshoots ~6° then settles.
 *   • Squash & stretch — a subtle scale modulation that peaks at the
 *     midpoint (edge-on to camera) and relaxes on the faces.
 *   • Follow-through — after the flip settles, a soft rim glow pulses
 *     once on the face.
 *   • Staging — at the 90° edge-on moment, a thin gold highlight
 *     sweeps across the card's edge (like light catching a knife).
 *   • Secondary motion — the drop shadow warps with the rotation
 *     (narrowest when edge-on, widest when facing camera).
 *
 * The back of the card is a hand-composed SVG:
 *   • Cosmic purple base with radial gradient depth
 *   • Gold filigree border (concentric oval + cornerstone florets)
 *   • Central ✦ brand mark inside a fine laurel
 *   • Eight-point star constellation woven around the mark
 *   • Fine hairline inner border
 *
 * Everything else on the card (actions, strip, actions) matches the
 * other shader variants so the picker swap feels consistent.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardPortalImagePath } from "@/lib/academy/card-images";

interface FlipRevealCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

// ─────────────────────────────────────────────────────────────────────
//  THE CARD BACK — "Astral Portal"
//  Pure SVG + CSS motion, layered so the back feels like a hole in
//  space that's pulling you in. Everything the static design had is
//  still here; now it breathes, drifts, and draws itself.
//
//  Layers (from back to front):
//   1. Nebula base  — radial-gradient with stops that morph on irrational
//                     periods (never repeats). Plus fractal grain.
//   2. Dust stream  — ~24 gold particles riding <animateMotion> along 8
//                     inward-curving arcs toward the central ✦.
//                     This is the literal "sucks you in."
//   3. Filigree     — the existing hand-composed sigil. Oval breathes,
//                     constellation twinkles on irrational periods,
//                     random star pairs light a hair-thin filament.
//   4. Central ✦   — slow-rotating aura ring (42s/rev).
//   5. Foil sweep  — conic-gradient iridescence pass via mix-blend-mode.
//   6. Vignette    — dark lens edge so the center feels like a well.
//
//  Pointer parallax on three depth layers (bg/mid/fore) — the back
//  tilts subtly toward the cursor, giving depth without disturbing the
//  flip. Reduced-motion strips all motion to a static elegant back.
// ─────────────────────────────────────────────────────────────────────

const STAR_POSITIONS: Array<[number, number]> = [
  [180, 140], [180, 400], [68, 270], [292, 270],
  [105, 192], [255, 192], [105, 348], [255, 348],
];
// Near-prime-ratio periods + phase offsets so the 8 stars never align.
const STAR_PERIODS = [4.1, 5.3, 6.7, 7.9, 9.1, 4.7, 5.9, 7.3];
const STAR_PHASES  = [0.0, 1.2, 2.4, 3.6, 0.8, 2.0, 3.2, 4.4];

function CardBack() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Shared cursor state — read by both the parallax effect and the canvas
  // loop. Keeps them in sync without React re-renders.
  const cursorRef = useRef<{ x: number; y: number; active: number }>({
    x: 180, y: 270, active: 0,
  });

  // ─── CANVAS STARFIELD + CURL-NOISE SMOKE + CURSOR DUST ───
  // Runs in a single RAF loop. ~400 ambient micro-stars twinkling on
  // independent sine phases, ~60 smoke particles on a cheap curl-noise-
  // like flow field, and a cursor-attractor dust cloud that only appears
  // when the pointer is on the card.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = 360, H = 540;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.scale(dpr, dpr);

    // Deterministic PRNG (xorshift) so positions are stable across reloads.
    let s = 0xC0FFEE;
    const rnd = () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) / 0xffffffff);
    };

    // 420 ambient stars — weighted toward small + dim so they feel like depth
    const stars = Array.from({ length: 420 }, () => {
      const r = Math.pow(rnd(), 2.4) * 1.1 + 0.15;
      const bright = rnd() > 0.94; // ~6% are brighter "hero" stars
      return {
        x: rnd() * W,
        y: rnd() * H,
        r: bright ? r * 1.9 : r,
        phase: rnd() * Math.PI * 2,
        period: 1.8 + rnd() * 7,
        baseOp: (bright ? 0.55 : 0.18) + rnd() * 0.3,
        hue: bright ? 48 + rnd() * 12 : 42 + rnd() * 18, // warm gold range
        flickerChance: bright ? 0.002 : 0.0004,
        flickerUntil: 0,
      };
    });

    // 70 smoke puffs — drifting with a cheap curl-field approximation
    const smoke = Array.from({ length: 70 }, () => ({
      x: rnd() * W,
      y: rnd() * H,
      vx: 0, vy: 0,
      r: 14 + rnd() * 26,
      op: 0.02 + rnd() * 0.05,
      seed: rnd() * 1000,
    }));

    // 36 cursor-reactive dust particles — orbit/converge on cursor when near
    const dust = Array.from({ length: 36 }, () => ({
      x: rnd() * W,
      y: rnd() * H,
      vx: (rnd() - 0.5) * 0.2,
      vy: (rnd() - 0.5) * 0.2,
      r: 0.35 + rnd() * 0.55,
      life: rnd(),
    }));

    // Cheap flow field — sum of sines, looks curl-noise-ish, zero deps
    const flow = (x: number, y: number, t: number) => {
      const nx =
        Math.sin(x * 0.012 + t * 0.00028) +
        Math.cos(y * 0.017 - t * 0.00019);
      const ny =
        Math.sin(y * 0.013 - t * 0.00033) +
        Math.cos(x * 0.019 + t * 0.00024);
      return { vx: nx * 0.18, vy: ny * 0.18 };
    };

    let raf = 0;
    let lastT = performance.now();

    const tick = (t: number) => {
      const dt = Math.min(48, t - lastT); // clamp to avoid huge jumps after tab switch
      lastT = t;

      // Full clear — the canvas itself is transparent and composited over
      // the SVG via mix-blend-mode: screen. Anything drawn here adds light.
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);

      // ── SMOKE ── additive purple wash drifting along the flow field
      ctx.globalCompositeOperation = "lighter";
      for (const p of smoke) {
        const { vx, vy } = flow(p.x, p.y, t);
        p.vx = p.vx * 0.92 + vx * 0.08;
        p.vy = p.vy * 0.92 + vy * 0.08;
        p.x += p.vx * dt * 0.04;
        p.y += p.vy * dt * 0.04;
        if (p.x < -30) p.x = W + 30;
        if (p.x > W + 30) p.x = -30;
        if (p.y < -30) p.y = H + 30;
        if (p.y > H + 30) p.y = -30;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const opBoost = p.op * 1.8;
        g.addColorStop(0, `rgba(130, 80, 220, ${opBoost})`);
        g.addColorStop(0.55, `rgba(90, 50, 180, ${opBoost * 0.5})`);
        g.addColorStop(1, "rgba(60, 30, 130, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── STARS ── additive gold twinkle with rare flicker events
      for (const s of stars) {
        const phase = Math.sin((t / 1000) * ((Math.PI * 2) / s.period) + s.phase);
        let op = s.baseOp * (0.42 + (phase * 0.5 + 0.5) * 0.58);

        // Rare flicker: brief 80ms-ish bright pulse
        if (t < s.flickerUntil) {
          const f = (s.flickerUntil - t) / 140;
          op = Math.min(1, op + f * 0.8);
        } else if (!reduced && Math.random() < s.flickerChance) {
          s.flickerUntil = t + 140;
        }

        ctx.fillStyle = `hsla(${s.hue}, 85%, 72%, ${op})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Halo on brighter stars
        if (s.r > 1.2 && op > 0.3) {
          const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          hg.addColorStop(0, `hsla(${s.hue}, 80%, 78%, ${op * 0.5})`);
          hg.addColorStop(1, `hsla(${s.hue}, 80%, 78%, 0)`);
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── CURSOR DUST ── appears only when pointer is on the card
      const c = cursorRef.current;
      if (c.active > 0.01) {
        const cx = c.x, cy = c.y;
        for (const d of dust) {
          // Weak attract toward cursor + flow field wobble
          const dx = cx - d.x, dy = cy - d.y;
          const dist = Math.hypot(dx, dy) + 0.01;
          const pull = Math.min(0.8, 30 / dist) * c.active;
          const { vx, vy } = flow(d.x, d.y, t);
          d.vx = d.vx * 0.90 + (dx / dist) * pull * 0.15 + vx * 0.04;
          d.vy = d.vy * 0.90 + (dy / dist) * pull * 0.15 + vy * 0.04;
          d.x += d.vx * dt * 0.05;
          d.y += d.vy * dt * 0.05;
          d.life += dt * 0.0008;
          if (d.life > 1) {
            d.life = 0;
            d.x = rnd() * W;
            d.y = rnd() * H;
          }

          const op = Math.sin(d.life * Math.PI) * 0.85 * c.active;
          ctx.fillStyle = `rgba(255, 230, 150, ${op})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };

    if (!reduced) raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Pointer parallax — set --px / --py CSS vars on the root (−0.5..0.5).
  // Only active while the card is visible to the camera (backface-visibility
  // handles the hide during flip, but we bail on reduced-motion).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scene = root.closest<HTMLElement>(".flr-scene");
    if (!scene) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let tx = 0, ty = 0;
    let targetActive = 0;
    let gx = 0, gy = 0;
    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      tx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width  - 0.5));
      ty = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top)  / r.height - 0.5));
      // Canvas-space cursor (0..360, 0..540) — shared with RAF loop
      cursorRef.current.x = Math.max(0, Math.min(360, ((e.clientX - r.left) / r.width ) * 360));
      cursorRef.current.y = Math.max(0, Math.min(540, ((e.clientY - r.top ) / r.height) * 540));
      // Gaze — VERY subtle shimmer of the central sigil toward cursor.
      // Just enough to feel alive, not enough to feel surveillance.
      gx = Math.max(-1, Math.min(1, tx * 1.8));
      gy = Math.max(-1, Math.min(1, ty * 1.8));
      targetActive = 1;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onEnter = () => {
      targetActive = 1;
      root.classList.add("is-hovered");
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      gx = 0; gy = 0;
      targetActive = 0;
      root.classList.remove("is-hovered");
      if (!raf) raf = requestAnimationFrame(apply);
    };

    // Smooth cursor `active` toward its target (used by canvas dust fade)
    const smooth = () => {
      const cur = cursorRef.current.active;
      const next = cur + (targetActive - cur) * 0.08;
      cursorRef.current.active = next;
      if (Math.abs(next - targetActive) > 0.003) {
        requestAnimationFrame(smooth);
      }
    };

    const apply = () => {
      raf = 0;
      root.style.setProperty("--px", tx.toFixed(3));
      root.style.setProperty("--py", ty.toFixed(3));
      root.style.setProperty("--gx", gx.toFixed(3));
      root.style.setProperty("--gy", gy.toFixed(3));
      smooth();
    };

    scene.addEventListener("pointerenter", onEnter);
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      scene.removeEventListener("pointerenter", onEnter);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Dust-particle generator — 8 spiral paths × 3 particles each.
  // Staggered dur + negative begin so particles stream continuously.
  const particles = useMemo(() => {
    const out: Array<{ path: number; dur: number; begin: number; r: number; op: number }> = [];
    for (let p = 0; p < 8; p++) {
      for (let i = 0; i < 3; i++) {
        out.push({
          path: p,
          dur: 7.3 + ((p * 1.3 + i * 1.7) % 5.6),
          begin: -(((p * 2.1 + i * 3.4) * 10) % 100) / 10,
          r: 0.55 + ((p + i * 2) % 3) * 0.18,
          op: 0.55 + ((p * 3 + i) % 4) * 0.12,
        });
      }
    }
    return out;
  }, []);

  return (
    <div ref={rootRef} className="astral-back" aria-hidden>
      {/* Canvas — ambient starfield + curl-noise smoke + cursor dust */}
      <canvas ref={canvasRef} className="astral-canvas" />
      {/* Radial burst on mount — a single bloom, ONE event, kept. */}
      <div className="astral-burst" />
      {/* (supernova rings removed — they competed with the Wheel's slow
           meditative rotation. One signature event per card-back, not three.) */}
      <svg
        viewBox="0 0 360 540"
        xmlns="http://www.w3.org/2000/svg"
        className="astral-svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Animated nebula base — stops morph on different periods.
              Darker + higher contrast than the page so the card reads
              as a distinct object, not a window into the page. */}
          <radialGradient id="flip-base" cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#221348">
              <animate
                attributeName="stop-color"
                values="#221348;#2e1a5e;#1a0e3d;#221348"
                dur="11s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="55%" stopColor="#0c0720">
              <animate
                attributeName="stop-color"
                values="#0c0720;#120a2b;#07051a;#0c0720"
                dur="13s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#04030c" />
          </radialGradient>

          {/* Gold filigree gradient */}
          <linearGradient id="flip-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#f3dd8e" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8a6818" />
          </linearGradient>

          {/* Central mark aura */}
          <radialGradient id="flip-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(232,201,106,0.55)" />
            <stop offset="55%"  stopColor="rgba(232,201,106,0.12)" />
            <stop offset="100%" stopColor="rgba(232,201,106,0)" />
          </radialGradient>

          {/* Subtle noise — fabric texture on the base */}
          <filter id="flip-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
            <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.72  0 0 0 0.04 0" />
            <feComposite in="SourceGraphic" operator="over" />
          </filter>

          {/* Particle glow */}
          <filter id="flip-particle-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.9" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 8 inward-curving arcs — each ends at the central ✦ (180,270) */}
          <path id="sp0" d="M 340,80  A 220,220 0 0,0 180,270" />
          <path id="sp1" d="M 20,80   A 220,220 0 0,1 180,270" />
          <path id="sp2" d="M 340,460 A 220,220 0 0,1 180,270" />
          <path id="sp3" d="M 20,460  A 220,220 0 0,0 180,270" />
          <path id="sp4" d="M 356,270 A 170,170 0 0,0 180,270" />
          <path id="sp5" d="M 4,270   A 170,170 0 0,1 180,270" />
          <path id="sp6" d="M 180,18  A 140,140 0 0,1 180,270" />
          <path id="sp7" d="M 180,522 A 140,140 0 0,0 180,270" />
        </defs>

        {/* ─── BG: nebula + dust stream (moves -3px toward cursor) */}
        <g className="al-bg">
          <rect width="360" height="540" fill="url(#flip-base)" />
          <rect width="360" height="540" fill="#271a48" filter="url(#flip-grain)" opacity="0.45" />

          <g className="al-dust" filter="url(#flip-particle-glow)">
            {particles.map((p, i) => (
              <circle key={i} r={p.r} fill="#f3dd8e" opacity="0">
                <animateMotion
                  dur={`${p.dur}s`}
                  begin={`${p.begin}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath href={`#sp${p.path}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values={`0;${p.op};${p.op * 1.05};0`}
                  keyTimes="0;0.15;0.72;1"
                  dur={`${p.dur}s`}
                  begin={`${p.begin}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values={`${p.r};${(p.r * 0.55).toFixed(2)};0`}
                  keyTimes="0;0.6;1"
                  dur={`${p.dur}s`}
                  begin={`${p.begin}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>

        </g>

        {/* ─── MID: outer frames + breathing oval + laurel + florets (+4px) */}
        <g className="al-mid">
          {/* Single refined frame — one confident hairline.
              (Two nested rects + inner hairline were redundant.) */}
          <rect x="22" y="22" width="316" height="496" rx="10" fill="none"
                stroke="url(#flip-gold)" strokeWidth="0.9" strokeOpacity="0.85" />

          {/* (Corner markers removed. The single outer frame provides
               enough anchoring; the corner diamonds were filler.) */}
        </g>

        {/* ─── FORE: Eye + editorial frame (+8px parallax) ─── */}
        <g className="al-fore">
          {/* Latin inscription + top rule removed. The Wheel's own
              Roman-numeral cardinals declare its nature without words.
              Confidence through restraint. */}

          {/* ═══════════════════════════════════════════════════════════
               THE WHEEL OF SEVEN — Seed of Life nested inside the
               Zodiac Wheel. Two counter-rotating systems, a single
               traveling planet on the outer ring, a still ✦ at center.
               The Seed's 6 outer circles align with 6 of 12 zodiac
               positions — hidden geometric coincidence.
               ═══════════════════════════════════════════════════════════ */}

          {/* ─── OUTER WHEEL (rotates CW 180s) ─── */}
          <g className="al-wheel">
            {/* Two reference rings */}
            <circle cx="180" cy="270" r="115" fill="none"
                    stroke="url(#flip-gold)" strokeWidth="0.5" strokeOpacity="0.72" />
            <circle cx="180" cy="270" r="98" fill="none"
                    stroke="url(#flip-gold)" strokeWidth="0.3" strokeOpacity="0.32" />

            {/* 12 tick marks — cardinals longer + bolder */}
            <g stroke="url(#flip-gold)" fill="none">
              {/* Cardinals */}
              <line x1="180" y1="155" x2="180" y2="175"
                    strokeWidth="0.9" strokeOpacity="0.95" />
              <line x1="295" y1="270" x2="275" y2="270"
                    strokeWidth="0.9" strokeOpacity="0.95" />
              <line x1="180" y1="385" x2="180" y2="365"
                    strokeWidth="0.9" strokeOpacity="0.95" />
              <line x1="65"  y1="270" x2="85"  y2="270"
                    strokeWidth="0.9" strokeOpacity="0.95" />
              {/* 8 intermediate ticks at 30° offsets */}
              <line x1="238" y1="172" x2="231" y2="187"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="278" y1="212" x2="263" y2="219"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="278" y1="328" x2="263" y2="321"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="238" y1="368" x2="231" y2="353"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="122" y1="368" x2="129" y2="353"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="82"  y1="328" x2="97"  y2="321"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="82"  y1="212" x2="97"  y2="219"
                    strokeWidth="0.5" strokeOpacity="0.7" />
              <line x1="122" y1="172" x2="129" y2="187"
                    strokeWidth="0.5" strokeOpacity="0.7" />
            </g>

            {/* Emphasis dots at the 8 intermediate tick positions */}
            <g fill="url(#flip-gold)" opacity="0.9">
              <circle cx="234.5" cy="179" r="1" />
              <circle cx="270.5" cy="215" r="1" />
              <circle cx="270.5" cy="325" r="1" />
              <circle cx="234.5" cy="361" r="1" />
              <circle cx="125.5" cy="361" r="1" />
              <circle cx="89.5"  cy="325" r="1" />
              <circle cx="89.5"  cy="215" r="1" />
              <circle cx="125.5" cy="179" r="1" />
            </g>

            {/* Zodiac cardinals — the four signs that open the seasons.
                ♈ Aries (spring / top) · ♋ Cancer (summer / right)
                ♎ Libra (autumn / bottom) · ♑ Capricorn (winter / left)
                Astrology-native; replaces generic Roman numerals. */}
            <g fill="url(#flip-gold)" fontSize="12"
               opacity="0.88" textAnchor="middle"
               fontFamily="'Cormorant Garamond', 'Apple Symbols', serif">
              <text x="180" y="151">♈</text>
              <text x="309" y="275">♋</text>
              <text x="180" y="403">♎</text>
              <text x="51"  y="275">♑</text>
            </g>
          </g>

          {/* ─── SEED OF LIFE (counter-rotates CCW 90s) ─── */}
          {/*  Seed geometry derived from a single constant `r = 32`.
               6 outer circles at hex-angles (60°, 120°, ... 360°)
               around a center circle — classical Seed of Life. */}
          <g className="al-seed" fill="none" stroke="url(#flip-gold)">
            {(() => {
              const r = 32;                       // Seed radius (god-tier constant)
              const cx = 180, cy = 270;            // Card center
              // 6 outer centers at 60° intervals, distance r from center
              const sqrt3_2 = Math.sqrt(3) / 2;    // ≈ 0.8660254
              const centers: Array<[number, number]> = [
                [cx, cy],                          // Center circle
                [cx,            cy - r],           // Top (0°)
                [cx + r * sqrt3_2, cy - r / 2],    // Top-right (60°)
                [cx + r * sqrt3_2, cy + r / 2],    // Bottom-right (120°)
                [cx,            cy + r],           // Bottom (180°)
                [cx - r * sqrt3_2, cy + r / 2],    // Bottom-left (240°)
                [cx - r * sqrt3_2, cy - r / 2],    // Top-left (300°)
              ];
              return centers.map(([ccx, ccy], i) => (
                <circle key={i} cx={ccx.toFixed(3)} cy={ccy.toFixed(3)} r={r}
                        strokeWidth={i === 0 ? 0.55 : 0.5}
                        strokeOpacity={i === 0 ? 0.85 : 0.72} />
              ));
            })()}
          </g>

          {/* ─── THE OLIVE — Olivia's etymology, vertical orientation.
               Redesigned for silhouette legibility at 32px favicon scale:
               3 filled leaves + 1 olive fruit on a clean vertical stem.
               Bold silhouette — readable even when reduced to a smudge.
               No dark cradle (olive holds its own against the Seed).

               Structure: OUTER <g> carries SVG translate (positioning);
               INNER <g class="al-olive"> carries CSS scale animation. */}
          <g transform="translate(180 270)">
            <g className="al-olive">
              {/* Central stem — vertical S-curve, crown to root.
                  Stem now terminates at the olive fruit (y=-30) so
                  the fruit is visually connected, not floating. */}
              <path d="M 0,28 C 3,14 -3,-2 0,-14 C 2,-22 -1,-27 0,-30"
                    fill="none" stroke="url(#flip-gold)"
                    strokeWidth="1.4" strokeOpacity="0.98" strokeLinecap="round" />

              {/* Three filled leaves, alternating sides, all angling up-outward */}
              <g fill="url(#flip-gold)">
                {/* Leaf 1 — lower, right side, pointing up-right */}
                <path d="M 1,18 Q 12,8 18,12 Q 12,18 1,18 Z" opacity="0.97" />
                {/* Leaf 2 — middle, left side, pointing up-left */}
                <path d="M -1,4 Q -14,-6 -20,-2 Q -14,4 -1,4 Z" opacity="0.97" />
                {/* Leaf 3 — upper, right side, pointing up-right */}
                <path d="M 1,-12 Q 13,-22 19,-18 Q 13,-12 1,-12 Z" opacity="0.97" />
              </g>

              {/* Leaf midribs — thin dark vein down each leaf */}
              <g fill="none" stroke="rgba(10,7,22,0.65)"
                 strokeWidth="0.5" strokeLinecap="round">
                <path d="M 2,17  Q 8,13  15,13" />
                <path d="M -2,3  Q -9,-1 -17,-2" />
                <path d="M 2,-13 Q 9,-17 16,-17" />
              </g>

              {/* Olive fruit — crowning the sprig at the top */}
              <ellipse cx="0" cy="-30" rx="3.3" ry="4.4" fill="url(#flip-gold)" />
              {/* Highlight on the fruit — tiny dewdrop */}
              <circle cx="-0.9" cy="-31.2" r="0.75"
                      fill="rgba(255,250,220,0.95)" />
              {/* Calyx / stem-to-fruit connector — tiny dark dot */}
              <circle cx="0" cy="-25.5" r="0.55"
                      fill="rgba(10,7,22,0.7)" />
            </g>
          </g>

          {/* Single editorial closure at the bottom edge — a tiny
               lowercase date mark (year in Roman numerals). Small enough
               to not claim attention, present enough to resolve the
               otherwise-empty bottom 40% of the card. */}
          <text
            x="180" y="502" textAnchor="middle" fill="url(#flip-gold)"
            opacity="0.48" fontSize="6.5" letterSpacing="4"
            fontFamily="'Cormorant Garamond', serif" fontStyle="italic">
            · mmxxvi ·
          </text>
        </g>
      </svg>

      {/* Iridescent foil sweep — conic gradient pass via @property --angle */}
      <div className="astral-foil" />
      {/* Dark lens edge — makes the center feel like a well */}
      <div className="astral-vignette" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  THE COMPONENT
// ─────────────────────────────────────────────────────────────────────

const FLIP_SPRING = { type: "spring" as const, stiffness: 58, damping: 13, mass: 1.1 };
const ANTICIPATION = { duration: 0.22, ease: [0.2, 0, 0.4, 1] as const };

export default function FlipRevealCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: FlipRevealCardProps) {
  const height = Math.round(width * 1.5);

  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Rotation is tracked as a motion value so we can derive edge-flash
  // + shadow morph from it without extra state.
  const rotateY = useMotionValue(0);
  const edgeFlash = useTransform(rotateY, (deg) => {
    // Thin gaussian peak around the 90° edge-on moment; fades by 130°.
    const d = ((deg % 360) + 360) % 360;
    const distFrom90 = Math.min(
      Math.abs(d - 90),
      Math.abs(d - 270)
    );
    return Math.max(0, 1 - distFrom90 / 22);
  });
  const shadowStrength = useTransform(rotateY, (deg) => {
    // Strongest shadow when facing camera (0 or 180), weakest edge-on.
    const d = ((deg % 360) + 360) % 360;
    const faceness = Math.min(
      Math.abs(d - 0),
      Math.abs(d - 180),
      Math.abs(d - 360)
    );
    return 1 - Math.min(faceness, 90) / 90;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset on card change
  useEffect(() => {
    setRevealed(false);
    rotateY.set(0);
  }, [card.name, rotateY]);

  const toggleFlip = useCallback(() => {
    setRevealed(r => !r);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFlip(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); onAdvance?.();
      }
    },
    [toggleFlip, onAdvance]
  );

  return (
    <div className="flr" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <motion.div
        className="flr-scene"
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
        role="button"
        tabIndex={0}
        aria-label={revealed ? `${card.name} revealed. Tap to flip back.` : `Tap to flip and reveal today's card.`}
        onClick={toggleFlip}
        onKeyDown={handleKeyDown}
        // Anticipation scale: wind up just before commit, settle after.
        animate={revealed ? { scale: [1, 1.04, 1] } : { scale: [1, 0.97, 1] }}
        transition={
          reducedMotion ? { duration: 0.01 } : { duration: 3.0, times: [0, 0.18, 1], ease: [0.2, 0.7, 0.3, 1] }
        }
      >
        {/* Animated drop-shadow layer — morphs with rotation */}
        <motion.div
          aria-hidden
          className="flr-shadow"
          style={{
            opacity: reducedMotion ? 0.55 : shadowStrength,
            scale: reducedMotion ? 1 : useTransform(shadowStrength, [0, 1], [0.8, 1.02]),
          }}
        />

        {/* The flipping inner — preserves 3D */}
        <motion.div
          className="flr-inner"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            rotateY,
          }}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={reducedMotion ? { duration: 0.01 } : FLIP_SPRING}
        >
          {/* BACK face */}
          <div className="flr-face flr-back">
            <CardBack />
          </div>

          {/* FRONT face — same cosmic atmosphere as the back, figure on top */}
          <div className="flr-face flr-front">
            {/* Nebula base matching the back's palette */}
            <div className="flr-front-nebula" aria-hidden />
            {/* Iridescent foil sweep (same conic pass as the back) */}
            <div className="flr-front-foil" aria-hidden />
            {/* Figure — transparent-bg portal PNG sits over the nebula */}
            <img
              src={getCardPortalImagePath(card)}
              alt={card.name}
              width={width}
              height={height}
              className="flr-front-img"
            />
            {/* Dark lens vignette — same as the back, deepens center "well" */}
            <div className="flr-front-vignette" aria-hidden />
            {/* Card name strip — lives ON the face */}
            <div className="flr-strip" aria-hidden>
              {numeral && <span className="flr-numeral">{numeral}.</span>}
              <span>{card.name}</span>
            </div>
          </div>

          {/* Edge highlight — a gold seam that flashes at 90° */}
          <motion.div
            aria-hidden
            className="flr-edge"
            style={{ opacity: reducedMotion ? 0 : edgeFlash }}
          />
        </motion.div>

        {/* Hint pill — only visible before flip */}
        <AnimatePresence>
          {!revealed && (
            <motion.div
              className="flr-hint"
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="flr-hint-dot" /> Tap to flip
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face rim aura — grows in after flip */}
        <motion.div
          aria-hidden
          className="flr-rim"
          initial={false}
          animate={revealed ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: revealed ? 0.55 : 0 }}
        />
      </motion.div>

      <div className="flr-actions">
        <button type="button" className="flr-toggle" onClick={toggleFlip}>
          <span aria-hidden>{revealed ? "↺" : "✦"}</span>
          {revealed ? "Flip back" : "Flip the card"}
        </button>
        <button type="button" className="flr-advance" onClick={() => onAdvance?.()}>
          Different card →
        </button>
      </div>

      <style>{`
        .flr { display: flex; flex-direction: column; gap: 1.1rem; align-items: stretch; margin: 0 auto; }

        .flr-scene {
          position: relative;
          cursor: pointer;
          outline: none;
          perspective: 1400px;
          perspective-origin: 50% 40%;
          border-radius: 18px;
          isolation: isolate;
        }
        .flr-scene:focus-visible {
          outline: 2px solid rgba(232, 201, 106, 0.95);
          outline-offset: 6px;
          border-radius: 22px;
        }

        .flr-shadow {
          position: absolute;
          left: 4%;
          right: 4%;
          bottom: -4%;
          height: 12%;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%);
          filter: blur(8px);
          pointer-events: none;
          z-index: 0;
        }

        .flr-inner {
          border-radius: 18px;
        }

        .flr-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 30px 50px rgba(0, 0, 0, 0.55),
            0 0 32px rgba(212, 175, 55, 0.14),
            inset 0 0 0 1px rgba(232, 201, 106, 0.18);
        }
        .flr-back {
          background: #0b0822;
        }
        .flr-front {
          transform: rotateY(180deg);
          background: #04030c;
        }
        /* Nebula base — same palette as the back's #flip-base gradient,
           animated to match its subtle breathing so front/back feel like
           one continuous cosmic object. */
        .flr-front-nebula {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 38%,
              #221348 0%,
              #170d38 32%,
              #0c0720 58%,
              #04030c 100%);
          animation: flr-front-breathe 11s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes flr-front-breathe {
          0%, 100% { filter: brightness(1)    saturate(1); }
          50%      { filter: brightness(1.08) saturate(1.12); }
        }
        /* Iridescent foil sweep — matches the back's conic pass */
        .flr-front-foil {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: conic-gradient(
            from var(--angle, 0deg) at 52% 48%,
            transparent 0deg,
            rgba(232,201,106,0.08) 42deg,
            transparent 92deg,
            rgba(180,145,230,0.09) 144deg,
            transparent 196deg,
            rgba(120,220,220,0.07) 248deg,
            transparent 298deg,
            rgba(232,201,106,0.08) 344deg,
            transparent 360deg
          );
          mix-blend-mode: screen;
          opacity: 0.42;
          animation: al-foil 32s linear infinite;
          z-index: 1;
        }
        /* Dark lens vignette — same as the back */
        .flr-front-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at 52% 42%,
            transparent 45%,
            rgba(5, 3, 20, 0.42) 100%
          );
          mix-blend-mode: multiply;
          z-index: 3;
        }
        .flr-front-img {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 2;
          /* Subtle luminance lift so hairline gold reads over the nebula */
          filter: drop-shadow(0 0 6px rgba(232, 201, 106, 0.18));
        }
        @media (prefers-reduced-motion: reduce) {
          .flr-front-nebula,
          .flr-front-foil { animation: none !important; }
        }

        .flr-strip {
          position: absolute;
          left: 50%; bottom: 1rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: baseline;
          gap: 0.35em;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.72);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232, 201, 106, 0.42);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.05rem;
          color: rgba(245, 240, 232, 0.98);
          pointer-events: none;
          box-shadow: 0 0 22px rgba(212, 175, 55, 0.22);
        }
        .flr-numeral { color: rgba(232, 201, 106, 0.92); margin-right: 0.1em; }

        /* Edge highlight — thin vertical golden seam (card edge catching light) */
        .flr-edge {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 3px;
          transform: translateX(-50%);
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(255, 220, 130, 0.85) 25%,
            rgba(255, 240, 180, 1) 50%,
            rgba(255, 220, 130, 0.85) 75%,
            transparent 100%
          );
          box-shadow: 0 0 24px rgba(255, 220, 130, 0.9);
          pointer-events: none;
          z-index: 3;
        }

        /* Rim aura — appears after flip, gives the face a subtle halo */
        .flr-rim {
          position: absolute;
          inset: -8px;
          border-radius: 22px;
          pointer-events: none;
          z-index: -1;
          background:
            radial-gradient(ellipse at center, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0) 65%);
          filter: blur(12px);
        }

        /* Hint pill */
        .flr-hint {
          position: absolute;
          left: 50%; bottom: 1rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.55em;
          padding: 0.55rem 1.1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.72);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232, 201, 106, 0.58);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.98);
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.24);
          pointer-events: none;
          z-index: 4;
        }
        .flr-hint-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(232, 201, 106, 1);
          box-shadow: 0 0 14px rgba(232, 201, 106, 0.95);
        }

        /* Actions row */
        .flr-actions {
          display: flex; flex-wrap: wrap; gap: 0.9rem;
          justify-content: center; align-items: center;
        }
        .flr-toggle, .flr-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.62rem 1.15rem; border-radius: 9999px;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer;
          transition: all 220ms cubic-bezier(0.16,1,0.3,1);
        }
        .flr-toggle {
          background: linear-gradient(135deg, rgba(212,175,55,0.26), rgba(212,175,55,0.12));
          border: 1px solid rgba(232,201,106,0.52);
          color: rgba(232,201,106,1);
          box-shadow: 0 0 22px rgba(212,175,55,0.18);
        }
        .flr-toggle:hover {
          background: linear-gradient(135deg, rgba(232,201,106,0.38), rgba(212,175,55,0.20));
          border-color: rgba(255,220,130,0.9);
          color: rgba(255,230,150,1);
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(212,175,55,0.3);
        }
        .flr-toggle:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .flr-advance {
          background: transparent;
          border: 1px solid rgba(200,185,255,0.20);
          color: rgba(220,210,245,0.72);
        }
        .flr-advance:hover { color: rgba(245,240,232,0.98); border-color: rgba(200,185,255,0.4); }
        .flr-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }

        /* ═══════════════════════════════════════════════════════════
           ASTRAL PORTAL — the animated back (elevated)
           ═══════════════════════════════════════════════════════════ */
        .astral-back {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          --px: 0;
          --py: 0;
          --hover: 0;
          /* self-assemble on first mount — the sigil emerges from the void */
          animation: al-emerge 1.5s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }
        .astral-back.is-hovered { --hover: 1; }
        @keyframes al-emerge {
          0%   { opacity: 0; filter: blur(8px) brightness(0.35) contrast(1.2); }
          50%  { opacity: 1; filter: blur(2px) brightness(1.15) contrast(1.1); }
          100% { opacity: 1; filter: blur(0)   brightness(1)    contrast(1); }
        }

        /* Canvas — ambient starfield, smoke, cursor dust.
           Sits behind the SVG; screens-blend so its light adds to the SVG base. */
        .astral-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.88;
        }

        /* Mount burst — a bright radial bloom that expands from center,
           synced with the emerge. Feels like the sigil being born.
           Peak is intentionally softer than a stadium floodlight so the
           card composition stays legible through the burst. */
        .astral-burst {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          border-radius: inherit;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(255, 230, 150, 0.7) 0%,
            rgba(232, 201, 106, 0.35) 22%,
            rgba(140, 90, 210, 0.18) 48%,
            rgba(40, 20, 80, 0) 78%
          );
          opacity: 0;
          mix-blend-mode: screen;
          animation: al-burst 2.8s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards;
        }
        @keyframes al-burst {
          0%   { opacity: 0;    transform: scale(0.22); filter: blur(6px); }
          18%  { opacity: 0.95; transform: scale(0.7);  filter: blur(0); }
          55%  { opacity: 0.35; transform: scale(1.15); }
          100% { opacity: 0;    transform: scale(1.6);  filter: blur(3px); }
        }

        /* (Supernova rings fully removed — the Wheel's counter-rotation
            against the Seed is the signature slow event, not bursts.)
           @keyframes al-nova kept unused below; safe to drop later. */
        @keyframes al-nova {
          0%    { opacity: 0; transform: scale(0.2); }
          100%  { opacity: 0; transform: scale(10);  }
        }

        .astral-svg {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 2;
        }

        /* Depth parallax — three layers respond to cursor with different
           amplitudes. Kept tiny so it reads as depth, not as "the card is
           rotating independently of the flip." */
        .astral-svg .al-bg,
        .astral-svg .al-mid,
        .astral-svg .al-fore {
          transform-origin: 180px 270px;
          transform-box: fill-box;
          transition: transform 420ms cubic-bezier(0.16,1,0.3,1);
          will-change: transform;
        }
        .astral-svg .al-bg   { transform: translate(calc(var(--px) * -3px), calc(var(--py) * -3px)); }
        .astral-svg .al-mid  { transform: translate(calc(var(--px) *  4px), calc(var(--py) *  4px)); }
        .astral-svg .al-fore { transform: translate(calc(var(--px) *  8px), calc(var(--py) *  8px)); }

        /* ─────────── THE WHEEL OF SEVEN ─────────── */

        /* Outer zodiac wheel — rotates CW, 180s per revolution */
        .astral-svg .al-wheel {
          transform-origin: 180px 270px;
          transform-box: view-box;
          animation: al-rot 180s linear infinite;
        }
        .astral-back.is-hovered .astral-svg .al-wheel {
          animation-duration: 110s;
        }

        /* Seed of Life — counter-rotates CCW, 90s per revolution */
        .astral-svg .al-seed {
          transform-origin: 180px 270px;
          transform-box: view-box;
          animation: al-rot 90s linear infinite reverse;
        }
        .astral-back.is-hovered .astral-svg .al-seed {
          animation-duration: 55s;
        }

        /* Each of the 7 Seed circles pulses opacity on its own
           prime-ish period — they never re-align. */
        .astral-svg .al-seed > circle:nth-child(1) { animation: al-seed-pulse 6.7s  ease-in-out infinite -0.8s; }
        .astral-svg .al-seed > circle:nth-child(2) { animation: al-seed-pulse 5.9s  ease-in-out infinite -2.1s; }
        .astral-svg .al-seed > circle:nth-child(3) { animation: al-seed-pulse 8.3s  ease-in-out infinite -3.6s; }
        .astral-svg .al-seed > circle:nth-child(4) { animation: al-seed-pulse 7.1s  ease-in-out infinite -5.2s; }
        .astral-svg .al-seed > circle:nth-child(5) { animation: al-seed-pulse 9.7s  ease-in-out infinite -6.8s; }
        .astral-svg .al-seed > circle:nth-child(6) { animation: al-seed-pulse 11.3s ease-in-out infinite -4.1s; }
        .astral-svg .al-seed > circle:nth-child(7) { animation: al-seed-pulse 13.1s ease-in-out infinite -1.7s; }
        @keyframes al-seed-pulse {
          0%, 100% { stroke-opacity: 0.55; }
          50%      { stroke-opacity: 0.95; }
        }

        /* The olive sprig — gentle breath, subtle warm glow around the fruit.
           This is the one visual warm-point at the card's center: a small
           organic flourish that reads as "living" in a field of geometry. */
        /* Inner olive group — scales in place. The outer wrapping <g>
           carries the SVG translate(180 270), so this CSS transform
           composes cleanly without clobbering positioning. */
        .astral-svg .al-olive {
          transform-origin: center;
          transform-box: fill-box;
          animation: al-olive-breath 7s cubic-bezier(0.42, 0, 0.58, 1) infinite;
          filter: drop-shadow(0 0 3px rgba(255, 230, 150, 0.55));
        }
        @keyframes al-olive-breath {
          0%, 100% { transform: scale(1);     }
          50%      { transform: scale(1.045); }
        }
        .astral-back.is-hovered .astral-svg .al-olive {
          animation-duration: 4.5s;
        }

        /* Legacy (kept for old code still referring) — NO-OPs, harmless */

        /* (Eye-era rules removed — using the Wheel of Seven.
            Rotation keyframe defined below, reused by wheel/seed/planet.) */
        @keyframes al-rot {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }

        /* SIGIL SHIMMER — retained for future reuse if the central
           ✦ needs cursor-responsive translate. Currently unused by
           the Wheel of Seven since the central mark sits still. */
        .astral-svg .al-pupil-group {
          transform-origin: 180px 270px;
          transform-box: fill-box;
          transform: translate(
            calc(var(--gx, 0) * 1.2px),
            calc(var(--gy, 0) * 1.2px)
          );
          transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* (Removed: ornament, inscription, top/bottom rules, corner-marks,
            brand wordmark. The card is the signature now.) */

        /* (Iridescent hue-rotate removed. The gold is gold. Making it
            shift hue subtly was "material-richness" decoration we don't
            need anymore — the Wheel + Seed counter-rotation is the signal.) */

        /* Hover — Wheel-of-Seven accelerations handled above */

        /* Iridescent foil sweep — conic gradient rotates via @property */
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        .astral-foil {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: conic-gradient(
            from var(--angle, 0deg) at 52% 48%,
            transparent 0deg,
            rgba(232,201,106,0.08) 42deg,
            transparent 92deg,
            rgba(180,145,230,0.09) 144deg,
            transparent 196deg,
            rgba(120,220,220,0.07) 248deg,
            transparent 298deg,
            rgba(232,201,106,0.08) 344deg,
            transparent 360deg
          );
          mix-blend-mode: screen;
          opacity: 0.35;
          animation: al-foil 32s linear infinite;
          z-index: 4;
          transition: opacity 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .astral-back.is-hovered .astral-foil {
          animation-duration: 22s;
          opacity: 0.6;
        }
        @keyframes al-foil {
          from { --angle: 0deg;   }
          to   { --angle: 360deg; }
        }

        /* Soft lens vignette — deepens the center "well" feel */
        .astral-vignette {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(
            ellipse at 52% 42%,
            transparent 45%,
            rgba(5, 3, 20, 0.42) 100%
          );
          mix-blend-mode: multiply;
          z-index: 5;
        }

        /* Reduced motion — strip everything, keep the eye elegant and still. */
        @media (prefers-reduced-motion: reduce) {
          .astral-back,
          .astral-burst,
          .astral-foil { animation: none !important; }
          .astral-burst { opacity: 0 !important; }
          .astral-canvas { display: none; }
          .astral-svg *, .astral-foil { animation: none !important; }
          .astral-svg .al-bg,
          .astral-svg .al-mid,
          .astral-svg .al-fore,
          .astral-svg .al-wheel,
          .astral-svg .al-seed,
          .astral-svg .al-olive {
            transform: none !important;
            transition: none !important;
            filter: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

