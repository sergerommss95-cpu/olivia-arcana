/**
 * TonightPlate — FIG. IX · COELUM VIVUM.
 *
 * The almanac's living page. Every other plate in the book is engraved
 * once and forever; this one is redrawn each minute against the actual
 * sky standing over the reader — the true Moon, the five wanderers,
 * risen or hidden, computed in the browser as the page is read.
 *
 * Client-only: sky arithmetic depends on the visitor's clock and place,
 * so nothing renders until after mount. Refreshes every 60 s, and holds
 * its breath while the tab is hidden.
 */

"use client";

import { useEffect, useState } from "react";
import {
  moonState,
  wanderers,
  moonRiseSet,
  resolveObserver,
  altitudeDeg,
} from "@/lib/sky/live";
import TrueMoon from "@/components/sky/TrueMoon";
import { useLocale } from "@/lib/i18n/useLocale";

type Observer = ReturnType<typeof resolveObserver>;
type MoonSnapshot = ReturnType<typeof moonState>;
type MoonRiseSet = ReturnType<typeof moonRiseSet>;
type WandererRow = ReturnType<typeof wanderers>[number];

interface SkySnapshot {
  now: Date;
  obs: Observer;
  moon: MoonSnapshot;
  riseSet: MoonRiseSet;
  planets: WandererRow[];
}

function computeSky(): SkySnapshot {
  const obs = resolveObserver();
  return {
    now: new Date(),
    obs,
    moon: moonState(),
    riseSet: moonRiseSet(obs),
    planets: wanderers(),
  };
}

export default function TonightPlate() {
  const { locale } = useLocale();
  const isUk = locale === "uk";

  const [sky, setSky] = useState<SkySnapshot | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Mount gate + 60 s cadence. Date-dependent — must never SSR.
  useEffect(() => {
    setSky(computeSky());
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setSky(computeSky());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // One quiet breath in after the first computation lands.
  useEffect(() => {
    if (!sky) return;
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sky]);

  if (!sky) return null;

  const timeLocale = isUk ? "uk-UA" : "en-GB";
  const fmtTime = (d: Date | null): string =>
    d ? d.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" }) : "—";

  const phaseName = isUk ? sky.moon.nameUk : sky.moon.nameEn;

  const facts: Array<{ label: string; value: string }> = [
    {
      label: isUk ? "ОСВІТЛЕНО" : "ILLUMINATED",
      value: `${Math.round(sky.moon.illum * 100)}%`,
    },
    { label: isUk ? "СХІД" : "MOONRISE", value: fmtTime(sky.riseSet.rise) },
    { label: isUk ? "ЗАХІД" : "MOONSET", value: fmtTime(sky.riseSet.set) },
  ];

  return (
    <section
      className={`mx-auto max-w-screen-2xl px-6 pt-10 pb-4 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-[clamp(24px,5.25vw,104px)] ${
        revealed ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ── The plate: double hairline frame on a translucent ground ── */}
      <div className="border border-[rgba(232,233,255,0.16)] bg-[rgba(16,19,77,0.38)] p-2">
        <div className="border border-[rgba(232,233,255,0.16)] px-6 py-12 sm:px-12 sm:py-16">
          {/* Kicker row */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[#b7bce9]">
            <span>FIG. IX — COELUM VIVUM</span>
            <span>
              {sky.obs.label} · {fmtTime(sky.now)}
              {sky.obs.approx ? " · APPROX." : ""}
            </span>
          </div>

          {/* Title + one true sentence */}
          <h2 className="m-0 mt-8 font-[family-name:var(--font-heading)] text-[clamp(28px,4vw,44px)] italic leading-tight text-[#e8e9ff]">
            {isUk ? "Небо сьогодні" : "The sky tonight"}
          </h2>
          <p className="m-0 mt-3 max-w-xl text-[15px] leading-relaxed text-[#b7bce9]">
            {isUk
              ? "Не ілюстрація — те саме небо, що зараз стоїть над вами, обчислене цієї миті."
              : "Not an illustration — the same sky that stands above you now, computed as you read."}
          </p>

          {/* Two columns: the Moon · the wanderers */}
          <div className="mt-12 grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-16">
            {/* LEFT — the true Moon */}
            <div className="flex flex-col items-center text-center">
              <TrueMoon phaseDeg={sky.moon.phaseDeg} size={180} />
              <p className="m-0 mt-6 font-[family-name:var(--font-heading)] text-[22px] italic text-[#e8e9ff]">
                {phaseName}
              </p>
              <div className="mt-5 space-y-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[#b7bce9]">
                {facts.map((f) => (
                  <p key={f.label} className="m-0">
                    {f.label} {f.value}
                  </p>
                ))}
              </div>
            </div>

            {/* RIGHT — the wanderers */}
            <div>
              <h3 className="m-0 font-[family-name:var(--font-mono)] text-[11px] font-normal uppercase tracking-[0.2em] text-[#b7bce9]">
                {isUk ? "МАНДРІВНІ СВІТИЛА" : "THE WANDERERS"}{" "}
                <span aria-hidden className="text-[#e0b768]">
                  ✦
                </span>
              </h3>
              <ul className="m-0 mt-4 list-none p-0">
                {sky.planets.map((w) => {
                  const risen = altitudeDeg(w.raH, w.decDeg, sky.obs) > 0;
                  return (
                    <li
                      key={w.key}
                      className={`flex items-baseline gap-3 border-b border-[rgba(232,233,255,0.16)] py-3 last:border-b-0 ${
                        risen ? "opacity-100" : "opacity-[0.55]"
                      }`}
                    >
                      <span aria-hidden className="w-5 shrink-0 text-[14px] text-[#e0b768]">
                        {w.symbol}
                      </span>
                      <span className="font-[family-name:var(--font-heading)] text-[17px] text-[#e8e9ff]">
                        {isUk ? w.nameUk : w.nameEn}
                      </span>
                      <span className="text-sm text-[#b7bce9]">
                        — {isUk ? `у ${w.zodiacUk}` : `in ${w.zodiacEn}`}
                      </span>
                      <span className="ml-auto shrink-0 pl-3 text-right font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[#b7bce9]">
                        {risen
                          ? isUk
                            ? "НАД ОБРІЄМ"
                            : "RISEN"
                          : isUk
                            ? "ПІД ОБРІЄМ"
                            : "BELOW THE HORIZON"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Footnote */}
          <p className="m-0 mt-14 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[rgba(183,188,233,0.6)]">
            {isUk ? "ОБЧИСЛЮЄТЬСЯ НАЖИВО" : "COMPUTED LIVE"}{" "}
            <span aria-hidden className="text-[#e0b768]">
              ✦
            </span>{" "}
            {isUk ? "ОНОВЛЮЄТЬСЯ З НЕБОМ" : "REFRESHES WITH THE SKY"}
          </p>
        </div>
      </div>
    </section>
  );
}
