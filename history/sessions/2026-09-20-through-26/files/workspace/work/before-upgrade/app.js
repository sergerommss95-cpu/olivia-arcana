// Olivia Arcana — one renderer, one narrative clock, no external requests.
const $ = id => document.getElementById(id);
const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
const mix = (a,b,t) => a+(b-a)*t;
const ease = x => {x=clamp(x);return x*x*(3-2*x)};
const ramp = (a,b,x) => ease((x-a)/(b-a));
const mq = matchMedia('(prefers-reduced-motion: reduce)');
let quiet=mq.matches, mobile=innerWidth<=700, renderer=null, alive=true, raf=0, lastTime=0, elapsed=0;
let drawn=-1, drawStart=-100, selectedType=5;
const spine={raw:0,current:0};
const pointer={x:0,y:0,tx:0,ty:0};
const panels=[...document.querySelectorAll('[data-panel]')], panelWrap=document.querySelector('.panels');
const starts=[0,.17,.36,.58,.83], ends=[.15,.34,.57,.82,1.2];
let currentPanel='';
function scrollRead(){spine.raw=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));wake()}
function setQuiet(value){quiet=value;document.documentElement.classList.toggle('quiet',quiet);$('motion-toggle').setAttribute('aria-pressed',String(quiet));$('motion-toggle').setAttribute('aria-label',quiet?'Enable full motion':'Reduce motion');$('motion-toggle').querySelector('span').textContent=quiet?'Motion reduced':'Motion on';pointer.tx=pointer.ty=pointer.x=pointer.y=0;spine.current=spine.raw;wake()}
$('motion-toggle').addEventListener('click',()=>setQuiet(!quiet));
mq.addEventListener('change',e=>setQuiet(e.matches));
addEventListener('scroll',scrollRead,{passive:true});
addEventListener('pointermove',e=>{if(quiet||mobile)return;pointer.tx=e.clientX/innerWidth-.5;pointer.ty=e.clientY/innerHeight-.5;wake()},{passive:true});
addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer.tx=pointer.ty=0;wake()}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=0}else wake()});
// Twenty-two real Major Arcana; the seven sculptural families repeat across the deck.
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
function drawCard(){
 const pool=new Uint32Array(1);crypto.getRandomValues(pool);let next=pool[0]%readings.length;if(next===drawn)next=(next+1)%readings.length;
 drawn=next;selectedType=readings[next][4];drawStart=elapsed;
 const r=readings[next];$('reading-number').textContent=r[0]+' / YOUR CARD';$('reading-title').textContent=r[1];$('reading-reflection').textContent=r[2];$('reading-note').textContent=r[3];$('oracle-intro').hidden=true;$('reading').hidden=false;
 if(renderer)updateDrawnArt();
 $('reading-title').focus({preventScroll:true});wake();
}
$('draw-card').addEventListener('click',drawCard);$('draw-again').addEventListener('click',drawCard);
function updateUI(p){
 panelWrap.style.mixBlendMode=p>.16&&p<.35?'difference':'normal';
 panels.forEach((panel,i)=>{
  let opacity=i===0?1-ramp(.09,.17,p):ramp(starts[i],starts[i]+.045,p)*(1-ramp(ends[i]-.04,ends[i],p));
  if(i===4)opacity=ramp(.82,.88,p);
  const visible=opacity>.02;
  panel.style.opacity=opacity.toFixed(3);panel.classList.toggle('active',visible);panel.inert=!visible;panel.setAttribute('aria-hidden',String(!visible));
  if(visible)currentPanel=panel.dataset.panel;
 });
 const h=1-ramp(.08,.22,p);$('hero-type').style.opacity=h.toFixed(3);$('hero-type').style.transform=quiet?'none':`translateY(${-ramp(0,.24,p)*55}px)`;
 $('progress').style.transform=`scaleX(${p})`;
 if(!renderer){$('fallback-art').style.opacity=(p>.2&&p<.83?0:1).toString();$('fallback-art').style.top=p>.83?'48%':''}
}
let scene,camera,cards=[],arcLines=[],MAT={},reliefAssets,poses=[],envTarget;
const positionScratch=new THREE.Vector3(), lookScratch=new THREE.Vector3();
const ivoryColor=new THREE.Color(0xe1dfcf),opticalColor=new THREE.Color(0x94a7a3);
const rotationScratch=new THREE.Quaternion(),eulerScratch=new THREE.Euler();
const poseTimes=[0,.16,.29,.45,.68,.91];
function pose(x,y,z,rx,ry,rz,scale=1){return {p:new THREE.Vector3(x,y,z),q:new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),s:scale}}
function rounded(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
function plate(w,h,t){const g=new THREE.ExtrudeGeometry(rounded(w,h,.095),{depth:t,bevelEnabled:true,bevelThickness:.012,bevelSize:.016,bevelSegments:2,curveSegments:5});g.center();return g}
function rimPlate(){
 const s=rounded(2.526,3.826,.105),hole=rounded(2.492,3.792,.09);
 s.holes.push(new THREE.Path(hole.getPoints(5).reverse()));
 const g=new THREE.ExtrudeGeometry(s,{depth:.026,bevelEnabled:false,curveSegments:5});g.center();return g;
}
function makeEnvironment(){
 const es=new THREE.Scene();es.background=new THREE.Color('#53554c');
 const geometry=new THREE.PlaneGeometry(1,1);
 [[-4,6,5,4,7,0xfff8df,7],[5,2,3,2,6,0xdbe4dd,3],[-4,-3,2,3,2,0xcfba91,1.5]].forEach(([x,y,z,w,h,col,int])=>{const m=new THREE.MeshBasicMaterial({color:col});m.color.multiplyScalar(int);const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,1);o.lookAt(0,0,0);es.add(o)});
 const gen=new THREE.PMREMGenerator(renderer);envTarget=gen.fromScene(es,.09,.1,80);scene.environment=envTarget.texture;gen.dispose();es.traverse(o=>{if(o.material)o.material.dispose()});geometry.dispose();
}
const labelCache=new Map();
function labelTexture(n,title){
 const key=n+title;if(labelCache.has(key))return labelCache.get(key);
 const c=document.createElement('canvas');c.width=384;c.height=576;const ctx=c.getContext('2d');
 ctx.strokeStyle='#787765';ctx.lineWidth=.8;ctx.beginPath();ctx.roundRect(23,23,338,530,100);ctx.stroke();
 ctx.fillStyle='#777565';ctx.textAlign='center';ctx.font='13px "DM Sans"';ctx.fillText(n,192,61);ctx.font='11px "DM Sans"';ctx.letterSpacing='3px';ctx.fillText(title.toUpperCase(),192,526);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());labelCache.set(key,texture);return texture;
}
function fillRelief(group,type){group.clear();reliefAssets[type].forEach(({geometry,materialKey})=>{group.add(new THREE.Mesh(geometry,MAT[materialKey]))})}
function updateDrawnArt(){
 const c=cards[0],r=readings[drawn];fillRelief(c.userData.relief,selectedType);c.userData.label.material.map=labelTexture(r[0],r[1]);c.userData.label.material.needsUpdate=true;
}
function buildScene(){
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.08,120);
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 makeEnvironment();scene.add(new THREE.HemisphereLight(0xf8f0d8,0x42483d,1.7));
 const key=new THREE.DirectionalLight(0xfff5df,3.4);key.position.set(-3,6,8);scene.add(key);
 const fill=new THREE.DirectionalLight(0xc8d6d3,1.3);fill.position.set(4,1,5);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xe6dcc0,2.2);rim.position.set(-2,-2,-8);scene.add(rim);
 MAT.ivory=new THREE.MeshStandardMaterial({color:0xe3e0d0,metalness:.05,roughness:.48});
 MAT.platinum=new THREE.MeshStandardMaterial({color:0xb8bcb1,metalness:.83,roughness:.29});
 MAT.gold=new THREE.MeshStandardMaterial({color:0xb7a076,metalness:.72,roughness:.3});
 MAT.dark=new THREE.MeshStandardMaterial({color:0x4d5246,metalness:.2,roughness:.7});
 reliefAssets=buildReliefAssets(THREE);
 const bodyGeometry=plate(2.5,3.8,.065),rimGeometry=rimPlate(),labelGeometry=new THREE.PlaneGeometry(2.5,3.8);
 const lineGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-1.9,0),new THREE.Vector3(0,-4.1,0),new THREE.Vector3(0,1.9,0),new THREE.Vector3(0,4.1,0)]);
 const titles=[['XIX','The Sun'],['II','The High Priestess'],['XVIII','The Moon'],['XVII','The Star'],['I','The Magician'],['XXI','The World'],['0','The Fool']];
 const types=[5,2,3,4,1,6,0];
 for(let i=0;i<22;i++){
  const group=new THREE.Group();
  const bm=new THREE.MeshPhysicalMaterial({color:0xe1dfcf,metalness:.07,roughness:.44,clearcoat:.25,clearcoatRoughness:.4,transparent:true,opacity:1,side:THREE.FrontSide});
  const rm=MAT.platinum.clone();rm.transparent=true;
  const body=new THREE.Mesh(bodyGeometry,bm),edge=new THREE.Mesh(rimGeometry,rm);edge.position.z=-.018;
  group.add(edge,body);
  const relief=new THREE.Group();group.add(relief);
  // Rich relief on the seven hero cards. Every card still has a physical face and rim.
  if(i<7)fillRelief(relief,types[i]);
  const labelMat=new THREE.MeshBasicMaterial({map:labelTexture(...titles[i%7]),transparent:true,depthWrite:false,opacity:.85,polygonOffset:true,polygonOffsetFactor:-1});
  const label=new THREE.Mesh(labelGeometry,labelMat);label.position.z=.047;group.add(label);
  const wire=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({color:0xc7c7b3,transparent:true,opacity:0,depthWrite:false}));group.add(wire);
  group.userData={body,edge,relief,label,wire};cards.push(group);scene.add(group);
 }
 // One open orbit and two partial echoes, drawn only as the edges open.
 [[3.2,-.35,5.18,1],[3.8,2.3,3.7,.37],[2.75,-.2,.8,.3]].forEach(([r,a,b,alpha],index)=>{
  const pts=[];for(let i=0;i<=160;i++){let t=mix(a,b,i/160);pts.push(new THREE.Vector3(Math.cos(t)*r,Math.sin(t)*r*.7,Math.sin(t)*.45))}
  const geo=new THREE.BufferGeometry().setFromPoints(pts),mat=new THREE.LineBasicMaterial({color:index===0?0xc8b995:0xc2c9b9,transparent:true,opacity:0,depthWrite:false});
  const line=new THREE.Line(geo,mat);line.position.set(-1.45,.38,-19);line.rotation.z=-.26;line.userData.alpha=alpha;scene.add(line);arcLines.push(line);
 });
 configurePoses();resizeScene();
}
function configurePoses(){
 // Hand-placed lead cards and an off-axis procession. No uniform sinusoidal grid.
 const field=[
 [2.65,.18,-14,-.10,-.22,.19,.95],[5.4,2.8,-19,.15,-.58,-.18,.72],[.9,-3.6,-18,.17,.44,-.24,.72],
 [7.4,-3.1,-22,-.1,.49,.38,.70],[.2,4.9,-22,-.32,-.26,-.31,.58],[7.7,.0,-24,.2,-.55,.2,.77],[-3.5,5.9,-24,.12,.7,-.26,.50],
 [9.0,5.4,-27,.2,.6,.3,.61],[.8,-6.8,-27,.1,-.45,-.15,.66],[-12.4,-2.5,-25,.4,.8,.1,.68],[4.2,-5.6,-26,.2,.6,-.2,.6],[-6.2,8.8,-27,-.2,-.8,.2,.6],
 [10.2,-5.8,-28,.3,-.5,.3,.65],[-12.6,2.1,-25,.15,.4,-.2,.7],[4.6,8.8,-30,.2,.5,.2,.6],[-3.8,-8.5,-28,.1,-.8,.5,.65],
 [12,2,-29,.1,.4,.2,.5],[-14,-1,-28,.2,-.5,-.3,.6],[1.2,9.7,-30,.1,.6,-.2,.6],[-4,10.5,-32,.2,-.3,.1,.55],[6,-8.4,-30,.1,.3,.5,.58],[-9,-9,-31,.1,.4,.1,.6]
 ];
 poses=cards.map((c,i)=>{
  const j=i-10.5,a=-.32+i/21*5.06,heroQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.19,-.52,-.18));
  const layer=new THREE.Vector3(0,0,.95-i*.102).applyQuaternion(heroQ);
  const hx=mobile?.55:2.05,hy=mobile?.1:.0,hs=mobile?.77:1.19;
  const h=pose(hx+layer.x*hs,hy+layer.y*hs,layer.z*hs,-.19,-.52,-.18,hs);
  const o=pose(hx+layer.x*1.8,hy+layer.y*1.8,layer.z*2,-.17,-.43,-.14+j*.008,hs);
  const side=i%2===0?1:-1;
  const corridor=pose(side*(2.9+(i%4)*.4),((i%5)-2)*1.2,-i*.57,-.08,side*.52,side*-.18,1.14);
  const f=field[i].slice();if(mobile){f[0]*=.51;f[1]*=1.05;f[6]*=.69;if(i===0){f[0]=.85;f[1]=-.2;f[6]=.76}}
  const cx=(mobile?-.15:-1.45)+Math.cos(a)*(mobile?2.05:3.2);
  const cel=pose(cx,.38+Math.sin(a)*2.24,-19+Math.sin(a)*.45,.10,Math.PI/2-Math.atan(cx/12),-a-.1,mobile?.25:.36);
  const final=pose((mobile?.55:2.05)+Math.sin(j*.3)*.12,(mobile?-1.6:.15)+Math.cos(j*.25)*.09,-23+j*.105,-.18,.56,-.40+j*.069,mobile?.56:.89);
  return [h,o,corridor,pose(...f),cel,final];
 });
}
const camKeys=[
 [0,0,0,12,0,0,0],[.16,0,.1,9,0,0,-1],[.29,0,.05,3.3,0,0,-6],[.45,0,0,-2.7,0,0,-13],
 [.68,0,0,-7,0,0,-19],[.91,0,0,-11,0,0,-23],[1,0,0,-11,0,0,-23]
];
function renderScene(p,dt){
 let ck=0;while(ck<camKeys.length-2&&p>camKeys[ck+1][0])ck++;
 const ca=camKeys[ck],cb=camKeys[ck+1],ct=ramp(ca[0],cb[0],p);
 // A narrower field of view uses the vertical composition designed for touch.
 for(let k=0;k<3;k++){positionScratch.setComponent(k,mix(ca[k+1],cb[k+1],ct));lookScratch.setComponent(k,mix(ca[k+4],cb[k+4],ct))}
 if(mobile){positionScratch.z+=2.1;lookScratch.y=-.1}
 const pointerDamp=1-Math.exp(-dt*5);pointer.x=mix(pointer.x,pointer.tx,pointerDamp);pointer.y=mix(pointer.y,pointer.ty,pointerDamp);
 if(!quiet){positionScratch.x+=pointer.x*.10;positionScratch.y-=pointer.y*.07}
 camera.position.copy(positionScratch);camera.lookAt(lookScratch);
 const glass=ramp(.75,.93,p),cel=ramp(.54,.67,p)*(1-ramp(.72,.87,p));
 for(let i=0;i<cards.length;i++){
  const c=cards[i],data=c.userData;
  // Stagger only the unfolding; endpoints always settle exactly into authored poses.
  const pp=clamp(p-(i/21)*.018*Math.sin(clamp(p/.82)*Math.PI));
  let segment=0;while(segment<poseTimes.length-2&&pp>poseTimes[segment+1])segment++;
  const a=poses[i][segment],b=poses[i][segment+1],t=ramp(poseTimes[segment],poseTimes[segment+1],pp);
  c.position.lerpVectors(a.p,b.p,t);c.quaternion.slerpQuaternions(a.q,b.q,t);c.scale.setScalar(mix(a.s,b.s,t));
  if(!quiet){c.position.y+=Math.sin(elapsed*.25+i*.5)*.012*(ramp(.2,.4,p));}
  const read=drawn>=0&&p>.82?(quiet?1:ramp(0,1.25,elapsed-drawStart))*ramp(.82,.91,p):0;
  if(i===0&&read>0){
   positionScratch.set(mobile?(camera.aspect<.5?1.02:1.3):2.1,mobile?2.05:.0,-21.2);c.position.lerp(positionScratch,read);
   rotationScratch.setFromEuler(eulerScratch.set(-.07,-.12,.05));c.quaternion.slerp(rotationScratch,read);c.scale.setScalar(mix(c.scale.x,mobile?.25:1.01,read));
  }
  const selected=i===0&&read>0,materialGlass=glass*(selected?1-read:1);
  data.body.material.opacity=mix(1-cel*.96,.038+(i%3)*.006,materialGlass);
  data.body.material.roughness=mix(.44,.09,materialGlass);data.body.material.metalness=mix(.07,.62,materialGlass);
  data.body.material.iridescence=materialGlass*.65;
  data.body.material.color.lerpColors(ivoryColor,opticalColor,materialGlass);
  if(!quiet)c.rotateY(Math.sin(elapsed*.17)*.035*glass);
  data.body.material.depthWrite=materialGlass<.5&&cel<.2;
  data.edge.material.opacity=mix(1-cel*.58,.72,materialGlass);
  data.edge.material.depthWrite=materialGlass<.5&&cel<.2;
  if(mobile&&i>0&&read>0){data.body.material.opacity*=1-read*.9;data.edge.material.opacity*=1-read*.88;}
  data.relief.visible=(cel<.28)&&(glass<.25||(selected&&read>.75))&&(!mobile||i<4||p<.25);
  data.label.visible=(cel<.22&&glass<.35)||(selected&&read>.65);
  data.wire.visible=cel>.02;data.wire.material.opacity=cel*.24;data.wire.scale.y=mix(.48,1,cel);
  // Suppress distant decoration on mobile without removing any card from the deck.
  c.visible=!(mobile&&p>.33&&p<.73&&i>11);
 }
 arcLines.forEach(line=>{line.visible=cel>.005;line.material.opacity=cel*.52*line.userData.alpha;line.scale.x=mobile?.74:1});
 renderer.render(scene,camera);
}
let slowFrames=0,totalFrames=0,quality=1;
function frame(now){
 raf=0;if(document.hidden||!alive)return;
 const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;elapsed+=quiet?0:dt;
 spine.current=quiet?spine.raw:mix(spine.current,spine.raw,1-Math.exp(-dt*8));if(Math.abs(spine.current-spine.raw)<.00003)spine.current=spine.raw;
 const p=clamp(spine.current);updateUI(p);if(renderer)renderScene(p,dt);
 if(renderer&&!quiet&&totalFrames++>90){if(dt>.028)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>70&&quality> .7){quality-=.15;slowFrames=0;resizeScene()}}
 if(!quiet||Math.abs(spine.current-spine.raw)>.00003)raf=requestAnimationFrame(frame);
}
function wake(){if(!raf&&!document.hidden&&alive)raf=requestAnimationFrame(frame)}
function resizeScene(){
 mobile=innerWidth<=700;
 if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.35:1.65)*quality);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();configurePoses()}
 scrollRead();wake();
}
addEventListener('resize',resizeScene,{passive:true});
function fallback(){renderer=null;document.documentElement.classList.remove('has-webgl');document.documentElement.classList.add('no-webgl');wake()}
async function init(){
 // Font readiness affects card inscriptions only. The reading controls never depend on WebGL.
 await document.fonts.ready;
 try{
  const canvas=$('gl');
  const context=canvas.getContext('webgl2',{alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'})||canvas.getContext('webgl',{alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'});
  if(!context){fallback();return}
  renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,stencil:false,powerPreference:'high-performance'});
  buildScene();document.documentElement.classList.add('has-webgl');
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback()},{once:true});
  // A compact diagnostics hook for local QA, with no animation state or DOM writes exposed.
  window.oliviaDiagnostics=()=>({cards:cards.length,archetypes:reliefAssets.length,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,pixelRatio:renderer?.getPixelRatio(),progress:spine.current,reducedMotion:quiet,frames:totalFrames});
 }catch(e){console.warn('Olivia is using its illustrated view.',e);fallback()}
 scrollRead();spine.current=spine.raw;wake();
}
setQuiet(quiet);scrollRead();init();
addEventListener('pagehide',e=>{cancelAnimationFrame(raf);raf=0;lastTime=0;if(e.persisted)return;alive=false;if(renderer){const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m))});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());labelCache.forEach(t=>t.dispose());envTarget?.dispose();renderer.dispose()}});
addEventListener('pageshow',e=>{if(e.persisted){lastTime=0;wake()}});
