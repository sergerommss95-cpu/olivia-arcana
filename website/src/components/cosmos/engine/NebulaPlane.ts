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

// ── Fractional Brownian Motion for Volumetric Clouds ──
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p); p *= 2.0; a *= 0.5;
    }
    return v;
}

void main() {
  vec2 uv = vUv;
  vec2 res = uResolution;
  float aspect = res.x / res.y;
  
  // ── Gravitational Lensing (Singularity) ──
  vec2 singDir = uv - uSingularity;
  singDir.x *= aspect;
  float dist = length(singDir);
  float pull = uSingularityStrength * (1.0 / (dist * 12.0 + 0.6));
  uv -= normalize(uv - uSingularity) * pull * 0.15;

  // ── Generative Volumetric Clouds ──
  vec2 cloudUv = uv * 2.5 + uTime * 0.015;
  float cloudPattern = fbm(cloudUv + fbm(cloudUv * 0.6));
  
  // ── Flowmap displacement ──
  vec3 flow = texture2D(uFlowmap, uv).rgb;
  vec2 flowDisplace = (flow.rg - 0.5) * 0.18 * uFlowmapEnabled;
  uv += flowDisplace;

  // ── Chromatic aberration (Gravity-induced) ──
  float gravityAberration = pull * 0.15;
  float flowMag = length(flowDisplace);
  float aberration = gravityAberration + flowMag * 0.1 + uMouseVelocity * 0.0003;
  vec2 caDir = (uv - uSingularity) * aberration * 0.5;

  float r = texture2D(uTexture, clamp(uv + caDir, 0.001, 0.999)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, clamp(uv - caDir, 0.001, 0.999)).b;
  vec3 texColor = vec3(r, g, b);

  // ── Composition: Mix Texture with Generative Clouds ──
  vec3 color = mix(texColor, vec3(0.08, 0.05, 0.18), cloudPattern * 0.45);
  color += vec3(0.9, 0.7, 0.4) * pow(cloudPattern, 5.0) * 0.25; // Stellar nurseries

  // ── Brightness & Tonemapping ──
  float brightness = 0.45 + uBrightFlash * 0.5 + uBreath * 0.15;
  color *= brightness;
  
  // Event Horizon Glow (Brilliant Gold)
  float horizon = 1.0 - smoothstep(0.0, 0.25 * uSingularityStrength, dist);
  color += vec3(1.0, 0.85, 0.5) * horizon * uSingularityStrength * 0.8;

  color = color / (color + vec3(0.12));
  color = pow(color, vec3(1.05));

  // ── Soft vignette ──
  float vigDist = distance(vUv, vec2(0.5));
  float vigRadius = mix(0.75, 0.85, uBreath);
  float vig = 1.0 - smoothstep(0.2, vigRadius, vigDist);
  color *= (0.6 * vig + 0.4);

  // ... (Persona logic remains the same) ...
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
  color += vec3(0.08, 0.05, 0.02) * smoothstep(0.25, 0.0, md);

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
