"use client";

/**
 * BirthDataForm — the one engraved birth-data plate.
 *
 * Shared by /chart and /portrait: a framed plate in the homepage
 * inscription's language (hairline + offset outline), the date and time
 * set in the almanac's own mono cells — no native pickers anywhere —
 * city search with the resolved place + offset line, and an honest
 * unknown-time toggle. The submit sleeps visibly until the plate is
 * complete, then wakes with a small gilt ink-in.
 *
 * Register-agnostic: colors resolve through the shell's tokens
 * (--ink/--ox on the almanac pages, --bone/--ember on the night rooms)
 * with the house palette as fallback.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  searchCities,
  type CityData,
  utcOffsetHours,
  fmtUtcOffset,
  isSummerTime,
} from "@/lib/cities";

export interface BirthFormValue {
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM — "" when timeUnknown */
  time: string;
  timeUnknown: boolean;
  city: CityData;
  name?: string;
}

export interface BirthDataFormCopy {
  fig: string;
  nameLabel: string;
  namePlaceholder: string;
  dateLabel: string;
  dayPh: string;
  monthPh: string;
  yearPh: string;
  timeLabel: string;
  timeUnknownOff: string;
  timeUnknownOn: string;
  noonNote: string;
  cityLabel: string;
  cityPlaceholder: string;
  cityNone: string;
  tzLine: (city: string, off: string, summer: boolean) => string;
  submit: string;
  submitAsleep: string;
}

const EN: BirthDataFormCopy = {
  fig: "Fig. — the birth data",
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
  tzLine: (city, off, summer) => `computed for ${city} · ${off}${summer ? " (summer time)" : ""}`,
  submit: "Compute the chart",
  submitAsleep: "date · time · place complete the plate",
};

interface Props {
  onSubmit: (value: BirthFormValue) => void;
  copy?: Partial<BirthDataFormCopy>;
  withName?: boolean;
  /** Disables the whole plate while the caller computes. */
  busy?: boolean;
}

const pad2 = (s: string) => s.padStart(2, "0");

export default function BirthDataForm({ onSubmit, copy: copyOverride, withName = false, busy = false }: Props) {
  const copy: BirthDataFormCopy = { ...EN, ...copyOverride };

  const [name, setName] = useState("");
  const [dd, setDd] = useState("");
  const [mm, setMm] = useState("");
  const [yyyy, setYyyy] = useState("");
  const [hh, setHh] = useState("");
  const [mi, setMi] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);

  // City search
  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState<CityData | null>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const cityWrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => (city ? [] : searchCities(cityQuery)),
    [cityQuery, city],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityWrapRef.current && !cityWrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Validation ────────────────────────────────────────────────
  const yearNow = new Date().getFullYear();
  const yNum = parseInt(yyyy, 10);
  const mNum = parseInt(mm, 10);
  const dNum = parseInt(dd, 10);
  const yearOk = yyyy.length === 4 && yNum >= 1900 && yNum <= yearNow;
  const monthOk = mm.length > 0 && mNum >= 1 && mNum <= 12;
  const maxDay = yearOk && monthOk ? new Date(yNum, mNum, 0).getDate() : 31;
  const dayOk = dd.length > 0 && dNum >= 1 && dNum <= maxDay;
  const dateOk = yearOk && monthOk && dayOk;

  const hNum = parseInt(hh, 10);
  const miNum = parseInt(mi, 10);
  const timeOk =
    timeUnknown ||
    (hh.length > 0 && hNum >= 0 && hNum <= 23 && mi.length > 0 && miNum >= 0 && miNum <= 59);

  const complete = dateOk && timeOk && !!city && !busy;

  // Resolved place + offset — shown as soon as it can be known.
  const tzLine = useMemo(() => {
    if (!city || !dateOk) return null;
    const h = timeUnknown ? 12 : Number.isFinite(hNum) ? hNum : 12;
    const m = timeUnknown ? 0 : Number.isFinite(miNum) ? miNum : 0;
    const off = utcOffsetHours(city.zone, yNum, mNum, dNum, h, m);
    if (!Number.isFinite(off)) return null;
    return copy.tzLine(
      city.name.toUpperCase(),
      fmtUtcOffset(off),
      isSummerTime(city.zone, yNum, mNum, dNum, h, m),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, dateOk, yNum, mNum, dNum, hNum, miNum, timeUnknown]);

  // ── Cell helpers: digits only, auto-advance, backspace retreats ──
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);
  const setCellRef = (i: number) => (el: HTMLInputElement | null) => {
    cellRefs.current[i] = el;
  };

  const onCellInput = (i: number, len: number, set: (v: string) => void) =>
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const v = el.value.replace(/\D/g, "").slice(0, len);
      set(v);
      if (v.length >= len) {
        // next still-mounted cell
        for (let j = i + 1; j < cellRefs.current.length; j++) {
          const next = cellRefs.current[j];
          if (next) { next.focus(); next.select?.(); break; }
        }
      }
    };

  const onCellKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && e.currentTarget.value === "") {
      for (let j = i - 1; j >= 0; j--) {
        const prev = cellRefs.current[j];
        if (prev) { e.preventDefault(); prev.focus(); prev.select?.(); break; }
      }
    }
  };

  // Clamp + pad cells on blur. Reads the DOM value, not closed-over state —
  // the auto-advance blur can fire before React commits the last keystroke.
  const blurPad = (set: (s: string) => void, max: number) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const v = e.currentTarget.value.replace(/\D/g, "");
      if (!v) return;
      let n = parseInt(v, 10);
      if (!Number.isFinite(n)) return;
      if (n > max) n = max;
      set(pad2(String(n)));
    };

  // ── Submit + wake ─────────────────────────────────────────────
  const wasComplete = useRef(false);
  const [woke, setWoke] = useState(false);
  useEffect(() => {
    if (complete && !wasComplete.current) setWoke(true);
    if (!complete) setWoke(false);
    wasComplete.current = complete;
  }, [complete]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!complete || !city) return;
      onSubmit({
        date: `${yyyy}-${pad2(mm)}-${pad2(dd)}`,
        time: timeUnknown ? "" : `${pad2(hh)}:${pad2(mi)}`,
        timeUnknown,
        city,
        name: name.trim() || undefined,
      });
    },
    [complete, city, yyyy, mm, dd, hh, mi, timeUnknown, name, onSubmit],
  );

  const selectCity = (c: CityData) => {
    setCity(c);
    setCityQuery(`${c.name}, ${c.country}`);
    setOpen(false);
    setHi(-1);
  };

  return (
    <form className="bdf" onSubmit={handleSubmit} noValidate>
      <p className="bdf-fig" aria-hidden>{copy.fig}</p>

      {withName && (
        <div className="bdf-field">
          <label className="bdf-label" htmlFor="bdf-name">{copy.nameLabel}</label>
          <input
            id="bdf-name"
            type="text"
            className="bdf-cell bdf-wide"
            placeholder={copy.namePlaceholder}
            autoComplete="name"
            value={name}
            maxLength={40}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      {/* Date — one label layer: the caption above, the cells speak DD·MM·YYYY */}
      <fieldset className="bdf-field bdf-group" disabled={busy}>
        <legend className="bdf-label">{copy.dateLabel} *</legend>
        <div className="bdf-cells">
          <input
            ref={setCellRef(0)}
            className="bdf-cell"
            style={{ width: "3.4ch" }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder={copy.dayPh}
            aria-label={copy.dayPh}
            autoComplete="bday-day"
            value={dd}
            onInput={onCellInput(0, 2, setDd)}
            onKeyDown={onCellKeyDown(0)}
            onBlur={blurPad(setDd, maxDay)}
          />
          <span className="bdf-sep" aria-hidden>·</span>
          <input
            ref={setCellRef(1)}
            className="bdf-cell"
            style={{ width: "3.4ch" }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder={copy.monthPh}
            aria-label={copy.monthPh}
            autoComplete="bday-month"
            value={mm}
            onInput={onCellInput(1, 2, setMm)}
            onKeyDown={onCellKeyDown(1)}
            onBlur={blurPad(setMm, 12)}
          />
          <span className="bdf-sep" aria-hidden>·</span>
          <input
            ref={setCellRef(2)}
            className="bdf-cell"
            style={{ width: "5.6ch" }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder={copy.yearPh}
            aria-label={copy.yearPh}
            autoComplete="bday-year"
            value={yyyy}
            onInput={onCellInput(2, 4, setYyyy)}
            onKeyDown={onCellKeyDown(2)}
          />
        </div>
      </fieldset>

      {/* Time — same engraved cells; the toggle is honest about noon */}
      <fieldset className="bdf-field bdf-group" disabled={busy}>
        <legend className="bdf-label">
          {copy.timeLabel} {timeUnknown ? "" : "*"}
        </legend>
        {!timeUnknown ? (
          <div className="bdf-cells">
            <input
              ref={setCellRef(3)}
              className="bdf-cell"
              style={{ width: "3.4ch" }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="HH"
              aria-label="HH"
              value={hh}
              onInput={onCellInput(3, 2, setHh)}
              onKeyDown={onCellKeyDown(3)}
              onBlur={blurPad(setHh, 23)}
            />
            <span className="bdf-sep" aria-hidden>:</span>
            <input
              ref={setCellRef(4)}
              className="bdf-cell"
              style={{ width: "3.4ch" }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              placeholder="MM"
              aria-label="MM"
              value={mi}
              onInput={onCellInput(4, 2, setMi)}
              onKeyDown={onCellKeyDown(4)}
              onBlur={blurPad(setMi, 59)}
            />
          </div>
        ) : (
          <div className="bdf-cells bdf-noon" aria-hidden>
            <span className="bdf-cell bdf-ghostcell">12</span>
            <span className="bdf-sep">:</span>
            <span className="bdf-cell bdf-ghostcell">00</span>
            <span className="bdf-noon-note">{copy.noonNote}</span>
          </div>
        )}
        <button
          type="button"
          className={`bdf-toggle ${timeUnknown ? "on" : ""}`}
          aria-pressed={timeUnknown}
          disabled={busy}
          onClick={() => {
            setTimeUnknown(!timeUnknown);
            setHh("");
            setMi("");
          }}
        >
          {timeUnknown ? copy.timeUnknownOn : copy.timeUnknownOff}
        </button>
      </fieldset>

      {/* City */}
      <div className="bdf-field" ref={cityWrapRef}>
        <label className="bdf-label" htmlFor="bdf-city">{copy.cityLabel} *</label>
        <div className="bdf-citywrap">
          <input
            id="bdf-city"
            type="text"
            className="bdf-cell bdf-wide"
            placeholder={copy.cityPlaceholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open && cityQuery.length >= 2}
            aria-controls="bdf-citylist"
            aria-autocomplete="list"
            value={cityQuery}
            disabled={busy}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setOpen(true);
              setHi(-1);
              if (city) setCity(null);
            }}
            onFocus={() => { if (!city && cityQuery.length >= 2) setOpen(true); }}
            onKeyDown={(e) => {
              if (!open || results.length === 0) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % results.length); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + results.length) % results.length); }
              else if (e.key === "Enter") { e.preventDefault(); selectCity(results[hi >= 0 ? hi : 0]); }
              else if (e.key === "Escape") { setOpen(false); }
            }}
          />
          {open && cityQuery.length >= 2 && !city && (
            <div className="bdf-drop" id="bdf-citylist" role="listbox">
              {results.length > 0 ? (
                results.map((c, i) => (
                  <button
                    key={`${c.name}-${c.country}`}
                    type="button"
                    role="option"
                    aria-selected={i === hi}
                    className={`bdf-opt ${i === hi ? "hi" : ""}`}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => selectCity(c)}
                  >
                    <span className="bdf-opt-name">{c.name}</span>
                    <span className="bdf-opt-country">{c.country}</span>
                  </button>
                ))
              ) : (
                <p className="bdf-none">{copy.cityNone}</p>
              )}
            </div>
          )}
        </div>
        <span className={`bdf-tz ${tzLine ? "show" : ""}`} aria-live="polite">
          {tzLine ?? " "}
        </span>
      </div>

      {/* Submit — sleeps until the plate is complete, wakes with gilt ink */}
      <button
        type="submit"
        className={`bdf-submit ${woke ? "wake" : ""}`}
        disabled={!complete}
        aria-disabled={!complete}
      >
        <span>{copy.submit}</span>
      </button>
      <p className={`bdf-hint ${complete ? "off" : ""}`} aria-hidden={complete}>
        {copy.submitAsleep}
      </p>

      <style jsx>{`
        .bdf {
          /* Resolve through whichever register hosts the plate. */
          --b-ink: var(--ink, var(--bone, #e8e9ff));
          --b-soft: var(--ink-soft, var(--bone-soft, rgba(232, 233, 255, 0.78)));
          --b-faint: var(--ink-faint, var(--bone-faint, rgba(183, 188, 233, 0.6)));
          --b-hair: var(--hairline, rgba(232, 233, 255, 0.16));
          --b-gilt: var(--ox, var(--ember, #e0b768));
          --b-ease: var(--ease, cubic-bezier(0.16, 1, 0.3, 1));
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
          width: 100%;
          max-width: 26rem;
          margin: 0 auto;
          padding: clamp(1.6rem, 4vw, 2.4rem) clamp(1.2rem, 3.5vw, 2rem) clamp(1.4rem, 3.5vw, 2rem);
          border: 1px solid var(--b-hair);
          outline: 1px solid rgba(232, 233, 255, 0.08);
          outline-offset: 6px;
          background: rgba(10, 13, 56, 0.28);
          text-align: left;
        }

        .bdf-fig {
          margin: 0 0 -0.2rem;
          text-align: center;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--b-gilt);
        }

        .bdf-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .bdf-group {
          margin: 0;
          padding: 0;
          border: 0;
          min-width: 0;
        }

        .bdf-label {
          display: block;
          padding: 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--b-faint);
          margin-bottom: 0.45rem;
        }

        .bdf-field .bdf-label {
          margin-bottom: 0;
        }

        .bdf-cells {
          display: flex;
          align-items: baseline;
          gap: 0.55rem;
        }

        .bdf-cell {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 1.15rem;
          letter-spacing: 0.1em;
          text-align: center;
          color: var(--b-ink);
          background: transparent;
          border: 0;
          border-bottom: 1px solid rgba(232, 233, 255, 0.32);
          border-radius: 0;
          padding: 0.25rem 0.1rem 0.4rem;
          transition: border-color 240ms var(--b-ease);
          caret-color: var(--b-gilt);
          min-width: 0;
        }

        .bdf-cell::placeholder {
          color: rgba(183, 188, 233, 0.4);
          letter-spacing: 0.14em;
        }

        .bdf-cell:focus-visible {
          outline: none !important;
          border-bottom-color: var(--b-gilt);
        }

        .bdf-wide {
          width: 100%;
          text-align: left;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
          font-family: var(--font-body, system-ui), sans-serif;
        }

        .bdf-sep {
          font-size: 1.05rem;
          color: rgba(183, 188, 233, 0.45);
        }

        .bdf-ghostcell {
          border-bottom-style: dashed;
          border-bottom-color: rgba(232, 233, 255, 0.18);
          color: var(--b-faint);
          display: inline-block;
          width: 3.4ch;
        }

        .bdf-noon-note {
          margin-left: 0.4rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--b-faint);
        }

        .bdf-toggle {
          align-self: flex-start;
          margin-top: 0.45rem;
          padding: 0.1rem 0;
          background: none;
          border: none;
          border-bottom: 1px solid transparent;
          cursor: pointer;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          color: var(--b-faint);
          transition: color 200ms var(--b-ease);
        }

        .bdf-toggle:hover {
          color: var(--b-ink);
        }

        .bdf-toggle.on {
          color: var(--b-gilt);
        }

        /* City */
        .bdf-citywrap {
          position: relative;
        }

        .bdf-drop {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 40;
          background: rgba(10, 13, 56, 0.97);
          border: 1px solid var(--b-hair);
          max-height: 210px;
          overflow-y: auto;
          box-shadow: 0 0.8rem 1.8rem rgba(4, 6, 32, 0.5);
        }

        .bdf-opt {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 0.8rem;
          width: 100%;
          padding: 0.55rem 0.85rem;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(183, 188, 233, 0.08);
          cursor: pointer;
          text-align: left;
          transition: background 150ms var(--b-ease);
        }

        .bdf-opt:last-child {
          border-bottom: none;
        }

        .bdf-opt.hi,
        .bdf-opt:hover {
          background: rgba(183, 188, 233, 0.08);
        }

        .bdf-opt-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.98rem;
          color: var(--b-ink);
        }

        .bdf-opt-country {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--b-faint);
        }

        .bdf-none {
          margin: 0;
          padding: 0.65rem 0.85rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--b-faint);
        }

        .bdf-tz {
          min-height: 1em;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--b-gilt);
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 500ms var(--b-ease), transform 500ms var(--b-ease);
        }

        .bdf-tz.show {
          opacity: 1;
          transform: none;
        }

        /* Submit — asleep until complete, then a gilt ink-in */
        .bdf-submit {
          position: relative;
          overflow: hidden;
          margin-top: 0.2rem;
          min-height: 3rem;
          padding: 0.8rem 1.6rem;
          background: transparent;
          border: 1px solid var(--b-hair);
          color: var(--b-faint);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: default;
          transition: color 300ms var(--b-ease), border-color 300ms var(--b-ease);
        }

        .bdf-submit:disabled {
          opacity: 0.45;
          border-style: dashed;
        }

        .bdf-submit span {
          position: relative;
          z-index: 1;
        }

        .bdf-submit::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(224, 183, 104, 0.24), rgba(224, 183, 104, 0.06) 70%, transparent);
          transform: translateY(101%);
          transition: transform 460ms var(--b-ease);
        }

        .bdf-submit.wake {
          cursor: pointer;
          color: var(--b-gilt);
          border-color: rgba(224, 183, 104, 0.55);
          border-style: solid;
          animation: bdf-wake 640ms var(--b-ease);
        }

        .bdf-submit.wake:hover,
        .bdf-submit.wake:focus-visible {
          color: var(--b-ink);
          border-color: var(--b-gilt);
        }

        .bdf-submit.wake:hover::before,
        .bdf-submit.wake:focus-visible::before {
          transform: translateY(0);
        }

        .bdf-submit.wake:active {
          transform: translateY(1px);
        }

        @keyframes bdf-wake {
          0% {
            color: var(--b-faint);
            border-color: var(--b-hair);
          }
          100% {
            color: var(--b-gilt);
            border-color: rgba(224, 183, 104, 0.55);
          }
        }

        .bdf-hint {
          margin: -0.7rem 0 0;
          text-align: center;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--b-faint);
          opacity: 0.8;
          transition: opacity 400ms var(--b-ease);
        }

        .bdf-hint.off {
          opacity: 0;
        }

        @media (max-width: 430px) {
          .bdf {
            padding: 1.4rem 1rem 1.2rem;
            outline-offset: 4px;
          }

          .bdf-cell {
            font-size: 1.05rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bdf-submit,
          .bdf-submit::before,
          .bdf-tz,
          .bdf-toggle,
          .bdf-cell,
          .bdf-hint {
            transition: none;
            animation: none;
          }

          .bdf-submit.wake {
            animation: none;
          }
        }
      `}</style>
    </form>
  );
}
