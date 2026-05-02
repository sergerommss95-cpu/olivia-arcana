/**
 * ZodiacGL v4 — Cinematic constellation activation
 * ─────────────────────────────────────────────────
 * The effect: when you hover near a constellation, a bright energy pulse
 * traces through the connection lines like electricity through fiber optics.
 * As the pulse reaches each star node, the node IGNITES with a starburst.
 * Once fully traced, the constellation holds a warm living glow with
 * a slowly rotating sacred geometry ring behind it.
 *
 * One system. One effect. Done cinematically.
 */

import * as THREE from "three";
import { WebGLEngine, type EngineSystem } from "./WebGLEngine";
import { ZODIAC, type ZodiacSign } from "../data/constellations";

// ═══════════════════════════════════════════════════════════════════════════
// LINE SHADER — glowing connection with traveling energy pulse
// ═══════════════════════════════════════════════════════════════════════════

const lineVert = /* glsl */ `
uniform float uDraw;
uniform float uHover;
uniform float uTime;
uniform float uBrightness;
attribute float aT; // 0-1 position along line

varying float vAlpha;
varying float vGlow;

void main() {
  // Draw-in: line extends from 0 to uDraw
  float drawn = smoothstep(aT - 0.03, aT, uDraw);

  // Energy trace: bright pulse traveling along the drawn portion
  float traceSpeed = 0.4;
  float tracePos = fract(uTime * traceSpeed);
  float traceWidth = 0.08;
  float trace = smoothstep(traceWidth, 0.0, abs(aT - tracePos))
              * step(aT, uDraw)  // only on drawn portion
              * uHover;

  // Base line visibility — nearly invisible at idle
  float baseLine = drawn * (0.01 + uHover * 0.28 * uBrightness);

  vAlpha = (baseLine + trace * 0.7) * uBrightness;
  vGlow = trace;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const lineFrag = /* glsl */ `
varying float vAlpha;
varying float vGlow;

void main() {
  if (vAlpha < 0.003) discard;
  // Warm white for base, brighter white for energy trace
  vec3 color = mix(vec3(0.8, 0.82, 0.9), vec3(1.0, 0.98, 0.95), vGlow);
  gl_FragColor = vec4(color, vAlpha);
}`;

// ═══════════════════════════════════════════════════════════════════════════
// GLOW LINE — wider, softer duplicate for bloom/glow effect
// ═══════════════════════════════════════════════════════════════════════════

const glowLineVert = /* glsl */ `
uniform float uDraw;
uniform float uHover;
uniform float uTime;
attribute float aT;

varying float vAlpha;

void main() {
  float drawn = smoothstep(aT - 0.03, aT, uDraw);
  float tracePos = fract(uTime * 0.4);
  float trace = smoothstep(0.12, 0.0, abs(aT - tracePos)) * step(aT, uDraw) * uHover;

  vAlpha = drawn * uHover * 0.06 + trace * 0.15;

  // Push vertices outward slightly for wider glow
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = 12.0; // rendered as points for soft glow
}`;

const glowLineFrag = /* glsl */ `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  if (a < 0.002) discard;
  gl_FragColor = vec4(0.85, 0.88, 1.0, a);
}`;

// ═══════════════════════════════════════════════════════════════════════════
// NODE SHADER — starburst ignition when activated
// ═══════════════════════════════════════════════════════════════════════════

const nodeVert = /* glsl */ `
uniform float uHover;
uniform float uDraw;
uniform float uTime;
uniform float uBrightness;
attribute float aOrder; // 0-1, when this star appears in the sequence

varying float vAlpha;
varying float vIgnite;
varying float vSize;

void main() {
  // Star appears when draw progress reaches its order
  float revealed = smoothstep(aOrder - 0.02, aOrder + 0.08, uDraw);

  // Ignition flash: brief bright moment when first revealed
  float ignitePhase = clamp((uDraw - aOrder) * 8.0, 0.0, 1.0);
  float igniteFlash = (1.0 - ignitePhase) * step(0.01, revealed);

  float breath = 0.85 + 0.15 * sin(uTime * 1.5 + aOrder * 6.28);

  vAlpha = revealed * (0.02 + uHover * 0.55 * uBrightness + igniteFlash * 0.7) * breath * uBrightness;
  vIgnite = igniteFlash * uHover * uBrightness;
  vSize = (1.5 + uHover * 2.5 * uBrightness + igniteFlash * 4.0) * revealed;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(vSize * (70.0 / -mv.z), 0.5);
}`;

const nodeFrag = /* glsl */ `
varying float vAlpha;
varying float vIgnite;
varying float vSize;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  // Core dot
  float core = smoothstep(0.15, 0.0, d);

  // Soft halo
  float halo = smoothstep(0.5, 0.0, d) * 0.3;

  // Starburst spikes during ignition
  float spikes = 0.0;
  if (vIgnite > 0.05 && vSize > 2.0) {
    float spikeH = smoothstep(0.03, 0.0, abs(uv.y)) * smoothstep(0.48, 0.0, abs(uv.x));
    float spikeV = smoothstep(0.03, 0.0, abs(uv.x)) * smoothstep(0.48, 0.0, abs(uv.y));
    // Diagonal spikes
    vec2 rot45 = vec2(uv.x + uv.y, uv.x - uv.y) * 0.707;
    float spikeD1 = smoothstep(0.025, 0.0, abs(rot45.y)) * smoothstep(0.4, 0.0, abs(rot45.x));
    float spikeD2 = smoothstep(0.025, 0.0, abs(rot45.x)) * smoothstep(0.4, 0.0, abs(rot45.y));
    spikes = (spikeH + spikeV + spikeD1 * 0.5 + spikeD2 * 0.5) * vIgnite;
  }

  float alpha = (core + halo + spikes * 0.6) * vAlpha;

  // Color: warm white for core, cool white for spikes
  vec3 color = mix(vec3(1.0, 0.97, 0.92), vec3(0.9, 0.93, 1.0), spikes * 0.5);

  gl_FragColor = vec4(color, alpha);
}`;

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

interface SignState {
  hover: number;
  dwell: number;
  draw: number;
  lineMats: THREE.ShaderMaterial[];
  glowMats: THREE.ShaderMaterial[];
  nodeMat: THREE.ShaderMaterial;
  ringMat: THREE.ShaderMaterial;
  group: THREE.Group;
}

export class ZodiacGL implements EngineSystem {
  private engine!: WebGLEngine;
  private signs: SignState[] = [];
  private w = 0;
  private h = 0;
  private focusedSign: number = -1;
  private hoveredSign: number = -1;
  private focusProgress: number[] = []; // per-sign 0-1 focus animation
  private originalPositions: THREE.Vector3[] = []; // original group positions
  // Personal brightness multiplier per sign (constellation-memory).
  // 1.0 = default. >1.0 = sign brightens because user draws cards mapped to it.
  // Range typically 0.85 → 1.6.
  private personalMul: number[] = [];
  private onActivate = (e: Event) => {
    const idx = (e as CustomEvent).detail?.index ?? -1;
    this.focusedSign = idx;
    // Clear hover label when a sign is focused
    if (idx >= 0 && this.hoveredSign >= 0) {
      this.hoveredSign = -1;
      window.dispatchEvent(new CustomEvent("zodiac:hover", { detail: null }));
    }
  };

  private onClick = (e: MouseEvent) => {
    if (this.focusedSign >= 0) return; // already focused
    const mx = e.clientX / this.w;
    const my = e.clientY / this.h;
    for (let ci = 0; ci < ZODIAC.length; ci++) {
      const sign = ZODIAC[ci];
      const dx = mx - sign.cx;
      const dy = my - sign.cy;
      const dist = Math.hypot(dx, dy);
      const range = sign.scale / Math.min(this.w, this.h) * 3.0;
      if (dist < range) {
        window.dispatchEvent(new CustomEvent("zodiac:click", {
          detail: { name: sign.name, glyph: sign.glyph, index: ci },
        }));
        return;
      }
    }
  };

  init(engine: WebGLEngine) {
    this.engine = engine;
    this.w = engine.resolution.x;
    this.h = engine.resolution.y;
    this.buildAll();

    window.addEventListener("click", this.onClick);

    // Listen for birthday activation from Hero.tsx
    window.addEventListener("zodiac:activate", this.onActivate);
  }

  private buildAll() {
    this.focusProgress = [];
    this.originalPositions = [];
    this.personalMul = ZODIAC.map(() => 1.0);
    for (const sign of ZODIAC) {
      const state = this.buildSign(sign);
      this.signs.push(state);
      this.engine.scene.add(state.group);
      this.focusProgress.push(0);
      this.originalPositions.push(state.group.position.clone());
    }
  }

  /**
   * Scale per-sign brightness based on the user's draw history.
   * Caller passes a Record<signNameLower, brightness 0.3-1.0> from
   * computeConstellationBrightness(). We rescale to a multiplier centered on 1.
   */
  setPersonalBrightness(brightnessByName: Record<string, number>): void {
    if (!this.personalMul.length) return;
    for (let i = 0; i < ZODIAC.length; i++) {
      const key = ZODIAC[i].name.toLowerCase();
      const b = brightnessByName[key];
      // 0.3-1.0 input → 0.85-1.55 output. Default 1.0 if missing.
      this.personalMul[i] = b == null ? 1.0 : 0.85 + b * 0.7;
    }
  }

  private toWorld(sign: ZodiacSign): THREE.Vector3[] {
    const aspect = this.w / this.h;
    const halfH = Math.tan(THREE.MathUtils.degToRad(35)) * 1.5;
    const halfW = halfH * aspect;
    return sign.stars.map(([sx, sy]: [number, number]) => {
      const nx = sign.cx + (sx - 0.5) * sign.scale / this.w;
      const ny = 1 - sign.cy - (sy - 0.5) * sign.scale / this.h;
      return new THREE.Vector3(nx * 2 * halfW - halfW, ny * 2 * halfH - halfH, -0.5);
    });
  }

  private getOrder(sign: ZodiacSign, stars: THREE.Vector3[]): number[] {
    const n = stars.length;
    switch (sign.revealOrder) {
      case "sequential": return stars.map((_, i) => i / (n - 1 || 1));
      case "center-out": {
        const c = stars.reduce((s, p) => new THREE.Vector3(s.x + p.x / n, s.y + p.y / n, 0), new THREE.Vector3());
        const d = stars.map(p => Math.hypot(p.x - c.x, p.y - c.y));
        const mx = Math.max(...d, 0.001);
        return d.map(v => v / mx);
      }
      case "wave": {
        const xs = stars.map(p => p.x);
        const mn = Math.min(...xs), r = Math.max(...xs) - mn || 1;
        return xs.map(x => (x - mn) / r);
      }
      case "bottom-up": {
        const ys = stars.map(p => p.y);
        const mn = Math.min(...ys), r = Math.max(...ys) - mn || 1;
        return ys.map(y => (y - mn) / r);
      }
      default: return stars.map(() => Math.random() * 0.1);
    }
  }

  private buildSign(sign: ZodiacSign): SignState {
    const group = new THREE.Group();
    group.renderOrder = 2;
    const stars = this.toWorld(sign);
    const cx = stars.reduce((s, p) => s + p.x, 0) / stars.length;
    const cy = stars.reduce((s, p) => s + p.y, 0) / stars.length;
    const lineMats: THREE.ShaderMaterial[] = [];
    const glowMats: THREE.ShaderMaterial[] = [];

    const uniforms = () => ({
      uDraw: { value: 0 }, uHover: { value: 0 }, uTime: { value: 0 }, uBrightness: { value: 1.0 },
    });

    // ── Connection lines + glow points along lines ──
    for (const [a, b] of sign.connections) {
      if (a >= stars.length || b >= stars.length) continue;
      const sa = stars[a], sb = stars[b];
      const segs = 32;
      const pos = new Float32Array(segs * 3);
      const ts = new Float32Array(segs);

      for (let i = 0; i < segs; i++) {
        const t = i / (segs - 1);
        pos[i * 3] = sa.x + (sb.x - sa.x) * t;
        pos[i * 3 + 1] = sa.y + (sb.y - sa.y) * t;
        pos[i * 3 + 2] = -0.5;
        ts[i] = t;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aT", new THREE.BufferAttribute(ts, 1));

      // Thin line
      const mat = new THREE.ShaderMaterial({
        vertexShader: lineVert, fragmentShader: lineFrag, uniforms: uniforms(),
        transparent: true, depthTest: false, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      group.add(line);
      lineMats.push(mat);

      // Glow points along the line (soft blobs that create bloom-like effect)
      const glowGeo = geo.clone();
      const glowMat = new THREE.ShaderMaterial({
        vertexShader: glowLineVert, fragmentShader: glowLineFrag, uniforms: uniforms(),
        transparent: true, blending: THREE.AdditiveBlending,
        depthTest: false, depthWrite: false,
      });
      const glowPts = new THREE.Points(glowGeo, glowMat);
      glowPts.frustumCulled = false;
      group.add(glowPts);
      glowMats.push(glowMat);
    }

    // ── Star nodes with starburst ──
    const order = this.getOrder(sign, stars);
    const nPos = new Float32Array(stars.length * 3);
    const nOrd = new Float32Array(stars.length);
    for (let i = 0; i < stars.length; i++) {
      nPos[i * 3] = stars[i].x;
      nPos[i * 3 + 1] = stars[i].y;
      nPos[i * 3 + 2] = -0.5;
      nOrd[i] = order[i];
    }
    const nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
    nGeo.setAttribute("aOrder", new THREE.BufferAttribute(nOrd, 1));

    const nodeMat = new THREE.ShaderMaterial({
      vertexShader: nodeVert, fragmentShader: nodeFrag,
      uniforms: { uHover: { value: 0 }, uDraw: { value: 0 }, uTime: { value: 0 }, uBrightness: { value: 1.0 } },
      transparent: true, blending: THREE.AdditiveBlending,
      depthTest: false, depthWrite: false,
    });
    const nodes = new THREE.Points(nGeo, nodeMat);
    nodes.frustumCulled = false;
    group.add(nodes);

    // ── Sacred geometry ring ──
    const ringSegs = 128;
    const ringPos = new Float32Array(ringSegs * 3);
    const ringAngles = new Float32Array(ringSegs);
    // Compute bounding radius of constellation
    const maxR = Math.max(...stars.map(s => Math.hypot(s.x - cx, s.y - cy))) * 1.4;

    for (let i = 0; i < ringSegs; i++) {
      const angle = (i / ringSegs) * Math.PI * 2;
      ringPos[i * 3] = cx + Math.cos(angle) * maxR;
      ringPos[i * 3 + 1] = cy + Math.sin(angle) * maxR;
      ringPos[i * 3 + 2] = -0.5;
      ringAngles[i] = angle;
    }
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
    ringGeo.setAttribute("aAngle", new THREE.BufferAttribute(ringAngles, 1));

    const ringMat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uHover;
        uniform float uTime;
        uniform float uBrightness;
        attribute float aAngle;
        varying float vA;
        void main() {
          float dash = step(0.4, fract(aAngle * 6.0 / 6.2832));
          float tick = smoothstep(0.02, 0.0, abs(mod(aAngle, 1.5708)));
          vA = uHover * (dash * 0.08 + tick * 0.2) * smoothstep(0.3, 0.6, uHover) * uBrightness;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          if (vA < 0.003) discard;
          gl_FragColor = vec4(0.8, 0.83, 0.95, vA);
        }`,
      uniforms: { uHover: { value: 0 }, uTime: { value: 0 }, uBrightness: { value: 1.0 } },
      transparent: true, depthTest: false, depthWrite: false,
    });
    const ring = new THREE.LineLoop(ringGeo, ringMat);
    ring.frustumCulled = false;
    group.add(ring);

    return { hover: 0, dwell: 0, draw: 0, lineMats, glowMats, nodeMat, ringMat, group };
  }

  update(time: number, dt: number) {
    const mouse = this.engine.smoothMouse;
    const focused = this.focusedSign;

    for (let ci = 0; ci < ZODIAC.length; ci++) {
      const sign = ZODIAC[ci];
      const s = this.signs[ci];

      // ── Focus pull-in animation (birthday activation) ──
      const isFocused = focused === ci;
      const focusTarget = isFocused ? 1 : 0;
      const fp = this.focusProgress[ci];
      this.focusProgress[ci] += (focusTarget - fp) * (isFocused ? 0.07 : 0.02);
      const foc = this.focusProgress[ci];

      if (foc > 0.01) {
        // Pull constellation toward center and scale up
        const orig = this.originalPositions[ci];
        const centerTarget = new THREE.Vector3(0, 0, -0.5); // screen center in world
        s.group.position.lerpVectors(orig, centerTarget, foc * 0.7);
        s.group.scale.setScalar(1 + foc * 2.0); // scale up 3x at full focus

        // Override hover/draw to full activation
        s.hover = Math.max(s.hover, foc);
        s.draw = Math.max(s.draw, foc);
      } else {
        // Return to original position
        s.group.position.copy(this.originalPositions[ci]);
        s.group.scale.setScalar(1);
      }

      // ── When another sign is focused, fade this one out ──
      if (focused >= 0 && !isFocused) {
        s.hover *= 0.95; // rapid fade
        s.draw *= 0.95;
      }

      // ── Normal mouse hover (only when no sign is focused) ──
      if (focused < 0) {
        const dx = mouse.x - sign.cx;
        const dy = mouse.y - (1 - sign.cy);
        const dist = Math.hypot(dx, dy);
        const range = sign.scale / Math.min(this.w, this.h) * 3.5;
        const near = dist < range;

        s.dwell = near ? Math.min(s.dwell + dt * 1000, 3000) : Math.max(s.dwell - dt * 1500, 0);
        const ready = s.dwell > 300;
        const prox = near ? Math.pow(Math.max(0, 1 - dist / range), 0.5) : 0;
        const target = ready ? prox : prox * 0.02;

        s.hover += (target - s.hover) * (target > s.hover ? 0.05 : 0.01);
        const drawTarget = ready && s.hover > 0.08 ? 1 : 0;
        s.draw += (drawTarget - s.draw) * (drawTarget > s.draw ? 0.018 : 0.008);

        // Emit hover label — use `near` directly (not slow-decaying s.hover)
        if (near && ready && this.hoveredSign !== ci) {
          this.hoveredSign = ci;
          window.dispatchEvent(new CustomEvent("zodiac:hover", {
            detail: {
              name: sign.name,
              glyph: sign.glyph,
              x: sign.cx * this.w,
              y: sign.cy * this.h,
            },
          }));
        } else if (!near && this.hoveredSign === ci) {
          this.hoveredSign = -1;
          window.dispatchEvent(new CustomEvent("zodiac:hover", { detail: null }));
        }
      }

      // ── Update uniforms — apply per-sign personal brightness ──
      const mul = this.personalMul[ci] ?? 1.0;
      const drawScaled = Math.min(1.0, s.draw * mul);
      for (let i = 0; i < s.lineMats.length; i++) {
        s.lineMats[i].uniforms.uDraw.value = drawScaled;
        s.lineMats[i].uniforms.uHover.value = s.hover;
        s.lineMats[i].uniforms.uTime.value = time;
        s.lineMats[i].uniforms.uBrightness.value = mul;
        s.glowMats[i].uniforms.uDraw.value = drawScaled;
        s.glowMats[i].uniforms.uHover.value = s.hover;
        s.glowMats[i].uniforms.uTime.value = time;
        s.glowMats[i].uniforms.uBrightness.value = mul;
      }
      s.nodeMat.uniforms.uHover.value = s.hover;
      s.nodeMat.uniforms.uDraw.value = drawScaled;
      s.nodeMat.uniforms.uTime.value = time;
      s.nodeMat.uniforms.uBrightness.value = mul;
      s.ringMat.uniforms.uHover.value = s.hover;
      s.ringMat.uniforms.uTime.value = time;
      s.ringMat.uniforms.uBrightness.value = mul;
    }
  }

  resize(w: number, h: number) {
    this.w = w; this.h = h;
    for (const s of this.signs) this.engine.scene.remove(s.group);
    this.signs = [];
    this.buildAll();
  }

  dispose() {
    window.removeEventListener("zodiac:activate", this.onActivate);
    window.removeEventListener("click", this.onClick);
    for (const s of this.signs) {
      this.engine.scene.remove(s.group);
      s.group.traverse(o => {
        if ('geometry' in o) (o as THREE.Mesh).geometry?.dispose();
        if ('material' in o) ((o as THREE.Mesh).material as THREE.Material)?.dispose();
      });
    }
  }
}
