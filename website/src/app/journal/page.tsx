/**
 * The Journal — daily reflection in the Personal-Almanac register.
 *
 * A commonplace book: ruled writing sheet under the day's moon, a prompt
 * as epigraph, a ledger of streak and entries, and the month laid out as
 * a printed calendar plate. Auto-saves with debounced localStorage writes.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import Paywall from "@/components/Paywall";
import { getMoonPhase } from "@/lib/celestial";
import { getDailyPrompt } from "@/lib/journal-prompts";
import {
  saveEntry, loadEntry, getStreak, getEntryCount, exportJSON, todayString, deleteEntry, getEntryDates,
} from "@/lib/journal-store";
import { useLocale } from "@/lib/i18n/useLocale";

type Tab = "write" | "calendar";

const COPY = {
  en: {
    kicker: "The commonplace book",
    title: "The Journal",
    lead: "Write under the day's moon. One page at a time, kept on this device only.",
    statStreak: "Days in a row",
    statEntries: "Entries kept",
    statMoon: "The moon",
    tabWrite: "Write",
    tabCalendar: "Calendar",
    today: "Today",
    promptLabel: "Prompt for this page",
    placeholder: "Begin writing…",
    saved: "Saved",
    saving: "Saving…",
    del: "Delete entry",
    exp: "Export all",
    calNote: "A red point marks a written page.",
    ariaPrev: "Previous month",
    ariaNext: "Next month",
    ariaEditor: "Journal entry",
  },
  uk: {
    kicker: "Записна книжка",
    title: "Журнал",
    lead: "Пишіть під місяцем дня. Одна сторінка за раз — лише на цьому пристрої.",
    statStreak: "Днів поспіль",
    statEntries: "Збережено записів",
    statMoon: "Місяць",
    tabWrite: "Писати",
    tabCalendar: "Календар",
    today: "Сьогодні",
    promptLabel: "Підказка для цієї сторінки",
    placeholder: "Почніть писати…",
    saved: "Збережено",
    saving: "Зберігається…",
    del: "Видалити запис",
    exp: "Експортувати все",
    calNote: "Червона крапка позначає списану сторінку.",
    ariaPrev: "Попередній місяць",
    ariaNext: "Наступний місяць",
    ariaEditor: "Запис журналу",
  },
};

const WEEKDAYS = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  uk: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
};

function formatDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ── The month, as a printed plate ─────────────────────────────── */

function AlmanacCalendar({
  selectedDate,
  onSelectDate,
  locale,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  locale: string;
}) {
  const copy = locale === "uk" ? COPY.uk : COPY.en;
  const weekdays = locale === "uk" ? WEEKDAYS.uk : WEEKDAYS.en;
  const localeTag = locale === "uk" ? "uk-UA" : "en-US";

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [selY, selM] = selectedDate
    ? selectedDate.split("-").map(Number)
    : [today.getFullYear(), today.getMonth() + 1];
  const [viewYear, setViewYear] = useState(selY);
  const [viewMonth, setViewMonth] = useState(selM - 1); // 0-indexed

  const entryDates = useMemo(() => getEntryDates(), []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const days: Array<{
      day: number; dateStr: string; moonEmoji: string;
      hasEntry: boolean; isToday: boolean; isSelected: boolean;
    } | null> = [];

    for (let i = 0; i < startWeekday; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(viewYear, viewMonth, d);
      const phase = getMoonPhase(new Date(viewYear, viewMonth, d, 12));
      days.push({
        day: d,
        dateStr,
        moonEmoji: phase.emoji,
        hasEntry: entryDates.has(dateStr),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [viewYear, viewMonth, entryDates, todayStr, selectedDate]);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(localeTag, {
    month: "long", year: "numeric",
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div className="cal alm-card">
      <div className="cal-head">
        <button type="button" onClick={prevMonth} aria-label={copy.ariaPrev}>&larr;</button>
        <span className="cal-month">{monthName}</span>
        <button type="button" onClick={nextMonth} aria-label={copy.ariaNext}>&rarr;</button>
      </div>

      <div className="cal-grid">
        {weekdays.map((wd) => (
          <span key={wd} className="cal-wd alm-caption">{wd}</span>
        ))}
        {calendarDays.map((cell, i) => {
          if (!cell) return <span key={`blank-${i}`} aria-hidden />;
          return (
            <button
              type="button"
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              aria-pressed={cell.isSelected}
              className={`cal-day ${cell.isSelected ? "sel" : ""} ${cell.isToday ? "today" : ""}`}
            >
              <span className="cal-num">{cell.day}</span>
              <span className="cal-moon" aria-hidden>{cell.moonEmoji}</span>
              {cell.hasEntry && <span className="cal-dot" aria-hidden />}
            </button>
          );
        })}
      </div>

      <p className="cal-note alm-caption">{copy.calNote}</p>

      <style jsx>{`
        .cal-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.8rem;
          margin-bottom: 0.9rem;
        }

        .cal-head button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.2rem 0.55rem;
          color: var(--ink-soft);
          font-family: inherit;
          font-size: 1rem;
          transition: color 200ms var(--ease);
        }

        .cal-head button:hover {
          color: var(--ox);
        }

        .cal-month {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.3rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .cal-wd {
          text-align: center;
          padding: 0.3rem 0;
        }

        .cal-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          min-height: 3rem;
          padding: 0.35rem 0.2rem;
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 200ms var(--ease);
        }

        .cal-day:hover {
          border-color: var(--hairline);
        }

        .cal-day.today {
          background: var(--paper-deep);
        }

        .cal-day.sel {
          border-color: var(--ox);
        }

        .cal-num {
          font-size: 0.72rem;
          color: var(--ink);
          font-variant-numeric: oldstyle-nums;
        }

        .cal-day.today .cal-num {
          font-weight: 700;
        }

        .cal-moon {
          font-size: 0.7rem;
          line-height: 1;
          filter: grayscale(1);
          opacity: 0.65;
        }

        .cal-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--ox);
        }

        .cal-note {
          margin: 0.9rem 0 0;
          text-align: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .cal-head button,
          .cal-day {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────── */

export default function JournalPage() {
  const { locale } = useLocale();
  const copy = locale === "uk" ? COPY.uk : COPY.en;
  const localeTag = locale === "uk" ? "uk-UA" : "en-US";

  const [tab, setTab] = useState<Tab>("write");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Moon phase for selected date
  const moonData = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return getMoonPhase(new Date(y, m - 1, d, 12));
  }, [selectedDate]);

  // Prompt for selected date
  const prompt = useMemo(() => getDailyPrompt(moonData.phase, selectedDate), [moonData.phase, selectedDate]);

  const refreshStats = useCallback(() => {
    setStreak(getStreak());
    setTotalEntries(getEntryCount());
  }, []);

  // Load entry when date changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const entry = loadEntry(selectedDate);
      setText(entry?.text || "");
      setSaved(false);
      refreshStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate, refreshStats]);

  // Debounced auto-save
  const handleTextChange = useCallback((val: string) => {
    setText(val);
    setSaved(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        saveEntry(selectedDate, val, prompt);
        setSaved(true);
        refreshStats();
      }
    }, 500);
  }, [selectedDate, prompt, refreshStats]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleExport = useCallback(() => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cosmic-journal-${todayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDelete = useCallback(() => {
    const entry = loadEntry(selectedDate);
    if (entry) {
      deleteEntry(entry.id);
      setText("");
      setSaved(false);
      refreshStats();
    }
  }, [selectedDate, refreshStats]);

  const isToday = selectedDate === todayString();
  const dateLabel = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(localeTag, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  })();

  return (
    <AlmanacShell narrow>
      <div className="journal">
        <header className="j-head">
          <p className="alm-kicker">{copy.kicker}</p>
          <h1 className="alm-h1">{copy.title}</h1>
          <p className="alm-lead j-lead">{copy.lead}</p>
        </header>

        {/* Ledger of practice */}
        <div className="j-stats">
          <div className="j-stat">
            <span className="j-stat-label">{copy.statStreak}</span>
            <span className="j-leader" aria-hidden />
            <span className="j-stat-val">{streak}</span>
          </div>
          <div className="j-stat">
            <span className="j-stat-label">{copy.statEntries}</span>
            <span className="j-leader" aria-hidden />
            <span className="j-stat-val">{totalEntries}</span>
          </div>
          <div className="j-stat">
            <span className="j-stat-label">{copy.statMoon}</span>
            <span className="j-leader" aria-hidden />
            <span className="j-stat-val">
              <span className="j-moon-emoji" aria-hidden>{moonData.emoji}</span> {moonData.phase}
            </span>
          </div>
        </div>

        {/* Insight-tier and above */}
        <div className="alm-gate">
          <Paywall requires="insight" priceKey="insight_monthly" featureName="the cosmic journal">
            {/* Tabs */}
            <div className="j-tabs" role="tablist">
              {(["write", "calendar"] as Tab[]).map((tb) => (
                <button
                  type="button"
                  key={tb}
                  role="tab"
                  aria-selected={tab === tb}
                  className={`j-tab ${tab === tb ? "on" : ""}`}
                  onClick={() => setTab(tb)}
                >
                  {tb === "write" ? copy.tabWrite : copy.tabCalendar}
                </button>
              ))}
            </div>

            {tab === "write" ? (
              /* ── WRITE TAB ── */
              <div className="j-sheet">
                <div className="j-sheet-head">
                  <div>
                    <span className="j-date">{isToday ? copy.today : dateLabel}</span>
                    {isToday && <span className="j-date-sub alm-caption">{dateLabel}</span>}
                  </div>
                  <span className="j-moon alm-caption">
                    <span className="j-moon-emoji" aria-hidden>{moonData.emoji}</span> {moonData.phase}
                  </span>
                </div>

                {/* Prompt — the epigraph */}
                <div className="j-prompt">
                  <span className="j-prompt-mark" aria-hidden>&#8258;</span>
                  <div>
                    <span className="alm-caption">{copy.promptLabel}</span>
                    <p className="j-prompt-text">{prompt}</p>
                  </div>
                </div>

                {/* The ruled sheet */}
                <div className="j-paper">
                  <textarea
                    value={text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={copy.placeholder}
                    aria-label={copy.ariaEditor}
                    className="j-ta"
                  />
                  <span className="j-save alm-caption">
                    {saved ? copy.saved : text.trim() ? copy.saving : ""}
                  </span>
                </div>

                {/* Actions */}
                <div className="j-actions">
                  {text.trim() && (
                    <button type="button" className="j-del" onClick={handleDelete}>
                      {copy.del}
                    </button>
                  )}
                  <button type="button" className="alm-link" onClick={handleExport}>
                    {copy.exp}
                  </button>
                </div>
              </div>
            ) : (
              /* ── CALENDAR TAB ── */
              <AlmanacCalendar
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setTab("write");
                }}
                locale={locale}
              />
            )}
          </Paywall>
        </div>
      </div>

      <style jsx>{`
        .j-head {
          margin-bottom: 2rem;
        }

        .j-lead {
          margin: 1rem 0 0;
          max-width: 44ch;
        }

        /* ── Ledger ─────────────────────────────────────────── */
        .j-stats {
          border-top: 3px solid var(--ink);
          margin-bottom: 2.2rem;
        }

        .j-stat {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 0.75rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .j-stat-label {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .j-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .j-stat-val {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
          white-space: nowrap;
        }

        .j-moon-emoji {
          filter: grayscale(1);
          opacity: 0.7;
        }

        /* ── Tabs ───────────────────────────────────────────── */
        .j-tabs {
          display: flex;
          gap: 1.6rem;
          margin-bottom: 1.4rem;
          border-bottom: 1px solid var(--hairline);
        }

        .j-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          padding: 0.4rem 0.1rem 0.55rem;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-faint);
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .j-tab:hover {
          color: var(--ink);
        }

        .j-tab.on {
          color: var(--ox);
          border-bottom-color: var(--ox);
        }

        /* ── The sheet ──────────────────────────────────────── */
        .j-sheet {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .j-sheet-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
        }

        .j-date {
          display: block;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.35rem;
          font-weight: 500;
          color: var(--ink);
        }

        .j-date-sub {
          display: block;
          margin-top: 0.2rem;
        }

        .j-moon {
          white-space: nowrap;
        }

        .j-prompt {
          display: flex;
          gap: 0.8rem;
          align-items: baseline;
          padding: 0.9rem 1.1rem;
          border-left: 2px solid var(--ox);
          background: rgba(250, 246, 236, 0.6);
        }

        .j-prompt-mark {
          color: var(--ox);
          font-size: 0.95rem;
        }

        .j-prompt-text {
          margin: 0.35rem 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.08rem;
          font-style: italic;
          line-height: 1.5;
          color: var(--ink);
        }

        .j-paper {
          position: relative;
        }

        .j-ta {
          width: 100%;
          min-height: 250px;
          padding: 0.35rem 0.95rem 1.4rem;
          background-color: #0f1240;
          background-image: repeating-linear-gradient(
            transparent 0 calc(1.8em - 1px),
            var(--hairline) calc(1.8em - 1px) 1.8em
          );
          background-attachment: local;
          border: 1px solid var(--hairline);
          border-radius: 0;
          color: var(--ink);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          line-height: 1.8em;
          outline: none;
          resize: vertical;
          transition: border-color 200ms var(--ease);
        }

        .j-ta::placeholder {
          color: var(--ink-faint);
          font-style: italic;
        }

        .j-ta:focus-visible {
          outline: 2px solid var(--ox);
          outline-offset: 2px;
        }

        .j-save {
          position: absolute;
          bottom: 0.7rem;
          right: 0.95rem;
          color: var(--ox);
        }

        .j-actions {
          display: flex;
          gap: 1.4rem;
          justify-content: flex-end;
          align-items: baseline;
        }

        .j-del {
          background: none;
          border: none;
          padding: 0 0 0.25rem;
          cursor: pointer;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint);
          border-bottom: 1px solid transparent;
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .j-del:hover,
        .j-del:focus-visible {
          color: var(--ox);
          border-bottom-color: rgba(224, 183, 104, 0.3);
        }

        /* ── Paywall gate, re-inked ─────────────────────────── */
        .alm-gate :global(.glass-card) {
          background: #0f1240 !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          color: var(--ink);
        }

        .alm-gate :global(.glass-card h3) {
          color: var(--ink) !important;
          font-family: var(--font-heading, "Cormorant Garamond"), serif !important;
          font-weight: 500;
        }

        .alm-gate :global([class*="text-muted-lavender"]) {
          color: var(--ink-soft) !important;
        }

        .alm-gate :global(.glass-card button) {
          background: var(--ink) !important;
          color: #f6f1e5 !important;
          border: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
          border-radius: 999px;
        }

        .alm-gate :global(.glass-card button:hover) {
          background: var(--ox) !important;
        }

        .alm-gate :global(.glass-card [class*="mb-"]) {
          display: none !important;
        }

        .alm-gate :global(.animate-pulse div) {
          background: rgba(232, 233, 255, 0.07) !important;
        }

        .alm-gate :global(.text-red-400) {
          color: var(--ox) !important;
        }

        @media (max-width: 640px) {
          .j-sheet-head {
            flex-direction: column;
            gap: 0.3rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .j-tab,
          .j-ta,
          .j-del {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
