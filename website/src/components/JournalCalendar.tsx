/**
 * JournalCalendar.tsx — Month grid calendar with moon phases
 *
 * Shows moon phase emoji on each day.
 * Highlights days with journal entries.
 * Click day to view/edit that entry.
 * Navigate months with arrows. Current day highlighted.
 */

"use client";

import React, { useState, useMemo } from "react";
import { getMoonPhase } from "../lib/celestial";
import { getEntryDates } from "../lib/journal-store";

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
  letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(180,170,210,0.35)",
};

function formatDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function JournalCalendar({ selectedDate, onSelectDate }: Props) {
  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Parse selected date to get initial month view
  const [selY, selM] = selectedDate ? selectedDate.split("-").map(Number) : [today.getFullYear(), today.getMonth() + 1];
  const [viewYear, setViewYear] = useState(selY);
  const [viewMonth, setViewMonth] = useState(selM - 1); // 0-indexed

  const entryDates = useMemo(() => getEntryDates(), []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const days: Array<{ day: number; dateStr: string; moonEmoji: string; hasEntry: boolean; isToday: boolean; isSelected: boolean } | null> = [];

    // Leading blanks
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    // Actual days
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

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(200,185,255,0.06)",
      borderRadius: "1rem",
      padding: "1.25rem",
    }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button onClick={prevMonth} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(200,185,240,0.6)", fontSize: "1.1rem", padding: "0.3rem 0.6rem",
        }}>{"\u2190"}</button>
        <span style={{
          fontFamily: "var(--font-accent)", fontSize: "1rem", fontWeight: 400,
          color: "rgba(240,236,255,0.85)", letterSpacing: "0.04em",
        }}>{monthName}</span>
        <button onClick={nextMonth} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(200,185,240,0.6)", fontSize: "1.1rem", padding: "0.3rem 0.6rem",
        }}>{"\u2192"}</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "0.4rem" }}>
        {WEEKDAYS.map(wd => (
          <div key={wd} style={{ ...labelSt, textAlign: "center", padding: "0.3rem 0" }}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {calendarDays.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />;

          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "0.35rem 0.2rem",
                background: cell.isSelected
                  ? "rgba(160,120,255,0.15)"
                  : cell.isToday
                    ? "rgba(78,205,196,0.08)"
                    : "none",
                border: cell.isSelected
                  ? "1px solid rgba(160,120,255,0.3)"
                  : cell.isToday
                    ? "1px solid rgba(78,205,196,0.15)"
                    : "1px solid transparent",
                borderRadius: "0.5rem",
                cursor: "pointer",
                transition: "all 0.15s",
                minHeight: "3rem",
              }}
            >
              <span style={{
                fontSize: "0.65rem",
                color: cell.isToday ? "rgba(78,205,196,0.9)" : "rgba(240,236,255,0.6)",
                fontFamily: "var(--font-body)",
                fontWeight: cell.isToday ? 600 : 400,
              }}>{cell.day}</span>
              <span style={{ fontSize: "0.7rem", lineHeight: 1 }}>{cell.moonEmoji}</span>
              {cell.hasEntry && (
                <div style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "rgba(212,175,55,0.6)", marginTop: "2px",
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
