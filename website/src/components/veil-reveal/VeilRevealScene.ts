/**
 * VeilRevealScene -- the complete Three.js veil-reveal ceremony.
 *
 * Assembles PBD cloth physics, glass-like veil material, shader-based
 * card reveal with top-to-bottom wipe, bloom post-processing, filmic
 * grading, and interactive hold-to-reveal mechanics.
 *
 * Designed for integration into the Olivia Arcana Next.js site where
 * a global Starfield component provides the cosmic background -- this
 * scene renders with alpha:true and scene.background = null.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { PBDCloth } from './PBDCloth';
import { VeilAudio } from './VeilAudio';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface VeilRevealConfig {
  container: HTMLDivElement;
  cardImagePath: string;
  isMobile: boolean;
  reducedMotion: boolean;
  onRevealComplete: () => void;
  onProgress: (progress: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLS = 48;
const ROWS = 64;
const CLOTH_W = 3.6;
const CLOTH_H = 4.8;
const FIXED_DT = 1 / 60;
const HOLD_THRESHOLD = 1.3; // seconds to hold before reveal triggers

// Reveal choreography timing (seconds)
const REVEAL_PIN_RELEASE = 1.6;
const WIND_DURATION = 3.0;
const CARD_FADE_START = 1.2;
const CARD_FADE_DURATION = 2.0;
const VEIL_HIDE_TIME = 5.5;
const CAMERA_DOLLY_START = 0.0;
const CAMERA_DOLLY_END = 5.0;
const CAMERA_Z_START = 7.4;
const CAMERA_Z_END = 6.55;
const INTRO_DURATION = 2.2;
const INTRO_DELAY = 0.25;

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------
// Background nebula shader (dark cosmic backdrop for veil reflections)
// ---------------------------------------------------------------
const BG_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BG_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec2  uMouse;
uniform float uIntro;
varying vec2  vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.07 + vec2(0.13, -0.21);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(1.0, 0.85);
  vec2 m = uMouse * 0.18;
  float mDist = length(p - m);
  vec2 warp = normalize(p - m + 0.0001) * exp(-mDist * 1.4) * 0.03;
  vec2 q = (p - warp) * 2.6 + vec2(uTime * 0.012, uTime * 0.008);
  float n1 = fbm(q);
  float n2 = fbm(q * 1.6 + vec2(2.7, -1.1));
  float n3 = fbm(q * 3.1 + vec2(-1.8, 0.9));
  vec3 deep   = vec3(0.012, 0.018, 0.055);
  vec3 indigo = vec3(0.10, 0.06, 0.30);
  vec3 violet = vec3(0.32, 0.10, 0.55);
  vec3 cyan   = vec3(0.10, 0.45, 0.78);
  vec3 gold   = vec3(0.85, 0.62, 0.28);
  vec3 col = mix(deep, indigo, smoothstep(0.30, 0.75, n1));
  col = mix(col, violet, smoothstep(0.40, 0.85, n2) * 0.7);
  col += cyan * smoothstep(0.55, 0.95, n3) * 0.45;
  col += gold * smoothstep(0.78, 1.0, n3) * 0.30;
  float halo = exp(-mDist * 7.0) * 0.12;
  col += vec3(0.40, 0.58, 0.95) * halo;
  vec2 cs1 = vec2(380.0);
  vec2 c1  = floor(vUv * cs1);
  vec2 ic1 = fract(vUv * cs1) - 0.5;
  float h1 = hash(c1);
  float m1 = step(0.985, h1);
  col += vec3(0.95, 0.98, 1.0) * exp(-dot(ic1, ic1) * 80.0) * m1 * 0.85;
  vec2 cs2 = vec2(120.0);
  vec2 c2  = floor(vUv * cs2);
  vec2 ic2 = fract(vUv * cs2) - 0.5;
  float h2 = hash(c2 + 0.37);
  float m2 = step(0.978, h2);
  col += vec3(1.0, 0.92, 0.78) * exp(-dot(ic2, ic2) * 30.0) * m2 * 1.05;
  float vig = 1.0 - length(vUv - 0.5) * 1.35;
  col *= clamp(vig, 0.32, 1.0);
  col *= uIntro;
  gl_FragColor = vec4(col, 1.0);
}
`;

const CARD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CARD_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uBurst;
  uniform float uTime;
  uniform float uRevealed;
  uniform float uWipe;
  varying vec2 vUv;

  void main() {
    vec4 c = texture2D(uMap, vUv);

    // --- Top-to-bottom wipe reveal ---
    float safeWipe = clamp(uWipe, -0.2, 1.2);
    float revealLine = 1.0 - safeWipe;
    float softness = 0.07;
    // smoothstep(a,b,x): 0 when x<=a, 1 when x>=b  (a < b guaranteed)
    float wipeMask = smoothstep(revealLine - softness, revealLine + softness, vUv.y);

    // --- Animated glass shine: diagonal highlight sweep ---
    float diag = vUv.x * 0.7 + vUv.y * 0.3;
    float sweepPos = fract(uTime * 0.08);
    float sweep = smoothstep(sweepPos - 0.12, sweepPos, diag)
                * smoothstep(sweepPos + 0.12, sweepPos, diag);
    float shineStrength = sweep * 0.18 * uRevealed;

    // Subtle edge specular
    float edgeX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    float edgeY = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
    float edgeGlow = (1.0 - edgeX * edgeY) * 0.08 * uRevealed;

    // Gold line shimmer
    float luminance = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float shimmer = sin(uTime * 3.0 + vUv.x * 40.0 + vUv.y * 30.0) * 0.5 + 0.5;
    float goldShimmer = shimmer * luminance * 0.12 * uRevealed;

    // Wipe edge glow - symmetric soft blue-white light from behind the card
    float edgeDist = abs(vUv.y - revealLine);

    // Two-layer glow: tight inner white core + wider outer blue halo
    float edgeCore  = (1.0 - smoothstep(0.0, 0.025, edgeDist)) * (1.0 - wipeMask);
    float edgeHalo  = (1.0 - smoothstep(0.0, 0.09,  edgeDist)) * (1.0 - wipeMask) * 0.45;

    // Chromatic split: red lags, blue leads (gives glassy refraction feel)
    float edgeR = (1.0 - smoothstep(0.0, 0.04, abs(vUv.y - (revealLine + 0.004)))) * (1.0 - wipeMask);
    float edgeB = (1.0 - smoothstep(0.0, 0.04, abs(vUv.y - (revealLine - 0.004)))) * (1.0 - wipeMask);

    vec3 col = c.rgb;
    vec3 shineTint = vec3(1.0, 0.95, 0.82);
    col += shineTint * shineStrength;
    col += shineTint * edgeGlow;
    col += vec3(1.0, 0.88, 0.55) * goldShimmer;

    // Cool white core + blue-violet halo
    col += vec3(edgeR * 0.9, edgeCore * 1.0, edgeB * 1.0) * edgeCore * 0.7;
    col += vec3(0.55, 0.68, 1.0) * edgeHalo * 0.5;

    // Subtle gold line (reduced from original)
    float edgeGlowLine = edgeHalo * 0.15;
    col += vec3(1.0, 0.90, 0.65) * edgeGlowLine;

    // Burst glow
    vec3 glow = vec3(1.05, 0.92, 0.65);
    col += glow * uBurst;
    float rad = length(vUv - 0.5);
    float halo = (1.0 - smoothstep(0.0, 0.75, rad)) * uBurst * 1.4;
    col += glow * halo;

    gl_FragColor = vec4(col, c.a * wipeMask);
  }
`;

const FILMIC_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FILMIC_FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uAmount;
  uniform float uVignette;
  uniform float uGrain;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;

    // Radial chromatic aberration
    float rad = length(center);
    vec2 dir = normalize(center + 1e-6);
    float caScale = rad * uAmount;

    float r = texture2D(tDiffuse, uv - dir * caScale * 1.6).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv + dir * caScale * 1.6).b;
    vec3 col = vec3(r, g, b);

    // Vignette
    float vig = smoothstep(1.0, 0.25, rad * uVignette);
    col *= mix(0.55, 1.0, vig);

    // Film grain
    float grain = hash(uv * vec2(1920.0, 1080.0) + uTime * 37.0) - 0.5;
    col += grain * uGrain;

    // Split-tone: cool shadows, warm highlights
    vec3 shadow    = vec3(0.85, 0.92, 1.08);
    vec3 highlight = vec3(1.08, 1.02, 0.92);
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col *= mix(shadow, highlight, smoothstep(0.2, 0.85, lum));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Scene class
// ---------------------------------------------------------------------------

export class VeilRevealScene {
  private config: VeilRevealConfig;

  // Core Three.js
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private filmicPass: ShaderPass | null = null;

  // Meshes & materials
  private cardMesh: THREE.Mesh;
  private cardMaterial: THREE.ShaderMaterial;
  private veilMesh: THREE.Mesh;
  private veilMaterial: THREE.MeshPhysicalMaterial;
  private veilGeometry: THREE.BufferGeometry;

  // Textures
  private cardTexture: THREE.Texture | null = null;
  private veilTexture: THREE.Texture;
  private placeholderTex: THREE.DataTexture;
  private envTexture: THREE.Texture;

  // Physics
  private cloth: PBDCloth;

  // Audio
  private audio: VeilAudio;

  // Interaction state
  private mouseScreen = new THREE.Vector2(0, 0);
  private mouseWorld = new THREE.Vector3(50, 50, 0.3);
  private raycaster = new THREE.Raycaster();
  private veilPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.3);
  private mouseEverMoved = false;
  private cameraParallax = new THREE.Vector2(0, 0);
  private cameraParallaxTarget = new THREE.Vector2(0, 0);

  // Hold state
  private holdStartMs: number | null = null;
  private revealed = false;
  private revealStartMs: number | null = null;
  private revealCameraZ = CAMERA_Z_START;

  // Animation loop
  private rafId: number | null = null;
  private accumulator = 0;
  private lastMs = 0;
  private pageLoadMs = 0;

  // Bound event handlers (stored for cleanup)
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: () => void;
  private onTouchStart: (e: TouchEvent) => void;
  private onTouchEnd: () => void;
  private onResize: () => void;

  // Helpers
  private pmrem: THREE.PMREMGenerator;
  private bgMaterial: THREE.ShaderMaterial;

  constructor(config: VeilRevealConfig) {
    this.config = config;
    this.audio = new VeilAudio();

    const { container, cardImagePath, isMobile } = config;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // ---------------------------------------------------------------
    // Renderer
    // ---------------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // ---------------------------------------------------------------
    // Scene (no background -- Starfield shows through)
    // ---------------------------------------------------------------
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04020d); // match site void color

    // ---------------------------------------------------------------
    // Camera
    // ---------------------------------------------------------------
    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    this.camera.position.set(0, 0, CAMERA_Z_START);
    this.camera.lookAt(0, 0, 0);

    // ---------------------------------------------------------------
    // Lights
    // ---------------------------------------------------------------
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const key = new THREE.DirectionalLight(0xcdd8ff, 1.0);
    key.position.set(3, 1, 5);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xc790ff, 0.55);
    rim.position.set(-4, 2, -2);
    this.scene.add(rim);

    // ---------------------------------------------------------------
    // Environment map (procedural room for glass reflections)
    // ---------------------------------------------------------------
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.pmrem.compileEquirectangularShader();
    this.envTexture = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;

    // ---------------------------------------------------------------
    // Background nebula plane (dark cosmic backdrop for veil reflections)
    // ---------------------------------------------------------------
    this.bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uIntro: { value: 0 },
      },
      vertexShader: BG_VERTEX,
      fragmentShader: BG_FRAGMENT,
      depthWrite: false,
    });
    const bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 24),
      this.bgMaterial,
    );
    bgMesh.position.z = -8;
    this.scene.add(bgMesh);

    // ---------------------------------------------------------------
    // Card mesh
    // ---------------------------------------------------------------
    this.placeholderTex = new THREE.DataTexture(
      new Uint8Array([8, 8, 30, 255]),
      1,
      1,
      THREE.RGBAFormat,
    );
    this.placeholderTex.needsUpdate = true;

    this.cardMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.placeholderTex },
        uOpacity: { value: 0.0 },
        uBurst: { value: 0.0 },
        uTime: { value: 0.0 },
        uRevealed: { value: 0.0 },
        uWipe: { value: -0.2 },
      },
      vertexShader: CARD_VERTEX,
      fragmentShader: CARD_FRAGMENT,
      transparent: true,
      depthWrite: true,
    });

    this.cardMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 3.6),
      this.cardMaterial,
    );
    this.cardMesh.position.set(0, 0, -0.1);
    this.cardMesh.renderOrder = -1;
    this.cardMesh.scale.set(0.94, 0.94, 1);
    this.scene.add(this.cardMesh);

    // Load the card texture
    this.loadCardTexture(cardImagePath);

    // ---------------------------------------------------------------
    // Cloth physics
    // ---------------------------------------------------------------
    this.cloth = new PBDCloth(COLS, ROWS, CLOTH_W, CLOTH_H);

    // Pre-settle: 240 steps for a natural catenary drape
    for (let i = 0; i < 240; i++) {
      this.cloth.step(FIXED_DT, -5.0);
    }

    // ---------------------------------------------------------------
    // Veil mesh (zero-copy positions from cloth)
    // ---------------------------------------------------------------
    this.veilGeometry = this.buildClothGeometry();

    const textureLoader = new THREE.TextureLoader();
    this.veilTexture = textureLoader.load('/textures/veil.jpg');
    this.veilTexture.colorSpace = THREE.SRGBColorSpace;
    this.veilTexture.anisotropy = 16;

    this.veilMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: this.veilTexture,
      emissive: 0xffffff,
      emissiveMap: this.veilTexture,
      emissiveIntensity: 0,
      roughness: 0.18,
      metalness: 0.0,
      transmission: 0,
      thickness: 0.45,
      ior: 1.42,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      iridescence: 0.85,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [200, 800],
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.veilMesh = new THREE.Mesh(this.veilGeometry, this.veilMaterial);
    this.veilMesh.frustumCulled = false;
    this.veilMesh.renderOrder = 1;
    this.scene.add(this.veilMesh);

    // ---------------------------------------------------------------
    // Post-processing
    // ---------------------------------------------------------------
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(
      Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    );
    this.composer.setSize(width, height);

    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      isMobile ? 0.25 : 0.35,   // strength (tamed for dark bg)
      0.6,                        // radius
      0.85,                       // threshold (higher = only bright peaks bloom)
    );
    this.composer.addPass(this.bloomPass);

    // Filmic pass (skip on mobile for perf)
    if (!isMobile) {
      this.filmicPass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          uTime: { value: 0 },
          uAmount: { value: 0.0035 },
          uVignette: { value: 1.1 },
          uGrain: { value: 0.04 },
        },
        vertexShader: FILMIC_VERTEX,
        fragmentShader: FILMIC_FRAGMENT,
      });
      this.composer.addPass(this.filmicPass);
    }

    this.composer.addPass(new OutputPass());

    // ---------------------------------------------------------------
    // Event listeners
    // ---------------------------------------------------------------
    this.onMouseMove = (e: MouseEvent) => {
      this.projectMouseToVeil(e.clientX, e.clientY);
      if (!this.mouseEverMoved) this.mouseEverMoved = true;
      this.cameraParallaxTarget.set(this.mouseWorld.x, this.mouseWorld.y);
    };

    this.onMouseDown = (e: MouseEvent) => {
      if (this.revealed) return;
      this.holdStartMs = performance.now();
      this.projectMouseToVeil(e.clientX, e.clientY);
    };

    this.onMouseUp = () => {
      if (this.revealed) return;
      if (this.holdStartMs !== null) {
        const heldFor = (performance.now() - this.holdStartMs) / 1000;
        if (heldFor < HOLD_THRESHOLD) this.holdStartMs = null;
      }
    };

    this.onTouchStart = (e: TouchEvent) => {
      if (this.revealed || !e.touches.length) return;
      const t = e.touches[0];
      this.holdStartMs = performance.now();
      this.projectMouseToVeil(t.clientX, t.clientY);
      if (!this.mouseEverMoved) this.mouseEverMoved = true;
      this.cameraParallaxTarget.set(this.mouseWorld.x, this.mouseWorld.y);
    };

    this.onTouchEnd = () => {
      if (this.revealed) return;
      if (this.holdStartMs !== null) {
        const heldFor = (performance.now() - this.holdStartMs) / 1000;
        if (heldFor < HOLD_THRESHOLD) this.holdStartMs = null;
      }
    };

    this.onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.bloomPass.resolution.set(w, h);
    };

    container.addEventListener('mousedown', this.onMouseDown);
    container.addEventListener('mouseup', this.onMouseUp);
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('touchstart', this.onTouchStart, {
      passive: true,
    });
    container.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('resize', this.onResize);

    this.pageLoadMs = performance.now();
    this.lastMs = this.pageLoadMs;
  }

  // =================================================================
  // Public API
  // =================================================================

  /** Begin the animation loop. */
  start(): void {
    this.lastMs = performance.now();
    this.animate();
  }

  /** Programmatic reveal (for testing or reduced-motion). */
  triggerReveal(): void {
    if (this.revealed) return;
    this.revealed = true;
    this.revealStartMs = performance.now();
    this.holdStartMs = null;

    if (!this.config.reducedMotion) {
      this.audio.resume();
      this.audio.playWhoosh(3.4);
      this.audio.playChimes(2.9);
    }

    if (this.config.reducedMotion) {
      this.cardMaterial.uniforms.uWipe.value = 1.2;
      this.cardMaterial.uniforms.uRevealed.value = 1;
      this.cardMesh.scale.set(1, 1, 1);
      this.veilMesh.visible = false;
      this.config.onRevealComplete();
    } else {
      setTimeout(() => {
        this.config.onRevealComplete();
      }, 7000);
    }
  }

  /**
   * Reset the scene for a new card reveal.
   * Resets cloth to its settled drape, reloads the card texture,
   * and returns all uniforms to initial state.
   */
  reset(newCardImagePath: string): void {
    this.revealed = false;
    this.revealStartMs = null;
    this.revealCameraZ = CAMERA_Z_START;

    // Reset card uniforms
    this.cardMaterial.uniforms.uOpacity.value = 0;
    this.cardMaterial.uniforms.uBurst.value = 0;
    this.cardMaterial.uniforms.uRevealed.value = 0;
    this.cardMaterial.uniforms.uWipe.value = -0.2;
    this.cardMesh.scale.set(0.94, 0.94, 1);

    // Show veil
    this.veilMesh.visible = true;

    // Load new card texture
    this.loadCardTexture(newCardImagePath);

    // Reset the cloth to its settled state
    const cloth = this.cloth;
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const idx3 = (j * COLS + i) * 3;
        const x = (i / (COLS - 1) - 0.5) * CLOTH_W;
        const y = (0.5 - j / (ROWS - 1)) * CLOTH_H;
        cloth.positions[idx3] = x;
        cloth.positions[idx3 + 1] = y;
        cloth.positions[idx3 + 2] = 0;
        cloth.previous[idx3] = x;
        cloth.previous[idx3 + 1] = y;
        cloth.previous[idx3 + 2] = 0;
        cloth.velocities[idx3] = 0;
        cloth.velocities[idx3 + 1] = 0;
        cloth.velocities[idx3 + 2] = 0;
      }
    }
    cloth.pinned.fill(0);
    for (let i = 0; i < COLS; i++) cloth.pinned[i] = 1;
    for (let i = 0; i < 240; i++) cloth.step(FIXED_DT, -5.0);
  }

  /** Full teardown -- dispose all GPU resources and remove the canvas. */
  dispose(): void {
    // Stop animation
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Remove event listeners
    const { container } = this.config;
    container.removeEventListener('mousedown', this.onMouseDown);
    container.removeEventListener('mouseup', this.onMouseUp);
    container.removeEventListener('mousemove', this.onMouseMove);
    container.removeEventListener('touchstart', this.onTouchStart);
    container.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('resize', this.onResize);

    // Dispose Three.js objects
    this.cardMaterial.dispose();
    (this.cardMesh.geometry as THREE.BufferGeometry).dispose();
    this.veilMaterial.dispose();
    this.veilGeometry.dispose();
    this.placeholderTex.dispose();
    this.veilTexture.dispose();
    if (this.cardTexture) this.cardTexture.dispose();
    this.envTexture.dispose();
    this.pmrem.dispose();

    // Dispose post-processing
    this.composer.dispose();

    // Dispose renderer and remove canvas
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }
  }

  // =================================================================
  // Private: texture loading
  // =================================================================

  private loadCardTexture(path: string): void {
    const loader = new THREE.TextureLoader();
    loader.load(path, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (this.cardTexture) this.cardTexture.dispose();
      this.cardTexture = tex;
      this.cardMaterial.uniforms.uMap.value = tex;
    });
  }

  // =================================================================
  // Private: geometry builder
  // =================================================================

  private buildClothGeometry(): THREE.BufferGeometry {
    const cloth = this.cloth;
    const g = new THREE.BufferGeometry();

    // Zero-copy: share the cloth positions Float32Array directly
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(cloth.positions, 3),
    );

    const uvs = new Float32Array(cloth.n * 2);
    for (let j = 0; j < cloth.rows; j++) {
      for (let i = 0; i < cloth.cols; i++) {
        const idx = (j * cloth.cols + i) * 2;
        uvs[idx] = i / (cloth.cols - 1);
        uvs[idx + 1] = 1 - j / (cloth.rows - 1);
      }
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const indices: number[] = [];
    for (let j = 0; j < cloth.rows - 1; j++) {
      for (let i = 0; i < cloth.cols - 1; i++) {
        const a = j * cloth.cols + i;
        const b = a + 1;
        const c = a + cloth.cols;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    g.setIndex(indices);
    g.computeVertexNormals();

    return g;
  }

  // =================================================================
  // Private: mouse projection
  // =================================================================

  private projectMouseToVeil(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseScreen.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.mouseScreen, this.camera);
    const hit = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.veilPlane, hit);
    if (hit) {
      this.mouseWorld.set(hit.x, hit.y, 0.3);
    }
  }

  // =================================================================
  // Private: reveal choreography
  // =================================================================

  private updateReveal(nowMs: number, dtSec: number): void {
    if (this.revealStartMs === null) return;
    const t = (nowMs - this.revealStartMs) / 1000;
    const cloth = this.cloth;

    // --- Pin release: sweep from centre outward ---
    const progress = Math.min(t / REVEAL_PIN_RELEASE, 1);
    const eased = progress * progress * (3 - 2 * progress); // smoothstep
    const half = COLS >> 1;
    const unpinned = Math.floor(half * eased);
    for (let k = 0; k <= unpinned; k++) {
      cloth.pinned[half - k] = 0;
      cloth.pinned[Math.min(half + k, COLS - 1)] = 0;
    }
    if (progress >= 1) {
      for (let i = 0; i < COLS; i++) cloth.pinned[i] = 0;
    }

    // Report progress
    this.config.onProgress(Math.min(t / 7.0, 1));

    // --- Wind: big initial gust that tapers ---
    if (t < WIND_DURATION) {
      const gustEnvelope = Math.exp(-t * 0.7) * (1 - Math.exp(-t * 4));
      const windX = gustEnvelope * 0.9 * Math.sin(t * 1.8) + 0.35;
      const windZ = gustEnvelope * (-0.5 + Math.sin(t * 2.3) * 0.25);
      cloth.addForce(windX * dtSec, 0, windZ * dtSec);
    }

    // --- Camera dolly-in ---
    if (t > CAMERA_DOLLY_START && t < CAMERA_DOLLY_END) {
      const cp =
        (t - CAMERA_DOLLY_START) / (CAMERA_DOLLY_END - CAMERA_DOLLY_START);
      const ce = 1 - Math.pow(1 - cp, 2.4);
      this.revealCameraZ =
        CAMERA_Z_START + (CAMERA_Z_END - CAMERA_Z_START) * ce;
    }

    // --- Progressive top-to-bottom wipe ---
    if (t > CARD_FADE_START) {
      const cp = Math.min((t - CARD_FADE_START) / CARD_FADE_DURATION, 1);
      const ce = 1 - Math.pow(1 - cp, 2.5);

      this.cardMaterial.uniforms.uWipe.value = -0.2 + ce * 1.4;
      this.cardMaterial.uniforms.uRevealed.value = ce;

      // Gentle scale breathe 0.94 -> 1.0
      const s = 0.94 + ce * 0.06;
      this.cardMesh.scale.set(s, s, 1);

      // Gold burst peaks at ~60% wipe then decays
      const burstT = Math.max(0, (cp - 0.5) * 2);
      this.cardMaterial.uniforms.uBurst.value =
        Math.exp(-burstT * 4.0) * 0.6 * Math.min(burstT * 8, 1);
    }

    // Hide veil after cloth is fully off-screen
    if (t > VEIL_HIDE_TIME) {
      this.veilMesh.visible = false;
    }
  }

  // =================================================================
  // Private: animation loop
  // =================================================================

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);

    const nowMs = performance.now();
    const frameDt = Math.min((nowMs - this.lastMs) / 1000, 0.05);
    this.lastMs = nowMs;
    this.accumulator += frameDt;

    // Fixed 60 Hz physics, max 3 catch-up steps
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < 3) {
      const tSec = nowMs * 0.001;

      // Idle ambient wind (cloth never frozen)
      if (!this.revealed) {
        const breathX =
          Math.sin(tSec * 0.45) * 0.06 +
          Math.sin(tSec * 0.19 + 1.2) * 0.04;
        const breathZ =
          Math.sin(tSec * 0.37 + 0.8) * 0.05 +
          Math.sin(tSec * 0.23 - 0.6) * 0.035;
        this.cloth.addForce(breathX * FIXED_DT, 0, breathZ * FIXED_DT);
      }

      // Mouse repulsion force
      if (this.mouseEverMoved && !this.revealed) {
        this.cloth.applyPointForce(
          this.mouseWorld.x,
          this.mouseWorld.y,
          this.mouseWorld.z,
          0.34,
          0.95,
        );
      }

      // Hold state: attractive tug + pulsing vibration
      if (this.holdStartMs !== null && !this.revealed) {
        const h = Math.min(
          (nowMs - this.holdStartMs) / 1000 / HOLD_THRESHOLD,
          1,
        );
        this.cloth.applyPointForce(
          this.mouseWorld.x,
          this.mouseWorld.y,
          this.mouseWorld.z,
          -0.4 * h * h,
          1.2,
        );
        const pulse =
          Math.sin((nowMs - this.holdStartMs) * 0.045) * 0.5 * h * h;
        this.cloth.addForce(pulse * FIXED_DT, pulse * 0.2 * FIXED_DT, 0);
      }

      const revealGravity = this.revealed
        ? -(5.0 + Math.min((nowMs - (this.revealStartMs ?? nowMs)) * 0.001 * 4.0, 10.0))
        : -5.0;
      this.cloth.step(FIXED_DT, revealGravity);
      this.accumulator -= FIXED_DT;
      steps++;
    }
    // Drop overflow
    if (this.accumulator > FIXED_DT * 3) this.accumulator = 0;

    // Update geometry
    this.veilGeometry.attributes.position.needsUpdate = true;
    this.veilGeometry.computeVertexNormals();
    this.veilGeometry.computeBoundingSphere();

    // Intro fade from darkness
    const introElapsed = Math.max(
      0,
      (nowMs - this.pageLoadMs) / 1000 - INTRO_DELAY,
    );
    const introP = Math.min(introElapsed / INTRO_DURATION, 1);
    const introE =
      introP < 0.5
        ? 4 * introP * introP * introP
        : 1 - Math.pow(-2 * introP + 2, 3) / 2;
    this.veilMaterial.opacity = 0.92 * introE;
    this.veilMaterial.emissiveIntensity = 0.18 * introE;

    // Update background + card time uniforms
    const timeSec = nowMs * 0.001;
    this.bgMaterial.uniforms.uIntro.value = introE;
    this.bgMaterial.uniforms.uTime.value = timeSec;
    this.bgMaterial.uniforms.uMouse.value.set(this.mouseWorld.x, this.mouseWorld.y);
    this.cardMaterial.uniforms.uTime.value = timeSec;

    // Hold progress -> check threshold
    if (this.holdStartMs !== null && !this.revealed) {
      const hold = Math.min(
        (nowMs - this.holdStartMs) / 1000 / HOLD_THRESHOLD,
        1,
      );
      this.config.onProgress(hold * 0.15); // pre-reveal progress (0-15%)
      if (hold >= 1) this.triggerReveal();
    }

    // Camera parallax + dolly
    this.cameraParallax.lerp(this.cameraParallaxTarget, 0.07);
    const parallaxScale = this.revealed ? 0.05 : 0.14;
    this.camera.position.x = this.cameraParallax.x * parallaxScale;
    this.camera.position.y = this.cameraParallax.y * (parallaxScale * 0.5);
    this.camera.position.z = this.revealed ? this.revealCameraZ : CAMERA_Z_START;
    this.camera.lookAt(0, 0, 0);

    // Choreography
    this.updateReveal(nowMs, frameDt);

    // Filmic time
    if (this.filmicPass) {
      this.filmicPass.uniforms.uTime.value = timeSec;
    }

    this.composer.render();
  };
}
