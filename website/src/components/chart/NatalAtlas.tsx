"use client";

import { useId, useMemo, useState } from "react";
import type { NatalAspect, NatalChart } from "@/lib/natal-chart";
import { getPlanetInSign, HOUSE_MEANING, PLANET_MEANING } from "@/lib/planet-interpretations";
import TransitionLink from "@/components/transitions/TransitionLink";
import styles from "./NatalAtlas.module.css";
import { normalize, point, separateLabels, wheelAngle } from "./natal-atlas-geometry";

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const GLYPHS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];
const ASPECTS: Record<NatalAspect["type"], { glyph: string; meaning: string }> = {
  conjunction: { glyph: "☌", meaning: "These two planetary themes meet in the same part of the zodiac. Read them together." },
  sextile: { glyph: "⚹", meaning: "Traditionally, a cooperative relationship: an opportunity to bring these two themes into conversation." },
  square: { glyph: "□", meaning: "Traditionally, a point of tension. These themes may ask for conscious adjustment rather than an easy compromise." },
  trine: { glyph: "△", meaning: "Traditionally, an easy exchange. These themes may support one another, sometimes so naturally that they go unnoticed." },
  opposition: { glyph: "☍", meaning: "These themes face one another across the chart. The invitation is to give both sides room." },
  quincunx: { glyph: "⚻", meaning: "Traditionally, a relationship of adjustment: two themes that may need different kinds of attention." },
};

function aspectKey(aspect: NatalAspect) { return `${aspect.planet1}-${aspect.type}-${aspect.planet2}`; }

export default function NatalAtlas({ chart, intro, onNewChart }: { chart: NatalChart; intro: boolean; onNewChart: () => void }) {
  const id = useId();
  const [selected, setSelected] = useState("Sun");
  const [view, setView] = useState<"wheel" | "positions">("wheel");
  const [allAspects, setAllAspects] = useState(false);
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const hasAngles = chart.timeKnown !== false && !!chart.ascendant;
  const planet = chart.planets.find(p => p.name === selected);
  const isRising = selected === "Ascendant" && hasAngles;
  const relatedAspects = planet ? chart.aspects.filter(a => a.planet1 === selected || a.planet2 === selected) : [];
  const relationship = relatedAspects.find(a => aspectKey(a) === selectedAspect);
  const labelLongitudes = useMemo(() => separateLabels(chart.planets.map(p => p.longitude)), [chart.planets]);
  const rotation = hasAngles ? chart.ascendant.longitude : 0;
  // The same counterclockwise projection is used for signs, houses, anchors and aspects.
  const angle = (longitude: number) => wheelAngle(longitude, rotation);
  const choose = (name: string) => { setSelected(name); setSelectedAspect(null); };
  const selectedTitle = isRising ? `${chart.risingSign} rising` : planet ? `${planet.name} in ${planet.sign}` : "Your chart";
  const birthDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(chart.input.year, chart.input.month - 1, chart.input.day)));
  const birthTime = `${String(chart.input.hour).padStart(2, "0")}:${String(chart.input.minute).padStart(2, "0")}`;

  return (
    <section className={`${styles.atlas} ${intro ? styles.arriving : ""}`} aria-label="Explore your birth chart">
      <div className={styles.birthLine}>
        <span>{birthDate}{chart.input.city ? ` · ${chart.input.city}` : ""}</span>
        <span>{hasAngles ? `${birthTime} local time` : "Birth time unknown"}</span>
      </div>

      <div className={styles.bigThree} aria-label="Start with your three personal signatures">
        {[
          { name: "Sun", glyph: "☉", label: "Your centre", title: `Sun in ${chart.sunSign}`, sub: "Identity & vitality" },
          { name: "Moon", glyph: "☽", label: "Your inner world", title: `Moon in ${chart.moonSign}${chart.moonSignUncertain ? "*" : ""}`, sub: chart.moonSignUncertain ? "Birth time may change this sign" : "Emotion & instinct" },
          { name: "Ascendant", glyph: "↑", label: "Your first impression", title: hasAngles ? `${chart.risingSign} rising` : "Rising unknown", sub: hasAngles ? "How you meet the world" : "A birth time is needed" },
        ].map((item, i) => (
          <button key={item.name} type="button" className={styles.signature} aria-pressed={selected === item.name} aria-controls={`${id}-reading`} disabled={item.name === "Ascendant" && !hasAngles} onClick={() => choose(item.name)}>
            <span className={styles.signatureTop}><span>0{i + 1} / {item.label}</span><span className={styles.signatureGlyph} aria-hidden>{item.glyph}</span></span>
            <strong>{item.title}</strong><span className={styles.signatureSub}>{item.sub}</span>
          </button>
        ))}
      </div>

      {!hasAngles && <div className={styles.timeNotice} role="note">
        <strong>A partial sky, honestly drawn.</strong> Planet positions use local noon. Houses, rising sign and Midheaven are omitted because they require a birth time. Degrees and aspects are approximate for this date.
        {chart.moonSignNote && <p>{chart.moonSignNote}</p>}
      </div>}

      <div className={styles.toolbar}>
        <div className={styles.viewButtons} aria-label="Chart display">
          <button type="button" aria-pressed={view === "wheel"} onClick={() => setView("wheel")}>The atlas</button>
          <button type="button" aria-pressed={view === "positions"} onClick={() => setView("positions")}>Planet positions</button>
        </div>
        <button type="button" className={styles.newChart} onClick={onNewChart}>New chart <span aria-hidden>↗</span></button>
      </div>

      <div className={styles.exploration}>
        <div className={styles.visualColumn} id={`${id}-visual`} tabIndex={-1}>
          {view === "wheel" ? (
            <figure className={styles.figure}>
              <div className={styles.figureHeader}><span>Plate 01 / The natal sky</span><span>{hasAngles ? "Whole-sign houses" : "Local-noon estimate"}</span></div>
              <svg viewBox="0 0 520 520" className={styles.wheel} role="group" aria-labelledby={`${id}-wheel-title`} aria-describedby={`${id}-wheel-desc`}>
                <title id={`${id}-wheel-title`}>Your natal chart. Select a planet to explore its meaning.</title>
                <desc id={`${id}-wheel-desc`}>Zodiac signs and planetary positions share a fixed scale. {hasAngles ? "The ascendant is at the left." : "Zero degrees Aries is at the left; houses are unavailable."} Leader lines connect separated labels to their true longitudes. Named planet buttons and a table of computed positions are also available.</desc>
                <g fill="none" stroke="currentColor" aria-hidden="true" className={styles.engraving}>
                  <circle cx="260" cy="260" r="249" strokeWidth="0.8" />
                  <circle cx="260" cy="260" r="244" strokeWidth="0.4" />
                  <circle cx="260" cy="260" r="210" strokeWidth="0.7" />
                  <circle cx="260" cy="260" r="184" strokeWidth="0.5" />
                  <circle cx="260" cy="260" r="155" strokeWidth="0.4" />
                  {Array.from({ length: 72 }, (_, i) => {
                    const start = point(210, angle(i * 5));
                    const end = point(i % 6 === 0 ? 244 : i % 2 === 0 ? 202 : 206, angle(i * 5));
                    return <line key={i} x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth={i % 6 === 0 ? 0.65 : 0.45} />;
                  })}
                </g>
                <g aria-hidden="true" className={styles.zodiac}>
                  {GLYPHS.map((glyph, i) => {
                    const pos = point(227, angle(i * 30 + 15));
                    const active = planet?.sign === SIGNS[i] || (isRising && chart.risingSign === SIGNS[i]);
                    return <text key={glyph} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" className={active ? styles.activeSign : undefined}>{glyph}</text>;
                  })}
                </g>
                {hasAngles && <g className={styles.houses} aria-hidden="true">
                  {chart.houses.map((house, i) => {
                    const next = chart.houses[(i + 1) % chart.houses.length];
                    const start = point(155, angle(house.cusp));
                    const end = point(210, angle(house.cusp));
                    const label = point(195, angle(house.cusp + normalize(next.cusp - house.cusp) / 2));
                    return <g key={house.number}><line x1={start.x} y1={start.y} x2={end.x} y2={end.y} /><text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">{house.number}</text></g>;
                  })}
                  {[{ name: "ASC", longitude: chart.ascendant.longitude }, { name: "MC", longitude: chart.midheaven.longitude }].map(mark => {
                    const from = point(157, angle(mark.longitude)); const to = point(211, angle(mark.longitude)); const label = point(173, angle(mark.longitude));
                    return <g key={mark.name} className={styles.angleMark}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} /><rect x={label.x - 14} y={label.y - 8} width="28" height="16" /><text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">{mark.name}</text></g>;
                  })}
                </g>}
                <g aria-hidden="true" className={styles.aspectLines}>
                  {chart.aspects.map(aspect => {
                    const p1 = chart.planets.find(p => p.name === aspect.planet1); const p2 = chart.planets.find(p => p.name === aspect.planet2);
                    if (!p1 || !p2) return null;
                    const focused = relationship ? aspectKey(aspect) === selectedAspect : aspect.planet1 === selected || aspect.planet2 === selected;
                    if (!focused && !allAspects) return null;
                    const start = point(155, angle(p1.longitude)); const end = point(155, angle(p2.longitude));
                    return <line key={aspectKey(aspect)} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={`${focused ? styles.focusedAspect : styles.quietAspect} ${aspect.harmony === "tense" ? styles.tense : ""}`} />;
                  })}
                </g>
                <g aria-hidden="true" className={styles.centre}><circle cx="260" cy="260" r="22" /><path d="M260 248v24m-12-12h24m-18-6 12 12m0-12-12 12" /></g>
                {chart.planets.map((body, i) => {
                  const anchor = point(155, angle(body.longitude)); const label = point(127, angle(labelLongitudes[i]));
                  const active = selected === body.name; const paired = relationship && (relationship.planet1 === body.name || relationship.planet2 === body.name);
                  return <g key={body.name} className={`${styles.planet} ${active || paired ? styles.selectedPlanet : ""}`} role="button" tabIndex={0} aria-label={`${body.name} in ${body.sign}, ${body.degree} degrees${body.retrograde ? ", retrograde" : ""}`} aria-pressed={active} aria-controls={`${id}-reading`} onClick={() => choose(body.name)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(body.name); } }}>
                    <line x1={anchor.x} y1={anchor.y} x2={label.x} y2={label.y} className={styles.leader} />
                    <circle cx={anchor.x} cy={anchor.y} r="2.5" className={styles.anchor} />
                    <circle cx={label.x} cy={label.y} r="19" fill="transparent" stroke="none" />
                    <circle cx={label.x} cy={label.y} r="13.5" className={styles.planetDisc} />
                    <text x={label.x} y={label.y + 1} dominantBaseline="central" textAnchor="middle">{body.glyph}</text>
                  </g>;
                })}
              </svg>
              <figcaption className={styles.caption}>Select a symbol. Follow the line. Read the relationship.</figcaption>
              <div className={styles.aspectControls}>
                <button type="button" aria-pressed={allAspects} onClick={() => { setAllAspects(!allAspects); setSelectedAspect(null); }}><span aria-hidden>{allAspects ? "−" : "+"}</span> All {chart.aspects.length} aspects</button>
                <span><i aria-hidden />Flow / meeting <i aria-hidden className={styles.dashKey} />Tension</span>
              </div>
            </figure>
          ) : (
            <div className={styles.positions}>
              <p className={styles.eyebrow}>Plate 02 / Planetary positions</p>
              <p className={styles.positionIntro}>Every computed position, in one place. Select a row to read it.</p>
              <div className={styles.tableScroll}>
                <table><caption className={styles.srOnly}>Planetary positions, signs, whole-sign houses and motion</caption><thead><tr><th scope="col">Planet</th><th scope="col">Position</th>{hasAngles && <th scope="col">House</th>}<th scope="col">Motion</th></tr></thead><tbody>
                  {chart.planets.map(body => <tr key={body.name} className={selected === body.name ? styles.selectedRow : undefined}><th scope="row"><button type="button" aria-pressed={selected === body.name} onClick={() => choose(body.name)} aria-controls={`${id}-reading`}><span aria-hidden>{body.glyph}</span>{body.name}</button></th><td>{body.sign}<br /><span>{body.degree}°</span></td>{hasAngles && <td>{body.house}</td>}<td>{body.motion || (body.retrograde ? "retrograde" : "direct")}</td></tr>)}
                </tbody></table>
              </div>
            </div>
          )}

          <div className={styles.planetIndex} aria-label="Choose a planet">
            {chart.planets.map(body => <button type="button" key={body.name} aria-pressed={selected === body.name} aria-controls={`${id}-reading`} onClick={() => choose(body.name)}><span aria-hidden>{body.glyph}</span>{body.name}</button>)}
          </div>
          <button type="button" className={styles.readJump} onClick={() => {
            const title = document.getElementById(`${id}-reading-title`);
            title?.focus({ preventScroll: true });
            document.getElementById(`${id}-reading`)?.scrollIntoView({ block: "start", behavior: "instant" });
          }}>Read {selectedTitle} <span aria-hidden>↓</span></button>
        </div>

        <aside className={styles.reading} id={`${id}-reading`} aria-labelledby={`${id}-reading-title`}>
          <div className={styles.readingTop}><span className={styles.eyebrow}>{isRising ? "03 / How you arrive" : selected === "Sun" ? "01 / Your centre" : selected === "Moon" ? "02 / Your inner world" : "The planetary stories"}</span><span aria-hidden>{isRising ? "↑" : planet?.glyph}</span></div>
          <div key={selected} className={styles.readingContent}>
            <h2 id={`${id}-reading-title`} tabIndex={-1}>{selectedTitle}</h2>
            <p className={styles.position}>{isRising ? `${chart.ascendant.degree}° · Ascendant` : planet ? `${planet.degree}°${hasAngles ? ` · House ${planet.house}` : " · Noon estimate"}${planet.retrograde ? " · Retrograde" : ""}` : ""}</p>
            {planet && <>
              {planet.name === "Moon" && chart.moonSignUncertain && <p className={styles.moonNote}>{chart.moonSignNote}</p>}
              <p className={styles.meaning}>{PLANET_MEANING[planet.name]}</p>
              <p className={styles.interpretation}>{getPlanetInSign(planet.name, planet.sign)}</p>
              {hasAngles && HOUSE_MEANING[planet.house] && <div className={styles.houseStory}><p className={styles.eyebrow}>Where it takes shape</p><h3>House {planet.house} · {HOUSE_MEANING[planet.house].area}</h3><p>{HOUSE_MEANING[planet.house].rules}</p></div>}
            </>}
            {isRising && <><p className={styles.meaning}>The zodiac degree rising on the eastern horizon at your birth.</p><p className={styles.interpretation}>{chart.interpretation.outerPersona}</p><div className={styles.houseStory}><p className={styles.eyebrow}>A point of orientation</p><p>Your ascendant anchors the left of this wheel. In the whole-sign system, its zodiac sign forms the first house; the exact ascendant degree is marked separately.</p></div></>}
          </div>

          {planet && <div className={styles.relationships}><p className={styles.eyebrow}>In conversation with / {relatedAspects.length} aspects</p><p className={styles.relationshipHint}>Select a relationship to trace it on the atlas.</p>
            {relatedAspects.length ? relatedAspects.map(aspect => {
              const key = aspectKey(aspect); const other = aspect.planet1 === selected ? aspect.planet2 : aspect.planet1;
              return <button className={styles.relationship} key={key} type="button" aria-pressed={selectedAspect === key} onClick={() => { setView("wheel"); setSelectedAspect(selectedAspect === key ? null : key); }}><span aria-hidden>{ASPECTS[aspect.type].glyph}</span><span>{other}<small>{aspect.type}</small></span><span className={styles.orb}>{aspect.orb}° orb</span><span aria-hidden>↗</span></button>;
            }) : <p className={styles.noAspects}>No aspects within the chart’s configured orbs.</p>}
            {relationship && <div className={styles.relationshipStory} key={selectedAspect}><h3>{relationship.planet1} {relationship.type} {relationship.planet2}</h3><p>{ASPECTS[relationship.type].meaning}</p><p className={styles.aspectFact}>Separation {Number(relationship.angle.toFixed(1))}° · orb {relationship.orb}°{typeof relationship.applying === "boolean" ? ` · ${relationship.applying ? "applying" : "separating"}` : ""}</p><button type="button" className={styles.readJump} onClick={() => {
              const visual = document.getElementById(`${id}-visual`);
              visual?.focus({ preventScroll: true });
              visual?.scrollIntoView({ block: "start", behavior: "instant" });
            }}>Trace this relationship on the atlas <span aria-hidden>↑</span></button></div>}
          </div>}
          <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{selectedTitle} selected.{relationship ? ` ${relationship.planet1} ${relationship.type} ${relationship.planet2}, orb ${relationship.orb} degrees.` : ` ${relatedAspects.length} aspects available.`}</p>
        </aside>
      </div>

      <details className={styles.method}><summary>How to read this atlas <span aria-hidden>+</span></summary><div>
        <p><strong>Start with a planet.</strong> Its sign describes how a theme is expressed; its house describes an area of life. Aspects connect planetary themes. The smaller the orb, the closer the relationship is to its exact angle.</p>
        <p><strong>Reading the marks.</strong> Signs, houses and aspects use one fixed zodiac scale. Small dots show exact planetary longitudes; leader lines move overlapping glyphs apart without moving those positions. Solid aspect lines show harmonious or neutral relationships; dashed lines show tension.</p>
        <p><strong>Calculation.</strong> Tropical zodiac; geocentric planetary positions; whole-sign houses when the birth time is known. Local birth time is converted with the saved UTC offset ({chart.input.timezone >= 0 ? "+" : ""}{chart.input.timezone} hours). Interpretations are reflective astrology, separate from the calculated positions.</p>
      </div></details>
      <div className={styles.continue}><p>The chart is your map.<br /><em>Your portrait brings the threads together.</em></p><TransitionLink href="/portrait" className="alm-link">Read your celestial portrait →</TransitionLink></div>
    </section>
  );
}
