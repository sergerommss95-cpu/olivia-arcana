/**
 * Tarot Encyclopedia — Browse all 78 cards with meanings
 *
 * Filter by: Major/Minor, Suit, Search
 * Click any card → full meaning panel
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";
import { useLocale } from "@/lib/i18n/useLocale";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const SUIT_COLORS: Record<string, string> = {
  wands: "#FF6B35", cups: "#4FC3F7", swords: "#B0BEC5", pentacles: "#7CB342",
};
const SUIT_LABELS: Record<string, string> = {
  wands: "Wands · Fire", cups: "Cups · Water", swords: "Swords · Air", pentacles: "Pentacles · Earth",
};

const glass: React.CSSProperties = {
  background: "rgba(8,6,20,0.45)",
  backdropFilter: "blur(8px) ",
  WebkitBackdropFilter: "blur(8px) ",
  border: "1px solid rgba(200,185,255,0.06)",
  borderRadius: "1rem",
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

export default function TarotEncyclopediaPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<"all" | "major" | "wands" | "cups" | "swords" | "pentacles">("all");
  const [selected, setSelected] = useState<TarotCard | null>(null);
  const [search, setSearch] = useState("");

  const filtered = ALL_CARDS.filter(c => {
    if (filter === "all") return true;
    if (filter === "major") return c.arcana === "major";
    return c.suit === filter;
  }).filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Link href="/academy" style={{ ...label, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>&larr; {t("academy_back")}</Link>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">{t("academy_tarot_encyclopedia")}</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", marginTop: "0.3rem",
        }}>{t("academy_tarot_encyclopedia_desc")}</p>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "0.35rem", marginBottom: "1rem",
        flexWrap: "wrap",
      }}>
        {[
          { key: "all", label: t("academy_filter_all") },
          { key: "major", label: t("academy_filter_major") },
          { key: "wands", label: `\uD83D\uDD25 ${t("academy_filter_wands")}` },
          { key: "cups", label: `\uD83D\uDCA7 ${t("academy_filter_cups")}` },
          { key: "swords", label: `\uD83D\uDCA8 ${t("academy_filter_swords")}` },
          { key: "pentacles", label: `\uD83C\uDF3F ${t("academy_filter_pentacles")}` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as "all" | "major" | "wands" | "cups" | "swords" | "pentacles")}
            style={{
              padding: "0.4rem 0.9rem", borderRadius: "100px",
              background: filter === f.key ? "rgba(200,185,255,0.1)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${filter === f.key ? "rgba(200,185,255,0.15)" : "rgba(200,185,255,0.04)"}`,
              fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: filter === f.key ? 600 : 400,
              color: filter === f.key ? "rgba(240,236,255,0.85)" : "rgba(180,170,210,0.4)",
              cursor: "pointer", transition: `all 0.2s ${EASE}`,
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder={t("academy_search_placeholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "300px", padding: "0.55rem 1rem",
            fontFamily: "var(--font-body)", fontSize: "0.8rem",
            color: "rgba(240,236,255,0.9)", background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(200,185,255,0.08)", borderRadius: "100px",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Card grid */}
        <div style={{
          flex: "1 1 500px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.5rem",
        }}>
          {filtered.map(card => {
            const isMajor = card.arcana === "major";
            const suitColor = card.suit ? SUIT_COLORS[card.suit] : "#D4AF37";
            const isSelected = selected?.name === card.name;
            return (
              <button
                key={card.name}
                onClick={() => setSelected(isSelected ? null : card)}
                style={{
                  ...glass,
                  padding: "0.85rem 0.6rem",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "0.3rem", cursor: "pointer",
                  border: isSelected
                    ? `2px solid ${suitColor}40`
                    : `1px solid rgba(200,185,255,0.04)`,
                  background: isSelected ? `${suitColor}08` : glass.background,
                  transition: `all 0.2s ${EASE}`,
                  textAlign: "center",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-accent)", fontSize: "0.82rem", fontWeight: 500,
                  color: isMajor ? "rgba(212,175,55,0.8)" : `${suitColor}aa`,
                  lineHeight: 1.3,
                }}>{card.name}</span>
                <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {card.keywords.slice(0, 2).map(k => (
                    <span key={k} style={{
                      fontFamily: "var(--font-body)", fontSize: "0.5rem",
                      color: "rgba(180,170,210,0.35)",
                    }}>{k}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div style={{ flex: "0 0 320px", position: "sticky", top: "80px", alignSelf: "flex-start" }}>
          {selected ? (
            <div style={{ ...glass, padding: "1.5rem" }}>
              <div style={{
                ...label, marginBottom: "0.3rem",
                color: selected.arcana === "major" ? "rgba(212,175,55,0.5)" : `${SUIT_COLORS[selected.suit || "wands"]}88`,
              }}>
                {selected.arcana === "major" ? `${t("academy_major_arcana")} · ${selected.number}` : SUIT_LABELS[selected.suit || "wands"]}
              </div>
              <h2 style={{
                fontFamily: "var(--font-accent)", fontSize: "1.4rem", fontWeight: 400,
                color: "rgba(240,236,255,0.92)", margin: "0 0 0.5rem",
              }}>{selected.name}</h2>

              {/* Keywords */}
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {selected.keywords.map(k => (
                  <span key={k} style={{
                    padding: "0.15rem 0.45rem", borderRadius: "100px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.06)",
                    fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(200,190,235,0.55)",
                  }}>{k}</span>
                ))}
              </div>

              {/* Upright */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ ...label, marginBottom: "0.3rem", color: "rgba(78,205,196,0.5)" }}>{t("academy_upright")}</div>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                  lineHeight: 1.7, color: "rgba(200,190,235,0.72)", margin: 0,
                }}>{selected.upright}</p>
              </div>

              {/* Reversed */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ ...label, marginBottom: "0.3rem", color: "rgba(232,82,74,0.5)" }}>{t("academy_reversed")}</div>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                  lineHeight: 1.7, color: "rgba(200,190,235,0.6)", margin: 0,
                }}>{selected.reversed}</p>
              </div>

              {/* Advice */}
              <div style={{
                padding: "0.75rem", borderRadius: "0.6rem",
                background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.06)",
                marginBottom: "1rem",
              }}>
                <div style={{ ...label, marginBottom: "0.2rem", color: "rgba(212,175,55,0.45)", fontSize: "0.5rem" }}>{t("academy_advice")}</div>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 400,
                  color: "rgba(220,210,240,0.75)", margin: 0, fontStyle: "italic",
                }}>{selected.advice}</p>
              </div>

              {/* Correspondences */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                {[
                  { l: t("academy_astrology_label"), v: selected.astrology },
                  { l: t("academy_element_label"), v: selected.element },
                  { l: t("academy_yesno_label"), v: selected.yesNo },
                ].map(({ l, v }) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ ...label, fontSize: "0.45rem" }}>{l}</div>
                    <div style={{
                      fontFamily: "var(--font-body)", fontSize: "0.7rem",
                      color: "rgba(220,210,240,0.7)",
                    }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              ...glass, padding: "2rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.15)", marginBottom: "0.75rem" }}>✦</div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                color: "rgba(180,170,210,0.35)",
              }}>{t("academy_select_card_hint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
