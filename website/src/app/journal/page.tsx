/**
 * Cosmic Journal — Daily reflection with moon phase context.
 *
 * Default view: today's entry with cosmic prompt.
 * Calendar tab shows month grid with moon phases and entry indicators.
 * Stats bar: streak + total entries.
 * Auto-saves with debounced localStorage writes.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getMoonPhase } from "../../lib/celestial";
import { getDailyPrompt } from "../../lib/journal-prompts";
import {
  saveEntry, loadEntry, getStreak, getEntryCount, exportJSON, todayString, deleteEntry,
} from "../../lib/journal-store";
import JournalCalendar from "../../components/JournalCalendar";
import { useLocale } from "../../lib/i18n/useLocale";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
};

type Tab = "write" | "calendar";

export default function JournalPage() {
  const { t } = useLocale();
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

  // Load entry when date changes
  useEffect(() => {
    const entry = loadEntry(selectedDate);
    setText(entry?.text || "");
    setSaved(false);
    refreshStats();
  }, [selectedDate]);

  const refreshStats = useCallback(() => {
    setStreak(getStreak());
    setTotalEntries(getEntryCount());
  }, []);

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
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  })();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      padding: "2rem 1.5rem 4rem", position: "relative", zIndex: 1,
    }}>
      <a href="/" style={{
        position: "absolute", top: "1.5rem", left: "1.5rem",
        ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)",
      }}>{"\u2190"} {t("common_home")}</a>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", marginTop: "1rem" }}>
        <div style={{ fontSize: "2rem", color: "rgba(212,175,55,0.5)", textShadow: "0 0 40px rgba(212,175,55,0.2)", marginBottom: "0.5rem" }}>
          {"\u2728"}
        </div>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 400,
        }}>
          <span className="text-gold-gradient">Cosmic Journal</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", maxWidth: "400px", margin: "0.5rem auto 0",
        }}>
          Write under the stars. Your thoughts, aligned with the moon.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: "1.5rem", justifyContent: "center", marginBottom: "1.5rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-accent)", fontSize: "1.4rem", color: "rgba(78,205,196,0.8)",
          }}>{streak}</div>
          <div style={labelSt}>Day Streak</div>
        </div>
        <div style={{ width: "1px", background: "rgba(200,185,255,0.08)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-accent)", fontSize: "1.4rem", color: "rgba(212,175,55,0.7)",
          }}>{totalEntries}</div>
          <div style={labelSt}>Total Entries</div>
        </div>
        <div style={{ width: "1px", background: "rgba(200,185,255,0.08)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.4rem" }}>{moonData.emoji}</div>
          <div style={labelSt}>{moonData.phase}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
      }}>
        {(["write", "calendar"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.5rem 1.2rem", borderRadius: "100px",
            background: tab === t ? "rgba(160,120,255,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${tab === t ? "rgba(200,180,255,0.2)" : "rgba(200,185,255,0.06)"}`,
            color: tab === t ? "rgba(240,235,255,0.9)" : "rgba(200,185,240,0.5)",
            fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 400,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: "pointer", transition: `all 0.3s ${EASE}`,
          }}>
            {t === "write" ? "Write" : "Calendar"}
          </button>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: "600px" }}>
        {tab === "write" ? (
          /* ── WRITE TAB ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Date + Moon context */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{
                  fontFamily: "var(--font-accent)", fontSize: "1rem", color: "rgba(240,236,255,0.85)",
                }}>
                  {isToday ? "Today" : dateLabel}
                </div>
                {isToday && (
                  <div style={{ ...labelSt, fontSize: "0.5rem", marginTop: "0.15rem" }}>{dateLabel}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "1.2rem" }}>{moonData.emoji}</span>
                <div style={{ ...labelSt, fontSize: "0.5rem" }}>{moonData.phase}</div>
              </div>
            </div>

            {/* Prompt */}
            <div style={{
              ...glass, padding: "1rem 1.25rem",
              borderLeft: "3px solid rgba(212,175,55,0.3)",
            }}>
              <div style={{ ...labelSt, marginBottom: "0.4rem", fontSize: "0.5rem", color: "rgba(212,175,55,0.5)" }}>
                Today&apos;s Cosmic Prompt
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
                lineHeight: 1.7, color: "rgba(196,185,228,0.75)", margin: 0, fontStyle: "italic",
              }}>{prompt}</p>
            </div>

            {/* Textarea */}
            <div style={{ position: "relative" }}>
              <textarea
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                placeholder="Begin writing..."
                style={{
                  width: "100%", minHeight: "250px", padding: "1.25rem",
                  fontFamily: "var(--font-body)", fontSize: "0.92rem", lineHeight: 1.8,
                  color: "rgba(240,236,255,0.85)", background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(200,185,255,0.08)", borderRadius: "1rem",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  outline: "none", resize: "vertical",
                  transition: "border-color 0.3s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(200,185,255,0.15)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(200,185,255,0.08)"; }}
              />
              {/* Save indicator */}
              <div style={{
                position: "absolute", bottom: "0.8rem", right: "1rem",
                fontFamily: "var(--font-body)", fontSize: "0.55rem",
                color: saved ? "rgba(78,205,196,0.5)" : "rgba(180,170,210,0.2)",
                transition: "color 0.3s",
              }}>
                {saved ? "Saved" : text.trim() ? "Saving..." : ""}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              {text.trim() && (
                <button onClick={handleDelete} style={{
                  padding: "0.5rem 1rem", borderRadius: "100px",
                  background: "none", border: "1px solid rgba(232,82,74,0.15)",
                  color: "rgba(232,82,74,0.5)", fontSize: "0.65rem",
                  cursor: "pointer", transition: `all 0.3s ${EASE}`,
                }}>Delete Entry</button>
              )}
              <button onClick={handleExport} style={{
                padding: "0.5rem 1rem", borderRadius: "100px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.08)",
                color: "rgba(200,185,240,0.5)", fontSize: "0.65rem",
                cursor: "pointer", transition: `all 0.3s ${EASE}`,
              }}>Export All</button>
            </div>
          </div>
        ) : (
          /* ── CALENDAR TAB ── */
          <div>
            <JournalCalendar
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setTab("write");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
