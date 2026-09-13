"use client";

/**
 * SpreadTheater — Fig. 1 as a living table, not a diagram.
 *
 * Three physical card plates in a perspective stage. Grammar:
 *  • entrance — the sleeping stack DEALS itself open, one card at a
 *    time, with a single over-fan flourish
 *  • idle — the pile breathes; a glint sweeps; and every few breaths
 *    the table TURNS one plate to show a true carved face (the deck's
 *    own art — Priestess, Star, Sun), holds it, and lays it back
 *  • pointer near — the fan wakes and follows the hand in 3D, the
 *    card nearest the cursor rising, PAST · NOW · NEXT surfacing
 *  • click — the cards gather, lift toward the eye, and the night
 *    wipe carries you onto the dealing table
 *
 * One rAF rig, lerped targets, no per-frame React state. The flip
 * cycle is time-driven inside the same loop — no timers to leak.
 */

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const LERP = 0.14;
const CARD_W = 184;
const CARD_H = 318;

/** The faces the table shows while it daydreams — the deck's own art. */
const FACES = [
  "/cards-portal/02_the_high_priestess.webp",
  "/cards-portal/17_the_star.webp",
  "/cards-portal/19_the_sun.webp",
];

/* flip cycle timing (ms) */
const CYCLE_FIRST = 2200; // after the deal settles
const CYCLE_GAP = 6200; // between reveals
const FLIP_UP = 700;
const FLIP_HOLD = 2500;
const FLIP_DOWN = 700;

function CardBackPlate() {
  const flecks = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    return {
      x: 14 + t * 102 + Math.sin(i * 2.7) * 7,
      y: 210 - t * 196 + Math.cos(i * 1.9) * 5,
      r: 0.4 + ((i * 37) % 10) / 14,
      o: 0.14 + ((i * 53) % 10) / 22,
    };
  });
  return (
    <svg viewBox="0 0 130 225" width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <radialGradient id="st-sky" cx="50%" cy="38%" r="85%">
          <stop offset="0%" stopColor="#181d7a" />
          <stop offset="55%" stopColor="#10134d" />
          <stop offset="100%" stopColor="#0a0d38" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="130" height="225" fill="url(#st-sky)" />
      <g fill="#b7bce9" opacity="0.5">
        {flecks.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} opacity={f.o} />
        ))}
      </g>
      <g fill="#e0b768">
        <circle cx="24" cy="30" r="0.9" opacity="0.8" />
        <circle cx="104" cy="48" r="0.7" opacity="0.65" />
        <circle cx="36" cy="188" r="0.7" opacity="0.6" />
        <circle cx="98" cy="170" r="0.9" opacity="0.75" />
        <circle cx="65" cy="52" r="0.6" opacity="0.55" />
      </g>
      <rect x="5" y="5" width="120" height="215" rx="9" fill="none" stroke="#e8e9ff" strokeOpacity="0.5" strokeWidth="1" />
      <rect x="11" y="11" width="108" height="203" rx="6" fill="none" stroke="#e8e9ff" strokeOpacity="0.22" strokeWidth="0.75" />
      <g stroke="#e8e9ff" strokeOpacity="0.55" strokeWidth="0.75" fill="none">
        <path d="M 25 21 v 8 M 21 25 h 8" />
        <path d="M 105 21 v 8 M 101 25 h 8" />
        <path d="M 25 196 v 8 M 21 200 h 8" />
        <path d="M 105 196 v 8 M 101 200 h 8" />
      </g>
      <g fill="none" stroke="#e8e9ff">
        <circle cx="65" cy="112.5" r="27" strokeOpacity="0.6" strokeWidth="0.9" />
        <circle cx="65" cy="112.5" r="19" strokeOpacity="0.3" strokeWidth="0.75" strokeDasharray="1.5 3" />
        <g strokeOpacity="0.7" strokeWidth="0.9">
          <line x1="76" y1="112.5" x2="90" y2="112.5" />
          <line x1="72.8" y1="120.3" x2="82.7" y2="130.2" />
          <line x1="65" y1="123.5" x2="65" y2="137.5" />
          <line x1="57.2" y1="120.3" x2="47.3" y2="130.2" />
          <line x1="54" y1="112.5" x2="40" y2="112.5" />
          <line x1="57.2" y1="104.7" x2="47.3" y2="94.8" />
          <line x1="65" y1="101.5" x2="65" y2="87.5" />
          <line x1="72.8" y1="104.7" x2="82.7" y2="94.8" />
        </g>
        <circle cx="65" cy="112.5" r="3.4" fill="#e0b768" fillOpacity="0.95" stroke="none" />
        <circle cx="65" cy="112.5" r="6.5" stroke="#e0b768" strokeOpacity="0.5" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

const LABELS = ["Past", "Now", "Next"];

export default function SpreadTheater({ href = "/oracle", label = "Begin a reading" }: { href?: string; label?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>(".st-card"));
    const flips = Array.from(stage.querySelectorAll<HTMLElement>(".st-flip"));
    const backs = Array.from(stage.querySelectorAll<HTMLElement>(".st-back"));
    const faces = Array.from(stage.querySelectorAll<HTMLElement>(".st-face"));
    const glares = Array.from(stage.querySelectorAll<HTMLElement>(".st-glare"));
    const labels = Array.from(stage.querySelectorAll<HTMLElement>(".st-label"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    router.prefetch(href);

    // per-card current + velocity-free lerp state (f = flip angle)
    const cur = cards.map(() => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, f: 0 }));
    let px = 0.5;
    let py = 0.5;
    let inside = false;
    let diveAt = 0;
    let raf = 0;
    // the deal: cards sleep as one stack until the plate scrolls into
    // view, then deal open one at a time — a single slow beat
    let wakeAt = reduce ? -1 : 0; // -1 = already awake (no entrance)
    // the daydream: which card is being turned, and since when
    let cycleIdx = 0;
    let cycleAt = 0; // 0 = not scheduled yet
    const wakeIO = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting) && wakeAt === 0) {
          wakeAt = performance.now();
          wakeIO.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    if (!reduce) wakeIO.observe(stage);

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
    };
    const onEnter = () => { inside = true; };
    const onLeave = () => { inside = false; px = 0.5; py = 0.5; };

    const dive = () => {
      if (diveAt) return;
      diveAt = performance.now();
      stage.classList.add("is-diving");
      const delay = reduce ? 40 : 430;
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("page:transition", { detail: { href } }));
      }, delay);
    };
    const onClick = () => dive();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dive();
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const t = now / 1000;
      const hoverAwake = finePointer && inside;
      const awake = finePointer ? (inside ? 1 : 0) : 1;
      const diving = diveAt > 0;
      // shared entrance clock; each card takes its own slice of it
      const wakeBase = wakeAt < 0 ? 1e9 : wakeAt === 0 ? -1 : now - wakeAt;

      /* ── the daydream scheduler (time-driven, no timers) ────────
         Runs only when settled, un-hovered, un-dived. Hovering or
         diving cancels the current turn — the target flip returns to
         0 and the schedule waits for calm. */
      const dealDone = wakeAt < 0 || (wakeAt > 0 && wakeBase > 1500 + 2 * 160);
      if (!reduce && dealDone && !hoverAwake && !diving) {
        if (cycleAt === 0) cycleAt = now + (wakeAt < 0 ? CYCLE_GAP : CYCLE_FIRST);
        const cycleT = now - cycleAt;
        if (cycleT > FLIP_UP + FLIP_HOLD + FLIP_DOWN + 400) {
          cycleIdx = (cycleIdx + 1) % 3;
          cycleAt = now + CYCLE_GAP;
        }
      } else if (hoverAwake || diving) {
        cycleAt = 0; // reschedule after calm
      }

      for (let i = 0; i < cards.length; i++) {
        const k = i - 1; // -1, 0, 1
        let tx: number, ty: number, tz: number, trx: number, trot: number, tryy: number, ts: number;
        let tf = 0; // target flip angle

        if (diving) {
          // gather + lift toward the eye; the wipe catches them mid-rise
          const dt = Math.min(1, (now - diveAt) / 460);
          const ease = 1 - Math.pow(1 - dt, 3);
          tx = k * 6;
          ty = -26 * ease;
          tz = 190 * ease;
          trot = k * 2;
          trx = 6 * ease;
          tryy = 0;
          ts = 1 + 0.16 * ease;
        } else if (awake) {
          // the fan — following the hand on a mouse, held open on touch
          const sharedRy = finePointer ? (px - 0.5) * 17 : 0;
          const sharedRx = finePointer ? -(py - 0.5) * 12 : 0;
          const zone = px < 0.4 ? 0 : px > 0.6 ? 2 : 1;
          const near = finePointer ? zone === i : i === 1;
          tx = k * 126;
          ty = Math.abs(k) * 10 - 6 + (near ? -8 : 0);
          tz = near ? 56 : 14;
          trot = k * 13;
          trx = sharedRx;
          tryy = sharedRy;
          ts = near ? 1.07 : 1;
        } else {
          // the sleeping pile breathes
          const breath = reduce ? 0 : Math.sin(t * 0.55 + i * 2.1);
          tx = k * 18;
          ty = Math.abs(k) * 8 + breath * 2.4;
          tz = i === 1 ? 8 : 0;
          trot = k * 7 + breath * 1.1;
          trx = reduce ? 0 : Math.sin(t * 0.4 + i * 1.4) * 1.6;
          tryy = reduce ? 0 : Math.cos(t * 0.5 + i * 1.9) * 2.2;
          ts = 1;
        }

        /* the daydream turn: the table draws the plate to centre,
           shows its face above the pile, and lays it back */
        let lift = 0;
        if (!reduce && !diving && !hoverAwake && cycleAt > 0 && i === cycleIdx) {
          const ct = now - cycleAt;
          if (ct > 0) {
            if (ct < FLIP_UP) {
              const q = ct / FLIP_UP;
              tf = 180 * (1 - Math.pow(1 - q, 3));
              lift = Math.sin(q * Math.PI * 0.5);
            } else if (ct < FLIP_UP + FLIP_HOLD) {
              tf = 180;
              lift = 1;
            } else if (ct < FLIP_UP + FLIP_HOLD + FLIP_DOWN) {
              const q = (ct - FLIP_UP - FLIP_HOLD) / FLIP_DOWN;
              tf = 180 * (1 - (1 - Math.pow(1 - q, 3)));
              lift = 1 - q;
            }
            tx *= 1 - lift * 0.9; // drawn to centre stage
            ty -= 26 * lift;
            tz += 110 * lift;
            trot *= 1 - lift * 0.85;
            ts += 0.07 * lift;
          }
        }
        // the turning plate paints above its brothers for the whole turn
        const slotEl = cards[i].parentElement as HTMLElement | null;
        if (slotEl) slotEl.style.zIndex = lift > 0.02 ? "6" : "";

        // the deal: each card leaves the sleeping stack on its own beat
        const wr = wakeAt < 0 ? 1 : wakeBase < 0 ? 0 : Math.min(1, Math.max(0, (wakeBase - i * 160) / 1200));
        if (!diving && wr < 1) {
          const wk = 1 - Math.pow(1 - wr, 3);
          const flourish = Math.sin(wr * Math.PI);
          tx = tx * wk + k * 30 * flourish;
          ty = ty * wk + (1 - wk) * 18 - flourish * 7;
          tz = tz * wk;
          trot = trot * wk + k * 9 * flourish;
          trx *= wk;
          tryy *= wk;
          ts = 1 + (ts - 1) * wk;
          tf = 0;
        }

        const c = cur[i];
        const g = reduce || diving ? 0.24 : LERP;
        c.x += (tx - c.x) * g;
        c.y += (ty - c.y) * g;
        c.z += (tz - c.z) * g;
        c.rx += (trx - c.rx) * g;
        c.ry += (tryy - c.ry) * g;
        c.rz += (trot - c.rz) * g;
        c.s += (ts - c.s) * g;
        c.f += (tf - c.f) * (reduce ? 1 : 0.16);

        cards[i].style.transform =
          `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, ${c.z.toFixed(2)}px) ` +
          `rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg) rotateZ(${c.rz.toFixed(2)}deg) ` +
          `scale(${c.s.toFixed(3)})`;
        const fl = flips[i];
        if (fl) fl.style.transform = `rotateY(${c.f.toFixed(2)}deg)`;
        // Chrome's backface culling is unreliable this deep in a 3D
        // chain — swap the sides by hand at the hinge's halfway point.
        const showFace = c.f >= 90;
        if (backs[i]) backs[i].style.visibility = showFace ? "hidden" : "visible";
        if (faces[i]) faces[i].style.visibility = showFace ? "visible" : "hidden";

        // glare: counter-moving moonlight, only while the hand is near.
        // The gradient is painted once in CSS; only its position moves.
        const gl = glares[i];
        if (gl) {
          const gx = (0.5 - px) * 46;
          const gy = (0.5 - py) * 38;
          gl.style.opacity = finePointer && awake && !diving ? "1" : "0";
          gl.style.transform = `translate3d(${gx.toFixed(1)}%, ${gy.toFixed(1)}%, 0)`;
        }
        const lb = labels[i];
        if (lb) {
          const on = (awake || !finePointer) && !diving;
          lb.style.opacity = on ? "1" : "0";
          lb.style.transform = on ? "translateY(0)" : "translateY(6px)";
          lb.style.transitionDelay = on ? `${i * 70}ms` : "0ms";
        }
      }
    };

    const onAbort = () => {
      diveAt = 0;
      stage.classList.remove("is-diving");
    };
    window.addEventListener("page:transition-abort", onAbort);
    stage.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("click", onClick);
    stage.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      wakeIO.disconnect();
      window.removeEventListener("page:transition-abort", onAbort);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("keydown", onKey);
    };
  }, [href, router]);

  return (
    <div
      ref={stageRef}
      className="st-stage"
      role="link"
      tabIndex={0}
      aria-label={label}
    >
      <span className="st-invite" aria-hidden>{label.includes("—") ? label.split("—")[1].trim() : label} &rarr;</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`st-slot st-slot-${i}`}>
          <div className="st-card">
            <div className="st-flip">
              <div className="st-side st-back">
                <CardBackPlate />
              </div>
              <div className="st-side st-face">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FACES[i]} alt="" loading="lazy" draggable={false} />
              </div>
            </div>
            <div className="st-fx" aria-hidden>
              <div className="st-glare" />
              <div className="st-glint" style={{ animationDelay: `${2 + i * 2.4}s` }} />
            </div>
          </div>
          <span className="st-label">{LABELS[i]}</span>
        </div>
      ))}

      <style jsx>{`
        .st-stage {
          position: relative;
          width: 100%;
          max-width: 34rem;
          height: 28rem;
          margin: 0 auto;
          perspective: 1050px;
          cursor: pointer;
          outline-offset: 8px;
          touch-action: manipulation;
        }

        .st-slot {
          position: absolute;
          left: 50%;
          top: 46%;
          width: ${CARD_W}px;
          height: ${CARD_H}px;
          margin: ${-CARD_H / 2}px 0 0 ${-CARD_W / 2}px;
          transform-style: preserve-3d;
        }

        .st-slot-0 { z-index: 1; }
        .st-slot-1 { z-index: 3; }
        .st-slot-2 { z-index: 2; }

        .st-card {
          position: absolute;
          inset: 0;
          border-radius: 7px;
          transform-style: preserve-3d;
          will-change: transform;
          box-shadow:
            0 22px 42px rgba(10, 13, 56, 0.55),
            0 5px 12px rgba(10, 13, 56, 0.4);
        }

        /* the turning leaf: back and true face on one hinge */
        .st-flip {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .st-side {
          position: absolute;
          inset: 0;
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid rgba(232, 233, 255, 0.16);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          background: #0a0d38;
        }

        .st-face {
          transform: rotateY(180deg);
        }

        .st-face img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* moonlight lives in its own clipped pane, floating over both
           sides of the hinge */
        .st-fx {
          position: absolute;
          inset: 0;
          border-radius: 7px;
          overflow: hidden;
          pointer-events: none;
          transform: translateZ(2px);
        }

        .st-glare {
          position: absolute;
          inset: -28%;
          opacity: 0;
          transition: opacity 420ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1));
          mix-blend-mode: screen;
          pointer-events: none;
          will-change: transform;
          background: radial-gradient(
            46% 38% at 50% 42%,
            rgba(232, 233, 255, 0.16),
            rgba(232, 233, 255, 0.05) 42%,
            rgba(10, 13, 56, 0.18) 90%
          );
        }

        /* the idle glint: a thin moonlight blade crossing the plate */
        .st-glint {
          position: absolute;
          inset: -30%;
          background: linear-gradient(
            115deg,
            transparent 42%,
            rgba(183, 188, 233, 0.13) 50%,
            transparent 58%
          );
          transform: translateX(-120%);
          animation: st-glint 8.5s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes st-glint {
          0%, 82% { transform: translateX(-120%); }
          92% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }

        .st-slot-0 .st-label { margin-left: -126px; }
        .st-slot-2 .st-label { margin-left: 126px; }

        .st-label {
          position: absolute;
          left: 50%;
          bottom: -2.1rem;
          transform: translateX(-50%) translateY(6px);
          opacity: 0;
          transition: opacity 380ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1)),
            transform 380ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1));
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-indent: 0.18em;
          text-transform: uppercase;
          color: var(--lg-peri, #b7bce9);
          white-space: nowrap;
          pointer-events: none;
        }

        /* Touch has no hover to reveal the fan — say it in words. */
        .st-invite {
          position: absolute;
          left: 50%;
          bottom: -0.4rem;
          transform: translateX(-50%);
          display: none;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--lg-gilt, #e0b768);
          white-space: nowrap;
          pointer-events: none;
        }

        @media (hover: none), (pointer: coarse) {
          .st-invite {
            display: block;
          }
        }

        @media (max-width: 640px) {
          .st-stage {
            height: 24rem;
            perspective: 900px;
          }
          .st-slot {
            transform: scale(0.82);
            transform-origin: 50% 46%;
          }
        }

        .st-stage.is-diving .st-glint {
          animation: none;
        }

        .st-stage:focus-visible {
          outline: 2px solid var(--lg-gilt, #e0b768);
          border-radius: 8px;
        }

        @media (prefers-reduced-motion: reduce) {
          .st-glint {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
