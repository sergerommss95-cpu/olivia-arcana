'use strict';
// Pure arithmetic audit: no DOM, browser, renderer, or hero source mutations.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const sourcePath = path.resolve(process.argv[2] || path.join(__dirname, 'hero.js'));
const outputPath = path.resolve(process.argv[3] || path.join(__dirname, path.basename(sourcePath)==='hero.js'?'validation.json':`validation-${path.basename(sourcePath,'.js')}.json`));
const steps = Number(process.argv[4] || 1000);
const auditState=process.argv[5]||'still';
const auditTime=auditState==='positive'?Math.PI/(2*.34):auditState==='negative'?3*Math.PI/(2*.34):0;
const auditPointer=auditState==='positive'?[1,-1]:auditState==='negative'?[-1,1]:[0,0];
const source = fs.readFileSync(sourcePath, 'utf8');
const begin = source.indexOf('function mul(');
const end = source.indexOf('const vert=');
if (begin < 0 || end <= begin) throw Error('Could not locate pure motion functions');
const context = vm.createContext({ Math, Float32Array });
vm.runInContext(`
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const order=[19,17,2,21,0,1,3,6,8,9,11,14,20,18];
let w=1,h=1,tracks=[],quiet=${auditState==='still'},freezeTime=${auditState==='still'},time=${auditTime},ptr=${JSON.stringify(auditPointer)};
const diagnostics={};
${source.slice(begin, end)}
globalThis.motionNumeric={
  init(width,height){w=width;h=height;makeTracks();},
  sample(progress){return {poses:ribbon(progress),diagnostics:diagnostics.clearance};},
  constants(){return {width:CARD_W,height:CARD_H,thickness:CARD_T,count:COUNT};},
  rail(){return typeof rail==='undefined'?null:rail;}
};`, context, { timeout: 5000 });
const motion = context.motionNumeric;
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const clean = n => Number(n.toFixed(7));
const tolerance = 1e-6;
function box(pose, dimensions) {
  const m=pose.matrix, columns=[[m[0],m[1],m[2]],[m[4],m[5],m[6]],[m[8],m[9],m[10]]];
  const lengths=columns.map(norm);
  return {centre:[m[12],m[13],m[14]],axes:columns.map((v,i)=>v.map(x=>x/lengths[i])),
    half:[dimensions.width/2,dimensions.height/2,dimensions.thickness/2].map((v,i)=>v*lengths[i]),pose};
}
function sat(a,b) {
  const delta=sub(b.centre,a.centre), axes=[...a.axes,...b.axes];
  for(const u of a.axes)for(const v of b.axes)axes.push(cross(u,v));
  let penetration=Infinity, nearestAxis;
  for(let axis of axes){const len=norm(axis);if(len<1e-8)continue;axis=axis.map(x=>x/len);
    const radius=box=>box.axes.reduce((s,v,i)=>s+Math.abs(dot(v,axis))*box.half[i],0);
    const overlap=radius(a)+radius(b)-Math.abs(dot(delta,axis));
    if(overlap < -tolerance)return {overlap:false};
    if(overlap<penetration){penetration=overlap;nearestAxis=axis;}
  }
  return {overlap:penetration>tolerance,touch:penetration<=tolerance,penetration,axis:nearestAxis};
}
function corners(box) {
  const out=[];
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])
    out.push(box.centre.map((v,j)=>v+x*box.axes[0][j]*box.half[0]+y*box.axes[1][j]*box.half[1]+z*box.axes[2][j]*box.half[2]));
  return out;
}
// Intersect the actual zero-thickness face planes, clip their common line to
// both rectangles, then apply the fragment shader's rounded-face predicate.
// A returned witness proves a visible face crossing, not just an OBB overlap.
function faceWitness(a,b){
  const na=a.axes[2],nb=b.axes[2],line=cross(na,nb),length2=dot(line,line);
  if(length2<1e-12)return null;
  const da=dot(na,a.centre),db=dot(nb,b.centre),ca=cross(nb,line),cb=cross(line,na);
  const point=ca.map((v,i)=>(v*da+cb[i]*db)/length2);let lo=-Infinity,hi=Infinity;
  for(const box of [a,b])for(let j=0;j<2;j++){
    const origin=dot(sub(point,box.centre),box.axes[j]),direction=dot(line,box.axes[j]),limit=box.half[j];
    if(Math.abs(direction)<1e-12){if(Math.abs(origin)>limit)return null;continue;}
    const t0=(-limit-origin)/direction,t1=(limit-origin)/direction;
    lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));if(hi<=lo)return null;
  }
  const withinFace=(box,p)=>{
    const relative=sub(p,box.centre),u=dot(relative,box.axes[0])/(2*box.half[0])+.5,v=dot(relative,box.axes[1])/(2*box.half[1])+.5;
    const x=Math.abs(u-.5)-.475,y=Math.abs(v-.5)-.485;
    return Math.hypot(Math.max(x,0),Math.max(y,0))+Math.min(Math.max(x,y),0)-.019 < -1e-7;
  };
  for(const f of [.5,.25,.75,.125,.875]){const p=point.map((v,i)=>v+line[i]*(lo+(hi-lo)*f));if(withinFace(a,p)&&withinFace(b,p))return p;}
  return null;
}
function project(v,w,h){const distance=10.4-v[2],tan=Math.tan(19*Math.PI/180);
  return [(0.5+v[0]/(2*tan*distance*w/h))*w,(0.5-v[1]/(2*tan*distance))*h,distance];
}
function phase(pose,length){return pose.d<=0?'starting-packet':pose.d>=length?'arrival-packet':'flight';}
function rootFor(card,distance){let lo=0,hi=1;for(let i=0;i<44;i++){const mid=(lo+hi)/2;if(motion.sample(mid).poses[card].d<distance)lo=mid;else hi=mid;}return (lo+hi)/2;}
function centreDerivative(card,t,epsilon,w,h){
  const screen=p=>project(motion.sample(p).poses[card].matrix.slice(12,15),w,h).slice(0,2);
  const a=screen(t-epsilon),b=screen(t),c=screen(t+epsilon);
  const before=sub([b[0],b[1],0],[a[0],a[1],0]).map(x=>x/epsilon);
  const after=sub([c[0],c[1],0],[b[0],b[1],0]).map(x=>x/epsilon);
  return {beforeSpeedPxPerProgress:norm(before),afterSpeedPxPerProgress:norm(after),velocityDeltaPxPerProgress:norm(sub(after,before))};
}
const report={source:path.relative(process.cwd(),sourcePath),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
  generatedAt:new Date().toISOString(),method:{progressStep:1/steps,samplesPerViewport:steps+1,
    collision:'15-axis OBB SAT using full rectangular cards and CARD_T thickness. Penetration >1e-6 world units counts as intersection; near-zero contact is reported separately. No packet overlap is automatically excused.',
    bounds:'Projects every OBB corner with the source 38-degree vertical FOV and camera z=10.4. Nav/footer bands are conservative candidate conflicts, not measured DOM text overlaps.',
    continuity:'Finite samples plus one-sided projected centre derivatives at rail entry/exit and polyline knots. Sampling cannot prove absence of all intersections.',
    state:{mode:auditState,time:auditTime,pointer:auditPointer,ambient:auditState!=='still'}},viewports:[]};
for(const [w,h] of [[1440,1000],[1280,720],[800,900],[390,844],[320,568],[844,390],[640,360],[1024,768]]){
  motion.init(w,h);const dimensions=motion.constants(),first=motion.sample(0),length=first.diagnostics.railLength;
  const landscape=w/h>=1.4&&h<=600,headerBottom=w<=600?60:landscape?54:70,footerTop=h-(w<=600?18:landscape?10:26)-36;
  const result={viewport:[w,h],cards:dimensions.count,railLength:clean(length),finiteFailures:[],pairTests:0,intersectionSamples:0,confirmedFaceCrossingSamples:0,touchSamples:0,
    collisions:[],viewportClipping:[],navigationBandCandidates:[],footerBandCandidates:[],projectedEnvelope:{left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity},
    categorizedWorst:{},continuity:{largestConsecutiveCornerDisplacementPx:0,entryExit:[],largestPolylineVelocityChange:null}};
  const collisionMap=new Map(),clipMap=new Map(),navMap=new Map(),footerMap=new Map();let previous=null;
  function aggregate(map,key,record,severity){let item=map.get(key);if(!item){item={...record,firstProgress:record.progress,lastProgress:record.progress,samples:0,worst:severity,worstProgress:record.progress};map.set(key,item);}item.lastProgress=record.progress;item.samples++;if(severity>item.worst){item.worst=severity;item.worstProgress=record.progress;}}
  for(let step=0;step<=steps;step++){
    const progress=step/steps,sample=motion.sample(progress),poses=sample.poses,boxes=poses.map(p=>box(p,dimensions));
    const projected=boxes.map(b=>corners(b).map(v=>project(v,w,h)));
    for(let i=0;i<poses.length;i++){
      if(!Array.from(poses[i].matrix).every(Number.isFinite)){result.finiteFailures.push({progress,card:i});continue;}
      const points=projected[i],xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
      const bounds={left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
      for(const key of ['left','top'])result.projectedEnvelope[key]=Math.min(result.projectedEnvelope[key],bounds[key]);
      for(const key of ['right','bottom'])result.projectedEnvelope[key]=Math.max(result.projectedEnvelope[key],bounds[key]);
      const clip=Math.max(0,-bounds.left,bounds.right-w,-bounds.top,bounds.bottom-h);
      if(clip>.5)aggregate(clipMap,i,{progress,card:i,id:poses[i].id},clip);
      if(headerBottom-bounds.top>2)aggregate(navMap,i,{progress,card:i,id:poses[i].id},headerBottom-bounds.top);
      if(bounds.bottom-footerTop>2)aggregate(footerMap,i,{progress,card:i,id:poses[i].id},bounds.bottom-footerTop);
      if(previous)for(let j=0;j<points.length;j++)result.continuity.largestConsecutiveCornerDisplacementPx=Math.max(result.continuity.largestConsecutiveCornerDisplacementPx,Math.hypot(points[j][0]-previous[i][j][0],points[j][1]-previous[i][j][1]));
    }
    for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
      result.pairTests++;const test=sat(boxes[a],boxes[b]);if(test.touch)result.touchSamples++;
      if(test.overlap){
        result.intersectionSamples++;const witness=faceWitness(boxes[a],boxes[b]);if(witness)result.confirmedFaceCrossingSamples++;
        const u=[poses[a].u,poses[b].u],depart=u.some(x=>x<.12),arrive=u.some(x=>x>.88);
        const category=depart?(arrive?'departure-arrival':'departure'):arrive?'arrival':'midflight';
        const detail={progress,pair:[a,b],ids:[poses[a].id,poses[b].id],u,penetration:test.penetration,
          centres:[boxes[a].centre,boxes[b].centre],dimensions:[boxes[a].half.map(x=>x*2),boxes[b].half.map(x=>x*2)],
          axes:[boxes[a].axes,boxes[b].axes],faceCrossingWitness:witness};
        if(!result.categorizedWorst[category]||test.penetration>result.categorizedWorst[category].penetration)result.categorizedWorst[category]=detail;
        aggregate(collisionMap,`${a}-${b}`,{progress,pair:[a,b],ids:[poses[a].id,poses[b].id],initialPhases:[phase(poses[a],length),phase(poses[b],length)]},test.penetration);
      }
    }
    previous=projected;
  }
  result.collisions=[...collisionMap.values()].sort((a,b)=>b.worst-a.worst);
  result.viewportClipping=[...clipMap.values()];result.navigationBandCandidates=[...navMap.values()];result.footerBandCandidates=[...footerMap.values()];
  for(let i=0;i<dimensions.count;i++)for(const [event,distance] of [['release',0],['arrival',length]]){
    const t=rootFor(i,distance);if(t<=.0001||t>=.9999)continue;
    const derivative=centreDerivative(i,t,1e-5,w,h);
    result.continuity.entryExit.push({card:i,event,progress:clean(t),...Object.fromEntries(Object.entries(derivative).map(([k,v])=>[k,clean(v)]))});
  }
  const rail=motion.rail();
  if(rail){let largest=null;for(let j=1;j<rail.length-1;j++){
    const t=rootFor(0,rail[j].d);const derivative=centreDerivative(0,t,1e-5,w,h);
    if(!largest||derivative.velocityDeltaPxPerProgress>largest.velocityDeltaPxPerProgress)largest={railKnot:j,progress:clean(t),...derivative};
  }result.continuity.largestPolylineVelocityChange=largest;}
  report.viewports.push(result);
  console.log(JSON.stringify({viewport:[w,h],pairs:result.pairTests,intersections:result.intersectionSamples,firstCollision:result.collisions.slice().sort((a,b)=>a.firstProgress-b.firstProgress)[0]||null,worstCollision:result.collisions[0]||null,clipping:result.viewportClipping,nav:result.navigationBandCandidates,footer:result.footerBandCandidates}));
}
report.summary={finite:report.viewports.every(v=>v.finiteFailures.length===0),pairTests:report.viewports.reduce((s,v)=>s+v.pairTests,0),intersectionSamples:report.viewports.reduce((s,v)=>s+v.intersectionSamples,0),
  confirmedFaceCrossingSamples:report.viewports.reduce((s,v)=>s+v.confirmedFaceCrossingSamples,0),
  clippedViewports:report.viewports.filter(v=>v.viewportClipping.length).map(v=>v.viewport),
  passingSeparation:report.viewports.every(v=>v.intersectionSamples===0)};
fs.writeFileSync(outputPath,JSON.stringify(report,(key,value)=>typeof value==='number'&&Number.isFinite(value)?clean(value):value,2)+'\n');
console.log(JSON.stringify(report.summary));
