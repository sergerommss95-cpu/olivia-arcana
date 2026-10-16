"use client";

/**
 * The birthplace: an ARIA 1.2 combobox over the site's bundled place list
 * (the same search as the birth-chart page). Typing opens a listbox with the
 * first match selected (it is the active descendant, so Enter's choice is
 * said); Up and Down move through it, Enter chooses, Esc closes. Focus never
 * leaves the input: options are chosen with the mouse without taking it. A
 * chosen place shows its country and coordinates under the field, so two
 * places with one name are told apart. No match says so, in words and aloud.
 */

import { useEffect, useMemo, useState, type Ref } from "react";
import { searchPlaces, type Place } from "@/lib/astrology/places";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import styles from "./portrait.module.css";

const SHOWN = 6;

/** A place's name in this language, as the field shows it once chosen. */
export function placeName(p: Place, locale: PortraitLocale) {
  return (locale === "uk" ? p.uk : p.en) || p.en;
}

export default function PlaceField({ id, locale, places, query, place, error, inputRef, onQuery, onChoose }: {
  /** The input's id; the listbox, hint and error ids derive from it. */
  id: string;
  locale: PortraitLocale;
  places: Place[];
  query: string;
  place: Place | null;
  /** Said under the field, and marked on the input, after a submit. */
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Typing: the place chosen before no longer holds. */
  onQuery: (query: string) => void;
  onChoose: (place: Place) => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const name = (p: Place) => placeName(p, locale);
  const country = (p: Place) => (locale === "uk" ? p.countryUk : p.countryEn);
  const [open, setOpen] = useState(false);
  /** The selected option: the first match until the arrows move it. */
  const [active, setActive] = useState(0);

  const matches = useMemo(() => (place && query === name(place) ? [] : searchPlaces(places, query, SHOWN)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- name() reads only the locale
    [places, query, place, locale]);
  const searched = query.trim().length >= 2 && places.length > 0 && !place;
  const expanded = open && matches.length > 0;
  const empty = open && searched && matches.length === 0;

  const listId = `${id}-list`;
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const optionId = (i: number) => `${id}-option-${i}`;

  const selected = Math.min(active, matches.length - 1);
  // The selected option stays in view as the arrows move it.
  useEffect(() => {
    if (expanded) document.getElementById(optionId(selected))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId derives from id
  }, [selected, expanded]);

  function choose(p: Place) {
    setOpen(false);
    onChoose(p);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const n = matches.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!n) return;
      event.preventDefault();
      const down = event.key === "ArrowDown";
      if (!expanded) { setOpen(true); setActive(down ? 0 : n - 1); return; }
      setActive((i) => (down ? (i + 1) % n : (i - 1 + n) % n));
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      choose(matches[selected]);
    } else if (event.key === "Escape" && (expanded || empty)) {
      event.preventDefault();
      setOpen(false);
    }
  }

  const coords = (p: Place) => `${Math.abs(p.lat).toFixed(2)}° ${p.lat >= 0 ? t.north : t.south}, ${Math.abs(p.lon).toFixed(2)}° ${p.lon >= 0 ? t.east : t.west}`;

  return (
    <div className={styles.field}>
      <label id={labelId} className={styles.label} htmlFor={id}>{t.place}</label>
      <div className={styles.combo}>
        <input
          ref={inputRef} id={id} className={styles.input} type="text" autoComplete="off" spellCheck={false}
          role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={listId}
          aria-activedescendant={expanded ? optionId(selected) : undefined}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          value={query}
          onChange={(e) => { onQuery(e.target.value); setOpen(true); setActive(0); }}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
        />
        <ul id={listId} role="listbox" aria-labelledby={labelId} className={styles.options} hidden={!expanded}>
          {expanded && matches.map((p, i) => (
            <li key={`${p.en}-${p.country}-${p.lat}`} id={optionId(i)} role="option" aria-selected={i === selected} className={styles.option}
              onMouseDown={(e) => { e.preventDefault(); choose(p); }} onMouseMove={() => { if (i !== active) setActive(i); }}>
              <span>{name(p)}</span><span className={styles.optionMeta}>{country(p)}</span>
            </li>
          ))}
        </ul>
        {empty && <p className={styles.empty}>{t.placeEmpty}</p>}
      </div>
      {error && <p id={errorId} className={styles.fieldError}>{error}</p>}
      <p id={hintId} className={styles.hint}>
        {place ? (
          <span className={styles.chosen}>
            <span className={styles.tick} aria-hidden="true" />
            <span>{name(place)}, {country(place)}</span>
            <span className={styles.coords}>{coords(place)}</span>
          </span>
        ) : t.placeHint}
      </p>
      {/* Mounted empty, so a search with no match is heard (each option is heard as it is selected). */}
      <p className={styles.sr} role="status">{empty ? t.placeEmpty : ""}</p>
    </div>
  );
}
