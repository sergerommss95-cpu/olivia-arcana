/**
 * Tarot Encyclopedia — Personal-Almanac print register.
 *
 * All 78 cards as a card-index: hairline filter row, almanac search
 * field, index-card grid, and a sticky reading panel. Search/filter/
 * selection logic intact; ink on bone paper, one oxblood accent.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";
import { useLocale } from "@/lib/i18n/useLocale";
import AlmanacShell from "@/components/almanac/AlmanacShell";

const SUIT_LABELS: Record<string, string> = {
  wands: "Wands · Fire", cups: "Cups · Water", swords: "Swords · Air", pentacles: "Pentacles · Earth",
};

// ── Local UI copy (EN/UK) for strings without translation keys ────────
const UI = {
  en: { kicker: "Reference" },
  uk: { kicker: "Довідник" },
};

type Filter = "all" | "major" | "wands" | "cups" | "swords" | "pentacles";

export default function TarotEncyclopediaPage() {
  const { t, locale } = useLocale();
  const ui = locale === "uk" ? UI.uk : UI.en;
  const [filter, setFilter] = useState<Filter>("all");
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

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "all", label: t("academy_filter_all") },
    { key: "major", label: t("academy_filter_major") },
    { key: "wands", label: t("academy_filter_wands") },
    { key: "cups", label: t("academy_filter_cups") },
    { key: "swords", label: t("academy_filter_swords") },
    { key: "pentacles", label: t("academy_filter_pentacles") },
  ];

  return (
    <AlmanacShell>
      <div className="enc">
        {/* ── Header ── */}
        <header className="enc-head">
          <Link href="/academy" className="enc-back">
            ← {t("academy_back")}
          </Link>
          <p className="alm-kicker">
            <span aria-hidden>✦</span>
            {ui.kicker}
          </p>
          <h1 className="alm-h1">{t("academy_tarot_encyclopedia")}</h1>
          <p className="alm-lead enc-lead">{t("academy_tarot_encyclopedia_desc")}</p>
        </header>

        {/* ── Filters ── */}
        <div className="enc-filters" role="group" aria-label={t("academy_filter_all")}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`enc-filter ${filter === f.key ? "on" : ""}`}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="enc-search">
          <input
            type="text"
            className="alm-input"
            placeholder={t("academy_search_placeholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="enc-layout">
          {/* ── Card index grid ── */}
          <div className="enc-grid">
            {filtered.map(card => {
              const isSelected = selected?.name === card.name;
              return (
                <button
                  key={card.name}
                  onClick={() => setSelected(isSelected ? null : card)}
                  className={`enc-card ${isSelected ? "on" : ""}`}
                  aria-pressed={isSelected}
                >
                  <span className="enc-card-name">{card.name}</span>
                  <span className="enc-card-keys">
                    {card.keywords.slice(0, 2).join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Reading panel ── */}
          <aside className="enc-aside">
            {selected ? (
              <div className="enc-detail alm-card">
                <p className="alm-caption enc-detail-tag">
                  {selected.arcana === "major"
                    ? `${t("academy_major_arcana")} · ${selected.number}`
                    : SUIT_LABELS[selected.suit || "wands"]}
                </p>
                <h2 className="alm-h2 enc-detail-name">{selected.name}</h2>

                {/* Keywords */}
                <div className="enc-detail-keys">
                  {selected.keywords.map(k => (
                    <span key={k} className="enc-key">{k}</span>
                  ))}
                </div>

                {/* Upright */}
                <div className="enc-section">
                  <p className="alm-caption enc-label">{t("academy_upright")}</p>
                  <p className="enc-body">{selected.upright}</p>
                </div>

                {/* Reversed */}
                <div className="enc-section">
                  <p className="alm-caption enc-label enc-label-ox">{t("academy_reversed")}</p>
                  <p className="enc-body">{selected.reversed}</p>
                </div>

                {/* Advice */}
                <div className="enc-advice">
                  <p className="alm-caption enc-label enc-label-ox">{t("academy_advice")}</p>
                  <p className="enc-advice-text">{selected.advice}</p>
                </div>

                {/* Correspondences */}
                <div className="enc-corr">
                  {[
                    { l: t("academy_astrology_label"), v: selected.astrology },
                    { l: t("academy_element_label"), v: selected.element },
                    { l: t("academy_yesno_label"), v: selected.yesNo },
                  ].map(({ l, v }) => (
                    <div key={l} className="enc-corr-cell">
                      <span className="alm-caption enc-corr-label">{l}</span>
                      <span className="enc-corr-value">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="enc-empty alm-card">
                <span className="enc-empty-star" aria-hidden>✦</span>
                <p className="enc-empty-hint">{t("academy_select_card_hint")}</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <style jsx>{`
        .enc {
          width: min(100%, 68rem);
          margin: 0 auto;
        }

        .enc-head {
          margin-bottom: clamp(1.8rem, 4vw, 2.8rem);
        }

        .enc :global(.enc-back) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-bottom: 0.9rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .enc :global(.enc-back:hover) {
          color: var(--ox);
        }

        .enc-lead {
          margin: 1.1rem 0 0;
          max-width: 58ch;
        }

        /* ── Filters ─────────────────────────────────────────── */
        .enc-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0 1.4rem;
          border-top: 3px solid var(--ink);
          border-bottom: 1px solid var(--hairline);
          margin-bottom: 1.2rem;
        }

        .enc-filter {
          padding: 0.75rem 0.1rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          color: var(--ink-soft);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .enc-filter:hover {
          color: var(--ox);
        }

        .enc-filter.on {
          color: var(--ox);
          border-bottom-color: var(--ox);
        }

        /* ── Search ──────────────────────────────────────────── */
        .enc-search {
          max-width: 22rem;
          margin-bottom: clamp(1.4rem, 3vw, 2rem);
        }

        /* ── Layout ──────────────────────────────────────────── */
        .enc-layout {
          display: flex;
          gap: clamp(1.2rem, 3vw, 2rem);
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .enc-grid {
          flex: 1 1 30rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .enc-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.85rem 0.6rem;
          border: 1px solid var(--hairline);
          background: rgba(250, 246, 236, 0.6);
          text-align: center;
          cursor: pointer;
          transition: border-color 200ms var(--ease), background 200ms var(--ease);
        }

        .enc-card:hover {
          border-color: rgba(224, 183, 104, 0.45);
        }

        .enc-card.on {
          border-color: var(--ox);
          background: rgba(224, 183, 104, 0.05);
        }

        .enc-card-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1.25;
          color: var(--ink);
        }

        .enc-card.on .enc-card-name {
          color: var(--ox);
        }

        .enc-card-keys {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.06em;
          color: var(--ink-faint);
        }

        /* ── Reading panel ───────────────────────────────────── */
        .enc-aside {
          flex: 0 0 20rem;
          position: sticky;
          top: 1.5rem;
        }

        .enc-detail-tag {
          margin: 0 0 0.4rem;
          color: var(--ox);
        }

        .enc-detail-name {
          margin: 0 0 0.7rem;
        }

        .enc-detail-keys {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          margin-bottom: 1.1rem;
        }

        .enc-key {
          padding: 0.18rem 0.5rem;
          border: 1px solid var(--hairline);
          background: rgba(232, 233, 255, 0.03);
          font-size: 0.66rem;
          color: var(--ink-soft);
        }

        .enc-section {
          margin-bottom: 1rem;
        }

        .enc-label {
          margin: 0 0 0.35rem;
          color: var(--ink-soft);
        }

        .enc-label-ox {
          color: var(--ox);
        }

        .enc-body {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.84rem;
          line-height: 1.65;
        }

        .enc-advice {
          padding: 0.85rem;
          border: 1px solid rgba(224, 183, 104, 0.3);
          background: rgba(224, 183, 104, 0.04);
          margin-bottom: 1.1rem;
        }

        .enc-advice-text {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 0.95rem;
          line-height: 1.55;
          color: var(--ink);
        }

        .enc-corr {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.4rem;
          border-top: 1px solid var(--hairline);
          padding-top: 0.9rem;
        }

        .enc-corr-cell {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          text-align: center;
        }

        .enc-corr-label {
          font-size: 0.5rem;
        }

        .enc-corr-value {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--ink);
          text-transform: capitalize;
        }

        /* ── Empty state ─────────────────────────────────────── */
        .enc-empty {
          text-align: center;
        }

        .enc-empty-star {
          display: block;
          font-size: 1.3rem;
          color: var(--ink-faint);
          margin-bottom: 0.7rem;
        }

        .enc-empty-hint {
          margin: 0;
          color: var(--ink-faint);
          font-size: 0.84rem;
          line-height: 1.6;
        }

        @media (max-width: 820px) {
          .enc-aside {
            flex: 1 1 100%;
            position: static;
            order: -1;
          }

          .enc-empty {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .enc :global(.enc-back),
          .enc-filter,
          .enc-card {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
