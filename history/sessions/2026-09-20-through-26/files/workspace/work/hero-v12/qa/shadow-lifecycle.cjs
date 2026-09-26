'use strict';
// Executes actual optional shadow helpers with a stateful GL mock. Confirms
// resource ownership and render-pass isolation, not visual shadow quality.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const makeMockGL=require('./mock-webgl.cjs');
const source=fs.readFileSync(path.join(__dirname,'../hero.js'),'utf8');
const math=source.slice(source.indexOf('function mul('),source.indexOf('// One shared, optional shadow pass.'));
const helpers=source.slice(source.indexOf('let shadowState='),source.indexOf('function cameraPose('));
const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function harness(options={}){
 const gpu=makeMockGL(options),main={program:{id:'main'},buf:{id:'mesh'},indexBuf:{id:'indices'},back:{id:'back'}};
 const context={console,Float32Array,Math,...main,gl:gpu.gl,canvas:{width:1440,height:1000},mobile:!!options.mobile,meshCount:1440,diagnostics:{},clamp:(x,a=0,b=1)=>Math.max(a,Math.min(b,x))};
 vm.createContext(context);vm.runInContext(`${math}\n${helpers}\nglobalThis.testAPI={initializeShadows,renderShadows,disposeShadows,shadowBindings};`,context);
 return {gpu,main,context,...context.testAPI};
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),report=[];
function test(name,fn){try{const result=fn();report.push({name,...result});}catch(error){report.push({name,pass:false,error:String(error)});}}
const createLayers=n=>Array.from({length:n},()=>({matrix:identity}));
test('Initialization restores previously bound program, framebuffer, renderbuffer, active unit and unit-three texture',()=>{
 const h=harness(),{gl,state}=h.gpu;state.program=h.main.program;state.framebuffer={id:'previous-framebuffer'};state.renderbuffer={id:'previous-renderbuffer'};state.textures[gl.TEXTURE3]={id:'previous-unit3-texture'};state.active=gl.TEXTURE2;
 const before=[state.program,state.framebuffer,state.renderbuffer,state.textures[gl.TEXTURE3],state.active];const ok=h.initializeShadows();
 return {pass:ok&&before.every((x,i)=>x===[state.program,state.framebuffer,state.renderbuffer,state.textures[gl.TEXTURE3],state.active][i])&&h.shadowBindings().size===1024,size:h.shadowBindings().size};
});
test('Phone allocates the smaller 512 square shadow target',()=>{const h=harness({mobile:true});return {pass:h.initializeShadows()&&h.shadowBindings().size===512,size:h.shadowBindings().size};});
test('Each world layer is drawn once into a shared target with dithering disabled',()=>{const h=harness();h.initializeShadows();const count=h.renderShadows(createLayers(13));return {pass:count===13&&h.gpu.draws.length===13&&h.gpu.draws.every(x=>x.framebuffer?.type==='Framebuffer'&&!x.dither&&equal(x.viewport,[0,0,1024,1024])),count};});
test('Shadow pass restores main framebuffer, program, vertex buffers, viewport and fixed raster state',()=>{
 const h=harness(),{gl,state,vertexPointers}=h.gpu;h.initializeShadows();h.renderShadows(createLayers(13));
 const pass=state.framebuffer===null&&state.program===h.main.program&&state.buffers[gl.ARRAY_BUFFER]===h.main.buf&&state.buffers[gl.ELEMENT_ARRAY_BUFFER]===h.main.indexBuf&&equal(state.viewport,[0,0,1440,1000])&&state.enabled.has(gl.DEPTH_TEST)&&state.enabled.has(gl.DITHER)&&![gl.BLEND,gl.CULL_FACE,gl.SCISSOR_TEST,gl.POLYGON_OFFSET_FILL].some(x=>state.enabled.has(x))&&state.depthFunc===gl.LEQUAL&&state.depthMask&&equal(state.colorMask,[true,true,true,true])&&equal(state.clearColor,[0,0,0,0])&&state.clearDepth===1&&vertexPointers.length===0;
 return {pass};
});
test('Incomplete framebuffer discards optional resources and returns the existing back as a valid sampler',()=>{const h=harness({failFramebuffer:true});const ok=h.initializeShadows(),binding=h.shadowBindings(),retained=h.gpu.resources.filter(x=>!h.gpu.deletes.includes(x));return{pass:!ok&&binding.enabled===0&&binding.texture===h.main.back&&retained.length===0&&h.context.diagnostics.shadowFailure.includes('incomplete'),retained:retained.length};});
test('Unsupported fragment high precision disables shadows before allocating resources',()=>{const h=harness({highPrecision:false});return{pass:!h.initializeShadows()&&h.gpu.resources.length===0&&h.shadowBindings().enabled===0};});
test('Failed shader compilation deletes program and temporary shader',()=>{const h=harness({failCompile:true});const ok=h.initializeShadows();return{pass:!ok&&h.gpu.resources.every(x=>h.gpu.deletes.includes(x))&&h.context.diagnostics.shadowFailure.includes('compile')};});
test('Failed program linking deletes the program and both temporary shaders',()=>{const h=harness({failLink:true});const ok=h.initializeShadows();return{pass:!ok&&h.gpu.resources.every(x=>h.gpu.deletes.includes(x))&&h.context.diagnostics.shadowFailure.includes('link')};});
test('Partial framebuffer allocation failure releases every resource that was allocated',()=>{const h=harness({failCreateFramebuffer:true});const ok=h.initializeShadows();return{pass:!ok&&h.gpu.resources.every(x=>h.gpu.deletes.includes(x))};});
test('Drawing failure releases optional resources and still restores the main pass',()=>{const h=harness();h.initializeShadows();h.gpu.options.failDraw=true;const count=h.renderShadows(createLayers(1)),{state,gl}=h.gpu;return{pass:count===0&&h.shadowBindings().enabled===0&&h.gpu.resources.every(x=>h.gpu.deletes.includes(x))&&state.framebuffer===null&&state.program===h.main.program&&state.enabled.has(gl.DITHER)&&equal(state.viewport,[0,0,1440,1000])};});
test('Disposal is idempotent and releases exactly four long-lived shadow resources',()=>{const h=harness();h.initializeShadows();const before=h.gpu.deletes.length;h.disposeShadows();const after=h.gpu.deletes.length;h.disposeShadows();return{pass:after-before===4&&h.gpu.deletes.length===after&&h.shadowBindings().enabled===0,deletedLongLived:after-before};});
test('Reinitialization replaces existing shadow ownership without leaking old objects',()=>{const h=harness();h.initializeShadows();const old=h.gpu.resources.slice();h.initializeShadows();const live=h.gpu.resources.filter(x=>!h.gpu.deletes.includes(x));return{pass:old.every(x=>h.gpu.deletes.includes(x))&&live.length===4&&h.shadowBindings().enabled===1,live:live.length};});
const result={source:'work/hero-v12/hero.js',sourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),scope:'Actual optional shadow helper code in Node VM using stateful mocked WebGL. Verifies resource ownership, binding/state restoration, fallback paths and draw submission. Does not compile GLSL or rasterize; browser visual review is required.',passed:report.filter(x=>x.pass).length,total:report.length,tests:report};
fs.writeFileSync(path.join(__dirname,'shadow-lifecycle-report.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));process.exitCode=report.some(x=>!x.pass)?1:0;
