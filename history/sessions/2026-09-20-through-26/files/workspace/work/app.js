// Olivia Arcana — a continuous sculptural world. Three.js and fonts are embedded.
const $=id=>document.getElementById(id);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const ramp=(a,b,x)=>ease((x-a)/(b-a));
const mq=matchMedia('(prefers-reduced-motion: reduce)');
let quiet=mq.matches,mobile=innerWidth<=700&&innerHeight>innerWidth,renderer=null,alive=true,raf=0,lastTime=0,elapsed=0;
let drawn=-1,selectedIndex=-1,previousIndex=-1,drawStart=-10,scene,camera,keyLight,fillLight,lightTarget,envTarget,grainMap,ground;
let cards=[],arcLines=[],MAT={},archetypeAssets,poses=[],cameraCurve,lookCurve,renderCount=0,quality=1,slowFrames=0;
const spine={raw:0,current:0};
const pointer={x:0,y:0,tx:0,ty:0};
const panels=[...document.querySelectorAll('[data-panel]')],panelWrap=document.querySelector('.panels');
const heroType=$('hero-type'),progressEl=$('progress'),worldEl=$('world');
const starts=[0,.19,.43,.59,.835],ends=[.16,.355,.58,.825,1.2];
const poseTimes=[0,.15,.285,.47,.69,.925,1];
const tmpV=new THREE.Vector3(),camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),tmpQ=new THREE.Quaternion(),tmpE=new THREE.Euler();
const ivoryColor=new THREE.Color(0xe9e1d1),opticalColor=new THREE.Color(0xcec9b8);
const surfaceTextures=new Set();
const materialSet=new Set(),geometrySet=new Set();
function registerMaterial(m){materialSet.add(m);return m}
function registerGeometry(g){geometrySet.add(g);return g}
function scrollRead(){spine.raw=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));wake()}
function setQuiet(value){quiet=value;document.documentElement.classList.toggle('quiet',quiet);$('motion-toggle').setAttribute('aria-pressed',String(quiet));$('motion-toggle').setAttribute('aria-label',quiet?'Enable full motion':'Reduce motion');$('motion-toggle').querySelector('span').textContent=quiet?'Motion reduced':'Motion on';pointer.tx=pointer.ty=pointer.x=pointer.y=0;spine.current=spine.raw;if(drawn>=0)drawStart=elapsed-3;wake()}
$('motion-toggle').addEventListener('click',()=>setQuiet(!quiet));mq.addEventListener('change',e=>setQuiet(e.matches));
addEventListener('scroll',scrollRead,{passive:true});
addEventListener('pointermove',e=>{if(quiet||mobile||!renderer)return;pointer.tx=e.clientX/innerWidth-.5;pointer.ty=e.clientY/innerHeight-.5;wake()},{passive:true});
addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer.tx=pointer.ty=0;wake()}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=0}else wake()});
const readings=[
 ['0','The Fool','What could begin if you didn’t need to know the ending?','Take one small step toward something that makes you curious.',0],
 ['I','The Magician','What is already in your hands?','Name one resource you have been overlooking. Start there.',1],
 ['II','The High Priestess','What do you know before you explain it?','Give a quiet impression a little room before seeking another opinion.',2],
 ['III','The Empress','What would grow with a little more care?','Make time for something nourishing, tangible, and entirely your own.',5],
 ['IV','The Emperor','Where would a clear boundary help?','Choose a structure that supports you without making your world smaller.',1],
 ['V','The Hierophant','Which inherited idea still feels like yours?','Keep what serves you. Let yourself question the rest.',2],
 ['VI','The Lovers','What choice would bring you closer to your values?','Look beyond the easy answer toward the one you can stand behind.',6],
 ['VII','The Chariot','Where do you want to put your energy?','Choose a direction before asking yourself to move faster.',1],
 ['VIII','Strength','What would gentleness make possible?','Meet resistance with patience. You may not need more force.',5],
 ['IX','The Hermit','What becomes clear when the noise falls away?','Find a small pocket of solitude and listen to your own words.',4],
 ['X','Wheel of Fortune','What is changing that you can stop holding still?','Notice where adapting might feel kinder than resisting.',6],
 ['XI','Justice','What would an honest account include?','Consider your needs, your actions, and the people affected by them.',1],
 ['XII','The Hanged Man','What changes when you see it from the other side?','Give an unresolved question a new angle before seeking an answer.',0],
 ['XIII','Death','What are you ready to let be finished?','Make space by releasing a habit, role, or expectation you have outgrown.',3],
 ['XIV','Temperance','Where could a little less become enough?','Try a smaller adjustment. Balance can be a practice rather than a destination.',2],
 ['XV','The Devil','What has begun to feel like a choice you no longer have?','Name one attachment. Imagine a small way to loosen its hold.',3],
 ['XVI','The Tower','Which assumption could you afford to question?','An old explanation may no longer fit. You can make room for a new one.',1],
 ['XVII','The Star','What still gives you a quiet sense of possibility?','Return to one thing that restores you, without asking it to solve everything.',4],
 ['XVIII','The Moon','What remains uncertain, and can it stay that way for now?','Separate what you know from what you are imagining. Let clarity take its time.',3],
 ['XIX','The Sun','Where are you making joy more complicated than it needs to be?','Let yourself appreciate something good without immediately looking past it.',5],
 ['XX','Judgement','What are you ready to answer for yourself?','Listen for the decision you keep returning to. Give it thoughtful attention.',4],
 ['XXI','The World','What deserves to be acknowledged before you begin again?','Pause over what you have completed. Let that experience come with you.',6]
];
const deckOrder=[19,2,18,17,1,21,0,3,8,6,10,14,9,20,4,7,11,12,5,13,15,16];
function updateFallbackArt(r){
 if(sculptureImages){const texture=createSculptureFace(THREE,r[0],r[1],r[4]);const img=document.createElement('img');img.alt='';img.src=texture.image.toDataURL('image/webp',.92);$('fallback-art').replaceChildren(img);$('fallback-art').dataset.card=r[1];$('fallback-art').dataset.number=r[0];texture.dispose();return}
 const motifs=[
  '<path d="M39 119a56 56 0 0 1 112 0M39 197v-16h21v-16h21v-16h21v-16h21v-16h28v80Z"/>',
  '<path d="M100 47v174M100 96l43 43-43 43-43-43ZM100 107l32 32-32 32-32-32Z"/>',
  '<path d="M45 205V104a55 55 0 0 1 110 0v101h-15V105a40 40 0 0 0-80 0v100ZM79 205V105a21 21 0 0 1 42 0v100M100 98v89"/>',
  '<path fill="currentColor" fill-opacity=".12" d="M137 61c-64-22-116 38-88 95 19 39 60 41 88 22-65 8-81-88 0-117Z"/>',
  '<path fill="currentColor" fill-opacity=".16" d="m100 49 11 69 42-27-29 42 54 11-55 11 29 43-42-29-10 63-11-63-42 29 28-43-53-11 53-11-28-42 43 28Z"/>',
  '<circle cx="100" cy="134" r="30" fill="currentColor" fill-opacity=".17"/>'+Array.from({length:16},(_,i)=>`<path d="M96 57h8v33h-8Z" transform="rotate(${i*22.5} 100 134)"/>`).join(''),
  '<path d="M143 201c63-118-4-193-61-144-52 46-45 126-15 153M132 189c43-95-7-151-44-118-40 35-37 92-12 129M121 177c28-71-8-109-27-90-28 29-29 68-9 101"/>'
 ];
 $('fallback-art').innerHTML=`<svg viewBox="0 0 200 300" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20 41V20h21m118 0h21v21M20 259v21h21m118 0h21v-21"/><text x="100" y="31" text-anchor="middle" font-family="Cormorant Garamond" font-size="12" stroke="none" fill="currentColor">${r[0]}</text>${motifs[r[4]]}<path d="M61 240h78"/><text x="100" y="269" text-anchor="middle" font-family="DM Sans" font-size="8" stroke="none" fill="currentColor">${r[1].toUpperCase()}</text></svg>`;
}

function drawCard(){
 const n=new Uint32Array(1);crypto.getRandomValues(n);let next=n[0]%22;if(next===drawn)next=(next+1)%22;
 previousIndex=selectedIndex;drawn=next;selectedIndex=deckOrder.indexOf(drawn);drawStart=elapsed;
 const r=readings[drawn];$('reading-number').textContent=r[0]+' / YOUR CARD';$('reading-title').textContent=r[1];$('reading-reflection').textContent=r[2];$('reading-note').textContent=r[3];
 $('oracle-intro').hidden=true;$('reading').hidden=false;document.documentElement.classList.add('has-reading');
 updateFallbackArt(r);$('reading-title').focus({preventScroll:true});wake();
}
$('draw-card').addEventListener('click',drawCard);$('draw-again').addEventListener('click',drawCard);
function updateUI(p){
 panelWrap.style.mixBlendMode=p>.18&&p<.365?'difference':'normal';
 for(let i=0;i<panels.length;i++){
  const panel=panels[i];const opacity=i===0?1-ramp(.085,.165,p):i===4?ramp(.835,.89,p):ramp(starts[i],starts[i]+.05,p)*(1-ramp(ends[i]-.035,ends[i],p));
  const visible=opacity>.025;panel.style.opacity=opacity.toFixed(3);panel.classList.toggle('active',visible);panel.inert=!visible;panel.setAttribute('aria-hidden',String(!visible));
 }
 heroType.style.opacity=(1-ramp(.075,.215,p)).toFixed(3);heroType.style.transform=quiet?'none':`translateY(${-ramp(0,.23,p)*65}px)`;
 progressEl.style.transform=`scaleX(${p})`;worldEl.style.setProperty('--warmth',ramp(.58,.91,p).toFixed(3));
 if(!renderer){const art=$('fallback-art');art.style.opacity=(p>.2&&p<.83?.22:1).toString();art.classList.toggle('fallback-reading',drawn>=0&&p>.83)}
}
function rounded(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
function faceUV(g){const p=g.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+1.25)/2.5;uv[i*2+1]=(p.getY(i)+1.9)/3.8}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g}
function plate(){const g=new THREE.ExtrudeGeometry(rounded(2.5,3.8,.10),{depth:.011,bevelEnabled:true,bevelThickness:.002,bevelSize:.007,bevelSegments:4,curveSegments:10});g.translate(0,0,.037);return registerGeometry(faceUV(g))}
function rimPlate(){const s=rounded(2.509,3.809,.105),hole=rounded(2.483,3.783,.095);s.holes.push(new THREE.Path(hole.getPoints(10).reverse()));const g=new THREE.ExtrudeGeometry(s,{depth:.005,bevelEnabled:true,bevelThickness:.001,bevelSize:.002,bevelSegments:2,curveSegments:10});g.translate(0,0,.037);return registerGeometry(g)}
function makeGrain(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),pixels=ctx.createImageData(512,512);let seed=27183;
 for(let i=0;i<pixels.data.length;i+=4){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;let v=126+(seed>>>0)%5;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,3);surfaceTextures.add(t);return t;
}
function makeEnvironment(){
 // Large studio softboxes: reflected light defines curvature without painted highlights.
 const es=new THREE.Scene();es.background=new THREE.Color(0x111510);const geometry=new THREE.PlaneGeometry(1,1);
 const c=document.createElement('canvas');c.width=64;c.height=256;const cx=c.getContext('2d'),g=cx.createLinearGradient(0,0,64,0);g.addColorStop(0,'#111111');g.addColorStop(.22,'#dddddd');g.addColorStop(.6,'#ffffff');g.addColorStop(1,'#222222');cx.fillStyle=g;cx.fillRect(0,0,64,256);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 [[-5,4.5,6,6,9,0xf5f0e5,6],[7,1,4,2,11,0xdfe6ed,5],[0,7,-1,8,3,0xe8e4db,3.5],[-3,-4,4,4,2,0xa29b86,1.1]].forEach(([x,y,z,w,h,col,int])=>{const m=new THREE.MeshBasicMaterial({color:col,map});m.color.multiplyScalar(int);const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,1);o.lookAt(0,0,0);es.add(o)});
 const gen=new THREE.PMREMGenerator(renderer);envTarget=gen.fromScene(es,.02,.1,80);scene.environment=envTarget.texture;gen.dispose();es.traverse(o=>{if(o.material)o.material.dispose()});geometry.dispose();map.dispose();
}
function buildScene(){
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.18,100);
 renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
 makeEnvironment();grainMap=makeGrain();
 scene.add(new THREE.HemisphereLight(0xe9e9e3,0x161b13,.35));
 keyLight=new THREE.DirectionalLight(0xf4f0e7,2.4);keyLight.castShadow=true;keyLight.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);keyLight.shadow.camera.left=-5;keyLight.shadow.camera.right=5;keyLight.shadow.camera.top=6;keyLight.shadow.camera.bottom=-6;keyLight.shadow.camera.near=.5;keyLight.shadow.camera.far=32;keyLight.shadow.bias=-.00006;keyLight.shadow.normalBias=.0008;keyLight.shadow.radius=4;keyLight.shadow.blurSamples=8;
 ground=new THREE.Mesh(registerGeometry(new THREE.PlaneGeometry(60,60)),registerMaterial(new THREE.ShadowMaterial({color:0x020302,opacity:.24,depthWrite:false})));ground.rotation.x=-Math.PI/2;ground.position.y=-.008;ground.receiveShadow=true;scene.add(ground);
 lightTarget=new THREE.Object3D();scene.add(lightTarget);keyLight.target=lightTarget;scene.add(keyLight);
 fillLight=new THREE.DirectionalLight(0xe0e9ed,.9);scene.add(fillLight);
 MAT.platinum=registerMaterial(new THREE.MeshStandardMaterial({color:0xa8a397,metalness:1,roughness:.24,envMapIntensity:1.1,transparent:true}));
 archetypeAssets=CARD_ARCHETYPES;
 const bodyGeometry=plate(),rimGeometry=rimPlate();
 const backGeometry=registerGeometry(faceUV(new THREE.ShapeGeometry(rounded(2.498,3.798,.10),10)));
 const backPrint=buildCardBack(THREE).ink;
 const backCanvas=document.createElement('canvas');backCanvas.width=1024;backCanvas.height=1536;const backCtx=backCanvas.getContext('2d');backCtx.fillStyle='#252a24';backCtx.fillRect(0,0,1024,1536);backCtx.drawImage(backPrint.image,0,0);backPrint.dispose();
 const backMap=new THREE.CanvasTexture(backCanvas);backMap.colorSpace=THREE.SRGBColorSpace;backMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());surfaceTextures.add(backMap);
 const edgeExtension=registerGeometry(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.25,-1.9,0),new THREE.Vector3(1.25,-3.6,0),new THREE.Vector3(1.25,1.9,0),new THREE.Vector3(1.25,3.6,0)]));
 for(let i=0;i<22;i++){
  const group=new THREE.Group(),r=readings[deckOrder[i]];
  const bm=registerMaterial(new THREE.MeshPhysicalMaterial({emissive:0x000000,color:ivoryColor,metalness:0,roughness:.4,envMapIntensity:.7,clearcoat:.16,clearcoatRoughness:.4,bumpMap:grainMap,bumpScale:.0012,aoMapIntensity:0,transparent:true,side:THREE.FrontSide}));
  const rm=registerMaterial(MAT.platinum.clone());rm.emissive.setHex(0xa6b6a3);
  const body=new THREE.Mesh(bodyGeometry,bm),edge=new THREE.Mesh(rimGeometry,rm);edge.position.z=0;body.receiveShadow=true;body.castShadow=true;group.add(body,edge);
  const faceMap=createSculptureFace(THREE,r[0],r[1],r[4]);surfaceTextures.add(faceMap);
  const face=new THREE.Mesh(backGeometry,registerMaterial(new THREE.MeshPhysicalMaterial({map:faceMap,bumpMap:faceMap,bumpScale:.004,roughness:.72,metalness:.015,envMapIntensity:.35,clearcoat:.06,clearcoatRoughness:.6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,transparent:true})));face.position.z=.052;group.add(face);
  const back=new THREE.Mesh(backGeometry,registerMaterial(new THREE.MeshPhysicalMaterial({map:backMap,color:0xf0e8d8,roughness:.43,metalness:.18,envMapIntensity:.75,clearcoat:.15,clearcoatRoughness:.38,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,transparent:true})));back.rotation.y=Math.PI;back.position.z=.034;group.add(back);
  const wire=new THREE.LineSegments(edgeExtension,registerMaterial(new THREE.LineBasicMaterial({color:0xc4bea1,transparent:true,opacity:0,depthWrite:false})));group.add(wire);
  group.userData={body,edge,wire,back,face,cardNumber:deckOrder[i]};cards.push(group);scene.add(group);
 }
 // Open line fragments trace the same off-centre path as the card edges.
 [[-1.28,4.45,1,0],[.25,1.18,.28,.35],[3.05,3.85,.23,-.4]].forEach(([a,b,opacity,offset],index)=>{
  const points=[];for(let k=0;k<=180;k++){const t=mix(a,b,k/180);points.push(new THREE.Vector3(-1.7+Math.cos(t)*(3.45+offset),.1+Math.sin(t)*(2.26+offset),-20+.75*Math.sin(t+.3)))}
  const geo=registerGeometry(new THREE.BufferGeometry().setFromPoints(points));const mat=registerMaterial(new THREE.LineBasicMaterial({color:index?0x969f8b:0xbbaa81,transparent:true,opacity:0,depthWrite:false}));const line=new THREE.Line(geo,mat);line.userData.alpha=opacity;scene.add(line);arcLines.push(line);
 });
 configurePoses();resizeScene();
}
function pose(x,y,z,rx,ry,rz,scale=1){return {p:new THREE.Vector3(x,y,z),q:new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),s:scale}}
// An open optical shell, tapered from broad leaves into a fine return.
// Its card planes radiate from a shared axis without intersecting one another.
function buildOraclePoses(THREE,mobile=false){
 const angles=Array.from({length:22},(_,i)=>-137+13*i);
 const shellQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(.40,-.53,-.37));
 const center=new THREE.Vector3(mobile?.30:2.28,mobile?-2.40:.12,-24);
 const factor=mobile?.53:.94;
 return angles.map((degrees,i)=>{
  const a=degrees*Math.PI/180;
  const u=i/21,scale=.37+.39*Math.sin(Math.PI*u)**.80+.025*u;
  const inner=.58+.24*Math.cos(a-.35)**2;
  const radius=inner+1.25*scale;
  const p=new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,0);
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,a));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),1.20));
  p.applyQuaternion(shellQ).multiplyScalar(factor).add(center);q.premultiply(shellQ);
  return {p,q,s:scale*factor};
 });
}
function configurePoses(){
 const field=[
 [2.45,.48,-15,-.18,-.42,-.3,.97],[5.85,2.05,-20,.18,-.65,.2,.77],[.35,-3.75,-19,.16,.34,-.28,.83],[6.0,-2.55,-22,-.18,.5,.48,.74],
 [.30,4.7,-23,.14,-.15,-.24,.62],[7.5,.0,-27,.15,-.72,.15,.67],[-4.6,5.7,-26,-.12,.72,.3,.66],
 [-10.5,2.3,-25,.08,.75,-.18,.64],[-12.4,-7.3,-28,.22,.7,.6,.61],[2.5,-6.1,-27,-.16,-.45,-.22,.7],[6.3,6,-27,.2,.32,.23,.72],
 [-2.2,8.1,-29,.16,-.38,.14,.56],[10.6,4.1,-31,.27,.72,.25,.6],[8.4,-5.6,-29,.26,-.5,-.28,.75],[-11.2,-2.8,-30,.2,.35,.2,.55],
 [-5.2,-8,-33,-.21,.4,-.2,.6],[3.1,9.4,-33,.3,-.2,.24,.58],[12.2,-1.8,-33,.35,-.5,.4,.66],[-11.2,6.3,-34,-.2,.5,.2,.7],[9.3,8.4,-36,.2,-.3,.2,.6],[-1.0,-9.2,-35,.23,.7,.2,.6],[6.4,-10,-36,.15,-.38,.3,.6]
 ];
 const heroQuaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,-.14));
 
 
 const oraclePoses=buildOraclePoses(THREE,mobile);
 poses=cards.map((c,i)=>{
  const hs=mobile?(innerHeight<650?.67:.83):1.28,hx=mobile?.10:2.22,hz=mobile?(innerHeight<650?-.55:-.08):.15;
  const layer=new THREE.Vector3(0,0,(21-i)*.021-.035).multiplyScalar(hs).applyQuaternion(heroQuaternion);
  const h=pose(hx+layer.x,layer.y,hz+layer.z,-Math.PI/2,0,-.14,hs);
  const lift=[.72,.49,.31,.17,.07][i]||0;
  const o=pose(h.p.x,h.p.y+lift,h.p.z,-Math.PI/2,0,-.14,hs);
  const side=i%2===0?-1:1;
  const corridor=pose(side*(mobile?1.9:3.0),1.1+((i%3)-1)*.22,-i*.55,-.12,side*.48,side*.08,mobile?.72:1.0);
  const f=field[i].slice();if(i>6&&i%3===1)f[4]+=Math.PI; if(mobile){
   const arranged=[[.70,-.36,.66],[3.1,1.15,.46],[2.25,-4.0,.38],[-2.8,-2.0,.35],[3.9,4.8,.35],[3.0,5.5,.35],[-4.4,4.8,.3]];
   if(i<7){f[0]=arranged[i][0];f[1]=arranged[i][1];f[6]=arranged[i][2]}
   else{f[0]=(i%2?-1:1)*(5.3+(i%3)*1.6);f[1]=((i%5)-2)*4.1;f[6]=.35}
  }
  const a=[-1.25,-1.12,-1.00,-.78,-.55,-.39,-.2,.14,.24,.35,.71,1.11,1.33,1.4,1.5,1.91,2.29,2.75,3.11,3.8,4.18,4.35][i];
  const cx=-1.65+Math.cos(a)*(3.5+(i%5===0?.35:0)),cy=.1+Math.sin(a)*2.35;
  const cel=pose(mobile?cx*.48:cx,mobile?cy*.82-.5:cy,-20+.75*Math.sin(a+.3),.18,Math.PI/2-Math.atan(cx/13)+(i%6===0?.43:.08),a-.15,mobile?.28:(i%6===0?.51:.34));
  const end=oraclePoses[i];
  return [h,o,corridor,pose(...f),cel,end,end];
 });
 const cam=[new THREE.Vector3(0,13,9.5),new THREE.Vector3(.2,11,9.2),new THREE.Vector3(.45,2.2,5.8),new THREE.Vector3(.1,.3,-3.2),new THREE.Vector3(-.1,.1,-7.7),new THREE.Vector3(0,0,-11.6),new THREE.Vector3(0,0,-11.7)];
 const look=[new THREE.Vector3(0,.3,0),new THREE.Vector3(.35,.65,.1),new THREE.Vector3(.55,1.1,-3.3),new THREE.Vector3(.1,.1,-14),new THREE.Vector3(0,0,-20),new THREE.Vector3(0,0,-24),new THREE.Vector3(0,0,-24)];
 cameraCurve=new THREE.CatmullRomCurve3(cam,false,'centripetal');lookCurve=new THREE.CatmullRomCurve3(look,false,'centripetal');
}
function curveTime(p){let i=0;while(i<poseTimes.length-2&&p>poseTimes[i+1])i++;return(i+clamp((p-poseTimes[i])/(poseTimes[i+1]-poseTimes[i])))/(poseTimes.length-1)}
function renderScene(rawP,dt){
 // Reduced motion uses static compositions; it has no camera fly-through or inertia.
 const p=quiet?(rawP<.19?0:rawP<.38?.285:rawP<.59?.47:rawP<.835?.69:.95):rawP;
 const fov=mix(26,35,ramp(.15,.285,p));if(Math.abs(camera.fov-fov)>.002){camera.fov=fov;camera.updateProjectionMatrix()}
 const u=curveTime(p);cameraCurve.getPoint(u,camPos);lookCurve.getPoint(u,camLook);
 if(mobile){camPos.z+=mix(0,1.9,ramp(.15,.285,p));camLook.y=mix(camLook.y,-.1,ramp(.15,.285,p))}
 const damping=1-Math.exp(-dt*5);pointer.x=mix(pointer.x,pointer.tx,damping);pointer.y=mix(pointer.y,pointer.ty,damping);
 if(!quiet){camPos.x+=pointer.x*.16*ramp(.15,.3,p);camPos.y-=pointer.y*.10*ramp(.15,.3,p)}camera.position.copy(camPos);camera.lookAt(camLook);
 const glass=ramp(.745,.925,p),cel=ramp(.535,.68,p)*(1-ramp(.715,.865,p)),open=ramp(.09,.24,p);
 const reading=drawn>=0&&rawP>.835?(quiet?1:ramp(0,1.4,elapsed-drawStart))*ramp(.835,.92,rawP):0;
 const lightZ=mix(0,-24,ramp(.16,.9,p));
 const liftLight=ramp(.15,.33,p);keyLight.position.set(mix(-5,-2.7,liftLight),mix(18.5,5.8,liftLight),mix(-5,7+lightZ,liftLight));lightTarget.position.set(mix(2,.4,liftLight),mix(.25,0,liftLight),lightZ);fillLight.position.set(6,mix(5,1.5,liftLight),mix(9,5+lightZ,liftLight));keyLight.intensity=mix(2.4,1.3,glass);
 ground.material.opacity=.24*(1-ramp(.14,.29,p));ground.visible=ground.material.opacity>.001;
 const span=mix(4.5,6,ramp(.16,.34,p));if(Math.abs(keyLight.shadow.camera.right-span)>.002){keyLight.shadow.camera.left=-span;keyLight.shadow.camera.right=span;keyLight.shadow.camera.top=span*1.2;keyLight.shadow.camera.bottom=-span*1.2;keyLight.shadow.camera.updateProjectionMatrix()}
 for(let i=0;i<cards.length;i++){
  const c=cards[i],d=c.userData;
  const pp=clamp(p-(i/21)*.016*Math.sin(clamp(p/.83)*Math.PI));let seg=0;while(seg<poseTimes.length-2&&pp>poseTimes[seg+1])seg++;
  const a=poses[i][seg],b=poses[i][seg+1],t=ramp(poseTimes[seg],poseTimes[seg+1],pp);
  c.position.lerpVectors(a.p,b.p,t);c.quaternion.slerpQuaternions(a.q,b.q,t);c.scale.setScalar(mix(a.s,b.s,t));
  if(!quiet){c.position.y+=Math.sin(elapsed*.22+i*.51)*.012*ramp(.24,.4,p);c.rotateY(Math.sin(elapsed*.15)*.022*glass)}
  let take=i===selectedIndex?reading:i===previousIndex&&reading>0?(1-reading)*ramp(.835,.92,rawP):0;
  if(take>0){
   tmpV.set(mobile?(camera.aspect<.5?1.02:1.3):2.4,mobile?2.10:.10,-22.0);c.position.lerp(tmpV,take);tmpQ.setFromEuler(tmpE.set(-.08,-.23,-.11));c.quaternion.slerp(tmpQ,take);c.scale.setScalar(mix(c.scale.x,mobile?.24:1.07,take));
  }else if(reading>0){
   const distance=Math.min(Math.abs(i-selectedIndex),22-Math.abs(i-selectedIndex));const vicinity=1-clamp(distance/5);
   c.position.x+=reading*(mobile?.08:.5)+vicinity*reading*(i<selectedIndex?-.12:.12);c.position.z-=reading*(mobile?.1:1.0);c.rotateZ(vicinity*reading*(i<selectedIndex?-.065:.065));
  }
  const g=glass*(1-take),faceOpacity=1-cel*(i%6===0?.02:.18);
  const quietEcho=mobile&&reading>0&&take===0?1-reading*.9:1;
  d.body.material.opacity=faceOpacity*quietEcho;d.body.material.emissiveIntensity=0;d.body.material.roughness=mix(.4,.27,g);d.body.material.metalness=mix(0,.38,g);d.body.material.envMapIntensity=mix(.7,.95,g);d.body.material.color.lerpColors(ivoryColor,opticalColor,g);d.body.material.clearcoat=mix(.16,.55,g);d.body.material.aoMapIntensity=0;d.body.material.iridescence=g*.12;d.body.material.depthWrite=quietEcho>.5;
  d.edge.material.opacity=quietEcho;d.edge.material.emissiveIntensity=0;d.edge.material.depthWrite=quietEcho>.5;
  // In the compressed deck only the outer face is exposed. Sculptures appear as gaps open.
  const interior=i===0?1:ramp(.12,.23,p);const artOpacity=interior*Math.max(1-ramp(.56,.70,p),i%6===0?cel*.75:0)*(1-glass)+take;
  const printOpacity=Math.max(Math.min(1,artOpacity),g*.62);
  d.face.visible=printOpacity>.007;d.face.material.opacity=printOpacity*quietEcho;d.face.material.depthWrite=quietEcho>.5;d.face.material.metalness=mix(.015,.38,g);d.face.material.roughness=mix(.72,.31,g);d.face.material.envMapIntensity=mix(.35,.65,g);
  d.back.visible=interior>.005;d.back.material.opacity=quietEcho;d.back.material.depthWrite=quietEcho>.5;

  d.wire.visible=cel>.005;d.wire.material.opacity=cel*(i%3===0?.33:.12);d.wire.scale.y=mix(.53,1,cel);
  d.body.castShadow=true;d.body.receiveShadow=true;
 }
 for(const line of arcLines){line.visible=cel>.005;line.material.opacity=cel*.65*line.userData.alpha;line.scale.set(mobile?.56:1,mobile?.78:1,1);line.position.y=mobile?-.5:0}
 renderer.shadowMap.enabled=true;
 renderer.render(scene,camera);renderCount++;
}
function frame(now){
 raf=0;if(document.hidden||!alive)return;const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;elapsed+=quiet?0:dt;
 spine.current=quiet?spine.raw:mix(spine.current,spine.raw,1-Math.exp(-dt*8));if(Math.abs(spine.current-spine.raw)<.00003)spine.current=spine.raw;
 updateUI(spine.current);if(renderer)renderScene(spine.current,dt);
 if(renderer&&!quiet&&renderCount>120){if(dt>.031)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>90&&quality>.71){quality=Math.max(.7,quality-.15);slowFrames=0;resizeScene()}}
 if((renderer&&!quiet)||Math.abs(spine.current-spine.raw)>.00003)raf=requestAnimationFrame(frame);
}
function wake(){if(!raf&&!document.hidden&&alive)raf=requestAnimationFrame(frame)}
function resizeScene(){
 mobile=innerWidth<=700&&innerHeight>innerWidth;
 if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.3:1.65)*quality);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();configurePoses()}
 scrollRead();wake();
}
addEventListener('resize',resizeScene,{passive:true});
let suspendedRenderer=null;
function fallback(){suspendedRenderer=renderer;renderer=null;document.documentElement.classList.remove('has-webgl');document.documentElement.classList.add('no-webgl');wake()}
async function init(){
 await document.fonts.ready;
 try{
  await loadSculptureImages();updateFallbackArt(drawn>=0?readings[drawn]:readings[19]);
  const canvas=$('gl');const context=canvas.getContext('webgl2',{alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'})||canvas.getContext('webgl',{alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'});
  if(!context){fallback();return}
  renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'});buildScene();document.documentElement.classList.add('has-webgl');
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback()});
  canvas.addEventListener('webglcontextrestored',()=>{if(!suspendedRenderer)return;renderer=suspendedRenderer;suspendedRenderer=null;document.documentElement.classList.remove('no-webgl');document.documentElement.classList.add('has-webgl');envTarget?.dispose();makeEnvironment();resizeScene()});
  window.oliviaDiagnostics=()=>({cards:cards.length,archetypes:archetypeAssets.length,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,pixelRatio:renderer?.getPixelRatio(),progress:spine.current,reducedMotion:quiet,frames:renderCount,cardIdentities:deckOrder.map(n=>readings[n][1])});
 }catch(e){console.warn('Olivia is using its illustrated view.',e);fallback()}
 scrollRead();spine.current=spine.raw;wake();
}
updateFallbackArt(readings[19]);setQuiet(quiet);scrollRead();init();
addEventListener('pagehide',e=>{cancelAnimationFrame(raf);raf=0;lastTime=0;if(e.persisted)return;alive=false;geometrySet.forEach(g=>g.dispose());materialSet.forEach(m=>m.dispose());surfaceTextures.forEach(t=>t.dispose());envTarget?.dispose();(renderer||suspendedRenderer)?.dispose()});
addEventListener('pageshow',e=>{if(e.persisted){lastTime=0;wake()}});
