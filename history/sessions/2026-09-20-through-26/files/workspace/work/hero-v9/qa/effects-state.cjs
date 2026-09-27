'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../hero.js'),'utf8');
const sourceSHA256=crypto.createHash('sha256').update(source).digest('hex');
const math=source.slice(source.indexOf('const clamp='),source.indexOf('const vert='));
const scene=source.slice(source.indexOf('function sceneFrame('),source.indexOf('// BEGIN CARD LIGHT PASS'));
const effects=source.slice(source.indexOf('// BEGIN CARD LIGHT PASS'),source.indexOf('// END CARD LIGHT PASS'));
if(!math||!scene||!effects)throw Error('Inline effects sections unavailable');
function harness(width=1440,height=1000,failure=''){
 let id=0,uploads=0,draws=0,maxVertices=0,uploaded=null,deletedPrograms=0,deletedBuffers=0,programCreated=0,bufferCreated=0;
 const attrs=new Map(),enabled=new Set(),caps=new Set(),resources=new Set(),mainProgram={main:true},mainBuffer={main:true},mainIndex={main:true};
 const state={program:mainProgram,array:mainBuffer,index:mainIndex,depthWrite:true,depthFunction:'LEQUAL',blend:null};
 const gl={};
 for(const name of ['VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','ARRAY_BUFFER','ELEMENT_ARRAY_BUFFER','DYNAMIC_DRAW','FLOAT','BLEND','DEPTH_TEST','LEQUAL','CULL_FACE','SRC_ALPHA','ONE','TRIANGLES'])gl[name]=name;
 Object.assign(gl,{
  createProgram(){const p={id:++id,kind:'program'};programCreated++;resources.add(p);return p;},createShader(){const s={id:++id,kind:'shader'};resources.add(s);return s;},shaderSource(){},compileShader(){},getShaderParameter(){return failure!=='compile';},getShaderInfoLog(){return 'injected compile failure';},attachShader(){},linkProgram(){},getProgramParameter(){return failure!=='link';},getProgramInfoLog(){return 'injected link failure';},
  createBuffer(){if(failure==='buffer')return null;const b={id:++id,kind:'buffer'};bufferCreated++;resources.add(b);return b;},deleteShader(s){resources.delete(s);},deleteProgram(p){if(resources.delete(p))deletedPrograms++;},deleteBuffer(b){if(resources.delete(b))deletedBuffers++;},
  getAttribLocation(p,n){return (p===mainProgram?{aPos:0,aNormal:1,aUV:2}:{aPosition:0,aLightUV:1,aLightColor:2,aKind:3})[n]??-1;},getUniformLocation(){return {};},
  bindBuffer(target,b){state[target==='ARRAY_BUFFER'?'array':'index']=b;},bufferData(target,n){if(target!=='ARRAY_BUFFER'||typeof n!=='number')throw Error('Unexpected effects allocation');},
  bufferSubData(target,offset,data){if(target!=='ARRAY_BUFFER'||offset!==0)throw Error('Unexpected effects upload');if(!Array.from(data).every(Number.isFinite))throw Error('Nonfinite light geometry');uploads++;uploaded=new Float32Array(data);},
  useProgram(p){state.program=p;},enableVertexAttribArray(loc){enabled.add(loc);},disableVertexAttribArray(loc){enabled.delete(loc);},vertexAttribPointer(loc,size,type,normal,stride,offset){attrs.set(loc,{buffer:state.array,size,stride,offset});},
  depthMask(v){state.depthWrite=v;},enable(v){caps.add(v);},disable(v){caps.delete(v);},depthFunc(v){state.depthFunction=v;},blendFunc(a,b){state.blend=[a,b];},
  uniformMatrix4fv(loc,transpose,m){if(m.length!==16||!Array.from(m).every(Number.isFinite))throw Error('Invalid light view projection');},
  drawArrays(mode,start,count){if(mode!=='TRIANGLES'||start!==0||count*10!==uploaded.length)throw Error('Invalid light draw range');if(state.depthWrite||!caps.has('DEPTH_TEST')||!caps.has('BLEND')||state.blend.join(',')!=='SRC_ALPHA,ONE')throw Error('Invalid additive light state');if(enabled.size!==4)throw Error('Missing light attribute');draws++;maxVertices=Math.max(maxVertices,count);},
 });
 const context={Math,Float32Array,Map,URLSearchParams,location:{search:'',hash:''},matchMedia:()=>({matches:false}),stage:{offsetWidth:width},glMock:gl,mainProgram,mainBuffer,mainIndex};
 vm.createContext(context);
 vm.runInContext(`${math}\n${scene}\n${effects}\ngl=glMock;program=mainProgram;buf=mainBuffer;indexBuf=mainIndex;w=${width};h=${height};makeTracks();
 globalThis.api={initializeMagic,disposeMagic,
 draw(progress,opts={}){quiet=!!opts.quiet;freezeTime=!!opts.freeze;time=opts.time??12;const c=cameraPose(progress),s=sceneFrame(progress),previousProgress=clamp(progress-.008),previousScene=sceneFrame(previousProgress);const layers=ribbon(progress).map((pose,index)=>({index,matrix:mul(s,pose.matrix)}));const previous=ribbon(previousProgress).map((pose,index)=>({index,matrix:mul(previousScene,pose.matrix)}));drawMagic(progress,c,layers,previous);},
 empty(){drawMagic(.5,cameraPose(.5),[],[]);},
 inspect:()=>({active:!!magic,capacity:magic?.data.length,used:magic?.used,quads:magic?.quads,diagnostics:{...diagnostics},cards:COUNT})};`,context);
 function restored(){return state.program===mainProgram&&state.array===mainBuffer&&state.index===mainIndex&&state.depthWrite&&!caps.has('BLEND')&&caps.has('DEPTH_TEST')&&!caps.has('CULL_FACE')&&state.depthFunction==='LEQUAL'&&[...enabled].sort().join(',')==='0,1,2'&&[[0,3,0],[1,3,12],[2,2,24]].every(([loc,size,offset])=>{const a=attrs.get(loc);return a?.buffer===mainBuffer&&a.size===size&&a.stride===32&&a.offset===offset;});}
 return {api:context.api,restored,getUpload:()=>uploaded,stats:()=>({uploads,draws,maxVertices,deletedPrograms,deletedBuffers,programCreated,bufferCreated,liveResources:resources.size})};
}
const tests=[];
function check(name,fn){try{const detail=fn();tests.push({name,...detail});}catch(e){tests.push({name,pass:false,error:String(e)});}}
check('Initialization restores card program, buffers, attributes and depth state',()=>{const h=harness();return{pass:h.api.initializeMagic()&&h.restored(),stats:h.stats()};});
check('Desktop and mobile paths upload finite bounded geometry with restored state',()=>{let draws=0,maxQuads=0;for(const [w,hg]of[[1440,1000],[375,667],[844,390]]){const h=harness(w,hg);h.api.initializeMagic();for(let i=0;i<=100;i++){h.api.draw(i/100);const a=h.api.inspect();if(!h.restored()||a.used>a.capacity||a.used!==a.quads*60)throw Error(`Bad state at ${w}×${hg}, ${i/100}`);maxQuads=Math.max(maxQuads,a.quads);}draws+=h.stats().draws;}return{pass:true,draws,maxQuads,quadCapacity:1100};});
check('Frozen diagnostic lighting is deterministic regardless of ambient clock',()=>{const h=harness();h.api.initializeMagic();h.api.draw(.52,{freeze:true,time:12});const a=h.getUpload();h.api.draw(.52,{freeze:true,time:37});const b=h.getUpload();return{pass:a.length===b.length&&a.every((v,i)=>v===b[i])};});
check('Reduced motion suppresses motes/trails and remains stable',()=>{const h=harness();h.api.initializeMagic();h.api.draw(1,{quiet:true,time:2});const a=h.getUpload(),s=h.api.inspect();h.api.draw(1,{quiet:true,time:20});const b=h.getUpload();const kinds=Array.from(a).filter((_,i)=>i%10===9);return{pass:s.quads===s.cards*20&&kinds.every(k=>k===0||k===3)&&a.length===b.length&&a.every((v,i)=>v===b[i])&&h.restored(),quads:s.quads,cards:s.cards};});
check('Empty visible set does not issue a light draw',()=>{const h=harness();h.api.initializeMagic();h.api.empty();return{pass:h.stats().draws===0&&h.api.inspect().diagnostics.magicQuads===0&&h.restored()};});
check('Disposal releases effect buffer and program exactly once',()=>{const h=harness();h.api.initializeMagic();h.api.disposeMagic();h.api.disposeMagic();const s=h.stats();return{pass:!h.api.inspect().active&&s.deletedPrograms===1&&s.deletedBuffers===1&&s.liveResources===0,stats:s};});
check('Reinitialization replaces prior effect resources without accumulating them',()=>{const h=harness();h.api.initializeMagic();h.api.initializeMagic();const s=h.stats();return{pass:s.programCreated===2&&s.bufferCreated===2&&s.deletedPrograms===1&&s.deletedBuffers===1&&s.liveResources===2&&h.restored(),stats:s};});
for(const failure of ['compile','link','buffer'])check(`Effects ${failure} failure cleans partial resources and returns false`,()=>{const h=harness(1440,1000,failure),result=h.api.initializeMagic();return{pass:result===false&&!h.api.inspect().active&&h.stats().liveResources===0&&!!h.api.inspect().diagnostics.magicFailure,stats:h.stats()};});
const report={source:'work/hero-v9/hero.js',sourceSHA256,scope:'Real inline light pass and choreography mathematics against a strict mock GL state. GPU compilation and visual appearance are not tested.',passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
fs.writeFileSync(path.join(__dirname,'effects-state-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exitCode=tests.some(t=>!t.pass)?1:0;
