"use client";

/**
 * The sky dealt in cards, as a scene. A plane of real stars (the ecliptic
 * seen from above its north pole, so the stars share the chart's
 * longitudes) lies tilted away from the viewer, the signs engraved on its
 * ivory rim; the twelve sign cards are dealt round it and lie face up like a
 * spread on a table; the Sun, Moon and Rising cards stand up from it in
 * gold (each rises as it is turned); the planets hover as pearl orbs pinned
 * above their degree; threads join the closest aspects. The plane leans a little
 * towards the pointer. Rising sign on the left, as charts are drawn;
 * 0° Aries on the left without a birth time. CSS 3D, no WebGL.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BODY_GLYPHS, SIGN_GLYPHS } from "@/lib/astrology/chart.js";
import { dot, skyField, spreadLongitudes } from "@/lib/astrology/sky-field";
import type { AspectFound, Placement } from "@/lib/astrology/types";
import styles from "./scene.module.css";

const SIZE = 1000;
const C = SIZE / 2;
const R = { sky: 330, glyphs: 349, ring: 368, cards: 468, planet: 244, chord: 190 };
const TEXT = "︎"; // text presentation: glyphs never become emoji
const HARMONIOUS = new Set(["trine", "sextile"]);
const DEG = Math.PI / 180;

export type SceneCard = { image: string; href: string; name: string };

type Props = {
  bodies: Placement[];
  ascendant: Placement | null;
  midheaven: Placement | null;
  aspects: AspectFound[];
  /** The twelve sign cards, Aries first. */
  signCards: SceneCard[];
  /** Short label per body key, e.g. "Venus in Taurus · 18°47′". */
  labels: Record<string, string>;
  /** Which of the Sun, Moon and Rising cards have been turned (all when omitted). */
  revealed?: string[];
  /** Words for the standing cards' roles, e.g. { sun: "Sun", moon: "Moon", ascendant: "Rising" }. */
  roleNames: Partial<Record<"sun" | "moon" | "ascendant", string>>;
  /** Screen-reader summary of the scene. */
  description: string;
};

export default function SkyScene({ bodies, ascendant, midheaven, aspects, signCards, labels, revealed, roleNames, description }: Props) {
  const uid = useId().replace(/:/g, "");
  const sceneRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const start = ascendant?.longitude ?? 0;
  const point = (longitude: number, radius: number) => {
    const angle = Math.PI + (longitude - start) * DEG;
    return { x: C + radius * Math.cos(angle), y: C - radius * Math.sin(angle) };
  };
  const skyPoint = (lon: number, lat: number) => point(lon, (R.sky * (90 - lat)) / 90);
  const field = skyField();
  const spread = useMemo(() => spreadLongitudes(bodies.map((b) => b.longitude), 14), [bodies]);
  const byKey = new Map([...bodies, ...(ascendant ? [ascendant] : []), ...(midheaven ? [midheaven] : [])].map((p) => [p.key, p]));
  const threads = aspects.filter((found) => found.aspect !== "conjunction").slice(0, 12);
  const f = (n: number) => n.toFixed(1);

  const lit = new Set(revealed ?? ["sun", "moon", "ascendant"]);
  const roles = new Map<number, string[]>();
  const mark = (index: number, role: "sun" | "moon" | "ascendant") => roles.set(index, [...(roles.get(index) ?? []), `${role === "ascendant" ? "" : BODY_GLYPHS[role] + TEXT} ${roleNames[role] ?? ""}`.trim()]);
  const sun = bodies.find((b) => b.key === "sun"), moon = bodies.find((b) => b.key === "moon");
  if (sun && lit.has("sun")) mark(sun.index, "sun");
  if (moon && lit.has("moon")) mark(moon.index, "moon");
  if (ascendant && lit.has("ascendant")) mark(ascendant.index, "ascendant");
  // Slots that may stand, turned or not, so the fit leaves room for them from the start
  const destined = new Set([sun?.index, moon?.index, ascendant?.index].filter((index) => index !== undefined));
  const dealFrom = ascendant?.index ?? 0;

  // Fit the scene: measure the projected bounds of the ring (static markers, so the
  // deal animation does not disturb them), scale to the width and the viewport's
  // height, then size the scene to what it holds. And lean towards the pointer.
  useEffect(() => {
    const scene = sceneRef.current, plane = planeRef.current;
    if (!scene || !plane) return;
    const bounds = () => {
      const rects = [...scene.querySelectorAll<HTMLElement | SVGElement>("[data-bound]")].map((el) => el.getBoundingClientRect());
      return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)), left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)) };
    };
    const fit = () => {
      scene.style.setProperty("--k", "1");
      scene.style.setProperty("--shift", "0px");
      const whole = bounds();
      const narrow = scene.clientWidth < 760;
      const k = Math.min(1.15, (scene.clientWidth * (narrow ? 1.02 : 0.94)) / (whole.right - whole.left), (window.innerHeight * 0.86) / (whole.bottom - whole.top));
      scene.style.setProperty("--k", k.toFixed(3));
      const box = scene.getBoundingClientRect(), fitted = bounds();
      scene.style.setProperty("--shift", `${(box.top + 64 - fitted.top).toFixed(1)}px`);
      scene.style.height = `${(fitted.bottom - fitted.top + 96).toFixed(0)}px`;
    };
    fit();
    const observer = new ResizeObserver(() => requestAnimationFrame(fit));
    observer.observe(scene);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches;
    const lean = (event: PointerEvent) => {
      const box = scene.getBoundingClientRect();
      const nx = (event.clientX - box.left) / box.width - 0.5, ny = (event.clientY - box.top) / box.height - 0.5;
      plane.style.setProperty("--lean-x", `${(-ny * 5).toFixed(2)}deg`);
      plane.style.setProperty("--lean-z", `${(nx * 6).toFixed(2)}deg`);
    };
    const rest = () => { plane.style.setProperty("--lean-x", "0deg"); plane.style.setProperty("--lean-z", "0deg"); };
    if (!still) { scene.addEventListener("pointermove", lean); scene.addEventListener("pointerleave", rest); }
    return () => { observer.disconnect(); scene.removeEventListener("pointermove", lean); scene.removeEventListener("pointerleave", rest); };
  }, []);

  const place = (p: { x: number; y: number }) => ({ left: `${f(p.x)}px`, top: `${f(p.y)}px` });

  return (
    <div className={styles.scene} ref={sceneRef} data-focus={focus ? "" : undefined}>
      <div className={styles.silk} aria-hidden><span /><span /><span /></div>
      <p className={styles.srOnly}>{description}</p>
      <div className={styles.fit}>
        <div className={styles.stage}>
          <div className={styles.plane} ref={planeRef}>
            {/* The plane itself: night, the real stars, the degree ring, the rosette, the aspect threads */}
            <svg className={styles.plate} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden data-bound>
              <defs>
                <radialGradient id={`${uid}-night`} cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#1a3b5c" />
                  <stop offset="0.72" stopColor="#0d2238" />
                  <stop offset="1" stopColor="#081828" />
                </radialGradient>
                <radialGradient id={`${uid}-pool`} cx="50%" cy="50%" r="50%">
                  <stop offset="0.6" stopColor="#2a5680" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#0b192a" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${uid}-ivory`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fbf4e3" />
                  <stop offset="0.5" stopColor="#e7d8b6" />
                  <stop offset="1" stopColor="#bfa87e" />
                </linearGradient>
                <clipPath id={`${uid}-disc`}><circle cx={C} cy={C} r={R.sky} /></clipPath>
              </defs>
              <circle cx={C} cy={C} r={R.cards + 60} fill={`url(#${uid}-pool)`} />
              <circle cx={C} cy={C} r={R.cards} className={styles.tableRing} />
              <circle cx={C} cy={C} r={R.sky} fill={`url(#${uid}-night)`} />
              <g clipPath={`url(#${uid}-disc)`}>
                {[0, 1, 2, 3].map((bucket) => (
                  <path key={bucket} className={styles.milky} opacity={0.06 + bucket * 0.04}
                    d={field.milky.filter((m) => Math.min(3, Math.floor(m.w * 4)) === bucket).map((m) => dot(skyPoint(m.lon, m.lat), 1.5)).join("")} />
                ))}
                <path className={styles.fieldStars} d={field.field.map((m) => dot(skyPoint(m.lon, m.lat), 0.4 + 0.55 * m.w)).join("")} />
                {field.lines.map((run, i) => <polyline key={i} className={styles.constellation} points={run.map((s) => { const p = skyPoint(s.lon, s.lat); return `${f(p.x)},${f(p.y)}`; }).join(" ")} />)}
                <path className={styles.brightStars} d={field.stars.map((s) => dot(skyPoint(s.lon, s.lat), s.r)).join("")} />
              </g>
              <path d={`M ${C - R.ring},${C} a ${R.ring},${R.ring} 0 1,0 ${R.ring * 2},0 a ${R.ring},${R.ring} 0 1,0 ${-R.ring * 2},0 M ${C - R.sky},${C} a ${R.sky},${R.sky} 0 1,1 ${R.sky * 2},0 a ${R.sky},${R.sky} 0 1,1 ${-R.sky * 2},0 Z`}
                fill={`url(#${uid}-ivory)`} fillRule="evenodd" />
              {Array.from({ length: 72 }, (_, k) => {
                const d = k * 5, major = d % 30 === 0, len = d % 10 === 0 ? 6 : 4;
                if (major) { const a = point(d, R.sky), b = point(d, R.ring); return <line key={d} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} className={styles.tickMajor} />; }
                const a = point(d, R.sky), b = point(d, R.sky + len), c = point(d, R.ring - len), e = point(d, R.ring);
                return <path key={d} d={`M${f(a.x)},${f(a.y)}L${f(b.x)},${f(b.y)}M${f(c.x)},${f(c.y)}L${f(e.x)},${f(e.y)}`} className={styles.tick} />;
              })}
              <g className={styles.rosette}>
                {Array.from({ length: 16 }, (_, i) => {
                  const a = (i * 22.5) * DEG, long = i % 2 === 0, len = long ? 40 : 26;
                  const x2 = C + len * Math.cos(a), y2 = C - len * Math.sin(a);
                  if (long) return <line key={i} x1={C} y1={C} x2={f(x2)} y2={f(y2)} />;
                  const mx = C + (len / 2) * Math.cos(a) + 3.5 * Math.cos(a + Math.PI / 2), my = C - (len / 2) * Math.sin(a) - 3.5 * Math.sin(a + Math.PI / 2);
                  return <path key={i} d={`M${C},${C} Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}`} />;
                })}
                <circle cx={C} cy={C} r={4.5} />
              </g>
              {ascendant && midheaven && [ascendant, midheaven].map((angle) => {
                const a = point(angle.longitude, R.sky), b = point(angle.longitude + 180, R.sky);
                return <line key={angle.key} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} className={styles.axis} />;
              })}
              {/* Where each planet stands exactly, and the thread to its orb */}
              <g className={styles.leaders}>
                {bodies.map((body, i) => {
                  const exact = point(body.longitude, R.sky - 2), at = point(spread[i], R.planet);
                  return <g key={body.key}><line x1={f(exact.x)} y1={f(exact.y)} x2={f(at.x)} y2={f(at.y)} /><circle cx={f(exact.x)} cy={f(exact.y)} r={3} /></g>;
                })}
              </g>
              <g className={styles.threads}>
                {threads.map((found, i) => {
                  const a = byKey.get(found.a), b = byKey.get(found.b);
                  if (!a || !b) return null;
                  const p = point(a.longitude, R.chord), q = point(b.longitude, R.chord);
                  const on = !focus || found.a === focus || found.b === focus;
                  return <line key={`${found.a}-${found.b}`} x1={f(p.x)} y1={f(p.y)} x2={f(q.x)} y2={f(q.y)} pathLength={1}
                    className={`${HARMONIOUS.has(found.aspect) ? styles.threadEase : styles.threadTension} ${on ? "" : styles.dim}`} style={{ animationDelay: `${1.8 + i * 0.08}s` }} />;
                })}
              </g>
            </svg>

            {/* Engraved on the plane: the signs on the ivory rim, AC and MC inside it. HTML rather than SVG
                text, which Chrome can paint out of place inside a 3D-transformed layer. */}
            {SIGN_GLYPHS.map((glyph, i) => <span key={glyph} className={styles.engraved} style={place(point(i * 30 + 15, R.glyphs))} aria-hidden>{glyph + TEXT}</span>)}
            {ascendant && midheaven && [ascendant, midheaven].map((angle) => (
              <span key={`mark-${angle.key}`} className={styles.angleMark} style={place(point(angle.longitude, R.sky - 22))} aria-hidden>{angle.key === "ascendant" ? "AC" : "MC"}</span>
            ))}

            {/* Invisible, unanimated stand-ins for the cards: what the scene measures to fit itself */}
            {signCards.map((_, i) => (
              <span key={`bound-${i}`} className={styles.slot} style={place(point(i * 30 + 15, R.cards))} aria-hidden>
                <span className={`${styles.hinge} ${styles.lie} ${styles.still}`}><span className={styles.cardBound} data-bound /></span>
                {destined.has(i) && <span className={`${styles.hinge} ${styles.rise} ${styles.still}`}><span className={styles.cardBoundTall} data-bound /></span>}
              </span>
            ))}

            {/* Shadows the standing cards cast on the plane */}
            {signCards.map((_, i) => (
              <span key={`shadow-${i}`} className={`${styles.shadow} ${roles.has(i) ? styles.shadowLit : ""}`} style={place(point(i * 30 + 15, R.cards))} aria-hidden />
            ))}

            {/* The twelve sign cards, dealt from the centre: face up on the plane, or standing when lit */}
            {signCards.map((card, i) => {
              const at = point(i * 30 + 15, R.cards);
              const role = roles.get(i);
              const order = (i - dealFrom + 12) % 12;
              return (
                <span key={card.href} className={`${styles.slot} ${styles.dealt}`}
                  style={{ ...place(at), ["--dx" as string]: `${f(C - at.x)}px`, ["--dy" as string]: `${f(C - at.y)}px`, ["--delay" as string]: `${0.2 + order * 0.11}s` }}>
                  <span className={`${styles.hinge} ${role ? styles.rise : styles.lie}`}>
                    <a href={card.href} className={`${styles.card} ${role ? styles.cardLit : ""}`} aria-label={card.name}>
                      {role && <span className={styles.role}>{role.join(" · ")}</span>}
                      <span className={styles.art}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- static card art */}
                        <img src={card.image} alt="" width={256} height={439} draggable={false} />
                      </span>
                    </a>
                  </span>
                </span>
              );
            })}

            {/* Planets: pearl orbs (the Sun gold) pinned above their degree */}
            {bodies.map((body, i) => {
              const at = point(spread[i], R.planet);
              return (
                <span key={body.key} className={styles.slot} style={{ ...place(at), ["--delay" as string]: `${1.5 + i * 0.06}s` }}>
                    <span className={styles.stand}>
                      <span className={`${styles.orbWrap} ${focus === body.key ? styles.orbFocus : ""}`}
                        onPointerEnter={() => setFocus(body.key)} onPointerLeave={() => setFocus(null)} aria-hidden>
                        {focus === body.key && labels[body.key] && <span className={styles.tag}>{labels[body.key]}</span>}
                        <span className={`${styles.orb} ${body.key === "sun" ? styles.orbSun : ""}`}>
                          {BODY_GLYPHS[body.key] + TEXT}
                          {body.retrograde && <span className={styles.retro}>R</span>}
                        </span>
                        <span className={styles.pin} />
                      </span>
                    </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
