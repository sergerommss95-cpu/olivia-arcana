(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43329,t=>{"use strict";var e=t.i(90072);let a=`
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
}`,i=`
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
}`;t.s(["StarSystem",0,class{points;material;engine;init(t){this.engine=t;let o=new e.BufferGeometry,r=new Float32Array(6e3),s=new Float32Array(2e3),l=new Float32Array(2e3),n=new Float32Array(2e3),u=new Float32Array(2e3),m=new Float32Array(2e3),h=new Float32Array(2e3);for(let t=0;t<2e3;t++){r[3*t]=(Math.random()-.5)*6,r[3*t+1]=(Math.random()-.5)*6,r[3*t+2]=-1.5-5*Math.random();let e=Math.random();e<.7?(s[t]=.3+.5*Math.random(),l[t]=.15+.3*Math.random()):e<.92?(s[t]=.8+.8*Math.random(),l[t]=.35+.4*Math.random()):(s[t]=2+2*Math.random(),l[t]=.7+.3*Math.random()),n[t]=Math.random()*Math.PI*2,u[t]=1+3*Math.random();let a=Math.random();m[t]=a<.15?.2*Math.random():a<.75?.3+.3*Math.random():.6+.4*Math.random(),h[t]=l[t]*(.3+.7*Math.random())}o.setAttribute("position",new e.BufferAttribute(r,3)),o.setAttribute("aSize",new e.BufferAttribute(s,1)),o.setAttribute("aBrightness",new e.BufferAttribute(l,1)),o.setAttribute("aTwinklePhase",new e.BufferAttribute(n,1)),o.setAttribute("aTwinkleFreq",new e.BufferAttribute(u,1)),o.setAttribute("aColorTemp",new e.BufferAttribute(m,1)),o.setAttribute("aParallaxWeight",new e.BufferAttribute(h,1)),this.material=new e.ShaderMaterial({vertexShader:a,fragmentShader:i,uniforms:{uTime:{value:0},uMouse:{value:new e.Vector2(.5,.5)}},transparent:!0,blending:e.NormalBlending,depthTest:!1,depthWrite:!1}),this.points=new e.Points(o,this.material),this.points.frustumCulled=!1,this.points.renderOrder=1,t.scene.add(this.points)}update(t,e){this.material.uniforms.uTime.value=t,this.material.uniforms.uMouse.value.copy(this.engine.smoothMouse)}resize(t,e){}dispose(){this.points?.geometry.dispose(),this.material?.dispose()}}])}]);