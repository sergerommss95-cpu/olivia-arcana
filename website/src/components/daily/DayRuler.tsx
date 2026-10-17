/**
 * The leaf's Kyiv day as a 24px ruler under the leading event. Every position is a real instant on the
 * day's own span, x = (t − dayStart) / (dayEnd − dayStart), so the 25-hour day when Kyiv leaves summer
 * time (25 October 2026) still places 18:00 and the event correctly. Ticks sit at the real 06:00, 12:00
 * and 18:00. The event node appears only when its exact moment falls inside the day; the now tick only
 * on today's leaf, stepping each minute without motion. The drawing is aria-hidden and mirrored as a list.
 */

import ENGINE from "@/lib/daily/engine.js";
import d from "./daily.module.css";

const TICKS = [6, 12, 18];

export default function DayRuler({ date, dayStart, dayEnd, at, now, eventLabel, nowLabel, hm }: {
  date: string;
  dayStart: number;
  dayEnd: number;
  /** The event's exact instant, already known to be inside the day. */
  at?: number;
  /** Today's current instant; left out on another day's leaf. */
  now?: number;
  eventLabel: string;
  nowLabel: string;
  hm: (t: number) => string;
}) {
  const span = dayEnd - dayStart;
  const x = (t: number) => Math.max(0, Math.min(1, (t - dayStart) / span));
  const pct = (t: number) => `${(x(t) * 100).toFixed(3)}%`;
  const showNow = now != null && now >= dayStart && now <= dayEnd;
  const ticks = TICKS.map((h) => ENGINE.kyivInstant(date, h, 0) as number);
  const marks = [
    ...(at != null ? [{ t: at, label: `${hm(at)} — ${eventLabel}` }] : []),
    ...(showNow ? [{ t: now!, label: `${nowLabel} ${hm(now!)}` }] : []),
  ].sort((p, q) => p.t - q.t);

  return (
    <div className={d.ruler}>
      <div className={d.rulerArt} aria-hidden>
        <svg className={d.rulerTrack} viewBox="0 0 1000 24" preserveAspectRatio="none" focusable="false">
          {showNow ? (
            <>
              <line x1="0" x2={x(now!) * 1000} y1="8" y2="8" className={d.trackPast} />
              <line x1={x(now!) * 1000} x2="1000" y1="8" y2="8" className={d.trackLater} />
            </>
          ) : (
            <line x1="0" x2="1000" y1="8" y2="8" className={d.trackLater} />
          )}
          {[dayStart, ...ticks, dayEnd].map((t, i) => <line key={i} x1={x(t) * 1000} x2={x(t) * 1000} y1="8" y2="13" className={d.tick} />)}
        </svg>
        <span className={d.rulerEnd} style={{ left: 0 }}>00</span>
        <span className={d.rulerEnd} style={{ left: "100%" }}>24</span>
        {showNow && <span className={d.nowTick} style={{ left: pct(now!) }} />}
        {at != null && <span className={d.eventNode} style={{ left: pct(at) }} />}
      </div>
      {marks.length > 0 && <ol className={d.srOnly}>{marks.map((m, i) => <li key={i}>{m.label}</li>)}</ol>}
    </div>
  );
}
