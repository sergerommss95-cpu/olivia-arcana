/**
 * ParlorLayer.tsx — THE PARLOR IS AWAKE.
 *
 * A global, self-contained client layer (mounted once in ClientShell):
 *
 *   · listens to the ritual event bus (window "oa-ritual") and gives each
 *     gesture its synthesized voice from ritual-audio.ts;
 *   · consent as ceremony — one typographic footnote on /oracle, whose
 *     answering click is itself the AudioContext-unlocking gesture;
 *   · idle life — 30s of stillness marks <html> "oa-idle"; 3min brings a
 *     single letterpressed line of tonight's true sky.
 *
 * Every handler is try/caught. Nothing here ever throws.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { parlorAudio, computeTuning } from "@/lib/ritual-audio";

/* ── The ritual event bus contract ── */

type RitualType =
  | "grip"
  | "riffle-tick"
  | "card-pull"
  | "card-land"
  | "card-flip"
  | "major-reveal"
  | "spread-complete"
  | "deal";

interface RitualDetail {
  type?: RitualType;
  velocity?: number;
  index?: number;
  major?: boolean;
}

/* ── Persistence ── */

const PREF_KEY = "oa-parlor";
type Pref = "on" | "off" | null;

function readPref(): Pref {
  try {
    const v = window.localStorage.getItem(PREF_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

function writePref(v: "on" | "off"): void {
  try {
    window.localStorage.setItem(PREF_KEY, v);
  } catch {
    /* private mode — the session still honors the choice */
  }
}

/* ── Test hooks (runtime-overridable timings; production defaults) ── */

declare global {
  interface Window {
    __oaIdleMs?: number;
    __oaFactMs?: number;
  }
}

const idleDelay = () =>
  typeof window !== "undefined" && typeof window.__oaIdleMs === "number"
    ? window.__oaIdleMs
    : 30_000;
const factDelay = () =>
  typeof window !== "undefined" && typeof window.__oaFactMs === "number"
    ? window.__oaFactMs
    : 180_000;

/* ── Tonight's fact line ── */

function skyFactLine(): string {
  try {
    const t = computeTuning();
    const moon = `MOON ${t.moonPhaseName}`;
    if (t.risen.length > 0) {
      const brightest = t.risen.reduce((a, b) => (a.mag <= b.mag ? a : b));
      return `${moon} · ${brightest.nameEn.toUpperCase()} RISEN`;
    }
    return `${moon} · ${Math.round(t.moonIllum * 100)}% LIT`;
  } catch {
    return "THE SKY KEEPS ITS COUNSEL";
  }
}

/* ── Component ── */

export default function ParlorLayer() {
  const pathname = usePathname();
  // The site serves trailing-slash URLs (308 /oracle -> /oracle/).
  const onOracle = (pathname ?? "").replace(/\/+$/, "") === "/oracle";

  // null until mounted (SSR-safe): consent line renders only client-side.
  const [pref, setPref] = useState<Pref>(null);
  const [mounted, setMounted] = useState(false);
  const [factLine, setFactLine] = useState<string | null>(null);

  const prefRef = useRef<Pref>(null);
  prefRef.current = pref;
  const soundOn = pref === "on";

  useEffect(() => {
    setMounted(true);
    setPref(readPref());
  }, []);

  /* — consent / toggle gestures (the click IS the unlocking) — */

  const chooseSound = useCallback(() => {
    try {
      parlorAudio.unlock(); // inside the gesture handler — the ceremony
      parlorAudio.resume();
      parlorAudio.droneStart();
      writePref("on");
      setPref("on");
    } catch {
      /* never throws */
    }
  }, []);

  const chooseSilence = useCallback(() => {
    try {
      writePref("off");
      setPref("off");
    } catch {
      /* never throws */
    }
  }, []);

  const toggleSound = useCallback(() => {
    try {
      if (prefRef.current === "on") {
        parlorAudio.droneStop();
        parlorAudio.suspend();
        writePref("off");
        setPref("off");
      } else {
        parlorAudio.unlock(); // this click is also a valid gesture
        parlorAudio.resume();
        parlorAudio.droneStart();
        writePref("on");
        setPref("on");
      }
    } catch {
      /* never throws */
    }
  }, []);

  /* — ritual bus -> palette — */

  useEffect(() => {
    const onRitual = (e: Event) => {
      try {
        if (prefRef.current !== "on") return;
        const d = ((e as CustomEvent).detail ?? {}) as RitualDetail;
        switch (d.type) {
          case "grip":
            parlorAudio.cardSlide(Math.min(0.35, d.velocity ?? 0.25));
            break;
          case "riffle-tick":
            parlorAudio.ladderTick();
            break;
          case "card-pull":
            parlorAudio.cardSlide(d.velocity ?? 0.55);
            break;
          case "card-land":
            parlorAudio.feltThud(d.velocity ?? 0.7);
            parlorAudio.haptic(12);
            break;
          case "card-flip":
            parlorAudio.paperFlip();
            parlorAudio.haptic(8);
            break;
          case "major-reveal":
            parlorAudio.giltChime(); // rationed: here and spread-complete only
            break;
          case "spread-complete":
            parlorAudio.giltChime();
            break;
          case "deal":
            parlorAudio.cardSlide(d.velocity ?? 0.45);
            parlorAudio.ladderTick();
            break;
          default:
            break;
        }
      } catch {
        /* listeners must never throw */
      }
    };
    window.addEventListener("oa-ritual", onRitual);
    return () => window.removeEventListener("oa-ritual", onRitual);
  }, []);

  /* — page visibility suspends the context — */

  useEffect(() => {
    const onVis = () => {
      try {
        if (document.hidden) parlorAudio.suspend();
        else if (prefRef.current === "on") parlorAudio.resume();
      } catch {
        /* never throws */
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* — pointer movement opens the drone's filter slightly — */

  useEffect(() => {
    let last = 0;
    const onMove = (e: PointerEvent) => {
      try {
        const now = performance.now();
        if (now - last < 120) return;
        const dt = Math.max(1, now - last);
        last = now;
        const speed = Math.hypot(e.movementX ?? 0, e.movementY ?? 0) / dt;
        if (prefRef.current === "on")
          parlorAudio.droneExcite(Math.min(1, speed * 1.5));
      } catch {
        /* never throws */
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /* — idle attract — */

  useEffect(() => {
    if (!mounted) return;
    let idleTimer = 0;
    let factTimer = 0;
    let factHide = 0;
    let softTickTimer = 0;
    let disposed = false;

    const clearIdle = () => {
      try {
        document.documentElement.classList.remove("oa-idle");
      } catch {
        /* never throws */
      }
      window.clearTimeout(factHide);
      window.clearTimeout(softTickTimer);
      setFactLine(null);
    };

    const arm = () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(factTimer);
      idleTimer = window.setTimeout(() => {
        try {
          if (disposed) return;
          document.documentElement.classList.add("oa-idle");
          // One soft tick while idle — never a stream. -8dB, sound-on only.
          softTickTimer = window.setTimeout(() => {
            try {
              if (disposed || prefRef.current !== "on") return;
              parlorAudio.softDb = -8;
              parlorAudio.cardSlide(0.3);
              parlorAudio.softDb = 0;
            } catch {
              /* never throws */
            }
          }, 20_000);
        } catch {
          /* never throws */
        }
      }, idleDelay());
      factTimer = window.setTimeout(() => {
        try {
          if (disposed) return;
          setFactLine(skyFactLine());
          factHide = window.setTimeout(() => setFactLine(null), 8_000);
        } catch {
          /* never throws */
        }
      }, factDelay());
    };

    const onInput = () => {
      try {
        clearIdle();
        arm();
      } catch {
        /* never throws */
      }
    };

    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", onInput, opts);
    window.addEventListener("pointermove", onInput, opts);
    window.addEventListener("keydown", onInput);
    window.addEventListener("wheel", onInput, opts);
    window.addEventListener("touchstart", onInput, opts);
    arm();

    return () => {
      disposed = true;
      window.clearTimeout(idleTimer);
      window.clearTimeout(factTimer);
      window.clearTimeout(factHide);
      window.clearTimeout(softTickTimer);
      clearIdle();
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("pointermove", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onInput);
    };
  }, [mounted]);

  /* — render — */

  if (!mounted) return null;

  const showConsent = onOracle && pref === null;
  const showToggle = onOracle && pref !== null;

  return (
    <>
      <style>{PARLOR_CSS}</style>

      {showConsent && (
        <div className="oa-parlor-consent" role="group" aria-label="Sound preference">
          <span className="oa-parlor-consent-line">THE PARLOR KEEPS QUIET.</span>
          <span className="oa-parlor-consent-answers">
            <button type="button" className="oa-parlor-answer" onClick={chooseSound}>
              deal with sound
            </button>
            <span className="oa-parlor-consent-sep" aria-hidden>
              /
            </span>
            <button type="button" className="oa-parlor-answer" onClick={chooseSilence}>
              deal in silence
            </button>
          </span>
        </div>
      )}

      {showToggle && (
        <button
          type="button"
          className="oa-parlor-toggle"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
        >
          sound · {soundOn ? "on" : "off"}
        </button>
      )}

      {factLine && (
        <div className="oa-parlor-fact" aria-hidden>
          {factLine}
        </div>
      )}
    </>
  );
}

/* ── Styles — night plate register, mono voice, one gilt thread ── */

const MONO = `var(--font-mono, "IBM Plex Mono", ui-monospace, monospace)`;

const PARLOR_CSS = `
.oa-parlor-consent{
  position:fixed;left:50%;transform:translateX(-50%);
  bottom:calc(14px + env(safe-area-inset-bottom,0px));
  z-index:95;display:flex;align-items:baseline;gap:14px;
  padding:10px 18px 9px;background:#10134d;
  border-top:1px solid rgba(232,233,255,0.16);
  font:10px/1.6 ${MONO};letter-spacing:.16em;white-space:nowrap;
  color:#b7bce9;
  animation:oa-parlor-in .7s cubic-bezier(0.625,0.05,0,1) both;
}
.oa-parlor-consent-line{color:#e8e9ff;text-transform:uppercase}
.oa-parlor-consent-answers{display:inline-flex;align-items:baseline;gap:10px}
.oa-parlor-consent-sep{color:rgba(232,233,255,0.16)}
.oa-parlor-answer{
  font:inherit;letter-spacing:inherit;color:#b7bce9;
  background:none;border:none;padding:2px 0;cursor:pointer;
  border-bottom:1px solid transparent;
  transition:color .2s,border-color .2s;
}
.oa-parlor-answer:hover,.oa-parlor-answer:focus-visible{
  color:#e8e9ff;border-bottom-color:#e0b768;outline:none;
}
.oa-parlor-toggle{
  position:fixed;left:22px;
  bottom:calc(52px + env(safe-area-inset-bottom,0px));z-index:90;
  font:9px ${MONO};letter-spacing:.18em;text-transform:lowercase;
  color:#b7bce9;background:none;border:none;
  border-bottom:1px solid transparent;padding:8px 2px;cursor:pointer;
  transition:color .2s,border-color .2s;
}
.oa-parlor-toggle:hover,.oa-parlor-toggle:focus-visible{
  color:#e8e9ff;border-bottom-color:rgba(232,233,255,0.16);outline:none;
}
.oa-parlor-fact{
  position:fixed;left:50%;transform:translateX(-50%);
  bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:94;
  font:10px ${MONO};letter-spacing:.22em;color:#b7bce9;
  pointer-events:none;white-space:nowrap;
  animation:oa-parlor-press 8s cubic-bezier(0.625,0.05,0,1) both;
}
@keyframes oa-parlor-in{
  from{opacity:0;transform:translateX(-50%) translateY(8px)}
  to{opacity:1;transform:translateX(-50%) translateY(0)}
}
@keyframes oa-parlor-press{
  0%{opacity:0;letter-spacing:.3em}
  8%{opacity:.9;letter-spacing:.22em}
  82%{opacity:.9}
  100%{opacity:0}
}
@media (prefers-reduced-motion: reduce){
  .oa-parlor-consent{animation:none}
  .oa-parlor-fact{animation:oa-parlor-fade 8s linear both}
  @keyframes oa-parlor-fade{0%{opacity:0}8%{opacity:.9}82%{opacity:.9}100%{opacity:0}}
}
@media (max-width:640px){
  .oa-parlor-consent{
    left:0;right:0;transform:none;bottom:0;
    justify-content:center;flex-wrap:wrap;gap:6px 14px;
    padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));
    white-space:normal;text-align:center;
  }
  .oa-parlor-consent{animation-name:oa-parlor-in-m}
  .oa-parlor-toggle{left:14px;bottom:calc(96px + env(safe-area-inset-bottom,0px))}
}
@keyframes oa-parlor-in-m{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
`;
