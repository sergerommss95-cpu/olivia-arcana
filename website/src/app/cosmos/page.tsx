/**
 * Cosmos — the night ledger of the current sky.
 *
 * The old real-time dashboard re-set in the almanac's night register:
 * planetary positions as an ephemeris table with dot leaders, the moon
 * as an engraved phase, the year's events as ledger entries. All data
 * still computed client-side from the same astronomical algorithms.
 */

"use client";

import React, { useEffect, useState } from "react";
import NightShell from "@/components/almanac/NightShell";
import { moonPath } from "@/lib/almanac-today";
import { useLocale } from "@/lib/i18n/useLocale";
import { getAllPositions, getMoonPhase, type CelestialBody } from "@/lib/celestial";
import {
  getUpcomingEvents, getRecentEvents, EVENTS_2026, EVENT_TYPE_META,
  type AstroEvent, type EventType,
} from "@/lib/astro-events";

/* ── Localization maps (data ships EN; the ledger's chrome is EN+UK) ── */

const PLANET_UK: Record<string, string> = {
  Sun: "Сонце", Moon: "Місяць", Mercury: "Меркурій", Venus: "Венера",
  Mars: "Марс", Jupiter: "Юпітер", Saturn: "Сатурн", Uranus: "Уран",
  Neptune: "Нептун", Pluto: "Плутон",
};

const SIGN_UK: Record<string, string> = {
  Aries: "Овен", Taurus: "Телець", Gemini: "Близнюки", Cancer: "Рак",
  Leo: "Лев", Virgo: "Діва", Libra: "Терези", Scorpio: "Скорпіон",
  Sagittarius: "Стрілець", Capricorn: "Козоріг", Aquarius: "Водолій", Pisces: "Риби",
};

const MOON_UK: Record<string, string> = {
  "New Moon": "Новий місяць",
  "Waxing Crescent": "Молодий серп",
  "First Quarter": "Перша чверть",
  "Waxing Gibbous": "Місяць, що прибуває",
  "Full Moon": "Повний місяць",
  "Waning Gibbous": "Місяць, що спадає",
  "Last Quarter": "Остання чверть",
  "Waning Crescent": "Старий серп",
};

const TYPE_UK: Record<EventType, string> = {
  eclipse_solar: "Сонячне затемнення",
  eclipse_lunar: "Місячне затемнення",
  retrograde_start: "Початок ретрограду",
  retrograde_end: "Кінець ретрограду",
  new_moon: "Новий місяць",
  full_moon: "Повний місяць",
  ingress: "Вхід у знак",
  grand_aspect: "Великий аспект",
  equinox: "Рівнодення",
  solstice: "Сонцестояння",
};

const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/* ︎ forces text presentation — Apple renders bare zodiac codepoints
   as purple emoji squares, which the night register bans. */
const GLYPHS: Record<string, string> = {
  Aries: "♈︎", Taurus: "♉︎", Gemini: "♊︎", Cancer: "♋︎",
  Leo: "♌︎", Virgo: "♍︎", Libra: "♎︎", Scorpio: "♏︎",
  Sagittarius: "♐︎", Capricorn: "♑︎", Aquarius: "♒︎", Pisces: "♓︎",
};

function typeLabel(type: EventType, isUk: boolean): string {
  return isUk ? TYPE_UK[type] : EVENT_TYPE_META[type].label;
}

/* ── Moon as a line engraving: hatched disc, lit region in bone ────── */

function MoonPlate({ fraction, waxing }: { fraction: number; waxing: boolean }) {
  const lit = moonPath(60, 60, 44, fraction, waxing);
  return (
    <svg width={108} height={108} viewBox="0 0 120 120" aria-hidden="true" className="cosmos-moon-svg">
      <defs>
        <pattern id="cosmos-moon-hatch" width="3" height="3" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="3" stroke="currentColor" strokeWidth="0.6" />
        </pattern>
      </defs>
      <circle cx="60" cy="60" r="44" fill="url(#cosmos-moon-hatch)" opacity="0.4" />
      {lit && <path d={lit} fill="var(--bone)" opacity="0.92" />}
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 5" />
    </svg>
  );
}

/* ── One ephemeris line: glyph, name, dot leader, position ─────────── */

function EphemerisRow({ body, isUk }: { body: CelestialBody; isUk: boolean }) {
  const name = isUk ? PLANET_UK[body.name] ?? body.name : body.name;
  const sign = isUk ? SIGN_UK[body.sign] ?? body.sign : body.sign;
  return (
    <div className="cosmos-eph-row">
      <span className="cosmos-eph-glyph" aria-hidden>{body.glyph}</span>
      <span className="cosmos-eph-name">{name}</span>
      <span className="cosmos-eph-leader" aria-hidden />
      <span className="cosmos-eph-pos">
        <span className="cosmos-eph-signglyph" aria-hidden>{body.signGlyph}{"︎"}</span> {sign} {body.degree}°
        {body.retrograde && (
          <span className="cosmos-eph-retro" title={isUk ? "Ретроградний" : "Retrograde"}> ℞</span>
        )}
      </span>
    </div>
  );
}

/* ── One ledger entry in the events column ─────────────────────────── */

function EventRow({
  event, onSelect, isUk, dim = false,
}: {
  event: AstroEvent; onSelect: (e: AstroEvent) => void; isUk: boolean; dim?: boolean;
}) {
  const d = new Date(event.date + "T00:00:00");
  const dateLine = d.toLocaleDateString(isUk ? "uk-UA" : "en-GB", { day: "numeric", month: "short" });

  return (
    <button
      type="button"
      className={`cosmos-event${dim ? " dim" : ""}`}
      onClick={() => onSelect(event)}
    >
      <span className="cosmos-event-date">{dateLine}</span>
      <span className="cosmos-event-body">
        <span className="cosmos-event-meta">
          <span className="cosmos-event-type">{typeLabel(event.type, isUk)}</span>
          <span
            className="cosmos-event-ticks"
            role="img"
            aria-label={isUk ? `Сила ${event.intensity} з 3` : `Intensity ${event.intensity} of 3`}
          >
            {[1, 2, 3].map(i => (
              <i key={i} className={i <= event.intensity ? "on" : undefined} />
            ))}
          </span>
        </span>
        <span className="cosmos-event-title">{event.title}</span>
        <span className="cosmos-event-desc">{event.description}</span>
      </span>
      <span className="cosmos-event-arrow" aria-hidden>→</span>
    </button>
  );
}

/* ── Event detail: a night sheet over a plain dark scrim ───────────── */

function EventDetail({
  event, onClose, isUk,
}: {
  event: AstroEvent; onClose: () => void; isUk: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="cosmos-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="night-card cosmos-sheet">
        <div className="cosmos-sheet-head">
          <div>
            <p className="night-caption cosmos-sheet-kicker">
              {typeLabel(event.type, isUk)} · {event.date}
            </p>
            <h2 className="night-h2 cosmos-sheet-title">{event.title}</h2>
          </div>
          <button
            type="button"
            className="cosmos-close"
            onClick={onClose}
            aria-label={isUk ? "Закрити" : "Close"}
          >
            ×
          </button>
        </div>

        <p className="night-lead cosmos-sheet-desc">{event.description}</p>

        <p className="night-caption cosmos-sheet-sec">
          {isUk ? "Вплив за знаками" : "Impact by sign"}
        </p>
        <div className="cosmos-impacts">
          {SIGN_ORDER.map(sign => (
            <div key={sign} className={`cosmos-impact${event.sign === sign ? " active" : ""}`}>
              <span className="cosmos-impact-glyph" aria-hidden>{GLYPHS[sign]}</span>
              <div>
                <p className="cosmos-impact-name">{isUk ? SIGN_UK[sign] ?? sign : sign}</p>
                <p className="cosmos-impact-text">{event.impacts[sign]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────────── */

export default function CosmosPage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";

  const [mounted, setMounted] = useState(false);
  const [positions, setPositions] = useState<CelestialBody[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AstroEvent | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setPositions(getAllPositions(new Date()));
    }, 0);

    // Recompute positions every minute
    const interval = setInterval(() => {
      setPositions(getAllPositions(new Date()));
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) {
    // Static night ground so the route paints before hydration.
    return <div aria-hidden style={{ minHeight: "100vh", background: "#10134d" }} />;
  }

  const moon = getMoonPhase(new Date());
  const upcoming = getUpcomingEvents(6);
  const recent = getRecentEvents(2);
  const phaseName = isUk ? MOON_UK[moon.phase] ?? moon.phase : moon.phase;

  return (
    <NightShell room={isUk ? "Нічний реєстр" : "The Night Ledger"}>
      <div className="cosmos-wrap">
        <header className="cosmos-head">
          <p className="night-kicker">{isUk ? "Ефемерида · наживо" : "Ephemeris · Live"}</p>
          <h1 className="night-h1">{isUk ? "Теперішнє небо" : "The Current Sky"}</h1>
          <p className="night-lead cosmos-head-lead">
            {isUk
              ? "Фаза Місяця, положення планет і астрологічний календар року — обчислено за вашим годинником."
              : "Moon phase, planetary positions, and the year's astrological calendar — computed from your clock."}
          </p>
        </header>

        <div className="cosmos-grid">
          {/* ── Left column: moon plate + ephemeris ── */}
          <div className="cosmos-col">
            <section className="night-card cosmos-moon" aria-label={isUk ? "Місяць сьогодні" : "The moon tonight"}>
              <MoonPlate fraction={moon.illumination / 100} waxing={moon.age < 29.53059 / 2} />
              <div className="cosmos-moon-copy">
                <p className="night-caption">{isUk ? "Місяць сьогодні" : "The moon tonight"}</p>
                <p className="cosmos-moon-phase">{phaseName}</p>
                <p className="cosmos-moon-data">
                  {moon.illumination}% {isUk ? "освітлено" : "illuminated"} · {isUk ? "день" : "day"} {moon.age}
                </p>
              </div>
            </section>

            <section className="night-card cosmos-eph" aria-label={isUk ? "Положення планет" : "Planetary positions"}>
              <div className="cosmos-eph-head">
                <p className="night-caption">{isUk ? "Положення планет" : "Planetary positions"}</p>
                <p className="night-caption cosmos-eph-note">± 1–2°</p>
              </div>
              {positions.map(body => (
                <EphemerisRow key={body.name} body={body} isUk={isUk} />
              ))}
              <p className="cosmos-eph-foot">
                {isUk ? "Переобчислюється щохвилини" : "Recomputed each minute"}
              </p>
            </section>
          </div>

          {/* ── Right column: the event ledger ── */}
          <div className="cosmos-col">
            <section aria-label={isUk ? "Найближчі події" : "Upcoming events"}>
              <p className="night-kicker cosmos-ledger-kicker">
                {isUk ? "НІЧНИЙ РЕЄСТР — друкарня веде його щоночі" : "THE NIGHT LEDGER — kept nightly by the press"}
              </p>
              <p className="night-caption cosmos-sec">{isUk ? "Найближчі події" : "Upcoming events"}</p>
              <div className="cosmos-events">
                {upcoming.map(event => (
                  <EventRow key={event.date + event.title} event={event} onSelect={setSelectedEvent} isUk={isUk} />
                ))}
              </div>
            </section>

            {recent.length > 0 && (
              <section aria-label={isUk ? "Нещодавно минули" : "Recently passed"}>
                <p className="night-caption cosmos-sec">{isUk ? "Нещодавно минули" : "Recently passed"}</p>
                <div className="cosmos-events">
                  {recent.map(event => (
                    <EventRow key={event.date + event.title} event={event} onSelect={setSelectedEvent} isUk={isUk} dim />
                  ))}
                </div>
              </section>
            )}

            <button
              type="button"
              className="night-btn ghost cosmos-all"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? (isUk ? "Згорнути" : "Show less")
                : (isUk ? `Усі події — ${EVENTS_2026.length}` : `View all ${EVENTS_2026.length} events`)}
            </button>
          </div>
        </div>

        {/* ── Full 2026 ledger ── */}
        {showAll && (
          <section className="cosmos-library" aria-label={isUk ? "Реєстр подій 2026" : "The 2026 event ledger"}>
            <p className="night-caption cosmos-sec">{isUk ? "Реєстр подій 2026" : "The 2026 event ledger"}</p>
            <div className="cosmos-events">
              {EVENTS_2026.map(event => (
                <EventRow key={event.date + event.title} event={event} onSelect={setSelectedEvent} isUk={isUk} />
              ))}
            </div>
          </section>
        )}

        {selectedEvent && (
          <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} isUk={isUk} />
        )}
      </div>

      <style jsx global>{`
        .cosmos-wrap {
          max-width: 68rem;
          margin: 0 auto;
        }

        .cosmos-wrap .night-caption {
          margin: 0;
        }

        .cosmos-head {
          max-width: 40rem;
          margin-bottom: clamp(2rem, 5vw, 3.2rem);
        }

        .cosmos-head-lead {
          margin: 0.9rem 0 0;
        }

        .cosmos-grid {
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
          gap: clamp(1.2rem, 3vw, 2.6rem);
          align-items: start;
        }

        .cosmos-col {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          min-width: 0;
        }

        /* ── Moon plate ── */
        .cosmos-moon {
          display: flex;
          align-items: center;
          gap: 1.4rem;
        }

        .cosmos-moon-svg {
          flex: none;
          color: var(--bone);
        }

        .cosmos-moon-copy {
          min-width: 0;
        }

        .cosmos-moon-phase {
          margin: 0.55rem 0 0.3rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.35rem, 2.4vw, 1.7rem);
          font-weight: 500;
          line-height: 1.1;
          color: var(--bone);
        }

        .cosmos-moon-data {
          margin: 0;
          color: var(--bone-faint);
          font-size: 0.78rem;
        }

        /* ── Ephemeris table ── */
        .cosmos-eph-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 0.55rem;
        }

        .cosmos-eph-note {
          letter-spacing: 0.08em;
        }

        .cosmos-eph-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.52rem 0;
          border-bottom: 1px solid rgba(232, 233, 255, 0.07);
        }

        .cosmos-eph-row:last-of-type {
          border-bottom: none;
        }

        .cosmos-eph-glyph {
          flex: none;
          width: 1.4rem;
          text-align: center;
          color: var(--bone-soft);
          font-size: 0.95rem;
        }

        .cosmos-eph-name {
          flex: none;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.05rem;
          color: var(--bone);
        }

        .cosmos-eph-leader {
          flex: 1;
          min-width: 1rem;
          height: 1px;
          border-bottom: 1px dotted rgba(232, 233, 255, 0.3);
          position: relative;
          top: 0.32em;
        }

        .cosmos-eph-pos {
          flex: none;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--bone-soft);
          white-space: nowrap;
        }

        .cosmos-eph-signglyph {
          color: var(--bone-faint);
        }

        .cosmos-eph-retro {
          color: var(--ember);
          font-weight: 600;
        }

        .cosmos-eph-foot {
          margin: 0.8rem 0 0;
          color: var(--bone-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        /* ── Event ledger ── */
        .cosmos-ledger-kicker {
          margin: 0 0 1.1rem;
        }

        .cosmos-sec {
          margin: 0 0 0.85rem !important;
        }

        .cosmos-events {
          display: flex;
          flex-direction: column;
        }

        .cosmos-event {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          width: 100%;
          padding: 0.95rem 0.2rem;
          text-align: left;
          background: none;
          border: none;
          border-bottom: 1px solid var(--hairline);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        .cosmos-event:first-child {
          border-top: 1px solid var(--hairline);
        }

        .cosmos-event.dim {
          opacity: 0.55;
        }

        .cosmos-event-date {
          flex: none;
          width: 3.8rem;
          padding-top: 0.3rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--bone-faint);
        }

        .cosmos-event-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.28rem;
        }

        .cosmos-event-meta {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .cosmos-event-type {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ember);
        }

        .cosmos-event-ticks {
          display: inline-flex;
          gap: 3px;
        }

        .cosmos-event-ticks i {
          width: 3px;
          height: 8px;
          background: rgba(232, 233, 255, 0.16);
        }

        .cosmos-event-ticks i.on {
          background: var(--ember);
        }

        .cosmos-event-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.1rem, 1.8vw, 1.25rem);
          line-height: 1.15;
          color: var(--bone);
          transition: color 0.3s var(--ease);
        }

        .cosmos-event:hover .cosmos-event-title,
        .cosmos-event:focus-visible .cosmos-event-title {
          color: var(--ember);
        }

        .cosmos-event-desc {
          color: var(--bone-faint);
          font-size: 0.78rem;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cosmos-event-arrow {
          flex: none;
          padding-top: 0.22rem;
          color: var(--bone-faint);
          transition: transform 0.3s var(--ease), color 0.3s var(--ease);
        }

        .cosmos-event:hover .cosmos-event-arrow,
        .cosmos-event:focus-visible .cosmos-event-arrow {
          color: var(--ember);
          transform: translateX(3px);
        }

        .cosmos-all {
          align-self: flex-start;
          margin-top: 0.4rem;
        }

        .cosmos-library {
          margin-top: clamp(2rem, 5vw, 3rem);
          padding-top: clamp(1.4rem, 3vw, 2rem);
          border-top: 1px solid var(--hairline);
        }

        /* ── Event detail sheet ── */
        .cosmos-scrim {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.2rem;
          background: rgba(10, 13, 56, 0.88);
          overflow-y: auto;
        }

        .cosmos-sheet {
          width: 100%;
          max-width: 34rem;
          max-height: min(86vh, 100%);
          overflow-y: auto;
          box-shadow: 0 1.4rem 3rem rgba(10, 13, 56, 0.6);
        }

        .cosmos-sheet-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.9rem;
        }

        .cosmos-sheet-kicker {
          color: var(--ember) !important;
        }

        .cosmos-sheet-title {
          margin-top: 0.5rem;
          font-size: clamp(1.4rem, 3vw, 1.7rem);
        }

        .cosmos-close {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.1rem;
          height: 2.1rem;
          border: 1px solid var(--hairline);
          border-radius: 3px;
          background: none;
          color: var(--bone-soft);
          font-size: 1.05rem;
          line-height: 1;
          cursor: pointer;
          transition: border-color 0.3s var(--ease), color 0.3s var(--ease);
        }

        .cosmos-close:hover,
        .cosmos-close:focus-visible {
          border-color: var(--ember);
          color: var(--bone);
        }

        .cosmos-sheet-desc {
          margin: 0 0 1.4rem;
          font-size: 0.92rem;
        }

        .cosmos-sheet-sec {
          margin: 0 0 0.6rem !important;
        }

        .cosmos-impacts {
          display: flex;
          flex-direction: column;
        }

        .cosmos-impact {
          display: flex;
          gap: 0.7rem;
          padding: 0.6rem 0.5rem;
          border-bottom: 1px solid rgba(232, 233, 255, 0.07);
          border-left: 2px solid transparent;
        }

        .cosmos-impact:last-child {
          border-bottom: none;
        }

        .cosmos-impact.active {
          border-left-color: var(--ember);
          background: rgba(224, 183, 104, 0.06);
        }

        .cosmos-impact-glyph {
          flex: none;
          width: 1.3rem;
          text-align: center;
          color: var(--bone-faint);
        }

        .cosmos-impact-name {
          margin: 0 0 0.1rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.98rem;
          color: var(--bone);
        }

        .cosmos-impact.active .cosmos-impact-name {
          color: var(--ember);
        }

        .cosmos-impact-text {
          margin: 0;
          color: var(--bone-soft);
          font-size: 0.78rem;
          line-height: 1.6;
        }

        @media (max-width: 820px) {
          .cosmos-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cosmos-event-title,
          .cosmos-event-arrow,
          .cosmos-close {
            transition: none !important;
          }
          .cosmos-event:hover .cosmos-event-arrow {
            transform: none;
          }
        }
      `}</style>
    </NightShell>
  );
}
