"use client";

/**
 * SpreadTheater — Fig. 1 as an object, not a diagram.
 *
 * Three physical card plates (the deck's own lapis back) in a
 * perspective stage. Grammar borrowed from the card-object study:
 *  • idle — the pile breathes; a glint sweeps the top card
 *  • pointer near — the fan wakes and follows the hand in 3D
 *    (shared rotateX/rotateY tilt, the card nearest the cursor
 *    rises toward the viewer, PAST · NOW · NEXT surface)
 *  • click — the cards gather, lift toward the eye, and the
 *    night wipe carries you onto the dealing table
 *
 * One rAF rig, lerped targets, no per-frame React state.
 */

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const LERP = 0.14;
const CARD_W = 152;
const CARD_H = 263;

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
    const glares = Array.from(stage.querySelectorAll<HTMLElement>(".st-glare"));
    const labels = Array.from(stage.querySelectorAll<HTMLElement>(".st-label"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    router.prefetch(href);

    // per-card current + velocity-free lerp state
    const cur = cards.map(() => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 }));
    let px = 0.5;
    let py = 0.5;
    let inside = false;
    let diveAt = 0;
    let raf = 0;
    // the waking shuffle: cards sleep as one stack until the plate
    // scrolls into view, then fan open once — a single slow beat
    let wakeAt = reduce ? -1 : 0; // -1 = already awake (no entrance)
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
      const awake = finePointer ? (inside ? 1 : 0) : 1;
      const diving = diveAt > 0;
      // entrance factor: 0 = still asleep in one stack, 1 = settled pile
      const wakeRaw = wakeAt < 0 ? 1 : wakeAt === 0 ? 0 : Math.min(1, (now - wakeAt) / 1500);
      const wk = 1 - Math.pow(1 - wakeRaw, 3);
      const flourish = Math.sin(wakeRaw * Math.PI); // the one over-fan beat

      for (let i = 0; i < cards.length; i++) {
        const k = i - 1; // -1, 0, 1
        let tx: number, ty: number, tz: number, trx: number, trot: number, tryy: number, ts: number;

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
          // which card the pointer leans toward
          const zone = px < 0.4 ? 0 : px > 0.6 ? 2 : 1;
          const near = finePointer ? zone === i : i === 1;
          tx = k * 104;
          ty = Math.abs(k) * 9 - 5 + (near ? -7 : 0);
          tz = near ? 52 : 14;
          trot = k * 13;
          trx = sharedRx;
          tryy = sharedRy;
          ts = near ? 1.07 : 1;
        } else {
          // the sleeping pile breathes
          const breath = reduce ? 0 : Math.sin(t * 0.55 + i * 2.1);
          tx = k * 15;
          ty = Math.abs(k) * 7 + breath * 2.4;
          tz = i === 1 ? 8 : 0;
          trot = k * 6.5 + breath * 1.1;
          trx = reduce ? 0 : Math.sin(t * 0.4 + i * 1.4) * 1.6;
          tryy = reduce ? 0 : Math.cos(t * 0.5 + i * 1.9) * 2.2;
          ts = 1;
        }

        // the waking shuffle: until the entrance completes, blend the
        // resting target back toward a single sleeping stack and add
        // one over-fan beat on the way out
        if (!diving && wakeRaw < 1) {
          tx = tx * wk + k * 26 * flourish;
          ty = ty * wk + (1 - wk) * 16 - flourish * 6;
          tz = tz * wk;
          trot = trot * wk + k * 8 * flourish;
          trx *= wk;
          tryy *= wk;
          ts = 1 + (ts - 1) * wk;
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

        cards[i].style.transform =
          `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, ${c.z.toFixed(2)}px) ` +
          `rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg) rotateZ(${c.rz.toFixed(2)}deg) ` +
          `scale(${c.s.toFixed(3)})`;

        // glare: counter-moving moonlight, only while awake
        // Glare: the gradient is painted once in CSS; only its position
        // moves, so the moonlight is a composite, never a re-raster.
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
            <CardBackPlate />
            <div className="st-glare" aria-hidden />
            <div className="st-glint" aria-hidden style={{ animationDelay: `${2 + i * 2.4}s` }} />
          </div>
          <span className="st-label">{LABELS[i]}</span>
        </div>
      ))}

      <style jsx>{`
        .st-stage {
          position: relative;
          width: 100%;
          max-width: 28rem;
          height: 23.5rem;
          margin: 0 auto;
          perspective: 950px;
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
          border-radius: 6px;
          overflow: hidden;
          transform-style: preserve-3d;
          will-change: transform;
          box-shadow:
            0 18px 34px rgba(10, 13, 56, 0.55),
            0 4px 10px rgba(10, 13, 56, 0.4);
          border: 1px solid rgba(232, 233, 255, 0.16);
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

        .st-slot-0 :global(.st-label),
        .st-slot-0 .st-label { margin-left: -104px; }
        .st-slot-2 .st-label { margin-left: 104px; }

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
