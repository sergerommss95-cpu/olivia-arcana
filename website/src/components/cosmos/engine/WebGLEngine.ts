/**
 * WebGLEngine — Core Three.js renderer for Olivia Arcana
 *
 * Manages: WebGLRenderer, scene, camera, animation loop, mouse tracking, resize.
 * The canvas is position:fixed behind all content. Systems (nebula, stars,
 * flowmap, post-processing) attach via registerSystem().
 */

import * as THREE from "three";

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

    // Perspective camera: stars exist in 3D depth, nebula plane is at z=0
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
    this.camera.position.z = 1;
    this.scene = new THREE.Scene();

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

      const nebula = this.systemMap.get("nebula") as any;
      if (nebula?.uniforms) {
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
      this.renderer.render(this.scene, this.camera);

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
