"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { 
  LazyMotion, 
  domAnimation, 
  m, 
  useMotionValue, 
  useSpring, 
  useTransform, 
  AnimatePresence, 
  useReducedMotion,
  useTime,
  type MotionValue
} from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { ukCard } from "@/lib/academy/tarot-cards-uk";
import { getCardPortalImagePath } from "@/lib/academy/card-images";
import CardInspector from "./CardInspector";
import ReadingScroll from "./ReadingScroll";
import { SPREADS, type Spread, type SpreadPosition } from "@/lib/spreads";
import SpreadChooser from "./SpreadChooser";
import { type Translations } from "@/lib/i18n/translations";
import { useLocale } from "@/lib/i18n/useLocale";

// ── AUDIO ENGINE (Web Audio API) — Pure Harmony Edition ──
class AstralAudio {
  ctx: AudioContext | null = null;
  isMuted = true; // Muted by default to respect user's "awful" feedback

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playHover() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Low-volume harmonic sine
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, this.ctx.currentTime); 
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playSelect() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Dual harmonic sine (Gong/Bowl style, very soft)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, this.ctx.currentTime); // Perfect fifth
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 2.5);
    osc2.stop(this.ctx.currentTime + 2.5);
  }

  playReveal() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 1.0);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 4.0);
  }
}
const audio = new AstralAudio();

// ── NIGHT CARD BACK — engraved white-line on black, bone strokes ──
const NightCardBack = React.memo(function NightCardBack() {
  return (
    <svg
      viewBox="0 0 136 225"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* lapis night ground — the stele deck's stone */}
      <defs>
        <radialGradient id="ncb-sky" cx="50%" cy="38%" r="85%">
          <stop offset="0%" stopColor="#181d7a" />
          <stop offset="55%" stopColor="#10134d" />
          <stop offset="100%" stopColor="#0a0d38" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="136" height="225" fill="url(#ncb-sky)" />
      {/* Milky Way vein — crystalline flecks on the diagonal */}
      <g fill="#b7bce9" opacity="0.5">
        {Array.from({ length: 34 }, (_, i) => {
          const t = i / 33;
          const x = 14 + t * 102 + Math.sin(i * 2.7) * 7;
          const y = 210 - t * 196 + Math.cos(i * 1.9) * 5;
          const r = 0.4 + ((i * 37) % 10) / 14;
          return <circle key={i} cx={x} cy={y} r={r} opacity={0.14 + ((i * 53) % 10) / 22} />;
        })}
      </g>
      {/* drilled gilt stars */}
      <g fill="#e0b768">
        <circle cx="24" cy="30" r="0.9" opacity="0.8" />
        <circle cx="104" cy="48" r="0.7" opacity="0.65" />
        <circle cx="36" cy="188" r="0.7" opacity="0.6" />
        <circle cx="98" cy="170" r="0.9" opacity="0.75" />
        <circle cx="65" cy="52" r="0.6" opacity="0.55" />
        <circle cx="20" cy="120" r="0.6" opacity="0.5" />
        <circle cx="110" cy="112" r="0.6" opacity="0.5" />
      </g>
      {/* double hairline frame */}
      <rect x="5" y="5" width="126" height="215" rx="10" fill="none" stroke="#e8e9ff" strokeOpacity="0.5" strokeWidth="1" />
      <rect x="11" y="11" width="114" height="203" rx="6" fill="none" stroke="#e8e9ff" strokeOpacity="0.22" strokeWidth="0.75" />
      {/* corner marks */}
      <g stroke="#e8e9ff" strokeOpacity="0.55" strokeWidth="0.75" fill="none">
        <path d="M 25 21 v 8 M 21 25 h 8" />
        <path d="M 111 21 v 8 M 107 25 h 8" />
        <path d="M 25 196 v 8 M 21 200 h 8" />
        <path d="M 111 196 v 8 M 107 200 h 8" />
      </g>
      {/* central rosette — eight rays, ember-gold heart */}
      <g fill="none" stroke="#e8e9ff" transform="translate(3 0)">
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
});

function useDeviceTier() {
  const [tier, setTier] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setTier("mobile");
      else if (w < 1100) setTier("tablet");
      else setTier("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return tier;
}

type MachineState = "focusing" | "drawing" | "preparing" | "spread" | "result";

const RITUAL_PHASES = (t: (key: keyof Translations) => string | string[]) => [
  { id: "focusing", label: t("oracle_ritual_focus") },
  { id: "drawing", label: t("oracle_ritual_drawing") },
  { id: "preparing", label: t("oracle_ritual_calibrating") },
  { id: "result", label: t("oracle_ritual_interpreting") }
];

const RitualTimeline = React.memo(function RitualTimeline({ state, isMobile }: { state: MachineState, isMobile: boolean }) {
  const { t } = useLocale();
  const phases = RITUAL_PHASES(t);
  const activeIndex = phases.findIndex(p => p.id === state || (state === "spread" && p.id === "preparing"));
  
  if (isMobile) {
    return (
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-6 items-center">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex flex-col items-center gap-2">
            <m.div
              animate={{
                scale: i <= activeIndex ? 1 : 0.8,
                backgroundColor: i <= activeIndex ? "#e0b768" : "rgba(232,233,255,0.14)"
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
            {i < phases.length - 1 && <div className="w-px h-8 bg-[rgba(232,233,255,0.08)]" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4">
      <div className="flex items-center gap-16 relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-[rgba(232,233,255,0.08)] -translate-y-1/2" />
        <m.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: activeIndex / (phases.length - 1) }}
          className="absolute top-1/2 left-0 w-full h-px bg-[rgba(224,183,104,0.55)] -translate-y-1/2 origin-left"
        />

        {phases.map((phase, i) => (
          <div key={phase.id} className="relative flex flex-col items-center gap-3">
            <m.div
              animate={{
                scale: i === activeIndex ? 1.5 : 1,
                backgroundColor: i <= activeIndex ? "#e0b768" : "rgba(232,233,255,0.14)",
                boxShadow: i === activeIndex ? "0 0 12px rgba(224,183,104,0.4)" : "none"
              }}
              className="w-2 h-2 rounded-full z-10 transition-colors duration-700"
            />
            <span className={`text-[8px] uppercase tracking-[0.3em] transition-all duration-700 ${i === activeIndex ? "text-[#e0b768] font-bold" : "text-[rgba(232,233,255,0.28)]"}`}>
              {phase.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── LAYER 2: GHOST DECK (Magical abundance) ──
const GhostCard = React.memo(function GhostCard({ 
  index, 
  total, 
  device, 
  machineState,
  breathing
}: { 
  index: number, 
  total: number, 
  device: "mobile" | "tablet" | "desktop",
  machineState: MachineState,
  breathing: MotionValue<number>
}) {
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  
  const cardWidth = isMobile ? 100 : isTablet ? 126 : 136;
  const cardHeight = isMobile ? 165 : isTablet ? 210 : 225;

  const { x, y, rotateZ } = useMemo(() => {
    const arcRadius = isMobile ? 800 : isTablet ? 1100 : 1400; 
    const span = Math.PI * (isMobile ? 0.6 : isTablet ? 0.75 : 0.85); 
    const angle = -span / 2 + (span / (total - 1)) * index;
    return {
      x: Math.sin(angle) * arcRadius,
      y: (1 - Math.cos(angle)) * arcRadius * 0.6 + (isMobile ? 112 : 96),
      rotateZ: angle * (180 / Math.PI)
    };
  }, [index, total, isMobile, isTablet]);

  const finalY = useTransform(breathing, (b) => y + b);

  // Ghost cards recede when ritual moves forward
  const baseOpacity = isMobile ? 0.16 : isTablet ? 0.22 : 0.28;
  const opacity = (machineState === "drawing" || machineState === "focusing") ? baseOpacity : 0;

  return (
    <m.div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        marginTop: -cardHeight / 2,
        x,
        y: finalY,
        z: -150,
        rotateZ,
        opacity,
        zIndex: 2,
        pointerEvents: "none",
        border: "1px solid rgba(232, 233, 255, 0.1)",
        background: "rgba(16, 19, 77, 0.45)",
        borderRadius: "14px",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 2, ease: "easeOut" }}
    />
  );
});

const DecorativeRitualField = React.memo(function DecorativeRitualField({ machineState, isMobile }: { machineState: MachineState, isMobile: boolean }) {
  const isVisible = machineState === "focusing" || machineState === "drawing" || machineState === "preparing";
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-[2000ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
       {/* ── THE SACRED CENTER (Focal Field) ── */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] bg-[radial-gradient(ellipse_at_center,_rgba(232,233,255,0.05)_0%,_transparent_72%)] opacity-60" />
       
       {/* ── THE CELESTIAL ORBIT (SVG Thread) ── */}
       {!isMobile && (
         <svg className="absolute inset-0 w-full h-full opacity-12" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
           <path
             d="M 100 650 Q 500 450 900 650"
             fill="none"
             stroke="url(#thread-grad)"
             strokeWidth="0.5"
             strokeDasharray="2 12"
           >
             <animate attributeName="stroke-dashoffset" from="100" to="0" dur="80s" repeatCount="indefinite" />
           </path>
           <defs>
             <linearGradient id="thread-grad" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="transparent" />
               <stop offset="50%" stopColor="#e8e9ff" />
               <stop offset="100%" stopColor="transparent" />
             </linearGradient>
           </defs>
         </svg>
       )}
    </div>
  );
});

export default function FramerTarotOracle() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const time = useTime();
  const prefersReduced = useReducedMotion();

  // Shared breathing motion (subtle global pulse)
  const breathing = useTransform(time, (t) => Math.sin(t / 2000) * 5);

  const [state, setState] = useState<MachineState>("focusing");
  const device = useDeviceTier();
  const isMobile = device === "mobile";
  
  // Use a deterministic subset of cards to prevent hydration mismatches.
  // Luxury Dealer Spread: 7 (mobile), 9 (tablet), 11 (desktop)
  const basePool = device === "mobile" ? 7 : device === "tablet" ? 9 : 11;

  // Ghost Deck Pool: 10 (mobile), 12 (tablet), 15 (desktop)
  const ghostSize = device === "mobile" ? 10 : device === "tablet" ? 12 : 15;
  const ghostIndices = useMemo(() => Array.from({ length: ghostSize }, (_, i) => i), [ghostSize]);
  
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [spread, setSpread] = useState<Spread>(SPREADS[0]);
  const [isMuted, setIsMuted] = useState(true);
  const poolSize = Math.max(basePool, spread.count + 2);
  // A real shuffle of the full 78 — dealt fresh each sitting. The seed
  // rides in the share URL so a restored reading deals the same cards.
  const [deckSeed, setDeckSeed] = useState<number>(() => Math.floor(Math.random() * 1e9));
  const oracleData = useMemo(() => {
    let a = deckSeed | 0;
    const rng = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const deck = [...ALL_CARDS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.slice(0, poolSize);
  }, [deckSeed, poolSize]);

  // Orientation rides the same seed, one stream past the shuffle: a third
  // of the plates fall turned, the house rate the daily card already keeps.
  const reversedFlags = useMemo(() => {
    let a = (deckSeed ^ 0x9e3779b9) | 0;
    const rng = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return Array.from({ length: poolSize }, () => rng() < 1 / 3);
  }, [deckSeed, poolSize]);
  const remainingCards = spread.count - selectedCards.length;

  /* ── THE FORMATION RIG ─────────────────────────────────────────
     Spread positions are given in card-units; the old table multiplied
     them by the UNSCALED card width while drawing the cards 1.78× —
     every large spread collapsed into a pile. The rig measures the
     real bounding box and solves the one scale that fits the stage:
     spacing and card size can no longer disagree. */
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const set = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  const spreadRig = useMemo(() => {
    const cw = device === "mobile" ? 100 : device === "tablet" ? 126 : 136;
    const ch = device === "mobile" ? 165 : device === "tablet" ? 210 : 225;
    const cols = spread.positions.map((p) => p.col);
    const rows = spread.positions.map((p) => p.row);
    const colMin = Math.min(...cols), colMax = Math.max(...cols);
    const rowMin = Math.min(...rows), rowMax = Math.max(...rows);
    const gapX = 1.1, gapY = 0.98;
    const availW = Math.min(viewport.w * 0.9, 1240);
    // The free band: below the room's top chrome, above the sheet's crown.
    // The phone's top chrome is taller — the room title wraps under the bar.
    const bandTop = device === "mobile" ? 122 : 82;
    const sheetTop = viewport.h * (device === "mobile" ? 0.44 : 0.505);
    const availH = Math.max(160, sheetTop - bandTop - 40); // room for the cartouches
    const cap = device === "mobile" ? 1.28 : 1.78;
    const scale = Math.min(
      cap,
      availW / (cw * ((colMax - colMin) * gapX + 1)),
      availH / (ch * ((rowMax - rowMin) * gapY + 1))
    );
    return {
      ux: cw * scale * gapX,
      uy: ch * scale * gapY,
      scale,
      cx: (colMin + colMax) / 2,
      cy: (rowMin + rowMax) / 2,
      // formation bbox centred in the band, not on the screen
      oy: bandTop + availH / 2 + 8 - viewport.h / 2,
    };
  }, [spread, viewport, device]);
  const ukCards = (n: number) => (n >= 2 && n <= 4 ? "карти" : "карт");
  const selectionInstruction =
    locale === "uk"
      ? selectedCards.length === 0
        ? `Оберіть ${spread.count} ${ukCards(spread.count)}`
        : `Залишилось: ${remainingCards}`
      : selectedCards.length === 0
        ? `Choose ${spread.count} cards`
        : `${remainingCards} card${remainingCards === 1 ? "" : "s"} left`;
  const startOverLabel = locale === "uk" ? "Почати знову" : "Start over";
  const resultKicker = locale === "uk" ? spread.nameUk : spread.name;
  const resultIntro = locale === "uk" ? spread.lineUk : spread.line;
  const isUk = locale === "uk";
  const spreadLabels = spread.positions.map((p) => p.label);
  const resultLabels =
    locale === "uk"
      ? ["Що позаду", "Що зараз", "Куди рухатись"]
      : ["What led here", "What is present", "Where to move"];
  const arcanaLabel = locale === "uk" ? "Аркан" : "Arcana";

  const toggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  }, []);

  // Motion value for hover tracking (bypasses React re-renders)
  const hoveredIndexMV = useMotionValue<number>(-1);
  const isTransitioning = useRef(false);

  // Auto-init audio when engine mounts since the user already clicked "Awaken the Deck" in the shell
  useEffect(() => {
    audio.init();
  }, []);

  // Deep-link restore — ONLY on first mount. Re-running on every
  // searchParams change meant our own router.replace (fired when the
  // third card is chosen) flashed the reading early and left the dying
  // result panel hovering over the Reveal button, eating its clicks.
  const didRestoreFromUrl = useRef(false);
  useEffect(() => {
    if (didRestoreFromUrl.current) return;
    didRestoreFromUrl.current = true;
    const drawParam = searchParams.get("draw");
    const spreadParam = searchParams.get("spread");
    const seedParam = searchParams.get("seed");
    const restored = spreadParam ? SPREADS.find((s) => s.id === spreadParam) : null;
    if (restored) setSpread(restored);
    if (seedParam && /^\d{1,10}$/.test(seedParam)) setDeckSeed(Number(seedParam));
    if (drawParam) {
      // Guard against shared/stale URLs pointing past the dealt pool —
      // an out-of-range index used to hard-crash the whole reading.
      // Validate against the RESTORED spread's pool, not the default
      // three-card pool of the very first render (a 12-card year-ahead
      // link would otherwise silently drop index 11 and never restore).
      const want = restored?.count ?? 3;
      const restoredPool = Math.max(basePool, want + 2);
      const indices = drawParam
        .split(",")
        .map(Number)
        .filter(n => Number.isInteger(n) && n >= 0 && n < restoredPool);
      if (indices.length === want) {
        requestAnimationFrame(() => {
          setSelectedCards(indices);
          setState("result"); 
        });
      }
    }
  }, [searchParams, basePool]);

  const updateUrl = useCallback((cards: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cards.length > 0) {
      params.set("draw", cards.join(","));
      params.set("spread", spread.id);
      params.set("seed", String(deckSeed));
    } else {
      params.delete("draw");
      params.delete("spread");
      params.delete("seed");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, spread.id, deckSeed]);

  const handleCardClick = useCallback((id: number) => {
    if (state !== "drawing" || isTransitioning.current) return;
    
    setSelectedCards(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length < spread.count) {
        const newSelected = [...prev, id];
        if (newSelected.length === spread.count) {
          isTransitioning.current = true;
          setState("preparing");
          // router.replace must not run inside the state updater — React
          // flags a Router update during FramerTarotOracle's render.
          setTimeout(() => updateUrl(newSelected), 0);
          setTimeout(() => {
            setState("spread");
            isTransitioning.current = false;
          }, 2400); // 2.4s of "listening for the pattern"
        }
        return newSelected;
      }
      return prev;
    });
  }, [state, updateUrl, spread.count]);

  const reset = useCallback(() => {
    isTransitioning.current = false;
    setState("focusing");
    setSelectedCards([]);
    setDeckSeed(Math.floor(Math.random() * 1e9)); // fresh shuffle each sitting
    updateUrl([]);
    hoveredIndexMV.set(-1);
  }, [updateUrl, hoveredIndexMV]);

  const reveal = useCallback(() => {
    audio.playReveal();
    setState("result");
  }, []);

  /* ── THE SHEET'S OWN SCROLL ──────────────────────────────────
     The reading scrolls inside its shell; gradient fades mark that
     there is more above/below, and a small cue invites the first
     scroll on phones. */
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetEdges, setSheetEdges] = useState({ top: false, bottom: false });
  const [sheetScrolled, setSheetScrolled] = useState(false);

  const measureSheet = useCallback(() => {
    const el = sheetRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight + 4;
    setSheetEdges({
      top: canScroll && el.scrollTop > 6,
      bottom: canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 6,
    });
  }, []);

  const handleSheetScroll = useCallback(() => {
    const el = sheetRef.current;
    if (el && el.scrollTop > 10) setSheetScrolled(true);
    measureSheet();
  }, [measureSheet]);

  useEffect(() => {
    if (state !== "result") {
      setSheetScrolled(false);
      return;
    }
    const el = sheetRef.current;
    if (!el) return;
    measureSheet();
    const ro = new ResizeObserver(measureSheet);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", measureSheet);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureSheet);
    };
  }, [state, measureSheet]);

  // The sheet waits for the plates: flips run 80ms apart, then the
  // sheet rises on its spring.
  const sheetDelay = prefersReduced ? 0 : 0.45 + spread.count * 0.08;

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center bg-[#0a0d38] perspective-[2000px]">

        {/* ── NIGHT GROUND — the innermost room keeps the deepest darkness ── */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(232,233,255,0.035), transparent 34rem), radial-gradient(ellipse at 50% 115%, rgba(224,183,104,0.05), transparent 42rem)",
          }}
        />

        {/* Selection Scrim (Focus focus) */}
        <div className={`absolute inset-0 z-0 bg-[rgba(10,13,56,0.55)] transition-opacity duration-1000 pointer-events-none ${state === "drawing" ? "opacity-100" : "opacity-0"}`} />

        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(183,188,233,0.75) 0 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        />

        {/* ── DECORATIVE FIELD (Orbit & Center) ── */}
        <DecorativeRitualField machineState={state} isMobile={isMobile} />

        {/* ── RITUAL TIMELINE ── */}
        <RitualTimeline state={state} isMobile={isMobile} />

        {/* ── TOP NAV ── */}
        <div className="absolute top-0 inset-x-0 z-50 pt-[4.5rem] pb-8 px-8 flex justify-between items-start pointer-events-none">
           {/* One row: back + audio share the top bar so neither ever
               descends into the card band on small screens. */}
           <div className="pointer-events-auto flex items-center gap-5 sm:gap-7 flex-wrap">
              {state !== "focusing" && (
                 <button
                   onClick={reset}
                   className="min-h-11 text-[10px] tracking-[0.3em] uppercase text-[rgba(232,233,255,0.42)] hover:text-[#e0b768] transition-all duration-500 hover:tracking-[0.4em]"
                 >
                   &larr; {startOverLabel}
                 </button>
              )}
              <button
                onClick={toggleMute}
                aria-pressed={!isMuted}
                className="min-h-11 text-[10px] tracking-[0.3em] uppercase text-[rgba(232,233,255,0.32)] hover:text-[rgba(232,233,255,0.72)] transition-all text-left"
              >
                {locale === "uk"
                  ? isMuted ? "Звук: вимк." : "Звук: увімк."
                  : isMuted ? "Audio: Off" : "Audio: On"}
              </button>
           </div>
           <div className="text-right pointer-events-none">
              <h2 className="[font-family:var(--font-heading),serif] text-2xl font-medium text-[rgba(232,233,255,0.68)]">
                {locale === "uk" ? "Оракул" : "The Oracle"}
              </h2>
              <div className="h-px w-8 bg-[rgba(232,233,255,0.22)] ml-auto mt-2 mb-1" />
              <p className="text-[9px] tracking-[0.4em] uppercase text-[rgba(224,183,104,0.75)]">
                {locale === "uk" ? "Читання таро" : "Tarot reading"}
              </p>
           </div>
        </div>

        {/* ── PROMPT TYPOGRAPHY ── */}
        <AnimatePresence mode="wait">
          {state === "focusing" && (
            <m.div 
              key="focusing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-40 flex flex-col items-center text-center px-6"
            >
              <h2 className="[font-family:var(--font-heading),serif] text-3xl md:text-5xl text-[rgba(232,233,255,0.88)] mb-6 italic">{t("oracle_focus_title")}</h2>
              <p className="night-caption mb-7">
                {isUk
                  ? `Оберіть ${spread.count} карт, потім розкрийте читання.`
                  : `Choose ${spread.count} cards, then reveal the reading.`}
              </p>
              <div className="pointer-events-auto mb-8 w-full">
                <SpreadChooser value={spread} onChange={setSpread} />
              </div>
              <button
                onClick={() => setState("drawing")}
                className="night-btn ghost pointer-events-auto"
              >
                {t("oracle_focus_cta")}
              </button>
            </m.div>
          )}

          {state === "drawing" && (
            <m.div 
              key="drawing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 z-[500] text-center pointer-events-none"
              style={{ top: "calc(50% - 64px)" }}
            >
              <p className="text-[10px] tracking-[0.5em] uppercase text-[rgba(232,233,255,0.55)]">
                {selectionInstruction}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {/* The counter fills in gilt: each dot swells as its card
                    commits, then settles — a small weighted tick. */}
                {Array.from({ length: spread.count }, (_, i) => {
                  const filled = i < selectedCards.length;
                  return (
                    <m.div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      initial={false}
                      animate={
                        filled
                          ? {
                              scale: [1, 2.1, 1.5],
                              backgroundColor: ["rgba(232,233,255,0.2)", "#e0b768", "#e0b768"],
                              boxShadow: [
                                "0 0 0px rgba(224,183,104,0)",
                                "0 0 10px rgba(224,183,104,0.75)",
                                "0 0 3px rgba(224,183,104,0.3)",
                              ],
                            }
                          : {
                              scale: 1,
                              backgroundColor: "rgba(232,233,255,0.2)",
                              boxShadow: "0 0 0px rgba(224,183,104,0)",
                            }
                      }
                      transition={
                        filled
                          ? { duration: 0.6, ease: [0.16, 1, 0.3, 1], times: [0, 0.4, 1] }
                          : { duration: 0.3 }
                      }
                    />
                  );
                })}
              </div>
            </m.div>
          )}

          {state === "preparing" && (
            <m.div 
              key="preparing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute z-40 flex flex-col items-center text-center pointer-events-none"
            >
              <div className="relative mb-8">
                {/* The listening pause breathes gilt — a slow pulse, no flash */}
                <div className="oracle-listen-halo" aria-hidden />
                <div className="oracle-listen-ring" aria-hidden />
                <div className="relative text-3xl text-[#e0b768] animate-spin-slow">✦</div>
              </div>
              <p className="night-caption">
                {t("oracle_preparing_pattern")}
              </p>
              <div className="mt-8 flex gap-1">
                {[0, 1, 2].map(i => (
                  <m.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-[rgba(224,183,104,0.55)]"
                  />
                ))}
              </div>
            </m.div>
          )}

          {state === "spread" && (
            <m.div 
              key="spread"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-[20%] z-40 text-center"
            >
              <p className="text-[9px] tracking-[0.4em] uppercase text-[rgba(232,233,255,0.38)] mb-8">{t("oracle_spread_forming")}</p>
              <button
                onClick={reveal}
                className="night-btn"
              >
                {t("oracle_spread_cta")}
              </button>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── THE ORACLE DECK ENGINE ── */}
        {/* z-10: the dealer's deck must never float above the spread
            chooser or prompt typography (both z-40). */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-0 h-0 pointer-events-auto [transform-style:preserve-3d]">
            {/* 1. GHOST DECK (Wave illusion) */}
            {ghostIndices.map((i) => (
              <GhostCard 
                key={`ghost-${i}`}
                index={i}
                total={ghostSize}
                device={device}
                breathing={breathing}
                machineState={state}
              />
            ))}

            {/* 2. HERO CARDS (Selectable) */}
            {oracleData.map((card, i) => (
              <GodModeCard 
                key={card.name}
                card={card}
                index={i}
                total={oracleData.length}
                machineState={state}
                isSelected={selectedCards.includes(i)}
                selectionIndex={selectedCards.indexOf(i)}
                spreadPositions={spread.positions}
                rig={spreadRig}
                positionLabel={spreadLabels[selectedCards.indexOf(i)] ?? ""}
                hoveredIndexMV={hoveredIndexMV}
                device={device}
                time={time}
                breathing={breathing}
                selectedCount={selectedCards.length}
                canSelect={selectedCards.length < spread.count}
                reversed={reversedFlags[i] ?? false}
                onClick={() => handleCardClick(i)}
                onInspect={() => setInspecting(selectedCards.indexOf(i))}
              />
            ))}
          </div>
        </div>

        <CardInspector
          cards={selectedCards.map((id, i) => ({
            card: oracleData[id],
            label: spreadLabels[i] ?? resultLabels[i],
            reversed: state === "result" && reversedFlags[id],
          }))}
          index={inspecting}
          onClose={() => setInspecting(null)}
          onIndexChange={(i) => setInspecting(i)}
          uk={locale === "uk"}
        />

        {/* ── PRIVATE ARTIFACT RESULT ── */}
        <AnimatePresence>
          {state === "result" && (
            <m.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 72, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ transformOrigin: "50% 100%" }}
              transition={
                prefersReduced
                  ? { duration: 0.2 }
                  : { delay: sheetDelay, type: "spring", stiffness: 120, damping: 19, mass: 0.9 }
              }
              className="result-artifact-panel absolute bottom-0 inset-x-0 z-40 pointer-events-none"
            >
              <div className="result-stack">
                <div className="result-sheet-clip">
                <div
                  ref={sheetRef}
                  onScroll={handleSheetScroll}
                  className={`result-artifact-shell ${state === "result" ? "pointer-events-auto" : "pointer-events-none"}`}
                >
                <p className="result-touch-hint" aria-hidden>
                  {locale === "uk"
                    ? "Карти живі — нахиліть · перетягніть · клік = лупа"
                    : "The plates are alive — tilt · drag · click to magnify"}
                </p>
                <div className="result-artifact-header">
                  <span className="result-artifact-kicker">{resultKicker}</span>
                  <h2>{t("oracle_result_title")}</h2>
                  <p>{resultIntro}</p>
                </div>

                <div className="result-artifact-grid" aria-label={resultKicker}>
                  {selectedCards.map((id, idx) => {
                    const card = oracleData[id];
                    return (
                      <article key={id} className="result-artifact-card">
                        <span>{spreadLabels[idx] ?? resultLabels[idx]}</span>
                        <h3>
                          {(isUk && card && ukCard(card.name)?.name) || card?.name}
                          {reversedFlags[id] && (
                            <em className="result-turned"> · {isUk ? "перевернута" : "turned"}</em>
                          )}
                        </h3>
                        <p>{card?.arcana} {arcanaLabel}</p>
                      </article>
                    );
                  })}
                </div>

                <ReadingScroll
                  spread={spread}
                  draws={selectedCards.map((id) => ({ card: oracleData[id], reversed: reversedFlags[id] }))}
                  onInspect={(i) => setInspecting(i)}
                />

                <div className="result-artifact-next">
                  <Link href="/pricing?from=oracle" className="night-btn">
                    {t("oracle_result_cta")} &rarr;
                  </Link>
                  <p>{t("oracle_result_subtitle")}</p>
                  <small>{t("oracle_result_disclaimer")}</small>
                </div>
                </div>
                {/* edge fades — the sheet says when there is more to read */}
                <div className="result-fade is-top" data-on={sheetEdges.top || undefined} aria-hidden />
                <div className="result-fade is-bottom" data-on={sheetEdges.bottom || undefined} aria-hidden />
                <div
                  className="result-scroll-cue"
                  data-on={(sheetEdges.bottom && !sheetScrolled) || undefined}
                  aria-hidden
                >
                  <span>{locale === "uk" ? "Гортайте" : "Scroll"}</span>
                  <span className="result-scroll-arrow">↓</span>
                </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Room-scoped CSS — night plate vocabulary */}
        <style>{`
          .result-artifact-panel {
            min-height: 44vh;
            padding: 5.5rem 1.25rem max(2rem, env(safe-area-inset-bottom));
            display: flex;
            align-items: flex-end;
            justify-content: center;
            background:
              radial-gradient(ellipse at 50% 100%, rgba(141, 151, 255, 0.14), transparent 40rem),
              linear-gradient(180deg, transparent, rgba(10, 13, 56, 0.72) 20%, rgba(10, 13, 56, 0.94) 100%);
          }

          .result-turned {
            font-size: 0.62em;
            font-style: italic;
            color: rgba(183, 188, 233, 0.66);
          }

          .result-touch-hint {
            margin: 0 0 0.2rem;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.6rem;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: rgba(224, 183, 104, 0.8);
            text-align: center;
            animation: result-hint-breathe 4.2s ease-in-out infinite;
          }

          @keyframes result-hint-breathe {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .result-touch-hint { animation: none; }
          }

          .result-stack {
            position: relative;
            width: min(64rem, 100%);
          }

          /* the clip carries the fades so they sit still while the
             sheet scrolls under them */
          .result-sheet-clip {
            position: relative;
          }

          .result-fade {
            position: absolute;
            left: 1px;
            right: 1px;
            height: 3rem;
            pointer-events: none;
            opacity: 0;
            z-index: 2;
            transition: opacity 400ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .result-fade.is-top {
            top: 1px;
            border-radius: 6px 6px 0 0;
            background: linear-gradient(180deg, rgba(16, 19, 77, 0.96), rgba(16, 19, 77, 0));
          }

          .result-fade.is-bottom {
            bottom: 1px;
            border-radius: 0 0 6px 6px;
            background: linear-gradient(0deg, rgba(16, 19, 77, 0.96), rgba(16, 19, 77, 0));
          }

          .result-fade[data-on] {
            opacity: 1;
          }

          .result-scroll-cue {
            position: absolute;
            bottom: 0.7rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 0.45rem;
            z-index: 3;
            pointer-events: none;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.55rem;
            letter-spacing: 0.26em;
            text-transform: uppercase;
            color: rgba(224, 183, 104, 0.85);
            opacity: 0;
            transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .result-scroll-cue[data-on] {
            opacity: 1;
          }

          .result-scroll-arrow {
            display: inline-block;
            animation: result-cue-dip 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }

          @keyframes result-cue-dip {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(3px); }
          }

          @media (prefers-reduced-motion: reduce) {
            .result-scroll-arrow { animation: none; }
          }

          .result-artifact-shell {
            position: relative;
            width: 100%;
            display: grid;
            gap: 1.35rem;
            padding: clamp(1.3rem, 2.8vw, 2.1rem);
            border: 1px solid rgba(232, 233, 255, 0.16);
            border-radius: 6px;
            background: rgba(16, 19, 77, 0.78);
            box-shadow: 0 1.2rem 2.8rem rgba(5, 7, 32, 0.35);
            /* The sheet keeps to the lower half of the room: the plates
               above stay touchable — the reading scrolls within. */
            max-height: min(46vh, 34rem);
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(232, 233, 255, 0.25) transparent;
          }

          @media (max-width: 700px) {
            .result-artifact-shell {
              max-height: 54vh;
            }
          }

          .result-artifact-header {
            display: grid;
            gap: 0.35rem;
            text-align: center;
            justify-items: center;
          }

          .result-artifact-kicker {
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.64rem;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #e0b768;
          }

          .result-artifact-header h2 {
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-size: clamp(1.9rem, 4vw, 3.8rem);
            line-height: 0.98;
            font-weight: 400;
            color: #e8e9ff;
          }

          .result-artifact-header p {
            max-width: 34rem;
            color: rgba(232, 233, 255, 0.78);
            font-size: 0.95rem;
            line-height: 1.55;
          }

          .result-artifact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
            gap: 0.85rem;
          }

          .result-artifact-card {
            min-height: 8.25rem;
            display: grid;
            align-content: center;
            gap: 0.45rem;
            padding: 1rem;
            text-align: center;
            border: 1px solid rgba(232, 233, 255, 0.12);
            border-radius: 4px;
            background: rgba(24, 29, 122, 0.4);
          }

          .result-artifact-card span {
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.58rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(224, 183, 104, 0.9);
          }

          .result-artifact-card h3 {
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-size: clamp(1.1rem, 2vw, 1.65rem);
            line-height: 1.02;
            color: #e8e9ff;
          }

          .result-artifact-card p {
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.62rem;
            letter-spacing: 0.13em;
            text-transform: uppercase;
            color: rgba(232, 233, 255, 0.42);
          }

          .result-artifact-next {
            display: grid;
            justify-items: center;
            gap: 0.7rem;
            text-align: center;
          }

          .result-artifact-next p {
            max-width: 28rem;
            color: rgba(232, 233, 255, 0.62);
            font-size: 0.78rem;
            line-height: 1.45;
          }

          .result-artifact-next small {
            max-width: 30rem;
            color: rgba(232, 233, 255, 0.36);
            font-size: 0.7rem;
            line-height: 1.45;
          }

          @media (max-width: 640px) {
            .result-artifact-panel {
              min-height: 56vh;
              padding: 4.25rem 0.85rem max(1.35rem, env(safe-area-inset-bottom));
            }

            .result-artifact-shell {
              gap: 1rem;
            }

            .result-artifact-header p {
              font-size: 0.86rem;
            }

            .result-artifact-grid {
              /* two readable chips beat three unreadable ones at 390px */
              grid-template-columns: repeat(auto-fit, minmax(7.2rem, 1fr));
              gap: 0.55rem;
            }

            .result-artifact-card {
              min-height: 6.9rem;
              padding: 0.75rem 0.55rem;
            }

            .result-artifact-card span {
              font-size: 0.55rem;
              letter-spacing: 0.11em;
            }

            .result-artifact-card h3 {
              font-size: 1.05rem;
            }

            .result-artifact-card p {
              font-size: 0.54rem;
              letter-spacing: 0.1em;
            }
          }

          /* Night Card Material — the plate stands on its own; the art
             carries its own carved edge, so no frame is drawn around it. */
          .oracle-night-card {
            background: #0a0d38;
            border: 0;
          }

          /* Selected Card Aura — a single still gilt halo (no pulse) */
          .is-flipping::after {
            content: '';
            position: absolute;
            inset: -20px;
            background: radial-gradient(circle at center, rgba(224, 183, 104, 0.1) 0%, transparent 70%);
            z-index: -1;
            border-radius: 50%;
            opacity: 0.6;
          }

          @keyframes al-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin-slow { animation: al-spin 40s linear infinite; }

          /* The listening pause: a slow gilt breath around the star */
          .oracle-listen-halo {
            position: absolute;
            inset: -2.4rem;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(224, 183, 104, 0.18), transparent 62%);
            animation: oracle-listen 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }

          .oracle-listen-ring {
            position: absolute;
            inset: -1.4rem;
            border-radius: 50%;
            border: 1px solid rgba(224, 183, 104, 0.28);
            animation: oracle-listen-ring 3.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }

          @keyframes oracle-listen {
            0%, 100% { opacity: 0.35; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.06); }
          }

          @keyframes oracle-listen-ring {
            0%, 100% { opacity: 0.2; transform: scale(0.94); }
            50% { opacity: 0.7; transform: scale(1.04); }
          }

          /* Gilt hairline focus ring on the plates themselves */
          [data-oracle-card]:focus-visible {
            outline: 1px solid rgba(224, 183, 104, 0.9);
            outline-offset: 4px;
            border-radius: 14px;
          }

          @media (prefers-reduced-motion: reduce) {
            .animate-spin-slow { animation: none !important; }
            .oracle-listen-halo,
            .oracle-listen-ring { animation: none !important; opacity: 0.6; }
          }
        `}</style>
      </div>
    </LazyMotion>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚡ HIGH-PERFORMANCE CARD: Memoized, Transform-Only, GPU Accelerated
// ─────────────────────────────────────────────────────────────────────────────

const GodModeCard = React.memo(function GodModeCard({ 
  card, 
  index, 
  total, 
  machineState, 
  isSelected,
  selectionIndex,
  spreadPositions,
  rig,
  positionLabel,
  hoveredIndexMV,
  device,
  time,
  breathing,
  canSelect,
  selectedCount,
  reversed = false,
  onInspect,
  onClick
}: {
  card: typeof ALL_CARDS[0],
  index: number,
  total: number,
  machineState: MachineState,
  isSelected: boolean,
  selectionIndex: number,
  spreadPositions: SpreadPosition[],
  rig: { ux: number; uy: number; scale: number; cx: number; cy: number; oy: number },
  positionLabel: string,
  hoveredIndexMV: MotionValue<number>,
  device: "mobile" | "tablet" | "desktop",
  time: MotionValue<number>,
  breathing: MotionValue<number>,
  canSelect: boolean,
  selectedCount: number,
  reversed?: boolean,
  onClick: () => void,
  onInspect?: () => void
}) {
  const isReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  
  // Stable deterministic drift phase (based on index)
  const driftPhase = (index * 1.37) % (Math.PI * 2);
  const driftY = useTransform(time, (t) => {
    if (machineState !== "drawing" || isSelected || isReducedMotion || isMobile) return 0;
    return Math.sin(t / 2500 + driftPhase) * 3;
  });

  const cardWidth = isMobile ? 100 : isTablet ? 126 : 136;
  const cardHeight = isMobile ? 165 : isTablet ? 210 : 225;

  // ── ARC MATHEMATICS (Optimized for Separation) ──
  const { baseArcX, baseArcY, baseArcRotateZ } = useMemo(() => {
    // Desktop: Flatter arc, wider horizontal span
    // Mobile: Tighter arc, narrow horizontal span
    const arcRadius = isMobile ? 800 : isTablet ? 1000 : 1300; 
    const span = Math.PI * (isMobile ? 0.35 : isTablet ? 0.38 : 0.42); 
    
    const angle = -span / 2 + (span / (total - 1)) * index;
    return {
      baseArcX: Math.sin(angle) * arcRadius,
      // 0.55 keeps the outer plates on the table instead of half under it
      baseArcY: (1 - Math.cos(angle)) * arcRadius * 0.55 + (isMobile ? 96 : 80),
      baseArcRotateZ: angle * (180 / Math.PI)
    };
  }, [index, total, isMobile, isTablet]);

  // ── REACTIVE DOCK PHYSICS (Pure MotionValues, NO re-renders) ──
  const dockOffsetX = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return 0;
    const pushFactor = 1 / (Math.abs(dist) + 0.4);
    return Math.sign(dist) * pushFactor * 50;
  });

  const dockOffsetY = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return -90; // Hovered card pulls up significantly
    return Math.abs(dist) * 14; // Others push down slightly
  });

  const dockOffsetZ = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return 220; // Pop hovered card out
    const pushFactor = 1 / (Math.abs(dist) + 0.5);
    return pushFactor * 100; 
  });

  const dockRotateZ = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return -baseArcRotateZ * 0.8; // Straighten slightly but not fully
    return Math.sign(dist) * (1 / (Math.abs(dist) + 0.5)) * 8;
  });

  // ONE owner for scale, forever: a spring MotionValue in style. Handing
  // scale back and forth between framer's animate prop and a MotionValue
  // left plates frozen at their initial scale(0) on real devices.
  const springScale = useSpring(0, { stiffness: 120, damping: 20, mass: 1.0 });

  const dockZIndex = useTransform(hoveredIndexMV, (h) => {
    if (isSelected) return 100 + selectionIndex;
    if (h === index) return 80;
    
    // Depth-stacking: Center cards sit on top of neighbors
    const centerIndex = (total - 1) / 2;
    return Math.round(total - Math.abs(index - centerIndex));
  });

  // ── CALCULATE TARGET LAYOUT STATE ──
  let targetX = 0;
  let targetY = 0;
  let targetZ = 0;
  let targetRotateZ = 0;
  let targetRotateY = 0; 
  let targetScale = 1;
  let targetOpacity = 1;

  if (machineState === "focusing") {
    targetX = 0;
    targetY = 0;
    targetZ = index * -2; 
    targetRotateZ = 0;
    targetScale = 0.8;
    targetOpacity = 0.4; 
  } 
  else if (machineState === "drawing" || machineState === "preparing") {
    targetX = baseArcX;
    targetY = baseArcY;
    targetRotateZ = baseArcRotateZ;
    targetScale = 1;
    targetOpacity = 1;

    if (isSelected) {
      // The row is sized by the cards ON it, not by the spread's final
      // count — the springs re-seat the whole shelf as each new card lands.
      const n = Math.max(1, selectedCount);
      const spacing = isMobile
        ? n > 8 ? 30 : n > 5 ? 52 : 80
        : isTablet
          ? n > 8 ? 56 : n > 5 ? 84 : 116
          : n > 8 ? 82 : n > 5 ? 112 : 150;
      targetX = (selectionIndex - (n - 1) / 2) * spacing;
      targetY = isMobile ? -175 : -200;
      targetZ = 300 + selectionIndex * 10;
      targetRotateZ = (selectionIndex - (n - 1) / 2) * (n > 5 ? 1.5 : 5);
      targetScale = isMobile
        ? n > 8 ? 0.52 : n > 5 ? 0.74 : 1.05
        : isTablet
          ? n > 8 ? 0.56 : n > 5 ? 0.76 : 1.06
          : n > 8 ? 0.68 : n > 5 ? 0.86 : 1.08;
    }
    
    // Recede unselected cards during "preparing"
    if (machineState === "preparing" && !isSelected) {
       targetOpacity = 0;
       targetY += 200;
       targetScale = 0.8;
    }
  } 
  else if (machineState === "spread" || machineState === "result") {
    if (isSelected) {
      // The formation, measured: every position offset by the rig's one
      // true unit, the whole shape centered on its own bounding box.
      const pos = spreadPositions[selectionIndex];
      targetX = ((pos?.col ?? 0) - rig.cx) * rig.ux;
      targetY = ((pos?.row ?? 0) - rig.cy) * rig.uy + rig.oy;
      targetZ = 200;
      // dense formations keep the plates near-square — big fan angles
      // read as a scattered pile at small card sizes
      targetRotateZ = pos?.rotated
        ? 90
        : rig.scale < 0.8
          ? ((selectionIndex % 3) - 1) * 0.8
          : (selectionIndex - 1) * 1.5;
      targetScale = rig.scale;

      if (machineState === "result") {
        targetRotateY = 180;
      }
    } else {
      targetX = baseArcX * 1.5;
      targetY = 1200;
      targetOpacity = 0;
    }
  }

  // ── MERGE DOCK PHYSICS WITH LAYOUT TARGETS ──
  const uiConfig = { stiffness: 120, damping: 20, mass: 1.0 };
  const springX = useSpring(targetX, uiConfig);
  const springY = useSpring(targetY, uiConfig);
  const springZ = useSpring(targetZ, uiConfig);
  const springRotZ = useSpring(targetRotateZ, uiConfig);

  const staticX = useMotionValue(targetX);
  const staticY = useMotionValue(targetY);
  const staticZ = useMotionValue(targetZ);
  const staticRotZ = useMotionValue(targetRotateZ);

  useEffect(() => {
    if (isSelected || machineState === "result" || machineState === "preparing") {
      springX.set(targetX);
      springY.set(targetY);
      springZ.set(targetZ);
      springRotZ.set(targetRotateZ);
    } else {
      staticX.set(targetX);
      staticY.set(targetY);
      staticZ.set(targetZ);
      staticRotZ.set(targetRotateZ);
    }
    springScale.set(targetScale);
  }, [targetX, targetY, targetZ, targetRotateZ, targetScale, isSelected, machineState, springX, springY, springZ, springRotZ, springScale, staticX, staticY, staticZ, staticRotZ]);

  const finalX = useTransform([isSelected ? springX : staticX, dockOffsetX], ([l, d]) => Number(l) + Number(d));
  const finalY = useTransform([isSelected ? springY : staticY, dockOffsetY, breathing, driftY], ([l, d, b, dr]) => Number(l) + Number(d) + Number(b) + Number(dr));
  const finalZ = useTransform([isSelected ? springZ : staticZ, dockOffsetZ], ([l, d]) => Number(l) + Number(d));
  const finalRotateZ = useTransform([isSelected ? springRotZ : staticRotZ, dockRotateZ], ([l, d]) => Number(l) + Number(d));
  const finalScale = useTransform([springScale, hoveredIndexMV], ([s, h]) =>
    !isSelected && machineState === "drawing" && Number(h) === index ? Number(s) * 1.12 : Number(s)
  );

  // ── MAGNETIC PHYSICS (Non-rendering) ──
  const localX = useMotionValue(cardWidth / 2);
  const localY = useMotionValue(cardHeight / 2);
  const isHoveredMV = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(localX, springConfig);
  const smoothY = useSpring(localY, springConfig);

  const rotateX = useTransform(smoothY, [0, cardHeight], [12, -12]);
  const rotateY_tilt = useTransform(smoothX, [0, cardWidth], [-12, 12]);
  
  // Combine magnetic tilt with machine-state rotation.
  // The reveal is a dealt sequence, not a chorus: each plate flips 80ms
  // after the one before it (reduced motion flips all at once).
  const motionRotateY = useSpring(targetRotateY, uiConfig);
  useEffect(() => {
    if (targetRotateY > 0 && selectionIndex > 0 && !isReducedMotion) {
      const id = setTimeout(() => motionRotateY.set(targetRotateY), selectionIndex * 80);
      return () => clearTimeout(id);
    }
    motionRotateY.set(targetRotateY);
  }, [targetRotateY, motionRotateY, selectionIndex, isReducedMotion]);

  const finalRotateY = useTransform([isHoveredMV, rotateY_tilt, motionRotateY], ([h, rt, my]) => {
     // Once flipped, the plate still answers the hand: the tilt rides on
     // top of the 180° reveal (sign inverted — the face is mirrored).
     if (Number(my) > 90) return Number(my) - (Number(h) > 0.5 ? Number(rt) : 0);
     return Number(h) > 0.5 ? Number(rt) : Number(my);
  });

  // Moonlight on the revealed face, sliding opposite the tilt.
  const glareX = useTransform(smoothX, [0, cardWidth], [cardWidth * 0.34, -cardWidth * 0.34]);
  const glareY = useTransform(smoothY, [0, cardHeight], [cardHeight * 0.3, -cardHeight * 0.3]);
  const glareOpacity = useTransform(isHoveredMV, [0, 1], [0, 1]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isReducedMotion || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    localX.set(e.clientX - rect.left);
    localY.set(e.clientY - rect.top);
  }, [isReducedMotion, localX, localY, isMobile]);

  const handlePointerEnter = useCallback(() => {
    if (machineState === "drawing" && !isSelected) {
      hoveredIndexMV.set(index);
      audio.playHover();
    }
    isHoveredMV.set(1);
  }, [machineState, isSelected, hoveredIndexMV, index, isHoveredMV]);

  const handlePointerLeave = useCallback(() => {
    if (hoveredIndexMV.get() === index) {
      hoveredIndexMV.set(-1);
    }
    isHoveredMV.set(0);
    localX.set(cardWidth / 2);
    localY.set(cardHeight / 2);
  }, [hoveredIndexMV, index, localX, localY, cardWidth, cardHeight, isHoveredMV]);

  const handleInteraction = () => {
    audio.init();
    if (machineState === "result" && isSelected) {
      onInspect?.();
      return;
    }
    if (machineState === "drawing" && !isSelected && canSelect) {
      audio.playSelect();
    }
    onClick();
  };

  // Once revealed, the plate behaves like an object on the table: it can
  // be nudged around, and a click lifts it under the loupe.
  const isLiftable = machineState === "result" && isSelected;

  // ── THE REVEAL EDGE GLARE ──
  const edgeGlareOpacity = useTransform(motionRotateY, [0, 80, 90, 100, 180], [0, 0, 1, 0, 0]);

  // Mobile renders the card flat (no preserve-3d), which resets the
  // backface accumulation at the flat boundary — both faces resolve
  // front-facing and the BACK paints over the art after the flip. On
  // flat devices the faces swap by flip progress instead.
  const backFaceOpacity = useTransform(motionRotateY, (r) => (!isMobile || Number(r) <= 90 ? 1 : 0));
  const frontFaceOpacity = useTransform(motionRotateY, (r) => (!isMobile || Number(r) > 90 ? 1 : 0));

  // Dealt-in: each card leaves the deck point 40ms after the one before.
  const staggerDelay = machineState === "drawing" && !isSelected ? 0.08 + index * 0.04 : 0;

  const finalRotateX = useTransform([isHoveredMV, rotateX], ([h, rx]) => {
    if (isSelected && machineState !== 'drawing') return rx;
    return Number(h) > 0.5 ? rx : 0;
  });

  return (
    <m.div
      data-oracle-card={index}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleInteraction}
      role="button"
      tabIndex={machineState === "drawing" || isSelected ? 0 : -1}
      aria-pressed={isSelected}
      aria-label={
        isLiftable
          ? `${card.name} — inspect the plate`
          : `${card.name}${isSelected ? " — chosen" : " — face-down card"}`
      }
      drag={isLiftable}
      dragMomentum={false}
      dragElastic={0.14}
      dragConstraints={{ left: -260, right: 260, top: -160, bottom: 160 }}
      whileDrag={{ zIndex: 60, scale: 1.04 }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleInteraction();
        }
      }}
      className={`absolute top-1/2 left-1/2 cursor-pointer oracle-night-card ${isSelected ? "is-flipping" : ""}`}
      style={{
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        marginTop: -cardHeight / 2,
        zIndex: dockZIndex,
        x: isSelected || machineState === "preparing" ? finalX : targetX,
        y: isSelected || machineState === "preparing" ? finalY : targetY,
        z: isMobile ? 0 : (isSelected ? finalZ : targetZ),
        rotateZ: isSelected || machineState === "preparing" ? finalRotateZ : targetRotateZ,
        rotateX: finalRotateX,
        rotateY: finalRotateY,
        scale: finalScale,
        transformStyle: isMobile ? "flat" : "preserve-3d",
        WebkitTransformStyle: isMobile ? "flat" : "preserve-3d",
        willChange: isSelected || machineState === "drawing" ? "transform" : "auto",
        }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: targetOpacity,
        x: isSelected || machineState === "preparing" ? undefined : targetX,
        y: isSelected || machineState === "preparing" ? undefined : targetY,
        z: isSelected || machineState === "preparing" ? undefined : targetZ,
        rotateZ: isSelected || machineState === "preparing" ? undefined : targetRotateZ,
      }}
      transition={
        isReducedMotion 
          ? { duration: 0.1 } 
          : { duration: 0.5, delay: staggerDelay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="relative w-full h-full rounded-[14px] shadow-[0_10px_30px_rgba(5,7,32,0.5)]" style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}>
        
        {/* EDGE GLARE */}
        <m.div
          className="absolute inset-y-0 left-1/2 w-[2px] bg-[rgba(232,233,255,0.3)] -ml-[1px] shadow-[0_0_20px_rgba(232,233,255,0.28)] z-50 pointer-events-none"
          style={{ opacity: edgeGlareOpacity }}
        />

        {/* BACK: ENGRAVED NIGHT PLATE */}
        <m.div
          className="absolute inset-0 rounded-[14px] overflow-hidden [backface-visibility:hidden] will-change-transform"
          style={{
            opacity: backFaceOpacity,
            transform: 'translateZ(0.1px)',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: '#0a0d38'
          }}
        >
          {/* Inner Highlight */}

          <NightCardBack />
        </m.div>

        {/* FRONT: LAZY LOADED ACTUAL IMAGES.
            On mobile the card is flat: the face's own 180° makes it
            back-facing in its local context, so backface-hidden would
            erase it — visibility is handled by the opacity swap there,
            and the parent's flattened 180° un-mirrors the art. */}
        <m.div
          className="absolute inset-0 rounded-[14px] overflow-hidden will-change-transform"
          style={{
            opacity: frontFaceOpacity,
            transform: 'rotateY(180deg) translateZ(0.1px)',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            backfaceVisibility: isMobile ? 'visible' : 'hidden',
            WebkitBackfaceVisibility: isMobile ? 'visible' : 'hidden',
            background: '#0a0d38'
          }}
        >


           {/* Only load the image when it's selected (about to flip) or flipped to save massive network requests */}
           {(isSelected || machineState === "result") && (
             <div
               className="relative w-full h-full"
               style={reversed ? { transform: "rotate(180deg)" } : undefined}
             >
               <Image
                 src={getCardPortalImagePath(card)}
                 alt={reversed ? `${card.name} — reversed` : card.name}
                 fill
                 quality={100}
                 sizes={isMobile ? "180px" : "240px"}
                 loading={isSelected || machineState === "result" ? "eager" : "lazy"}
                 className={`absolute inset-0 w-full h-full object-cover z-[2] transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                 onLoad={() => setImageLoaded(true)}
                 style={{
                   imageRendering: "auto",
                   transform: "translateZ(0)",
                   backfaceVisibility: "hidden",
                   WebkitBackfaceVisibility: "hidden",
                   transformStyle: "preserve-3d",
                   WebkitTransformStyle: "preserve-3d"
                 }}
               />
             </div>
           )}
           
           {/* Moonlight glare — the plate catches the lamp as it tilts */}
           {isLiftable && !isReducedMotion && !isMobile && (
             <m.div
               aria-hidden
               className="absolute inset-[-30%] z-[3] pointer-events-none"
               style={{
                 x: glareX,
                 y: glareY,
                 opacity: glareOpacity,
                 mixBlendMode: "screen",
                 background:
                   "radial-gradient(42% 34% at 50% 46%, rgba(232,233,255,0.2), rgba(232,233,255,0.06) 44%, transparent 72%)",
               }}
             />
           )}

           {/* Fallback typography while image loads or if it fails */}
           <div className="absolute inset-3 border-[0.5px] border-[rgba(232,233,255,0.24)] rounded-lg flex flex-col items-center justify-between py-4 px-2 z-[1] opacity-60">
              <div className="text-[rgba(224,183,104,0.85)] text-[6px] tracking-[0.4em] uppercase text-center">{card.arcana} Arcana</div>
              <div className="text-center">
                <div className="text-[#e8e9ff] [font-family:var(--font-heading),serif] text-sm leading-tight tracking-wide">{card.name}</div>
              </div>
           </div>
        </m.div>
      </div>

      {/* Position cartouche — the formation is unreadable without its
          names once ten plates stand on the table. Counter-flipped in
          result so the text survives the card's own 180° reveal. */}
      {isSelected && positionLabel && (machineState === "spread" || machineState === "result") && (() => {
        const dense = rig.scale < 0.8;
        if (dense) {
          // Dense formations: the cartouche prints ON the plate's foot —
          // a night chip that can never collide with a neighbouring card.
          return (
            <div
              aria-hidden
              className="absolute left-1/2 pointer-events-none text-center uppercase [font-family:var(--font-mono),monospace]"
              style={{
                bottom: "3.5%",
                width: "92%",
                fontSize: 8.5 / rig.scale,
                letterSpacing: "0.14em",
                lineHeight: 1.4,
                padding: `${3 / rig.scale}px ${4 / rig.scale}px`,
                background: "rgba(10,13,56,0.78)",
                border: "1px solid rgba(232,233,255,0.14)",
                color: "rgba(232,233,255,0.88)",
                // counter-rotate FIRST, then lift — inside the flipped
                // plate a bare +Z would point away from the viewer
                transform: `translateX(-50%)${machineState === "result" ? " rotateY(180deg)" : ""} translateZ(3px)`,
                zIndex: 5,
              }}
            >
              {positionLabel}
            </div>
          );
        }
        return (
          <div
            aria-hidden
            className="absolute left-1/2 top-full pointer-events-none text-center uppercase whitespace-nowrap [font-family:var(--font-mono),monospace]"
            style={{
              fontSize: 9.5 / rig.scale,
              letterSpacing: "0.16em",
              marginTop: 6 / rig.scale,
              color: "rgba(183,188,233,0.8)",
              transform: `translateX(-50%)${machineState === "result" ? " rotateY(180deg)" : ""}`,
            }}
          >
            {positionLabel}
          </div>
        );
      })()}
    </m.div>
  );
});
