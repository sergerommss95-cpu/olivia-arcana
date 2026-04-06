(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,80375,e=>{"use strict";var o=e.i(90072);let t=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,i=`
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uFlowmap;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uMouseVelocity;
uniform float uFlowmapEnabled;
uniform float uBrightFlash;   // 0 = normal, 1 = full flash (gentle nebula glow)

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

  // ── Chromatic aberration — subtle, only during fast movement ──
  float flowMag = length(flowDisplace);
  float aberration = 0.0003 + flowMag * 0.4 + uMouseVelocity * 0.001;
  vec2 caDir = (uv - 0.5) * aberration;

  float r = texture2D(uTexture, clamp(uv + caDir, 0.005, 0.995)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, clamp(uv - caDir, 0.005, 0.995)).b;
  vec3 color = vec3(r, g, b);

  // ── Tone curve: VERY DARK. Nebula is atmosphere, not the subject. ──
  float darkenMul = 0.15 + uBrightFlash * 0.35; // flash brightens temporarily
  color *= darkenMul;
  color = color / (color + vec3(0.12));
  color = pow(color, vec3(1.6));

  // ── Deep vignette ──
  float vigDist = distance(vUv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.1, 0.72, vigDist);
  color *= 0.4 + vig * 0.6;

  // ── Film grain (animated, fract-based) ──
  float grain = fract(sin(dot(vUv + fract(uTime * 0.37), vec2(127.1, 311.7))) * 43758.5453);
  color += (grain - 0.5) * 0.03;

  // ── Cursor glow — warm, subtle, follows mouse ──
  float md = distance(vUv, uMouse);
  color += vec3(0.04, 0.025, 0.008) * smoothstep(0.22, 0.0, md) * 0.8;

  gl_FragColor = vec4(color, 1.0);
}`;e.s(["NebulaPlane",0,class{mesh;material;engine;get uniforms(){return this.material?.uniforms}init(e){this.engine=e;let l=new o.TextureLoader().load("/nebula-bg.jpg");l.minFilter=o.LinearFilter,l.magFilter=o.LinearFilter,this.material=new o.ShaderMaterial({vertexShader:t,fragmentShader:i,uniforms:{uTexture:{value:l},uFlowmap:{value:null},uFlowmapEnabled:{value:0},uTime:{value:0},uMouse:{value:new o.Vector2(.5,.5)},uResolution:{value:e.resolution.clone()},uMouseVelocity:{value:0},uBrightFlash:{value:0}},depthTest:!1,depthWrite:!1});let a=new o.PlaneGeometry(2,2);this.mesh=new o.Mesh(a,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=0,e.scene.add(this.mesh)}update(e,o){let t=this.material.uniforms;t.uTime.value=e,t.uMouse.value.copy(this.engine.smoothMouse),t.uMouseVelocity.value=Math.min(this.engine.mouseVelocity,2)}resize(e,o){this.material&&this.material.uniforms.uResolution.value.set(e,o)}dispose(){this.mesh?.geometry.dispose(),this.material?.dispose();let e=this.material?.uniforms.uTexture?.value;e&&e.dispose()}}])}]);