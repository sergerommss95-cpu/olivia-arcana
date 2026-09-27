'use strict';
// Dependency-free event/runtime audit. Executes the actual control handlers and
// frame loop with a minimal DOM/RAF mock; does not emulate rendering or layout.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../hero.js'),'utf8');
const sourceSHA256=crypto.createHash('sha256').update(source).digest('hex');
const journeySeconds=Number(source.match(/const JOURNEY_SECONDS=(\d+)/)?.[1]);
const controlStart=source.indexOf("const intro=$('#intro')"),controlEnd=source.indexOf('async function initialize()',controlStart);
const initializeEnd=source.indexOf('window.motionStudy=',controlEnd);
const resizeStart=source.indexOf('function scrollRange()'),resizeEnd=source.indexOf('// Rotate the complete scene',resizeStart);
const hasMagic=/initializeMagic\(\)/.test(source);
const expectedDeletions=26+(hasMagic?2:0);
if([controlStart,controlEnd,resizeStart,resizeEnd].some(x=>x<0))throw Error('Runtime sections not found');
function harness(options={}){
 const globalEvents={},documentEvents={},mqEvents={},rafs=new Map(),elements=new Map(),observers=[];let nextId=0,now=100,trackBuilds=0,bufferWrites=0,deleted=0,initialized=0;
 function el(id,tag='DIV'){
  const events={},attrs={},node={id,tagName:tag,style:{},events,attrs,hidden:false,inert:false,textContent:'',offsetWidth:1440,offsetHeight:1000,
   setAttribute(k,v){attrs[k]=v;},addEventListener(k,f){(events[k]??=[]).push(f);},
   closest(selector){return selector.split(',').some(s=>s.trim()==='#'+id||s.trim().toUpperCase()===tag)?node:null;}};
  return node;
 }
 for(const id of ['intro','opening-type','intertitle','closing','journey','motion','line','scroll-label','stage','canvas','poster'])elements.set(id,el(id,['journey','motion'].includes(id)?'BUTTON':'DIV'));
 elements.set('navLink',el('navLink','A'));
 const root=el('root','HTML');root.scrollHeight=7600;const classes=new Set();root.classList={add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},toggle(x,v){if(v===undefined)v=!classes.has(x);if(v)classes.add(x);else classes.delete(x);}};
 const canvas=elements.get('canvas');let cw=1,ch=1;Object.defineProperties(canvas,{width:{get(){return cw;},set(v){cw=v;bufferWrites++;}},height:{get(){return ch;},set(v){ch=v;bufferWrites++;}}});
 const gl={createProgram(){initialized++;return {};},getProgramParameter(){return true;},createBuffer(){return {};},getAttribLocation(){return 0;},getUniformLocation(){return {};},deleteTexture(){deleted++;},deleteBuffer(){deleted++;},deleteProgram(){deleted++;}};
 for(const k of ['viewport','linkProgram','useProgram','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','uniform1i','enable','depthFunc','disable'])gl[k]=()=>{};
 canvas.getContext=()=>gl;
 const context={console,Math,Float32Array,innerHeight:1000,scrollY:0,devicePixelRatio:1,document:{hidden:false,documentElement:root,addEventListener(k,f){(documentEvents[k]??=[]).push(f);}},
  addEventListener(k,f){(globalEvents[k]??=[]).push(f);},requestAnimationFrame(f){const id=++nextId;rafs.set(id,f);return id;},cancelAnimationFrame(id){rafs.delete(id);},
  scrollTo({top}){context.scrollY=Math.max(0,Math.min(root.scrollHeight-context.innerHeight,top));},
  IntersectionObserver:class{constructor(fn){this.callback=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},
  mq:{matches:false,addEventListener(k,f){(mqEvents[k]??=[]).push(f);}},
  $:sel=>elements.get(sel==='canvas'?'canvas':sel.slice(1)),canvas,stage:elements.get('stage'),
  makeTracks(){trackBuilds++;},copyPace:x=>x,
  DETAIL_DATA:Object.fromEntries(Array.from({length:22},(_,id)=>[id,`card-${id}`])),BACK_DATA:'back',load:async src=>({src}),shader(){},texture:()=>({}),makeMesh:()=>({i:new Uint16Array([0,1,2]),v:new Float32Array(24)}),vert:'',frag:'',
 };
 vm.createContext(context);
 vm.runInContext(`
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 let quiet=false,staticView=false,paused=false,alive=true,inView=true,ready=${options.ready!==false},raf=0,last=0,time=0,p=0,target=0,progressVelocity=0,ptr=[0,0],aim=[0,0],frames=0;
 let fallbackMode=false,watching=false,initGeneration=0,resizeRequest=0,lastJourneyLabel='',freezeTime=false,w=1440,h=1000,mobile=false;
 const JOURNEY_SECONDS=${journeySeconds};
 let gl=null,details={},back=null,buf=null,indexBuf=null,program=null,loc={},meshCount=0;const diagnostics={};
 let magicProgram=null,magicBuffer=null;
 function initializeMagic(){magicProgram={};magicBuffer={};}
 function disposeMagic(){if(magicBuffer)gl.deleteBuffer(magicBuffer);if(magicProgram)gl.deleteProgram(magicProgram);magicBuffer=magicProgram=null;}
 function draw(){if(globalThis.failDraw)throw Error('Mock first-draw failure');frames++;updateCopy(copyPace(quiet?1:p));updateJourneyControl();}
 ${source.slice(resizeStart,resizeEnd)}
 ${source.slice(controlStart,controlEnd)}
 ${source.slice(controlEnd,initializeEnd)}
 globalThis.inspect=()=>({p,target,watching,paused,quiet,alive,ready,inView,initGeneration,frames,time,last,raf,resizeRequest,ptr:[...ptr],aim:[...aim]});
 globalThis.runtime={resize,queueResize,wake,initialize,setProgress};`,context);
 function dispatch(type,targetId='root',extra={}){const target=targetId==='root'?root:elements.get(targetId);const e={target,...extra};for(const f of target.events[type]||[])f(e);for(const f of globalEvents[type]||[])f(e);}
 function step(ms=16.6667){now+=ms;const pending=[...rafs.entries()];rafs.clear();for(const [,f]of pending)f(now);}
 function reduce(value){context.mq.matches=value;for(const f of mqEvents.change||[])f({matches:value});}
 function hide(value){context.document.hidden=value;for(const f of documentEvents.visibilitychange||[])f({});}
 function intersect(value){observers[0].callback([{isIntersecting:value}]);}
 return {dispatch,step,reduce,hide,intersect,inspect:context.inspect,runtime:context.runtime,context,elements,rafs,classes,observers,getStats:()=>({trackBuilds,bufferWrites,deleted,initialized})};
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
check('Hidden tab suspends journey without advancing on return',h=>{start(h);h.hide(true);const a=h.inspect();h.step(30000);const hidden=h.inspect();h.hide(false);h.step();const b=h.inspect();return{pass:hidden.p===a.p&&Math.abs((b.target-a.target)-1/60/journeySeconds)<1e-8,resumedAdvance:b.target-a.target};});
check(`Playback completes at ${journeySeconds} active seconds and offers replay`,h=>{h.dispatch('click','journey');for(let i=0;i<(journeySeconds+2)*60;i++)h.step(1000/60);const a=h.inspect();return{pass:a.p===1&&!a.watching&&h.elements.get('journey').textContent==='Watch again',progress:a.p,label:h.elements.get('journey').textContent};});
check('Native scroll updates target and converges smoothly',h=>{h.context.scrollY=3300;h.dispatch('scroll');const a=h.inspect();h.step();const b=h.inspect();for(let i=0;i<120;i++)h.step();return{pass:a.target===.5&&b.p>0&&b.p<.5&&Math.abs(h.inspect().p-.5)<1e-7,firstProgress:b.p,settledProgress:h.inspect().p};});
check('Native wheel takeover accepts subsequent scroll position',h=>{start(h);h.dispatch('wheel');h.context.scrollY=3300;h.dispatch('scroll');for(let i=0;i<120;i++)h.step();return{pass:!h.inspect().watching&&h.inspect().target===.5&&h.context.scrollY===3300};});
check('Automatic scroll events preserve journey progress',h=>{start(h);const a=h.inspect();h.context.scrollY+=1;h.dispatch('scroll');return{pass:h.inspect().watching&&h.inspect().target===a.target};});
check('Journey resumes from current position',h=>{start(h);h.dispatch('click','journey');for(let i=0;i<120;i++)h.step();const a=h.inspect();h.dispatch('click','journey');h.step();const b=h.inspect();return{pass:b.watching&&b.p>=a.p&&b.target>a.target&&b.target-a.target<.001};});
check('Replay restarts after completion',h=>{h.runtime.setProgress(1);h.dispatch('click','journey');return{pass:h.inspect().watching&&h.inspect().p===0&&h.inspect().target===0&&h.context.scrollY===0};});
check('Diagnostic progress cancels automatic playback',h=>{start(h);h.runtime.setProgress(.45);for(let i=0;i<5;i++)h.step();return{pass:!h.inspect().watching&&h.inspect().p===.45&&h.inspect().target===.45};});
check('Pause drift freezes ambient time but permits native scroll',h=>{start(h);h.dispatch('wheel');h.dispatch('click','motion');for(let i=0;i<120;i++)h.step();const a=h.inspect();h.context.scrollY=3300;h.dispatch('scroll');for(let i=0;i<120;i++)h.step();const b=h.inspect();return{pass:b.time===a.time&&b.p===.5&&b.paused&&h.rafs.size===0};});
check('Resize requests coalesce and preserve journey progress',h=>{start(h);const a=h.inspect();h.elements.get('stage').offsetWidth=650;h.context.innerHeight=800;h.context.document.documentElement.scrollHeight=5040;h.runtime.queueResize();h.runtime.queueResize();h.runtime.queueResize();h.step();const b=h.inspect();return{pass:h.getStats().trackBuilds===1&&Math.abs(h.context.scrollY-b.target*4240)<1e-7&&b.target>=a.target,trackBuilds:h.getStats().trackBuilds};});
check('Offscreen stage pauses and resumes without catch-up',h=>{start(h);h.intersect(false);const a=h.inspect();h.step(20000);const b=h.inspect();h.intersect(true);h.step();const c=h.inspect();return{pass:b.p===a.p&&!b.inView&&c.inView&&c.target-a.target<.001};});
check('Back-forward cache suspension preserves journey',h=>{start(h);h.dispatch('pagehide','root',{persisted:true});const a=h.inspect();h.step(20000);h.dispatch('pageshow');h.step();const b=h.inspect();return{pass:a.alive&&b.watching&&b.target-a.target<.001&&b.target>a.target};});
check('Context loss prevents rendering and leaves restore listener available',h=>{start(h);let prevented=false;h.dispatch('webglcontextlost','canvas',{preventDefault(){prevented=true;}});const a=h.inspect();h.step(20000);const b=h.inspect();return{pass:prevented&&!a.ready&&h.rafs.size===0&&a.frames===b.frames};});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function checkAsync(name,fn){const h=harness({ready:false});try{const detail=await fn(h);report.push({name,pass:detail.pass,...detail});}catch(e){report.push({name,pass:false,error:String(e)});}}
(async()=>{
 await checkAsync('Context restoration rebuilds resources and resumes playback',async h=>{await h.runtime.initialize();start(h);h.dispatch('webglcontextlost','canvas',{preventDefault(){}});h.dispatch('webglcontextrestored','canvas');await flush();h.step();return{pass:h.inspect().ready&&h.inspect().watching&&h.getStats().initialized===2&&h.classes.has('ready'),initialized:h.getStats().initialized};});
 await checkAsync('Permanent page exit disposes all card and effects resources and blocks reawakening',async h=>{await h.runtime.initialize();start(h);h.runtime.queueResize();h.dispatch('pagehide','root',{persisted:false});h.dispatch('pageshow');h.step();return{pass:!h.inspect().alive&&h.rafs.size===0&&h.getStats().deleted===expectedDeletions&&h.observers[0].disconnected,deleted:h.getStats().deleted,expectedDeletions};});
 await checkAsync('Initialization completion after disposal cannot revive renderer',async h=>{const pending=[];h.context.load=src=>new Promise(resolve=>pending.push(()=>resolve({src})));const init=h.runtime.initialize();h.dispatch('pagehide','root',{persisted:false});pending.forEach(f=>f());await init;return{pass:!h.inspect().alive&&h.getStats().initialized===0&&h.rafs.size===0};});
 await checkAsync('Only latest asynchronous initialization installs resources',async h=>{const pending=[];h.context.load=src=>new Promise(resolve=>pending.push(()=>resolve({src})));const first=h.runtime.initialize(),second=h.runtime.initialize();pending.forEach(f=>f());await Promise.all([first,second]);return{pass:h.getStats().initialized===1&&h.inspect().ready,initialized:h.getStats().initialized};});
 await checkAsync('Unavailable WebGL shows static fallback without a running journey',async h=>{h.elements.get('canvas').getContext=()=>null;await h.runtime.initialize();h.step();return{pass:!h.inspect().ready&&!h.inspect().watching&&h.rafs.size===0&&h.classes.has('fallback')&&h.classes.has('quiet')&&h.elements.get('closing').inert===false};});
 await checkAsync('Preference changes cannot revive controls after failed initialization',async h=>{h.elements.get('canvas').getContext=()=>null;await h.runtime.initialize();h.reduce(true);h.step();h.reduce(false);h.step();return{pass:h.classes.has('quiet')&&!h.inspect().ready&&h.rafs.size===0};});
 await checkAsync('Successful initialization after failure clears fallback presentation',async h=>{const get=h.elements.get('canvas').getContext;h.elements.get('canvas').getContext=()=>null;await h.runtime.initialize();h.elements.get('canvas').getContext=get;await h.runtime.initialize();return{pass:h.inspect().ready&&!h.classes.has('fallback')&&!h.classes.has('quiet')&&!h.elements.get('motion').hidden};});
 await checkAsync('A failure in the first draw leaves the fallback poster visible',async h=>{h.context.failDraw=true;await h.runtime.initialize();return{pass:!h.inspect().ready&&h.classes.has('fallback')&&!h.classes.has('ready')&&h.rafs.size===0};});
 const result={source:'work/hero-v9/hero.js',sourceSHA256,journeySeconds,hasMagic,scope:'Actual runtime, event and initialization code with mocked DOM, RAF, image loading, effects allocation and GPU allocation. Rendering and browser layout are outside this test.',passed:report.filter(r=>r.pass).length,total:report.length,tests:report};
 fs.writeFileSync(path.join(__dirname,'runtime-controls-report.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 process.exitCode=report.some(r=>!r.pass)?1:0;
})();
