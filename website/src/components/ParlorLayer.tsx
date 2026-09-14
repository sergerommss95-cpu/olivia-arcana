/** The Parlor: one sound preference, one audio engine, one visible control. */
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { parlorAudio, computeTuning } from "@/lib/ritual-audio";
import { useLocale } from "@/lib/i18n/useLocale";

type RitualType = "grip" | "riffle-tick" | "card-pull" | "card-land" | "card-flip" | "major-reveal" | "spread-complete" | "deal";
interface RitualDetail { type?: RitualType; velocity?: number }
type Pref = "on" | "off" | null;
const PREF_KEY = "oa-parlor";
const PREF_EVENT = "oa-sound-preference";
let sessionPref: Pref = null;
let storageWritable = true;

function readPref(): Pref {
  try {
    const value = window.localStorage.getItem(PREF_KEY);
    return value === "on" || value === "off" ? value : storageWritable ? null : sessionPref;
  } catch { return sessionPref; }
}
function writePref(value: "on" | "off") {
  sessionPref = value;
  try { window.localStorage.setItem(PREF_KEY, value); storageWritable = true; }
  catch { storageWritable = false; /* session choice still works */ }
  window.dispatchEvent(new Event(PREF_EVENT));
}
function subscribePref(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PREF_KEY || event.key === null) listener();
  };
  window.addEventListener(PREF_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PREF_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
const serverPref = (): Pref => null;
const audioState = () => parlorAudio.state;
const serverAudioState = () => "none" as const;

function skyFactLine(uk: boolean): string {
  const tuning = computeTuning();
  // The factual line uses only the current Moon's computed illumination.
  return uk
    ? `МІСЯЦЬ · ОСВІТЛЕНО ${Math.round(tuning.moonIllum * 100)}%`
    : `TONIGHT’S MOON · ${Math.round(tuning.moonIllum * 100)}% ILLUMINATED`;
}

export default function ParlorLayer() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const uk = locale === "uk";
  const onOracle = (pathname ?? "").replace(/\/+$/, "") === "/oracle";
  const pref = useSyncExternalStore(subscribePref, readPref, serverPref);
  const state = useSyncExternalStore(parlorAudio.subscribe, audioState, serverAudioState);
  const [starting, setStarting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [factLine, setFactLine] = useState<string | null>(null);
  const activation = useRef(0);
  const soundOn = pref === "on" && state === "running";

  const chooseSilence = useCallback(() => {
    activation.current += 1;
    setStarting(false);
    setUnavailable(false);
    writePref("off");
    parlorAudio.droneStop();
    void parlorAudio.suspend();
  }, []);

  const chooseSound = useCallback(() => {
    const request = ++activation.current;
    setUnavailable(false);
    setStarting(true);
    writePref("on");
    // Creating/resuming happens synchronously inside this click. Only the
    // drone waits: mobile browsers may resolve resume asynchronously.
    void parlorAudio.unlock().then((ready) => {
      if (request !== activation.current) return;
      setStarting(false);
      if (document.hidden || readPref() !== "on") return;
      if (ready) parlorAudio.droneStart();
      else setUnavailable(true);
    });
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onRitual = (event: Event) => {
      if (readPref() !== "on" || parlorAudio.state !== "running" || document.hidden) return;
      const detail = (event as CustomEvent<RitualDetail>).detail;
      if (!detail || typeof detail !== "object") return;
      const velocity = typeof detail.velocity === "number" && Number.isFinite(detail.velocity)
        ? detail.velocity : undefined;
      switch (detail.type) {
        case "grip": parlorAudio.cardSlide(Math.min(0.35, velocity ?? 0.25)); break;
        case "riffle-tick": parlorAudio.ladderTick(); break;
        case "card-pull": parlorAudio.cardSlide(velocity ?? 0.55); break;
        case "card-land":
          parlorAudio.feltThud(velocity ?? 0.7);
          if (!reduced.matches) parlorAudio.haptic(12);
          break;
        case "card-flip":
          parlorAudio.paperFlip();
          if (!reduced.matches) parlorAudio.haptic(8);
          break;
        case "major-reveal": case "spread-complete": parlorAudio.giltChime(); break;
        case "deal": parlorAudio.cardSlide(velocity ?? 0.45); break;
      }
    };
    window.addEventListener("oa-ritual", onRitual);
    return () => window.removeEventListener("oa-ritual", onRitual);
  }, []);

  useEffect(() => {
    const pause = () => {
      activation.current += 1;
      setStarting(false);
      parlorAudio.droneStop();
      void parlorAudio.suspend();
    };
    const onVisibility = () => {
      if (document.hidden) { pause(); return; }
      // A saved preference alone never creates a context or autoplays.
      if (readPref() !== "on" || !parlorAudio.unlocked) return;
      const request = ++activation.current;
      void parlorAudio.resume().then((ready) => {
        if (ready && request === activation.current && !document.hidden && readPref() === "on") {
          parlorAudio.droneStart();
        }
      });
    };
    const onPreference = () => { if (readPref() !== "on") pause(); };
    const unsubscribe = subscribePref(onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pause);
    window.addEventListener("pageshow", onVisibility);
    return () => {
      activation.current += 1;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("pageshow", onVisibility);
      parlorAudio.dispose();
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = 0;
    const onMove = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType === "touch" || document.hidden || readPref() !== "on") return;
      const now = performance.now();
      if (now - last < 120) return;
      const speed = Math.hypot(event.movementX ?? 0, event.movementY ?? 0) / Math.max(1, now - last);
      last = now;
      parlorAudio.droneExcite(Math.min(1, speed * 1.5));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Idle life is visual only. No surprise sound or animation in a hidden
  // tab, and no decorative motion when the reader has reduced it.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idleTimer = 0, factTimer = 0, factHide = 0, lastInput = 0;
    const clearTimers = () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(factTimer);
      window.clearTimeout(factHide);
      document.documentElement.classList.remove("oa-idle");
    };
    const arm = () => {
      if (document.hidden) return;
      if (!reduced.matches) idleTimer = window.setTimeout(() => {
        document.documentElement.classList.add("oa-idle");
      }, 30_000);
      factTimer = window.setTimeout(() => {
        setFactLine(skyFactLine(uk));
        factHide = window.setTimeout(() => setFactLine(null), 8_000);
      }, 180_000);
    };
    const onInput = () => {
      const now = performance.now();
      if (now - lastInput < 200) return;
      lastInput = now;
      clearTimers();
      setFactLine(null);
      arm();
    };
    const onVisibility = () => { clearTimers(); setFactLine(null); arm(); };
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, onInput, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onVisibility);
    arm();
    return () => {
      clearTimers();
      events.forEach((event) => window.removeEventListener(event, onInput));
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onVisibility);
    };
  }, [uk]);

  const label = starting
    ? (uk ? "Увімкнення…" : "Starting sound…")
    : soundOn
      ? (uk ? "Звук увімкнено" : "Sound on")
      : pref === "on"
        ? (uk ? "Відновити звук" : "Resume sound")
        : (uk ? "Звук вимкнено" : "Sound off");
  const description = uk
    ? "Необов’язкові звуки карт і тихе тло. Можна вимкнути будь-коли."
    : "Optional card sounds and a quiet background. Turn off at any time.";

  return <>
    <style>{PARLOR_CSS}</style>
    {(onOracle || pref === "on") && <div className="oa-parlor-control">
      <button type="button" className="oa-parlor-toggle"
        aria-pressed={soundOn} aria-busy={starting}
        aria-label={soundOn || starting ? (uk ? "Вимкнути звук" : "Turn sound off") : (uk ? "Увімкнути звук" : "Turn sound on")}
        aria-describedby="oa-sound-description" title={description}
        onClick={soundOn || starting ? chooseSilence : chooseSound}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          {soundOn ? <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></> : <path d="m16 9 6 6m0-6-6 6" />}
        </svg>
        {label}
      </button>
      <span id="oa-sound-description" className="oa-parlor-sr">{description}</span>
      <span className={unavailable ? "oa-parlor-error" : "oa-parlor-sr"} role="status">
        {unavailable ? (uk ? "Звук не запустився. Спробуйте ще раз." : "Sound could not start. Tap to retry.") : ""}
      </span>
    </div>}
    {factLine && <div className="oa-parlor-fact" aria-hidden="true">{factLine}</div>}
  </>;
}

const PARLOR_CSS = `
.oa-parlor-control{position:fixed;left:22px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:90}
.oa-parlor-toggle{display:flex;align-items:center;gap:9px;min-height:44px;padding:10px 14px;
  color:#e8e9ff;background:#10134d;border:1px solid #697090;border-radius:2px;
  font:11px/1.3 var(--font-mono,"IBM Plex Mono",ui-monospace,monospace);letter-spacing:.04em;
  cursor:pointer;transition:color var(--dur-micro,.16s),border-color var(--dur-micro,.16s)}
.oa-parlor-toggle:hover{color:#e0b768;border-color:#e0b768}
.oa-parlor-toggle:focus-visible{outline:2px solid #e0b768;outline-offset:4px}
.oa-parlor-toggle[aria-pressed=true]{border-color:#e0b768}
.oa-parlor-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.oa-parlor-error{position:absolute;bottom:calc(100% + 8px);left:0;width:220px;padding:10px 12px;
  background:#10134d;color:#e8e9ff;border:1px solid #697090;font:13px/1.4 var(--font-body,sans-serif)}
.oa-parlor-fact{position:fixed;left:50%;transform:translateX(-50%);max-width:calc(100vw - 32px);
  bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:89;padding:10px 14px;
  background:#10134d;border-top:1px solid #697090;font:10px/1.5 var(--font-mono,ui-monospace,monospace);
  letter-spacing:.12em;color:#b7bce9;text-align:center;pointer-events:none;animation:oa-parlor-press 8s ease both}
@keyframes oa-parlor-press{0%,100%{opacity:0}8%,82%{opacity:1}}
@media(prefers-reduced-motion:reduce){.oa-parlor-toggle{transition:none}.oa-parlor-fact{animation:none}}
@media(max-width:640px){.oa-parlor-control{left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px))}
.oa-parlor-toggle{max-width:190px;padding:10px 12px;font-size:10px}}
@media print{.oa-parlor-control,.oa-parlor-fact{display:none}}
`;
