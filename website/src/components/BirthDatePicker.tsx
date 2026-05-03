/**
 * BirthDatePicker.tsx — Custom date picker with separate year/month/day dropdowns
 *
 * Stores partial selections — each dropdown works independently.
 * Only emits a full YYYY-MM-DD when all three are filled.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";

interface Props {
  value: string;  // YYYY-MM-DD or ""
  onChange: (value: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const selectStyle: React.CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  padding: "0.65rem 0.9rem",
  fontFamily: "var(--font-accent)",
  fontSize: "0.95rem",
  letterSpacing: "0.04em",
  color: "rgba(240,236,255,0.9)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(200,185,255,0.12)",
  borderRadius: "0.75rem",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  outline: "none",
  cursor: "pointer",
  transition: "border-color 0.3s",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(180,170,210,0.4)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.75rem center",
  paddingRight: "2rem",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.55rem",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(180,170,210,0.35)",
  marginBottom: "0.25rem",
};

export default function BirthDatePicker({ value, onChange }: Props) {
  // Parse initial value if provided
  const initialParts = value ? value.split("-") : ["", "", ""];

  const [year, setYear] = useState(initialParts[0] || "");
  const [month, setMonth] = useState(initialParts[1] ? String(parseInt(initialParts[1])) : "");
  const [day, setDay] = useState(initialParts[2] ? String(parseInt(initialParts[2])) : "");

  // Stable ref for onChange to avoid infinite loops
  const onChangeRef = useRef(onChange);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Emit full date when all three are selected
  useEffect(() => {
    if (year && month && day) {
      onChangeRef.current(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    }
  }, [year, month, day]);

  // Adjust max days for selected month/year
  const maxDay = month && year
    ? new Date(parseInt(year), parseInt(month), 0).getDate()
    : 31;

  // Reset day if it exceeds max for new month
  useEffect(() => {
    if (day && parseInt(day) > maxDay) {
      requestAnimationFrame(() => setDay(String(maxDay)));
    }
  }, [maxDay, day]);

  return (
    <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
      {/* Month */}
      <div style={{ flex: 1.4, display: "flex", flexDirection: "column" }}>
        <span style={labelStyle}>Month</span>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{
            ...selectStyle,
            borderColor: month ? "rgba(200,185,255,0.2)" : "rgba(200,185,255,0.12)",
          }}
        >
          <option value="" style={{ background: "#0a0815", color: "rgba(180,170,210,0.5)" }}>Month</option>
          {MONTHS.map((name, i) => (
            <option key={i} value={String(i + 1)} style={{ background: "#0a0815" }}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Day */}
      <div style={{ flex: 0.7, display: "flex", flexDirection: "column" }}>
        <span style={labelStyle}>Day</span>
        <select
          value={day}
          onChange={e => setDay(e.target.value)}
          style={{
            ...selectStyle,
            borderColor: day ? "rgba(200,185,255,0.2)" : "rgba(200,185,255,0.12)",
          }}
        >
          <option value="" style={{ background: "#0a0815", color: "rgba(180,170,210,0.5)" }}>Day</option>
          {DAYS.filter(d => d <= maxDay).map(d => (
            <option key={d} value={String(d)} style={{ background: "#0a0815" }}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={labelStyle}>Year</span>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{
            ...selectStyle,
            borderColor: year ? "rgba(200,185,255,0.2)" : "rgba(200,185,255,0.12)",
          }}
        >
          <option value="" style={{ background: "#0a0815", color: "rgba(180,170,210,0.5)" }}>Year</option>
          {YEARS.map(y => (
            <option key={y} value={String(y)} style={{ background: "#0a0815" }}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
