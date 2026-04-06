/**
 * ShootingStars — Periodic meteor streaks across the sky
 *
 * Spawns a shooting star every 6-14 seconds. Each meteor:
 *   - Streaks across the viewport at a random angle (mostly top-right to bottom-left)
 *   - Leaves a bright head with a long fading tail
 *   - Lasts ~0.6-1.2s
 *   - Rendered as a THREE.Line with animated vertex alpha
 */

import * as THREE from "three";
import { WebGLEngine, type EngineSystem } from "./WebGLEngine";

const TAIL_SEGMENTS = 30;

interface Meteor {
  startX: number;
  startY: number;
  angle: number;
  speed: number;
  progress: number;  // 0 = not started, 0-1 = moving, >1 = done
  length: number;
  brightness: number;
  mesh: THREE.Line;
  positions: Float32Array;
  alphas: Float32Array;
}

const meteorVert = /* glsl */ `
attribute float aAlpha;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const meteorFrag = /* glsl */ `
varying float vAlpha;
void main() {
  if (vAlpha < 0.005) discard;
  // White-blue head fading to warm gold tail
  vec3 color = mix(vec3(1.0, 0.95, 0.8), vec3(0.7, 0.8, 1.0), vAlpha);
  gl_FragColor = vec4(color, vAlpha);
}`;

export class ShootingStars implements EngineSystem {
  private engine!: WebGLEngine;
  private meteors: Meteor[] = [];
  private nextSpawn = 0;

  init(engine: WebGLEngine) {
    this.engine = engine;
    this.nextSpawn = 3 + Math.random() * 5; // first one in 3-8s
  }

  private spawnMeteor(): Meteor {
    // Start from random edge position, bias toward upper-right
    const side = Math.random();
    let startX: number, startY: number;
    if (side < 0.6) {
      // Top edge
      startX = 0.2 + Math.random() * 0.8;
      startY = 0.7 + Math.random() * 0.3;
    } else {
      // Right edge
      startX = 0.7 + Math.random() * 0.3;
      startY = 0.2 + Math.random() * 0.8;
    }

    // Angle: mostly top-right to bottom-left (with variance)
    const angle = Math.PI * 0.7 + (Math.random() - 0.5) * 0.6;
    const speed = 1.2 + Math.random() * 0.8;
    const length = 0.15 + Math.random() * 0.15;
    const brightness = 0.5 + Math.random() * 0.5;

    // Create geometry
    const positions = new Float32Array(TAIL_SEGMENTS * 3);
    const alphas = new Float32Array(TAIL_SEGMENTS);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: meteorVert,
      fragmentShader: meteorFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Line(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    this.engine.scene.add(mesh);

    return { startX, startY, angle, speed, progress: 0, length, brightness, mesh, positions, alphas };
  }

  update(time: number, dt: number) {
    // Spawn timer
    this.nextSpawn -= dt;
    if (this.nextSpawn <= 0) {
      this.meteors.push(this.spawnMeteor());
      this.nextSpawn = 6 + Math.random() * 8; // 6-14s
    }

    const aspect = this.engine.resolution.x / this.engine.resolution.y;
    const halfH = Math.tan(THREE.MathUtils.degToRad(35)) * 1.5;
    const halfW = halfH * aspect;

    // Update meteors
    for (let mi = this.meteors.length - 1; mi >= 0; mi--) {
      const m = this.meteors[mi];
      m.progress += dt * m.speed;

      if (m.progress > 1.3) {
        // Remove
        this.engine.scene.remove(m.mesh);
        m.mesh.geometry.dispose();
        (m.mesh.material as THREE.Material).dispose();
        this.meteors.splice(mi, 1);
        continue;
      }

      // Update positions: head is at progress, tail trails behind
      const headX = m.startX + Math.cos(m.angle) * m.progress * 0.6;
      const headY = m.startY + Math.sin(m.angle) * m.progress * 0.6;

      for (let i = 0; i < TAIL_SEGMENTS; i++) {
        const t = i / (TAIL_SEGMENTS - 1); // 0 = head, 1 = tail tip
        const trailOffset = t * m.length;
        const px = headX - Math.cos(m.angle) * trailOffset;
        const py = headY - Math.sin(m.angle) * trailOffset;

        // Convert viewport fraction to world coords
        const wx = px * 2 * halfW - halfW;
        const wy = py * 2 * halfH - halfH;

        m.positions[i * 3] = wx;
        m.positions[i * 3 + 1] = wy;
        m.positions[i * 3 + 2] = -0.8;

        // Alpha: bright at head, fading tail, overall fade at start/end
        const headFade = Math.min(m.progress * 4, 1); // fade in
        const tailFade = Math.max(0, 1 - (m.progress - 0.7) * 3); // fade out
        m.alphas[i] = (1 - t * t) * m.brightness * headFade * Math.max(tailFade, 0);
      }

      m.mesh.geometry.attributes.position.needsUpdate = true;
      m.mesh.geometry.attributes.aAlpha.needsUpdate = true;
    }
  }

  resize() {}

  dispose() {
    for (const m of this.meteors) {
      this.engine.scene.remove(m.mesh);
      m.mesh.geometry.dispose();
      (m.mesh.material as THREE.Material).dispose();
    }
    this.meteors = [];
  }
}
