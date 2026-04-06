(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,3338,e=>{"use strict";var t=e.i(90072);let a=[{name:"Aries",glyph:"♈",cx:.06,cy:.42,scale:65,stars:[[.5,.12],[.38,.38],[.62,.38],[.45,.62],[.55,.62],[.5,.88]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5]],primaryHue:[1,.32,.24],accentHue:[1,.65,.12],motionStyle:"charge",revealOrder:"burst",idleSpeed:1.4},{name:"Taurus",glyph:"♉",cx:.14,cy:.36,scale:60,stars:[[.5,.1],[.3,.3],[.7,.3],[.4,.55],[.6,.55],[.5,.85],[.25,.78],[.75,.78]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[3,6],[4,7],[5,6],[5,7]],primaryHue:[.35,.82,.62],accentHue:[.65,.42,.2],motionStyle:"emergence",revealOrder:"bottom-up",idleSpeed:.7},{name:"Gemini",glyph:"♊",cx:.22,cy:.32,scale:58,stars:[[.22,.1],[.22,.35],[.22,.62],[.78,.1],[.78,.35],[.78,.62],[.5,.48],[.5,.88]],connections:[[0,1],[1,2],[3,4],[4,5],[1,4],[2,6],[5,6],[6,7]],primaryHue:[.95,.82,.25],accentHue:[.3,.85,.95],motionStyle:"mirror",revealOrder:"simultaneous",idleSpeed:1.2},{name:"Cancer",glyph:"♋",cx:.31,cy:.3,scale:55,stars:[[.5,.08],[.2,.3],[.8,.3],[.35,.6],[.65,.6],[.5,.88]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[1,2]],primaryHue:[.78,.68,1],accentHue:[.28,.8,.9],motionStyle:"shell",revealOrder:"center-out",idleSpeed:.85},{name:"Leo",glyph:"♌",cx:.4,cy:.3,scale:62,stars:[[.5,.08],[.25,.22],[.75,.22],[.5,.42],[.2,.58],[.8,.58],[.35,.78],[.65,.78]],connections:[[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,7],[6,7]],primaryHue:[1,.72,.08],accentHue:[1,.9,.4],motionStyle:"throne",revealOrder:"center-out",idleSpeed:.9},{name:"Virgo",glyph:"♍",cx:.5,cy:.32,scale:58,stars:[[.5,.1],[.32,.28],[.68,.28],[.28,.5],[.72,.5],[.38,.7],[.62,.7],[.5,.92]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[1,2]],primaryHue:[.5,.9,.65],accentHue:[.72,.85,.45],motionStyle:"weave",revealOrder:"wave",idleSpeed:1.1},{name:"Libra",glyph:"♎",cx:.59,cy:.34,scale:55,stars:[[.5,.1],[.2,.4],[.8,.4],[.35,.68],[.65,.68],[.2,.9],[.8,.9]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[1,2],[5,6]],primaryHue:[.9,.75,.55],accentHue:[1,.62,.38],motionStyle:"balance",revealOrder:"simultaneous",idleSpeed:.95},{name:"Scorpio",glyph:"♏",cx:.68,cy:.36,scale:60,stars:[[.5,.08],[.32,.24],[.68,.24],[.3,.46],[.7,.46],[.38,.68],[.62,.68],[.5,.88],[.38,1]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[7,8]],primaryHue:[.72,.1,.25],accentHue:[.9,.2,.55],motionStyle:"depth",revealOrder:"sequential",idleSpeed:1.25},{name:"Sagittarius",glyph:"♐",cx:.77,cy:.38,scale:58,stars:[[.5,.1],[.25,.28],[.75,.28],[.38,.5],[.62,.5],[.28,.72],[.72,.72],[.5,.9]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[3,4]],primaryHue:[.88,.55,.1],accentHue:[1,.82,.3],motionStyle:"arc",revealOrder:"bottom-up",idleSpeed:1.05},{name:"Capricorn",glyph:"♑",cx:.85,cy:.4,scale:55,stars:[[.5,.08],[.28,.25],[.72,.25],[.22,.5],[.78,.5],[.35,.72],[.65,.72],[.5,.9]],connections:[[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[1,2]],primaryHue:[.4,.62,.52],accentHue:[.28,.45,.38],motionStyle:"ascent",revealOrder:"bottom-up",idleSpeed:.7},{name:"Aquarius",glyph:"♒",cx:.92,cy:.42,scale:58,stars:[[.18,.28],[.36,.16],[.5,.28],[.64,.16],[.82,.28],[.18,.72],[.36,.84],[.5,.72],[.64,.84],[.82,.72]],connections:[[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[0,5],[4,9],[2,7]],primaryHue:[.28,.7,1],accentHue:[.55,.9,1],motionStyle:"wave",revealOrder:"wave",idleSpeed:1.35},{name:"Pisces",glyph:"♓",cx:.98,cy:.44,scale:55,stars:[[.28,.15],[.5,.1],[.72,.15],[.2,.4],[.8,.4],[.5,.5],[.2,.6],[.8,.6],[.28,.85],[.5,.9],[.72,.85]],connections:[[0,1],[1,2],[0,3],[2,4],[3,5],[4,5],[5,6],[5,7],[6,8],[7,9],[8,9],[9,10],[7,10]],primaryHue:[.45,.72,1],accentHue:[.8,.58,1],motionStyle:"dissolution",revealOrder:"simultaneous",idleSpeed:.85}],r=`
uniform float uDraw;
uniform float uHover;
uniform float uTime;
attribute float aT; // 0-1 position along line

varying float vAlpha;
varying float vGlow;

void main() {
  // Draw-in: line extends from 0 to uDraw
  float drawn = smoothstep(aT - 0.03, aT, uDraw);

  // Energy trace: bright pulse traveling along the drawn portion
  float traceSpeed = 0.4;
  float tracePos = fract(uTime * traceSpeed);
  float traceWidth = 0.08;
  float trace = smoothstep(traceWidth, 0.0, abs(aT - tracePos))
              * step(aT, uDraw)  // only on drawn portion
              * uHover;

  // Base line visibility — nearly invisible at idle
  float baseLine = drawn * (0.01 + uHover * 0.28);

  vAlpha = baseLine + trace * 0.7;
  vGlow = trace;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,o=`
varying float vAlpha;
varying float vGlow;

void main() {
  if (vAlpha < 0.003) discard;
  // Warm white for base, brighter white for energy trace
  vec3 color = mix(vec3(0.8, 0.82, 0.9), vec3(1.0, 0.98, 0.95), vGlow);
  gl_FragColor = vec4(color, vAlpha);
}`,i=`
uniform float uDraw;
uniform float uHover;
uniform float uTime;
attribute float aT;

varying float vAlpha;

void main() {
  float drawn = smoothstep(aT - 0.03, aT, uDraw);
  float tracePos = fract(uTime * 0.4);
  float trace = smoothstep(0.12, 0.0, abs(aT - tracePos)) * step(aT, uDraw) * uHover;

  vAlpha = drawn * uHover * 0.06 + trace * 0.15;

  // Push vertices outward slightly for wider glow
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = 12.0; // rendered as points for soft glow
}`,s=`
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  if (a < 0.002) discard;
  gl_FragColor = vec4(0.85, 0.88, 1.0, a);
}`,n=`
uniform float uHover;
uniform float uDraw;
uniform float uTime;
attribute float aOrder; // 0-1, when this star appears in the sequence

varying float vAlpha;
varying float vIgnite;
varying float vSize;

void main() {
  // Star appears when draw progress reaches its order
  float revealed = smoothstep(aOrder - 0.02, aOrder + 0.08, uDraw);

  // Ignition flash: brief bright moment when first revealed
  float ignitePhase = clamp((uDraw - aOrder) * 8.0, 0.0, 1.0);
  float igniteFlash = (1.0 - ignitePhase) * step(0.01, revealed);

  float breath = 0.85 + 0.15 * sin(uTime * 1.5 + aOrder * 6.28);

  vAlpha = revealed * (0.02 + uHover * 0.55 + igniteFlash * 0.7) * breath;
  vIgnite = igniteFlash * uHover;
  vSize = (1.5 + uHover * 2.5 + igniteFlash * 4.0) * revealed;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(vSize * (70.0 / -mv.z), 0.5);
}`,l=`
varying float vAlpha;
varying float vIgnite;
varying float vSize;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  // Core dot
  float core = smoothstep(0.15, 0.0, d);

  // Soft halo
  float halo = smoothstep(0.5, 0.0, d) * 0.3;

  // Starburst spikes during ignition
  float spikes = 0.0;
  if (vIgnite > 0.05 && vSize > 2.0) {
    float spikeH = smoothstep(0.03, 0.0, abs(uv.y)) * smoothstep(0.48, 0.0, abs(uv.x));
    float spikeV = smoothstep(0.03, 0.0, abs(uv.x)) * smoothstep(0.48, 0.0, abs(uv.y));
    // Diagonal spikes
    vec2 rot45 = vec2(uv.x + uv.y, uv.x - uv.y) * 0.707;
    float spikeD1 = smoothstep(0.025, 0.0, abs(rot45.y)) * smoothstep(0.4, 0.0, abs(rot45.x));
    float spikeD2 = smoothstep(0.025, 0.0, abs(rot45.x)) * smoothstep(0.4, 0.0, abs(rot45.y));
    spikes = (spikeH + spikeV + spikeD1 * 0.5 + spikeD2 * 0.5) * vIgnite;
  }

  float alpha = (core + halo + spikes * 0.6) * vAlpha;

  // Color: warm white for core, cool white for spikes
  vec3 color = mix(vec3(1.0, 0.97, 0.92), vec3(0.9, 0.93, 1.0), spikes * 0.5);

  gl_FragColor = vec4(color, alpha);
}`;e.s(["ZodiacGL",0,class{engine;signs=[];w=0;h=0;focusedSign=-1;hoveredSign=-1;focusProgress=[];originalPositions=[];onActivate=e=>{let t=e.detail?.index??-1;this.focusedSign=t,t>=0&&this.hoveredSign>=0&&(this.hoveredSign=-1,window.dispatchEvent(new CustomEvent("zodiac:hover",{detail:null})))};init(e){this.engine=e,this.w=e.resolution.x,this.h=e.resolution.y,this.buildAll(),window.addEventListener("zodiac:activate",this.onActivate)}buildAll(){for(let e of(this.focusProgress=[],this.originalPositions=[],a)){let t=this.buildSign(e);this.signs.push(t),this.engine.scene.add(t.group),this.focusProgress.push(0),this.originalPositions.push(t.group.position.clone())}}toWorld(e){let a=this.w/this.h,r=1.5*Math.tan(t.MathUtils.degToRad(35)),o=r*a;return e.stars.map(([a,i])=>{let s=e.cx+(a-.5)*e.scale/this.w,n=1-e.cy-(i-.5)*e.scale/this.h;return new t.Vector3(2*s*o-o,2*n*r-r,-.5)})}getOrder(e,a){let r=a.length;switch(e.revealOrder){case"sequential":return a.map((e,t)=>t/(r-1||1));case"center-out":{let e=a.reduce((e,a)=>new t.Vector3(e.x+a.x/r,e.y+a.y/r,0),new t.Vector3),o=a.map(t=>Math.hypot(t.x-e.x,t.y-e.y)),i=Math.max(...o,.001);return o.map(e=>e/i)}case"wave":{let e=a.map(e=>e.x),t=Math.min(...e),r=Math.max(...e)-t||1;return e.map(e=>(e-t)/r)}case"bottom-up":{let e=a.map(e=>e.y),t=Math.min(...e),r=Math.max(...e)-t||1;return e.map(e=>(e-t)/r)}default:return a.map(()=>.1*Math.random())}}buildSign(e){let a=new t.Group;a.renderOrder=2;let u=this.toWorld(e),h=u.reduce((e,t)=>e+t.x,0)/u.length,c=u.reduce((e,t)=>e+t.y,0)/u.length,d=[],v=[],m=()=>({uDraw:{value:0},uHover:{value:0},uTime:{value:0}});for(let[n,l]of e.connections){if(n>=u.length||l>=u.length)continue;let e=u[n],h=u[l],c=new Float32Array(96),p=new Float32Array(32);for(let t=0;t<32;t++){let a=t/31;c[3*t]=e.x+(h.x-e.x)*a,c[3*t+1]=e.y+(h.y-e.y)*a,c[3*t+2]=-.5,p[t]=a}let g=new t.BufferGeometry;g.setAttribute("position",new t.BufferAttribute(c,3)),g.setAttribute("aT",new t.BufferAttribute(p,1));let f=new t.ShaderMaterial({vertexShader:r,fragmentShader:o,uniforms:m(),transparent:!0,depthTest:!1,depthWrite:!1}),w=new t.Line(g,f);w.frustumCulled=!1,a.add(w),d.push(f);let y=g.clone(),S=new t.ShaderMaterial({vertexShader:i,fragmentShader:s,uniforms:m(),transparent:!0,blending:t.AdditiveBlending,depthTest:!1,depthWrite:!1}),x=new t.Points(y,S);x.frustumCulled=!1,a.add(x),v.push(S)}let p=this.getOrder(e,u),g=new Float32Array(3*u.length),f=new Float32Array(u.length);for(let e=0;e<u.length;e++)g[3*e]=u[e].x,g[3*e+1]=u[e].y,g[3*e+2]=-.5,f[e]=p[e];let w=new t.BufferGeometry;w.setAttribute("position",new t.BufferAttribute(g,3)),w.setAttribute("aOrder",new t.BufferAttribute(f,1));let y=new t.ShaderMaterial({vertexShader:n,fragmentShader:l,uniforms:{uHover:{value:0},uDraw:{value:0},uTime:{value:0}},transparent:!0,blending:t.AdditiveBlending,depthTest:!1,depthWrite:!1}),S=new t.Points(w,y);S.frustumCulled=!1,a.add(S);let x=new Float32Array(384),b=new Float32Array(128),A=1.4*Math.max(...u.map(e=>Math.hypot(e.x-h,e.y-c)));for(let e=0;e<128;e++){let t=e/128*Math.PI*2;x[3*e]=h+Math.cos(t)*A,x[3*e+1]=c+Math.sin(t)*A,x[3*e+2]=-.5,b[e]=t}let M=new t.BufferGeometry;M.setAttribute("position",new t.BufferAttribute(x,3)),M.setAttribute("aAngle",new t.BufferAttribute(b,1));let H=new t.ShaderMaterial({vertexShader:`
        uniform float uHover;
        uniform float uTime;
        attribute float aAngle;
        varying float vA;
        void main() {
          float dash = step(0.4, fract(aAngle * 6.0 / 6.2832));
          float tick = smoothstep(0.02, 0.0, abs(mod(aAngle, 1.5708)));
          vA = uHover * (dash * 0.08 + tick * 0.2) * smoothstep(0.3, 0.6, uHover);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,fragmentShader:`
        varying float vA;
        void main() {
          if (vA < 0.003) discard;
          gl_FragColor = vec4(0.8, 0.83, 0.95, vA);
        }`,uniforms:{uHover:{value:0},uTime:{value:0}},transparent:!0,depthTest:!1,depthWrite:!1}),T=new t.LineLoop(M,H);return T.frustumCulled=!1,a.add(T),{hover:0,dwell:0,draw:0,lineMats:d,glowMats:v,nodeMat:y,ringMat:H,group:a}}update(e,r){let o=this.engine.smoothMouse,i=this.focusedSign;for(let s=0;s<a.length;s++){let n=a[s],l=this.signs[s],u=i===s,h=+!!u,c=this.focusProgress[s];this.focusProgress[s]+=(h-c)*(u?.07:.02);let d=this.focusProgress[s];if(d>.01){let e=this.originalPositions[s],a=new t.Vector3(0,0,-.5);l.group.position.lerpVectors(e,a,.7*d),l.group.scale.setScalar(1+2*d),l.hover=Math.max(l.hover,d),l.draw=Math.max(l.draw,d)}else l.group.position.copy(this.originalPositions[s]),l.group.scale.setScalar(1);if(i>=0&&!u&&(l.hover*=.95,l.draw*=.95),i<0){let e=Math.hypot(o.x-n.cx,o.y-(1-n.cy)),t=n.scale/Math.min(this.w,this.h)*3.5,a=e<t;l.dwell=a?Math.min(l.dwell+1e3*r,3e3):Math.max(l.dwell-1500*r,0);let i=l.dwell>300,u=a?Math.pow(Math.max(0,1-e/t),.5):0,h=i?u:.02*u;l.hover+=(h-l.hover)*(h>l.hover?.05:.01);let c=i&&l.hover>.08?1:0;l.draw+=(c-l.draw)*(c>l.draw?.018:.008),l.hover>.15&&this.hoveredSign!==s?(this.hoveredSign=s,window.dispatchEvent(new CustomEvent("zodiac:hover",{detail:{name:n.name,glyph:n.glyph,x:n.cx*this.w,y:n.cy*this.h}}))):l.hover<.05&&this.hoveredSign===s&&(this.hoveredSign=-1,window.dispatchEvent(new CustomEvent("zodiac:hover",{detail:null})))}for(let t=0;t<l.lineMats.length;t++)l.lineMats[t].uniforms.uDraw.value=l.draw,l.lineMats[t].uniforms.uHover.value=l.hover,l.lineMats[t].uniforms.uTime.value=e,l.glowMats[t].uniforms.uDraw.value=l.draw,l.glowMats[t].uniforms.uHover.value=l.hover,l.glowMats[t].uniforms.uTime.value=e;l.nodeMat.uniforms.uHover.value=l.hover,l.nodeMat.uniforms.uDraw.value=l.draw,l.nodeMat.uniforms.uTime.value=e,l.ringMat.uniforms.uHover.value=l.hover,l.ringMat.uniforms.uTime.value=e}}resize(e,t){for(let a of(this.w=e,this.h=t,this.signs))this.engine.scene.remove(a.group);this.signs=[],this.buildAll()}dispose(){for(let e of(window.removeEventListener("zodiac:activate",this.onActivate),this.signs))this.engine.scene.remove(e.group),e.group.traverse(e=>{"geometry"in e&&e.geometry?.dispose(),"material"in e&&e.material?.dispose()})}}],3338)}]);