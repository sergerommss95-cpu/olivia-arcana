/**
 * FlowmapSystem — Mouse displacement field (shader.se-style)
 *
 * Renders an offscreen 512x512 velocity texture. Each frame:
 *   1. Decays the previous frame toward neutral (0.5, 0.5)
 *   2. Paints a Gaussian stamp at the cursor position with the mouse velocity
 *   3. The result is passed as uFlowmap to the nebula shader
 *   4. The nebula shader displaces UV lookups by the flowmap values
 *
 * Result: the nebula image "flows" organically wherever the cursor moves.
 * Decays back to neutral in ~800ms after cursor stops.
 */

import * as THREE from "three";
import { WebGLEngine, type EngineSystem } from "./WebGLEngine";

const FLOW_SIZE = 512;

// ── Flowmap update shader ──
const flowVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const flowFrag = /* glsl */ `
precision highp float;

uniform sampler2D uPrevFlow;
uniform vec2 uMouse;
uniform vec2 uLastMouse;
uniform float uAspect;
uniform float uStrength;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Read previous frame and decay toward neutral (0.5 = no displacement)
  vec3 flow = texture2D(uPrevFlow, uv).rgb;
  flow = mix(flow, vec3(0.5, 0.5, 0.0), 0.045); // ~22 frames to fully decay

  // Mouse velocity vector
  vec2 velocity = (uMouse - uLastMouse) * uStrength;

  // Aspect-correct distance to current mouse position
  vec2 cursor = uMouse;
  vec2 pos = uv;
  pos.x *= uAspect;
  cursor.x *= uAspect;
  float dist = distance(pos, cursor);

  // Gaussian stamp — wide, soft falloff
  float radius = 0.12;
  float stamp = exp(-dist * dist / (2.0 * radius * radius));
  stamp *= smoothstep(radius * 2.5, 0.0, dist);

  // Encode velocity into RG channels (0.5 = neutral)
  // STRONG encoding — must produce visible displacement
  flow.rg = mix(flow.rg, clamp(velocity * 8.0 + 0.5, 0.0, 1.0), stamp * 0.85);
  flow.b = mix(flow.b, stamp, 0.6);

  gl_FragColor = vec4(flow, 1.0);
}`;

export class FlowmapSystem implements EngineSystem {
  private engine!: WebGLEngine;

  // Ping-pong render targets
  private rtA!: THREE.WebGLRenderTarget;
  private rtB!: THREE.WebGLRenderTarget;
  private flowScene!: THREE.Scene;
  private flowCamera!: THREE.OrthographicCamera;
  private flowMaterial!: THREE.ShaderMaterial;
  private flowMesh!: THREE.Mesh;
  private current = 0; // which RT is current (0=A, 1=B)

  private lastMouse = new THREE.Vector2(0.5, 0.5);
  private mouseInitialized = false;
  private connectedUniform: { value: THREE.Texture | null } | null = null;

  /** The current flowmap texture — other systems read this */
  get texture(): THREE.Texture {
    return this.current === 0 ? this.rtA.texture : this.rtB.texture;
  }

  /** Connect the flowmap output to another system's uniform */
  connectTo(uniform: { value: THREE.Texture | null }) {
    this.connectedUniform = uniform;
  }

  init(engine: WebGLEngine) {
    this.engine = engine;

    // Create two render targets for ping-pong
    const rtOpts: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    };
    this.rtA = new THREE.WebGLRenderTarget(FLOW_SIZE, FLOW_SIZE, rtOpts);
    this.rtB = new THREE.WebGLRenderTarget(FLOW_SIZE, FLOW_SIZE, rtOpts);

    // Initialize both to neutral gray (0.5 = no displacement)
    const initData = new Uint8Array(FLOW_SIZE * FLOW_SIZE * 4);
    for (let i = 0; i < FLOW_SIZE * FLOW_SIZE; i++) {
      initData[i * 4] = 128;     // R = 0.5
      initData[i * 4 + 1] = 128; // G = 0.5
      initData[i * 4 + 2] = 0;   // B = 0
      initData[i * 4 + 3] = 255; // A = 1
    }
    const initTex = new THREE.DataTexture(initData, FLOW_SIZE, FLOW_SIZE);
    initTex.needsUpdate = true;

    // Offscreen scene for flowmap updates
    this.flowCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.flowScene = new THREE.Scene();

    this.flowMaterial = new THREE.ShaderMaterial({
      vertexShader: flowVert,
      fragmentShader: flowFrag,
      uniforms: {
        uPrevFlow: { value: initTex },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uLastMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: engine.resolution.x / engine.resolution.y },
        uStrength: { value: 0.6 },
      },
    });

    this.flowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.flowMaterial);
    this.flowMesh.frustumCulled = false;
    this.flowScene.add(this.flowMesh);
  }

  update(_time: number, _dt: number) {
    const renderer = this.engine.renderer;
    const mouse = this.engine.smoothMouse;

    // Initialize last mouse on first frame
    if (!this.mouseInitialized) {
      this.lastMouse.copy(mouse);
      this.mouseInitialized = true;
    }

    // Determine ping-pong targets
    const readRT = this.current === 0 ? this.rtA : this.rtB;
    const writeRT = this.current === 0 ? this.rtB : this.rtA;

    // Update uniforms
    const u = this.flowMaterial.uniforms;
    u.uPrevFlow.value = readRT.texture;
    u.uMouse.value.copy(mouse);
    u.uLastMouse.value.copy(this.lastMouse);
    u.uAspect.value = this.engine.resolution.x / this.engine.resolution.y;

    // Scale strength by mouse velocity (subtle when still, strong when moving fast)
    const vel = mouse.distanceTo(this.lastMouse);
    u.uStrength.value = 0.3 + Math.min(vel * 50, 1.5);

    // Render flowmap update to writeRT
    const prevRT = renderer.getRenderTarget();
    renderer.setRenderTarget(writeRT);
    renderer.render(this.flowScene, this.flowCamera);
    renderer.setRenderTarget(prevRT);

    // Swap
    this.current = 1 - this.current;
    this.lastMouse.copy(mouse);

    // Push current flowmap texture to connected uniform (ping-pong safe)
    if (this.connectedUniform) {
      this.connectedUniform.value = this.texture;
    }
  }

  resize(w: number, h: number) {
    if (this.flowMaterial) {
      this.flowMaterial.uniforms.uAspect.value = w / h;
    }
  }

  dispose() {
    this.rtA?.dispose();
    this.rtB?.dispose();
    this.flowMaterial?.dispose();
    this.flowMesh?.geometry.dispose();
  }
}
