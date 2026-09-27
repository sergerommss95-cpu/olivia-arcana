'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('canvas'),stage=$('#stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.12,.28,.45,.62,.78,1],order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
const mq=matchMedia('(prefers-reduced-motion: reduce)'),staticView=new URLSearchParams(location.search).get('motion')==='reduce';let quiet=mq.matches||staticView,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,atlas,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='';
const JOURNEY_SECONDS=78;
let freezeTime=false;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('p')){target=p=clamp(+hash.get('p'));freezeTime=true;}
const diagnostics={};
function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
const CARD_W=1.1667,CARD_H=2,CARD_T=.011;let COUNT=14;
const qstep=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const ramp=(a,b,t)=>qstep((t-a)/(b-a));
// Ease velocity only at the shoulders. A steady middle gives each face time
// in the foreground instead of accelerating the entire train through it.
function travelPace(progress){
 const u=clamp((progress-.055)/.905),shoulder=.18;
 const integral=x=>x*x*x*x*(2.5-3*x+x*x);
 if(u<shoulder)return shoulder*integral(u/shoulder)/(1-shoulder);
 if(u>1-shoulder)return 1-shoulder*integral((1-u)/shoulder)/(1-shoulder);
 return (u-shoulder/2)/(1-shoulder);
}
// Keep the typography tied to the same card poses after retiming the journey.
function copyPace(progress){
 if(progress<=.055||progress>=.96)return progress;
 const distance=travelPace(progress);let low=0,high=1;
 for(let i=0;i<24;i++){const mid=(low+high)/2;if(qstep(mid)<distance)low=mid;else high=mid;}
 return .055+.905*(low+high)/2;
}
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s);
function rotate(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];}
// A fixed spatial rail, sampled by arc length. Each card travels through it once.
// Release and arrival are staggered along the same rail; no whole-scene auto zoom.
let rail=[],railLength=0,railStations=[],attitude;
const startFrame=model([0,0,0,-.12,-.34,-.13,1]),endFrame=model([0,0,0,-.07,-Math.PI+.14,.055,1]);
const startNormal=rotate(startFrame,[0,0,1]),endNormal=rotate(endFrame,[0,0,1]);
function catmull(a,b,c,d,t){const t2=t*t,t3=t2*t;return b.map((v,j)=>.5*((2*v)+(-a[j]+c[j])*t+(2*a[j]-5*v+4*c[j]-d[j])*t2+(-a[j]+3*v-3*c[j]+d[j])*t3));}
function makeTracks(){
 const portrait=w/h<1.0;COUNT=portrait?5:9;
 const ids=[18,17,2,19,21,9,0,6,14];tracks=Array.from({length:COUNT},(_,i)=>({id:ids[i],i}));
 const short=h<650;
 const tan=Math.tan(19*Math.PI/180),aspect=w/h;
 const screen=([x,y,z])=>[(x-.5)*2*tan*(10.4-z)*aspect,(.5-y)*2*tan*(10.4-z),z];
 const start=screen(portrait?[.58,short?.35:.39,0]:[.66,.45,0]);
 const finish=screen(portrait?[.64,short?.32:.35,0]:[.70,short?.50:.43,0]);
 const stops=portrait?[[.885,.29,1.7],[.90,.24,-3],[.60,.22,-3],[.28,.30,-3],[.31,.40,-.2],[.34,.70,1.7],[.31,.72,-4.6],[.65,.55,-4.6]]:
 [[.88,short?.35:.30,1.7],[.89,short?.31:.24,-3],[.66,short?.31:.24,-3],[.33,short?.33:.28,-3],[.20,.40,-.2],[.34,short?.65:.69,1.7],[.34,short?.70:.72,-4.6],[.68,.54,-4.6]];
 // Clear each packet along its own face normal before changing orientation.
 const points=[start,add(start,scale(startNormal,.6)),add(start,scale(startNormal,1.5)),...stops.map(screen),add(finish,scale(endNormal,1.5)),add(finish,scale(endNormal,.6)),finish];
 rail=[];railLength=0;
 for(let segment=0;segment<points.length-1;segment++)for(let k=0;k<48;k++){
  const t=k/48,v=catmull(points[Math.max(0,segment-1)],points[segment],points[segment+1],points[Math.min(points.length-1,segment+2)],t);
  if(rail.length)railLength+=Math.hypot(...v.map((x,j)=>x-rail[rail.length-1].point[j]));
  rail.push({point:v,d:railLength});
 }
 const v=points[points.length-1];railLength+=Math.hypot(...v.map((x,j)=>x-rail[rail.length-1].point[j]));rail.push({point:v,d:railLength});
 railStations=points.map((_,i)=>rail[i*48].d/railLength);
 // Shared angular derivatives preserve momentum through compatible keys.
 // Direction changes and flat clearances still settle naturally without overshoot.
 attitude={
  yaw:angularTrack([[0,-.34],[railStations[2],-.34],[railStations[3],-Math.PI/2],[railStations[4],-Math.PI/2],[railStations[5],-.40],[.515,-Math.PI+.16],[.70,-Math.PI-.14],[.90,-Math.PI+.14],[1,-Math.PI+.14]]),
  bank:angularTrack([[0,-.13],[railStations[2],-.13],[railStations[3],0],[railStations[4],0],[railStations[5],.17],[.53,.21],[.72,-.14],[.90,.055],[1,.055]]),
  pitch:angularTrack([[0,-.12],[railStations[2],-.12],[railStations[3],0],[railStations[4],0],[railStations[5],.22],[.53,-.12],[.72,.08],[.90,-.07],[1,-.07]])
 };
 // Shared derivatives make adjacent distance segments C1 instead of a polyline.
 for(let i=0;i<rail.length;i++){const prev=rail[Math.max(0,i-1)].point,next=rail[Math.min(rail.length-1,i+1)].point;const delta=next.map((v,j)=>v-prev[j]),length=Math.hypot(...delta);rail[i].tangent=delta.map(v=>v/length);}
}
function onRail(distance){
 const d=clamp(distance,0,railLength);let lo=0,hi=rail.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(rail[mid].d<d)lo=mid;else hi=mid;}
 const a=rail[lo],b=rail[hi],length=b.d-a.d,f=(d-a.d)/Math.max(.00001,length),f2=f*f,f3=f2*f;
 return a.point.map((v,j)=>(2*f3-3*f2+1)*v+(f3-2*f2+f)*length*a.tangent[j]+(-2*f3+3*f2)*b.point[j]+(f3-f2)*length*b.tangent[j]);
}
// f(0)=f'(0)=f''(0)=0; f(1)=f'(1)=1 and f''(1)=0.
// Every card therefore leaves/rests smoothly even when the shared train is moving.
function softDistance(d){const edge=1.1;if(d<=0)return 0;if(d>=railLength)return railLength;const shoulder=x=>{const t=x/edge;return edge*t*t*t*(6+t*(-8+3*t));};if(d<edge)return shoulder(d);if(d>railLength-edge)return railLength-shoulder(railLength-d);return d;}
function angularTrack(keys){
 const intervals=keys.slice(1).map((v,i)=>v[0]-keys[i][0]);
 const slopes=keys.slice(1).map((v,i)=>(v[1]-keys[i][1])/intervals[i]);
 const derivatives=keys.map((_,i)=>{
  if(i===0||i===keys.length-1||slopes[i-1]*slopes[i]<=0)return 0;
  const before=intervals[i-1],after=intervals[i],a=2*after+before,b=after+2*before;
  return (a+b)/(a/slopes[i-1]+b/slopes[i]);
 });
 return {keys,derivatives};
}
function angleAt(t,track){
 const {keys,derivatives}=track;
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
  const length=keys[i][0]-keys[i-1][0],u=clamp((t-keys[i-1][0])/length),u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*keys[i-1][1]+(u3-2*u2+u)*length*derivatives[i-1]+(-2*u3+3*u2)*keys[i][1]+(u3-u2)*length*derivatives[i];
 }
 return keys[keys.length-1][1];
}
function ribbon(progress){
 const t=progress,portrait=w/h<1.0,short=h<650,tan=Math.tan(19*Math.PI/180);
 const flightHeight=portrait?.21:.235,flightScale=flightHeight*10.4*tan;
 const gap=flightScale*(portrait?mix(4.6,4.9,ramp(.60,.85,w/h)):4.9);
 const train=(COUNT-1)*gap;
 const drive=travelPace(t);
 const travelled=drive*(railLength+train);
 const startScale=(portrait?(short?.33:.39):.47)*10.4*tan;
 const endScale=(portrait?(short?.36:.425):.59)*10.4*tan;
 const idle=!quiet&&!freezeTime;
 const breath=idle?Math.sin(time*.45)*.012:0;
 // A compact normal stack opens slightly before the procession. Parallel faces
 // retain their order and return to the original spacing before any loop returns.
 const packetLift=ramp(.008,.085,t)*(1-ramp(.10,.225,t));
 const packetPitch=.014+.024*packetLift;
 const poses=[];
 for(let i=0;i<COUNT;i++){
  const d=travelled-i*gap,position=softDistance(d),u=clamp(position/railLength);
  const release=ramp(0,1.35,position),arrival=ramp(railLength-1.35,railLength,position);
  const near=ramp(.38,.55,u)*(1-ramp(.73,.90,u));
  const scaleFlight=flightScale*(1+.19*near);
  const k=mix(mix(startScale,scaleFlight,release),endScale,arrival);
  const c=onRail(position);
  // Remaining cards occupy the real starting packet. Arrived cards gather behind the Moon.
  for(let j=0;j<3;j++)c[j]+=(1-release)*(-i*packetPitch)*startScale*startNormal[j]+arrival*(i*.014)*endScale*endNormal[j];
  const yaw=angleAt(u,attitude.yaw),bank=angleAt(u,attitude.bank),pitch=angleAt(u,attitude.pitch);
  const m=model([c[0]+ptr[0]*.075,c[1]-ptr[1]*.055+breath,c[2],pitch,yaw,bank,k]);
  poses.push({id:tracks[i].id,centre:c,matrix:m,u,d,scale:k});
 }
 diagnostics.clearance={railLength,gap,travelled,arrival:ramp(railLength-2.2,railLength,travelled),cards:COUNT};
 return poses;
}

const vert=`
attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;
uniform mat4 uModel,uVP;uniform float uBend,uTwist;
varying vec2 vUV;varying vec3 vNormal,vWorld;varying float vSide;
void main(){vec3 p=aPos;float k=uBend;float ang=k*p.x;vec3 n=aNormal;
float aa=ang*ang;float xx=p.x;p.x=xx*(1.0-aa/6.0+aa*aa/120.0-aa*aa*aa/5040.0);p.z+=xx*ang*(0.5-aa/24.0+aa*aa/720.0);n=vec3(n.x*cos(ang)-n.z*sin(ang),n.y,n.x*sin(ang)+n.z*cos(ang));
float tw=uTwist*p.y;mat2 rot=mat2(cos(tw),sin(tw),-sin(tw),cos(tw));p.xz=rot*p.xz;n.xz=rot*n.xz;if(abs(aNormal.z)>.5){float ca=cos(ang+tw),sa=sin(ang+tw);n=normalize(vec3(-sa,-uTwist*(ca*p.x+sa*p.z),ca));}
vec4 world=uModel*vec4(p,1.);vUV=aUV;vSide=abs(aNormal.z)<.5?1.:0.;vNormal=normalize(mat3(uModel)*n);vWorld=world.xyz;gl_Position=uVP*world;}`;
const frag=`
precision mediump float;varying vec2 vUV;varying vec3 vNormal,vWorld;varying float vSide;
uniform sampler2D uAtlas,uDetail,uBack;uniform vec4 uUV;uniform float uDetailed;uniform vec2 uLight;
const vec3 abyss=vec3(.039216,.05098,.219608);
void main(){vec2 uv=clamp(vUV,0.,1.);vec2 q=abs(uv-.5)-vec2(.475,.485);float rounded=length(max(q,0.))+min(max(q.x,q.y),0.)-.019;
if(vSide<.5&&rounded>0.)discard;
vec3 tex;
if(gl_FrontFacing)tex=texture2D(uBack,vec2(uv.x,1.-uv.y)).rgb;
else if(uDetailed>.5)tex=texture2D(uDetail,vec2(1.-uv.x,1.-uv.y)).rgb;
else tex=texture2D(uAtlas,uUV.xy+vec2(1.-uv.x,1.-uv.y)*uUV.zw).rgb;
vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
vec3 key=normalize(vec3(-3.5+uLight.x,5.0+uLight.y,9.0)-vWorld);
vec3 view=normalize(vec3(0.,0.,10.4)-vWorld);
float light=.68+.43*max(0.,dot(n,key));
vec3 col=pow(tex,vec3(2.2))*light;
float edge=1.-smoothstep(.004,.012,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
float sheen=pow(max(0.,dot(n,normalize(key+view))),46.);
float gold=smoothstep(.035,.17,tex.r-tex.b)*smoothstep(.30,.66,tex.r);
// The reflection belongs to the warm ink and the thin cut edge, not the blue field.
col+=vec3(.34,.24,.105)*sheen*(gold*.34+edge*.40);
if(vSide>.5)col=vec3(.055,.059,.10)+vec3(.21,.18,.12)*max(0.,dot(n,normalize(vec3(-.5,.8,2.5))));
float dim=clamp((-vWorld.z-.5)*.075,0.,.40);col=mix(col,pow(abyss,vec3(2.2)),dim);
gl_FragColor=vec4(pow(max(col,0.),vec3(1./2.2)),1.);
}`;
function makeMesh(){const verts=[],indices=[],nx=8,ny=12;function v(x,y,z,nx,ny,nz,u,v){verts.push(x,y,z,nx,ny,nz,u,v);}
 // One double-sided tessellated sheet, plus a narrow physical perimeter.
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)v((x/nx-.5)*1.1667,(y/ny-.5)*2,0,0,0,1,x/nx,y/ny);
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;indices.push(a,b,c,b,d,c);}
 const edge=[];for(let x=0;x<=nx;x++)edge.push([x/nx,0,0,-1]);for(let y=1;y<=ny;y++)edge.push([1,y/ny,1,0]);for(let x=nx-1;x>=0;x--)edge.push([x/nx,1,0,1]);for(let y=ny-1;y>0;y--)edge.push([0,y/ny,-1,0]);
 const base=verts.length/8;edge.forEach(([u,vv,nx,ny])=>{for(let z of [-.0055,.0055])v((u-.5)*1.1667,(vv-.5)*2,z,nx,ny,0,u,vv);});
 for(let i=0;i<edge.length;i++){const a=base+i*2,b=base+((i+1)%edge.length)*2;indices.push(a,b,a+1,b,b+1,a+1);}
 return {v:new Float32Array(verts),i:new Uint16Array(indices)};}
function shader(type,s){const a=gl.createShader(type);gl.shaderSource(a,s);gl.compileShader(a);if(!gl.getShaderParameter(a,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(a));gl.attachShader(program,a);gl.deleteShader(a);}
function texture(img,unit,mip){
 const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
 let source=img;
 if((img.width&(img.width-1))||(img.height&(img.height-1))){
  const c=document.createElement('canvas');c.width=mobile?512:1024;c.height=mobile?1024:2048;
  const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);source=c;
 }
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
 const aniso=gl.getExtension('EXT_texture_filter_anisotropic');if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 return t;
}
async function load(src){const img=new Image();img.src=src;await img.decode();return img;}
function scrollRange(){return Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function resize(force=false){
 const nextWidth=stage.offsetWidth,nextHeight=stage.offsetHeight,changed=force||nextWidth!==w||nextHeight!==h;
 w=nextWidth;h=nextHeight;mobile=w<700;
 const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75,Math.sqrt(3500000/(w*h))),pixelWidth=Math.round(w*dpr),pixelHeight=Math.round(h*dpr);
 if(force||canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;gl?.viewport(0,0,pixelWidth,pixelHeight);}
 if(changed)makeTracks();
 if(watching)scrollTo({top:target*scrollRange(),behavior:'instant'});else if(!freezeTime)target=clamp(scrollY/scrollRange());
 wake();
}
function queueResize(){if(!resizeRequest)resizeRequest=requestAnimationFrame(()=>{resizeRequest=0;resize();});}
// Rotate the complete scene around the held deck. It is one rigid transform,
// so mouse response and the long breath cannot change card-to-card clearance.
function sceneFrame(progress){
 const still=quiet||freezeTime,holding=1-ramp(.12,.32,progress)+ramp(.81,.98,progress),weight=.14+.86*holding;
 const phase=still?0:time,x=still?0:ptr[0],y=still?0:ptr[1];
 const rx=(-y*.014+Math.sin(phase*.29)*.009)*weight,ry=(x*.024+Math.sin(phase*.23)*.016)*weight,rz=Math.sin(phase*.19)*.007*weight;
 const turn=model([0,0,0,rx,ry,rz,1]),portrait=w/h<1;
 const end=ramp(.7,.96,progress),sx=mix(portrait?.58:.66,portrait?.64:.70,end),sy=mix(portrait?(h<650?.35:.39):.45,portrait?(h<650?.32:.35):(h<650?.50:.43),end);
 const tan=Math.tan(19*Math.PI/180),anchor=[(sx-.5)*2*tan*10.4*w/h,(.5-sy)*2*tan*10.4,0],turned=rotate(turn,anchor);
 turn[12]=anchor[0]-turned[0];turn[13]=anchor[1]-turned[1];turn[14]=anchor[2]-turned[2];return turn;
}
function draw(){if(!ready)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const progress=quiet?1:p,zoom=10.4;gl.uniformMatrix4fv(loc.uVP,false,perspective(w/h,zoom));
 const poses=ribbon(progress),scene=sceneFrame(progress);
 gl.uniform2f(loc.uLight,quiet?0:ptr[0]*.6,quiet?0:-ptr[1]*.3);
 for(let i=COUNT-1;i>=0;i--){const pose=poses[i];
  gl.uniformMatrix4fv(loc.uModel,false,mul(scene,pose.matrix));gl.uniform1f(loc.uBend,0);gl.uniform1f(loc.uTwist,0);const id=pose.id;
  gl.uniform4f(loc.uUV,(id%8)/8+1/2048,Math.floor(id/8)/4+1/2048,254/2048,437/2048);gl.uniform1f(loc.uDetailed,details[id]?1:0);
  if(details[id]){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,details[id]);}gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);
 }
 frames++;updateCopy(copyPace(progress));updateJourneyControl();
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
let copyProgress=-1;
function updateCopy(progress){
 if(Math.abs(progress-copyProgress)<.000001)return;copyProgress=progress;
 const opening=1-smooth(.065,.19,progress),introOpacity=1-smooth(.075,.19,progress),middle=smooth(.19,.235,progress)*(1-smooth(.285,.34,progress)),end=smooth(.79,.91,progress);
 openingType.style.opacity=String(opening);openingType.style.transform=`translateY(${-progress*40}px)`;
 intro.style.opacity=String(introOpacity);intro.style.transform=`translateY(${-20*(1-introOpacity)}px)`;intro.setAttribute('aria-hidden',String(introOpacity<.1));
 intertitle.style.opacity=String(middle);intertitle.style.transform=`translateY(${(1-middle)*20}px)`;
 closing.style.opacity=String(end);closing.style.transform=`translateY(${(1-end)*18}px)`;closing.inert=end<.5;closing.setAttribute('aria-hidden',String(end<.5));
 $('#line').style.transform=`scaleX(${quiet?1:p})`;$('#scroll-label').textContent=progress>.93?'A WORLD WITHIN YOU':'SCROLL TO UNFOLD';
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
function onScroll(){if(freezeTime||watching)return;target=clamp(scrollY/scrollRange());wake();}
function setProgress(v){watching=false;freezeTime=true;target=p=clamp(v);progressVelocity=0;draw();}
$('#motion').addEventListener('click',()=>{paused=!paused;$('#motion').textContent=paused?'Resume drift':'Pause drift';$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').title=paused?'Resume ambient floating':'Pause ambient floating; scrolling remains available';last=0;wake();});
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
mq.addEventListener('change',()=>{quiet=mq.matches||staticView;if(quiet)stopJourney();aim=[0,0];ptr=[0,0];progressVelocity=0;document.documentElement.classList.toggle('quiet',quiet);queueResize();wake();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;cancelAnimationFrame(raf);raf=0;document.documentElement.classList.remove('ready');});canvas.addEventListener('webglcontextrestored',()=>initialize());
function dispose(){cancelAnimationFrame(raf);cancelAnimationFrame(resizeRequest);raf=0;initGeneration++;if(gl){[atlas,...Object.values(details),back].forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buf);gl.deleteBuffer(indexBuf);gl.deleteProgram(program);}io.disconnect();alive=false;}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}});addEventListener('pageshow',()=>{last=0;wake();});
async function initialize(){const generation=++initGeneration;try{mobile=stage.offsetWidth<700;const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(ATLAS_DATA),load(BACK_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);if(!alive||generation!==initGeneration)return;gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,stencil:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');program=gl.createProgram();shader(gl.VERTEX_SHADER,vert);shader(gl.FRAGMENT_SHADER,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const mesh=makeMesh();meshCount=mesh.i.length;buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);indexBuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);for(const[n,size,offset]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){const a=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset);}for(const n of ['uModel','uVP','uBend','uTwist','uAtlas','uDetail','uBack','uUV','uDetailed','uLight'])loc[n]=gl.getUniformLocation(program,n);atlas=texture(images[0],0,true);details={};ids.forEach((id,i)=>{details[id]=texture(images[i+2],1,false)});back=texture(images[1],2,false);gl.uniform1i(loc.uAtlas,0);gl.uniform1i(loc.uDetail,1);gl.uniform1i(loc.uBack,2);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);ready=true;resize(true);document.documentElement.classList.add('ready');document.documentElement.classList.toggle('quiet',quiet);onScroll();draw();wake();}catch(e){if(!alive||generation!==initGeneration)return;diagnostics.failure=String(e);const poster=$('.poster');poster.src=DETAIL_DATA[18];poster.alt='The Moon card — carved ivory on lapis';document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(1);$('#motion').hidden=true;}}
window.motionStudy={setProgress,inspect:()=>({p,target,frames,ready,quiet,paused,watching,raf,time,error:ready?gl.getError():diagnostics.error,failure:diagnostics.failure,triangles:meshCount/3*COUNT,cards:COUNT,clearance:diagnostics.clearance,viewport:[w,h],buffer:[canvas.width,canvas.height]}),tracks:()=>tracks,knots};initialize();
})();
