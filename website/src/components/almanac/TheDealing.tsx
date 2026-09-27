"use client";

/**
 * TheDealing — Fig. 1, dealt from the whole deck.
 *
 * The plate opens on one squared block of twenty-two. As it crosses the
 * reader, the block deals itself out along the ecliptic and every Major
 * Arcanum takes the station its correspondence gives it: the twelve sign
 * cards at their 30° houses, the ten planet cards at the longitude that
 * body actually holds tonight. A planet in retrograde lays its card down
 * inverted. The band is then ruled like any other plate in the almanac,
 * and three leaves are drawn out of it onto the table — PAST · NOW · NEXT
 * — which is where the reading begins.
 *
 * Nothing here is decorative: the arrangement is the site's own ephemeris,
 * so the figure is different tonight than it was last night, and no other
 * deck can borrow it.
 *
 *   act a = 0.00 … 0.12   THE BLOCK     the squared deck, read on its edges
 *           0.12 … 0.58   THE DEALING   zodiacal sweep from 0° Aries
 *           0.58 … 0.78   THE PLATE     the band is ruled and named
 *           0.78 … 1.00   THE THREE     three leaves come to the table
 *
 * `a` is driven by the figure's own crossing of the viewport — no pin, no
 * added page height — and holds at 1 once the plate is centred, so the
 * resting frame is the one the reader actually stops on.
 *
 * One WebGL1 context, one program, 22 painter-sorted quads, no depth
 * buffer, no library. The card back is drawn in the shader rather than
 * sampled, so it stays sharp at every distance and costs nothing. Without
 * WebGL — or under prefers-reduced-motion — the proven DOM stage renders
 * instead.
 */

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SpreadTheater from "./SpreadTheater";
import { getAllPositions } from "@/lib/celestial";

/* ── the concordance ──────────────────────────────────────────────
   Each Major Arcanum answers to exactly one sign or one body, and the
   set closes: twelve signs plus ten bodies is twenty-two, with nothing
   repeated and nothing left over. Card order is deck order; `sign` is
   the 0-based sign index for the twelve, `body` the ephemeris name for
   the ten. Mirrors MAJOR_ARCANA[].astrology in lib/academy/tarot-cards. */
type Station = { n: string; sign?: number; body?: string };
const CONCORDANCE: Station[] = [
  { n: "The Fool", body: "Uranus" },
  { n: "The Magician", body: "Mercury" },
  { n: "The High Priestess", body: "Moon" },
  { n: "The Empress", body: "Venus" },
  { n: "The Emperor", sign: 0 },
  { n: "The Hierophant", sign: 1 },
  { n: "The Lovers", sign: 2 },
  { n: "The Chariot", sign: 3 },
  { n: "Strength", sign: 4 },
  { n: "The Hermit", sign: 5 },
  { n: "Wheel of Fortune", body: "Jupiter" },
  { n: "Justice", sign: 6 },
  { n: "The Hanged Man", body: "Neptune" },
  { n: "Death", sign: 7 },
  { n: "Temperance", sign: 8 },
  { n: "The Devil", sign: 9 },
  { n: "The Tower", body: "Mars" },
  { n: "The Star", sign: 10 },
  { n: "The Moon", sign: 11 },
  { n: "The Sun", body: "Sun" },
  { n: "Judgement", body: "Pluto" },
  { n: "The World", body: "Saturn" },
];

const SIGN_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_NAME = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const ATLAS = "/deck/majors-q80.webp";
const A_COLS = 8, A_ROWS = 4;      // 2048 x 2048, cells of 256 x 512
const CARD_V = 439 / 512;          // the card occupies the cell's top 439px

const LABELS = ["Past", "Now", "Next"] as const;

/* ── small maths ──────────────────────────────────────────────── */
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (x: number) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const ramp = (a: number, b: number, x: number) => ease((x - a) / (b - a));
/** Quintic — flat at both ends, so a leaf never jerks off its station. */
const quint = (x: number) => { const c = clamp(x); return c * c * c * (c * (c * 6 - 15) + 10); };
const RAD = Math.PI / 180;

type M4 = Float32Array;
function mulM4(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = s;
  }
  return o;
}
function perspM4(fov: number, asp: number, n: number, f: number): M4 {
  const t = 1 / Math.tan(fov / 2);
  return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
}
/**
 * Right-handed look-at with up = +Y. Returns the view matrix and keeps its
 * third basis row to hand, so the painter's sort can read view-space depth
 * without multiplying a whole matrix per card.
 */
function viewM4(eye: number[], at: number[]): { m: M4; fwd: number[]; eye: number[] } {
  let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
  const zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
  // x = normalize(cross(up, z)) with up = (0,1,0)
  let xx = zz, xy = 0, xz = -zx;
  const xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
  // y = cross(z, x)
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return {
    m: new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
    ]),
    fwd: [zx, zy, zz],
    eye,
  };
}
/** Model matrix: translate · rotateY · rotateX · rotateZ · scale. */
function modelM4(p: number[], rx: number, ry: number, rz: number, s: number): M4 {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  const m00 = cy * cz + sy * sx * sz, m01 = cx * sz, m02 = -sy * cz + cy * sx * sz;
  const m10 = -cy * sz + sy * sx * cz, m11 = cx * cz, m12 = sy * sz + cy * sx * cz;
  const m20 = sy * cx, m21 = -sx, m22 = cy * cx;
  return new Float32Array([
    m00 * s, m01 * s, m02 * s, 0,
    m10 * s, m11 * s, m12 * s, 0,
    m20 * s, m21 * s, m22 * s, 0,
    p[0], p[1], p[2], 1,
  ]);
}

/* ── the band ─────────────────────────────────────────────────────
   The ecliptic is drawn as a ring seen from just above its plane, so it
   reads as a band receding into the plate rather than as a wheel laid
   flat — the same low view the sky rooms take of the horizon. */
const RING_R = 4.35;
const RING_TILT = 62 * RAD;        // how far the ring's plane is laid over
const CARD_HALF_W = 0.60;
const CARD_HALF_H = CARD_HALF_W * 1536 / 896;

/** World position of ecliptic longitude λ (degrees), on the ring. */
function station(lambda: number): number[] {
  const t = (lambda - 90) * RAD;   // 0° Aries to the back of the ring
  return [Math.sin(t) * RING_R, -Math.cos(t) * RING_R * Math.cos(RING_TILT),
          -Math.cos(t) * RING_R * Math.sin(RING_TILT)];
}

const VERT = `
attribute vec2 aQuad;
uniform mat4 uMVP;
uniform vec4 uUV;
uniform vec2 uHalf;
varying vec2 vUv;
varying vec2 vTile;
void main() {
  gl_Position = uMVP * vec4(aQuad * uHalf, 0.0, 1.0);
  vUv = aQuad * 0.5 + 0.5;
  vTile = uUV.xy + vec2(vUv.x, 1.0 - vUv.y) * uUV.zw;
}`;

const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 vUv;
varying vec2 vTile;
uniform sampler2D uAtlas;
uniform float uFace;    // 1 = the deck's own art, 0 = the almanac's back
uniform float uDim;     // recession: ink thinned toward the ground, never alpha
uniform float uEdge;    // the ruled hairline around the leaf
uniform float uGilt;    // this station carries the gilt tick (the Sun)
uniform vec2  uKey;     // the moon, in card space

const vec3 ABYSS = vec3(0.039, 0.051, 0.220);
const vec3 MIST  = vec3(0.718, 0.737, 0.914);
const vec3 GILT  = vec3(0.878, 0.718, 0.408);
const vec3 MOON  = vec3(0.910, 0.914, 1.000);

float box(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }

void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float d = box(q, vec2(0.985) - 0.055) - 0.055;
  float inside = 1.0 - smoothstep(-0.006, 0.006, d);
  if (inside < 0.002) discard;

  /* THE BACK — the almanac's own plate, drawn at the SVG's own 130x225
     so it matches the DOM card exactly and stays sharp at any distance. */
  vec2 s = vec2((q.x * 0.5 + 0.5) * 130.0, (0.5 - q.y * 0.5) * 225.0);
  float px = max(fwidth(s.x), 0.35) * 0.8;
  float rad = length((s - vec2(65.0, 85.5)) / vec2(110.5, 191.25));
  vec3 back = mix(vec3(0.094, 0.114, 0.478),
              mix(vec3(0.063, 0.075, 0.302), ABYSS, smoothstep(0.55, 1.0, rad)),
                  smoothstep(0.0, 0.55, rad));
  for (int k = 0; k < 30; k++) {
    float fi = float(k), t = fi / 29.0;
    vec2 fp = vec2(14.0 + t * 102.0 + sin(fi * 2.7) * 7.0,
                   210.0 - t * 196.0 + cos(fi * 1.9) * 5.0);
    float fr = 0.4 + mod(fi * 37.0, 10.0) / 14.0;
    back += MIST * 0.5 * (0.14 + mod(fi * 53.0, 10.0) / 22.0)
          * (1.0 - smoothstep(fr - px, fr + px, distance(s, fp)));
  }
  back += GILT * 0.80 * (1.0 - smoothstep(0.9 - px, 0.9 + px, distance(s, vec2(24.0, 30.0))));
  back += GILT * 0.65 * (1.0 - smoothstep(0.7 - px, 0.7 + px, distance(s, vec2(104.0, 48.0))));
  back += GILT * 0.60 * (1.0 - smoothstep(0.7 - px, 0.7 + px, distance(s, vec2(36.0, 188.0))));
  back += GILT * 0.75 * (1.0 - smoothstep(0.9 - px, 0.9 + px, distance(s, vec2(98.0, 170.0))));
  back += GILT * 0.55 * (1.0 - smoothstep(0.6 - px, 0.6 + px, distance(s, vec2(65.0, 52.0))));
  vec2 c = s - vec2(65.0, 112.5);
  back += MIST * 0.50 * (1.0 - smoothstep(0.5 - px, 0.5 + px, abs(box(c, vec2(60.0, 107.5) - 9.0) - 9.0)));
  back += MIST * 0.22 * (1.0 - smoothstep(0.375 - px, 0.375 + px, abs(box(c, vec2(54.0, 101.5) - 6.0) - 6.0)));
  for (int ax = 0; ax < 2; ax++) for (int ay = 0; ay < 2; ay++) {
    vec2 o = abs(s - vec2(25.0 + float(ax) * 80.0, 25.0 + float(ay) * 175.0));
    float arm = min(max(o.x - 0.375, o.y - 4.0), max(o.y - 0.375, o.x - 4.0));
    back += MIST * 0.55 * (1.0 - smoothstep(-px, px, arm));
  }
  float rc = distance(s, vec2(65.0, 112.5));
  float ang = atan(s.y - 112.5, s.x - 65.0);
  back += MIST * 0.60 * (1.0 - smoothstep(0.45 - px, 0.45 + px, abs(rc - 27.0)));
  back += MIST * 0.30 * step(0.0, sin(ang * 38.0))
        * (1.0 - smoothstep(0.375 - px, 0.375 + px, abs(rc - 19.0)));
  float ray = abs(mod(ang + 0.3926991, 0.7853982) - 0.3926991) * rc;
  back += MIST * 0.70 * (1.0 - smoothstep(0.45 - px, 0.45 + px, ray))
        * step(11.0, rc) * (1.0 - step(25.0, rc));
  back += GILT * 0.95 * (1.0 - smoothstep(3.4 - px, 3.4 + px, rc));
  back += GILT * 0.50 * (1.0 - smoothstep(0.3 - px, 0.3 + px, abs(rc - 6.5)));

  vec3 col = mix(back, texture2D(uAtlas, vTile).rgb, uFace);

  // the leaf catches the moon
  col += MOON * pow(clamp(dot(normalize(vec3(q * 0.35 - uKey, 1.0)),
                              vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.4) * 0.11;

  // the printed edge: ink gathers, then one ruled hairline
  col = mix(col, col * 0.44, smoothstep(-0.075, -0.010, d) * 0.85);
  float rim = 1.0 - smoothstep(0.0, 0.020, abs(d + 0.010));
  col += mix(MIST, GILT, 0.25 + 0.65 * uGilt) * rim * uEdge;

  // depth is ink density, never alpha — the leaf thins toward the ground
  col = mix(col, ABYSS, uDim);
  gl_FragColor = vec4(col, inside);
}`;

type Props = { href?: string; label?: string; locale?: string };

export default function TheDealing({ href = "/oracle", label = "Begin a reading", locale = "en" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // `mode` is resolved on the client only: the server has no way to know
  // whether this reader has WebGL or has asked for stillness.
  const [mode, setMode] = useState<"pending" | "gl" | "dom">("pending");
  const [chip, setChip] = useState("");

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => {
      if (reduced.matches) { setMode("dom"); return; }
      try {
        const probe = document.createElement("canvas");
        setMode(probe.getContext("webgl") ? "gl" : "dom");
      } catch { setMode("dom"); }
    };
    decide();
    reduced.addEventListener("change", decide);
    return () => reduced.removeEventListener("change", decide);
  }, []);

  useEffect(() => {
    if (mode !== "gl") return;
    const root = rootRef.current;
    if (!root) return;
    const canvas = root.querySelector<HTMLCanvasElement>(".td-canvas")!;
    const stage = root.querySelector<HTMLElement>(".td-stage")!;

    /* ── tonight's ephemeris fixes every station ─────────────────
       Read once: the act is a plate of this evening, not a live clock. */
    const now = new Date();
    const bodies = getAllPositions(now);
    const byName = new Map(bodies.map(b => [b.name, b]));
    const sun = byName.get("Sun")!;
    const stations = CONCORDANCE.map((s, i) => {
      const b = s.body ? byName.get(s.body) : undefined;
      // The twelve sign cards stand at the middle of their house; the ten
      // bodies stand exactly where they are tonight.
      const lambda = b ? b.longitude : (s.sign ?? 0) * 30 + 15;
      return { i, lambda, retro: !!b?.retrograde, gilt: s.body === "Sun", name: s.n };
    });
    // Dealt in zodiacal order — the ring fills as the sky runs, not as the
    // deck is numbered.
    const order = stations.slice().sort((a, b) => a.lambda - b.lambda).map(s => s.i);
    const dealSlot = new Array<number>(22);
    order.forEach((cardIndex, slot) => { dealSlot[cardIndex] = slot; });

    const deg = Math.floor(sun.longitude % 30);
    const min = Math.floor(((sun.longitude % 30) - deg) * 60);
    const retros = bodies.filter(b => b.retrograde).map(b => b.glyph);
    setChip(locale === "uk"
      ? `Двадцять два аркани за відповідністю · ☉ ${deg}°${String(min).padStart(2, "0")}′ ${SIGN_NAME[Math.floor(sun.longitude / 30)]}${retros.length ? ` · ${retros.join(" ")} R` : ""}`
      : `Twenty-two arcana at their correspondence · ☉ ${deg}°${String(min).padStart(2, "0")}′ ${SIGN_NAME[Math.floor(sun.longitude / 30)]}${retros.length ? ` · ${retros.join(" ")} retrograde` : ""}`);

    /* The three that come to the table: the almanac's own choice for the
       day, so the same reader sees the same hand all evening. */
    const dayOfYear = Math.floor((now.getTime() - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    const hand: number[] = [];
    for (let k = 0; hand.length < 3; k++) {
      const pick = (dayOfYear * 7 + k * 9 + 1) % 22;
      if (!hand.includes(pick)) hand.push(pick);
    }
    const handSlot = new Map(hand.map((cardIndex, k) => [cardIndex, k]));

    let gl: WebGLRenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let u: Record<string, WebGLUniformLocation | null> = {};
    let ready = false, inView = true, raf = 0, last = 0, elapsed = 0;
    let av = 0, aTarget = 0;                    // the act's progress, smoothed
    let ptrX = 0, ptrY = 0, ptrTX = 0, ptrTY = 0;
    let hover = 0, hoverT = 0, diveAt = 0;
    let dpr = 1, quality = 1, slow = 0, frames = 0;
    let debug = false;
    const D: Array<() => void> = [];
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ── the runway ───────────────────────────────────────────────
       The act is scrubbed by the figure's own crossing and reaches 1 as
       the plate centres, which is where a reader stops. No pin, so the
       page keeps the height it already has. */
    function onScroll() {
      if (debug) return;
      const r = stage.getBoundingClientRect();
      const vh = innerHeight || 1;
      const centred = (vh - r.height) / 2;
      const span = Math.max(1, vh - centred);
      aTarget = clamp((vh - r.top) / span);
      start();
    }

    const visible = () => inView && !document.hidden;
    function start() { if (!raf && ready && visible()) raf = requestAnimationFrame(tick); }

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src); gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw Error(gl!.getShaderInfoLog(s) || "deal shader");
      return s;
    }

    function resize() {
      if (!gl) return;
      // The backing store is measured undrifted: .plate-figure is rotated
      // and skewed every frame by the page's drift rig, so a client rect
      // would hand us a sheared box.
      const w = stage.offsetWidth || 1, h = stage.offsetHeight || 1;
      dpr = Math.min(devicePixelRatio || 1, innerWidth <= 700 ? 1.5 : 2) * quality;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function paint() {
      if (!gl) return;
      const a = av;
      const asp = (canvas.width || 1) / (canvas.height || 1);
      gl.clearColor(0.039, 0.051, 0.220, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      /* THE CAMERA — one continuous move, eased only at the two ends, so
         it never comes to a stop in the middle the way the reference does.
         It lifts a little off the ring's plane as the band opens, then
         settles back down onto the table for the hand. */
      const cam = quint(a);
      const lift = Math.sin(clamp(a / 0.82) * Math.PI);
      const eyeY = mix(0.55, 1.05, cam) + lift * 0.55 + ptrY * -0.16;
      const eyeZ = mix(7.4, 6.5, cam) - lift * 0.5;
      const eye = [ptrX * 0.34, eyeY, eyeZ];
      const at = [ptrX * 0.10, mix(0.25, -0.18, cam) + lift * 0.30, mix(-0.4, -1.5, cam)];
      const V = viewM4(eye, at);
      const VP = mulM4(perspM4(0.60, asp, 0.1, 60), V.m);

      // the ring turns slowly through the whole act — nothing ever parks
      const spin = mix(0, 26, cam) * RAD + elapsed * 0.012;

      type Drawn = { m: M4; uv: number[]; face: number; dim: number; edge: number; gilt: number; key: number[]; z: number };
      const drawn: Drawn[] = [];

      for (let i = 0; i < 22; i++) {
        const st = stations[i];
        const slot = dealSlot[i];
        const handIdx = handSlot.get(i);

        /* THE BLOCK — every leaf squared into one deck, read on its edges. */
        const bz = (slot - 10.5) * 0.013;
        const blockP = [-0.05 + bz * 0.30, 0.02 + bz * 0.06, 0.55 - slot * 0.017];

        /* THE DEALING — a zodiacal sweep: each leaf leaves the block on its
           own beat, rises clear, and settles onto its station. */
        const t0 = 0.12 + (slot / 21) * 0.34;
        const fl = quint(ramp(t0, t0 + 0.13, a));
        const arc = Math.sin(clamp((a - t0) / 0.13) * Math.PI);

        const sp = station(st.lambda + spin / RAD);
        const face = st.lambda * RAD;             // the leaf faces out of the ring
        const standP = [sp[0], sp[1] + 0.62, sp[2]];

        let p = [mix(blockP[0], standP[0], fl), mix(blockP[1], standP[1], fl) + arc * 0.95,
                 mix(blockP[2], standP[2], fl)];
        let rx = mix(-0.40, -0.13, fl);
        let ry = mix(0.26, Math.PI - face - spin, fl);
        // a retrograde body lays its card down inverted — the almanac's
        // own notation, carried onto the table
        let rz = mix(0.05, st.retro ? Math.PI : 0, fl) + arc * 0.22;
        let sc = mix(1.0, 0.46, fl);
        let faceUp = ramp(t0 + 0.05, t0 + 0.12, a);

        /* THE THREE — three leaves are drawn off the band onto the table,
           face down, exactly where the reading expects them. */
        if (handIdx !== undefined) {
          const h = quint(ramp(0.80 + handIdx * 0.035, 0.94 + handIdx * 0.035, a));
          const hArc = Math.sin(clamp((a - 0.80 - handIdx * 0.035) / 0.14) * Math.PI);
          const k = handIdx - 1;
          const near = hover > 0.02 && Math.abs(ptrTX * 1.4 - k) < 0.5;
          const tp = [k * 1.32 + hover * k * 0.10, -0.30 + Math.abs(k) * 0.05 + (near ? 0.14 : 0),
                      2.55 + (near ? 0.22 : 0)];
          p = [mix(p[0], tp[0], h), mix(p[1], tp[1], h) + hArc * 0.70, mix(p[2], tp[2], h)];
          rx = mix(rx, -0.07 + ptrY * 0.10 * hover, h);
          ry = mix(ry, ptrX * 0.16 * hover, h);
          rz = mix(rz, k * 0.115, h);
          sc = mix(sc, 0.92, h);
          faceUp = mix(faceUp, 0, quint(ramp(0.80, 0.90, a)));   // laid face down
        }

        if (diveAt) {
          const dt = quint(clamp((elapsed - diveAt) / 0.52));
          p = [mix(p[0], p[0] * 0.34, dt), mix(p[1], p[1] + 0.22, dt), mix(p[2], p[2] + 3.6, dt)];
          sc = mix(sc, sc * 1.2, dt);
        }

        // per-leaf breath, phased by the station it holds — no lockstep
        const ph = st.lambda * 0.0175;
        p[1] += Math.sin(elapsed * 0.32 + ph) * 0.014 * fl;
        rz += Math.sin(elapsed * 0.21 + ph * 1.7) * 0.009 * fl;

        const mvp = mulM4(VP, modelM4(p, rx, ry, rz, sc));
        // Distance along the view axis: the painter's sort is exact here
        // because the leaves are planar and never intersect.
        const z = (p[0] - V.eye[0]) * V.fwd[0] + (p[1] - V.eye[1]) * V.fwd[1] + (p[2] - V.eye[2]) * V.fwd[2];

        drawn.push({
          m: mvp,
          uv: [(i % A_COLS) / A_COLS, Math.floor(i / A_COLS) / A_ROWS, 1 / A_COLS, CARD_V / A_ROWS],
          face: faceUp,
          // the band thins into the ground behind; the hand never does
          dim: clamp((handIdx !== undefined ? 0 : 1) * clamp((-p[2] - 1.0) * 0.085) + (handIdx !== undefined ? 0 : ramp(0.86, 1.0, a) * 0.42)),
          edge: mix(0.30, 0.62, fl),
          gilt: st.gilt ? ramp(t0 + 0.06, t0 + 0.16, a) * (1 - ramp(0.86, 1.0, a) * 0.6) : 0,
          key: [ptrX * 0.10, ptrY * 0.08],
          z,
        });
      }

      drawn.sort((x, y) => x.z - y.z);
      for (const c of drawn) {
        gl.uniformMatrix4fv(u.uMVP, false, c.m);
        gl.uniform4f(u.uUV, c.uv[0], c.uv[1], c.uv[2], c.uv[3]);
        gl.uniform2f(u.uHalf, CARD_HALF_W, CARD_HALF_H);
        gl.uniform1f(u.uFace, c.face);
        gl.uniform1f(u.uDim, c.dim);
        gl.uniform1f(u.uEdge, c.edge);
        gl.uniform1f(u.uGilt, c.gilt);
        gl.uniform2f(u.uKey, c.key[0], c.key[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // the DOM furniture rides the same clock
      stage.style.setProperty("--td-a", a.toFixed(3));
      stage.style.setProperty("--td-hand", ramp(0.88, 1.0, a).toFixed(3));
      stage.style.setProperty("--td-plate", (ramp(0.56, 0.68, a) * (1 - ramp(0.80, 0.90, a))).toFixed(3));
    }

    function tick(nowMs: number) {
      raf = 0;
      if (!ready || !visible()) return;
      const dt = last ? Math.min((nowMs - last) / 1000, 0.05) : 1 / 60;
      last = nowMs;
      elapsed += dt;
      const k = 1 - Math.exp(-dt * 8);
      av += (aTarget - av) * k;
      if (Math.abs(aTarget - av) < 0.00004) av = aTarget;
      hover += (hoverT - hover) * (1 - Math.exp(-dt * 6));
      ptrX += (ptrTX - ptrX) * (1 - Math.exp(-dt * 5));
      ptrY += (ptrTY - ptrY) * (1 - Math.exp(-dt * 5));
      paint();
      // a short governor: eight heavy frames in twenty and the plate drops
      // resolution once, rather than limping for seconds first
      if (++frames > 20) {
        if (dt > 0.026) slow++; else slow = Math.max(0, slow - 1);
        if (slow > 8 && quality > 1 - 0.5) { quality -= 0.25; slow = 0; frames = 0; resize(); }
      }
      start();
    }

    function initialize() {
      gl = canvas.getContext("webgl", { alpha: false, antialias: true, depth: false, powerPreference: "low-power" });
      if (!gl) { setMode("dom"); return; }
      gl.getExtension("OES_standard_derivatives");
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(prog) || "deal link");
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aQuad = gl.getAttribLocation(prog, "aQuad");
      gl.enableVertexAttribArray(aQuad);
      gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);
      u = Object.fromEntries(["uMVP", "uUV", "uHalf", "uFace", "uDim", "uEdge", "uGilt", "uKey", "uAtlas"]
        .map(n => [n, gl!.getUniformLocation(prog!, n)]));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (!gl) return;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        gl.uniform1i(u.uAtlas, 0);
        ready = true;
        resize();
        stage.classList.add("is-ready");
        onScroll();
        start();
      };
      img.onerror = () => setMode("dom");
      img.src = ATLAS;
    }

    try { initialize(); } catch { setMode("dom"); return; }

    /* screenshot hook, as the hero has: #deal=0.62 pins the act */
    const pin = location.hash.match(/(?:^#|&)deal=([\d.]+)/);
    if (pin) { debug = true; aTarget = av = clamp(parseFloat(pin[1])); }

    const dive = (e?: Event) => {
      if (diveAt) return;
      e?.preventDefault();
      diveAt = elapsed;
      stage.classList.add("is-diving");
      setTimeout(() => window.dispatchEvent(new CustomEvent("page:transition", { detail: { href } })), 430);
    };
    const onAbort = () => { diveAt = 0; stage.classList.remove("is-diving"); };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      ptrTX = clamp((e.clientX - r.left) / r.width, 0, 1) * 2 - 1;
      ptrTY = clamp((e.clientY - r.top) / r.height, 0, 1) * 2 - 1;
      start();
    };
    const onEnter = () => { hoverT = 1; start(); };
    const onLeave = () => { hoverT = 0; ptrTX = 0; ptrTY = 0; start(); };
    const onVis = () => { last = 0; start(); };

    router.prefetch(href);
    const link = root.querySelector<HTMLAnchorElement>(".td-hit")!;
    link.addEventListener("click", ev => { if (!ev.metaKey && !ev.ctrlKey && ev.button === 0) dive(ev); });
    if (fine) { stage.addEventListener("pointermove", onMove, { passive: true }); stage.addEventListener("pointerenter", onEnter); stage.addEventListener("pointerleave", onLeave); }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", () => { resize(); onScroll(); });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("page:transition-abort", onAbort);
    const io = new IntersectionObserver(es => { inView = es[0].isIntersecting; last = 0; start(); }, { threshold: 0 });
    io.observe(stage);
    const onLost = (ev: Event) => { ev.preventDefault(); cancelAnimationFrame(raf); raf = 0; ready = false; setMode("dom"); };
    canvas.addEventListener("webglcontextlost", onLost);

    D.push(
      () => cancelAnimationFrame(raf),
      () => io.disconnect(),
      () => removeEventListener("scroll", onScroll),
      () => document.removeEventListener("visibilitychange", onVis),
      () => window.removeEventListener("page:transition-abort", onAbort),
      () => canvas.removeEventListener("webglcontextlost", onLost),
    );
    return () => D.forEach(f => f());
  }, [mode, href, locale, router]);

  if (mode === "dom") return <SpreadTheater href={href} label={label} />;

  return (
    <div ref={rootRef} className="td-root">
      <div className="td-stage">
        <canvas className="td-canvas" aria-hidden />
        <a className="td-hit" href={href} aria-label={label}>
          <span className="sr-only">{label}</span>
        </a>
        <p className="td-chip" aria-hidden>{chip}</p>
        <div className="td-labels" aria-hidden>
          {LABELS.map(l => <span key={l} className="td-label">{locale === "uk" ? { Past: "Було", Now: "Зараз", Next: "Далі" }[l] : l}</span>)}
        </div>
      </div>

      <style jsx>{`
        .td-root { position: relative; }

        .td-stage {
          position: relative;
          width: 100%;
          max-width: 34rem;
          height: 28rem;
          margin: 0 auto;
          --td-a: 0;
          --td-hand: 0;
          --td-plate: 0;
        }

        .td-canvas {
          display: block;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.7s var(--ease-engrave, cubic-bezier(0.625, 0.05, 0, 1));
        }

        .td-stage.is-ready .td-canvas { opacity: 1; }

        /* the whole plate is the link — a real anchor, so cmd-click,
           middle-click and open-in-new-tab all behave */
        .td-hit {
          position: absolute;
          inset: 0;
          z-index: 2;
          border-radius: 8px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .td-hit:focus-visible {
          outline: 2px solid var(--lg-gilt, #e0b768);
          outline-offset: 6px;
        }

        /* the ruled caption names the plate while the band is open, and
           cuts rather than crossfades */
        .td-chip {
          position: absolute;
          left: 50%;
          bottom: 0.1rem;
          transform: translateX(-50%);
          margin: 0;
          max-width: 92%;
          opacity: var(--td-plate);
          transition: opacity 90ms linear;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          text-align: center;
          color: var(--lg-peri, #b7bce9);
          text-shadow: 0 0 12px rgba(10, 13, 56, 0.9);
          pointer-events: none;
        }

        .td-labels {
          position: absolute;
          left: 50%;
          bottom: 1.35rem;
          width: 100%;
          max-width: 26rem;
          transform: translateX(-50%);
          display: flex;
          justify-content: space-between;
          opacity: var(--td-hand);
          transition: opacity 90ms linear;
          pointer-events: none;
        }

        .td-label {
          flex: 1;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-indent: 0.18em;
          text-transform: uppercase;
          color: var(--lg-peri, #b7bce9);
        }

        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          margin: -1px; overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .td-stage { height: 24rem; }
          .td-chip { font-size: 0.5rem; letter-spacing: 0.12em; }
        }
      `}</style>
    </div>
  );
}
