"use client";

/**
 * The reading's end matter: its numbers, then its maps. The numbers of the
 * name and date are set like type, four numerals in a row in a deep band, a
 * master number hallmarked, the birthday small beneath. The maps face each
 * other like end papers: the eleven Arkan cards in their lattice (the
 * mini-map's own, full size and still, each card a way to its page in the
 * deck), and the sky as cards (Sun, Moon, Rising, as the site's birth chart
 * deals them) with the other planets listed beneath.
 */

import { useMemo, useRef, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { BODY_GLYPHS, SIGN_CARDS, SIGN_GLYPHS, SIGNS } from "@/lib/astrology/constants.js";
import { PLANETS } from "@/lib/portrait/packet.js";
import { ANGLE_SEALS, NUMBER_TITLES, PLANET_NAMES } from "@/lib/portrait/seals.js";
import { eitherSigns, houseName } from "@/lib/portrait/why.js";
import type { PacketFactor, PortraitPacket } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { registerSection, useSeen } from "./sections";
import { LatticeMap } from "./MiniMap";
import styles from "./maps.module.css";

type Text = { en: string; uk: string };
const numberTitles = NUMBER_TITLES as Record<string, Text>;
const planetNames = PLANET_NAMES as Record<string, Text>;
const angleSeals = ANGLE_SEALS as Record<string, Text>;
/** Text presentation, so a glyph is never drawn as an emoji. */
const TEXT = "\ufe0e";
const glyphOf = (g: string) => (g.length === 1 ? `${g}${TEXT}` : g);
const signGlyph = (sign: string) => glyphOf(SIGN_GLYPHS[SIGNS.indexOf(sign)] ?? "");
const NUMBERS = ["lifePath", "expression", "soulUrge", "personality"] as const;
export const MAPS_ID = "portrait-maps";

export default function Maps({ packet, cards, locale, className }: {
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  className?: string;
}) {
  const m = PORTRAIT_COPY[locale].maps;
  const byId = useMemo(() => new Map(packet.factors.map((f) => [f.id, f])), [packet]);
  const numbers = useRef<HTMLElement>(null);
  const seen = useSeen(numbers);

  // Gone to from the contents as one place: the numbers first, the maps after.
  return (
    <div id={MAPS_ID} tabIndex={-1} className={`${styles.end} ${className ?? ""}`}>
      <section ref={numbers} {...registerSection("numbers", m.numbers.title, [])} className={`${styles.numbers} ${seen ? styles.seen : ""}`} aria-labelledby={`${MAPS_ID}-numbers`}>
        <p className={styles.kicker}>{m.numbers.kicker}</p>
        <h2 id={`${MAPS_ID}-numbers`} className={styles.hSection}>{m.numbers.title}</h2>
        <Numerals byId={byId} locale={locale} />
      </section>

      <section {...registerSection("maps", m.title, [])} className={styles.maps} aria-labelledby={`${MAPS_ID}-title`}>
        <header className={styles.head}>
          <h2 id={`${MAPS_ID}-title`} className={styles.hSection}>{m.title}</h2>
          <p className={styles.hint}>{m.lede}</p>
        </header>
        <div className={styles.spread}>
          <section className={styles.map} aria-labelledby={`${MAPS_ID}-cards`}>
            <p className={styles.kicker}>{m.cards.kicker}</p>
            <h3 id={`${MAPS_ID}-cards`} className={styles.mapTitle}>{m.cards.title}</h3>
            <LatticeMap packet={packet} cards={cards} locale={locale} links sizes="(min-width: 720px) 96px, 64px" className={styles.lattice} />
            <p className={styles.note}>{PORTRAIT_COPY[locale].laying.threads} {m.cards.links}</p>
          </section>
          <section className={styles.map} aria-labelledby={`${MAPS_ID}-sky`}>
            <p className={styles.kicker}>{m.sky.kicker}</p>
            <h3 id={`${MAPS_ID}-sky`} className={styles.mapTitle}>{m.sky.title}</h3>
            <SkyCards byId={byId} cards={cards} locale={locale} />
            <OtherPlanets byId={byId} locale={locale} />
          </section>
        </div>
      </section>
    </div>
  );
}

/** Four numerals in a row, each over its role and what the role means; a master number hallmarked; the birthday small beneath. */
function Numerals({ byId, locale }: { byId: Map<string, PacketFactor>; locale: PortraitLocale }) {
  const n = PORTRAIT_COPY[locale].maps.numbers;
  const shown = NUMBERS.flatMap((role) => {
    const f = byId.get(`num-${role}`);
    return f?.value !== undefined ? [{ role, value: f.value, master: Boolean(f.master) }] : [];
  });
  const birthday = byId.get("num-birthday");
  return (
    <>
      {shown.length > 0 && (
        <dl className={styles.numerals} style={{ "--cells": shown.length } as CSSProperties}>
          {shown.map((x, i) => (
            <div key={x.role} className={`${styles.num} ${styles.ink}`} style={{ "--n": i } as CSSProperties}>
              <dt className={styles.role}>{numberTitles[x.role][locale]}</dt>
              <dd className={styles.figure}>
                <span className={styles.numeral}>{x.value}</span>
                {x.master && <span className={styles.master}><span className={styles.sr}>, </span>{n.master}</span>}
              </dd>
              <dd className={styles.meaning}>{n.roles[x.role]}</dd>
            </div>
          ))}
        </dl>
      )}
      {birthday?.value !== undefined && (
        <p className={`${styles.birthday} ${styles.ink}`} style={{ "--n": shown.length } as CSSProperties}>
          <span className={styles.role}>{numberTitles.birthday[locale]}</span>
          <span className={styles.birthdayNum}><span className={styles.sr}> </span>{birthday.value}</span>
          <span className={styles.birthdayText}><span aria-hidden="true">· </span><span className={styles.sr}>, </span>{n.birthday}</span>
        </p>
      )}
    </>
  );
}

/** A planet's sign, or the signs it may be in without a birth time. */
const signsOf = (f: PacketFactor) => (f.alternatives && f.alternatives.length > 1 ? f.alternatives : f.sign ? [f.sign] : []);

/** Sun, Moon and Rising as the deck's sign cards; Rising without a birth time is a card back. */
function SkyCards({ byId, cards, locale }: { byId: Map<string, PacketFactor>; cards: MajorCard[]; locale: PortraitLocale }) {
  const s = PORTRAIT_COPY[locale].maps.sky;
  const items = [
    { key: "sun", label: planetNames.sun[locale], glyph: BODY_GLYPHS.sun, f: byId.get("natal-sun") },
    { key: "moon", label: planetNames.moon[locale], glyph: BODY_GLYPHS.moon, f: byId.get("natal-moon") },
    { key: "asc", label: angleSeals.asc[locale], glyph: BODY_GLYPHS.ascendant, f: byId.get("natal-asc") },
  ];
  return (
    <ul className={styles.sky}>
      {items.map(({ key, label, glyph, f }) => {
        const signs = f ? signsOf(f) : [];
        // One card per sign (each sign has its own): two signs, two smaller cards.
        const dealt = signs.flatMap((sign) => {
          const card = cards[SIGN_CARDS[SIGNS.indexOf(sign)]];
          return card ? [{ sign, card }] : [];
        });
        return (
          <li key={key} className={styles.skyItem}>
            <p className={styles.skyKicker}><span className={glyph.length > 1 ? styles.letters : styles.skyGlyph} aria-hidden="true">{glyphOf(glyph)}</span>{label}</p>
            {dealt.length > 0 ? (
              <>
                <div className={styles.skyCards} data-pair={dealt.length > 1 || undefined}>
                  {dealt.map(({ sign, card }) => (
                    <a key={sign} className={styles.skyCard} href={card.href} aria-label={`${label}, ${eitherSigns([sign], locale)}, ${card.name}`} data-card-label={`${label} · ${eitherSigns([sign], locale)} · ${card.name}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- the card's own art, lazily loaded */}
                      <img src={card.thumb} srcSet={`${card.thumb} 120w, ${card.image} 896w`} sizes="(min-width: 720px) 128px, 84px" alt="" width={120} height={206} loading="lazy" decoding="async" />
                    </a>
                  ))}
                </div>
                <p className={styles.skySign}>
                  <span className={styles.signGlyphs} aria-hidden="true">{signs.map(signGlyph).join(" ")}</span>
                  {eitherSigns(signs, locale)}
                </p>
                <p className={styles.skyNames}>{dealt.map((d) => d.card.name).join(" · ")}</p>
                {signs.length > 1 && <p className={styles.skyNote}>{s.moved}</p>}
              </>
            ) : (
              <>
                <div className={styles.skyCards}>
                  <span className={styles.skyBack} data-card-label="off">
                    {/* eslint-disable-next-line @next/next/no-img-element -- the deck's own back, one cached file */}
                    <img src="/cards/back-448.webp" alt="" width={448} height={769} loading="lazy" decoding="async" />
                  </span>
                </div>
                <p className={`${styles.skySign} ${styles.skyMissing}`}>{s.noRising}</p>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Mercury to Pluto in two columns: glyph, planet, sign, house when known, ℞ when retrograde. */
function OtherPlanets({ byId, locale }: { byId: Map<string, PacketFactor>; locale: PortraitLocale }) {
  const t = PORTRAIT_COPY[locale];
  const others = PLANETS.filter((p) => p !== "sun" && p !== "moon").flatMap((body) => {
    const f = byId.get(`natal-${body}`);
    return f ? [{ body, f }] : [];
  });
  if (!others.length) return null;
  return (
    <>
      <h4 className={styles.othersTitle}>{t.maps.sky.others}</h4>
      <ul className={styles.planets} style={{ "--rows": Math.ceil(others.length / 2) } as CSSProperties}>
        {others.map(({ body, f }) => (
          <li key={body} className={styles.planet}>
            <span className={styles.planetGlyph} aria-hidden="true">{glyphOf(BODY_GLYPHS[body])}</span>
            <span className={styles.planetName}>{planetNames[body][locale]}</span>
            <span className={styles.planetSign}>
              <span className={styles.sr}>, </span>{eitherSigns(signsOf(f), locale)}
              {f.house ? <><span aria-hidden="true"> · </span><span className={styles.sr}>, </span>{houseName(f.house, locale)}</> : null}
            </span>
            {f.retrograde && <span className={styles.retro}><span aria-hidden="true">℞{TEXT}</span><span className={styles.sr}>, {t.why.retrograde}</span></span>}
          </li>
        ))}
      </ul>
    </>
  );
}
