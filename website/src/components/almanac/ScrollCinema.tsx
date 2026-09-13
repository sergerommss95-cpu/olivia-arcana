"use client";

/**
 * ScrollCinema — a still that remembers how to move.
 *
 * A carved-sky relief (generated in the deck's own stele language) sits
 * full-bleed under a pinned viewport. The reader's scroll is the play
 * head: progress through the section scrubs the film, so the stone
 * wakes exactly as fast as the hand moves — the awwwards gesture of a
 * static picture becoming motion, owned rather than autoplayed.
 *
 * Mechanics follow the plate's rules: geometry measured once, a damped
 * rAF loop gated by an IntersectionObserver, and prefers-reduced-motion
 * gets the finished still with no film at all.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";
import { STARS, CONSTELLATIONS } from "@/lib/star-chart";
import { horizontalAt, PLATE_LATITUDE, observerLongitude } from "@/lib/diurnal";

const SRC = "/motion/sky-carved.mp4";
const POSTER = "/motion/sky-carved-poster.jpg";

/* ── Tonight's real sky, laid over the carving ────────────────────
   The same catalogue and the same spherical astronomy the rest of the
   site draws from: the constellations actually standing over the
   reader right now, projected onto the film as hairline gilt. The
   carved myth and the living sky occupy one frame — which is the
   whole argument of the deck. */

const VB_W = 1200;
const VB_H = 675;
const AZ0 = 40;
const AZ1 = 320;

function liveSky(lat: number, lon: number) {
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const placed = STARS.map((st, idx) => ({
    idx,
    mag: st.mag,
    ...horizontalAt(st.ra * 15, st.dec, nowHour, lat, lon, midnight),
  }));
  const X = (az: number) => ((az - AZ0) / (AZ1 - AZ0)) * VB_W;
  const Y = (alt: number) => VB_H - (alt / 80) * VB_H;
  const vis = (p: { alt: number; az: number }) => p.alt > 2 && p.az >= AZ0 && p.az <= AZ1;

  const stars = placed
    .filter((p) => vis(p) && p.mag <= 3.2)
    .map((p) => ({ x: X(p.az), y: Y(p.alt), r: p.mag <= 1.2 ? 2.2 : p.mag <= 2.2 ? 1.6 : 1.1 }));

  const lines: string[] = [];
  for (const c of CONSTELLATIONS) {
    for (const run of c.lines) {
      for (let i = 0; i < run.length - 1; i++) {
        const a = placed[run[i]];
        const b = placed[run[i + 1]];
        if (!a || !b || !vis(a) || !vis(b)) continue;
        if (Math.abs(X(a.az) - X(b.az)) > 300) continue;
        lines.push(`M ${X(a.az).toFixed(1)} ${Y(a.alt).toFixed(1)} L ${X(b.az).toFixed(1)} ${Y(b.alt).toFixed(1)}`);
      }
    }
  }
  return { stars, d: lines.join(" ") };
}

export default function ScrollCinema() {
  const { locale } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Tonight's sky arrives after mount — client clocks only, no
  // hydration seam. Latitude honours the reader's own setting.
  const [sky, setSky] = useState<ReturnType<typeof liveSky> | null>(null);
  useEffect(() => {
    let lat = PLATE_LATITUDE;
    try {
      const v = parseFloat(localStorage.getItem("oa-lat") ?? "");
      if (Number.isFinite(v) && v >= 23 && v <= 66) lat = v;
    } catch {}
    setSky(liveSky(lat, observerLongitude()));
  }, []);

  useEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video) return;
    // Progress belongs to the hero's pin, so every layer — film, live
    // sky, and the hero's own copy — rides one clock.
    const host = (el.closest(".front-pin") as HTMLElement) ?? el;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      host.style.setProperty("--cp", "1");
      return;
    }

    let raf = 0;
    let running = false;
    let current = 0;
    let written = -1;
    const hasTimeline =
      typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      // The acts above this one assemble on the client and move the
      // section after mount, so a cached top goes stale — one rect read
      // per frame on a single element is the honest price of truth.
      let p: number;
      if (hasTimeline) {
        // the compositor's clock — read it, never write it
        p = parseFloat(getComputedStyle(host).getPropertyValue("--cp")) || 0;
      } else {
        const r = host.getBoundingClientRect();
        const span = Math.max(1, r.height - window.innerHeight);
        const target = Math.min(1, Math.max(0, -r.top / span));
        current += (target - current) * 0.14;
        p = Math.round(current * 1000) / 1000;
        host.style.setProperty("--cp", String(p));
      }
      if (p !== written) {
        written = p;
        host.classList.toggle("is-done", p > 0.6);
        const d = video.duration;
        if (d && video.readyState >= 2) {
          const t = p * (d - 0.05);
          if (Math.abs(video.currentTime - t) > 0.02) video.currentTime = t;
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      // the film must be resident before the hand can scrub it
      video.preload = "auto";
      video.load();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "60% 0px" }
    );
    io.observe(host);

    const onVis = () => document.hidden && stop();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const uk = locale === "uk";

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="cinema" aria-hidden>
      <div className="cin-stage">
        <video
          ref={videoRef}
          className="cin-film"
          src={SRC}
          poster={POSTER}
          muted
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div className="cin-veil" aria-hidden />

        {/* tonight's constellations, risen out of the carving */}
        {sky && (
          <svg
            className="cin-livesky"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <path d={sky.d} fill="none" stroke="var(--ox, #e0b768)" strokeWidth="0.8" opacity="0.55" />
            {sky.stars.map((st, i) => (
              <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#f4ecd8" opacity="0.9" />
            ))}
          </svg>
        )}

        <div className="cin-type">
          <p className="cin-kicker cin-l1">
            {uk ? "OLIVIA ARCANA · ОСОБИСТИЙ АЛЬМАНАХ" : "OLIVIA ARCANA · THE PERSONAL ALMANAC"}
          </p>
          <h2 className="cin-head cin-l2">
            {uk ? "Почніть із неба." : "Begin with the sky."}
          </h2>
          <p className="cin-close cin-l3">
            {uk
              ? "Колода вирізьбила його в камені. Гортайте — і камінь прокидається."
              : "The deck carved it in stone. Scroll, and the stone wakes."}
          </p>
          <p className="cin-close cin-l4">
            {uk
              ? "А це — сузір'я, що стоять над вами просто зараз."
              : "And these are the constellations standing over you right now."}
          </p>
        </div>

        <p className="cin-caption">
          {uk
            ? "Фронтиспис — небо, вирізьблене й живе"
            : "Frontispiece — the sky, carved and living"}
        </p>
        <div className="cin-cue" aria-hidden>
          <span className="cin-cue-line" />
        </div>
      </div>


      <style jsx>{`
        /* A layer over the hero stage — never a scroll box of its own.
           The whole layer ignores the pointer; the chart beneath keeps
           the reader's hand from the first frame. */
        .cinema {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
        }

        .cin-stage {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .cin-film {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          --out: clamp(0, (var(--cp, 0) - 0.28) * 4.5, 1);
          opacity: calc(1 - var(--out) * var(--out) * (3 - 2 * var(--out)));
        }

        /* The page's night bleeds into the stone at both edges — the act
           has no frame, the way the plate has none. */
        .cin-veil {
          position: absolute;
          inset: 0;
          pointer-events: none;
          --out: clamp(0, (var(--cp, 0) - 0.28) * 4.5, 1);
          opacity: calc(1 - var(--out));
          background:
            linear-gradient(to bottom, #10134d 0%, rgba(16, 19, 77, 0) 16%, rgba(16, 19, 77, 0) 82%, #10134d 100%),
            radial-gradient(120% 90% at 50% 50%, rgba(10, 13, 56, 0) 55%, rgba(10, 13, 56, 0.5) 100%);
        }

        /* ── The editorial type rides the scrub ──
           Each line owns a start --s inside the scroll, same contract as
           the plate's strokes: smoothstepped, so nothing pops. */
        .cin-type {
          position: absolute;
          inset: 0;
          display: grid;
          place-content: center;
          justify-items: center;
          text-align: center;
          padding: 0 clamp(1.2rem, 6vw, 4rem);
          pointer-events: none;
        }

        .cin-l1 { --s: 0.02; }
        .cin-l2 { --s: 0.07; }
        .cin-l3 { --s: 0.15; }
        .cin-l4 { --s: 0.24; }

        .cin-l1, .cin-l2, .cin-l3, .cin-l4 {
          --k: clamp(0, (var(--cp, 0) - var(--s)) * 7, 1);
          --gone: clamp(0, (var(--cp, 0) - 0.34) * 8, 1);
          opacity: calc(var(--k) * var(--k) * (3 - 2 * var(--k)) * (1 - var(--gone)));
          transform: translateY(calc((1 - var(--k)) * 26px - var(--gone) * 20px));
        }

        .cin-kicker {
          margin: 0 0 1.1rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.42em;
          text-indent: 0.42em;
          color: var(--ox, #e0b768);
          text-shadow: 0 1px 14px rgba(10, 13, 56, 0.9);
        }

        .cin-head {
          margin: 0;
          max-width: 17ch;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
          font-style: italic;
          font-size: clamp(2rem, 5.4vw, 3.9rem);
          line-height: 1.12;
          color: #f4f0e6;
          text-shadow: 0 2px 26px rgba(10, 13, 56, 0.92), 0 0 60px rgba(10, 13, 56, 0.6);
        }

        .cin-close {
          margin: 1.4rem 0 0;
          font-size: clamp(0.92rem, 1.6vw, 1.05rem);
          color: rgba(238, 242, 255, 0.82);
          text-shadow: 0 1px 12px rgba(10, 13, 56, 0.9);
        }

        .cin-cta {
          margin: 1.6rem 0 0;
        }

        .cin-cta :global(.cin-link) {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--ox, #e0b768);
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.45);
          padding-bottom: 0.3em;
          text-shadow: 0 1px 10px rgba(10, 13, 56, 0.9);
        }

        .cin-cta :global(.cin-link:hover) {
          border-bottom-color: var(--ox, #e0b768);
        }

        /* Tonight's sky surfaces through the last third of the scrub —
           the carving and the reader's own constellations share the
           frame, then hold. */
        .cin-livesky {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          --k: clamp(0, (var(--cp, 0) - 0.3) * 5, 1);
          --keep: clamp(0, (0.72 - var(--cp, 0)) * 6, 1);
          opacity: calc(var(--k) * var(--k) * (3 - 2 * var(--k)) * 0.85 * var(--keep));
          filter: drop-shadow(0 0 6px rgba(224, 183, 104, 0.35));
          pointer-events: none;
        }

        /* The cue: a thin falling line, the almanac's way of saying
           "there is more beneath". Fades once the reader has begun. */
        .cin-cue {
          position: absolute;
          left: 50%;
          bottom: 3.2rem;
          transform: translateX(-50%);
          opacity: calc(1 - clamp(0, var(--cp, 0) * 6, 1));
          pointer-events: none;
        }

        .cin-cue-line {
          display: block;
          width: 1px;
          height: 44px;
          background: linear-gradient(to bottom, rgba(224, 183, 104, 0), var(--ox, #e0b768));
          animation: cin-fall 2.2s ease-in-out infinite;
        }

        @keyframes cin-fall {
          0% { transform: scaleY(0); transform-origin: top; opacity: 0; }
          40% { transform: scaleY(1); transform-origin: top; opacity: 0.9; }
          100% { transform: scaleY(1); transform-origin: top; opacity: 0; }
        }

        .cin-caption {
          opacity: calc(1 - clamp(0, (var(--cp, 0) - 0.2) * 6, 1));
          position: absolute;
          left: 50%;
          bottom: 1.4rem;
          transform: translateX(-50%);
          margin: 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(183, 188, 233, 0.5);
          white-space: nowrap;
        }

        /* Reduced motion: the finished still, all the words, no film. */
        @media (prefers-reduced-motion: reduce) {
          .cinema {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
