"use client";

/**
 * Your maps: the three things the portrait was read from, set as the book's
 * end plates. The eleven Arkan cards in their lattice, face up and still, each
 * a way to its page in the deck; the numbers of the name and date on an
 * engraved plate; and the sky as cards (Sun, Moon, Rising, as the site's
 * birth chart deals them), with the other planets listed beneath.
 */

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { BODY_GLYPHS, SIGN_CARDS, SIGN_GLYPHS, SIGNS } from "@/lib/astrology/constants.js";
import { READING_ORDER, ROLES, ROWS, threads } from "@/lib/portrait/lattice.js";
import { PLANETS } from "@/lib/portrait/packet.js";
import { ANGLE_SEALS, NUMBER_TITLES, PLANET_NAMES } from "@/lib/portrait/seals.js";
import { eitherSigns, houseName } from "@/lib/portrait/why.js";
import type { PacketFactor, PortraitPacket } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { registerSection } from "./sections";
import { LatticeCard, Threads, cardsAt } from "./Lattice";
import styles from "./maps.module.css";

type Text = { en: string; uk: string };
const roles = ROLES as Record<number, Text>;
const numberTitles = NUMBER_TITLES as Record<string, Text>;
const planetNames = PLANET_NAMES as Record<string, Text>;
const angleSeals = ANGLE_SEALS as Record<string, Text>;
/** Text presentation, so a glyph is never drawn as an emoji. */
const TEXT = "︎";
const glyphOf = (g: string) => (g.length === 1 ? `${g}${TEXT}` : g);
const signGlyph = (sign: string) => glyphOf(SIGN_GLYPHS[SIGNS.indexOf(sign)] ?? "");
const PLATE = ["lifePath", "expression", "soulUrge", "personality"] as const;

/** The lattice's design width (lattice.js); narrower than this it is laid out compact. */
const DESIGN_WIDTH = 820;
const COMPACT_BELOW = 720;
const CARD_RATIO = 149 / 86;

/**
 * The lattice's rows and columns (lattice.js) with room under every row for
 * its captions: one line wide, up to three when compact, where they wrap.
 */
function mapLayout(width: number) {
  const compact = width < COMPACT_BELOW;
  const w = compact ? Math.min(66, width * 0.19) : 86 * (width / DESIGN_WIDTH);
  const h = w * CARD_RATIO;
  const cap = compact ? 48 : 34;
  const pitch = h + cap + (compact ? 10 : 20);
  const cols = compact ? [0.17, 0.5, 0.83] : [0.15, 0.5, 0.85];
  const between = [(cols[0] + cols[1]) / 2, (cols[1] + cols[2]) / 2];
  const positions: Record<number, { x: number; y: number }> = {};
  ROWS.forEach((row, r) => {
    const xs = row.length === 2 ? between : cols;
    row.forEach((pos, c) => { positions[pos] = { x: xs[c] * width, y: h / 2 + pitch * r }; });
  });
  return { positions, card: { w, h }, height: h + pitch * (ROWS.length - 1), cap, compact };
}

export default function Maps({ packet, cards, locale, className }: {
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  className?: string;
}) {
  const t = PORTRAIT_COPY[locale];
  const m = t.maps;
  const id = "portrait-maps";
  const byId = useMemo(() => new Map(packet.factors.map((f) => [f.id, f])), [packet]);

  return (
    <section id={id} {...registerSection("maps", m.title, [])} tabIndex={-1} className={`${styles.maps} ${className ?? ""}`} aria-labelledby={`${id}-title`}>
      <header className={styles.head}>
        <p className={styles.fleuron} aria-hidden="true">❦</p>
        <h2 id={`${id}-title`} className={styles.title}>{m.title}</h2>
        <p className={styles.lede}>{m.lede}</p>
      </header>

      <section className={styles.map} aria-labelledby={`${id}-cards`}>
        <p className={styles.kicker}>{m.cards.kicker}</p>
        <h3 id={`${id}-cards`} className={styles.mapTitle}>{m.cards.title}</h3>
        <ArkanMap packet={packet} cards={cards} locale={locale} />
        <p className={styles.note}>{t.laying.threads} {m.cards.links}</p>
      </section>

      <section className={styles.map} aria-labelledby={`${id}-numbers`}>
        <p className={styles.kicker}>{m.numbers.kicker}</p>
        <h3 id={`${id}-numbers`} className={styles.mapTitle}>{m.numbers.title}</h3>
        <NumbersPlate byId={byId} locale={locale} />
      </section>

      <section className={styles.map} aria-labelledby={`${id}-sky`}>
        <p className={styles.kicker}>{m.sky.kicker}</p>
        <h3 id={`${id}-sky`} className={styles.mapTitle}>{m.sky.title}</h3>
        <SkyCards byId={byId} cards={cards} locale={locale} />
        <OtherPlanets byId={byId} locale={locale} />
      </section>
    </section>
  );
}

/** The eleven cards, face up and still, threads drawn; each card opens its page. */
function ArkanMap({ packet, cards, locale }: { packet: PortraitPacket; cards: MajorCard[]; locale: PortraitLocale }) {
  const t = PORTRAIT_COPY[locale];
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(Math.floor(Math.min(el.clientWidth, DESIGN_WIDTH)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const l = width > 0 ? mapLayout(width) : null;
  // A compact caption wraps within its column; the two-card row has the same pitch.
  const captionWidth = l ? Math.floor(width * 0.33 - 8) : 0;
  return (
    <div ref={box} className={styles.arkan}>
      {l && (
        <div className={`${styles.lattice} ${l.compact ? styles.compact : ""}`} style={{ width, height: l.height + l.cap, "--w": width } as CSSProperties}>
          <Threads width={width} height={l.height} lines={threads(l)} on={() => true} draw="shown" lit="draw" />
          <ol className={styles.cards}>
            {READING_ORDER.map((pos) => {
              const p = l.positions[pos];
              const card = cardAt[pos];
              const label = `${t.laying.card} ${pos}, ${roles[pos][locale]}, ${card?.name ?? ""}`;
              const place = { left: p.x - l.card.w / 2, top: p.y - l.card.h / 2, width: l.card.w, height: l.card.h, "--cap": `${captionWidth}px` } as CSSProperties;
              return (
                <li key={pos} className={styles.slot} style={place}>
                  {card && (
                    <a className={styles.cardLink} href={card.href} aria-label={label}>
                      <span className={styles.glow} aria-hidden="true" />
                      {/* The link names the card; the art is for the eye. */}
                      <span className={styles.art} aria-hidden="true">
                        <LatticeCard pos={pos} card={card} turned label="" sizes={`${Math.ceil(l.card.w)}px`} />
                      </span>
                    </a>
                  )}
                  <p className={styles.cap} aria-hidden="true"><b className={styles.capNum}>{pos}</b><span className={styles.dot}> · </span>{roles[pos][locale]}</p>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Four engraved cells (the numeral, its role, what the role means), the birthday number beneath. */
function NumbersPlate({ byId, locale }: { byId: Map<string, PacketFactor>; locale: PortraitLocale }) {
  const n = PORTRAIT_COPY[locale].maps.numbers;
  const shown = PLATE.flatMap((role) => {
    const f = byId.get(`num-${role}`);
    return f?.value !== undefined ? [{ role, value: f.value, master: Boolean(f.master) }] : [];
  });
  const birthday = byId.get("num-birthday");
  return (
    <>
      <dl className={styles.plate} style={{ "--cells": shown.length } as CSSProperties}>
        {shown.map((x) => (
          <div key={x.role} className={styles.cell} data-master={x.master || undefined}>
            {/* Named in sentence case: the visible role is set in capitals. */}
            <dt className={styles.role} aria-label={numberTitles[x.role][locale]}>{numberTitles[x.role][locale]}</dt>
            <dd className={styles.numeral}>
              {x.value}
              {/* The hallmark is set in capitals; it is spoken in sentence case. */}
              {x.master && <><span className={styles.master} aria-hidden="true">{n.master}</span><span className={styles.sr}>, {n.master}</span></>}
            </dd>
            <dd className={styles.meaning}>{n.roles[x.role]}</dd>
          </div>
        ))}
      </dl>
      {birthday?.value !== undefined && (
        <p className={styles.birthday}>
          {numberTitles.birthday[locale]} <b className={styles.birthdayNum}>{birthday.value}</b><span aria-hidden="true"> · </span><span className={styles.sr}>, </span>{n.birthday}
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
                    <a key={sign} className={styles.skyCard} href={card.href} aria-label={`${label}, ${eitherSigns([sign], locale)}, ${card.name}`}>
                      <span className={styles.glow} aria-hidden="true" />
                      {/* eslint-disable-next-line @next/next/no-img-element -- the card's own art, lazily loaded */}
                      <img src={card.thumb} srcSet={`${card.thumb} 120w, ${card.image} 896w`} sizes="(min-width: 720px) 150px, 96px" alt="" width={120} height={206} loading="lazy" decoding="async" />
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
                  <span className={styles.skyBack}>
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
      <h4 className={styles.othersTitle} aria-label={t.maps.sky.others}>{t.maps.sky.others}</h4>
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
