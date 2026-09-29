"use client";

/**
 * The sky dealt in cards, as a scene. A plane of real stars (the ecliptic
 * seen from above its north pole, so the stars share the chart's
 * longitudes) lies tilted away from the viewer, the signs engraved on its
 * ivory rim; the twelve sign cards are dealt round it and lie face up like a
 * spread on a table; the Sun, Moon and Rising cards stand up from it in
 * gold (each rises as it is turned); the planets hover as pearl orbs pinned
 * above their degree; threads join the closest aspects. Rising sign on the
 * left, as charts are drawn; 0° Aries on the left without a birth time.
 *
 * It can be handled: drag to turn the sky (the cards stay upright as they
 * go round); tap a card or a planet to turn it to the front and bring it
 * close, with its reading beside it (arrow keys walk on, Escape steps back);
 * look straight down into the stars; pinch, or use the buttons, to zoom.
 * CSS 3D, no WebGL.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
// The camera, in the scene's 1000-unit space: perspective and its origin, as in scene.module.css
const EYE = { distance: 1700, y: 120 };
const LIFT = { float: 64, card: 212, orb: 58 };
const DRAG = 0.3; // degrees of turn per pixel dragged
const ZOOM = { min: 0.7, max: 2.4 };

export type SceneCard = {
  image: string; href: string; name: string;
  /** The sign's name, its element and mode ("Fire · cardinal"), what it describes, and its house in a chart. */
  sign: string; kind: string; essence: string; house?: string;
};
export type SceneBody = { name: string; title: string; meta: string; essence: string; question?: string };
export type SceneStrings = {
  hint: string; stars: string; cards: string; zoomIn: string; zoomOut: string; whole: string; close: string;
  prev: string; next: string; readCard: string; here: string; empty: string; conversations: string; controls: string;
};

type Props = {
  locale: "en" | "uk";
  bodies: Placement[];
  ascendant: Placement | null;
  midheaven: Placement | null;
  aspects: AspectFound[];
  /** The twelve sign cards, Aries first. */
  signCards: SceneCard[];
  /** Short label per body key, e.g. "Venus in Taurus · 18°47′". */
  labels: Record<string, string>;
  /** What a planet's panel says, per body key (the angles too, for aspects that reach them). */
  bodyInfo: Record<string, SceneBody>;
  aspectNames: Record<string, string>;
  strings: SceneStrings;
  /** Which of the Sun, Moon and Rising cards have been turned (all when omitted). */
  revealed?: string[];
  /** Words for the standing cards' roles, e.g. { sun: "Sun", moon: "Moon", ascendant: "Rising" }. */
  roleNames: Partial<Record<"sun" | "moon" | "ascendant", string>>;
  /** Screen-reader summary of the scene. */
  description: string;
};

type Focus = { kind: "sign"; index: number } | { kind: "body"; key: string } | null;

const wrap = (deg: number) => ((deg % 360) + 360) % 360;
/** The equivalent of `target` nearest to `from`, so the sky turns the short way. */
const nearest = (target: number, from: number) => from + ((((target - from) % 360) + 540) % 360) - 180;
const clampZoom = (z: number) => Math.max(ZOOM.min, Math.min(ZOOM.max, z));

export default function SkyScene(props: Props) {
  const { locale, bodies, ascendant, midheaven, aspects, signCards, labels, bodyInfo, aspectNames, strings, revealed, roleNames, description } = props;
  const uid = useId().replace(/:/g, "");
  const sceneRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const spinRef = useRef(0);
  const zoomRef = useRef(1);
  const fitRef = useRef({ k: 1, shift: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus>(null);
  const [stars, setStars] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [turned, setTurned] = useState(false);
  const [touched, setTouched] = useState(false);
  const [layout, setLayout] = useState(0); // bumped when the fit changes, so the camera re-aims
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });

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
  const focusedSign = focus?.kind === "sign" ? focus.index : null;
  // Looking down into the stars, or at a planet, every card lies down so nothing stands in the way
  const standing = (i: number) => !stars && focus?.kind !== "body" && (roles.has(i) || focusedSign === i);
  const lightKey = hover ?? (focus?.kind === "body" ? focus.key : null);
  const dealFrom = ascendant?.index ?? 0;

  /** Turn the sky; `animate` false while a hand is on it. */
  const turn = useCallback((deg: number, animate: boolean) => {
    spinRef.current = deg;
    sceneRef.current?.toggleAttribute("data-turning", !animate);
    planeRef.current?.style.setProperty("--spin", `${deg.toFixed(2)}deg`);
  }, []);
  /** The turn that brings a longitude to the front of the plane, nearest the current one. */
  const frontSpin = useCallback((longitude: number) => nearest(270 + longitude - start, spinRef.current), [start]);

  const bring = useCallback((next: Focus, trigger?: HTMLElement | null) => {
    if (trigger) triggerRef.current = trigger;
    setTouched(true); setStars(false); setFocus(next);
    if (!next) return;
    const longitude = next.kind === "sign" ? next.index * 30 + 15 : spread[bodies.findIndex((b) => b.key === next.key)];
    turn(frontSpin(longitude), true); setTurned(true);
  }, [bodies, spread, frontSpin, turn]);

  const stepBack = useCallback(() => {
    setFocus(null);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  const whole = () => { setFocus(null); setStars(false); setZoom(1); turn(nearest(0, spinRef.current), true); setTurned(false); };

  const walk = useCallback((step: number) => {
    if (focus?.kind === "sign") bring({ kind: "sign", index: (focus.index + step + 12) % 12 });
    else if (focus?.kind === "body") {
      const at = bodies.findIndex((b) => b.key === focus.key);
      bring({ kind: "body", key: bodies[(at + step + bodies.length) % bodies.length].key });
    }
  }, [focus, bodies, bring]);

  // Keyboard focus follows the panel as it opens and walks on.
  useEffect(() => { if (focus) panelRef.current?.focus({ preventScroll: true }); }, [focus]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Fit the scene: measure the projected bounds of the ring (static markers, measured
  // unturned and without transitions), scale to the width and the viewport's height,
  // then size the scene to what it holds.
  useEffect(() => {
    const scene = sceneRef.current, plane = planeRef.current;
    if (!scene || !plane) return;
    const bounds = () => {
      const rects = [...scene.querySelectorAll<HTMLElement | SVGElement>("[data-bound]")].map((el) => el.getBoundingClientRect());
      return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)), left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)) };
    };
    const fit = () => {
      const turning = scene.hasAttribute("data-turning");
      scene.setAttribute("data-measuring", "");
      plane.style.setProperty("--spin", "0deg");
      scene.style.setProperty("--k", "1");
      scene.style.setProperty("--shift", "0px");
      const whole = bounds();
      const narrow = scene.clientWidth < 760;
      // Fit the width, and the height with room above and below for the controls, so all of it shows at once
      const k = Math.min(1.15, (scene.clientWidth * (narrow ? 1.02 : 0.94)) / (whole.right - whole.left), (window.innerHeight - 170) / (whole.bottom - whole.top));
      scene.style.setProperty("--k", k.toFixed(3));
      const box = scene.getBoundingClientRect(), fitted = bounds();
      const shift = box.top + 84 - fitted.top; // room above for the controls
      scene.style.setProperty("--shift", `${shift.toFixed(1)}px`);
      scene.style.height = `${(fitted.bottom - fitted.top + 84 + 64).toFixed(0)}px`;
      plane.style.setProperty("--spin", `${spinRef.current.toFixed(2)}deg`);
      void getComputedStyle(plane).transform; // settle the turn back before transitions return
      scene.removeAttribute("data-measuring");
      scene.toggleAttribute("data-turning", turning);
      fitRef.current = { k, shift };
      setLayout((n) => n + 1);
    };
    fit();
    const observer = new ResizeObserver(() => requestAnimationFrame(fit));
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  // Aim the camera: at the whole ring, at the card or planet brought to the front, or down into the stars.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const { k, shift } = fitRef.current;
    const style = getComputedStyle(scene);
    const tilt = (parseFloat(style.getPropertyValue("--tilt")) || 58) * DEG;
    const view = { cx: C, cy: (scene.clientHeight / 2 - shift) / k, h: scene.clientHeight / k };
    // Where a point `py` in front of the centre, lifted `lift` towards the viewer, lands on the stage
    const project = (py: number, lift: number) => {
      const y = py * Math.cos(tilt), z = py * Math.sin(tilt), s = EYE.distance / (EYE.distance - z);
      return { y: EYE.y + (C + y - lift - EYE.y) * s, s };
    };
    let target = { x: view.cx, y: view.cy }, z0 = 1;
    if (stars) {
      target = { x: C, y: C };
      z0 = Math.min(1.5, (view.h * 0.94) / (R.ring * 2 + 40));
    } else if (focus) {
      if (focus.kind === "sign") {
        const litScale = parseFloat(style.getPropertyValue("--lit")) || 1.55;
        const height = LIFT.card * litScale;
        const centre = project(R.cards, LIFT.float + height / 2);
        target = { x: C, y: centre.y };
        z0 = Math.min(1.8, (view.h * 0.78) / ((height + LIFT.float) * centre.s));
      } else {
        target = { x: C, y: project(R.planet, LIFT.orb).y - 30 };
        z0 = 1.9;
      }
      if (scene.clientWidth >= 900) view.cx -= Math.min(210, (scene.clientWidth / k) * 0.16); // room for the panel
    }
    const z = Math.max(0.6, Math.min(3, z0 * zoom));
    // Scale about the stage's centre, then move `target` to the middle of what is visible
    setCamera({ x: view.cx - C - z * (target.x - C), y: view.cy - C - z * (target.y - C), z });
  }, [focus, stars, zoom, layout]);

  // Hands on the sky: drag to turn (with a little momentum), pinch to zoom, lean towards the pointer.
  useEffect(() => {
    const scene = sceneRef.current, plane = planeRef.current;
    if (!scene || !plane) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { id: number; x: number; spin: number; moved: boolean; last: number; at: number; v: number } | null = null;
    let pinch: { d: number; zoom: number } | null = null;
    let glide = 0, suppress = false;
    const spacing = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
    const handsOff = (target: EventTarget | null) => target instanceof Element && !!target.closest("[data-hands-off]");

    const settle = () => {
      scene.removeAttribute("data-turning");
      setFocus((current) => {
        if (current?.kind !== "sign") return current;
        // While a sign is close, the turn comes to rest on whichever sign is at the front
        const index = Math.floor(wrap(spinRef.current - 270 + start) / 30) % 12;
        turn(nearest(270 + index * 30 + 15 - start, spinRef.current), true);
        return index === current.index ? current : { kind: "sign", index };
      });
    };
    const down = (event: PointerEvent) => {
      if (handsOff(event.target) || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      cancelAnimationFrame(glide);
      if (pointers.size === 2) { drag = null; pinch = { d: spacing(), zoom: zoomRef.current }; return; }
      drag = { id: event.pointerId, x: event.clientX, spin: spinRef.current, moved: false, last: spinRef.current, at: performance.now(), v: 0 };
    };
    const move = (event: PointerEvent) => {
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch && pointers.size === 2) { setTouched(true); setZoom(clampZoom(pinch.zoom * (spacing() / pinch.d))); return; }
      if (drag && event.pointerId === drag.id) {
        const dx = event.clientX - drag.x;
        if (!drag.moved && Math.abs(dx) > 6) {
          drag.moved = true; setTouched(true); setTurned(true);
          scene.setPointerCapture(event.pointerId);
        }
        if (drag.moved) {
          const now = performance.now(), spin = drag.spin - dx * DRAG;
          drag.v = (spin - drag.last) / Math.max(1, now - drag.at); drag.last = spin; drag.at = now;
          turn(spin, false);
        }
        return;
      }
      if (fine && !reduce && !pointers.size) {
        const box = scene.getBoundingClientRect();
        const nx = (event.clientX - box.left) / box.width - 0.5, ny = (event.clientY - box.top) / box.height - 0.5;
        plane.style.setProperty("--lean-x", `${(-ny * 5).toFixed(2)}deg`);
        plane.style.setProperty("--lean-z", `${(nx * 6).toFixed(2)}deg`);
      }
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
      if (!drag || event.pointerId !== drag.id) return;
      const { moved } = drag;
      let v = drag.v;
      drag = null;
      if (!moved) return;
      suppress = true;
      setTimeout(() => { suppress = false; }, 0);
      if (reduce || Math.abs(v) < 0.02) return settle();
      let last = performance.now();
      const step = (now: number) => {
        const dt = now - last; last = now;
        v *= Math.pow(0.94, dt / 16);
        turn(spinRef.current + v * dt, false);
        if (Math.abs(v) > 0.01) glide = requestAnimationFrame(step); else settle();
      };
      glide = requestAnimationFrame(step);
    };
    // A drag ends with a click on whatever was under it; that click is not a choice.
    const click = (event: MouseEvent) => { if (suppress) { event.stopPropagation(); event.preventDefault(); suppress = false; } };
    const wheel = (event: WheelEvent) => {
      // Trackpad pinches arrive as wheel events with the control key; ordinary scrolling is left alone
      if (!event.ctrlKey) return;
      event.preventDefault();
      setTouched(true);
      setZoom((z) => clampZoom(z * Math.exp(-event.deltaY * 0.01)));
    };
    const leave = () => { plane.style.setProperty("--lean-x", "0deg"); plane.style.setProperty("--lean-z", "0deg"); };
    scene.addEventListener("pointerdown", down);
    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerup", up);
    scene.addEventListener("pointercancel", up);
    scene.addEventListener("pointerleave", leave);
    scene.addEventListener("click", click, true);
    scene.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cancelAnimationFrame(glide);
      scene.removeEventListener("pointerdown", down);
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerup", up);
      scene.removeEventListener("pointercancel", up);
      scene.removeEventListener("pointerleave", leave);
      scene.removeEventListener("click", click, true);
      scene.removeEventListener("wheel", wheel);
    };
  }, [start, turn]);

  const onKey = (event: React.KeyboardEvent) => {
    if (!focus) return;
    if (event.key === "Escape") { event.preventDefault(); stepBack(); }
    else if (event.key === "ArrowRight") { event.preventDefault(); walk(1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); walk(-1); }
  };

  const place = (p: { x: number; y: number }) => ({ left: `${f(p.x)}px`, top: `${f(p.y)}px` });
  const glyph = (key: string) => (BODY_GLYPHS as Record<string, string>)[key] + TEXT;
  const onScene = (key: string) => bodies.some((b) => b.key === key);

  const cardLink = (card: SceneCard) => (
    <a href={card.href} className={styles.panelCard}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static card art */}
      <img src={card.image} alt="" width={256} height={439} />
      <span><span className={styles.panelLabel}>{strings.readCard}</span>{card.name}</span>
    </a>
  );

  let panel: React.ReactNode = null;
  if (focus?.kind === "sign") {
    const card = signCards[focus.index];
    const here = bodies.filter((b) => b.index === focus.index);
    panel = (
      <>
        <p className={styles.panelKicker}>{card.kind}{card.house ? ` · ${card.house}` : ""}</p>
        <h3 ref={panelRef} tabIndex={-1} className={styles.panelTitle}><span aria-hidden>{SIGN_GLYPHS[focus.index] + TEXT} </span>{card.sign}</h3>
        <p className={styles.panelText}>{card.essence}</p>
        <p className={styles.panelLabel}>{strings.here}</p>
        {here.length ? (
          <ul className={styles.panelList}>
            {here.map((b) => <li key={b.key}><button type="button" onClick={() => bring({ kind: "body", key: b.key })}><span aria-hidden>{glyph(b.key)}</span> {labels[b.key]}</button></li>)}
          </ul>
        ) : <p className={styles.panelQuiet}>{strings.empty}</p>}
        {cardLink(card)}
      </>
    );
  } else if (focus?.kind === "body") {
    const info = bodyInfo[focus.key], body = byKey.get(focus.key);
    const talk = aspects.filter((found) => found.a === focus.key || found.b === focus.key).slice(0, 5)
      .map((found) => { const other = found.a === focus.key ? found.b : found.a; return { key: other, text: `${aspectNames[found.aspect] ?? found.aspect} · ${bodyInfo[other]?.name ?? other}` }; });
    panel = (
      <>
        <p className={styles.panelKicker}>{info?.meta}</p>
        <h3 ref={panelRef} tabIndex={-1} className={styles.panelTitle}><span aria-hidden>{glyph(focus.key)} </span>{info?.title}</h3>
        <p className={styles.panelText}>{info?.essence}</p>
        {info?.question && <p className={styles.panelQuestion}>{info.question}</p>}
        {talk.length > 0 && (
          <>
            <p className={styles.panelLabel}>{strings.conversations}</p>
            <ul className={styles.panelList}>
              {talk.map((t) => (
                <li key={t.key}>{onScene(t.key)
                  ? <button type="button" onClick={() => bring({ kind: "body", key: t.key })}><span aria-hidden>{glyph(t.key)}</span> {t.text}</button>
                  : <span><span aria-hidden>{glyph(t.key)}</span> {t.text}</span>}</li>
              ))}
            </ul>
          </>
        )}
        {body && cardLink(signCards[body.index])}
      </>
    );
  }

  return (
    <div className={styles.wrap} onKeyDown={onKey}>
      <div className={styles.scene} ref={sceneRef} data-light={lightKey ? "" : undefined} data-view={stars ? "stars" : undefined}
        data-close={focus ? "" : undefined} data-touched={touched ? "" : undefined}>
        <div className={styles.silk} aria-hidden><span /><span /><span /></div>
        <p className={styles.srOnly}>{description}</p>
        <div className={styles.fit}>
          <div className={styles.camera} style={{ transform: `translate(${f(camera.x)}px, ${f(camera.y)}px) scale(${camera.z.toFixed(3)})` }}>
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
                      const on = !lightKey || found.a === lightKey || found.b === lightKey;
                      return <line key={`${found.a}-${found.b}`} x1={f(p.x)} y1={f(p.y)} x2={f(q.x)} y2={f(q.y)} pathLength={1}
                        className={`${HARMONIOUS.has(found.aspect) ? styles.threadEase : styles.threadTension} ${on ? "" : styles.dim}`} style={{ animationDelay: `${1.8 + i * 0.08}s` }} />;
                    })}
                  </g>
                </svg>

                {/* Engraved on the plane: the signs on the ivory rim, AC and MC inside it, and the constellations'
                    names for when one looks down into the stars. HTML rather than SVG text, which Chrome can
                    paint out of place inside a 3D-transformed layer. Each stays upright as the sky turns. */}
                {SIGN_GLYPHS.map((sign, i) => <span key={sign} className={styles.engraved} style={place(point(i * 30 + 15, R.glyphs))} aria-hidden>{sign + TEXT}</span>)}
                {ascendant && midheaven && [ascendant, midheaven].map((angle) => (
                  <span key={`mark-${angle.key}`} className={styles.angleMark} style={place(point(angle.longitude, R.sky - 22))} aria-hidden>{angle.key === "ascendant" ? "AC" : "MC"}</span>
                ))}
                {field.names.filter((n) => n.lat > 6).map((n) => (
                  <span key={n.en} className={styles.starName} style={place(skyPoint(n.lon, n.lat))} aria-hidden>{locale === "uk" ? n.uk : n.en}</span>
                ))}

                {/* Invisible, unanimated stand-ins for the cards, lying and standing at every place (the sky
                    turns, and any card may stand at the front): what the scene measures to fit itself */}
                {signCards.map((_, i) => (
                  <span key={`bound-${i}`} className={styles.slot} style={place(point(i * 30 + 15, R.cards))} aria-hidden>
                    <span className={`${styles.hinge} ${styles.lie} ${styles.still}`}><span className={styles.cardBound} data-bound /></span>
                    <span className={`${styles.hinge} ${styles.rise} ${styles.still}`}><span className={styles.cardBoundTall} data-bound /></span>
                  </span>
                ))}

                {/* Shadows the standing cards cast on the plane */}
                {signCards.map((_, i) => (
                  <span key={`shadow-${i}`} className={`${styles.shadow} ${standing(i) ? styles.shadowLit : ""}`} style={place(point(i * 30 + 15, R.cards))} aria-hidden />
                ))}

                {/* The twelve sign cards, dealt from the centre: face up on the plane, or standing when lit or brought close */}
                {signCards.map((card, i) => {
                  const at = point(i * 30 + 15, R.cards);
                  const role = roles.get(i) ?? (focusedSign === i ? [`${SIGN_GLYPHS[i]}${TEXT} ${card.sign}`] : undefined);
                  const order = (i - dealFrom + 12) % 12;
                  return (
                    <span key={card.href} className={`${styles.slot} ${styles.dealt}`}
                      style={{ ...place(at), ["--dx" as string]: `${f(C - at.x)}px`, ["--dy" as string]: `${f(C - at.y)}px`, ["--delay" as string]: `${0.2 + order * 0.11}s` }}>
                      <span className={`${styles.hinge} ${standing(i) ? styles.rise : styles.lie}`}>
                        <button type="button" className={`${styles.card} ${standing(i) ? styles.cardLit : ""}`}
                          aria-label={`${card.sign}: ${card.name}`} aria-pressed={focusedSign === i}
                          onClick={(event) => bring({ kind: "sign", index: i }, event.currentTarget)}>
                          {role && standing(i) && <span className={styles.role}>{role.join(" · ")}</span>}
                          <span className={styles.art}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- static card art */}
                            <img src={card.image} alt="" width={256} height={439} draggable={false} />
                          </span>
                        </button>
                      </span>
                    </span>
                  );
                })}

                {/* Planets: pearl orbs (the Sun gold) pinned above their degree. Pointer-only: the same
                    readings are reachable from each sign's panel and from the list beside the scene. */}
                {bodies.map((body, i) => {
                  const at = point(spread[i], R.planet);
                  return (
                    <span key={body.key} className={styles.slot} style={{ ...place(at), ["--delay" as string]: `${1.5 + i * 0.06}s` }}>
                      <span className={styles.stand}>
                        <span className={`${styles.orbWrap} ${lightKey === body.key ? styles.orbFocus : ""}`} aria-hidden
                          onPointerEnter={() => setHover(body.key)} onPointerLeave={() => setHover(null)}
                          onClick={(event) => bring({ kind: "body", key: body.key }, event.currentTarget)}>
                          {hover === body.key && !focus && labels[body.key] && <span className={styles.tag}>{labels[body.key]}</span>}
                          <span className={`${styles.orb} ${body.key === "sun" ? styles.orbSun : ""}`}>
                            {glyph(body.key)}
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

        <div className={styles.controls} role="toolbar" aria-label={strings.controls} data-hands-off>
          <button type="button" className={styles.control} aria-pressed={stars} onClick={() => { setTouched(true); setFocus(null); setStars((on) => !on); }}>{stars ? strings.cards : strings.stars}</button>
          <button type="button" className={`${styles.control} ${styles.round}`} aria-label={strings.zoomOut} onClick={() => { setTouched(true); setZoom((z) => clampZoom(z / 1.25)); }}>−</button>
          <button type="button" className={`${styles.control} ${styles.round}`} aria-label={strings.zoomIn} onClick={() => { setTouched(true); setZoom((z) => clampZoom(z * 1.25)); }}>+</button>
          {(focus || stars || turned || zoom !== 1) && <button type="button" className={styles.control} onClick={whole}>{strings.whole}</button>}
        </div>
        <p className={styles.hint} aria-hidden>{strings.hint}</p>
      </div>

      {focus && (
        <section className={styles.panel} aria-live="polite" data-hands-off>
          <div className={styles.panelNav}>
            <button type="button" className={`${styles.control} ${styles.round}`} aria-label={strings.prev} onClick={() => walk(-1)}>←</button>
            <button type="button" className={`${styles.control} ${styles.round}`} aria-label={strings.next} onClick={() => walk(1)}>→</button>
            <button type="button" className={`${styles.control} ${styles.round}`} aria-label={strings.close} onClick={stepBack}>×</button>
          </div>
          {panel}
        </section>
      )}
    </div>
  );
}
