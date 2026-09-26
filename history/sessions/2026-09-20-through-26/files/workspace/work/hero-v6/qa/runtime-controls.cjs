'use strict';
// Dependency-free event/runtime audit. Executes the actual control handlers and
// frame loop with a minimal DOM/RAF mock; does not emulate rendering or layout.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../hero.js'),'utf8');
const controlStart=source.indexOf("const intro=$('#intro')"),controlEnd=source.indexOf('async function initialize()',controlStart);
const resizeStart=source.indexOf('function scrollRange()'),resizeEnd=source.indexOf('// Rotate the complete scene',resizeStart);
if([controlStart,controlEnd,resizeStart,resizeEnd].some(x=>x<0))throw Error('Runtime sections not found');
function harness(){
 const globalEvents={},documentEvents={},mqEvents={},rafs=new Map(),elements=new Map();let nextId=0,now=100,trackBuilds=0,bufferWrites=0;
 function el(id,tag='DIV'){
  const events={},attrs={},node={id,tagName:tag,style:{},events,attrs,hidden:false,inert:false,textContent:'',offsetWidth:1440,offsetHeight:1000,
   setAttribute(k,v){attrs[k]=v;},addEventListener(k,f){(events[k]??=[]).push(f);},
   closest(selector){return selector.split(',').some(s=>s.trim()==='#'+id||s.trim().toUpperCase()===tag)?node:null;}};
  return node;
 }
 for(const id of ['intro','opening-type','intertitle','closing','journey','motion','line','scroll-label','stage','canvas'])elements.set(id,el(id,['journey','motion'].includes(id)?'BUTTON':'DIV'));
 elements.set('navLink',el('navLink','A'));
 const root=el('root','HTML');root.scrollHeight=7600;root.classList={add(){},remove(){},toggle(){}};
 const canvas=elements.get('canvas');let cw=1,ch=1;Object.defineProperties(canvas,{width:{get(){return cw;},set(v){cw=v;bufferWrites++;}},height:{get(){return ch;},set(v){ch=v;bufferWrites++;}}});
 const context={console,Math,Float32Array,innerHeight:1000,scrollY:0,devicePixelRatio:1,document:{hidden:false,documentElement:root,addEventListener(k,f){(documentEvents[k]??=[]).push(f);}},
  addEventListener(k,f){(globalEvents[k]??=[]).push(f);},requestAnimationFrame(f){const id=++nextId;rafs.set(id,f);return id;},cancelAnimationFrame(id){rafs.delete(id);},
  scrollTo({top}){context.scrollY=Math.max(0,Math.min(root.scrollHeight-context.innerHeight,top));},
  IntersectionObserver:class{observe(){}disconnect(){}},
  mq:{matches:false,addEventListener(k,f){(mqEvents[k]??=[]).push(f);}},
  $:sel=>elements.get(sel==='canvas'?'canvas':sel.slice(1)),canvas,stage:elements.get('stage'),
  makeTracks(){trackBuilds++;},copyPace:x=>x,
 };
 vm.createContext(context);
 vm.runInContext(`
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 let quiet=false,staticView=false,paused=false,alive=true,inView=true,ready=true,raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
 let watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='',freezeTime=false,w=1440,h=1000,mobile=false;
 const JOURNEY_SECONDS=78;
 let gl=null,atlas=null,details={},back=null,buf=null,indexBuf=null,program=null;
 function draw(){frames++;updateCopy(copyPace(quiet?1:p));updateJourneyControl();}
 ${source.slice(resizeStart,resizeEnd)}
 ${source.slice(controlStart,controlEnd)}
 function initialize(){}
 globalThis.inspect=()=>({p,target,watching,paused,quiet,frames,time,last,raf,resizeRequest,ptr:[...ptr]});
 globalThis.runtime={resize,queueResize,wake};`,context);
 function dispatch(type,targetId='root',extra={}){const target=targetId==='root'?root:elements.get(targetId);const e={target,...extra};for(const f of target.events[type]||[])f(e);for(const f of globalEvents[type]||[])f(e);}
 function step(ms=16.6667){now+=ms;const pending=[...rafs.entries()];rafs.clear();for(const [,f]of pending)f(now);}
 function reduce(value){context.mq.matches=value;for(const f of mqEvents.change||[])f({matches:value});}
 function hide(value){context.document.hidden=value;for(const f of documentEvents.visibilitychange||[])f({});}
 return {dispatch,step,reduce,hide,inspect:context.inspect,runtime:context.runtime,context,elements,rafs,getStats:()=>({trackBuilds,bufferWrites})};
}
const report=[];
function check(name,fn){const h=harness();try{const detail=fn(h);report.push({name,pass:detail.pass,...detail});}catch(e){report.push({name,pass:false,error:String(e)});}}
const start=h=>{h.dispatch('click','journey');for(let i=0;i<90;i++)h.step();};
check('Wheel takes over automatic journey',h=>{start(h);h.dispatch('wheel');return{pass:!h.inspect().watching,state:h.inspect()};});
check('Navigation keys take over while journey button has focus',h=>{start(h);h.dispatch('keydown','journey',{key:'PageDown'});return{pass:!h.inspect().watching,state:h.inspect()};});
check('Space on a focused link takes over native page scrolling',h=>{start(h);h.dispatch('keydown','navLink',{key:' '});return{pass:!h.inspect().watching};});
check('Pause drift does not pause the independent journey',h=>{start(h);h.dispatch('pointerdown','motion');h.dispatch('click','motion');return{pass:h.inspect().watching&&h.inspect().paused,state:h.inspect()};});
check('Touch on journey pauses instead of restarting',h=>{start(h);h.dispatch('touchstart','journey');h.dispatch('click','journey');return{pass:!h.inspect().watching,state:h.inspect()};});
check('Journey pause stops progress after spring settles',h=>{start(h);h.dispatch('click','journey');for(let i=0;i<120;i++)h.step();const a=h.inspect();for(let i=0;i<120;i++)h.step();const b=h.inspect();return{pass:!b.watching&&Math.abs(a.p-b.p)<1e-7,delta:b.p-a.p};});
check('Reduced motion stops journey and idle RAF',h=>{start(h);h.reduce(true);for(let i=0;i<10;i++)h.step();const a=h.inspect();return{pass:!a.watching&&a.quiet&&h.rafs.size===0,state:a,pending:h.rafs.size};});
check('Unchanged resize does not rebuild rail or framebuffer twice',h=>{h.runtime.resize();const before=h.getStats();h.runtime.resize();const after=h.getStats();return{pass:before.trackBuilds===after.trackBuilds&&before.bufferWrites===after.bufferWrites,before,after};});
check('Hidden tab suspends journey without advancing on return',h=>{start(h);h.hide(true);const a=h.inspect();h.step(30000);const hidden=h.inspect();h.hide(false);h.step();const b=h.inspect();return{pass:hidden.p===a.p&&Math.abs((b.target-a.target)-1/60/78)<1e-8,resumedAdvance:b.target-a.target};});
check('Playback completes at 78 active seconds and offers replay',h=>{h.dispatch('click','journey');for(let i=0;i<4800;i++)h.step(1000/60);const a=h.inspect();return{pass:a.p===1&&!a.watching&&h.elements.get('journey').textContent==='Watch again',progress:a.p,label:h.elements.get('journey').textContent};});
console.log(JSON.stringify(report,null,2));
process.exitCode=report.some(r=>!r.pass)?1:0;
