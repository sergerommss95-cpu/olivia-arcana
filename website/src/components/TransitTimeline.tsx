"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transit, Significance } from "../lib/transit-calculator";

// ── Styling constants ──

const SIGNIFICANCE_COLORS: Record<Significance, string> = {
  high: "#D4AF37",
  medium: "#7B68EE",
  low: "#4ECDC4",
};

const SIGNIFICANCE_LABELS: Record<Significance, string> = {
  high: "Major",
  medium: "Moderate",
  low: "Minor",
};

const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "⚹",
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.6rem",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(180,170,210,0.45)",
};

// ── Helpers ──

function formatDate(date: Date): string {
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function formatDateRange(start: Date, end: Date): string {
  const s = formatDate(start);
  const e = formatDate(end);
  return s === e ? s : `${s} — ${e}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Components ──

interface Props {
  transits: Transit[];
}

export default function TransitTimeline({ transits }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Transit | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState<Record<Significance, boolean>>({
    high: true,
    medium: true,
    low: true,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filtered = transits.filter((tr) => filters[tr.significance]);

  // Compute timeline range
  const { now, earliest, totalDays, timelineWidth } = React.useMemo(() => {
    const nowVal = new Date();
    const e = filtered.length > 0
      ? new Date(Math.min(...filtered.map((tr) => tr.startDate.getTime()), nowVal.getTime()))
      : nowVal;
    const l = filtered.length > 0
      ? new Date(Math.max(...filtered.map((tr) => tr.endDate.getTime())))
      : new Date(nowVal.getTime() + 180 * 24 * 60 * 60 * 1000);

    const td = Math.max(daysBetween(e, l), 30);
    const pxPerDay = 6;
    const tw = td * pxPerDay;
    
    return { now: nowVal, earliest: e, totalDays: td, timelineWidth: tw };
  }, [filtered]);

  const pxPerDay = 6;

  // Scroll to "now" on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowOffset = daysBetween(earliest, now) * pxPerDay;
      scrollRef.current.scrollLeft = Math.max(0, nowOffset - 120);
    }
  }, [filtered.length, earliest, now]);

  function toggleFilter(sig: Significance) {
    setFilters((prev) => ({ ...prev, [sig]: !prev[sig] }));
  }

  function getLeft(date: Date): number {
    return daysBetween(earliest, date) * pxPerDay;
  }

  function getWidth(start: Date, end: Date): number {
    return Math.max(daysBetween(start, end) * pxPerDay, 8);
  }

  return (
    <div>
      {/* Filter toggles */}
      <div style={{
        display: "flex", gap: "0.5rem", marginBottom: "1rem",
        flexWrap: "wrap",
      }}>
        {(["high", "medium", "low"] as Significance[]).map((sig) => (
          <button
            key={sig}
            onClick={() => toggleFilter(sig)}
            style={{
              padding: "0.5rem 1rem",
              minHeight: "44px",
              borderRadius: "100px",
              background: filters[sig] ? `${SIGNIFICANCE_COLORS[sig]}18` : "rgba(255,255,255,0.02)",
              border: `1px solid ${filters[sig] ? `${SIGNIFICANCE_COLORS[sig]}40` : "rgba(200,185,255,0.08)"}`,
              color: filters[sig] ? SIGNIFICANCE_COLORS[sig] : "rgba(180,170,210,0.35)",
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: `all 0.3s ${EASE}`,
            }}
          >
            {SIGNIFICANCE_LABELS[sig]}
          </button>
        ))}
        <span style={{
          ...label,
          alignSelf: "center",
          marginLeft: "auto",
        }}>
          {filtered.length} transit{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile vertical list */}
      {isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          {filtered.length === 0 && (
            <p style={{ ...label, textAlign: "center", padding: "2rem 0" }}>No transits match your filter.</p>
          )}
          {filtered.sort((a, b) => a.exactDate.getTime() - b.exactDate.getTime()).map((tr) => {
            const color = SIGNIFICANCE_COLORS[tr.significance];
            const isSelected = selected === tr;
            const glyph = ASPECT_GLYPHS[tr.aspectType] || "";
            return (
              <button
                key={`m-${tr.transitPlanet}-${tr.natalPlanet}-${tr.exactDate.getTime()}`}
                onClick={() => setSelected(isSelected ? null : tr)}
                style={{
                  ...glass,
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: isSelected ? `${color}60` : undefined,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  minHeight: "56px",
                }}
              >
                <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>{glyph}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "rgba(240,236,255,0.9)", fontWeight: 500 }}>
                    {tr.transitPlanet} {tr.aspectType} {tr.natalPlanet}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "rgba(180,170,210,0.5)", marginTop: "0.15rem" }}>
                    {formatDateRange(tr.startDate, tr.endDate)} · exact {formatDate(tr.exactDate)}
                  </div>
                </div>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: color, opacity: 0.6, flexShrink: 0,
                }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline scroll container (desktop) */}
      <div
        ref={scrollRef}
        style={{
          ...glass,
          padding: "1.5rem 1rem 1rem",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x proximity",
          WebkitOverflowScrolling: "touch",
          position: "relative",
          display: isMobile ? "none" : "block",
        }}
      >
        {/* Month labels */}
        <div style={{ position: "relative", height: "20px", width: `${timelineWidth}px` }}>
          {Array.from({ length: Math.ceil(totalDays / 30) + 1 }).map((_, i) => {
            const d = new Date(earliest);
            d.setDate(d.getDate() + i * 30);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${i * 30 * pxPerDay}px`,
                  ...label,
                  fontSize: "0.55rem",
                  whiteSpace: "nowrap",
                }}
              >
                {d.toLocaleDateString("en", { month: "short", year: "2-digit" })}
              </div>
            );
          })}
        </div>

        {/* Timeline track */}
        <div style={{
          position: "relative",
          height: "80px",
          width: `${timelineWidth}px`,
          borderBottom: "1px solid rgba(200,185,255,0.06)",
        }}>
          {/* Center line */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "1px",
            background: "rgba(200,185,255,0.06)",
          }} />

          {/* Now indicator */}
          <div style={{
            position: "absolute",
            left: `${getLeft(now)}px`,
            top: 0,
            bottom: 0,
            width: "2px",
            background: "rgba(255,255,255,0.25)",
            zIndex: 5,
          }}>
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "50%",
              transform: "translateX(-50%)",
              ...label,
              fontSize: "0.5rem",
              color: "rgba(255,255,255,0.5)",
              whiteSpace: "nowrap",
            }}>
              now
            </div>
          </div>

          {/* Transit markers */}
          {filtered.map((tr, idx) => {
            const color = SIGNIFICANCE_COLORS[tr.significance];
            const left = getLeft(tr.startDate);
            const width = getWidth(tr.startDate, tr.endDate);
            const isSelected = selected === tr;
            // Stagger vertically to avoid overlap
            const row = idx % 3;
            const top = 20 + row * 20;

            return (
              <button
                key={`${tr.transitPlanet}-${tr.natalPlanet}-${tr.aspectType}-${tr.exactDate.getTime()}`}
                onClick={() => setSelected(isSelected ? null : tr)}
                title={`${tr.transitPlanet} ${tr.aspectType} ${tr.natalPlanet}`}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: "14px",
                  borderRadius: "7px",
                  background: `${color}${isSelected ? "50" : "25"}`,
                  border: `1px solid ${color}${isSelected ? "80" : "40"}`,
                  cursor: "pointer",
                  transition: `all 0.25s ${EASE}`,
                  scrollSnapAlign: "start",
                  zIndex: isSelected ? 10 : 1,
                  padding: 0,
                }}
              >
                {/* Exact date dot */}
                <div style={{
                  position: "absolute",
                  left: `${Math.max(0, getLeft(tr.exactDate) - left - 3)}px`,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: color,
                }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={`${selected.transitPlanet}-${selected.natalPlanet}-${selected.aspectType}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              ...glass,
              marginTop: "0.75rem",
              padding: "1.25rem",
              borderColor: `${SIGNIFICANCE_COLORS[selected.significance]}22`,
            }}>
              {/* Header row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}>
                <span style={{ fontSize: "1.5rem" }}>{selected.transitGlyph}</span>
                <span style={{
                  fontSize: "1.1rem",
                  color: "rgba(200,185,255,0.35)",
                }}>{ASPECT_GLYPHS[selected.aspectType] || "?"}</span>
                <span style={{ fontSize: "1.5rem" }}>{selected.natalGlyph}</span>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "100px",
                    background: `${SIGNIFICANCE_COLORS[selected.significance]}18`,
                    border: `1px solid ${SIGNIFICANCE_COLORS[selected.significance]}30`,
                    fontFamily: "var(--font-body)",
                    fontSize: "0.55rem",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: SIGNIFICANCE_COLORS[selected.significance],
                  }}>
                    {SIGNIFICANCE_LABELS[selected.significance]}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "var(--font-accent)",
                fontSize: "1rem",
                fontWeight: 500,
                color: "rgba(240,236,255,0.9)",
                marginBottom: "0.4rem",
              }}>
                {selected.transitPlanet} {selected.aspectType} natal {selected.natalPlanet}
              </div>

              {/* Description */}
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8rem",
                fontWeight: 300,
                lineHeight: 1.7,
                color: "rgba(196,185,228,0.65)",
                margin: "0 0 1rem",
              }}>
                {selected.description}
              </p>

              {/* Meta */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.75rem",
              }}>
                <div>
                  <div style={label}>Active</div>
                  <div style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "0.82rem",
                    color: "rgba(230,220,255,0.8)",
                    marginTop: "0.2rem",
                  }}>
                    {formatDateRange(selected.startDate, selected.endDate)}
                  </div>
                </div>
                <div>
                  <div style={label}>Exact</div>
                  <div style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "0.82rem",
                    color: "rgba(230,220,255,0.8)",
                    marginTop: "0.2rem",
                  }}>
                    {formatDate(selected.exactDate)}
                  </div>
                </div>
                <div>
                  <div style={label}>Orb</div>
                  <div style={{
                    fontFamily: "var(--font-accent)",
                    fontSize: "0.82rem",
                    color: "rgba(230,220,255,0.8)",
                    marginTop: "0.2rem",
                  }}>
                    {selected.minOrb}°
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginTop: "1rem",
                  padding: "0.4rem 1rem",
                  borderRadius: "100px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(200,185,255,0.1)",
                  color: "rgba(200,185,240,0.5)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  transition: `all 0.3s ${EASE}`,
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
