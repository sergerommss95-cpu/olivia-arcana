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
uniform vec2 uSingularity;       // New: Center of the attractor
uniform float uSingularityStrength; // New: Strength of the pull

varying vec2 vUv;

// ... (Simplex noise functions remain the same) ...

void main() {
  vec2 uv = vUv;
  vec2 res = uResolution;
  float aspect = res.x / res.y;
  
  // ── Gravitational Lensing (Singularity) ──
  // Calculate distance in aspect-corrected space
  vec2 singDir = uv - uSingularity;
  singDir.x *= aspect;
  float dist = length(singDir);
  
  // Create a refractive pull: the closer to the center, the more the UV is sucked in
  // Using an inverse-square-ish falloff for 'God Mode' weight
  float pull = uSingularityStrength * (1.0 / (dist * 15.0 + 0.8));
  uv -= normalize(uv - uSingularity) * pull * 0.12;

  // ── Flowmap displacement ──
  vec3 flow = texture2D(uFlowmap, uv).rgb;
  vec2 flowDisplace = (flow.rg - 0.5) * 0.14 * uFlowmapEnabled;
  uv += flowDisplace;

  // ── Subtler noise drift ──
  float n1 = snoise(uv * 1.8 + uTime * 0.02);
  uv += vec2(n1, snoise(uv * 2.2 + uTime * 0.02 + 50.0)) * 0.0025;

  // ── Chromatic aberration (Gravity-induced) ──
  float gravityAberration = pull * 0.15;
  float flowMag = length(flowDisplace);
  float aberration = gravityAberration + flowMag * 0.08 + uMouseVelocity * 0.0002;
  vec2 caDir = (uv - uSingularity) * aberration * 0.5;

  float r = texture2D(uTexture, clamp(uv + caDir, 0.001, 0.999)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, clamp(uv - caDir, 0.001, 0.999)).b;
  vec3 color = vec3(r, g, b);

  // ── Tone curve & Singularity Darkening ──
  float darkness = smoothstep(0.0, 0.45 * uSingularityStrength, dist);
  float darkenMul = (0.35 + uBrightFlash * 0.30) * darkness;
  color *= darkenMul;
  
  // ... (rest of the color logic) ...
  color = color / (color + vec3(0.18));
  color = pow(color, vec3(1.25));

  // ── Soft vignette ──
  float vigDist = distance(vUv, vec2(0.5));
  float vigRadius = mix(0.72, 0.80, uBreath);
  float vig = 1.0 - smoothstep(0.15, vigRadius, vigDist);
  color *= (0.55 * vig + 0.45);

  // ... (archetype shift) ...
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

  // ── Final 'God Mode' Glow ──
  float md = distance(vUv, uMouse);
  color += vec3(0.06, 0.04, 0.01) * smoothstep(0.25, 0.0, md);
  
  // Singularity glow (event horizon)
  color += vec3(0.1, 0.08, 0.05) * (1.0 - smoothstep(0.0, 0.15 * uSingularityStrength, dist)) * uSingularityStrength;

  gl_FragColor = vec4(color, uOpacity);
}
`;

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
        uSingularity: { value: new THREE.Vector2(0.75, 0.5) },
        uSingularityStrength: { value: 0.0 },
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

  /**
   * God Mode: Control the attractor from HeroV3 or ScrollTrigger
   */
  setSingularity(x: number, y: number, strength: number) {
    if (!this.material) return;
    this.material.uniforms.uSingularity.value.set(x, y);
    this.material.uniforms.uSingularityStrength.value = strength;
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
