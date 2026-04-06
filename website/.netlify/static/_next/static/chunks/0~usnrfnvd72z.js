(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,2312,e=>{"use strict";var t=e.i(90072);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,i=`
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
}`;class o{engine;rtA;rtB;flowScene;flowCamera;flowMaterial;flowMesh;current=0;lastMouse=new t.Vector2(.5,.5);mouseInitialized=!1;connectedUniform=null;get texture(){return 0===this.current?this.rtA.texture:this.rtB.texture}connectTo(e){this.connectedUniform=e}init(e){this.engine=e;let o={minFilter:t.LinearFilter,magFilter:t.LinearFilter,format:t.RGBAFormat,type:t.UnsignedByteType};this.rtA=new t.WebGLRenderTarget(512,512,o),this.rtB=new t.WebGLRenderTarget(512,512,o);let r=new Uint8Array(1048576);for(let e=0;e<262144;e++)r[4*e]=128,r[4*e+1]=128,r[4*e+2]=0,r[4*e+3]=255;let a=new t.DataTexture(r,512,512);a.needsUpdate=!0,this.flowCamera=new t.OrthographicCamera(-1,1,1,-1,0,1),this.flowScene=new t.Scene,this.flowMaterial=new t.ShaderMaterial({vertexShader:s,fragmentShader:i,uniforms:{uPrevFlow:{value:a},uMouse:{value:new t.Vector2(.5,.5)},uLastMouse:{value:new t.Vector2(.5,.5)},uAspect:{value:e.resolution.x/e.resolution.y},uStrength:{value:.6}}}),this.flowMesh=new t.Mesh(new t.PlaneGeometry(2,2),this.flowMaterial),this.flowMesh.frustumCulled=!1,this.flowScene.add(this.flowMesh)}update(e,t){let s=this.engine.renderer,i=this.engine.smoothMouse;this.mouseInitialized||(this.lastMouse.copy(i),this.mouseInitialized=!0);let o=0===this.current?this.rtA:this.rtB,r=0===this.current?this.rtB:this.rtA,a=this.flowMaterial.uniforms;a.uPrevFlow.value=o.texture,a.uMouse.value.copy(i),a.uLastMouse.value.copy(this.lastMouse),a.uAspect.value=this.engine.resolution.x/this.engine.resolution.y;let n=i.distanceTo(this.lastMouse);a.uStrength.value=.3+Math.min(50*n,1.5);let l=s.getRenderTarget();s.setRenderTarget(r),s.render(this.flowScene,this.flowCamera),s.setRenderTarget(l),this.current=1-this.current,this.lastMouse.copy(i),this.connectedUniform&&(this.connectedUniform.value=this.texture)}resize(e,t){this.flowMaterial&&(this.flowMaterial.uniforms.uAspect.value=e/t)}dispose(){this.rtA?.dispose(),this.rtB?.dispose(),this.flowMaterial?.dispose(),this.flowMesh?.geometry.dispose()}}e.s(["FlowmapSystem",0,o])}]);