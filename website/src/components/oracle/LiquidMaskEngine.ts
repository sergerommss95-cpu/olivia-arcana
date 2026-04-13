/**
 * LiquidMaskEngine — Pure WebGL liquid mask reveal.
 * v2: richer edge glow, liquid-edge noise, velocity-reactive radius,
 *     enter/leave transitions, ambient marble shimmer.
 */

const VERT = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = vec2(aPosition.x * 0.5 + 0.5, -aPosition.y * 0.5 + 0.5);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const FRAG = `
  precision highp float;

  uniform sampler2D uBase;
  uniform sampler2D uReveal;
  uniform vec2  uMouse;
  uniform float uTime;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uFeather;
  uniform float uVelocity;      // cursor speed 0–1
  uniform float uPresence;      // 0 = cursor outside, 1 = inside (animated)
  uniform float uMirror;        // 1.0 = flip reveal U for selfie mirror, 0.0 = normal

  varying vec2 vUv;

  // ── Noise ──
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = vUv;

    // Aspect-corrected distance from cursor
    vec2 diff = uv - uMouse;
    diff.x *= uAspect;
    float dist = length(diff);

    // ── Dynamic radius: grows slightly with velocity ──
    float dynRadius = uRadius * uPresence + uVelocity * 0.04;
    float dynFeather = uFeather + uVelocity * 0.02;

    // ── Liquid edge: noise displaces the mask boundary ──
    float edgeNoise = noise(uv * 12.0 + uTime * 0.4) * 0.025
                    + noise(uv * 24.0 - uTime * 0.6) * 0.012;
    float noisyDist = dist + edgeNoise * uPresence;

    // ── Soft circular mask ──
    float mask = 1.0 - smoothstep(dynRadius - dynFeather, dynRadius + dynFeather * 0.25, noisyDist);

    // ── Sample textures ──
    vec4 base   = texture2D(uBase, uv);
    vec2 revealUv = uMirror > 0.5 ? vec2(1.0 - uv.x, uv.y) : uv;
    vec4 reveal = texture2D(uReveal, revealUv);

    // ── Blend ──
    vec3 color = mix(base.rgb, reveal.rgb, mask);

    // ── Edge glow — multi-layer chromatic ring ──
    float edgeInner = smoothstep(dynRadius - dynFeather * 2.8, dynRadius - dynFeather * 0.4, noisyDist);
    float edgeOuter = 1.0 - smoothstep(dynRadius - dynFeather * 0.2, dynRadius + dynFeather * 1.0, noisyDist);
    float edge = edgeInner * edgeOuter;

    // Rotating iridescent colour
    float edgeAngle = atan(diff.y, diff.x);
    float hueShift = edgeAngle * 2.0 + uTime * 0.35;
    vec3 edgeColor = mix(
      vec3(0.85, 0.72, 0.25),   // celestial gold
      vec3(0.50, 0.44, 0.98),   // slate blue
      sin(hueShift) * 0.5 + 0.5
    );
    // Add a cyan accent on the opposite phase
    edgeColor += vec3(0.15, 0.55, 0.65) * (sin(hueShift + 2.09) * 0.5 + 0.5) * 0.4;

    // Breathing pulse on the glow intensity
    float breathe = 0.85 + sin(uTime * 1.8) * 0.15;
    color += edgeColor * edge * 0.55 * breathe * uPresence;

    // ── Micro chromatic aberration at mask edge ──
    float caAmount = edge * 0.006 * uPresence;
    if (caAmount > 0.001) {
      vec2 caDir = normalize(diff + 0.0001);
      float rShift = texture2D(uReveal, revealUv + caDir * caAmount).r;
      float bShift = texture2D(uReveal, revealUv - caDir * caAmount).b;
      color.r = mix(color.r, rShift, mask * 0.35);
      color.b = mix(color.b, bShift, mask * 0.35);
    }

    // ── Warm glow on revealed face ──
    color += vec3(0.08, 0.04, 0.02) * mask * uPresence;

    // ── Ambient marble shimmer (subtle specular crawl on base) ──
    float shimmer = noise(uv * 8.0 + uTime * 0.15) * noise(uv * 16.0 - uTime * 0.1);
    float baseLum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
    color += base.rgb * shimmer * 0.08 * smoothstep(0.4, 0.8, baseLum) * (1.0 - mask);

    // ── Vignette ──
    float vig = 1.0 - length(vUv - 0.5) * 1.2;
    color *= clamp(vig, 0.5, 1.0);

    // ── Film grain ──
    float grain = (hash(vUv * vec2(1920.0, 1080.0) + uTime * 31.0) - 0.5) * 0.025;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ═══════════════════════════════════════════
//  ENGINE
// ═══════════════════════════════════════════
export interface LiquidMaskOptions {
  baseImage: string
  revealImage?: string
  revealVideo?: HTMLVideoElement
  mirror?: boolean
  maskRadius?: number
  feather?: number
  lerpFactor?: number
  onReady?: () => void
}

export class LiquidMaskEngine {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private locs: Record<string, WebGLUniformLocation | null> = {}
  private rafId = 0
  private startTime = 0
  private disposed = false

  // Pointer
  private mouseX = -1
  private mouseY = -1
  private smoothX = -1
  private smoothY = -1
  private prevSmoothX = -1
  private prevSmoothY = -1
  private lerpFactor: number

  // Cursor state
  private velocity = 0
  private presence = 0          // 0 → 1 animated on enter/leave
  private presenceTarget = 0

  // Config
  private maskRadius: number
  private feather: number
  private onReady?: () => void
  private revealVideo: HTMLVideoElement | null
  private revealTex: WebGLTexture | null = null
  private mirror: boolean

  constructor(container: HTMLElement, opts: LiquidMaskOptions) {
    this.container = container
    this.maskRadius = opts.maskRadius ?? 0.25
    this.feather = opts.feather ?? 0.08
    this.lerpFactor = opts.lerpFactor ?? 0.10
    this.onReady = opts.onReady

    this.canvas = document.createElement('canvas')
    this.canvas.style.display = 'block'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    container.appendChild(this.canvas)

    const gl = this.canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) throw new Error('WebGL not supported')
    this.gl = gl

    this.program = this.createProgram(VERT, FRAG)
    gl.useProgram(this.program)

    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(this.program, 'aPosition')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    for (const name of [
      'uBase','uReveal','uMouse','uTime','uAspect',
      'uRadius','uFeather','uVelocity','uPresence','uMirror'
    ]) {
      this.locs[name] = gl.getUniformLocation(this.program, name)
    }

    this.revealVideo = opts.revealVideo ?? null
    this.mirror = opts.mirror ?? false

    let loaded = 0
    const total = opts.revealVideo ? 1 : 2
    const check = () => { if (++loaded >= total) this.onReady?.() }

    this.loadTexture(opts.baseImage, 0, check)

    if (opts.revealVideo) {
      this.revealTex = this.createVideoTexture(1)
    } else if (opts.revealImage) {
      this.loadTexture(opts.revealImage, 1, check)
    } else {
      throw new Error('LiquidMaskEngine: provide revealImage or revealVideo')
    }

    gl.uniform1i(this.locs.uBase, 0)
    gl.uniform1i(this.locs.uReveal, 1)
    gl.uniform1f(this.locs.uMirror!, this.mirror ? 1.0 : 0.0)

    this.resize()
    setTimeout(() => this.resize(), 100)
    setTimeout(() => this.resize(), 500)
    const ro = new ResizeObserver(() => this.resize())
    ro.observe(container)
  }

  start(): void {
    this.startTime = performance.now()
    this.loop()
  }

  updatePointer(normX: number, normY: number): void {
    this.mouseX = normX
    this.mouseY = 1 - normY
  }

  /** Call when cursor enters the canvas area */
  setPresent(present: boolean): void {
    this.presenceTarget = present ? 1 : 0
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.canvas.remove()
  }

  private loop = (): void => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.loop)

    const gl = this.gl
    const t = (performance.now() - this.startTime) / 1000

    // Smooth pointer
    this.smoothX += (this.mouseX - this.smoothX) * this.lerpFactor
    this.smoothY += (this.mouseY - this.smoothY) * this.lerpFactor

    // Velocity (0–1 clamped)
    const dx = this.smoothX - this.prevSmoothX
    const dy = this.smoothY - this.prevSmoothY
    const rawVel = Math.sqrt(dx * dx + dy * dy) * 60 // per-second
    this.velocity += (Math.min(rawVel, 1) - this.velocity) * 0.15
    this.prevSmoothX = this.smoothX
    this.prevSmoothY = this.smoothY

    // Animate presence (smooth enter/leave)
    this.presence += (this.presenceTarget - this.presence) * 0.08

    gl.uniform2f(this.locs.uMouse!, this.smoothX, this.smoothY)
    gl.uniform1f(this.locs.uTime!, t)
    gl.uniform1f(this.locs.uAspect!, this.canvas.width / this.canvas.height)
    gl.uniform1f(this.locs.uRadius!, this.maskRadius)
    gl.uniform1f(this.locs.uFeather!, this.feather)
    gl.uniform1f(this.locs.uVelocity!, this.velocity)
    gl.uniform1f(this.locs.uPresence!, this.presence)

    if (this.revealVideo && this.revealTex && this.revealVideo.readyState >= 2) {
      const gl2 = this.gl
      gl2.activeTexture(gl2.TEXTURE0 + 1)
      gl2.bindTexture(gl2.TEXTURE_2D, this.revealTex)
      gl2.pixelStorei(gl2.UNPACK_FLIP_Y_WEBGL, true)
      gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, this.revealVideo)
      gl2.pixelStorei(gl2.UNPACK_FLIP_Y_WEBGL, false)
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 2)
    const rect = this.container.getBoundingClientRect()
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  private loadTexture(url: string, unit: number, onLoad: () => void): void {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([10, 8, 20, 255]))
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      onLoad()
    }
    img.onerror = () => onLoad()
    img.src = url
  }

  private createVideoTexture(unit: number): WebGLTexture {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([10, 8, 20, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    return tex
  }

  private createProgram(vSrc: string, fSrc: string): WebGLProgram {
    const gl = this.gl
    const vs = this.compileShader(gl.VERTEX_SHADER, vSrc)
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fSrc)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error('Shader link: ' + gl.getProgramInfoLog(prog))
    return prog
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error('Shader compile: ' + gl.getShaderInfoLog(s))
    return s
  }
}
