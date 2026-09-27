'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('canvas'),stage=$('#stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.23,.46,.70,1],order=[18,19,17,2,21,...Array.from({length:22},(_,i)=>i).filter(i=>![18,19,17,2,21].includes(i))];
const mq=matchMedia('(prefers-reduced-motion: reduce)');let quiet=mq.matches,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,atlas,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let freezeTime=false;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('p')){target=p=clamp(+hash.get('p'));freezeTime=true;}
const diagnostics={};
function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
// Every resolved image is composed in screen space, then placed at real optical depth.
function anchor(sx,sy,height,z,rx=0,ry=0,rz=0,bend=.018){
 const vh=2*(10.4-z)*Math.tan(19*Math.PI/180);
 return [(sx-.5)*vh*w/h,(.5-sy)*vh,z,rx,ry,rz,height*vh/2,bend,0];
}
function makeTracks(){
 const portrait=w/h<.8,compact=w/h<1.25;
 tracks=order.map((id,i)=>{
  const u=i/21;
  const stack=anchor(portrait?.57:compact?.64:.66,portrait?.415:.47,portrait?.405:compact?.59:.67,1.8,-.12,-.38,-.14);
  stack[0]-=i*.011;stack[1]+=i*.005;stack[2]-=i*.024;stack[5]+=i*.0014;
  // Two banks separate at unequal depths, opening a passage between them.
  const left=i%2===0,j=Math.floor(i/2),v=j/10;
  const opening=left?
   anchor(portrait?.18:.225,portrait?.57:.56,portrait?.46:.67,2.4-j*.046,.10,.60+v*.16,-.26+v*.20):
   anchor(portrait?.80:.795,portrait?.36:.38,portrait?.32:.48,-1.9-j*.055,-.13,-.48-v*.14,.23-v*.14);
  opening[0]+=(left?-1:1)*j*.045;opening[1]+=j*.017;
  // An unequal field: a few large presences, the other cards folded into the distance.
  const fieldAnchors=portrait?[
    [.67,.49,.43,2.5,-.10,-.22,-.12],
    [.24,.27,.235,-1.8,.14,.30,.20],
    [.22,.73,.195,-3.3,-.17,-.40,-.20],
    [.80,.20,.105,-5.2,.08,-.66,-.05],
    [.85,.84,.14,-4,.14,.30,.12]
  ]:[
    [.67,.48,compact?.53:.64,2.5,-.10,-.22,-.12],
    [.23,.30,.30,-1.8,.14,.30,.20],
    [.27,.77,.235,-3.3,-.17,-.40,-.20],
    [.80,.215,.13,-5.2,.08,-.66,-.05],
    [.86,.82,.18,-4,.14,.30,.12]
  ];
  let field;
  if(i<5)field=anchor(...fieldAnchors[i]);
  else {const cluster=(i-5)%3,k=Math.floor((i-5)/3);const a=fieldAnchors[cluster+1];
   field=anchor(a[0]+(cluster===1?-.008:.009)*(k+1),a[1]-.004*(k+1),a[2]*(.89-k*.017),a[3]-.38*(k+1),a[4],a[5]+.12*(k+1),a[6]-.034*(k+1));}
  // A diagonal crossing recedes more than twelve world units through the scene.
  const t=Math.pow(u,.68),curl=Math.sin(t*Math.PI),sx=mix(-.045,.88,t)+Math.sin(t*6.2)*curl*.17,sy=mix(.94,.20,t)+Math.sin(t*6.2+.9)*curl*.12;
  const crossing=anchor(sx,sy,(portrait?.57:.93)*Math.exp(-2.3*t),3.8-12*t,
   -.12+.22*Math.sin(t*5),i===0?2.85:(i%3===0?2.75:.20+Math.sin(i*1.4)*.65),-.36+.48*t+Math.sin(t*6.2)*.28,.018);
  // Resolve with a close Moon and restrained, asymmetric echoes.
  let end;
  if(i===0)end=anchor(portrait?.61:compact?.66:.68,portrait?(h<650?.32:.355):.475,portrait?(h<650?.35:.395):compact?.59:.69,2.4,-.07,-.23,-.115);
  else if(i===1)end=anchor(portrait?.18:.32,portrait?.19:.16,portrait?.14:.19,-4.4,.20,.40,.22);
  else if(i===2)end=anchor(portrait?.88:.93,portrait?.54:.79,portrait?.125:.20,-3.5,-.14,-.47,-.17);
  else if(i===3)end=anchor(portrait?.18:.45,portrait?.56:.87,portrait?.09:.13,-5.2,.13,2.7,.13);
  else if(i===4)end=anchor(portrait?.89:.90,portrait?.16:.23,portrait?.11:.15,-6,-.11,2.8,-.20);
  else {const k=i-5;const lead=anchor(portrait?.65:compact?.70:.72,portrait?.365:.48,portrait?.28:compact?.44:.49,-1-k*.07,-.12,-.62+k*.027,-.25+k*.012);
   lead[0]+=.009*k;lead[1]+=.018*k;end=lead;}
  const keys=[stack,opening,field,crossing,end];
  const tangents=keys.map((v,k)=>v.map((_,c)=>k===0||k===keys.length-1?0:.38*(keys[k+1][c]-keys[k-1][c])/(knots[k+1]-knots[k-1])));
  return {id,keys,tangents};
 });
}
function poseAt(track,progress){let k=0;while(k<knots.length-2&&progress>knots[k+1])k++;const dt=knots[k+1]-knots[k],u=clamp((progress-knots[k])/dt),u2=u*u,u3=u2*u;
 return track.keys[k].map((a,c)=>(2*u3-3*u2+1)*a+(u3-2*u2+u)*dt*track.tangents[k][c]+(-2*u3+3*u2)*track.keys[k+1][c]+(u3-u2)*dt*track.tangents[k+1][c]);}
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
vec3 tex=texture2D(uAtlas,uUV.xy+vec2(uv.x,1.-uv.y)*uUV.zw).rgb;
if(uDetailed>.5)tex=texture2D(uDetail,vec2(uv.x,1.-uv.y)).rgb;
if(!gl_FrontFacing)tex=texture2D(uBack,vec2(1.-uv.x,1.-uv.y)).rgb;
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
function makeBack(){const c=document.createElement('canvas');c.width=512;c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle='#10134d';ctx.fillRect(0,0,512,1024);ctx.strokeStyle='#b7bce960';ctx.lineWidth=1.4;[22,34].forEach(d=>ctx.strokeRect(d,d,512-2*d,1024-2*d));ctx.translate(256,512);ctx.strokeStyle='#b7bce98a';for(const r of [97,110,125]){ctx.beginPath();ctx.ellipse(0,0,r,r*1.45,0,0,Math.PI*2);ctx.stroke();}for(let i=0;i<24;i++){let a=i*Math.PI/12;ctx.beginPath();ctx.moveTo(Math.cos(a)*133,Math.sin(a)*193);ctx.lineTo(Math.cos(a)*142,Math.sin(a)*204);ctx.stroke();}ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?18:71;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*1.2);}ctx.closePath();ctx.stroke();return c;}
async function load(src){const img=new Image();img.src=src;await img.decode();return img;}
function resize(){w=stage.offsetWidth;h=stage.offsetHeight;mobile=w<700;const dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75,Math.sqrt(3500000/(w*h)));canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl?.viewport(0,0,canvas.width,canvas.height);makeTracks();wake();}
function draw(){if(!ready)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const progress=quiet?1:p,zoom=10.4;gl.uniformMatrix4fv(loc.uVP,false,perspective(w/h,zoom));
 for(let i=21;i>=0;i--){const track=tracks[i];const lag=(i/21)*.018*16*progress*progress*(1-progress)*(1-progress);const pose=poseAt(track,progress-lag);
  if(!quiet&&!freezeTime){const gu=clamp(progress/.23),gain=gu*gu*(3-2*gu);pose[1]+=Math.sin(time*.42)*.018*(1-gain)+Math.sin(time*.32+i*.71)*.027*gain;pose[4]+=Math.sin(time*.23+i*.47)*.012*gain;}
  pose[0]+=ptr[0]*.09;pose[1]-=ptr[1]*.065;pose[4]+=ptr[0]*.028;pose[3]-=ptr[1]*.020;
  gl.uniformMatrix4fv(loc.uModel,false,model(pose));gl.uniform1f(loc.uBend,pose[7]);gl.uniform1f(loc.uTwist,pose[8]);const id=track.id;gl.uniform4f(loc.uUV,(id%8)/8+1/2048,Math.floor(id/8)/4+1/2048,254/2048,437/2048);gl.uniform1f(loc.uDetailed,details[id]?1:0);if(details[id]){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,details[id]);}gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);
 }
 frames++;updateCopy(progress);
}
const intro=$('#intro'),openingType=$('#opening-type'),intertitle=$('#intertitle'),closing=$('#closing');
const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)};
function updateCopy(progress){
 const opening=1-smooth(.025,.16,progress),introOpacity=1-smooth(.015,.09,progress),middle=smooth(.29,.37,progress)*(1-smooth(.45,.53,progress)),end=smooth(.85,.965,progress);
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
async function initialize(){try{const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(ATLAS_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,stencil:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');program=gl.createProgram();shader(gl.VERTEX_SHADER,vert);shader(gl.FRAGMENT_SHADER,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const mesh=makeMesh();meshCount=mesh.i.length;buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);indexBuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);for(const[n,size,offset]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){const a=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset);}for(const n of ['uModel','uVP','uBend','uTwist','uAtlas','uDetail','uBack','uUV','uDetailed'])loc[n]=gl.getUniformLocation(program,n);atlas=texture(images[0],0,true);details={};ids.forEach((id,i)=>{details[id]=texture(images[i+1],1,false)});back=texture(makeBack(),2,true);gl.uniform1i(loc.uAtlas,0);gl.uniform1i(loc.uDetail,1);gl.uniform1i(loc.uBack,2);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);ready=true;resize();document.documentElement.classList.add('ready');document.documentElement.classList.toggle('quiet',quiet);onScroll();draw();wake();}catch(e){diagnostics.failure=String(e);document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(1);$('#motion').hidden=true;}}
window.motionStudy={setProgress,inspect:()=>({p,target,frames,ready,quiet,raf,error:ready?gl.getError():diagnostics.error,failure:diagnostics.failure,triangles:meshCount/3*22,cards:22,viewport:[w,h],buffer:[canvas.width,canvas.height]}),tracks:()=>tracks,knots};initialize();
})();
