"use client";

/**
 * EphemerisNote — the almanac's marginal truth.
 *
 * A small double-hairline plate: the real Moon at this minute (drawn
 * true) and, for a returning reader, how far she has travelled since
 * their last visit. Client-only — the sky is Date-dependent. Shares
 * the visit memory key with the old reading room so continuity holds.
 */

import { useEffect, useState } from "react";
import TrueMoon from "@/components/sky/TrueMoon";
import { moonState, moonDegreesSince } from "@/lib/sky/live";

export default function EphemerisNote({ locale }: { locale: string }) {
  const [note, setNote] = useState<{ phaseDeg: number; line: string; since: string | null } | null>(null);

  useEffect(() => {
    try {
      const m = moonState();
      const isUk = locale === "uk";
      const pct = Math.round(m.illum * 100);
      const line = isUk
        ? `Місяць над вами зараз — ${m.nameUk.toLowerCase()}, освітлено ${pct}%. Намальовано правдиво.`
        : `The Moon above you now — ${m.nameEn.toLowerCase()}, ${pct}% lit. Drawn true.`;
      let since: string | null = null;
      const KEY = "oa-almanac-memory";
      let rec: { t: number; lon: number } | null = null;
      try {
        rec = JSON.parse(localStorage.getItem(KEY) ?? "null");
      } catch {}
      const nowMs = Date.now();
      if (rec && typeof rec.t === "number" && typeof rec.lon === "number" && nowMs - rec.t > 6 * 3600_000) {
        const deg = moonDegreesSince(rec.lon, rec.t);
        since = isUk
          ? `Відколи ви були тут, вона пройшла ${deg}° неба.`
          : `Since you last came, she has travelled ${deg}° of sky.`;
      }
      if (!rec || nowMs - rec.t > 3600_000) {
        try {
          localStorage.setItem(KEY, JSON.stringify({ t: nowMs, lon: m.eclipticLon }));
        } catch {}
      }
      setNote({ phaseDeg: m.phaseDeg, line, since });
    } catch {}
  }, [locale]);

  if (!note) return null;

  return (
    <aside className="eph-note" aria-label={locale === "uk" ? "Ефемериди сьогодні" : "Ephemeris tonight"}>
      <div className="eph-moon" aria-hidden>
        <TrueMoon phaseDeg={note.phaseDeg} size={44} />
      </div>
      <div className="eph-body">
        <p className="eph-kicker">{locale === "uk" ? "ЕФЕМЕРИДИ — СЬОГОДНІ" : "EPHEMERIS — TONIGHT"}</p>
        <p className="eph-line">
          {note.line}
          {note.since && <> {note.since}</>}
        </p>
      </div>
      <style jsx>{`
        .eph-note {
          display: flex;
          align-items: center;
          gap: 0.95rem;
          margin: 1.3rem 0 0.4rem;
          padding: 0.85rem 1rem;
          border: 1px solid rgba(232, 233, 255, 0.16);
          outline: 1px solid rgba(232, 233, 255, 0.07);
          outline-offset: 4px;
          max-width: 30rem;
        }
        .eph-moon {
          flex: none;
          line-height: 0;
        }
        .eph-kicker {
          margin: 0 0 0.35rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--ox, #e0b768);
        }
        .eph-line {
          margin: 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.7rem;
          line-height: 1.7;
          letter-spacing: 0.05em;
          color: rgba(183, 188, 233, 0.8);
        }
      `}</style>
    </aside>
  );
}
