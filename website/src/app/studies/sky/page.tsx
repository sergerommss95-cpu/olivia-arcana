"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { birthSkyGeometry, horizonPoint } from "@/components/chart/flattened-sky-geometry";
import { computeNatalChart } from "@/lib/natal-chart";
import { STARS, CONSTELLATIONS } from "@/lib/star-chart";
import { compassDirection, observationInput, parseUtcMoment, shiftUtcMoment, skyLabels } from "./sky-study";
import styles from "./sky.module.css";

const PLACES = [
  { name: "Kyiv", lat: 50.45, lon: 30.52 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
];
const DEFAULT = { moment: "2026-09-24T19:00", latitude: "50.45", longitude: "30.52", place: "Kyiv", sample: true };
const CX = 380, R = 283;
const xy = (p: { x: number; y: number }) => ({ x: CX + p.x * R, y: CX + p.y * R });
const degrees = (value: number) => `${Math.abs(value).toFixed(1)}°`;
const NOTES: Record<string, { eyebrow: string; title: string; text: string }> = {
  Sun: { eyebrow: "The measure of daylight", title: "The light that changes everything.", text: "The Sun’s altitude describes its height above or below your geometric horizon. Its position sets the scene: daylight, twilight, or a darker sky." },
  Moon: { eyebrow: "Earth’s nearest companion", title: "A familiar light, a different face.", text: "The Moon’s shape follows the angle between the Sun and Moon as seen from Earth. Its place here also accounts for your viewpoint on Earth — lunar parallax matters." },
  Mercury: { eyebrow: "The innermost wanderer", title: "Following close to the Sun.", text: "Mercury stays near the Sun in our sky. Being above the horizon is only part of the story: daylight and the glow of twilight can make it difficult to see." },
  Venus: { eyebrow: "The evening or morning star", title: "A planet with a star’s reputation.", text: "Venus is a planet, though its brilliance earned it the names morning star and evening star. Its relationship to the Sun determines which side of the day it visits." },
  Mars: { eyebrow: "The red planet", title: "A small ember on the ecliptic.", text: "Mars often appears reddish to the eye. Its altitude and direction tell you where to look; its visibility and apparent brightness change with its distance from Earth." },
  Jupiter: { eyebrow: "The largest planet", title: "A bright presence in the night.", text: "Jupiter can be a conspicuous point of light when it is above a dark horizon. Even a small telescope may reveal its largest moons; the atlas marks the planet itself." },
  Saturn: { eyebrow: "The ringed planet", title: "Quiet to the eye. Extraordinary up close.", text: "To the unaided eye, Saturn appears as a point of light. Its rings require a telescope. This position is the planet’s apparent direction from your chosen location." },
  Uranus: { eyebrow: "An outer world", title: "At the edge of unaided sight.", text: "Uranus is faint. Optical aid is usually needed to identify it reliably. The chart gives its position, while the surrounding stars provide a reference." },
  Neptune: { eyebrow: "The most distant major planet", title: "A destination for the telescope.", text: "Neptune is too faint for the unaided eye. It is included as a calculated reference point, not a promise that it will be visible from your location." },
  Pluto: { eyebrow: "A distant dwarf planet", title: "Far beyond the bright wanderers.", text: "Pluto is a dwarf planet and requires substantial optical aid to observe. Its marker belongs to this calculated sky; it is not represented as a naked-eye star." },
};

function phaseName(phase: number) {
  if (phase < 10 || phase > 350) return "New Moon";
  if (phase < 80) return "Waxing crescent";
  if (phase < 100) return "First quarter";
  if (phase < 170) return "Waxing gibbous";
  if (phase < 190) return "Full Moon";
  if (phase < 260) return "Waning gibbous";
  if (phase < 280) return "Last quarter";
  return "Waning crescent";
}

export default function SkyStudy() {
  const [observation, setObservation] = useState(DEFAULT);
  const [moment, setMoment] = useState(DEFAULT.moment);
  const [place, setPlace] = useState(DEFAULT.place);
  const [latitude, setLatitude] = useState(DEFAULT.latitude);
  const [longitude, setLongitude] = useState(DEFAULT.longitude);
  const [selectedName, setSelectedName] = useState("Moon");
  const [layers, setLayers] = useState({ constellations: true, ecliptic: true, labels: true });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const readingRef = useRef<HTMLElement>(null);
  const instrumentRef = useRef<HTMLElement>(null);
  const revealInstrument = useRef(false);

  const sky = useMemo(() => {
    const input = observationInput(observation.moment, observation.latitude, observation.longitude);
    return birthSkyGeometry(computeNatalChart(input), STARS);
  }, [observation]);
  useEffect(() => {
    if (!revealInstrument.current) return;
    revealInstrument.current = false;
    const frame = requestAnimationFrame(() => {
      const chart = instrumentRef.current;
      if (!chart) return;
      chart.focus({ preventScroll: true });
      chart.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [observation]);
  const shown = useMemo(() => sky.planets.filter(p => p.alt >= 0), [sky]);
  const labels = useMemo(() => skyLabels(shown.map(p => ({ name: p.name, ...xy(p) }))), [shown]);
  const selected = sky.planets.find(p => p.name === selectedName) ?? sky.planets[1];
  const selectedPoint = xy(selected);
  const moonLight = (1 - Math.cos(sky.phase * Math.PI / 180)) / 2;
  const sun = sky.planets.find(p => p.name === "Sun")!;
  const light = sun.alt > 0 ? "Daylight" : sun.alt > -6 ? "Civil twilight" : sun.alt > -12 ? "Nautical twilight" : sun.alt > -18 ? "Astronomical twilight" : "Night";
  const formattedDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parseUtcMoment(observation.moment).utc);
  const note = NOTES[selected.name];
  const eclipticPath = sky.ecliptic.reduce((path, p, i) => {
    if (!i) return path;
    const previous = sky.ecliptic[i - 1];
    if (p.alt < 0 && previous.alt < 0) return path;
    const a = xy(previous), b = xy(p);
    return `${path}M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`;
  }, "");

  function apply(event: FormEvent) {
    event.preventDefault();
    try {
      observationInput(moment, latitude, longitude);
      revealInstrument.current = true;
      setObservation({ moment, latitude, longitude, place, sample: false });
      setError("");
      setStatus(`Sky updated for ${place === "Custom" ? "your coordinates" : place}, ${moment.replace("T", " at ")} UTC.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please check the observation details."); }
  }
  function step(minutes: number) {
    try {
      const next = shiftUtcMoment(observation.moment, minutes);
      // Time exploration changes the applied sky, without erasing form drafts.
      if (moment === observation.moment && place === observation.place && latitude === observation.latitude && longitude === observation.longitude) setMoment(next);
      setObservation({ ...observation, moment: next });
      setError(""); setStatus(`Sky moved to ${next.replace("T", " at ")} UTC.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "That moment is outside the supported dates."); }
  }
  function choosePlace(value: string) {
    setPlace(value);
    const location = PLACES.find(p => p.name === value);
    if (location) { setLatitude(String(location.lat)); setLongitude(String(location.lon)); }
  }
  function selectBody(name: string, reveal = false) {
    setSelectedName(name);
    const body = sky.planets.find(p => p.name === name);
    if (body) setStatus(`${body.name}: ${degrees(body.alt)} ${body.alt >= 0 ? "above" : "below"} the horizon, to the ${compassDirection(body.az)}.`);
    if (reveal && window.matchMedia("(max-width: 760px)").matches) {
      readingRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  return <main id="main-content" className={styles.page}>
    <nav className={styles.nav} aria-label="Study navigation">
      <Link href="/" className={styles.brand}>Olivia <i>Arcana</i><span aria-hidden="true">✳</span></Link>
      <Link href="/studies">The studies <span aria-hidden="true">↗</span></Link>
    </nav>

    <header className={styles.header}>
      <div><p className={styles.eyebrow}>No. 02 / The celestial atlas</p><h1>The sky, from<br /><em>where you stand.</em></h1></div>
      <div className={styles.introduction}><p>A moment. A place. The heavens above it.</p><p>Choose a light in the chart to understand where it sits — and what you are looking at.</p><a className={styles.setMoment} href="#moment-heading">Set your moment <span aria-hidden="true">↘</span></a></div>
    </header>

    <div className={styles.observationBar}>
      <div><span className={styles.observationDot} aria-hidden="true" /><strong>{observation.place === "Custom" ? "Custom coordinates" : observation.place}</strong><span>{formattedDate}</span></div>
      <div><span>{observation.moment.slice(11)} UTC</span><span className={styles.sample}>{observation.sample ? "Example observation" : "Your observation"}</span></div>
    </div>

    <div className={styles.instrumentLayout}>
      <section ref={instrumentRef} tabIndex={-1} className={styles.instrument} aria-label="Interactive sky chart">
        <div className={styles.plateHeading}><span>Fig. 02 — The visible hemisphere</span><span>{light}</span></div>
        <svg className={styles.sky} viewBox="0 0 760 760" role="group" aria-labelledby="sky-study-title sky-study-description">
          <title id="sky-study-title">{`Sky above ${observation.place} on ${formattedDate} at ${observation.moment.slice(11)} UTC`}</title>
          <desc id="sky-study-description">A look-up map. North is at the top, east at the left, and the zenith is at the centre. Only bodies above the geometric horizon are plotted. Select a body on the map or from the buttons below. A complete numerical table follows the controls.</desc>
          <defs><clipPath id="study-horizon"><circle cx={CX} cy={CX} r={R} /></clipPath></defs>
          <circle className={styles.outerRule} cx={CX} cy={CX} r={R + 37} />
          <circle className={styles.outerRule} cx={CX} cy={CX} r={R + 28} />
          {Array.from({ length: 120 }, (_, i) => {
            const angle = i * Math.PI / 60, outer = R + 22, inner = outer - (i % 10 === 0 ? 11 : i % 5 === 0 ? 7 : 3);
            // Quantized: server and browser trig differ by 1 ULP, which trips hydration.
            const q = (v: number) => Math.round(v * 100) / 100;
            return <line key={i} className={styles.ticks} x1={q(CX + Math.sin(angle) * inner)} y1={q(CX - Math.cos(angle) * inner)} x2={q(CX + Math.sin(angle) * outer)} y2={q(CX - Math.cos(angle) * outer)} />;
          })}
          <circle className={styles.nightDisc} cx={CX} cy={CX} r={R} />
          <g clipPath="url(#study-horizon)">
            {[30, 60].map(alt => <circle key={alt} className={styles.altitudeRing} cx={CX} cy={CX} r={Math.abs(horizonPoint(alt, 0).y) * R} />)}
            <path className={styles.meridian} d={`M${CX - R},${CX}H${CX + R}M${CX},${CX - R}V${CX + R}`} />
            {layers.constellations && <g className={styles.constellations}>{CONSTELLATIONS.flatMap((c, ci) => c.lines.flatMap((run, ri) => run.slice(1).map((index, i) => {
              const first = sky.stars[run[i]], second = sky.stars[index];
              if (!first || !second || (first.alt < 0 && second.alt < 0)) return null;
              const a = xy(first), b = xy(second);
              return <line key={`${ci}-${ri}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })))}</g>}
            {layers.ecliptic && <path className={styles.ecliptic} d={eclipticPath} />}
            <g className={styles.stars}>{sky.stars.map((star, i) => star.alt >= 0 && <circle key={i} cx={xy(star).x} cy={xy(star).y} r={Math.max(.7, 2.7 - star.mag * .45)} />)}</g>
            {layers.labels && <g className={styles.starNames}>{sky.stars.map((star, i) => star.alt > 7 && star.mag < 1 && STARS[i].name && <text key={i} x={xy(star).x + 8} y={xy(star).y + 4}>{STARS[i].name}</text>)}</g>}
            <path className={styles.zenith} d={`M${CX - 5},${CX}h10M${CX},${CX - 5}v10`} />
            {layers.labels && <g className={styles.gridLabels}><text x={CX + 9} y={CX - 8}>ZENITH</text><text x={CX + 5} y={CX - Math.abs(horizonPoint(60, 0).y) * R - 8}>60°</text><text x={CX + 5} y={CX - Math.abs(horizonPoint(30, 0).y) * R - 8}>30°</text></g>}
            {selected.alt >= 0 && <g className={styles.selectedRay} aria-hidden="true"><path d={`M${CX},${CX}L${selectedPoint.x},${selectedPoint.y}`} /><circle cx={selectedPoint.x} cy={selectedPoint.y} r="16" /></g>}
            {shown.map(planet => {
              const p = xy(planet), active = planet.name === selected.name;
              return <g key={planet.name} className={`${styles.bodyPoint} ${active ? styles.activeBody : ""}`} role="button" tabIndex={0} aria-pressed={active} aria-label={`Select ${planet.name}, ${degrees(planet.alt)} above the horizon`} onClick={() => selectBody(planet.name)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectBody(planet.name); } }}>
                <circle className={styles.hitArea} cx={p.x} cy={p.y} r="23" />
                <circle className={styles.bodyDot} cx={p.x} cy={p.y} r={planet.name === "Sun" || planet.name === "Moon" ? 5 : 3.5} />
              </g>;
            })}
          </g>
          {layers.labels && <g className={styles.bodyLabels}>{labels.map(p => <g key={p.name} className={p.name === selected.name ? styles.activeLabel : ""} aria-hidden="true"><path d={`M${p.x},${p.y}L${p.lineX},${p.lineY}`} /><text x={p.labelX} y={p.labelY}>{p.name}</text></g>)}</g>}
          <g className={styles.cardinals} textAnchor="middle"><text x={CX} y="36">N</text><text x="27" y={CX + 5}>E</text><text x={CX} y="733">S</text><text x="733" y={CX + 5}>W</text></g>
          <text className={styles.horizonText} textAnchor="middle" x={CX} y="692">0° / GEOMETRIC HORIZON</text>
        </svg>
        <div className={styles.plateFooter}><p><span aria-hidden="true">↖</span> Look up. East is on your left.</p><span>{sky.stars.filter(s => s.alt >= 0).length} catalog stars above the horizon</span></div>
        <fieldset className={styles.layers}><legend>On the chart</legend>{(["constellations", "ecliptic", "labels"] as const).map(layer => <label key={layer}><input type="checkbox" checked={layers[layer]} onChange={event => setLayers({ ...layers, [layer]: event.target.checked })} /><span>{layer === "ecliptic" ? "Sun’s path" : layer[0].toUpperCase() + layer.slice(1)}</span></label>)}</fieldset>
      </section>

      <aside ref={readingRef} className={styles.reading} aria-label="Selected celestial body">
        <div className={styles.selectedTop}><p className={styles.eyebrow}>Selected light</p><span aria-hidden="true">{selected.glyph}</span></div>
        <div className={styles.readingContent} key={selected.name}>
          <h2>{selected.name}</h2><p className={styles.bodyEyebrow}>{note.eyebrow}</p>
          <div className={styles.position}><strong>{degrees(selected.alt)}</strong><div><span>{selected.alt >= 0 ? "Above" : "Below"} the horizon</span><span>To the {compassDirection(selected.az)}</span></div></div>
          {selected.name === "Moon" && <div className={styles.moonDetail}><svg viewBox="0 0 80 80" width="64" height="64" role="img" aria-label={`${Math.round(moonLight * 100)} percent illuminated`}><circle cx="40" cy="40" r="30" fill="#19203a" /><path d={`M40 10A30 30 0 0 ${sky.phase < 180 ? 1 : 0} 40 70A${Math.max(.01, Math.abs(Math.cos(sky.phase * Math.PI / 180)) * 30)} 30 0 0 ${moonLight > .5 ? (sky.phase < 180 ? 1 : 0) : (sky.phase < 180 ? 0 : 1)} 40 10`} fill="#e7d4a8" /></svg><div><strong>{phaseName(sky.phase)}</strong><span>{Math.round(moonLight * 100)}% illuminated</span></div></div>}
          <h3>{note.title}</h3><p className={styles.story}>{note.text}</p>
          <p className={styles.visibility}>{selected.alt < 0 ? "This body is beneath your horizon, so it is listed here without a marker on the visible-sky map." : sun.alt > -6 && selected.name !== "Sun" && selected.name !== "Moon" ? "It is above your horizon, but daylight or twilight may hide it." : "Above the horizon does not guarantee visibility. Clouds, buildings, light pollution and brightness also matter."}</p>
        </div>
        <div className={styles.explore}><p className={styles.eyebrow}>Explore this moment</p><div><button type="button" onClick={() => step(-60)} aria-label="Move sky one hour earlier">← <span>1 hour</span></button><span>{observation.moment.slice(11)}<small>UTC</small></span><button type="button" onClick={() => step(60)} aria-label="Move sky one hour later"><span>1 hour</span> →</button></div><p>The clock moves only when you do.</p></div>
      </aside>
    </div>

    <section className={styles.bodyDirectory} aria-label="Choose a celestial body">
      <div><p className={styles.eyebrow}>The wanderers</p><p>{shown.length} of {sky.planets.length} bodies above the horizon</p></div>
      <div className={styles.bodyButtons}>{sky.planets.map(p => <button key={p.name} type="button" onClick={() => selectBody(p.name, true)} aria-pressed={p.name === selected.name} className={p.name === selected.name ? styles.chosenBody : ""}><span aria-hidden="true">{p.glyph}</span><strong>{p.name}</strong><small>{p.alt >= 0 ? "Above" : "Below"}</small></button>)}</div>
    </section>

    <section className={styles.chooseMoment} aria-labelledby="moment-heading">
      <div><p className={styles.eyebrow}>Set your vantage point</p><h2 id="moment-heading">Every sky begins<br /><em>somewhere.</em></h2><p>The first chart is a labeled example. Choose a moment and location to make an observation of your own.</p><span className={styles.privacy}>Calculated on your device. These details are not saved.</span></div>
      <form onSubmit={apply} className={styles.form} noValidate>
        <label className={styles.timeInput}><span>Date & time <b>UTC</b></span><input type="datetime-local" value={moment} min="1900-01-01T00:00" max="2100-12-31T23:59" step="60" onChange={event => setMoment(event.target.value)} aria-describedby="utc-note" required /></label>
        <p className={styles.formNote} id="utc-note">Universal Time, including minutes. Convert your local time to UTC before entering it; the city does not change the time zone.</p>
        <label><span>Observation place</span><select value={place} onChange={event => choosePlace(event.target.value)}>{PLACES.map(p => <option key={p.name}>{p.name}</option>)}<option value="Custom">Custom coordinates</option></select></label>
        <div className={styles.coordinateInputs}><label><span>Latitude <small>north + / south −</small></span><input value={latitude} type="number" step="any" min="-90" max="90" readOnly={place !== "Custom"} onChange={event => setLatitude(event.target.value)} required /></label><label><span>Longitude <small>east + / west −</small></span><input value={longitude} type="number" step="any" min="-180" max="180" readOnly={place !== "Custom"} onChange={event => setLongitude(event.target.value)} required /></label></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.submit} type="submit">Draw this sky <span aria-hidden="true">↗</span></button>
        <p className={styles.srOnly} role="status" aria-live="polite">{status}</p>
      </form>
    </section>

    <section className={styles.explanation} aria-label="How to read the atlas">
      <div><span>01</span><h3>Stand at the centre.</h3><p>The centre is the zenith, directly overhead. The edge is the horizon. Rings mark 30° and 60° altitude; the map looks upward, so east is left.</p></div>
      <div><span>02</span><h3>Follow the fine gold line.</h3><p>The ecliptic is the Sun’s apparent yearly path. The Moon and planets travel near it, with their own latitude and position in the sky.</p></div>
      <div><span>03</span><h3>A sky map. Another kind of story.</h3><p>This atlas shows directions above a place. For astrological signs, houses and interpretation of a birth moment, open your <Link href="/chart">birth chart ↗</Link>.</p></div>
    </section>

    <details className={styles.technical}><summary>Read the positions & calculation notes <span aria-hidden="true">+</span></summary><div className={styles.tableWrap}><table><caption>Apparent topocentric directions at {observation.moment.replace("T", " ")} UTC</caption><thead><tr><th scope="col">Body</th><th scope="col">Altitude</th><th scope="col">Azimuth</th><th scope="col">Horizon</th></tr></thead><tbody>{sky.planets.map(p => <tr key={p.name}><th scope="row">{p.name}</th><td>{p.alt.toFixed(2)}°</td><td>{p.az.toFixed(2)}°</td><td>{p.alt >= 0 ? "Above" : "Below"}</td></tr>)}</tbody></table></div><p>Astronomy Engine supplies the Sun, Moon and planetary directions for a sea-level observer. The horizon is geometric, without atmospheric refraction, terrain or weather. Azimuth runs clockwise from north. Stars use a selected J2000 bright-star catalog transformed to the date, without individual proper motion; this is a reference map, not a complete sky survey. Only text labels move to avoid overlaps. The Moon icon shows approximate illuminated fraction and waxing/waning phase, not its local tilt. Dates are supported from 1900 through 2100.</p></details>
    <footer className={styles.footer}><Link href="/studies">← Return to the studies</Link><p>Olivia Arcana <span> / </span> An atlas for the curious.</p><Link href="/chart">Explore your birth chart ↗</Link></footer>
  </main>;
}
