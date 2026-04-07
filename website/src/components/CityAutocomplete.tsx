/**
 * CityAutocomplete.tsx — City search with dropdown suggestions
 *
 * Types → shows matching cities with country.
 * Click suggestion to select. Stores city data for coordinates.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { searchCities, type CityData } from "../lib/cities";

interface Props {
  onSelect: (city: CityData | null) => void;
  placeholder?: string;
}

export default function CityAutocomplete({ onSelect, placeholder = "e.g. Kyiv, New York, Tokyo" }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityData[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CityData | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) {
      setResults([]);
      setOpen(false);
      return;
    }
    const r = searchCities(query);
    setResults(r);
    setOpen(r.length > 0 && query.length >= 2);
  }, [query, selected]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (city: CityData) => {
    setSelected(city);
    setQuery(`${city.name}, ${city.country}`);
    setOpen(false);
    onSelect(city);
  };

  const handleChange = (val: string) => {
    setQuery(val);
    if (selected) {
      setSelected(null);
      onSelect(null);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0 && !selected) setOpen(true); }}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.65rem 1rem",
          fontFamily: "var(--font-accent)",
          fontSize: "0.95rem",
          letterSpacing: "0.04em",
          color: "rgba(240,236,255,0.9)",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${selected ? "rgba(78,205,196,0.25)" : "rgba(200,185,255,0.12)"}`,
          borderRadius: "0.75rem",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          outline: "none",
          transition: "border-color 0.3s",
        }}
      />

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(10,8,21,0.95)",
          border: "1px solid rgba(200,185,255,0.12)",
          borderRadius: "0.75rem",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          maxHeight: "200px",
          overflowY: "auto",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          {results.map((city, i) => (
            <button
              key={`${city.name}-${city.country}-${i}`}
              onClick={() => handleSelect(city)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "0.6rem 0.9rem",
                background: "none",
                border: "none",
                borderBottom: i < results.length - 1 ? "1px solid rgba(200,185,255,0.04)" : "none",
                cursor: "pointer",
                transition: "background 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,185,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <span style={{
                fontFamily: "var(--font-accent)",
                fontSize: "0.88rem",
                color: "rgba(240,236,255,0.85)",
              }}>{city.name}</span>
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                color: "rgba(180,170,210,0.4)",
                letterSpacing: "0.04em",
              }}>{city.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
