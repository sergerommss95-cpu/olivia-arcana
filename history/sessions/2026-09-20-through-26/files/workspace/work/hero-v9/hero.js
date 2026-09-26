'use strict';
(()=>{
const $=s=>document.querySelector(s),canvas=$('canvas'),stage=$('#stage');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const knots=[0,.12,.28,.45,.62,.78,1],order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
const mq=matchMedia('(prefers-reduced-motion: reduce)'),staticView=new URLSearchParams(location.search).get('motion')==='reduce';let quiet=mq.matches||staticView,paused=false,alive=true,inView=true,ready=false,raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
let gl,program,buf,indexBuf,details={},back,loc={},meshCount=0,w=1,h=1,mobile=false,tracks=[];
let fallbackMode=false;let watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='';
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
 const fov=mix(38,32,ramp(.12,.38,progress)*(1-ramp(.82,.98,progress))),f=1/Math.tan(fov*Math.PI/360),near=.12,far=75;
 const projection=new Float32Array([f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
 return {eye,view,vp:mul(projection,view),fov};
}
const START=[-.12,-.34],END=[-.07,-Math.PI+.14];
const startNormal=rotate(model([0,0,0,...START,0,1]),[0,0,1]),endNormal=rotate(model([0,0,0,...END,0,1]),[0,0,1]);
let story;
function screenPoint(x,y,z,eyeZ=10.4){const t=Math.tan(19*Math.PI/180)*(eyeZ-z);return [(x-.5)*2*t*w/h,(.5-y)*2*t,z];}
function makeTracks(){
 const portrait=w/h<1.15,short=h<(portrait?760:650);COUNT=portrait?22:32;
 const unit=Math.tan(19*Math.PI/180)*10.4;
 const start=screenPoint(portrait?.58:.66,portrait?(short?.35:.39):.45,0);
 const end=screenPoint(portrait?.64:.70,portrait?(short?.32:.35):(short?.50:.48),-22.4,-12);
 const ss=(portrait?(short?.36:.46):(short?.58:.62))*unit,es=(portrait?(short?.38:.455):(short?.63:.68))*unit;
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
uniform sampler2D uDetail,uBack;uniform vec2 uLight;uniform vec3 uEye;uniform float uMagic,uTime;
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
float sweep=pow(.5+.5*sin(uv.y*5.4-uv.x*2.6-uTime*.38),12.);
float fresnel=pow(1.-abs(dot(n,view)),2.);
col+=vec3(.49,.31,.12)*uMagic*(edge*(.18+.42*fresnel)+gold*sweep*.32);
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
// BEGIN CARD LIGHT PASS
// One texture-free, depth-tested light pass. Insert inside the hero IIFE.
// Geometry lives in world space; the card pass supplies its existing depth buffer.
let magic=null;
function initializeMagic(){
 disposeMagic();
 const vertSource=`
 attribute vec3 aPosition;attribute vec2 aLightUV;attribute vec4 aLightColor;attribute float aKind;
 uniform mat4 uVP;varying vec2 vUV;varying vec4 vColor;varying float vKind;
 void main(){vUV=aLightUV;vColor=aLightColor;vKind=aKind;gl_Position=uVP*vec4(aPosition,1.);}`;
 const fragSource=`
 precision mediump float;varying vec2 vUV;varying vec4 vColor;varying float vKind;
 void main(){
  float light;
  if(vKind>0.5&&vKind<1.5){
   float r=length(vUV);if(r>1.)discard;
   light=exp(-r*r*5.)*.19+exp(-r*r*38.)*.88;
  }else{
   float d=abs(vUV.y);if(d>1.)discard;
   light=exp(-d*d*4.5)*.19+pow(max(0.,1.-d),12.)*.81;
   if(vKind>2.5)light=exp(-d*d*5.)*.65*pow(max(0.,sin(vUV.x*3.14159265)),.5);
   else if(vKind>1.5)light*=pow(max(0.,sin(vUV.x*3.14159265)),.68);
  }
  float a=vColor.a*light;if(a<.001)discard;
  gl_FragColor=vec4(vColor.rgb,a);
 }`;
 let lightProgram=null,lightBuffer=null;const shaders=[];
 try{
  lightProgram=gl.createProgram();
  for(const [type,source]of[[gl.VERTEX_SHADER,vertSource],[gl.FRAGMENT_SHADER,fragSource]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Magic shader: '+gl.getShaderInfoLog(shader));
   gl.attachShader(lightProgram,shader);
  }
  gl.linkProgram(lightProgram);
  if(!gl.getProgramParameter(lightProgram,gl.LINK_STATUS))throw Error('Magic program: '+gl.getProgramInfoLog(lightProgram));
  for(const shader of shaders)gl.deleteShader(shader);shaders.length=0;
  lightBuffer=gl.createBuffer();
  if(!lightBuffer)throw Error('Magic buffer unavailable');
  const capacity=1100*6*10,data=new Float32Array(capacity);
  gl.bindBuffer(gl.ARRAY_BUFFER,lightBuffer);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);
  const attrs=[['aPosition',3,0],['aLightUV',2,12],['aLightColor',4,20],['aKind',1,36]].map(([name,size,offset])=>({loc:gl.getAttribLocation(lightProgram,name),size,offset}));
  const mainAttrs=[['aPos',3,0],['aNormal',3,12],['aUV',2,24]].map(([name,size,offset])=>({loc:gl.getAttribLocation(program,name),size,offset}));
  // Four genuinely rounded corners, with a long uninterrupted cut between them.
  const outline=[],radius=.037,x=CARD_W/2-.008,y=CARD_H/2-.008;
  for(let corner=0;corner<4;corner++){
   const cx=(corner===0||corner===3?1:-1)*(x-radius),cy=(corner<2?1:-1)*(y-radius);
   for(let k=0;k<4;k++){const a=(corner*Math.PI/2)+(k/3)*Math.PI/2;outline.push([cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,0]);}
  }
  magic={program:lightProgram,buffer:lightBuffer,data,attrs,mainAttrs,outline,uVP:gl.getUniformLocation(lightProgram,'uVP'),used:0,quads:0};
  restoreMagicBindings();return true;
 }catch(error){
  for(const shader of shaders)gl.deleteShader(shader);
  if(lightBuffer)gl.deleteBuffer(lightBuffer);if(lightProgram)gl.deleteProgram(lightProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  diagnostics.magicFailure=String(error);return false;
 }
}
function restoreMagicBindings(){
 if(!magic)return;
 for(const attribute of magic.attrs)if(attribute.loc>=0)gl.disableVertexAttribArray(attribute.loc);
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);
 for(const attribute of magic.mainAttrs)if(attribute.loc>=0){gl.enableVertexAttribArray(attribute.loc);gl.vertexAttribPointer(attribute.loc,attribute.size,gl.FLOAT,false,32,attribute.offset);}
 gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
}
function drawMagic(progress,camera,layers,previousLayers=[]){
 if(!magic)return;
 const state=magic,data=state.data,clock=quiet||freezeTime?progress*24:time;
 const event=ramp(.045,.25,progress)*(1-.62*ramp(.88,1,progress)),strength=quiet?.27:.30+.70*event;
 const previous=new Map(previousLayers.map(pose=>[pose.index,pose]));
 const warm=[1,.76,.39],ivory=[1,.94,.77],blue=[.30,.55,.83];
 state.used=0;state.quads=0;
 function point(matrix,x,y,z=0){return[matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]];}
 function vertex(position,u,v,color,alpha,kind){let n=state.used;data[n++]=position[0];data[n++]=position[1];data[n++]=position[2];data[n++]=u;data[n++]=v;data[n++]=color[0];data[n++]=color[1];data[n++]=color[2];data[n++]=alpha;data[n++]=kind;state.used=n;}
 function quad(a,b,c,d,u0,u1,color,alpha0,alpha1,kind){
  if(state.used+60>data.length)return;
  vertex(a,u0,-1,color,alpha0,kind);vertex(b,u0,1,color,alpha0,kind);vertex(c,u1,-1,color,alpha1,kind);
  vertex(c,u1,-1,color,alpha1,kind);vertex(b,u0,1,color,alpha0,kind);vertex(d,u1,1,color,alpha1,kind);state.quads++;
 }
 function strip(a,b,width,color,alpha0,alpha1,kind=0,u0=0,u1=1){
  const direction=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],toward=[camera.eye[0]-(a[0]+b[0])*.5,camera.eye[1]-(a[1]+b[1])*.5,camera.eye[2]-(a[2]+b[2])*.5];
  const side=norm(cross(direction,toward)),offset=scale(side,width);
  quad(add(a,scale(offset,-1)),add(a,offset),add(b,scale(offset,-1)),add(b,offset),u0,u1,color,alpha0,alpha1,kind);
 }
 const cameraRight=[camera.view[0],camera.view[4],camera.view[8]],cameraUp=[camera.view[1],camera.view[5],camera.view[9]];
 for(const pose of layers){
  const m=pose.matrix,s=Math.hypot(m[0],m[1],m[2]),index=pose.index;
  const centre=[m[12],m[13],m[14]],distance=Math.hypot(...centre.map((v,i)=>v-camera.eye[i]));
  const atmospheric=clamp(1-(distance-9)*.024,.30,1);
  const openingWeight=mix(1/(1+index*1.6),1,ramp(.03,.18,progress));
  const closingWeight=mix(1,1/(1+(COUNT-1-index)*1.6),ramp(.875,.98,progress));
  const weight=strength*atmospheric*openingWeight*closingWeight;
  // A tiny bias towards the viewer prevents z-fighting at the physical cut.
  // The existing card depths still hide light belonging to occluded cards.
  const forward=scale(norm(camera.eye.map((v,i)=>v-centre[i])),.007*s);
  const perimeter=state.outline.map(p=>add(point(m,...p),forward));
  const phase=index*2.39996+clock*.19;
  for(let j=0;j<perimeter.length;j++){
   const next=(j+1)%perimeter.length;
   const energy=k=>.14+.63*Math.pow(.5+.5*Math.cos(k/perimeter.length*Math.PI*2-phase),5);
   const color=(j+index)%13===0?ivory:((j+index)%19===0?blue:warm);
   if(j%4===3)strip(perimeter[j],perimeter[next],s*.19,warm,weight*energy(j)*.66,weight*energy(next)*.66,3);
   strip(perimeter[j],perimeter[next],s*.047,color,weight*energy(j)*1.22,weight*energy(next)*1.22);
  }
  if(quiet)continue;
  // At most two tiny motes per card. They originate at cut edges rather than
  // filling the screen with unrelated stars; a cycle takes over ten seconds.
  for(let spark=0;spark<2;spark++){
   const seed=index*.61803398875+spark*.381966,life=(clock*.087+seed)%1;
   const envelope=Math.sin(life*Math.PI),side=(index+spark)%2?1:-1;
   const localX=side*(CARD_W*.5+.025+life*.16),localY=mix(-.68,.80,life)+Math.sin(index*1.7)*.1;
   const location=add(point(m,localX,localY,.025+Math.sin(life*Math.PI)*.10),forward);
   const radius=s*(.016+.013*envelope),right=scale(cameraRight,radius),up=scale(cameraUp,radius);
   const color=spark===0?warm:ivory,alpha=weight*envelope*(.48+.45*event);
   quad(add(add(location,scale(right,-1)),scale(up,-1)),add(add(location,scale(right,-1)),up),add(add(location,right),scale(up,-1)),add(add(location,right),up),-1,1,color,alpha,alpha,1);
  }
  // Only a few cards draw a filament. It starts at a corner and remembers the
  // authored path a little way behind it, so the trail belongs to the gesture.
  const trailEvent=ramp(.11,.25,progress)*(1-ramp(.87,.97,progress));
  if(index%4!==1||trailEvent<.001)continue;
  const prior=previous.get(index),corner=index%8<4?-1:1;
  const head=add(point(m,corner*CARD_W*.5,.86,.018),forward);
  let movement=prior?head.map((v,i)=>v-point(prior.matrix,corner*CARD_W*.5,.86,.018)[i]):[0,0,0];
  const movementLength=Math.hypot(...movement);
  if(movementLength>.00001)movement=scale(movement,Math.min(s*1.8,movementLength*3.8)/movementLength);
  const curl=rotate(m,[corner*.42,-.62,.18]),tail=add(head,add(scale(movement,-1),curl));
  const bow=rotate(m,[corner*.14,Math.sin(clock*.23+index)*.055,.13]);
  let a=head;
  for(let segment=0;segment<8;segment++){
   const t=(segment+1)/8,b=head.map((v,i)=>mix(v,tail[i],t)+bow[i]*Math.sin(t*Math.PI));
   const alpha=weight*trailEvent*.76,width=s*mix(.030,.065,t);
   strip(a,b,width,index%8===1?ivory:warm,alpha,alpha,2,segment/8,t);a=b;
  }
 }
 if(!state.used){diagnostics.magicQuads=0;return;}
 gl.useProgram(state.program);gl.bindBuffer(gl.ARRAY_BUFFER,state.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data.subarray(0,state.used));
 for(const attribute of state.attrs)if(attribute.loc>=0){gl.enableVertexAttribArray(attribute.loc);gl.vertexAttribPointer(attribute.loc,attribute.size,gl.FLOAT,false,40,attribute.offset);}
 gl.uniformMatrix4fv(state.uVP,false,camera.vp);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
 gl.drawArrays(gl.TRIANGLES,0,state.used/10);
 diagnostics.magicQuads=state.quads;diagnostics.magicDrawCalls=1;
 restoreMagicBindings();
}
function disposeMagic(){
 if(!magic)return;
 if(gl){gl.deleteBuffer(magic.buffer);gl.deleteProgram(magic.program);}
 magic=null;
}

// END CARD LIGHT PASS
function draw(){if(!ready)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const progress=quiet?1:p,camera=cameraPose(progress);gl.uniformMatrix4fv(loc.uVP,false,camera.vp);gl.uniform3f(loc.uEye,...camera.eye);gl.uniform1f(loc.uMagic,quiet?.25:.58+.42*ramp(.09,.3,progress));gl.uniform1f(loc.uTime,quiet||freezeTime?progress*24:time);
 const historyProgress=clamp(progress+(progressVelocity<-.001?.008:-.008)),historyScene=sceneFrame(historyProgress);
 const previousLayers=quiet?[]:ribbon(historyProgress).map((pose,index)=>({index,matrix:mul(historyScene,pose.matrix)}));
 const poses=ribbon(progress),scene=sceneFrame(progress);
 gl.uniform2f(loc.uLight,quiet?0:ptr[0]*.6,quiet?0:-ptr[1]*.3);
 // Opaque cards are drawn nearest first so the held packet does not shade
 // the same pixels once for every hidden card behind it.
 const layers=poses.map(pose=>{
  const matrix=mul(scene,pose.matrix),v=camera.view;
  const depth=v[2]*matrix[12]+v[6]*matrix[13]+v[10]*matrix[14]+v[14];
  const halfDepth=Math.abs(v[2]*matrix[0]+v[6]*matrix[1]+v[10]*matrix[2])*CARD_W/2+Math.abs(v[2]*matrix[4]+v[6]*matrix[5]+v[10]*matrix[6])*CARD_H/2;
  return {id:pose.id,index:poses.indexOf(pose),matrix,depth,halfDepth};
 }).filter(pose=>pose.depth-pose.halfDepth<-.12&&pose.depth+pose.halfDepth>-75).sort((a,b)=>b.depth-a.depth);
 for(const pose of layers){
  gl.uniformMatrix4fv(loc.uModel,false,pose.matrix);gl.uniform1f(loc.uBend,0);gl.uniform1f(loc.uTwist,0);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,details[pose.id]);gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);
 }
 drawMagic(progress,camera,layers,previousLayers);
 diagnostics.drawCalls=layers.length+(magic?1:0);
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
mq.addEventListener('change',()=>{quiet=mq.matches||staticView||fallbackMode;if(quiet)stopJourney();aim=[0,0];ptr=[0,0];progressVelocity=0;document.documentElement.classList.toggle('quiet',quiet);queueResize();wake();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;cancelAnimationFrame(raf);raf=0;document.documentElement.classList.remove('ready');});canvas.addEventListener('webglcontextrestored',()=>initialize());
function dispose(){cancelAnimationFrame(raf);cancelAnimationFrame(resizeRequest);raf=0;initGeneration++;disposeMagic();if(gl){[...Object.values(details),back].filter(Boolean).forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buf);gl.deleteBuffer(indexBuf);gl.deleteProgram(program);}io.disconnect();alive=false;}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}});addEventListener('pageshow',()=>{last=0;wake();});
async function initialize(){const generation=++initGeneration;try{mobile=stage.offsetWidth<700;const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(BACK_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);if(!alive||generation!==initGeneration)return;gl=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,stencil:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');program=gl.createProgram();shader(gl.VERTEX_SHADER,vert);shader(gl.FRAGMENT_SHADER,frag);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const mesh=makeMesh();meshCount=mesh.i.length;buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);indexBuf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.i,gl.STATIC_DRAW);for(const[n,size,offset]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24]]){const a=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset);}for(const n of ['uModel','uVP','uBend','uTwist','uDetail','uBack','uLight','uEye','uMagic','uTime'])loc[n]=gl.getUniformLocation(program,n);details={};ids.forEach((id,i)=>{details[id]=texture(images[i+1],1,false,+id===18)});back=texture(images[0],2,false,true);gl.uniform1i(loc.uDetail,1);gl.uniform1i(loc.uBack,2);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);initializeMagic();fallbackMode=false;quiet=mq.matches||staticView;$('#motion').hidden=false;document.documentElement.classList.remove('fallback');ready=true;resize(true);document.documentElement.classList.add('ready');document.documentElement.classList.toggle('quiet',quiet);onScroll();draw();wake();}catch(e){if(!alive||generation!==initGeneration)return;diagnostics.failure=String(e);fallbackMode=true;quiet=true;watching=false;ready=false;document.documentElement.classList.remove('ready');cancelAnimationFrame(raf);raf=0;const poster=$('.poster');poster.src=DETAIL_DATA[18];poster.alt='The Moon card — carved ivory on lapis';document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(1);$('#motion').hidden=true;}}
window.motionStudy={setProgress,inspect:()=>({p,target,frames,ready,quiet,paused,watching,raf,time,error:ready?gl.getError():diagnostics.error,failure:diagnostics.failure,triangles:meshCount/3*COUNT,cards:COUNT,drawCalls:diagnostics.drawCalls,magicQuads:diagnostics.magicQuads,magicFailure:diagnostics.magicFailure,clearance:diagnostics.clearance,viewport:[w,h],buffer:[canvas.width,canvas.height]}),tracks:()=>tracks,knots};initialize();
})();
