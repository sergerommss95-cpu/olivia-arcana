'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('#cards'),stage=$('#motion-stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.12,.28,.45,.62,.78,1],order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
const mq=matchMedia('(prefers-reduced-motion: reduce)'),staticView=new URLSearchParams(location.search).get('motion')==='reduce';let quiet=mq.matches||staticView,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let fallbackMode=false;let watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='';
const JOURNEY_SECONDS=96;
let freezeTime=false;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('p')){target=p=clamp(+hash.get('p'));freezeTime=true;}
// The selected Light Leaks opening keeps its original ambient drift.
const diagnostics={}; let hitTargets=[],choiceHidden=null;
// Desktop keeps its scroll journey. On a phone it opens deliberately through
// Watch the journey, leaving the everyday reading one screen away.
const cinematic=()=>document.body.dataset.view==='home'&&!quiet&&(!matchMedia('(max-width:700px)').matches||document.body.classList.contains('cinema'));
function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
const CARD_W=1.1667,CARD_H=2,CARD_T=.011;let COUNT=13;
const qstep=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const ramp=(a,b,t)=>qstep((t-a)/(b-a));
const travelPace=p=>p,copyPace=p=>p;
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function rotate(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];}
const norm=a=>scale(a,1/Math.max(.000001,Math.hypot(...a)));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function lookAt(eye,at,roll){
 const z=norm(eye.map((v,i)=>v-at[i])),up=[Math.sin(roll),Math.cos(roll),0],x=norm(cross(up,z)),y=cross(z,x);
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
// One shared, optional shadow pass. Insert inside the renderer IIFE, after the
// math helpers and before initialize(). No second canvas or external assets.
// This renderer uses rigid cards (uBend/uTwist === 0) in both passes.
let shadowState=null;
const SHADOW_KEY=[-7,10,12];
const SHADOW_LIGHT_VP=(()=>{
 const radius=12,near=.1,far=60;
 const projection=new Float32Array([1/radius,0,0,0,0,1/radius,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]);
 return mul(projection,lookAt(SHADOW_KEY,[0,0,-2],0));
})();
const shadowVertexSource=`
attribute vec3 aPos;
uniform mat4 uModel,uLightVP;
void main(){gl_Position=uLightVP*uModel*vec4(aPos,1.);}`;
const shadowFragmentSource=`
precision highp float;
vec4 encodeDepth(float depth){
 vec4 digits=fract(depth*vec4(16777216.,65536.,256.,1.));
 return digits-digits.xxyz*vec4(0.,.00390625,.00390625,.00390625);
}
void main(){gl_FragColor=encodeDepth(gl_FragCoord.z);}`;
function disposeShadows(){
 if(!shadowState||!gl)return;
 const old=shadowState;shadowState=null;
 if(old.texture)gl.deleteTexture(old.texture);
 if(old.depth)gl.deleteRenderbuffer(old.depth);
 if(old.framebuffer)gl.deleteFramebuffer(old.framebuffer);
 if(old.program)gl.deleteProgram(old.program);
}
function initializeShadows(){
 disposeShadows();
 const previous={
  active:gl.getParameter(gl.ACTIVE_TEXTURE),framebuffer:gl.getParameter(gl.FRAMEBUFFER_BINDING),
  renderbuffer:gl.getParameter(gl.RENDERBUFFER_BINDING),program:gl.getParameter(gl.CURRENT_PROGRAM)
 };
 gl.activeTexture(gl.TEXTURE3);previous.texture=gl.getParameter(gl.TEXTURE_BINDING_2D);
 const shaders=[];
 try{
  const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
  if(!precision||precision.precision<16)throw Error('Fragment high precision unavailable');
  const size=Math.min(mobile?512:1024,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
  if(size<256)throw Error('Shadow buffer size unavailable');
  const s=shadowState={size,drawCalls:0,program:gl.createProgram()};
  if(!s.program)throw Error('Shadow program allocation failed');
  for(const [type,source] of [[gl.VERTEX_SHADER,shadowVertexSource],[gl.FRAGMENT_SHADER,shadowFragmentSource]]){
   const shader=gl.createShader(type);if(!shader)throw Error('Shadow shader allocation failed');
   shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||'Shadow shader compile failed');
   gl.attachShader(s.program,shader);
  }
  // Reusing the main program's locations means no attribute or VAO mutation
  // is needed during a frame. Both passes use the exact same interleaved mesh.
  for(const name of ['aPos','aNormal','aUV']){
   const location=gl.getAttribLocation(program,name);
   if(location<0)throw Error('Main mesh attribute unavailable: '+name);
   gl.bindAttribLocation(s.program,location,name);
  }
  gl.linkProgram(s.program);
  if(!gl.getProgramParameter(s.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(s.program)||'Shadow program link failed');
  s.uModel=gl.getUniformLocation(s.program,'uModel');s.uLightVP=gl.getUniformLocation(s.program,'uLightVP');
  s.texture=gl.createTexture();s.depth=gl.createRenderbuffer();s.framebuffer=gl.createFramebuffer();
  if(!s.texture||!s.depth||!s.framebuffer)throw Error('Shadow buffer allocation failed');
  gl.bindTexture(gl.TEXTURE_2D,s.texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  // Packed channels must never be interpolated before decoding.
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindRenderbuffer(gl.RENDERBUFFER,s.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
  gl.bindFramebuffer(gl.FRAMEBUFFER,s.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,s.texture,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,s.depth);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow framebuffer incomplete');
  gl.useProgram(s.program);gl.uniformMatrix4fv(s.uLightVP,false,SHADOW_LIGHT_VP);
  diagnostics.shadowFailure=null;
  return true;
 }catch(error){
  disposeShadows();diagnostics.shadowFailure=String(error);return false;
 }finally{
  shaders.forEach(shader=>gl.deleteShader(shader));
  gl.bindFramebuffer(gl.FRAMEBUFFER,previous.framebuffer);gl.bindRenderbuffer(gl.RENDERBUFFER,previous.renderbuffer);
  gl.bindTexture(gl.TEXTURE_2D,previous.texture);gl.activeTexture(previous.active);gl.useProgram(previous.program);
 }
}
function renderShadows(worldLayers){
 const s=shadowState;if(!s)return 0;
 try{
  gl.disable(gl.DITHER);
  gl.bindFramebuffer(gl.FRAMEBUFFER,s.framebuffer);gl.viewport(0,0,s.size,s.size);
  gl.useProgram(s.program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.colorMask(true,true,true,true);
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.POLYGON_OFFSET_FILL);
  // A white cleared texel decodes beyond the far plane, hence fully lit.
  gl.clearColor(1,1,1,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  s.drawCalls=0;
  for(const layer of worldLayers){
   gl.uniformMatrix4fv(s.uModel,false,layer.matrix);gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);s.drawCalls++;
  }
  return s.drawCalls;
 }catch(error){
  diagnostics.shadowFailure=String(error);disposeShadows();return 0;
 }finally{
  // Explicit restoration of this renderer's main-pass state avoids synchronous
  // getParameter reads every frame. Textures and vertex pointers never change.
  gl.enable(gl.DITHER);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.colorMask(true,true,true,true);
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.clearColor(0,0,0,0);gl.clearDepth(1);
 }
}
function shadowBindings(){
 const s=shadowState;
 // Binding the existing back texture when disabled keeps sampler completeness
 // valid without allocating a fallback texture. The shader returns before use.
 return {texture:s?s.texture:back,enabled:s?1:0,texel:s?1/s.size:1,vp:SHADOW_LIGHT_VP,key:SHADOW_KEY,size:s?s.size:0,drawCalls:s?s.drawCalls:0};
}

function cameraPose(progress){
 const passage=ramp(.18,.40,progress)*(1-ramp(.76,.98,progress));
 const eye=[Math.sin(progress*Math.PI*2)*.24*passage,Math.sin(progress*Math.PI)*.14*passage,mix(10.4,9.7,passage)];
 const view=lookAt(eye,[eye[0]*.2,0,-1.5],Math.sin(progress*Math.PI*2)*.008*passage);
 const fov=38,f=1/Math.tan(fov*Math.PI/360),near=.12,far=75;
 const projection=new Float32Array([f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
 return {eye,view,vp:mul(projection,view),fov};
}
const START=[-.12,-.34],END=[-.07,-Math.PI+.14];
let story;
function screenPoint(x,y,z,eyeZ=10.4){const t=Math.tan(19*Math.PI/180)*(eyeZ-z);return [(x-.5)*2*t*w/h,(.5-y)*2*t,z];}
function makeTracks(){
 const portrait=w/h<1.15,short=h<(portrait?760:650),unit=Math.tan(19*Math.PI/180)*10.4;
 COUNT=portrait?9:13;
 const start=screenPoint(portrait?.58:.66,portrait?(short?.35:.39):.45,0);
 const end=screenPoint(portrait?.64:.70,portrait?(short?.32:.35):(short?.50:.48),0);
 const ss=(portrait?(short?.36:.46):(short?.58:.62))*unit,es=(portrait?(short?.38:.455):(short?.63:.68))*unit;
 const ids=portrait?[0,19,2,21,14,6,8,17,18]:[0,19,2,21,14,6,8,9,11,1,3,17,18];
 story={portrait,short,start,end,ss,es,unit};
 tracks=ids.map((id,i)=>({id,i,u:i/(COUNT-1)}));
}
function ribbon(progress){
 const {portrait,start,end,ss,es,unit}=story,poses=[];
 const open=ramp(.065,.285,progress),turn=ramp(.29,.565,progress),part=ramp(.585,.77,progress),close=ramp(.875,.995,progress);
 const flourish=open*(1-close),space=ramp(.095,.30,progress)*(1-close);
 const yaw=mix(mix(START[1],-.13,open),END[1],turn),pitch=mix(START[0],END[0],turn)+Math.sin(turn*Math.PI)*.13;
 const bank=mix(-.10,.055,turn)+Math.sin(open*Math.PI)*.035;
 const rotation=model([0,0,0,pitch,yaw,bank,1]);
 const cardScale=mix(mix(ss,unit*(portrait?.355:.47),open),es,close);
 const gap=mix(.017*cardScale,portrait?.40:.52,space),half=(COUNT-1)*gap/2;
 const settled=close;
 const mid=[0,portrait?.08:0,-(portrait?2.3:3.35)*space];
 let anchor=start.map((v,j)=>mix(mix(v,mid[j],open),end[j],settled));
 // The first reverse and the final Moon each retain their original screen anchor.
 const edgeAnchor=mix(half,-half,turn)*(1-space),offset=rotate(rotation,[0,0,edgeAnchor]);
 anchor=anchor.map((v,j)=>v-offset[j]);
 const actor=new Float32Array(rotation);actor[12]=anchor[0];actor[13]=anchor[1];actor[14]=anchor[2];
 for(const {id,i,u}of tracks){
  const t=u-.5,phase=t*Math.PI;
  const departure=ramp(.052+u*.075,.235+u*.06,progress);
  const arrival=ramp(.875+(1-u)*.045,.967+(1-u)*.027,progress);
  const unfurl=departure*(1-arrival);
  const reveal=i===COUNT-1?ramp(.615,.78,progress):ramp(.575+u*.025,.755+u*.025,progress);
  const separation=reveal*(1-arrival);
  // A single long S gesture: every card belongs to the same evolving surface.
  const width=portrait?2.25:8.9,height=portrait?2.3:1.22;
  let x=t*width*unfurl;
  let y=height*Math.sin(phase*(portrait?1.7:1.25)+turn*.48)*unfurl;
  let rz=mix(0,t*(portrait?.34:.48)+Math.sin(phase)*.07,unfurl);
  const z=(.5-u)*(COUNT-1)*gap;
  let s=mix(mix(ss,unit*(portrait?.355:.47),departure),es,arrival);
  if(i===COUNT-1){
   // The Moon becomes the still focal point while the two wings travel past it.
   x=mix(x,0,separation);y=mix(y,portrait?.20:.05,separation);rz=mix(rz,0,reveal);
   s=mix(s,unit*(portrait?.43:.66),separation);
  }else{
   const halfCount=(COUNT-1)/2,side=i<halfCount?-1:1,rank=i%halfCount;
   const wingX=-side*((portrait?1.60:3.05)+rank*(portrait?.085:.24));
   const wingY=side*(rank-(halfCount-1)/2)*(portrait?.51:.51);
   x=mix(x,wingX,separation);y=mix(y,wingY,separation);
   rz=mix(rz,side*(.15+rank*.045),separation);
  }
  const freedom=space*(1-ramp(.83,.955,progress));
  const localPitch=Math.sin(i*1.13+progress*3.1)*.040*freedom;
  const localYaw=Math.cos(i*.83+progress*2.2)*.040*freedom;
  const local=model([x,y,z,localPitch,localYaw,rz,s]),matrix=mul(actor,local);
  const focus=reveal*(1-ramp(.92,.99,progress));
  const presence=mix(1,i===COUNT-1?1.07:(i<(COUNT-1)/2?.76:.66),focus);
  poses.push({id,centre:[matrix[12],matrix[13],matrix[14]],matrix,presence,u:progress,d:progress,scale:s});
 }
 diagnostics.clearance={cards:COUNT,phase:progress<.29?'unfolding':progress<.585?'turn':progress<.875?'reveal':'gathering'};
 return poses;
}

const vert=`
attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;
uniform mat4 uModel,uVP,uLightVP;
varying vec4 vLightClip;
varying vec2 vUV;varying vec3 vNormal,vWorld;varying float vSide,vFace;
void main(){
 vec4 world=uModel*vec4(aPos,1.);
 vLightClip=uLightVP*world;vUV=aUV;vSide=abs(aNormal.z)<.9999?1.:0.;vFace=aNormal.z;
 vNormal=normalize(mat3(uModel)*aNormal);vWorld=world.xyz;gl_Position=uVP*world;
}`;
const frag=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUV;varying vec3 vNormal,vWorld;varying float vSide,vFace;
uniform sampler2D uDetail,uBack;uniform vec2 uLight;uniform vec3 uEye;uniform float uPresence,uArtInset;
varying vec4 vLightClip;
uniform sampler2D uShadowMap;
uniform float uShadowEnabled,uShadowTexel;
uniform vec3 uKeyPosition;
float shadowDepth(vec2 uv){return dot(texture2D(uShadowMap,uv),vec4(.000000059604644775390625,.0000152587890625,.00390625,1.));}
float cardVisibility(vec3 normal,vec3 lightDirection){
 if(uShadowEnabled<.5)return 1.;
 vec3 c=vLightClip.xyz/vLightClip.w*.5+.5;
 if(c.x<=.002||c.x>=.998||c.y<=.002||c.y>=.998||c.z<=0.||c.z>=1.)return 1.;
 float bias=.00045+.0012*(1.-abs(dot(normal,lightDirection)));
 float result=0.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  float depth=shadowDepth(c.xy+vec2(float(x),float(y))*uShadowTexel*1.35);
  result+=step(c.z-bias,depth);
 }
 return result/9.;
}
const vec3 abyss=vec3(.0235,.0471,.0824);
void main(){vec2 uv=clamp(vUV,0.,1.);
vec3 tex;
if(vFace>0.)tex=texture2D(uBack,vec2(uv.x,1.-uv.y)).rgb;
else tex=texture2D(uDetail,mix(vec2(uArtInset),vec2(1.-uArtInset),vec2(1.-uv.x,1.-uv.y))).rgb;
vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
vec3 key=normalize(uKeyPosition-vWorld);
vec3 view=normalize(uEye-vWorld);
float visibility=cardVisibility(n,key),incidence=max(0.,dot(n,key));
vec3 illumination=vec3(.40,.445,.515)+vec3(.78,.73,.64)*incidence*visibility;
vec3 col=pow(tex,vec3(2.2))*illumination*uPresence;
float sheen=pow(max(0.,dot(n,normalize(key+view))),46.);
float gold=smoothstep(.035,.17,tex.r-tex.b)*smoothstep(.30,.66,tex.r);
// The reflection belongs to the warm ink and the thin cut edge, not the blue field.
col+=vec3(.34,.24,.105)*sheen*gold*.26*visibility;

if(vSide>.5){
 // The restrained, satin cut edge receives light as a solid surface.
 vec3 edgeBase=vec3(.13,.108,.068);
 col=edgeBase*illumination*uPresence+vec3(.19,.15,.075)*pow(max(0.,dot(n,normalize(key+view))),24.)*visibility;
}
float dim=clamp((length(uEye-vWorld)-12.)*.022,0.,.52);col=mix(col,pow(abyss,vec3(2.2)),dim);
gl_FragColor=vec4(pow(max(col,0.),vec3(1./2.2)),1.);
}`;
function makeMesh(){
 const verts=[],indices=[],radius=.045,bevel=.0035,segments=10;
 // All surfaces share one rounded footprint. The faces sit on the real top
 // and bottom planes; a small rolled bevel meets the continuous cut edge.
 function outline(inset){
  const r=radius-inset,hx=CARD_W/2-inset,hy=CARD_H/2-inset,points=[];
  for(const [cx,cy,start] of [[hx-r,hy-r,0],[-hx+r,hy-r,90],[-hx+r,-hy+r,180],[hx-r,-hy+r,270]]){
   for(let j=0;j<=segments;j++){
    const a=(start+j*90/segments)*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);
    points.push([cx+r*dx,cy+r*dy,dx,dy]);
   }
  }
  return points;
 }
 function vertex(x,y,z,nx,ny,nz){verts.push(x,y,z,nx,ny,nz,x/CARD_W+.5,y/CARD_H+.5);return verts.length/8-1;}
 const face=outline(bevel),count=face.length;
 for(const side of [1,-1]){
  const center=vertex(0,0,side*CARD_T/2,0,0,side),base=verts.length/8;
  for(const [x,y] of face)vertex(x,y,side*CARD_T/2,0,0,side);
  for(let i=0;i<count;i++){
   const a=base+i,b=base+(i+1)%count;
   if(side>0)indices.push(center,a,b);else indices.push(center,b,a);
  }
 }
 const profiles=[
  [bevel,CARD_T/2,.05,Math.sqrt(1-.05*.05)],
  [bevel*(1-Math.SQRT1_2),CARD_T/2-bevel*(1-Math.SQRT1_2),Math.SQRT1_2,Math.SQRT1_2],
  [0,CARD_T/2-bevel,1,0],
  [0,-CARD_T/2+bevel,1,0],
  [bevel*(1-Math.SQRT1_2),-CARD_T/2+bevel*(1-Math.SQRT1_2),Math.SQRT1_2,-Math.SQRT1_2],
  [bevel,-CARD_T/2,.05,-Math.sqrt(1-.05*.05)]
 ];
 const rimBase=verts.length/8;
 for(const [inset,z,radial,nz] of profiles)for(const [x,y,dx,dy] of outline(inset))vertex(x,y,z,dx*radial,dy*radial,nz);
 for(let j=0;j<profiles.length-1;j++)for(let i=0;i<count;i++){
  const a=rimBase+j*count+i,b=rimBase+j*count+(i+1)%count,c=a+count,d=b+count;
  indices.push(a,c,b,b,c,d);
 }
 return {v:new Float32Array(verts),i:new Uint16Array(indices)};
}
function shader(type,s){const a=gl.createShader(type);gl.shaderSource(a,s);gl.compileShader(a);if(!gl.getShaderParameter(a,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(a));gl.attachShader(program,a);gl.deleteShader(a);}
function texture(img,unit,mip,large=false){
 const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
 let source=img;
 if(unit===1||(img.width&(img.width-1))||(img.height&(img.height-1))){
  const c=document.createElement('canvas');c.width=mobile||!large?512:1024;c.height=c.width*2;
  const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);source=c;
 }
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
 const aniso=gl.getExtension('EXT_texture_filter_anisotropic');if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 return t;
}
async function load(src){const img=new Image();img.src=src;await img.decode();return img;}
function scrollRange(){return Math.max(1,document.querySelector('#hero-region').offsetHeight-innerHeight);}
function resumeHome(){if(!cinematic())return;freezeTime=false;target=clamp(scrollY/scrollRange());last=0;wake();}
function unfold(){if(!cinematic())return;stopJourney();freezeTime=false;scrollTo({top:Math.min(1,p+.14)*scrollRange(),behavior:'smooth'});}
function resize(force=false){
 const nextWidth=stage.offsetWidth,nextHeight=stage.offsetHeight;if(!nextWidth||!nextHeight)return;const changed=force||nextWidth!==w||nextHeight!==h;
 w=nextWidth;h=nextHeight;mobile=w<700;
 const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75,Math.sqrt(3500000/(w*h))),pixelWidth=Math.round(w*dpr),pixelHeight=Math.round(h*dpr);
 if(force||canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;gl?.viewport(0,0,pixelWidth,pixelHeight);}
 if(changed)makeTracks();
 if(cinematic()&&(watching||freezeTime))scrollTo({top:target*scrollRange(),behavior:'instant'});else if(cinematic()&&!freezeTime)target=clamp(scrollY/scrollRange());
 wake();
}
function queueResize(){if(!resizeRequest)resizeRequest=requestAnimationFrame(()=>{resizeRequest=0;resize();});}
// Rotate the complete scene around the held deck. It is one rigid transform,
// so mouse response and the long breath cannot change card-to-card clearance.
function sceneFrame(progress){
 const still=quiet||freezeTime,phase=still?0:time,px=still?0:ptr[0],py=still?0:ptr[1];
 const weight=1-ramp(.10,.30,progress)+ramp(.88,1,progress);
 return model([px*.035*weight,-py*.018*weight+Math.sin(phase*.28)*.012*weight,0,0,Math.sin(phase*.18)*.004*weight,0,1]);
}
function draw(){if(!ready||!tracks.length||w<2||h<2)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const progress=p,camera=cameraPose(progress);gl.uniformMatrix4fv(loc.uVP,false,camera.vp);gl.uniform3f(loc.uEye,...camera.eye);
 const poses=ribbon(progress),scene=sceneFrame(progress);
 gl.uniform2f(loc.uLight,quiet?0:ptr[0]*.6,quiet?0:-ptr[1]*.3);
 // Opaque cards are drawn nearest first so the held packet does not shade
 // the same pixels once for every hidden card behind it.
 const worldLayers=poses.map((pose,index)=>{
  const matrix=mul(scene,pose.matrix),v=camera.view;
  const depth=v[2]*matrix[12]+v[6]*matrix[13]+v[10]*matrix[14]+v[14];
  const halfDepth=Math.abs(v[2]*matrix[0]+v[6]*matrix[1]+v[10]*matrix[2])*CARD_W/2+Math.abs(v[2]*matrix[4]+v[6]*matrix[5]+v[10]*matrix[6])*CARD_H/2;
  return {id:pose.id,index,matrix,presence:pose.presence,depth,halfDepth};
 });
 hitTargets=worldLayers.map(layer=>{const m=mul(camera.vp,layer.matrix);const points=[[-CARD_W/2,CARD_H/2],[CARD_W/2,CARD_H/2],[CARD_W/2,-CARD_H/2],[-CARD_W/2,-CARD_H/2]].map(([x,y])=>{const d=m[3]*x+m[7]*y+m[15];return [(m[0]*x+m[4]*y+m[12])/d*w/2+w/2,h/2-(m[1]*x+m[5]*y+m[13])/d*h/2];});return {index:layer.index,depth:layer.depth,points};});
 if(document.body.dataset.view==='choose')dispatchEvent(new CustomEvent('olivia:card-positions',{detail:hitTargets}));
 const visibleLayers=document.body.dataset.view==='choose'?worldLayers.filter(layer=>layer.index!==choiceHidden):worldLayers;
 renderShadows(visibleLayers);
 const shadow=shadowBindings();
 gl.uniformMatrix4fv(loc.uLightVP,false,shadow.vp);gl.uniform1i(loc.uShadowMap,3);
 gl.uniform1f(loc.uShadowEnabled,shadow.enabled);gl.uniform1f(loc.uShadowTexel,shadow.texel);gl.uniform3f(loc.uKeyPosition,...shadow.key);
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,shadow.texture);
 const layers=visibleLayers.filter(pose=>pose.depth-pose.halfDepth<-.12&&pose.depth+pose.halfDepth>-75).sort((a,b)=>b.depth-a.depth);
 for(const pose of layers){
  gl.uniform1f(loc.uArtInset,pose.id===19?.058:.012);gl.uniform1f(loc.uPresence,pose.presence);gl.uniformMatrix4fv(loc.uModel,false,pose.matrix);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,details[pose.id]);gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);
 }
 diagnostics.drawCalls=layers.length;
 frames++;stage.style.setProperty('--passage',String(ramp(.20,.44,progress)*(1-ramp(.80,.96,progress))));updateCopy(copyPace(progress));updateJourneyControl();
}
const intro=$('#intro'),openingType=$('#opening-type'),intertitle=$('#intertitle'),closing=$('#closing'),journey=$('#journey');
function updateJourneyControl(){
 const label=watching?'Pause journey':p>.985?'Watch again':'Watch the journey';
 if(label!==lastJourneyLabel){journey.textContent=label;lastJourneyLabel=label;journey.setAttribute('aria-pressed',String(watching));}
}
function stopJourney(){watching=false;updateJourneyControl();last=0;wake();}
journey.addEventListener('click',()=>{
 if(quiet)return;
 if(watching){stopJourney();return;}
 freezeTime=false;
 if(p>.985){p=0;target=0;progressVelocity=0;}
 else{target=p;progressVelocity=0;}
 watching=true;scrollTo({top:p*scrollRange(),behavior:'instant'});updateJourneyControl();last=0;wake();
});
const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)};
const deckCaption=$('#deck-caption');
let copyProgress=-1;
function updateCopy(progress){
 if(Math.abs(progress-copyProgress)<.000001)return;copyProgress=progress;
 // Keep the reference's holds and exits; the product wordmark is only typography.
 const opening=1-smooth(.075,.20,progress),introOpacity=1-smooth(.09,.18,progress),end=smooth(.945,.995,progress);
 openingType.style.opacity=String(opening);openingType.style.transform=`translateY(${-progress*40}px)`;
 openingType.setAttribute('aria-hidden',String(opening<.1));
 intro.style.opacity=String(introOpacity);intro.style.transform=`translateY(${-20*(1-introOpacity)}px)`;intro.inert=introOpacity<.1;intro.setAttribute('aria-hidden',String(introOpacity<.1));
 deckCaption.style.opacity=String(introOpacity);
 intertitle.style.opacity='0';
 closing.style.opacity=String(end);closing.style.transform=`translateY(${(1-end)*18}px)`;closing.inert=end<.5;closing.setAttribute('aria-hidden',String(end<.5));
 $('#line').style.transform=`scaleX(${quiet?0:p})`;$('#scroll-label').textContent=progress>.94?'Explore the practice':'Scroll to unfold';
}
function wake(){if(alive&&ready&&inView&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
function frame(now){raf=0;if(!ready||!inView||document.hidden)return;let dt=last?Math.min((now-last)/1000,.05):1/60;last=now;if(!paused&&!quiet)time+=dt;
 if(watching&&!quiet){target=clamp(target+dt/JOURNEY_SECONDS);scrollTo({top:target*scrollRange(),behavior:'instant'});if(target===1)watching=false;}
 // Exact critically damped response: a new scroll target changes acceleration,
 // while the stored velocity continues smoothly through wheel steps and reversals.
 if(quiet){p=target;progressVelocity=0;}else{const omega=18,decay=Math.exp(-omega*dt),delta=p-target,step=(progressVelocity+omega*delta)*dt;
  p=target+(delta+step)*decay;progressVelocity=(progressVelocity-omega*step)*decay;
  if(p<0||p>1){p=clamp(p);progressVelocity=0;}
  if(Math.abs(p-target)<1e-5&&Math.abs(progressVelocity)<.0002){p=target;progressVelocity=0;}}
 const k=1-Math.exp(-dt*10);if(!paused)for(let i=0;i<2;i++)ptr[i]+=((quiet?0:aim[i])-ptr[i])*k;draw();
 if(watching||(!quiet&&!paused&&!freezeTime)||Math.abs(p-target)>1e-5||Math.abs(progressVelocity)>.0002||(!paused&&Math.hypot(aim[0]-ptr[0],aim[1]-ptr[1])>.001))wake();else last=0;
}
function onScroll(){if(!cinematic()||quiet||watching)return;const next=clamp(scrollY/scrollRange());if(freezeTime&&Math.abs(next-p)<.0002)return;freezeTime=false;target=next;wake();}
function setProgress(v){watching=false;freezeTime=true;target=p=clamp(v);progressVelocity=0;if(cinematic())scrollTo({top:p*scrollRange(),behavior:'instant'});draw();}
function syncMotionControl(){const button=$('#motion');button.disabled=quiet;button.querySelector('span').textContent=quiet?'Motion off':paused?'Motion off':'Motion on';button.setAttribute('aria-pressed',String(paused||quiet));button.title=quiet?'Reduced motion is enabled':paused?'Resume ambient motion':'Pause ambient motion; scrolling remains available';}
$('#motion').addEventListener('click',()=>{paused=!paused;syncMotionControl();last=0;wake();});
$('#replay').addEventListener('click',()=>{stopJourney();freezeTime=false;scrollTo({top:0,behavior:quiet?'instant':'smooth'});});
$('.brand').addEventListener('click',e=>{e.preventDefault();stopJourney();freezeTime=false;scrollTo({top:0,behavior:quiet?'instant':'smooth'});});
function takeOver(){if(watching)stopJourney();}
addEventListener('wheel',takeOver,{passive:true});addEventListener('touchstart',e=>{if(!e.target.closest('#journey,#motion'))takeOver();},{passive:true});
addEventListener('pointerdown',e=>{if(!e.target.closest('#journey,#motion'))takeOver();},{passive:true});
addEventListener('keydown',e=>{
 if(e.target.closest('input,textarea,select,[contenteditable=true]'))return;
 if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)||(e.key===' '&&!e.target.closest('button')))takeOver();
});
function centrePointer(){aim=[0,0];wake();}
document.documentElement.addEventListener('pointerleave',centrePointer);addEventListener('blur',centrePointer);
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',queueResize);addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!quiet&&!paused){aim=[clamp(e.clientX/w*2-1,-1,1),clamp(e.clientY/h*2-1,-1,1)];wake();}},{passive:true});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
const io=new IntersectionObserver(es=>{inView=es[0].isIntersecting;if(!inView){cancelAnimationFrame(raf);raf=0;}last=0;wake();});io.observe(stage);
mq.addEventListener('change',()=>{quiet=mq.matches||staticView||fallbackMode;if(quiet)stopJourney();aim=[0,0];ptr=[0,0];progressVelocity=0;document.documentElement.classList.toggle('quiet',quiet);syncMotionControl();queueResize();wake();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();shadowState=null;ready=false;cancelAnimationFrame(raf);raf=0;document.documentElement.classList.remove('ready');});canvas.addEventListener('webglcontextrestored',()=>initialize());
function dispose(){disposeShadows();cancelAnimationFrame(raf);cancelAnimationFrame(resizeRequest);raf=0;initGeneration++;if(gl){[...Object.values(details),back].filter(Boolean).forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buf);gl.deleteBuffer(indexBuf);gl.deleteProgram(program);}io.disconnect();alive=false;}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}});addEventListener('pageshow',()=>{last=0;wake();});
async function initialize(){const generation=++initGeneration;try{mobile=(stage.offsetWidth||innerWidth)<700;const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(BACK_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);if(!alive||generation!==initGeneration)return;gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,stencil:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');program=gl.createProgram();shader(gl.VERTEX_SHADER,vert);shader(gl.FRAGMENT_SHADER,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const mesh=makeMesh();meshCount=mesh.i.length;buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);indexBuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);for(const[n,size,offset]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){const a=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset);}for(const n of ['uModel','uVP','uDetail','uBack','uLight','uEye','uPresence','uArtInset','uLightVP','uShadowMap','uShadowEnabled','uShadowTexel','uKeyPosition'])loc[n]=gl.getUniformLocation(program,n);details={};ids.forEach((id,i)=>{details[id]=texture(images[i+1],1,false,+id===18)});back=texture(images[0],2,false,true);gl.uniform1i(loc.uDetail,1);gl.uniform1i(loc.uBack,2);initializeShadows();canvas.setAttribute('data-shadow-map',String(shadowState?.size||0));gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);fallbackMode=false;quiet=mq.matches||staticView;$('#motion').hidden=false;document.documentElement.classList.remove('fallback');ready=true;resize(true);document.documentElement.classList.add('ready');document.documentElement.classList.toggle('quiet',quiet);syncMotionControl();onScroll();draw();wake();}catch(e){if(!alive||generation!==initGeneration)return;diagnostics.failure=String(e);console.error('Olivia card renderer could not start:',e);fallbackMode=true;quiet=true;watching=false;ready=false;document.documentElement.classList.remove('ready');cancelAnimationFrame(raf);raf=0;const poster=$('.poster');poster.src=BACK_DATA;poster.alt='The Olivia Arcana olive lattice card back';document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(0);$('#motion').hidden=true;}}
window.motionStudy={hideChoice(index){choiceHidden=Number.isInteger(index)?index:null;draw();},setProgress,stopJourney,resumeHome,unfold,resize:queueResize,targets:()=>hitTargets,inspect:()=>({p,target,frames,ready,quiet,paused,watching,raf,time,error:ready?gl.getError():diagnostics.error,failure:diagnostics.failure,triangles:meshCount/3*COUNT,cards:COUNT,drawCalls:diagnostics.drawCalls,shadowMap:shadowState?.size||0,shadowDrawCalls:shadowState?.drawCalls||0,shadowFailure:diagnostics.shadowFailure,clearance:diagnostics.clearance,viewport:[w,h],buffer:[canvas.width,canvas.height]}),tracks:()=>tracks,knots};initialize();
})();
