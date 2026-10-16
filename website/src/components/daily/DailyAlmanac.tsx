"use client";

/**
 * The day in detail, folded into the Olivia Astrology ledger rows (BRAND.md disclosure: a filled
 * row with a +/− chip): the hours of the day under the Sun's real path over Kyiv, the Moon, what is
 * in force for weeks, the long chapters, and the next fourteen days.
 */

import ENGINE from "@/lib/daily/engine.js";
import COMPOSE from "@/lib/daily/compose.js";
import type { AstroCopy } from "@/lib/astrology/copy";
import MoonDisc from "@/components/astrology/MoonDisc";
import a from "@/components/astrology/astrology.module.css";
import d from "./daily.module.css";

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
    kicker: "The almanac", title: "The day in detail", lead: "Everything the reading rests on, worked out for today. Open a row to read it.",
    timing: "The hours of today", sunrise: "sunrise", sunset: "sunset", now: "now",
    moon: "The Moon", lit: (p: number) => `${p}% lit`,
    season: "What is in force now", seasonMeta: "for weeks", ruler: "your ruling planet", retro: "retrograde",
    chapters: "The long chapters", chaptersMeta: "for years",
    dates: "The next fourteen days", also: "Also in the sky today",
    until: (d: string) => `until ${d}`,
  },
  uk: {
    kicker: "Альманах", title: "День докладніше", lead: "Усе, на чому тримається читання, розраховане на сьогодні. Відкрийте рядок, щоб прочитати.",
    timing: "Години сьогодні", sunrise: "схід", sunset: "захід", now: "зараз",
    moon: "Місяць", lit: (p: number) => `освітлено ${p}%`,
    season: "Що діє зараз", seasonMeta: "тижнями", ruler: "управитель вашого знака", retro: "ретроградний",
    chapters: "Довгі розділи", chaptersMeta: "роками",
    dates: "Наступні чотирнадцять днів", also: "Також на небі сьогодні",
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

export default function DailyAlmanac({ locale, reading, day, copy, now }: { locale: Locale; reading: DailyReading; day: Day; copy: AstroCopy; now: number }) {
  const t = UI[locale];
  const fmt = (x: number, o: Intl.DateTimeFormatOptions) => ENGINE.fmt(x, locale, o);
  const hm = (x: number) => fmt(x, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const short = (x: number) => fmt(x, { day: "numeric", month: "long" });
  const house = (n: number | null) => (n ? copy.houses[String(n)]?.name ?? "" : "");
  const body = (k: string) => copy.bodies[k]?.name ?? k;
  const G = COMPOSE.GLYPH as Record<string, string>;
  const span = day.dayEnd - day.dayStart, pos = (x: number) => Math.max(0, Math.min(100, (x - day.dayStart) / span * 100));
  const rise = day.sun?.rise, set = day.sun?.set;
  const path = rise && set ? sunPath(pos(rise), pos(set)) : null;
  const nowPos = pos(now);
  const showNow = now >= day.dayStart && now <= day.dayEnd;
  const m = reading.moon;
  const w0 = day.asOf - 21 * 864e5, w1 = day.asOf + 56 * 864e5, x = (tt: number) => (tt - w0) / (w1 - w0) * 100;
  const TEXT = "︎";

  return (
    <section className={a.block} aria-labelledby="almanac-title">
      <p className={a.kicker}>{t.kicker}</p>
      <h2 id="almanac-title" className={a.h2}>{t.title}</h2>
      <p className={a.blockLead}>{t.lead}</p>
      <ul className={a.ledger}>
        <li>
          <details className={a.row}>
            <summary>
              <span className={a.glyph} aria-hidden>{"☉" + TEXT}</span>
              <span className={a.rowName}>{t.timing}</span>
              <span className={a.rowMeta}>{rise && set ? `${t.sunrise} ${hm(rise)} · ${t.sunset} ${hm(set)}` : ""}</span>
            </summary>
            <div className={a.rowBody}>
              {path && (
                <div className={d.sunStrip} aria-hidden>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={path.day + "Z"} className={d.sunFill} />
                    <path d={path.day} className={d.sunDay} />
                    {path.night.map((n, i) => <path key={i} d={n} className={d.sunNight} />)}
                    <line x1="0" x2="100" y1={HORIZON} y2={HORIZON} className={d.horizon} />
                  </svg>
                  {[0, 6, 12, 18, 24].map((h) => <span key={h} className={d.hour} style={{ left: `${h / 24 * 100}%` }}>{String(h).padStart(2, "0")}</span>)}
                  {reading.timing.filter((e) => e.at).map((e, i) => <span key={i} className={d.event} style={{ left: `${pos(e.at!)}%`, top: `${HORIZON}%` }} />)}
                  {showNow && <span className={d.nowDot} style={{ left: `${nowPos}%`, top: `${path.y(nowPos)}%` }} data-t={hm(now)} />}
                </div>
              )}
              <ol className={d.times}>
                {reading.timing.map((e, i) => (
                  <li key={i}><span className={d.time}>{e.at ? hm(e.at) : "—"}</span><span className={d.timeGlyph} aria-hidden>{e.glyph}</span><span>{e.label}</span></li>
                ))}
              </ol>
            </div>
          </details>
        </li>
        <li>
          <details className={a.row}>
            <summary>
              <span className={a.glyph} aria-hidden>{"☽" + TEXT}</span>
              <span className={a.rowName}>{t.moon}</span>
              <span className={a.rowMeta}>{m.name} · {t.lit(Math.round(m.illum * 100))}</span>
            </summary>
            <div className={`${a.rowBody} ${d.moonBody}`}>
              <div className={d.moonDisc}><MoonDisc angle={m.angle} label={`${m.name}, ${t.lit(Math.round(m.illum * 100))}`} /></div>
              <div>
                <p>{m.text}</p>
                {m.house && <p><strong>{house(m.house)}.</strong> {copy.houses[String(m.house)]?.area}</p>}
                {m.next && <p className={a.hint}>{m.next.name} · {fmt(m.next.at, { weekday: "long", day: "numeric", month: "long" })}, {hm(m.next.at)}</p>}
              </div>
            </div>
          </details>
        </li>
        <li>
          <details className={a.row}>
            <summary>
              <span className={a.glyph} aria-hidden>{"♄" + TEXT}</span>
              <span className={a.rowName}>{t.season}</span>
              <span className={a.rowMeta}>{t.seasonMeta}</span>
            </summary>
            <div className={a.rowBody}>
              <ul className={d.season}>
                {reading.season.map((s, i) => {
                  const from = Math.max(s.start || w0, w0), to = Math.min(s.end || w1, w1);
                  return (
                    <li key={i}>
                      <p className={d.seasonHead}><span className={d.timeGlyph} aria-hidden>{G[s.planet] + TEXT}</span><strong>{body(s.planet)}</strong> · {house(s.house)}{s.end ? ` · ${t.until(short(s.end))}` : ""}{s.isRuler ? ` · ${t.ruler}` : ""}</p>
                      <div className={d.track} aria-hidden>
                        <span className={d.bar} style={{ left: `${x(from)}%`, width: `${Math.max(1.5, x(to) - x(from))}%` }} />
                        {s.retro && <span className={d.retro} style={{ left: `${x(Math.max(s.retro.start, from))}%`, width: `${Math.max(0, x(Math.min(s.retro.end, to)) - x(Math.max(s.retro.start, from)))}%` }} />}
                        <span className={d.todayLine} style={{ left: `${x(day.asOf)}%` }} />
                      </div>
                      <p className={d.seasonTheme}>{s.theme}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        </li>
        <li>
          <details className={a.row}>
            <summary>
              <span className={a.glyph} aria-hidden>{"♇" + TEXT}</span>
              <span className={a.rowName}>{t.chapters}</span>
              <span className={a.rowMeta}>{t.chaptersMeta}</span>
            </summary>
            <div className={a.rowBody}>
              {reading.chapters.map((ch, i) => (
                <div key={i} className={d.chapter}>
                  <p className={d.seasonHead}><span className={d.timeGlyph} aria-hidden>{G[ch.planet] + TEXT}</span><strong>{ch.theme}</strong></p>
                  <p className={a.hint}>{body(ch.planet)} · {house(ch.house)}{ch.retro ? ` · ${t.retro}` : ""} · {ch.from}–{ch.to}</p>
                  <p>{ch.text}</p>
                </div>
              ))}
            </div>
          </details>
        </li>
        {reading.dates.length > 0 && (
          <li>
            <details className={a.row}>
              <summary>
                <span className={a.glyph} aria-hidden>{"◐" + TEXT}</span>
                <span className={a.rowName}>{t.dates}</span>
                <span className={a.rowMeta}>{short(reading.dates[0].at)} — {short(reading.dates[reading.dates.length - 1].at)}</span>
              </summary>
              <div className={a.rowBody}>
                <ol className={d.dates}>
                  {reading.dates.map((e, i) => (
                    <li key={i}>
                      <p className={d.date}><strong>{fmt(e.at, { day: "numeric", month: "long" })}</strong> · {fmt(e.at, { weekday: "long" })}, {hm(e.at)}</p>
                      <p className={d.seasonHead}><span className={d.timeGlyph} aria-hidden>{e.glyph + TEXT}</span>{e.title}{e.house ? ` · ${house(e.house)}` : ""}</p>
                      {e.text && <p>{e.text}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </li>
        )}
        {(reading.alsoPara.length > 0 || reading.keep.length > 0) && (
          <li>
            <details className={a.row}>
              <summary>
                <span className={a.glyph} aria-hidden>{"✦" + TEXT}</span>
                <span className={a.rowName}>{t.also}</span>
              </summary>
              <div className={a.rowBody}>
                {reading.alsoPara.map((p, i) => <p key={"a" + i}>{p}</p>)}
                {reading.moonPara.length > 0 && <p>{reading.moonPara.join(" ")}</p>}
                {reading.keep.map((k, i) => <p key={"k" + i}><strong>{body(k.planet)}.</strong> {k.text}</p>)}
              </div>
            </details>
          </li>
        )}
      </ul>
    </section>
  );
}
