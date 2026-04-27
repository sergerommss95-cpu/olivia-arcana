/**
 * NebulaPlane — Full-screen shader background
 *
 * A PlaneGeometry(2,2) that covers the viewport in NDC space.
 * Fragment shader samples the nebula photo texture and applies:
 *   - Simplex noise UV warping (living nebula drift)
 *   - Smooth vignette
 *   - Animated film grain (fract noise, not CSS)
 *   - Mouse-proximity chromatic aberration (Phase 3: driven by flowmap)
 */

import * as THREE from "three";
import { WebGLEngine, type EngineSystem } from "./WebGLEngine";

// ── Vertex shader (passthrough) ──
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// ── Fragment shader ──
const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uFlowmap;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uMouseVelocity;
uniform float uFlowmapEnabled;
uniform float uOpacity;
uniform float uBrightFlash;   // 0 = normal, 1 = full flash (gentle nebula glow)
uniform float uBreath;
uniform float uHueShift;
uniform float uSaturation;
uniform float uWarmth;

varying vec2 vUv;

// ─── Simplex 2D noise ───
vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211325, 0.366025, -0.577350, 0.024390);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m * m * m;
  vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x_) - 0.5;
  vec3 ox = floor(x_ + 0.5);
  vec3 a0 = x_ - ox;
  m *= 1.792842 - 0.853734 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;

  // ── Flowmap displacement — THE key interaction (shader.se signature) ──
  vec3 flow = texture2D(uFlowmap, uv).rgb;
  vec2 flowDisplace = (flow.rg - 0.5) * 0.14 * uFlowmapEnabled; // STRONG — must be felt
  uv += flowDisplace;

  // ── Subtle noise drift (living, breathing nebula) ──
  float n1 = snoise(uv * 2.0 + uTime * 0.03);
  float n2 = snoise(uv * 2.5 + uTime * 0.025 + 50.0);
  uv += vec2(n1, n2) * 0.003;

  // Clamp
  uv = clamp(uv, 0.005, 0.995);

  // ── Chromatic aberration — ultra subtle, almost imperceptible at rest ──
  float flowMag = length(flowDisplace);
  float aberration = flowMag * 0.10 + uMouseVelocity * 0.00025;
  vec2 caDir = (uv - 0.5) * aberration;

  float r = texture2D(uTexture, clamp(uv + caDir, 0.005, 0.995)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, clamp(uv - caDir, 0.005, 0.995)).b;
  vec3 color = vec3(r, g, b);

  // ── Tone curve: Rich and atmospheric, visible but not overpowering. ──
  float darkenMul = 0.35 + uBrightFlash * 0.30; // base 35% — visible nebula
  color *= darkenMul;
  color = color / (color + vec3(0.18));  // softer rolloff — preserves more highlights
  color = pow(color, vec3(1.25));  // gentler gamma — keeps midtones alive

  // ── Soft vignette — frame the nebula, don't bury it ──
  float vigDist = distance(vUv, vec2(0.5));
  float vigRadius = mix(0.72, 0.80, uBreath);
  float vig = 1.0 - smoothstep(0.15, vigRadius, vigDist);
  float breathBrightness = mix(0.97, 1.03, uBreath);
  color *= (0.55 * vig + 0.45) * breathBrightness;

  // Visitor archetype palette shift — hue rotation, saturation, warmth
  float hCos = cos(uHueShift);
  float hSin = sin(uHueShift);
  color = vec3(
    color.r * (hCos + 0.701 * (1.0 - hCos)) + color.g * (0.587 * (1.0 - hCos) - 0.701 * hSin) + color.b * (0.114 * (1.0 - hCos) + hSin),
    color.r * (0.299 * (1.0 - hCos) + hSin)  + color.g * (hCos + 0.587 * (1.0 - hCos))         + color.b * (0.114 * (1.0 - hCos) - hSin),
    color.r * (0.299 * (1.0 - hCos) - hSin)  + color.g * (0.587 * (1.0 - hCos) + hSin)         + color.b * (hCos + 0.114 * (1.0 - hCos))
  );
  float lumN = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(lumN), color, uSaturation);
  color += vec3(uWarmth * 0.6, uWarmth * 0.35, 0.0) * smoothstep(0.1, 0.4, lumN);

  // ── Cursor glow — warm, subtle, follows mouse ──
  float md = distance(vUv, uMouse);
  color += vec3(0.04, 0.025, 0.008) * smoothstep(0.22, 0.0, md) * 0.8;

  gl_FragColor = vec4(color, uOpacity);
}`;

export class NebulaPlane implements EngineSystem {
  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private engine!: WebGLEngine;
  private opacity = 0;
  private textureReady = false;
  private archetypeTarget = {
    hueShift: 0,
    saturation: 1,
    warmth: 0,
  };

  // Public: other systems can add uniforms (e.g., flowmap adds uFlowmap)
  get uniforms() { return this.material?.uniforms; }

  init(engine: WebGLEngine) {
    this.engine = engine;

    // Load nebula texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/nebula-bg.jpg", () => {
      this.textureReady = true;
    });
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uOpacity: { value: 0.0 },
        uFlowmap: { value: null }, // set by FlowmapSystem
        uFlowmapEnabled: { value: 0 }, // 0 until flowmap is connected
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: engine.resolution.clone() },
        uMouseVelocity: { value: 0 },
        uBrightFlash: { value: 0.0 },
        uBreath: { value: 0.0 },
        uHueShift: { value: 0.0 },
        uSaturation: { value: 1.0 },
        uWarmth: { value: 0.0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    // Fullscreen quad in NDC (-1 to 1)
    const geo = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0; // behind stars (renderOrder=1)
    engine.scene.add(this.mesh);
  }

  update(time: number, _dt: number) {
    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uMouse.value.copy(this.engine.smoothMouse);
    u.uMouseVelocity.value = Math.min(this.engine.mouseVelocity, 2.0);

    const targetOpacity = this.textureReady ? 1.0 : 0.0;
    this.opacity += (targetOpacity - this.opacity) * 0.05;
    u.uOpacity.value = this.opacity;

    const hz = (this.engine as WebGLEngine & { __breathHz?: number }).__breathHz ?? 0.2;
    u.uBreath.value = Math.sin(time * hz * Math.PI * 2) * 0.5 + 0.5;
    u.uHueShift.value += (this.archetypeTarget.hueShift - u.uHueShift.value) * 0.004;
    u.uSaturation.value += (this.archetypeTarget.saturation - u.uSaturation.value) * 0.004;
    u.uWarmth.value += (this.archetypeTarget.warmth - u.uWarmth.value) * 0.004;
  }

  resize(w: number, h: number) {
    if (this.material) {
      this.material.uniforms.uResolution.value.set(w, h);
    }
  }

  setArchetype(hueShift: number, saturation: number, warmth: number): void {
    this.archetypeTarget.hueShift = hueShift;
    this.archetypeTarget.saturation = saturation;
    this.archetypeTarget.warmth = warmth;
  }

  dispose() {
    this.mesh?.geometry.dispose();
    this.material?.dispose();
    const tex = this.material?.uniforms.uTexture?.value;
    if (tex) tex.dispose();
  }
}
