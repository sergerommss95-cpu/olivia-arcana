'use strict';
// Arithmetic-only audit. Reads hero.js but never starts its DOM or renderer.
// Usage: node check-choreography.cjs [source] [report] [steps=1000] [still|corners]
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sourcePath=path.resolve(process.argv[2]||path.join(__dirname,'../hero.js'));
const outputPath=path.resolve(process.argv[3]||path.join(__dirname,'validation.json'));
const steps=Number(process.argv[4]||1000),mode=process.argv[5]||'still';
if(!Number.isInteger(steps)||steps<10)throw Error('steps must be an integer >= 10');
if(!['still','corners'].includes(mode))throw Error('mode must be still or corners');
const source=fs.readFileSync(sourcePath,'utf8'),begin=source.indexOf('function mul('),end=source.indexOf('const vert=');
if(begin<0||end<=begin)throw Error('Cannot locate arithmetic block');
const sceneBegin=source.indexOf('function sceneFrame('),sceneEnd=source.indexOf('\nfunction draw(',sceneBegin);
if(sceneBegin<0||sceneEnd<sceneBegin)throw Error('Cannot locate shared sceneFrame');
const context=vm.createContext({Math,Float32Array});
vm.runInContext(`const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
let w=1,h=1,tracks=[],quiet=true,freezeTime=true,time=0,ptr=[0,0];const diagnostics={};
${source.slice(begin,end)}
${source.slice(sceneBegin,sceneEnd)}
globalThis.audit={
 init(width,height){w=width;h=height;makeTracks();},
 state(s){quiet=s.quiet;freezeTime=s.quiet;time=s.time;ptr=s.pointer;},
 sample(p){const poses=ribbon(p),frame=sceneFrame(p);return poses.map((pose,i)=>({...pose,id:pose.id??i,matrix:mul(frame,pose.matrix)}));},
 dimensions(){return [CARD_W,CARD_H,CARD_T];}
};`,context,{timeout:5000});
const audit=context.audit,viewports=[[1440,1000],[1280,720],[800,900],[390,844],[320,568],[844,390],[640,360],[1024,768]];
const states=[{name:'still',quiet:true,time:0,pointer:[0,0]}];
if(mode==='corners')for(const time of [0,7,17,31,47,63,78])for(const pointer of [[-1,-1],[-1,1],[1,-1],[1,1]])states.push({name:`t${time}:${pointer}`,quiet:false,time,pointer});
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a);
const tolerance=1e-6;
function box(pose,dims){
 const m=pose.matrix,cols=[[m[0],m[1],m[2]],[m[4],m[5],m[6]],[m[8],m[9],m[10]]],lengths=cols.map(norm);
 if(m.length!==16||!Array.from(m).every(Number.isFinite)||lengths.some(x=>x<=1e-9))return {invalid:'non-finite matrix or degenerate scale'};
 const axes=cols.map((v,i)=>v.map(x=>x/lengths[i])),orthogonality=Math.max(Math.abs(dot(axes[0],axes[1])),Math.abs(dot(axes[0],axes[2])),Math.abs(dot(axes[1],axes[2])));
 if(orthogonality>1e-5)return {invalid:'matrix contains shear; OBB model is inapplicable',orthogonality};
 if(Math.max(Math.abs(m[3]),Math.abs(m[7]),Math.abs(m[11]),Math.abs(m[15]-1))>1e-6)return {invalid:'non-affine model matrix'};
 const det=dot(axes[0],cross(axes[1],axes[2]));
 if(det<.99999)return {invalid:'reflected or invalid rotation basis',det};
 return {id:pose.id,centre:Array.from(m.slice(12,15)),axes,half:dims.map((x,i)=>x*.5*lengths[i]),pose};
}
function corners(b){const out=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])out.push(b.centre.map((v,j)=>v+x*b.axes[0][j]*b.half[0]+y*b.axes[1][j]*b.half[1]+z*b.axes[2][j]*b.half[2]));return out;}
function sat(a,b){
 const delta=sub(b.centre,a.centre),axes=[...a.axes,...b.axes];for(const u of a.axes)for(const v of b.axes)axes.push(cross(u,v));
 let penetration=Infinity,nearest;
 for(let axis of axes){const len=norm(axis);if(len<1e-8)continue;axis=axis.map(x=>x/len);
  const radius=b=>b.axes.reduce((s,v,i)=>s+Math.abs(dot(v,axis))*b.half[i],0),overlap=radius(a)+radius(b)-Math.abs(dot(delta,axis));
  if(overlap < -tolerance)return {overlap:false};if(overlap<penetration){penetration=overlap;nearest=axis;}
 }return {overlap:penetration>tolerance,touch:penetration<=tolerance,penetration,axis:nearest};
}
// An exact plane/rectangle witness distinguishes a face crossing from a slab-only overlap.
// Rounded edge masks are deliberately not used to excuse rectangular slab penetrations.
function faceWitness(a,b){
 const na=a.axes[2],nb=b.axes[2],line=cross(na,nb),length2=dot(line,line);if(length2<1e-12)return null;
 const da=dot(na,a.centre),db=dot(nb,b.centre),ca=cross(nb,line),cb=cross(line,na),point=ca.map((v,i)=>(v*da+cb[i]*db)/length2);let lo=-Infinity,hi=Infinity;
 for(const box of [a,b])for(let j=0;j<2;j++){
  const origin=dot(sub(point,box.centre),box.axes[j]),direction=dot(line,box.axes[j]),limit=box.half[j];
  if(Math.abs(direction)<1e-12){if(Math.abs(origin)>limit)return null;continue;}
  const t0=(-limit-origin)/direction,t1=(limit-origin)/direction;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));if(hi<=lo)return null;
 }return point.map((v,i)=>v+line[i]*(lo+hi)/2);
}
function project(v,w,h){const distance=10.4-v[2],tan=Math.tan(19*Math.PI/180);return [(.5+v[0]/(2*tan*distance*w/h))*w,(.5-v[1]/(2*tan*distance))*h,distance];}
function angle(a,b){const r=a.axes.map(u=>b.axes.map(v=>dot(u,v))),c=Math.max(-1,Math.min(1,(r[0][0]+r[1][1]+r[2][2]-1)/2)),s=Math.hypot(r[2][1]-r[1][2],r[0][2]-r[2][0],r[1][0]-r[0][1])/2;return Math.atan2(s,c);}
function distance(a,b){const ac=corners(a),bc=corners(b);return Math.max(...ac.map((v,i)=>norm(sub(v,bc[i]))));}
function top(list,item,value,limit=8){list.push(item);list.sort((a,b)=>b[value]-a[value]);if(list.length>limit)list.pop();}
function aggregate(map,key,data,severity){let x=map.get(key);if(!x){x={...data,firstProgress:data.progress,lastProgress:data.progress,samples:0,worst:severity,worstDetail:data};map.set(key,x);}x.firstProgress=Math.min(x.firstProgress,data.progress);x.lastProgress=Math.max(x.lastProgress,data.progress);x.samples++;if(severity>x.worst){x.worst=severity;x.worstDetail=data;}}
function refineJump(interval,id,dims){
 let left=interval[0],right=interval[1];const read=p=>box(audit.sample(p).find(x=>x.id===id),dims);let a=read(left),b=read(right),initial=distance(a,b),last=initial;const levels=[];
 for(let k=0;k<8;k++){const middle=(left+right)/2,m=read(middle),d1=distance(a,m),d2=distance(m,b);if(d1>=d2){right=middle;b=m;last=d1;}else{left=middle;a=m;last=d2;}levels.push(last);}
 const ratios=levels.map((x,i)=>x/(i?levels[i-1]:initial));
 const unresolved=last>1e-4&&ratios.slice(-3).every(x=>x>.85);
 return {id,interval,refinedInterval:[left,right],initialCornerDelta:initial,finalCornerDelta:last,finalAngleRadians:angle(a,b),lastRatios:ratios.slice(-3),suspectedJump:unresolved};
}
const report={source:path.relative(process.cwd(),sourcePath),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),generatedAt:new Date().toISOString(),method:{steps,states,collision:'15-axis SAT on full rectangular prisms using CARD_W/H/T, with physical thickness; >1e-6 world penetration is counted, including packets.',bounds:'All corners after sceneFrame; camera z=10.4, vertical FOV 38 degrees. Header/footer bands are conservative geometry limits, not measured DOM text.',continuity:'Largest sampled corner displacements are refined eight times at fixed animation state. A persistent nonzero displacement is reported as suspected, not mathematically proven, discontinuity.',limits:'Finite sampling is not a proof of all-progress separation or continuity.'},viewports:[]};
for(const [w,h] of viewports){
 audit.init(w,h);const dims=audit.dimensions();if(!dims.every(x=>Number.isFinite(x)&&x>0))throw Error('Invalid card dimensions');
 const landscape=w/h>=1.4&&h<=600,header=w<=600?60:landscape?54:70,footer=h-(w<=600?18:landscape?10:26)-36;
 const r={viewport:[w,h],dimensions:dims,poseSamples:0,pairTests:0,intersectionSamples:0,faceCrossingSamples:0,touchSamples:0,finiteFailures:[],minimumMargins:{left:{margin:Infinity},right:{margin:Infinity},nav:{margin:Infinity},footer:{margin:Infinity}},collisions:[],boundsFailures:[],continuity:{largestSteps:[],refinement:[]}};
 const collisions=new Map(),boundsFailures=new Map();
 for(const state of states){
  audit.state(state);let previous=null;
  for(let step=0;step<=steps;step++){
   const p=step/steps,poses=audit.sample(p),boxes=poses.map(pose=>box(pose,dims));r.poseSamples+=poses.length;
   const ids=poses.map(x=>x.id);if(new Set(ids).size!==ids.length)throw Error('Pose ids must be unique for continuity tracking');
   for(let i=0;i<boxes.length;i++){
    const b=boxes[i],detail={progress:p,state:state.name,id:poses[i].id};if(b.invalid){if(r.finiteFailures.length<50)r.finiteFailures.push({...detail,...b});continue;}
    const screen=corners(b).map(v=>project(v,w,h));if(screen.some(v=>v[2]<=.5)){aggregate(boundsFailures,`near:${b.id}`,{...detail,type:'near-plane'},Math.max(...screen.map(v=>.5-v[2])));}
    const xs=screen.map(v=>v[0]),ys=screen.map(v=>v[1]),margins={left:Math.min(...xs),right:w-Math.max(...xs),nav:Math.min(...ys)-header,footer:footer-Math.max(...ys)};
    for(const [key,margin] of Object.entries(margins)){if(margin<r.minimumMargins[key].margin)r.minimumMargins[key]={margin,...detail};if(margin<0)aggregate(boundsFailures,`${key}:${b.id}`,{...detail,type:key,margin},-margin);}
    if(previous&&state.name==='still'&&previous.has(b.id)){const delta=distance(previous.get(b.id),b);top(r.continuity.largestSteps,{id:b.id,interval:[(step-1)/steps,p],cornerDelta:delta,angleRadians:angle(previous.get(b.id),b)},'cornerDelta');}
   }
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];if(a.invalid||b.invalid)continue;r.pairTests++;const hit=sat(a,b);if(hit.touch)r.touchSamples++;if(!hit.overlap)continue;r.intersectionSamples++;
    const witness=faceWitness(a,b);if(witness)r.faceCrossingSamples++;
    const detail={progress:p,state:state.name,pair:[a.id,b.id],indices:[i,j],penetration:hit.penetration,centres:[a.centre,b.centre],dimensions:[a.half.map(x=>2*x),b.half.map(x=>2*x)],axis:hit.axis,faceCrossingWitness:witness};
    aggregate(collisions,`${a.id}:${b.id}`,detail,hit.penetration);
   }
   previous=new Map(boxes.filter(b=>!b.invalid).map(b=>[b.id,b]));
  }
 }
 r.collisions=[...collisions.values()].sort((a,b)=>b.worst-a.worst);r.boundsFailures=[...boundsFailures.values()].sort((a,b)=>b.worst-a.worst);
 audit.state(states[0]);for(const item of r.continuity.largestSteps)r.continuity.refinement.push(refineJump(item.interval,item.id,dims));
 report.viewports.push(r);
 console.log(JSON.stringify({viewport:[w,h],pairs:r.pairTests,intersections:r.intersectionSamples,faceCrossings:r.faceCrossingSamples,worstCollision:r.collisions[0]||null,bounds:r.boundsFailures.map(x=>({type:x.type,id:x.id,worst:x.worst,progress:x.worstDetail.progress,state:x.worstDetail.state})),suspectedJumps:r.continuity.refinement.filter(x=>x.suspectedJump)}));
}
report.summary={finite:report.viewports.every(v=>!v.finiteFailures.length),pairTests:report.viewports.reduce((s,v)=>s+v.pairTests,0),intersectionSamples:report.viewports.reduce((s,v)=>s+v.intersectionSamples,0),faceCrossingSamples:report.viewports.reduce((s,v)=>s+v.faceCrossingSamples,0),passingBounds:report.viewports.every(v=>!v.boundsFailures.length),suspectedJumpCount:report.viewports.reduce((s,v)=>s+v.continuity.refinement.filter(x=>x.suspectedJump).length,0)};
report.summary.passingSeparation=report.summary.intersectionSamples===0;
fs.writeFileSync(outputPath,JSON.stringify(report,(key,v)=>typeof v==='number'&&Number.isFinite(v)?Number(v.toFixed(8)):v,2)+'\n');console.log(JSON.stringify(report.summary));
