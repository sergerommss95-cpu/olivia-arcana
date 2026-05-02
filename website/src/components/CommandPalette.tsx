/**
 * CommandPalette.tsx — Global cosmic search (Cmd+K / Ctrl+K)
 *
 * Indexes pages, zodiac signs, tarot cards, planets, houses, courses, lessons.
 * Keyboard-first: \u2191\u2193 move selection, Enter navigates, Esc closes.
 *
 * Veil aesthetic (distilled from Veil V2):
 *   - Glass card on a soft cosmic gradient backdrop (no WebGL \u2014 CSS only)
 *   - Golden holographic row highlight with foil sweep on the active item
 *   - Soft border pulse around the container
 *   - Chime on open (reuses SoundEngine's cosmos:chime event)
 *   - Reduced-motion: no sweeps/pulses, instant open
 *
 * Opened/closed via a global "search:open" CustomEvent so any button
 * anywhere on the site can trigger it (navbar, footer, shortcut, etc.).
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_LABEL_KEY,
  CATEGORY_ORDER,
  buildSearchIndex,
  defaultSuggestions,
  searchIndex,
  type SearchCategory,
  type SearchItem,
  type SearchResult,
} from "@/lib/search";
import type { Translations } from "@/lib/i18n/translations";
import { useLocale } from "@/lib/i18n/useLocale";

// Public events
export const SEARCH_OPEN_EVENT = "search:open";
export const SEARCH_CLOSE_EVENT = "search:close";

interface Group {
  category: SearchCategory;
  items: SearchItem[];
}

function groupResults(items: SearchItem[]): Group[] {
  const byCat = new Map<SearchCategory, SearchItem[]>();
  for (const item of items) {
    const bucket = byCat.get(item.category) ?? [];
    bucket.push(item);
    byCat.set(item.category, bucket);
  }
  return CATEGORY_ORDER
    .filter((c) => byCat.has(c))
    .map((category) => ({ category, items: byCat.get(category)! }));
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export default function CommandPalette() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build the index once per locale.
  const index = useMemo(() => buildSearchIndex(t as (key: keyof Translations) => string, locale), [t, locale]);

  // Resolve suggestions / results.
  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex(index, query, 50);
  }, [index, query]);

  const suggestions = useMemo(() => defaultSuggestions(index), [index]);

  // Flat navigable list (grouped visually, flat for keyboard).
  const flat: SearchItem[] = useMemo(
    () => (results.length ? results.map((r) => r.item) : suggestions),
    [results, suggestions],
  );

  const grouped: Group[] = useMemo(
    () => groupResults(flat),
    [flat],
  );

  const groupLabel = useCallback(
    (c: SearchCategory) => t(CATEGORY_LABEL_KEY[c] as keyof Translations),
    [t],
  );

  // reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  // Global open/close event + Cmd/Ctrl+K shortcut
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener(SEARCH_OPEN_EVENT, onOpen);
    window.addEventListener(SEARCH_CLOSE_EVENT, onClose);

    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      // "/" opens unless the user is typing in an input
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpen);
      window.removeEventListener(SEARCH_CLOSE_EVENT, onClose);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Focus + body lock + chime on open
  useEffect(() => {
    if (!open) return;
    // Autofocus after mount
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    // Body scroll lock
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Chime (SoundEngine listens for cosmos:chime)
    try {
      window.dispatchEvent(new CustomEvent("cosmos:chime"));
    } catch {
      // no-op
    }
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset selection whenever the list changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync active index to query changes
    setActive(0);
  }, [query, open]);

  const close = useCallback(() => setOpen(false), []);

  const navigateTo = useCallback(
    (item: SearchItem) => {
      close();
      // Brief delay so the close animation can start before the page transition fires
      requestAnimationFrame(() => {
        // Use the site's TransitionLink event so we keep the cosmic page transition
        try {
          window.dispatchEvent(
            new CustomEvent("page:transition", { detail: { href: item.href } }),
          );
        } catch {
          window.location.href = item.href;
        }
      });
    },
    [close],
  );

  // Scroll the active row into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(flat.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) navigateTo(item);
    }
  };

  if (!open) return null;

  const placeholder = t("search_placeholder");
  const emptyLabel = t("search_empty");
  const hintKbd = t("search_hint");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cosmic search"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "min(14vh, 120px)",
        paddingInline: "16px",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(80,40,140,0.35), rgba(8,6,20,0.88) 60%, rgba(4,2,13,0.95))",
        backdropFilter: "blur(18px) saturate(1.15)",
        WebkitBackdropFilter: "blur(18px) saturate(1.15)",
        animation: reduced ? undefined : "cp-fade-in 180ms ease-out both",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "min(72vh, 640px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "20px",
          border: "1px solid rgba(212,175,55,0.22)",
          background:
            "linear-gradient(180deg, rgba(18,12,40,0.92) 0%, rgba(10,7,26,0.94) 100%)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(160,120,255,0.18), 0 0 120px rgba(212,175,55,0.10)",
          animation: reduced ? undefined : "cp-scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Soft pulsing gold border */}
        {!reduced && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: -1,
              borderRadius: "20px",
              pointerEvents: "none",
              boxShadow: "inset 0 0 40px rgba(212,175,55,0.08)",
              animation: "cp-border-pulse 4s ease-in-out infinite",
            }}
          />
        )}

        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 18px",
            borderBottom: "1px solid rgba(200,185,255,0.08)",
            position: "relative",
          }}
        >
          <span
            aria-hidden
            style={{
              color: "#d4af37",
              fontSize: "18px",
              textShadow: "0 0 12px rgba(212,175,55,0.6)",
              lineHeight: 1,
            }}
          >
            {"\u2726"}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(240,235,255,0.98)",
              fontSize: "17px",
              fontFamily: "var(--font-body, inherit)",
              letterSpacing: "0.01em",
            }}
          />
          <kbd
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(200,185,255,0.18)",
              background: "rgba(8,6,20,0.55)",
              color: "rgba(200,185,255,0.6)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-body, inherit)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "8px 8px 12px",
          }}
        >
          {flat.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "rgba(200,185,255,0.55)",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              {emptyLabel}
            </div>
          ) : (
            grouped.map((g) => {
              const startIdx = flat.indexOf(g.items[0]);
              return (
                <div key={g.category} style={{ marginBottom: "6px" }}>
                  <div
                    style={{
                      padding: "10px 14px 6px",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(180,170,210,0.5)",
                    }}
                  >
                    {groupLabel(g.category)}
                  </div>
                  {g.items.map((item, i) => {
                    const idx = startIdx + i;
                    const isActive = idx === active;
                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        type="button"
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => navigateTo(item)}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          borderRadius: "10px",
                          background: isActive
                            ? "linear-gradient(90deg, rgba(212,175,55,0.14), rgba(160,120,255,0.10) 50%, rgba(212,175,55,0.06))"
                            : "transparent",
                          color: "inherit",
                          cursor: "pointer",
                          textAlign: "left",
                          overflow: "hidden",
                          transition: "background 200ms ease",
                        }}
                      >
                        {/* Active-row foil sweep */}
                        {isActive && !reduced && (
                          <span
                            aria-hidden
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "10px",
                              background:
                                "linear-gradient(105deg, transparent 30%, rgba(245,230,163,0.18) 50%, transparent 70%)",
                              backgroundSize: "250% 100%",
                              animation: "cp-foil 2.2s linear infinite",
                              pointerEvents: "none",
                              mixBlendMode: "overlay",
                            }}
                          />
                        )}
                        <span
                          aria-hidden
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            background: isActive
                              ? "rgba(212,175,55,0.18)"
                              : "rgba(200,185,255,0.06)",
                            color: isActive ? "#f5e6a3" : "rgba(200,185,255,0.7)",
                            fontSize: "15px",
                            textShadow: isActive ? "0 0 8px rgba(212,175,55,0.5)" : undefined,
                            flexShrink: 0,
                            transition: "background 200ms ease, color 200ms ease",
                          }}
                        >
                          {item.icon ?? "\u25CB"}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, position: "relative" }}>
                          <span
                            style={{
                              display: "block",
                              color: isActive ? "#f5e6a3" : "rgba(240,235,255,0.95)",
                              fontSize: "14px",
                              fontWeight: 500,
                              lineHeight: 1.3,
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              style={{
                                display: "block",
                                color: "rgba(180,170,210,0.55)",
                                fontSize: "12px",
                                lineHeight: 1.4,
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                marginTop: "2px",
                              }}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                        {item.meta && (
                          <span
                            style={{
                              color: "rgba(180,170,210,0.45)",
                              fontSize: "11px",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                              position: "relative",
                            }}
                          >
                            {item.meta}
                          </span>
                        )}
                        {isActive && (
                          <span
                            aria-hidden
                            style={{
                              color: "#d4af37",
                              fontSize: "14px",
                              position: "relative",
                            }}
                          >
                            {"\u21B5"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(200,185,255,0.08)",
            color: "rgba(180,170,210,0.45)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textAlign: "center",
            background: "rgba(8,6,20,0.35)",
          }}
        >
          {hintKbd}
        </div>
      </div>

      <style jsx>{`
        @keyframes cp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cp-scale-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cp-border-pulse {
          0%, 100% { box-shadow: inset 0 0 30px rgba(212,175,55,0.06), 0 0 0 rgba(212,175,55,0); }
          50% { box-shadow: inset 0 0 50px rgba(212,175,55,0.14), 0 0 40px rgba(212,175,55,0.08); }
        }
        @keyframes cp-foil {
          0% { background-position: 250% 0; }
          100% { background-position: -50% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Tiny helper to open the palette from any component:
 *   openCommandPalette();
 */
export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT));
  }
}

export function closeCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SEARCH_CLOSE_EVENT));
  }
}
