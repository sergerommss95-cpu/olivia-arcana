'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('canvas'),stage=$('#stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.12,.28,.45,.62,.78,1],order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
const mq=matchMedia('(prefers-reduced-motion: reduce)'),staticView=new URLSearchParams(location.search).get('motion')==='reduce';let quiet=mq.matches||staticView,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='';
const JOURNEY_SECONDS=96;
let freezeTime=false;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('p')){target=p=clamp(+hash.get('p'));freezeTime=true;}
const diagnostics={};
function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
const CARD_W=1.1667,CARD_H=2,CARD_T=.011;let COUNT=32;
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
function cameraPose(progress){
 const dolly=ramp(.34,.82,progress),inside=ramp(.24,.47,progress)*(1-ramp(.73,.96,progress));
 const eye=[Math.sin(dolly*Math.PI*1.45)*(w/h<1.15?.25:.82)*inside,Math.sin(dolly*Math.PI*2)*.28*inside,mix(10.4,-12,dolly)];
 const at=[eye[0]+Math.sin(dolly*Math.PI*1.7)*.32*inside,eye[1]+Math.sin(dolly*Math.PI)*.16*inside,eye[2]-10.4];
 const view=lookAt(eye,at,Math.sin(dolly*Math.PI*1.7)*.045*inside);
 const fov=mix(38,46,ramp(.2,.45,progress)*(1-ramp(.78,.97,progress))),f=1/Math.tan(fov*Math.PI/360),near=.12,far=75;
 const projection=new Float32Array([f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
 return {eye,view,vp:mul(projection,view),fov};
}
const START=[-.12,-.34],END=[-.07,-Math.PI+.14];
const startNormal=rotate(model([0,0,0,...START,0,1]),[0,0,1]),endNormal=rotate(model([0,0,0,...END,0,1]),[0,0,1]);
let story;
function screenPoint(x,y,z,eyeZ=10.4){const t=Math.tan(19*Math.PI/180)*(eyeZ-z);return [(x-.5)*2*t*w/h,(.5-y)*2*t,z];}
function makeTracks(){
 const portrait=w/h<1.15,short=h<650;COUNT=portrait?22:32;
 const unit=Math.tan(19*Math.PI/180)*10.4;
 const start=screenPoint(portrait?.58:.66,portrait?(short?.35:.39):.45,0);
 const end=screenPoint(portrait?.64:.70,portrait?(short?.32:.35):(short?.50:.43),-22.4,-12);
 const ss=(portrait?(short?.33:.39):.47)*unit,es=(portrait?(short?.36:.425):.59)*unit;
 const sequence=[0,1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,2,19,20,21];
 const ids=Array.from({length:COUNT},(_,i)=>i===COUNT-1?18:sequence[i%sequence.length]);
 story={portrait,short,start,end,ss,es,rx:portrait?1.58:2.75,ry:short?2.25:2.55};
 tracks=ids.map((id,i)=>({id,i,u:i/(COUNT-1),phi:i/COUNT*Math.PI*2-.85}));
}
function radialBank(phi){return Math.atan2(Math.sin(phi-Math.PI/2),Math.cos(phi-Math.PI/2));}
function bloomCard(card,progress){
 const {portrait,start,ss,rx,ry}=story,{i,phi}=card;
 const spread=ramp(.065+i*.001,.285+i*.001,progress),depth=ramp(.065,.30,progress);
 const x=mix(start[0],Math.cos(phi)*rx+.12,spread),y=mix(start[1],Math.sin(phi)*ry,spread);
 const d=mix(dot(startNormal,start)-i*.017*ss,-i*.14,depth);
 const z=(d-startNormal[0]*x-startNormal[1]*y)/startNormal[2];
 return {c:[x,y,z],s:mix(ss,portrait?.45:.52,spread),rx:START[0],ry:START[1],rz:mix(-.13,radialBank(phi),spread)};
}
function tubeCard(card,progress){
 const {portrait,rx,ry}=story,{i,u,phi}=card;
 const unfold=ramp(.32,.53,progress),orbit=ramp(.32,.76,progress);
 const angle=phi+u*Math.PI*2.8*unfold+orbit*.86;
 const x=Math.cos(angle)*mix(rx,portrait?1.88:3.12,unfold)+.12*(1-unfold);
 const y=Math.sin(angle)*mix(ry,2.7,unfold);
 const ring=bloomCard(card,.32),destination=[x,y,-u*31];
 const planeD=mix(dot(startNormal,ring.c),dot(startNormal,destination),unfold);
 const z=(planeD-startNormal[0]*x-startNormal[1]*y)/startNormal[2];
 const flip=ramp(.43+u*.14,.57+u*.14,progress);
 return {c:[x,y,z],s:mix(portrait?.45:.52,portrait?.70:.76,unfold),rx:mix(START[0],END[0],flip),ry:mix(START[1],END[1],flip),rz:mix(radialBank(phi),Math.sin(angle)*.14,ramp(.34,.57,progress))*(1-ramp(.1,.3,flip)*(1-ramp(.7,.9,flip))),angle};
}
function ribbon(progress){
 const {portrait,end,es,rx,ry}=story,poses=[];
 for(const card of tracks){
  const {i,u,phi}=card;let pose;
  if(progress<.32)pose=bloomCard(card,progress);
  else if(progress<.75)pose=tubeCard(card,progress);
  else{
   const tube=tubeCard(card,.75),carry=ramp(.765,.87,progress),ring=ramp(.75,.815,progress),fold=ramp(.877+i*.00035,.96+i*.00045,progress);
   const angle=mix(tube.angle,phi+Math.PI*.70,ring),rX=mix(portrait?1.88:3.12,portrait?1.7:3.0,ring),rY=mix(2.7,2.55,ring);
   const orbitX=Math.cos(angle)*rX,orbitY=Math.sin(angle)*rY;
   const behind=COUNT-1-i,planeD=dot(endNormal,end)+behind*mix(.10,.017*es,fold);
   const x=mix(orbitX,end[0]+behind*.017*es*endNormal[0],fold),y=mix(orbitY,end[1]+behind*.017*es*endNormal[1],fold);
   const planeZ=(planeD-endNormal[0]*x-endNormal[1]*y)/endNormal[2];
   pose={c:[x,y,mix(tube.c[2],planeZ,carry)],s:mix(mix(tube.s,portrait?.33:.34,ramp(.75,.81,progress)),es,fold),rx:END[0],ry:END[1],rz:mix(mix(tube.rz,-radialBank(phi+Math.PI*.70),ring),.055,fold)};
  }
  if(i===COUNT-1&&progress>.66){
   // The Moon leaves the far end of the passage and fills its quiet centre.
   // It then keeps the frontmost plane while the other cards fold behind it.
   const focus=ramp(.70,.84,progress),inset=ramp(.66,.745,progress),grow=ramp(.70,.84,progress),settle=ramp(.855,.95,progress);
   const central=screenPoint(portrait?.52:.53,portrait?.44:.46,-22.4,-12);
   const x=mix(central[0],end[0],settle),y=mix(central[1],end[1],settle);
   const z=(dot(endNormal,end)-endNormal[0]*x-endNormal[1]*y)/endNormal[2];
   const destination=[x,y,z],heroScale=mix((portrait?.34:.46)*Math.tan(19*Math.PI/180)*10.4,es,settle);
   pose.c=pose.c.map((v,j)=>mix(v,destination[j],j<2?inset:focus));pose.s=mix(pose.s,heroScale,grow);
   pose.rx=mix(pose.rx,END[0],focus);pose.ry=mix(pose.ry,END[1],focus);pose.rz=mix(pose.rz,.055,focus);
  }
  const matrix=model([...pose.c,pose.rx,pose.ry,pose.rz,pose.s]);
  poses.push({id:card.id,centre:pose.c,matrix,u:progress,d:progress,scale:pose.s});
 }
 diagnostics.clearance={cards:COUNT,phase:progress<.32?'aperture':progress<.75?'passage':'convergence'};
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
uniform sampler2D uDetail,uBack;uniform vec2 uLight;uniform vec3 uEye;
const vec3 abyss=vec3(.0235,.0471,.0824);
void main(){vec2 uv=clamp(vUV,0.,1.);vec2 q=abs(uv-.5)-vec2(.475,.485);float rounded=length(max(q,0.))+min(max(q.x,q.y),0.)-.019;
if(vSide<.5&&rounded>0.)discard;
vec3 tex;
if(gl_FrontFacing)tex=texture2D(uBack,vec2(uv.x,1.-uv.y)).rgb;
else tex=texture2D(uDetail,vec2(1.-uv.x,1.-uv.y)).rgb;
vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
vec3 key=normalize(uEye+vec3(-3.5+uLight.x,5.0+uLight.y,1.0)-vWorld);
vec3 view=normalize(uEye-vWorld);
float light=.68+.43*max(0.,dot(n,key));
vec3 col=pow(tex,vec3(2.2))*light;
float edge=1.-smoothstep(.004,.012,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
float sheen=pow(max(0.,dot(n,normalize(key+view))),46.);
float gold=smoothstep(.035,.17,tex.r-tex.b)*smoothstep(.30,.66,tex.r);
// The reflection belongs to the warm ink and the thin cut edge, not the blue field.
col+=vec3(.34,.24,.105)*sheen*(gold*.34+edge*.40);
if(vSide>.5)col=vec3(.055,.059,.10)+vec3(.21,.18,.12)*max(0.,dot(n,normalize(vec3(-.5,.8,2.5))));
float dim=clamp((length(uEye-vWorld)-12.)*.022,0.,.52);col=mix(col,pow(abyss,vec3(2.2)),dim);
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
 const still=quiet||freezeTime,phase=still?0:time,px=still?0:ptr[0],py=still?0:ptr[1];
 const weight=1-ramp(.13,.34,progress)+ramp(.90,1,progress);
 const openingTurn=ramp(.06,.29,progress)*(1-ramp(.30,.48,progress));
 const turn=model([px*.04*weight,-py*.025*weight+Math.sin(phase*.35)*.018*weight,0,openingTurn*.22,-openingTurn*.42,Math.sin(phase*.23)*.003*weight,1]);
 const pivot=[0,0,-1.7],moved=rotate(turn,pivot);turn[12]+=pivot[0]-moved[0];turn[13]+=pivot[1]-moved[1];turn[14]+=pivot[2]-moved[2];return turn;
}
function draw(){if(!ready)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const progress=quiet?1:p,camera=cameraPose(progress);gl.uniformMatrix4fv(loc.uVP,false,camera.vp);gl.uniform3f(loc.uEye,...camera.eye);
 const poses=ribbon(progress),scene=sceneFrame(progress);
 gl.uniform2f(loc.uLight,quiet?0:ptr[0]*.6,quiet?0:-ptr[1]*.3);
 // Opaque cards are drawn nearest first so the held packet does not shade
 // the same pixels once for every hidden card behind it.
 const layers=poses.map(pose=>{
  const matrix=mul(scene,pose.matrix),v=camera.view;
  const depth=v[2]*matrix[12]+v[6]*matrix[13]+v[10]*matrix[14]+v[14];
  const halfDepth=Math.abs(v[2]*matrix[0]+v[6]*matrix[1]+v[10]*matrix[2])*CARD_W/2+Math.abs(v[2]*matrix[4]+v[6]*matrix[5]+v[10]*matrix[6])*CARD_H/2;
  return {id:pose.id,matrix,depth,halfDepth};
 }).filter(pose=>pose.depth-pose.halfDepth<-.12&&pose.depth+pose.halfDepth>-75).sort((a,b)=>b.depth-a.depth);
 for(const pose of layers){
  gl.uniformMatrix4fv(loc.uModel,false,pose.matrix);gl.uniform1f(loc.uBend,0);gl.uniform1f(loc.uTwist,0);
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
let copyProgress=-1;
function updateCopy(progress){
 if(Math.abs(progress-copyProgress)<.000001)return;copyProgress=progress;
 const opening=1-smooth(.075,.20,progress),introOpacity=1-smooth(.09,.18,progress),middle=0,end=smooth(.945,.995,progress);
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
function dispose(){cancelAnimationFrame(raf);cancelAnimationFrame(resizeRequest);raf=0;initGeneration++;if(gl){[...Object.values(details),back].filter(Boolean).forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buf);gl.deleteBuffer(indexBuf);gl.deleteProgram(program);}io.disconnect();alive=false;}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}});addEventListener('pageshow',()=>{last=0;wake();});
async function initialize(){const generation=++initGeneration;try{mobile=stage.offsetWidth<700;const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(BACK_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);if(!alive||generation!==initGeneration)return;gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,stencil:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');program=gl.createProgram();shader(gl.VERTEX_SHADER,vert);shader(gl.FRAGMENT_SHADER,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const mesh=makeMesh();meshCount=mesh.i.length;buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);indexBuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);for(const[n,size,offset]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){const a=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset);}for(const n of ['uModel','uVP','uBend','uTwist','uDetail','uBack','uLight','uEye'])loc[n]=gl.getUniformLocation(program,n);details={};ids.forEach((id,i)=>{details[id]=texture(images[i+1],1,false,+id===18)});back=texture(images[0],2,false,true);gl.uniform1i(loc.uDetail,1);gl.uniform1i(loc.uBack,2);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);ready=true;resize(true);document.documentElement.classList.add('ready');document.documentElement.classList.toggle('quiet',quiet);onScroll();draw();wake();}catch(e){if(!alive||generation!==initGeneration)return;diagnostics.failure=String(e);const poster=$('.poster');poster.src=DETAIL_DATA[18];poster.alt='The Moon card — carved ivory on lapis';document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(1);$('#motion').hidden=true;}}
window.motionStudy={setProgress,inspect:()=>({p,target,frames,ready,quiet,paused,watching,raf,time,error:ready?gl.getError():diagnostics.error,failure:diagnostics.failure,triangles:meshCount/3*COUNT,cards:COUNT,drawCalls:diagnostics.drawCalls,clearance:diagnostics.clearance,viewport:[w,h],buffer:[canvas.width,canvas.height]}),tracks:()=>tracks,knots};initialize();
})();
