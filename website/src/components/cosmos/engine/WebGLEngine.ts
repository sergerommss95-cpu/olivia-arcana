/**
 * WebGLEngine — Core Three.js renderer for Olivia Arcana
 *
 * Manages: WebGLRenderer, scene, camera, animation loop, mouse tracking, resize.
 * The canvas is position:fixed behind all content. Systems (nebula, stars,
 * flowmap, post-processing) attach via registerSystem().
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export interface EngineSystem {
  init(engine: WebGLEngine): void;
  update(time: number, dt: number): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

export class WebGLEngine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;

  // Uniforms shared across all systems
  time = 0;
  mouse = new THREE.Vector2(0.5, 0.5);       // raw mouse (normalized 0-1)
  smoothMouse = new THREE.Vector2(0.5, 0.5);  // spring-physics smoothed
  mouseVelocity = 0;
  resolution = new THREE.Vector2();

  private systems: EngineSystem[] = [];
  private systemMap = new Map<string, EngineSystem>();
  private raf = 0;
  private lastTime = 0;
  private prevMouse = new THREE.Vector2(0.5, 0.5);
  private disposed = false;
  private composer!: EffectComposer;
  private filmicPass!: ShaderPass;

  // Cosmic activation animation state (luxury: gentle nebula glow only)
  private brightFlash = 0;

  // Scroll-driven camera
  scrollProgress = 0; // 0 = top, 1 = one viewport down

  // Spring physics state (shader.se-style weighted cursor)
  private springVelocity = new THREE.Vector2(0, 0);
  private readonly SPRING_STIFFNESS = 0.08;
  private readonly SPRING_DAMPING = 0.82;

  constructor(container: HTMLElement) {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "default",
      stencil: false,
      depth: false,
    });

    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x04020d, 1);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    container.appendChild(this.canvas);

    // ── Post-processing compositor ──
    this.composer = new EffectComposer(this.renderer);

    // Perspective camera: stars exist in 3D depth, nebula plane is at z=0
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
    this.camera.position.z = 1;
    this.scene = new THREE.Scene();

    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.filmicPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0.0 },
        uGrain: { value: 0.025 },
        uVignette: { value: 0.9 },
        uCursorVelocity: { value: 0.0 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `precision highp float;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGrain;
uniform float uVignette;
uniform float uCursorVelocity;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec2 uv = vUv;
  vec2 center = uv - 0.5;

  float ca = uCursorVelocity * 0.003;
  vec2 caDir = normalize(center + vec2(0.0001));
  float r = texture2D(tDiffuse, uv - caDir * ca * 1.4).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv + caDir * ca * 1.4).b;
  vec4 c = vec4(r, g, b, 1.0);

  float grain = hash(uv * vec2(1920.0, 1080.0) + uTime * 37.0) - 0.5;
  c.rgb += grain * uGrain;

  float d = length(center);
  c.rgb *= 1.0 - smoothstep(0.5, 1.0, d) * uVignette;

  vec3 shadow = vec3(0.86, 0.92, 1.08);
  vec3 highlight = vec3(1.08, 1.02, 0.92);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb *= mix(shadow, highlight, smoothstep(0.2, 0.85, lum));

  gl_FragColor = c;
}`,
    });
    this.composer.addPass(this.filmicPass);
    this.composer.addPass(new OutputPass());

    // Resize
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("mousemove", this.handleMouse, { passive: true });
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("cosmos:shockwave", this.handleShockwave as EventListener);
    window.addEventListener("cosmos:reset", this.handleReset as EventListener);
  }

  private handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.resolution.set(w, h);
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    for (const sys of this.systems) sys.resize(w, h);
  };

  private handleMouse = (e: MouseEvent) => {
    this.mouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  };

  private handleScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  };

  registerSystem(system: EngineSystem, name?: string) {
    system.init(this);
    this.systems.push(system);
    if (name) this.systemMap.set(name, system);
  }

  getSystem<T extends EngineSystem>(name: string): T | undefined {
    return this.systemMap.get(name) as T | undefined;
  }

  // ── Cosmic Activation: gentle nebula glow ──
  private handleShockwave = () => {
    this.brightFlash = 0.5;
  };

  private handleReset = () => {
    this.brightFlash = 0;
  };

  start() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      if (this.disposed) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.033); // cap at ~30fps min
      this.lastTime = now;
      this.time += dt;

      // Spring physics mouse (shader.se-style: weighted, elastic, overshoots slightly)
      const dx = this.mouse.x - this.smoothMouse.x;
      const dy = this.mouse.y - this.smoothMouse.y;
      this.springVelocity.x += dx * this.SPRING_STIFFNESS;
      this.springVelocity.y += dy * this.SPRING_STIFFNESS;
      this.springVelocity.x *= this.SPRING_DAMPING;
      this.springVelocity.y *= this.SPRING_DAMPING;
      this.smoothMouse.x += this.springVelocity.x;
      this.smoothMouse.y += this.springVelocity.y;

      // Mouse velocity (for chromatic aberration intensity)
      this.mouseVelocity = this.smoothMouse.distanceTo(this.prevMouse) / Math.max(dt, 0.001);
      this.prevMouse.copy(this.smoothMouse);

      // ── Animate cosmic nebula glow ──
      this.brightFlash *= 0.94; // gentle decay (~1s)
      if (this.brightFlash < 0.01) this.brightFlash = 0;

      const nebula = this.systemMap.get("nebula") as {
        uniforms?: {
          uBrightFlash?: { value: number };
        };
      } | undefined;
      if (nebula?.uniforms?.uBrightFlash) {
        nebula.uniforms.uBrightFlash.value = this.brightFlash;
      }

      // Scroll-driven camera: drift deeper into cosmos as user scrolls
      const targetZ = 1 - this.scrollProgress * 0.3; // 1.0 → 0.7
      this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
      // Subtle tilt based on scroll
      this.camera.rotation.x = this.scrollProgress * 0.03;

      // Update all systems
      for (const sys of this.systems) sys.update(this.time, dt);

      // Render
      if (this.filmicPass) {
        this.filmicPass.uniforms.uTime.value = this.time;
        const targetVel = Math.min(this.mouseVelocity * 0.6, 1.0);
        this.filmicPass.uniforms.uCursorVelocity.value +=
          (targetVel - this.filmicPass.uniforms.uCursorVelocity.value) * 0.12;
      }
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }

      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("mousemove", this.handleMouse);
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("cosmos:shockwave", this.handleShockwave as EventListener);
    window.removeEventListener("cosmos:reset", this.handleReset as EventListener);
    for (const sys of this.systems) sys.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  /** Check if WebGL2 is available before constructing */
  static isSupported(): boolean {
    try {
      const c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    } catch { return false; }
  }
}
