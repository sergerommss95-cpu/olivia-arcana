"use client";

/**
 * The almanac (folio chapter VI): the day in detail, folded into the Olivia Astrology ledger rows
 * (BRAND.md disclosure: a filled row with a +/− chip): the hours of the day under the Sun's real path
 * over Kyiv, the Moon, what is in force for weeks, the long chapters, and the next fourteen days.
 * Moments already past are inked ivory, later ones blue-grey; the gold now mark shows only while the
 * leaf is today. The sun path draws itself the first time its row opens, once per page view.
 */

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import ENGINE from "@/lib/daily/engine.js";
import COMPOSE from "@/lib/daily/compose.js";
import type { AstroCopy } from "@/lib/astrology/copy";
import MoonDisc from "@/components/astrology/MoonDisc";
import { typeset } from "./typeset";
import a from "@/components/astrology/astrology.module.css";
import s from "./almanac.module.css";

type Locale = "en" | "uk";
/* The composed reading (src/lib/daily/compose.js); only the fields this page reads. */
export type DailyReading = {
  headline: string; kicker: string; lead: string[]; scene: string; dos: string[]; avoids: string[]; ask: string;
  alsoPara: string[]; moonPara: string[]; keep: { planet: string; text: string }[];
  areas: { key: string; planet: string; house: number; text: string; leaves: number | null }[];
  timing: { at: number | null; glyph: string; label: string; family?: string }[];
  moon: { name: string; illum: number; sign: string; house: number | null; text: string; angle: number; next?: { name: string; at: number; sign: string } };
  season: { planet: string; sign: string; house: number | null; start: number | null; end: number | null; theme: string; isRuler?: boolean; retro?: { start: number; end: number; state: string } }[];
  chapters: { planet: string; sign: string; house: number | null; from: number; to: number; theme: string; text: string; retro?: boolean }[];
  dates: { at: number; glyph: string; title: string; house: number | null; text: string }[];
};
type Day = { dayStart: number; dayEnd: number; asOf: number; sun?: { rise: number | null; set: number | null } | null };

const UI = {
  en: {
    kicker: "The almanac", title: ["The day", "in detail"], lead: "Everything the reading rests on, worked out for today. Open a row to read it.",
    leadDated: "Everything the reading rests on, worked out for this day. Open a row to read it.",
    timing: "The hours of today", timingDated: "The hours of the day", sunrise: "sunrise", sunset: "sunset", now: "now",
    moon: "The Moon", lit: (p: number) => `${p}% lit`,
    season: "What is in force now", seasonMeta: "for weeks", ruler: "your ruling planet", retro: "retrograde",
    chapters: "The long chapters", chaptersMeta: "for years",
    dates: "The next fourteen days", also: "Also in the sky today", alsoDated: "Also in the sky on this day",
    until: (d: string) => `until ${d}`,
  },
  uk: {
    kicker: "Альманах", title: ["День", "у подробицях"], lead: "Усе, на чому тримається читання, розраховане на сьогодні. Відкрийте рядок, щоб прочитати.",
    leadDated: "Усе, на чому тримається читання, розраховане на цей день. Відкрийте рядок, щоб прочитати.",
    timing: "Години сьогоднішнього дня", timingDated: "Години цього дня", sunrise: "схід", sunset: "захід", now: "зараз",
    moon: "Місяць", lit: (p: number) => `освітлено ${p}%`,
    season: "Що діє зараз", seasonMeta: "тижнями", ruler: "управитель вашого знака", retro: "ретроградний",
    chapters: "Довгі розділи", chaptersMeta: "роками",
    dates: "Найближчі два тижні", also: "Також на небі сьогодні", alsoDated: "Також на небі цього дня",
    until: (d: string) => `до ${d}`,
  },
};

const HORIZON = 74;
function sunPath(r0: number, s0: number) { // the Sun's height across the Kyiv day, in a 0–100 box: an arc by day, a shallow dip by night
  const noon = (r0 + s0) / 2, c0 = Math.cos(Math.PI * (s0 - r0) / 100);
  const y = (p: number) => { const alt = (Math.cos(2 * Math.PI * (p - noon) / 100) - c0) / (1 - c0); return HORIZON - (alt > 0 ? alt * 60 : alt * 14); };
  let day = "";
  const night = ["", ""];
  for (let p = 0; p <= 100; p += 0.5) {
    const pt = `${p} ${y(p).toFixed(2)}`;
    if (p >= r0 && p <= s0) day += (day ? "L" : "M") + pt;
    else { const k = p < r0 ? 0 : 1; night[k] += (night[k] ? "L" : "M") + pt; }
  }
  return { day: `M${r0} ${HORIZON}` + day.replace(/^M/, "L") + `L${s0} ${HORIZON}`, night, y };
}

// Survives ClientShell's remount on hard load, so the sun path draws once per page view, not per mount.
let sunDrawn = false;

export default function DailyAlmanac({ locale, reading, day, copy, now }: { locale: Locale; reading: DailyReading; day: Day; copy: AstroCopy; now: number }) {
  const t = UI[locale];
  const [draw, setDraw] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  // Intl writes the modifier letter ʼ («пʼятниця»); the voice guide's apostrophe is ’
  const fmt = (x: number, o: Intl.DateTimeFormatOptions) => (ENGINE.fmt(x, locale, o) as string).replace(/ʼ/g, "’");
  const ts = (x: string) => typeset(x, locale);
  const hm = (x: number) => fmt(x, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const short = (x: number) => fmt(x, { day: "numeric", month: "long" });
  const house = (n: number | null) => (n ? copy.houses[String(n)]?.name ?? "" : "");
  const body = (k: string) => copy.bodies[k]?.name ?? k;
  const G = COMPOSE.GLYPH as Record<string, string>;
  const span = day.dayEnd - day.dayStart, pos = (x: number) => Math.max(0, Math.min(100, (x - day.dayStart) / span * 100));
  const rise = day.sun?.rise, set = day.sun?.set;
  const path = rise && set ? sunPath(pos(rise), pos(set)) : null;
  const nowPos = pos(now); // clamped, so on another day's leaf the horizon reads wholly past or wholly to come
  const showNow = now >= day.dayStart && now <= day.dayEnd; // false on another day's leaf, which then never says "today"
  const moments = reading.timing.filter((e) => e.at);
  const m = reading.moon;
  const w0 = day.asOf - 21 * 864e5, w1 = day.asOf + 56 * 864e5, x = (tt: number) => (tt - w0) / (w1 - w0) * 100;
  const TEXT = "\uFE0E"; // text presentation, so the glyphs never turn into emoji
  // the true window of "the next fourteen days": the day after the leaf to fourteen days on ("18–31 October")
  const nextDays = new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", timeZone: "Europe/Kyiv" })
    .formatRange(day.dayStart + 1.5 * 864e5, day.dayStart + 14.5 * 864e5).replace(/ʼ/g, "’");

  // Opening (not closing) the hours row for the first time starts the draw in the same frame the row opens.
  const firstOpen = (e: MouseEvent<HTMLElement>) => {
    if (sunDrawn || !path || (e.currentTarget.parentElement as HTMLDetailsElement | null)?.open) return;
    sunDrawn = true;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setDraw(true);
  };
  // Once the open row has its first frame, wait for the sequence's own animations, then drop .draw so the
  // end state is the plain CSS again (a closed or reopened row, or a minute's re-render, never replays it).
  useEffect(() => {
    if (!draw) return;
    let live = true;
    const end = () => { if (live) setDraw(false); };
    const frame = requestAnimationFrame(() => {
      const running = strip.current?.getAnimations({ subtree: true }) ?? [];
      if (running.length) Promise.allSettled(running.map((r) => r.finished)).then(end);
      else end();
    });
    return () => { live = false; cancelAnimationFrame(frame); };
  }, [draw]);

  return (
    <section className={s.almanac} aria-labelledby="almanac-title">
      <p className={s.eyebrow}>{t.kicker}</p>
      <h2 id="almanac-title" className={s.title}>{t.title[0]} <br /><em>{t.title[1]}</em></h2>
      <p className={s.lead}>{ts(showNow ? t.lead : t.leadDated)}</p>
      <ul className={`${a.ledger} ${s.ledger}`}>
        <li>
          <details className={`${a.row} ${s.row}`}>
            <summary onClick={firstOpen}>
              <span className={a.glyph} aria-hidden>{"☉" + TEXT}</span>
              <span className={`${a.rowName} ${s.rowName}`}>{ts(showNow ? t.timing : t.timingDated)}</span>
              <span className={`${a.rowMeta} ${s.rowMeta}`}>{rise && set ? `${t.sunrise} ${hm(rise)} · ${t.sunset} ${hm(set)}` : ""}</span>
            </summary>
            <div className={`${a.rowBody} ${s.rowBody}`}>
              {path && (
                <div ref={strip} className={`${s.sunStrip}${draw ? ` ${s.draw}` : ""}`} aria-hidden>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={path.day + "Z"} className={s.sunFill} />
                    {path.night.map((n, i) => <path key={i} d={n} className={s.sunNight} />)}
                    <path d={path.day} className={s.sunDay} />
                    <g className={s.horizon}>
                      {nowPos > 0 && <line x1="0" x2={nowPos} y1={HORIZON} y2={HORIZON} className={s.horizonPast} />}
                      {nowPos < 100 && <line x1={nowPos} x2="100" y1={HORIZON} y2={HORIZON} className={s.horizonLater} />}
                    </g>
                  </svg>
                  {[0, 6, 12, 18, 24].map((h) => (
                    <span key={h} className={s.hour} style={{ left: `${h / 24 * 100}%` }} data-edge={h === 0 ? "start" : h === 24 ? "end" : undefined}>{String(h).padStart(2, "0")}</span>
                  ))}
                  {moments.map((e, i) => (
                    <span key={i} className={s.event} style={{ left: `${pos(e.at!)}%`, top: `${HORIZON}%`, "--i": i } as CSSProperties} data-past={e.at! <= now || undefined} />
                  ))}
                  {showNow && (
                    <span className={s.now} style={{ left: `${nowPos}%`, "--y": `${path.y(nowPos)}%`, "--i": moments.length } as CSSProperties} data-edge={nowPos < 8 ? "start" : nowPos > 92 ? "end" : undefined}>
                      <span className={s.nowTick} />
                      <span className={s.nowDot} />
                      <span className={s.nowLabel}>{t.now} {hm(now)}</span>
                    </span>
                  )}
                </div>
              )}
              <ol className={s.times}>
                {reading.timing.map((e, i) => (
                  <li key={i} data-past={(e.at && e.at <= now) || undefined}>
                    <span className={s.time}>{e.at ? hm(e.at) : "—"}</span><span className={s.timeGlyph} aria-hidden>{e.glyph}</span><span>{ts(e.label)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </li>
        <li>
          <details className={`${a.row} ${s.row}`}>
            <summary>
              <span className={a.glyph} aria-hidden>{"☽" + TEXT}</span>
              <span className={`${a.rowName} ${s.rowName}`}>{t.moon}</span>
              <span className={`${a.rowMeta} ${s.rowMeta}`}>{m.name} · {t.lit(Math.round(m.illum * 100))}</span>
            </summary>
            <div className={`${a.rowBody} ${s.rowBody} ${s.moonBody}`}>
              <div className={s.moonDisc}><MoonDisc angle={m.angle} label={`${m.name}, ${t.lit(Math.round(m.illum * 100))}`} /></div>
              <div>
                <p>{ts(m.text)}</p>
                {m.house && <p><strong>{house(m.house)}.</strong> {ts(copy.houses[String(m.house)]?.area ?? "")}</p>}
                {m.next && <p className={s.meta}>{m.next.name} · {fmt(m.next.at, { weekday: "long", day: "numeric", month: "long" })}, {hm(m.next.at)}</p>}
              </div>
            </div>
          </details>
        </li>
        <li>
          <details className={`${a.row} ${s.row}`}>
            <summary>
              <span className={a.glyph} aria-hidden>{"♄" + TEXT}</span>
              <span className={`${a.rowName} ${s.rowName}`}>{ts(t.season)}</span>
              <span className={`${a.rowMeta} ${s.rowMeta}`}>{t.seasonMeta}</span>
            </summary>
            <div className={`${a.rowBody} ${s.rowBody}`}>
              <ul className={s.season}>
                {reading.season.map((se, i) => {
                  const from = Math.max(se.start || w0, w0), to = Math.min(se.end || w1, w1);
                  return (
                    <li key={i}>
                      <p className={s.seasonHead}><span className={s.timeGlyph} aria-hidden>{G[se.planet] + TEXT}</span><strong>{body(se.planet)}</strong> · {house(se.house)}{se.end ? ` · ${t.until(short(se.end))}` : ""}{se.isRuler ? ` · ${t.ruler}` : ""}</p>
                      <div className={s.track} aria-hidden>
                        <span className={s.bar} style={{ left: `${x(from)}%`, width: `${Math.max(1.5, x(to) - x(from))}%` }} />
                        {se.retro && <span className={s.retro} style={{ left: `${x(Math.max(se.retro.start, from))}%`, width: `${Math.max(0, x(Math.min(se.retro.end, to)) - x(Math.max(se.retro.start, from)))}%` }} />}
                        <span className={s.todayLine} style={{ left: `${x(day.asOf)}%` }} />
                      </div>
                      <p className={s.seasonTheme}>{ts(se.theme)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        </li>
        <li>
          <details className={`${a.row} ${s.row}`}>
            <summary>
              <span className={a.glyph} aria-hidden>{"♇" + TEXT}</span>
              <span className={`${a.rowName} ${s.rowName}`}>{ts(t.chapters)}</span>
              <span className={`${a.rowMeta} ${s.rowMeta}`}>{t.chaptersMeta}</span>
            </summary>
            <div className={`${a.rowBody} ${s.rowBody}`}>
              {reading.chapters.map((ch, i) => (
                <div key={i} className={s.chapter}>
                  <p className={s.seasonHead}><span className={s.timeGlyph} aria-hidden>{G[ch.planet] + TEXT}</span><strong>{ts(ch.theme)}</strong></p>
                  <p className={s.meta}>{body(ch.planet)} · {house(ch.house)}{ch.retro ? ` · ${t.retro}` : ""} · {ch.from}–{ch.to}</p>
                  <p>{ts(ch.text)}</p>
                </div>
              ))}
            </div>
          </details>
        </li>
        {reading.dates.length > 0 && (
          <li>
            <details className={`${a.row} ${s.row}`}>
              <summary>
                <span className={a.glyph} aria-hidden>{"◐" + TEXT}</span>
                <span className={`${a.rowName} ${s.rowName}`}>{ts(t.dates)}</span>
                <span className={`${a.rowMeta} ${s.rowMeta}`}>{nextDays}</span>
              </summary>
              <div className={`${a.rowBody} ${s.rowBody}`}>
                <ol className={s.dates}>
                  {reading.dates.map((e, i) => (
                    <li key={i}>
                      <p className={s.date}><strong>{fmt(e.at, { day: "numeric", month: "long" })}</strong> · {fmt(e.at, { weekday: "long" })}, {hm(e.at)}</p>
                      <p className={s.seasonHead}><span className={s.timeGlyph} aria-hidden>{e.glyph + TEXT}</span>{ts(e.title)}{e.house ? ` · ${house(e.house)}` : ""}</p>
                      {e.text && <p>{ts(e.text)}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </li>
        )}
        {(reading.alsoPara.length > 0 || reading.keep.length > 0) && (
          <li>
            <details className={`${a.row} ${s.row}`}>
              <summary>
                <span className={a.glyph} aria-hidden><span className={s.mark} /></span>
                <span className={`${a.rowName} ${s.rowName}`}>{ts(showNow ? t.also : t.alsoDated)}</span>
                {/* empty, so the +/− chip lands in the same column as on the other rows */}
                <span className={`${a.rowMeta} ${s.rowMeta}`} />
              </summary>
              <div className={`${a.rowBody} ${s.rowBody}`}>
                {reading.alsoPara.map((p, i) => <p key={"a" + i}>{ts(p)}</p>)}
                {reading.moonPara.length > 0 && <p>{ts(reading.moonPara.join(" "))}</p>}
                {reading.keep.map((k, i) => <p key={"k" + i}><strong>{body(k.planet)}.</strong> {ts(k.text)}</p>)}
              </div>
            </details>
          </li>
        )}
      </ul>
    </section>
  );
}
