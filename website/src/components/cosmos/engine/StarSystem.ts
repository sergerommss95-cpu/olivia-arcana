/**
 * StarSystem — GPU instanced star particles
 *
 * 2000 stars rendered as THREE.Points with custom GLSL:
 *   - 3 size classes: micro (0.5px), standard (1.2px), giant (2.5px)
 *   - Vertex: mouse parallax + sin twinkle
 *   - Fragment: soft disc falloff + color temperature + 4-ray diffraction spikes
 *   - Occasional shooting star (every 8-12s)
 */

import * as THREE from "three";
import { WebGLEngine, type EngineSystem } from "./WebGLEngine";

const STAR_COUNT = 2000;

// ── Vertex shader ──
const vertexShader = /* glsl */ `
attribute float aSize;
attribute float aBrightness;
attribute float aTwinklePhase;
attribute float aTwinkleFreq;
attribute float aColorTemp;
attribute float aParallaxWeight;

uniform float uTime;
uniform vec2 uMouse;

varying float vBrightness;
varying float vColorTemp;
varying float vSize;

void main() {
  vec3 pos = position;

  // Mouse parallax — near stars drift more
  float pw = aParallaxWeight;
  pos.x += (uMouse.x - 0.5) * pw * 60.0;
  pos.y += (uMouse.y - 0.5) * pw * 35.0;

  // Twinkle
  float twinkle = sin(uTime * aTwinkleFreq + aTwinklePhase) * 0.5 + 0.5;
  vBrightness = aBrightness * mix(0.55, 1.0, twinkle);
  vColorTemp = aColorTemp;
  vSize = aSize * mix(0.85, 1.15, twinkle);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = min(vSize * (35.0 / -mvPosition.z), 5.0);
}`;

// ── Fragment shader ──
const fragmentShader = /* glsl */ `
varying float vBrightness;
varying float vColorTemp;
varying float vSize;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);

  if (dist > 0.5) discard;

  // Soft circular falloff — whisper-quiet
  float alpha = smoothstep(0.5, 0.0, dist) * vBrightness * 0.35;

  // Color temperature: 0 = cool blue-white, 1 = warm gold
  vec3 coolColor = vec3(0.75, 0.85, 1.0);
  vec3 warmColor = vec3(1.0, 0.9, 0.65);
  vec3 color = mix(coolColor, warmColor, vColorTemp);

  // 4-ray diffraction spikes for giant stars (size > 2.0)
  if (vSize > 2.0) {
    float spikeIntensity = (vSize - 2.0) / 2.0;
    float spikeH = smoothstep(0.035, 0.0, abs(uv.y)) * smoothstep(0.48, 0.0, abs(uv.x));
    float spikeV = smoothstep(0.035, 0.0, abs(uv.x)) * smoothstep(0.48, 0.0, abs(uv.y));
    float spikes = (spikeH + spikeV) * spikeIntensity * 0.6 * vBrightness;
    alpha = max(alpha, spikes);
    // Spikes slightly bluer (chromatic aberration feel)
    color = mix(color, vec3(0.88, 0.92, 1.0), spikes * 0.25);
  }

  // Brighten core
  color = mix(color, vec3(1.0), smoothstep(0.15, 0.0, dist) * 0.5);

  gl_FragColor = vec4(color, alpha);
}`;

export class StarSystem implements EngineSystem {
  private points!: THREE.Points;
  private material!: THREE.ShaderMaterial;
  private engine!: WebGLEngine;

  init(engine: WebGLEngine) {
    this.engine = engine;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const brightness = new Float32Array(STAR_COUNT);
    const twinklePhase = new Float32Array(STAR_COUNT);
    const twinkleFreq = new Float32Array(STAR_COUNT);
    const colorTemp = new Float32Array(STAR_COUNT);
    const parallaxWeight = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Position: spread across a large area (camera sees -1 to 1 in NDC)
      positions[i * 3] = (Math.random() - 0.5) * 6;      // x — wider spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;  // y
      positions[i * 3 + 2] = -1.5 - Math.random() * 5;   // z — pushed further back

      // Size class distribution: 70% micro, 22% standard, 8% giant
      const roll = Math.random();
      if (roll < 0.70) {
        sizes[i] = 0.3 + Math.random() * 0.5;   // micro
        brightness[i] = 0.15 + Math.random() * 0.3;
      } else if (roll < 0.92) {
        sizes[i] = 0.8 + Math.random() * 0.8;   // standard
        brightness[i] = 0.35 + Math.random() * 0.4;
      } else {
        sizes[i] = 2.0 + Math.random() * 2.0;   // giant (diffraction spikes)
        brightness[i] = 0.7 + Math.random() * 0.3;
      }

      twinklePhase[i] = Math.random() * Math.PI * 2;
      twinkleFreq[i] = 1.0 + Math.random() * 3.0;

      // Color temperature: 0 = cool blue, 1 = warm gold
      // Bias toward warm white center (0.3-0.6)
      const ct = Math.random();
      colorTemp[i] = ct < 0.15 ? Math.random() * 0.2 :         // 15% cool blue
                     ct < 0.75 ? 0.3 + Math.random() * 0.3 :    // 60% warm white
                     0.6 + Math.random() * 0.4;                  // 25% warm gold

      // Parallax: near stars (large, bright) drift more
      parallaxWeight[i] = brightness[i] * (0.3 + Math.random() * 0.7);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geometry.setAttribute("aTwinklePhase", new THREE.BufferAttribute(twinklePhase, 1));
    geometry.setAttribute("aTwinkleFreq", new THREE.BufferAttribute(twinkleFreq, 1));
    geometry.setAttribute("aColorTemp", new THREE.BufferAttribute(colorTemp, 1));
    geometry.setAttribute("aParallaxWeight", new THREE.BufferAttribute(parallaxWeight, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      },
      transparent: true,
      blending: THREE.NormalBlending, // NOT additive — prevents wash-out
      depthTest: false,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;

    // Stars render on top of nebula plane
    this.points.renderOrder = 1;

    engine.scene.add(this.points);
  }

  update(time: number, _dt: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uMouse.value.copy(this.engine.smoothMouse);
  }

  resize(_w: number, _h: number) {
    // Stars are in world space, no resize needed
  }

  dispose() {
    this.points?.geometry.dispose();
    this.material?.dispose();
  }
}
