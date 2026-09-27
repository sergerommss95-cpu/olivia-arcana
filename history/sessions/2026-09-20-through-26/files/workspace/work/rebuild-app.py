from pathlib import Path
s=Path('work/before-upgrade/app.js').read_text()
a=s.index('const readings=[');b=s.index('\nfunction drawCard()',a)
readings=s[a:b]
top='''// Olivia Arcana — a continuous sculptural world. Three.js and fonts are embedded.
const $=id=>document.getElementById(id);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const ramp=(a,b,x)=>ease((x-a)/(b-a));
const mq=matchMedia('(prefers-reduced-motion: reduce)');
let quiet=mq.matches,mobile=innerWidth<=700&&innerHeight>innerWidth,renderer=null,alive=true,raf=0,lastTime=0,elapsed=0;
let drawn=-1,selectedIndex=-1,previousIndex=-1,drawStart=-10,scene,camera,keyLight,fillLight,lightTarget,envTarget,grainMap;
let cards=[],arcLines=[],MAT={},reliefAssets,poses=[],cameraCurve,lookCurve,renderCount=0,quality=1,slowFrames=0;
const spine={raw:0,current:0};
const pointer={x:0,y:0,tx:0,ty:0};
const panels=[...document.querySelectorAll('[data-panel]')],panelWrap=document.querySelector('.panels');
const heroType=$('hero-type'),progressEl=$('progress'),worldEl=$('world');
const starts=[0,.19,.38,.59,.835],ends=[.16,.355,.58,.825,1.2];
const poseTimes=[0,.15,.285,.47,.69,.925,1];
const tmpV=new THREE.Vector3(),camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),tmpQ=new THREE.Quaternion(),tmpE=new THREE.Euler();
const ivoryColor=new THREE.Color(0xddd7c5),opticalColor=new THREE.Color(0xb6beb1);
const materialSet=new Set(),geometrySet=new Set(),labelCache=new Map();
function registerMaterial(m){materialSet.add(m);return m}
function registerGeometry(g){geometrySet.add(g);return g}
function scrollRead(){spine.raw=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));wake()}
function setQuiet(value){quiet=value;document.documentElement.classList.toggle('quiet',quiet);$('motion-toggle').setAttribute('aria-pressed',String(quiet));$('motion-toggle').setAttribute('aria-label',quiet?'Enable full motion':'Reduce motion');$('motion-toggle').querySelector('span').textContent=quiet?'Motion reduced':'Motion on';pointer.tx=pointer.ty=pointer.x=pointer.y=0;spine.current=spine.raw;if(drawn>=0)drawStart=elapsed-3;wake()}
$('motion-toggle').addEventListener('click',()=>setQuiet(!quiet));mq.addEventListener('change',e=>setQuiet(e.matches));
addEventListener('scroll',scrollRead,{passive:true});
addEventListener('pointermove',e=>{if(quiet||mobile||!renderer)return;pointer.tx=e.clientX/innerWidth-.5;pointer.ty=e.clientY/innerHeight-.5;wake()},{passive:true});
addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer.tx=pointer.ty=0;wake()}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=0}else wake()});
'''
Path('work/app.js').write_text(top+readings+'\n')
