'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('canvas'),stage=$('#stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.16,.31,.46,.60,.74,1],order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
const mq=matchMedia('(prefers-reduced-motion: reduce)');let quiet=mq.matches,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,atlas,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let freezeTime=false;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('p')){target=p=clamp(+hash.get('p'));freezeTime=true;}
const diagnostics={};
function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
const CARD_W=1.1667,CARD_H=2,CARD_T=.011;let COUNT=14;
const qstep=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const ramp=(a,b,t)=>qstep((t-a)/(b-a));
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s);
function rotate(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];}
function makeTracks(){COUNT=w/h<.8?9:14;tracks=Array.from({length:COUNT},(_,i)=>({id:i===COUNT-1?18:order[i],i}));}
// One ordered, arc-length ribbon. Cards never interpolate between unrelated positions.
// Local axes start at U=X, H=Y, N=Z: this makes the closed packet a real normal stack.
function ribbon(progress){
 const t=progress,open=ramp(.015,.31,t)*(1-ramp(.80,.925,t));
 const q=open,theta=Math.PI/2*q,kappa=q/(4.3*CARD_W),hw=CARD_W/2,hh=CARD_H/2,ht=CARD_T/2;
 const a=Math.hypot(hw,ht)*Math.sin(theta)+ht*Math.cos(theta);
 const b=Math.hypot(hw,hh,ht);
 const pitch=(2*a+mix(.001,.045,q)*CARD_W)/(1-kappa*b);
 const portrait=w/h<.8,small=h<650;
 const rx=mix(-.12,portrait?.28:.55,q),ry=mix(-.34,-1.53,q)-Math.PI*ramp(.925,1,t);
 const rz=mix(-.13,portrait?-.95:-.37,q)+.03*q+.16*ramp(.28,.80,t)*(1-ramp(.80,.925,t));
 const root=mul(model([0,0,0,0,0,rz,1]),mul(model([0,0,0,rx,0,0,1]),model([0,0,0,0,ry,0,1])));
 const poses=[],centres=[];
 for(let i=0;i<COUNT;i++){
  const s=((COUNT-1)/2-i)*pitch,phi=kappa*s;
  const C=kappa>1e-8?[(1-Math.cos(phi))/kappa,0,Math.sin(phi)/kappa]:[0,0,s];
  const T=[Math.sin(phi),0,Math.cos(phi)],B=[Math.cos(phi),0,-Math.sin(phi)],V=[0,1,0];
  // A single controlled half-turn travels down the fully separated ribbon, then returns.
  const psi=Math.PI*(ramp(.34+i*.0115,.43+i*.0115,t)-ramp(.63+(COUNT-1-i)*.006,.71+(COUNT-1-i)*.006,t));
  const U0=add(scale(B,Math.cos(theta)),scale(T,-Math.sin(theta)));
  const N0=add(scale(T,Math.cos(theta)),scale(B,Math.sin(theta)));
  const U=add(scale(U0,Math.cos(psi)),scale(N0,-Math.sin(psi)));
  const N=add(scale(U0,Math.sin(psi)),scale(N0,Math.cos(psi)));
  const centre=rotate(root,C);centres.push(centre);
  poses.push({id:tracks[i].id,centre,U:rotate(root,U),H:rotate(root,V),N:rotate(root,N)});
 }
 // Fit a conservative swept envelope, independent of each card's turnover angle.
 // The framing therefore stays steady while the turnover propagates.
 const mid=[0,0,0];for(const c of centres)for(let j=0;j<3;j++)mid[j]+=c[j]/COUNT;
 const radius=Math.hypot(hw,hh,ht),tan=Math.tan(19*Math.PI/180),aspect=w/h;
 const sx=mix(portrait?.57:.65,.51,q),sy=mix(portrait?(small?.35:.40):.45,portrait?.44:.49,q)-(portrait?.04:0)*ramp(.91,1,t);
 const offset=[(sx-.5)*20.8*tan*aspect,(.5-sy)*20.8*tan,0];
 const desired=mix(portrait?(small?.33:.38):.46,.19,q)*10.4*tan;
 const left=mix(portrait?.10:.36,.07,q),right=.93,top=.125,bottom=mix(portrait?.63:.79,.86,q);
 const L=(2*left-1)*tan*aspect,R=(2*right-1)*tan*aspect,T=(1-2*top)*tan,B=(1-2*bottom)*tan;
 // Smooth conservative minimum of the perspective fit constraints. No binary-search steps,
 // switching bounding corners, or turnover-dependent zoom. The high power has zero slope at 0.
 let fitSum=1;
 for(const pose of poses){const c=pose.centre;
  const extent=[0,1,2].map(j=>mix(hw*Math.hypot(pose.U[j],.0001)+hh*Math.hypot(pose.H[j],.0001)+ht*Math.hypot(pose.N[j],.0001),radius,ramp(.80,1,q)));
  for(const ex of [-1,1])for(const ey of [-1,1])for(const ez of [-1,1]){
  const X=c[0]-mid[0]+ex*extent[0],Y=c[1]-mid[1]+ey*extent[1],Z=c[2]-mid[2]+ez*extent[2];
  for(const [a,n] of [[X+R*Z,10.4*R-offset[0]],[-X-L*Z,offset[0]-10.4*L],[Y+T*Z,10.4*T-offset[1]],[-Y-B*Z,offset[1]-10.4*B]]){
   const ratio=Math.max(0,desired*a/n);fitSum+=Math.pow(ratio,64);
  }
 }
 }
 const k=desired/Math.pow(fitSum,1/64);
 const lift=!quiet&&!freezeTime?Math.sin(time*.33)*.018:0;
 for(const v of poses){const c=v.centre.map((x,j)=>(x-mid[j])*k+offset[j]);c[0]+=ptr[0]*.045;c[1]+=lift-ptr[1]*.035;
  v.matrix=new Float32Array([...v.U.map(x=>x*k),0,...v.H.map(x=>x*k),0,...v.N.map(x=>x*k),0,...c,1]);}
 diagnostics.clearance={q,pitch,curvature:kappa,sector:2*Math.atan(kappa*a/(1-kappa*b)),angularPitch:kappa*pitch,scale:k};
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
uniform sampler2D uAtlas,uDetail,uBack;uniform vec4 uUV;uniform float uDetailed;
const vec3 abyss=vec3(.039216,.05098,.219608);
void main(){vec2 uv=clamp(vUV,0.,1.);vec2 q=abs(uv-.5)-vec2(.475,.485);float rounded=length(max(q,0.))+min(max(q.x,q.y),0.)-.019;
if(vSide<.5&&rounded>0.)discard;
vec3 tex=texture2D(uAtlas,uUV.xy+vec2(1.-uv.x,1.-uv.y)*uUV.zw).rgb;
if(uDetailed>.5)tex=texture2D(uDetail,vec2(1.-uv.x,1.-uv.y)).rgb;
if(gl_FrontFacing)tex=texture2D(uBack,vec2(uv.x,1.-uv.y)).rgb;
vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
float light=.60+.49*max(0.,dot(n,normalize(vec3(-.5,.8,2.5))));
vec3 col=pow(tex,vec3(2.2))*light;
float edge=1.-smoothstep(.004,.012,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
float spec=pow(max(0.,dot(n,normalize(vec3(-.23,.43,1.)))),40.);
col+=vec3(.60,.48,.29)*edge*spec*.30;
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
function texture(img,unit,mip){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);if(mip)gl.generateMipmap(gl.TEXTURE_2D);return t;}
async function load(src){const img=new Image();img.src=src;await img.decode();return img;}
function resize(){w=stage.offsetWidth;h=stage.offsetHeight;mobile=w<700;const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75,Math.sqrt(3500000/(w*h)));canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl?.viewport(0,0,canvas.width,canvas.height);makeTracks();wake();}
function draw(){if(!ready)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const progress=quiet?1:p,zoom=10.4;gl.uniformMatrix4fv(loc.uVP,false,perspective(w/h,zoom));
 const poses=ribbon(progress);
 for(let i=COUNT-1;i>=0;i--){const pose=poses[i];
  gl.uniformMatrix4fv(loc.uModel,false,pose.matrix);gl.uniform1f(loc.uBend,0);gl.uniform1f(loc.uTwist,0);const id=pose.id;
  gl.uniform4f(loc.uUV,(id%8)/8+1/2048,Math.floor(id/8)/4+1/2048,254/2048,437/2048);gl.uniform1f(loc.uDetailed,details[id]?1:0);
  if(details[id]){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,details[id]);}gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);
 }
 frames++;updateCopy(progress);
}
const intro=$('#intro'),openingType=$('#opening-type'),intertitle=$('#intertitle'),closing=$('#closing');
const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)};
function updateCopy(progress){
 const opening=1-smooth(.025,.15,progress),introOpacity=1-smooth(.025,.13,progress),middle=smooth(.23,.30,progress)*(1-smooth(.74,.81,progress)),end=smooth(.95,1,progress);
 openingType.style.opacity=String(opening);openingType.style.transform=`translateY(${-progress*40}px)`;
 intro.style.opacity=String(introOpacity);intro.style.transform=`translateY(${-20*(1-introOpacity)}px)`;intro.setAttribute('aria-hidden',String(introOpacity<.1));
 intertitle.style.opacity=String(middle);intertitle.style.transform=`translateY(${(1-middle)*20}px)`;
 closing.style.opacity=String(end);closing.style.transform=`translateY(${(1-end)*18}px)`;closing.inert=end<.5;closing.setAttribute('aria-hidden',String(end<.5));
 $('#line').style.transform=`scaleX(${progress})`;$('#scroll-label').textContent=progress>.93?'A WORLD WITHIN YOU':'SCROLL TO UNFOLD';
}
function wake(){if(alive&&ready&&inView&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
function frame(now){raf=0;if(!ready||!inView||document.hidden)return;let dt=last?Math.min((now-last)/1000,.05):1/60;last=now;if(!paused&&!quiet)time+=dt;const k=1-Math.exp(-dt*10);p+= (target-p)*k;if(Math.abs(target-p)<1e-5)p=target;for(let i=0;i<2;i++)ptr[i]+=(quiet?0:aim[i]-ptr[i])*k;draw();if((!quiet&&!paused&&!freezeTime)||Math.abs(p-target)>1e-5||Math.hypot(aim[0]-ptr[0],aim[1]-ptr[1])>.001)wake();}
function onScroll(){if(freezeTime)return;target=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));wake();}
function setProgress(v){freezeTime=true;target=p=clamp(v);draw();}
$('#motion').addEventListener('click',()=>{paused=!paused;$('#motion').textContent=paused?'Resume motion':'Pause motion';$('#motion').setAttribute('aria-pressed',String(paused));last=0;wake();});
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',resize);addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!quiet){aim=[(e.clientX/w-.5)*2,(e.clientY/h-.5)*2];wake();}},{passive:true});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
const io=new IntersectionObserver(es=>{inView=es[0].isIntersecting;if(!inView){cancelAnimationFrame(raf);raf=0;}last=0;wake();});io.observe(stage);
mq.addEventListener('change',()=>{quiet=mq.matches;aim=ptr=[0,0];document.documentElement.classList.toggle('quiet',quiet);wake();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;cancelAnimationFrame(raf);raf=0;document.documentElement.classList.remove('ready');});canvas.addEventListener('webglcontextrestored',()=>initialize());
function dispose(){cancelAnimationFrame(raf);raf=0;if(gl){[atlas,...Object.values(details),back].forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buf);gl.deleteBuffer(indexBuf);gl.deleteProgram(program);}io.disconnect();alive=false;}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}});addEventListener('pageshow',()=>{last=0;wake();});
async function initialize(){try{const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(ATLAS_DATA),load(BACK_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,stencil:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');program=gl.createProgram();shader(gl.VERTEX_SHADER,vert);shader(gl.FRAGMENT_SHADER,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const mesh=makeMesh();meshCount=mesh.i.length;buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);indexBuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);for(const[n,size,offset]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){const a=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset);}for(const n of ['uModel','uVP','uBend','uTwist','uAtlas','uDetail','uBack','uUV','uDetailed'])loc[n]=gl.getUniformLocation(program,n);atlas=texture(images[0],0,true);details={};ids.forEach((id,i)=>{details[id]=texture(images[i+2],1,false)});back=texture(images[1],2,false);gl.uniform1i(loc.uAtlas,0);gl.uniform1i(loc.uDetail,1);gl.uniform1i(loc.uBack,2);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);ready=true;resize();document.documentElement.classList.add('ready');document.documentElement.classList.toggle('quiet',quiet);onScroll();draw();wake();}catch(e){diagnostics.failure=String(e);document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(1);$('#motion').hidden=true;}}
window.motionStudy={setProgress,inspect:()=>({p,target,frames,ready,quiet,raf,error:ready?gl.getError():diagnostics.error,failure:diagnostics.failure,triangles:meshCount/3*COUNT,cards:COUNT,clearance:diagnostics.clearance,viewport:[w,h],buffer:[canvas.width,canvas.height]}),tracks:()=>tracks,knots};initialize();
})();
