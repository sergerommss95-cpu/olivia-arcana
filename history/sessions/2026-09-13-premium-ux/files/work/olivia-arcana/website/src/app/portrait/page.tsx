/**
 * The Birth Chart — night room.
 *
 * Full birth data: year, month, day, hour, minute, city. Computes the real
 * natal chart client-side and engraves it as a wheel of houses — bone
 * strokes on the night plate, the homepage's WheelDiagram language
 * inverted. No shaders, no glass: hairlines, hatching, one ember accent.
 */

"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import NightShell from "@/components/almanac/NightShell";
import { computeNatalChart, type NatalChart, type BirthInput } from "@/lib/natal-chart";
import { engineChart, engineEnabled, fmtLongitude, type EngineChart } from "@/lib/engine";
import { saveUser } from "@/lib/user-store";
import { moonPath } from "@/lib/almanac-today";
import BirthDataForm, { type BirthFormValue, type BirthDataFormCopy } from "@/components/birth/BirthDataForm";
import { utcOffsetHours } from "@/lib/cities";
import { getPlanetInSign, PLANET_MEANING, HOUSE_MEANING } from "@/lib/planet-interpretations";
import { useLocale } from "@/lib/i18n/useLocale";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const COPY = {
  en: {
    room: "The Meridian Glass",
    kicker: "Plate II · The Birth Chart",
    title: "Draw your birth chart.",
    lead: "Date, hour, and place, drawn as a wheel — the baseline every personal reading in this almanac stands on.",
    nameLabel: "Your name (optional)",
    namePlaceholder: "Name",
    dateLabel: "Birth date *",
    timeLabel: "Birth time *",
    timeUnknownOn: "✓ Using noon — the rising sign is left unmarked",
    timeUnknownOff: "I don't know my birth time",
    cityLabel: "Birth city *",
    cityPlaceholder: "e.g. Kyiv, New York, Tokyo",
    generate: "Draw your portrait",
    figCaption: "Fig. 2 — the wheel of houses",
    wheelAria: "Natal chart wheel",
    chartOwn: "Your birth chart",
    chartOf: (name: string) => `${name}'s birth chart`,
    metaDominant: (v: string) => `${v} dominant`,
    metaEnergy: (v: string) => `${v} energy`,
    metaPattern: (v: string) => `${v} pattern`,
    metaMoon: (v: string) => `${v} at birth`,
    download: "Download the plate",
    exportFailed: "The plate would not press — try again, or take a screenshot.",
    tzLine: (city: string, off: string, summer: boolean) =>
      `computed for ${city} · ${off}${summer ? " (summer time)" : ""}`,
    decodeShow: "Full chart decode",
    decodeHide: "Hide chart decode",
    newChart: "New chart",
    bigThree: [
      { label: "Core identity" },
      { label: "Emotional nature" },
      { label: "How others see you" },
    ],
    risingSub: "Your mask. The energy you project before people know you.",
    planetsLabel: "Your planets",
    houseWord: "House",
    retro: "℞ retrograde",
    inHouse: (area: string, rules: string) => `In your ${area} house — ${rules}`,
    elementLabel: "Element balance",
    modalityLabel: "Modality balance",
    aspectsLabel: "Key aspects",
    lifeThemeLabel: "Your life theme",
    soulLabel: "Soul direction",
    viewChart: "Open the interactive wheel",
    form: {
      fig: "Fig. 1 — the birth data",
      nameLabel: "Your name (optional)",
      namePlaceholder: "Name",
      dateLabel: "Birth date",
      dayPh: "DD",
      monthPh: "MM",
      yearPh: "YYYY",
      timeLabel: "Birth time",
      timeUnknownOff: "I don't know my birth time",
      timeUnknownOn: "✓ Using noon — the rising sign is left unmarked",
      noonNote: "12:00 assumed",
      cityLabel: "Birth city",
      cityPlaceholder: "e.g. Kyiv, New York, Tokyo",
      cityNone: "no city found — try the nearest large city",
      submit: "Draw your portrait",
      submitAsleep: "date · time · place complete the plate",
    } as Partial<BirthDataFormCopy>,
  },
  uk: {
    room: "Меридіанне скло",
    kicker: "Таблиця II · Натальна карта",
    title: "Накресліть свою натальну карту.",
    lead: "Дата, година й місце, накреслені колесом — основа кожного особистого читання в цьому альманасі.",
    nameLabel: "Ваше ім'я (необов'язково)",
    namePlaceholder: "Ім'я",
    dateLabel: "Дата народження *",
    timeLabel: "Час народження *",
    timeUnknownOn: "✓ Береться полудень — знак Асценденту не позначається",
    timeUnknownOff: "Я не знаю часу свого народження",
    cityLabel: "Місто народження *",
    cityPlaceholder: "напр. Київ, Нью-Йорк, Токіо",
    generate: "Накреслити карту",
    figCaption: "Мал. 2 — колесо домів",
    wheelAria: "Колесо натальної карти",
    chartOwn: "Ваша натальна карта",
    chartOf: (name: string) => `Натальна карта — ${name}`,
    metaDominant: (v: string) => `Домінанта — ${v}`,
    metaEnergy: (v: string) => `Енергія — ${v}`,
    metaPattern: (v: string) => `Патерн — ${v}`,
    metaMoon: (v: string) => `${v} при народженні`,
    download: "Завантажити гравюру",
    exportFailed: "Не вдалося відтиснути гравюру — спробуйте ще раз або зробіть знімок екрана.",
    tzLine: (city: string, off: string, summer: boolean) =>
      `обчислено для: ${city} · ${off}${summer ? " (літній час)" : ""}`,
    decodeShow: "Повне тлумачення карти",
    decodeHide: "Сховати тлумачення",
    newChart: "Нова карта",
    bigThree: [
      { label: "Ядро особистості" },
      { label: "Емоційна природа" },
      { label: "Як вас бачать інші" },
    ],
    risingSub: "Ваша маска. Енергія, яку ви випромінюєте, перш ніж вас упізнають.",
    planetsLabel: "Ваші планети",
    houseWord: "Дім",
    retro: "℞ ретроградний",
    inHouse: (area: string, rules: string) => `У домі «${area}» — ${rules}`,
    elementLabel: "Баланс стихій",
    modalityLabel: "Баланс модальностей",
    aspectsLabel: "Ключові аспекти",
    lifeThemeLabel: "Тема вашого життя",
    soulLabel: "Напрям душі",
    viewChart: "Відкрити інтерактивне колесо",
    form: {
      fig: "Мал. 1 — дані народження",
      nameLabel: "Ваше ім'я (необов'язково)",
      namePlaceholder: "Ім'я",
      dateLabel: "Дата народження",
      dayPh: "ДД",
      monthPh: "ММ",
      yearPh: "РРРР",
      timeLabel: "Час народження",
      timeUnknownOff: "Я не знаю часу свого народження",
      timeUnknownOn: "✓ Береться полудень — знак Асценденту не позначається",
      noonNote: "приймається 12:00",
      cityLabel: "Місто народження",
      cityPlaceholder: "напр. Київ, Нью-Йорк, Токіо",
      cityNone: "місто не знайдено — спробуйте найближче велике місто",
      tzLine: (city: string, off: string, summer: boolean) =>
        `обчислено для: ${city} · ${off}${summer ? " (літній час)" : ""}`,
      submit: "Накреслити карту",
      submitAsleep: "дата · час · місце завершують гравюру",
    } as Partial<BirthDataFormCopy>,
  },
};

/* ── DignityBadge — mono chip on a hairline ─────────────────────── */
function DignityBadge({ dignity }: { dignity: string }) {
  if (dignity === "peregrine") return null;
  const lifted = dignity === "domicile" || dignity === "exaltation";
  return (
    <span
      className="bc-dignity"
      style={{ color: lifted ? "var(--ember)" : "var(--bone-faint)" }}
    >
      {dignity}
    </span>
  );
}

/* ── NatalWheel — the chart engraved: bone strokes on night ───────
 *
 * The homepage's WheelDiagram language, inverted. Ascendant sits at
 * nine o'clock; the zodiac runs counterclockwise, true to the plate
 * tradition. Sign ring, house ring, planet band, aspect chords, and
 * the birth moon hatched at the hub. Draw-in etch honours
 * prefers-reduced-motion (CSS lives on the page root).
 */
function NatalWheel({ chart, ariaLabel }: { chart: NatalChart; ariaLabel: string }) {
  const C = 220;
  // Unknown birth time → no ascendant: the wheel still draws (0° Aries at
  // nine o'clock), but houses and axes stay off the plate.
  const hasAsc = chart.ascendant != null && chart.midheaven != null;
  const asc = chart.ascendant?.longitude ?? 0;

  /** Ecliptic longitude → point at radius r (Asc left, zodiac CCW). */
  const pt = (lon: number, r: number) => {
    const a = ((180 + (lon - asc)) * Math.PI) / 180;
    return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) };
  };

  // Planet band: nudge crowded glyphs apart, keep true longitudes for ticks/chords.
  const placed = [...chart.planets]
    .sort((a, b) => a.longitude - b.longitude)
    .map((p) => ({ p, lon: p.longitude }));
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < placed.length; i++) {
      if (placed[i].lon - placed[i - 1].lon < 9) placed[i].lon = placed[i - 1].lon + 9;
    }
  }

  const mc = chart.midheaven?.longitude ?? 0;
  const ascP0 = pt(asc, 208);
  const ascP1 = pt(asc + 180, 208);
  const mcP0 = pt(mc, 208);
  const mcP1 = pt(mc + 180, 208);
  const ascLabel = pt(asc, 203);
  const mcLabel = pt(mc, 203);

  const f = Math.min(1, Math.max(0, chart.moonPhase.illumination / 100));
  const waxing = chart.moonPhase.age < 14.765;
  const lit = moonPath(C, C, 16, f, waxing);

  return (
    <svg viewBox="0 0 440 440" className="bc-wheel-svg" role="img" aria-label={ariaLabel}>
      <defs>
        <pattern id="bc-hatch" width="2.6" height="2.6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="2.6" stroke="currentColor" strokeWidth="0.55" />
        </pattern>
      </defs>

      {/* Rings */}
      <g fill="none" stroke="currentColor">
        <circle className="etch" style={{ "--ei": 0 } as React.CSSProperties} pathLength={1} cx={C} cy={C} r="196" strokeWidth="1" />
        <circle className="etch" style={{ "--ei": 1 } as React.CSSProperties} pathLength={1} cx={C} cy={C} r="168" strokeWidth="0.6" />
        <circle className="etch" style={{ "--ei": 2 } as React.CSSProperties} pathLength={1} cx={C} cy={C} r="140" strokeWidth="0.6" />
        <circle className="etch" style={{ "--ei": 3 } as React.CSSProperties} pathLength={1} cx={C} cy={C} r="92" strokeWidth="0.6" />
      </g>

      {/* Sign boundaries + degree ticks */}
      <g fill="none" stroke="currentColor">
        {Array.from({ length: 12 }, (_, i) => {
          const a = pt(i * 30, 168);
          const b = pt(i * 30, 196);
          return (
            <line
              key={`sb-${i}`}
              className="etch"
              style={{ "--ei": 4 + i * 0.12 } as React.CSSProperties}
              pathLength={1}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              strokeWidth="0.6"
            />
          );
        })}
        {Array.from({ length: 36 }, (_, i) => {
          if (i % 3 === 0) return null;
          const a = pt(i * 10, 168);
          const b = pt(i * 10, 174);
          return (
            <line key={`tk-${i}`} className="sfade" style={{ "--ei": 5.5, "--o": 0.55 } as React.CSSProperties} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth="0.5" />
          );
        })}
      </g>

      {/* Sign glyphs */}
      <g fill="currentColor" fontSize="15" textAnchor="middle" dominantBaseline="central" fontFamily="serif">
        {SIGN_GLYPHS.map((glyph, i) => {
          const g = pt(i * 30 + 15, 182);
          const isSun = chart.sunSign === SIGN_NAMES[i];
          return (
            <text
              key={`sg-${i}`}
              className="sfade"
              style={{ "--ei": 6 + i * 0.1, "--o": isSun ? 1 : 0.85 } as React.CSSProperties}
              x={g.x} y={g.y}
              fill={isSun ? "var(--ember)" : "currentColor"}
            >
              {glyph + "\uFE0E"}
            </text>
          );
        })}
      </g>

      {/* House cusps + numbers — only with a known birth time */}
      <g>
        {hasAsc && chart.houses.map((h, i) => {
          const a = pt(h.cusp, 140);
          const b = pt(h.cusp, 168);
          const next = chart.houses[(i + 1) % 12];
          const midLon = h.cusp + (((next.cusp - h.cusp + 360) % 360) / 2);
          const n = pt(midLon, 154);
          return (
            <g key={`h-${h.number}`}>
              <line className="etch" style={{ "--ei": 8 + i * 0.08 } as React.CSSProperties} pathLength={1} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
              <text className="sfade" style={{ "--ei": 9 + i * 0.06, "--o": 0.55 } as React.CSSProperties} x={n.x} y={n.y} fill="currentColor" fontSize="9" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono, ui-monospace), monospace">
                {h.number}
              </text>
            </g>
          );
        })}
      </g>

      {/* Axes: Ascendant + Midheaven */}
      {hasAsc && <g stroke="currentColor" fill="currentColor">
        <line className="etch" style={{ "--ei": 10 } as React.CSSProperties} pathLength={1} x1={ascP0.x} y1={ascP0.y} x2={ascP1.x} y2={ascP1.y} strokeWidth="0.7" strokeDasharray="2 4" opacity="0.7" />
        <line className="etch" style={{ "--ei": 10.4 } as React.CSSProperties} pathLength={1} x1={mcP0.x} y1={mcP0.y} x2={mcP1.x} y2={mcP1.y} strokeWidth="0.7" strokeDasharray="2 4" opacity="0.7" />
        <text className="sfade" style={{ "--ei": 10.8 } as React.CSSProperties} x={ascLabel.x} y={ascLabel.y - 7} fontSize="8.5" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono, ui-monospace), monospace" stroke="none" fill="var(--ember)" letterSpacing="1">
          AC
        </text>
        <text className="sfade" style={{ "--ei": 11, "--o": 0.7 } as React.CSSProperties} x={mcLabel.x} y={mcLabel.y - 7} fontSize="8.5" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono, ui-monospace), monospace" stroke="none" fill="currentColor" letterSpacing="1">
          MC
        </text>
      </g>}

      {/* Aspect chords — ember for tense, bone for harmonious */}
      <g className="sfade" style={{ "--ei": 13 } as React.CSSProperties} fill="none">
        {chart.aspects.slice(0, 14).map((a, i) => {
          const p1 = chart.planets.find((p) => p.name === a.planet1);
          const p2 = chart.planets.find((p) => p.name === a.planet2);
          if (!p1 || !p2) return null;
          const s = pt(p1.longitude, 92);
          const e = pt(p2.longitude, 92);
          const tense = a.harmony === "tense";
          return (
            <line
              key={`asp-${i}`}
              x1={s.x} y1={s.y} x2={e.x} y2={e.y}
              stroke={tense ? "var(--ember)" : "currentColor"}
              strokeWidth="0.5"
              opacity={tense ? 0.55 : 0.35}
              strokeDasharray={a.type === "opposition" || a.type === "square" ? "3 3" : undefined}
            />
          );
        })}
      </g>

      {/* Planets */}
      <g>
        {placed.map(({ p, lon }, i) => {
          const tickA = pt(p.longitude, 140);
          const tickB = pt(p.longitude, 133);
          const g = pt(lon, 114);
          const isSun = p.name === "Sun";
          return (
            <g key={p.name} className="sfade" style={{ "--ei": 11.5 + i * 0.12 } as React.CSSProperties}>
              <line x1={tickA.x} y1={tickA.y} x2={tickB.x} y2={tickB.y} stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
              {isSun ? (
                <>
                  <circle cx={g.x} cy={g.y} r="8" fill="var(--sheet, #1b1710)" stroke="var(--ember)" strokeWidth="1" />
                  <circle cx={g.x} cy={g.y} r="2.2" fill="var(--ember)" />
                </>
              ) : (
                <text
                  x={g.x} y={g.y}
                  fill="currentColor"
                  fontSize={p.name === "Moon" ? 15 : 13}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="serif"
                >
                  {p.glyph + "\uFE0E"}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* The birth moon, hatched at the hub */}
      <g className="sfade" style={{ "--ei": 14 } as React.CSSProperties}>
        <circle cx={C} cy={C} r="16" fill="url(#bc-hatch)" opacity="0.5" />
        {lit && <path d={lit} fill="var(--bone, #e8dcc8)" opacity="0.9" />}
        <circle cx={C} cy={C} r="16" fill="none" stroke="currentColor" strokeWidth="1" />
      </g>
    </svg>
  );
}

export default function PortraitPage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";
  const copy = isUk ? COPY.uk : COPY.en;

  // Result state
  const [chart, setChart] = useState<NatalChart | null>(null);
  // The press's own figures — true ephemeris, houses, retrogrades.
  // Null = engine unreachable; the client chart stands as provisional.
  const [press, setPress] = useState<EngineChart | null>(null);
  const [phase, setPhase] = useState<"input" | "generating" | "revealed">("input");
  const [showDecode, setShowDecode] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  const generate = useCallback((v: BirthFormValue) => {
    const [y, m, d] = v.date.split("-").map(Number);
    if (!y || !m || !d) return;

    const hour = v.timeUnknown ? 12 : parseInt(v.time.split(":")[0] || "12");
    const minute = v.timeUnknown ? 0 : parseInt(v.time.split(":")[1] || "0");

    // Historical offset for that wall-clock instant (DST, zone reforms);
    // the fixed city offset stands in only if the runtime lacks the zone.
    const zoneOff = utcOffsetHours(v.city.zone, y, m, d, hour, minute);
    const timezone = Number.isFinite(zoneOff) ? zoneOff : v.city.tz;

    const input = {
      year: y, month: m, day: d,
      hour, minute,
      latitude: v.city.lat, longitude: v.city.lon, timezone,
      timeKnown: !v.timeUnknown,
      name: v.name,
      city: v.city.name,
    } as BirthInput;

    const natalChart = computeNatalChart(input);
    saveUser(input, natalChart); // persist for other pages
    setChart(natalChart);
    setPress(null);
    if (engineEnabled()) {
      engineChart(input).then((ec) => {
        if (ec) setPress(ec);
      });
    }
    setPhase("generating");

    // Fire the Cosmic Identity Panel reveal — ConstellationOverlay listens
    // for `zodiac:click` when mounted. 1.4s delay so the reader sees the
    // wheel engrave first.
    {
      const idx = SIGN_NAMES.findIndex(
        (n) => n.toLowerCase() === (natalChart.sunSign || "").toLowerCase(),
      );
      const glyph = SIGN_GLYPHS[idx] || "✦";
      if (idx >= 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("zodiac:click", {
            detail: { name: SIGN_NAMES[idx], glyph, index: idx },
          }));
        }, 1400);
      }
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("revealed");
      return;
    }

    // Fade out the form, then reveal
    overlayRef.current?.animate(
      [{ opacity: "1" }, { opacity: "0" }],
      { duration: 600, easing: EASE, fill: "forwards" }
    );
    setTimeout(() => {
      setPhase("revealed");
    }, 800);
  }, []);

  const figureRef = useRef<HTMLElement | null>(null);

  /** Serialize the wheel SVG, rasterize at 2×, hand over a PNG. */
  const download = useCallback(() => {
    const fail = () => alert(copy.exportFailed);
    try {
      const svgEl = figureRef.current?.querySelector("svg");
      if (!svgEl) return fail();
      const cs = getComputedStyle(svgEl);
      const SIZE = 880; // 2× the 440 viewBox
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(SIZE));
      clone.setAttribute("height", String(SIZE));
      // Resolve currentColor + the night-register custom properties, so the
      // standalone SVG rasterizes with the plate's true ink.
      const vars = ["--ember", "--bone", "--bone-soft", "--bone-faint", "--sheet", "--night-deep", "--hairline"]
        .map((v) => {
          const val = cs.getPropertyValue(v).trim();
          return val ? `${v}:${val};` : "";
        })
        .join("");
      clone.setAttribute("style", `color:${cs.color};${vars}`);
      const xml = new XMLSerializer().serializeToString(clone);
      const svgUrl = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no 2d context");
          ctx.fillStyle = cs.getPropertyValue("--night-deep").trim() || "#12100b";
          ctx.fillRect(0, 0, SIZE, SIZE);
          ctx.drawImage(img, 0, 0, SIZE, SIZE);
          URL.revokeObjectURL(svgUrl);
          canvas.toBlob((blob) => {
            if (!blob) return fail();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "olivia-portrait.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          }, "image/png");
        } catch {
          URL.revokeObjectURL(svgUrl);
          fail();
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        fail();
      };
      img.src = svgUrl;
    } catch {
      fail();
    }
  }, [copy.exportFailed]);

  const reset = useCallback(() => {
    setChart(null);
    setPhase("input");
    setShowDecode(false);
  }, []);

  // No ascendant (unknown birth time) → no rising card asserted.
  const bigThree = chart
    ? [
        { glyph: "☉", planet: "Sun", sign: chart.sunSign, label: copy.bigThree[0].label, sub: PLANET_MEANING.Sun, text: chart.interpretation.coreIdentity, interp: getPlanetInSign("Sun", chart.sunSign) },
        { glyph: "☽", planet: "Moon", sign: chart.moonSign, label: copy.bigThree[1].label, sub: PLANET_MEANING.Moon, text: chart.interpretation.emotionalNature, interp: getPlanetInSign("Moon", chart.moonSign) },
        ...(chart.ascendant
          ? [{ glyph: "↑", planet: "Rising", sign: chart.risingSign, label: copy.bigThree[2].label, sub: copy.risingSub, text: chart.interpretation.outerPersona, interp: "" }]
          : []),
      ]
    : [];

  return (
    <NightShell room={copy.room}>
      <div className="bc-plate">
        {/* ── INPUT ── */}
        {phase !== "revealed" && (
          <div ref={overlayRef} className="bc-entry">
            <p className="night-kicker">{copy.kicker}</p>
            <h1 className="night-h1">{copy.title}</h1>
            <p className="night-lead bc-lead">{copy.lead}</p>

            <div className="bc-formwrap">
              <BirthDataForm
                withName
                copy={copy.form}
                busy={phase === "generating"}
                onSubmit={generate}
              />
            </div>
          </div>
        )}

        {/* ── REVEALED ── */}
        {phase === "revealed" && chart && (
          <div className="bc-revealed">
            <figure className="bc-figure" ref={figureRef}>
              <NatalWheel chart={chart} ariaLabel={`${copy.wheelAria}: ${chart.bigThree}`} />
              <figcaption className="night-caption bc-figcap">
                {copy.figCaption}
                {chart.input.city ? ` · ${chart.input.city}` : ""}
              </figcaption>
            </figure>

            {press && (
              <div className="bc-press night-card">
                <p className="night-kicker">
                  {isUk ? "Цифри, набрані пресом" : "Figures set by the press"} <span aria-hidden>⁂</span>
                </p>
                <div className="bc-press-grid">
                  {press.asc !== null && (
                    <p><span className="bp-k">ASC</span> {fmtLongitude(press.asc)}</p>
                  )}
                  {press.mc !== null && (
                    <p><span className="bp-k">MC</span> {fmtLongitude(press.mc)}</p>
                  )}
                  {["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"].map((b) => {
                    const body = press.bodies[b];
                    if (!body) return null;
                    return (
                      <p key={b}>
                        <span className="bp-k">{b.slice(0, 3).toUpperCase()}</span>{" "}
                        {fmtLongitude(body.longitude)} · {isUk ? "дім" : "house"} {body.house}
                        {body.retrograde ? " ℞" : ""}
                      </p>
                    );
                  })}
                </div>
                <p className="night-caption bc-press-note">
                  {chart.input.timeKnown === false
                    ? isUk
                      ? "час народження невідомий — куспіди домів приблизні (полудень)"
                      : "birth time unknown — house cusps are provisional (noon)"
                    : isUk
                      ? "справжня ефемерида · доми цілих знаків"
                      : "true ephemeris · whole-sign houses"}
                </p>
              </div>
            )}

            <div className="bc-titleblock">
              <p className="night-kicker">
                {chart.input.name ? copy.chartOf(chart.input.name) : copy.chartOwn}
              </p>
              <h1 className="night-h2 bc-bigthree">{chart.bigThree}</h1>
              <p className="night-caption bc-meta">
                <span>{copy.metaDominant(chart.elementBalance.dominant)}</span>
                <span aria-hidden>·</span>
                <span>{copy.metaEnergy(chart.modalityBalance.dominant)}</span>
                <span aria-hidden>·</span>
                <span>{copy.metaPattern(chart.chartPattern)}</span>
                <span aria-hidden>·</span>
                <span>{copy.metaMoon(chart.moonPhase.phase)}</span>
              </p>

              <div className="bc-actions">
                <button className="night-btn" onClick={download}>{copy.download}</button>
                <button
                  className="night-btn ghost"
                  aria-expanded={showDecode}
                  onClick={() => setShowDecode(!showDecode)}
                >
                  {showDecode ? copy.decodeHide : copy.decodeShow}
                </button>
                <button className="night-btn ghost" onClick={reset}>{copy.newChart}</button>
              </div>
            </div>

            {/* ── Full decode ── */}
            {showDecode && (
              <div className="bc-decode">
                {/* The Big Three */}
                {bigThree.map(({ glyph, planet, sign, label, sub, text, interp }) => (
                  <div key={planet} className="night-card bc-card">
                    <div className="bc-card-head">
                      <span className="bc-glyph" aria-hidden>{glyph}</span>
                      <div>
                        <h2 className="bc-card-title">{planet} in {sign}</h2>
                        <p className="night-caption bc-card-label">{label}</p>
                      </div>
                    </div>
                    <p className="bc-sub">{sub}</p>
                    {interp && <p className="bc-interp">{interp}</p>}
                    <p className="bc-text">{text}</p>
                  </div>
                ))}

                {/* Your planets */}
                <div className="night-card bc-card">
                  <p className="night-caption bc-section-label">{copy.planetsLabel}</p>
                  <div className="bc-planets">
                    {chart.planets.slice(2).map((p) => {
                      const interp = getPlanetInSign(p.name, p.sign);
                      const meaning = PLANET_MEANING[p.name] || "";
                      const houseMeaning = HOUSE_MEANING[p.house];
                      return (
                        <div key={p.name} className="bc-planet-row night-hairline-row">
                          <span className="bc-planet-glyph" aria-hidden>{p.glyph}</span>
                          <div className="bc-planet-body">
                            <div className="bc-planet-head">
                              <span className="bc-planet-name">{p.name} in {p.sign}</span>
                              <span className="night-caption bc-planet-meta">
                                {p.degree}°
                                {chart.ascendant != null && <> · {copy.houseWord} {p.house}</>}
                                {p.retrograde && <> · {copy.retro}</>}
                              </span>
                              <DignityBadge dignity={p.dignity} />
                            </div>
                            <p className="bc-sub">{meaning}</p>
                            <p className="bc-text">{interp}</p>
                            {chart.ascendant != null && houseMeaning && (
                              <p className="bc-house-line">
                                {copy.inHouse(houseMeaning.area, houseMeaning.rules.toLowerCase())}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart balance */}
                <div className="bc-balance-grid">
                  <div className="night-card bc-card">
                    <p className="night-caption bc-section-label">{copy.elementLabel}</p>
                    {(["Fire", "Earth", "Air", "Water"] as const).map((el) => {
                      const val = chart.elementBalance[el];
                      const max = Math.max(chart.elementBalance.Fire, chart.elementBalance.Earth, chart.elementBalance.Air, chart.elementBalance.Water);
                      const dominant = chart.elementBalance.dominant === el;
                      return (
                        <div key={el} className="bc-bar-row">
                          <span className="bc-bar-name">{el}</span>
                          <div className="bc-bar-track">
                            <div
                              className="bc-bar-fill"
                              style={{
                                width: `${max ? (val / max) * 100 : 0}%`,
                                background: dominant ? "var(--ember)" : "var(--bone-soft)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="night-card bc-card">
                    <p className="night-caption bc-section-label">{copy.modalityLabel}</p>
                    {(["Cardinal", "Fixed", "Mutable"] as const).map((mod) => {
                      const val = chart.modalityBalance[mod] as number;
                      const max = Math.max(chart.modalityBalance.Cardinal as number, chart.modalityBalance.Fixed as number, chart.modalityBalance.Mutable as number);
                      const dominant = chart.modalityBalance.dominant === mod;
                      return (
                        <div key={mod} className="bc-bar-row">
                          <span className="bc-bar-name">{mod}</span>
                          <div className="bc-bar-track">
                            <div
                              className="bc-bar-fill"
                              style={{
                                width: `${max ? (val / max) * 100 : 0}%`,
                                background: dominant ? "var(--ember)" : "var(--bone-soft)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key aspects */}
                <div className="night-card bc-card">
                  <p className="night-caption bc-section-label">{copy.aspectsLabel}</p>
                  {chart.aspects.slice(0, 10).map((a, i) => {
                    const symbol = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍", quincunx: "⚻" }[a.type] || "·";
                    const tense = a.harmony === "tense";
                    return (
                      <div key={i} className={`bc-aspect-row ${i < 9 ? "night-hairline-row" : ""}`}>
                        <span className="bc-aspect-p">{a.planet1}</span>
                        <span className="bc-aspect-sym" style={{ color: tense ? "var(--ember)" : "var(--bone-soft)" }} aria-hidden>{symbol}</span>
                        <span className="bc-aspect-p bc-aspect-p2">{a.planet2}</span>
                        <span className="night-caption bc-aspect-type">{a.type}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Life theme */}
                <div className="night-card bc-card bc-theme">
                  <p className="night-caption bc-section-label">{copy.lifeThemeLabel}</p>
                  <p className="bc-theme-text">{chart.interpretation.lifeTheme}</p>
                  <p className="night-caption bc-section-label">{copy.soulLabel}</p>
                  <p className="bc-theme-text bc-theme-soul">{chart.interpretation.soulPurpose}</p>
                </div>

                <div className="bc-chart-link">
                  <Link href="/chart" className="night-link">
                    {copy.viewChart} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <style jsx global>{`
          /* ── The Birth Chart room ─────────────────────────────── */
          .bc-plate {
            width: min(100%, 52rem);
            margin: 0 auto;
          }

          .bc-entry {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding-top: clamp(1rem, 4vw, 3rem);
          }

          .bc-lead {
            margin: 1.1rem 0 0;
            max-width: 44ch;
          }

          .bc-formwrap {
            width: 100%;
            max-width: 28rem;
            margin-top: 2.2rem;
            text-align: left;
          }

          /* ── Revealed ─────────────────────────────────────────── */
          .bc-revealed {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .bc-press {
            margin: 1.4rem auto 0;
            max-width: 30rem;
            padding: 1.1rem 1.3rem 1rem;
            text-align: left;
          }

          .bc-press-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
            gap: 0.15rem 1.2rem;
            margin-top: 0.6rem;
          }

          .bc-press-grid p {
            margin: 0;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.62rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(232, 233, 255, 0.8);
          }

          .bc-press-grid .bp-k {
            color: #e0b768;
            display: inline-block;
            min-width: 2.6rem;
          }

          .bc-press-note {
            margin-top: 0.7rem;
          }

          .bc-figure {
            margin: 0;
            width: min(100%, 30rem);
            text-align: center;
            color: var(--bone);
          }

          .bc-wheel-svg {
            width: 100%;
            height: auto;
            display: block;
          }

          .bc-figcap {
            display: block;
            margin-top: 0.9rem;
          }

          .bc-titleblock {
            width: 100%;
            max-width: 44rem;
            margin-top: clamp(1.6rem, 4vw, 2.6rem);
            padding-top: 1.4rem;
            border-top: 1px solid var(--hairline);
            text-align: center;
          }

          .bc-bigthree {
            margin-top: 0.2rem;
          }

          .bc-meta {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.55rem;
            margin: 0.9rem 0 0;
          }

          .bc-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.7rem;
            margin-top: 1.6rem;
          }

          /* ── Decode ───────────────────────────────────────────── */
          .bc-decode {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            max-width: 44rem;
            margin-top: 2.2rem;
          }

          .bc-card-head {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin-bottom: 0.7rem;
          }

          .bc-glyph {
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-size: 1.7rem;
            line-height: 1;
            color: var(--ember);
          }

          .bc-card-title {
            margin: 0;
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-size: 1.35rem;
            font-weight: 500;
            line-height: 1.15;
            color: var(--bone);
          }

          .bc-card-label {
            margin: 0.2rem 0 0;
          }

          .bc-sub {
            margin: 0 0 0.5rem;
            font-size: 0.72rem;
            font-style: italic;
            color: var(--bone-faint);
          }

          .bc-interp {
            margin: 0 0 0.6rem;
            font-size: 0.9rem;
            line-height: 1.7;
            color: var(--bone);
          }

          .bc-text {
            margin: 0;
            font-size: 0.84rem;
            line-height: 1.7;
            color: var(--bone-soft);
          }

          .bc-section-label {
            display: block;
            margin: 0 0 0.85rem;
          }

          .bc-planets {
            display: flex;
            flex-direction: column;
          }

          .bc-planet-row {
            display: flex;
            align-items: flex-start;
            gap: 0.7rem;
            padding: 0.9rem 0;
          }

          .bc-planet-row:last-child {
            border-bottom: none;
            padding-bottom: 0.1rem;
          }

          .bc-planet-glyph {
            margin-top: 0.05rem;
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-size: 1.15rem;
            color: var(--bone-soft);
          }

          .bc-planet-body {
            flex: 1;
            min-width: 0;
          }

          .bc-planet-head {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0.55rem;
            margin-bottom: 0.25rem;
          }

          .bc-planet-name {
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-size: 1.05rem;
            font-weight: 500;
            color: var(--bone);
          }

          .bc-planet-meta {
            letter-spacing: 0.14em;
          }

          .bc-dignity {
            padding: 0.12rem 0.5rem;
            border: 1px solid var(--hairline);
            border-radius: 999px;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.52rem;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .bc-house-line {
            margin: 0.35rem 0 0;
            font-size: 0.7rem;
            color: var(--bone-faint);
          }

          .bc-balance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .bc-bar-row {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-bottom: 0.55rem;
          }

          .bc-bar-row:last-child {
            margin-bottom: 0;
          }

          .bc-bar-name {
            width: 4.2rem;
            flex-shrink: 0;
            font-size: 0.72rem;
            color: var(--bone-soft);
          }

          .bc-bar-track {
            flex: 1;
            height: 3px;
            background: var(--hairline);
          }

          .bc-bar-fill {
            height: 100%;
          }

          .bc-aspect-row {
            display: flex;
            align-items: center;
            gap: 0.55rem;
            padding: 0.45rem 0;
          }

          .bc-aspect-p {
            min-width: 4rem;
            font-size: 0.78rem;
            color: var(--bone-soft);
          }

          .bc-aspect-p2 {
            flex: 1;
          }

          .bc-aspect-sym {
            font-size: 0.85rem;
          }

          .bc-aspect-type {
            letter-spacing: 0.14em;
          }

          .bc-theme {
            text-align: center;
          }

          .bc-theme-text {
            max-width: 34rem;
            margin: 0 auto 1.1rem;
            font-size: 0.88rem;
            line-height: 1.8;
            color: var(--bone-soft);
          }

          .bc-theme-soul {
            margin-bottom: 0;
            font-style: italic;
          }

          .bc-chart-link {
            text-align: center;
            padding: 0.4rem 0 0.8rem;
          }

          /* ── Etch-in for the wheel ────────────────────────────── */
          .bc-plate .etch {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: bc-etch 1.1s var(--ease) forwards;
            animation-delay: calc(var(--ei, 0) * 90ms);
          }

          .bc-plate .sfade {
            opacity: 0;
            animation: bc-fade 700ms var(--ease) forwards;
            animation-delay: calc(var(--ei, 0) * 90ms);
          }

          @keyframes bc-etch {
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes bc-fade {
            to {
              opacity: var(--o, 1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .bc-plate .etch {
              animation: none;
              stroke-dashoffset: 0;
            }
            .bc-plate .sfade {
              animation: none;
              opacity: var(--o, 1);
            }
          }

          @media (max-width: 560px) {
            .bc-balance-grid {
              grid-template-columns: 1fr;
            }
            .bc-actions {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}</style>
      </div>
    </NightShell>
  );
}
