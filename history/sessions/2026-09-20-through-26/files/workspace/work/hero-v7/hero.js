'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('canvas'),stage=$('#stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.12,.28,.45,.62,.78,1],order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
const mq=matchMedia('(prefers-reduced-motion: reduce)'),staticView=new URLSearchParams(location.search).get('motion')==='reduce';let quiet=mq.matches||staticView,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,atlas,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='';
const JOURNEY_SECONDS=86;
let freezeTime=false;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('p')){target=p=clamp(+hash.get('p'));freezeTime=true;}
const diagnostics={};
function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
const CARD_W=1.1667,CARD_H=2,CARD_T=.011;let COUNT=7;
const qstep=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const ramp=(a,b,t)=>qstep((t-a)/(b-a));
const travelPace=p=>p,copyPace=p=>p;
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s);
function rotate(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const START=[-.12,-.34],END=[-.07,-Math.PI+.14];
const startNormal=rotate(model([0,0,0,...START,0,1]),[0,0,1]);
const endNormal=rotate(model([0,0,0,...END,0,1]),[0,0,1]);
let story;
function screenPoint(x,y,z){const t=Math.tan(19*Math.PI/180)*(10.4-z);return [(x-.5)*2*t*w/h,(.5-y)*2*t,z];}
// All cards in a packet occupy distinct parallel planes. Their paths can open
// across the screen without any solid card passing through another one.
function planePoint(x,y,n,d){
 const t=Math.tan(19*Math.PI/180),a=(x-.5)*2*t*w/h,b=(.5-y)*2*t;
 const q=n[0]*a+n[1]*b,z=(d-10.4*q)/(n[2]-q);
 return screenPoint(x,y,z);
}
function curve(a,b,t,bow){
 const u=1-t;
 const c=[mix(a[0],b[0],.32)+bow[0],mix(a[1],b[1],.32)+bow[1]];
 const d=[mix(a[0],b[0],.72)+bow[0]*.55,mix(a[1],b[1],.72)+bow[1]*.55];
 return [0,1].map(j=>u*u*u*a[j]+3*u*u*t*c[j]+3*u*t*t*d[j]+t*t*t*b[j]);
}
function makeTracks(){
 const portrait=w/h<1.15,short=h<650;COUNT=portrait?5:7;
 const ids=[18,17,2,19,21,0,9];
 const start=[portrait?.58:.66,portrait?(short?.35:.39):.45,portrait?(short?.33:.39):.47];
 const end=[portrait?.64:.70,portrait?(short?.32:.35):(short?.50:.43),portrait?(short?.36:.425):.59];
 const field=portrait?
 [[.28,.45,.29],[.65,.26,.22],[.77,.60,.24],[.35,.73,.21],[.18,.20,.15]]:
 [[.30,.57,.32],[.53,.26,.24],[.78,.32,.29],[.67,.68,.26],[.45,.73,.20],[.16,.29,.19],[.90,.67,.17]];
 if(!portrait&&short){field[1][1]=.325;field[2][1]=.35;}
 const crown=portrait?
 [[.52,.45,.34],[.20,.205,.13],[.82,.235,.135],[.79,.73,.15],[.20,.74,.14]]:
 [[.57,.48,.50],[.30,.25,.22],[.82,.30,.21],[.78,.71,.22],[.37,.75,.20],[.17,.50,.16],[.92,.51,.14]];
 if(!portrait&&short)crown[1][1]=.305;
 const bows=portrait?[[.07,-.035],[-.035,-.025],[.04,.015],[-.035,.035],[-.065,-.02]]:
 [[-.08,.015],[-.03,-.03],[.035,-.015],[.045,.025],[-.045,.045],[-.075,-.055],[.02,.04]];
 const startD=dot(startNormal,screenPoint(start[0],start[1],0));
 const endD=dot(endNormal,screenPoint(end[0],end[1],0));
 const unit=Math.tan(19*Math.PI/180)*10.4;
 story={portrait,start,end,startD,endD,unit};
 tracks=Array.from({length:COUNT},(_,i)=>{
  const j=i/(COUNT-1)-.5;
  return {id:ids[i],i,field:field[i],crown:crown[i],bow:bows[i],
   fan:[(portrait?.57:.69)+j*(portrait?.32:.23),(portrait?.38:.45)-(portrait?.075:.10)*Math.sin((j+.5)*Math.PI),portrait?.265:.35],
   bank:[-.08,.07,-.08,.06,-.04,.10,-.08][i],fanBank:-.13+j*.40};
 });
}
function ribbon(progress){
 const {portrait,start,end,startD,endD,unit}=story;
 const poses=[];
 for(const card of tracks){
  const {i,field,crown,fan,bank,fanBank}=card;
  let xy,hh,pitch=START[0],yaw=START[1],rz,centre;
  const packetD=startD-i*.014*start[2]*unit;
  const fanD=startD-i*.12;
  const spreadD=startD-i*.30;
  const gatherD=endD+i*.24;
  if(progress<.18){
   const t=ramp(.015+i*.004,.155+i*.004,progress);
   xy=curve(start,fan,t,[0,-.025]);hh=mix(start[2],fan[2],t);
   rz=mix(-.13,fanBank,t);centre=planePoint(...xy,startNormal,mix(packetD,fanD,ramp(.015,.155,progress)));
  }else if(progress<.415){
   const t=ramp(.18+i*.003,.375+i*.005,progress);
   xy=curve(fan,field,t,card.bow);hh=mix(fan[2],field[2],t);
   rz=mix(fanBank,bank,t);centre=planePoint(...xy,startNormal,mix(fanD,spreadD,t));
  }else if(progress<.655){
   // A deliberate ripple: each card reveals itself in its own clear space.
   const t=ramp(.422+i*.012,.560+i*.012,progress);
   xy=field;hh=field[2];pitch=mix(START[0],END[0],t);yaw=mix(START[1],END[1],t);
   rz=mix(bank,-bank*.65,t);
   const a=planePoint(...xy.slice(0,2),startNormal,spreadD),b=planePoint(...xy.slice(0,2),endNormal,gatherD);
   centre=screenPoint(xy[0],xy[1],mix(a[2],b[2],t));
  }else if(progress<.825){
   const t=ramp(.655+i*.002,.805+i*.002,progress);
   xy=curve(field,crown,t,[card.bow[0]*-.30,card.bow[1]*.30]);hh=mix(field[2],crown[2],t);
   pitch=END[0];yaw=END[1];rz=mix(-bank*.65,i===0?.03:-bank,t);
   centre=planePoint(...xy,endNormal,gatherD);
  }else{
   // The Moon holds the foreground while the surrounding cards settle behind it.
   // Plane order stays fixed throughout the gathering, including its last millimetre.
   const t=ramp(.825+i*.002,.976+i*.002,progress);
   xy=curve(crown,end,t,[i===0?.025:(i%2?.045:-.04),i===0?-.02:(i%2?-.02:.015)]);
   hh=mix(crown[2],end[2],t);pitch=END[0];yaw=END[1];rz=mix(i===0?.03:-bank,.055,t);
   centre=planePoint(...xy,endNormal,mix(gatherD,endD+i*.014*end[2]*unit,t));
  }
  const k=hh*(10.4-centre[2])*Math.tan(19*Math.PI/180);
  const matrix=model([...centre,pitch,yaw,rz,k]);
  poses.push({id:card.id,centre,matrix,u:progress,d:progress,scale:k});
 }
 diagnostics.clearance={cards:COUNT,phase:progress<.18?'opening':progress<.415?'unfolding':progress<.655?'revelation':progress<.825?'moon':'gathering'};
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
 const turn=model([0,0,0,rx,ry,rz,1]),portrait=w/h<1.15;
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
 const opening=1-smooth(.045,.14,progress),introOpacity=1-smooth(.07,.15,progress),middle=smooth(.17,.205,progress)*(1-smooth(.235,.265,progress)),end=smooth(.91,.98,progress);
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
