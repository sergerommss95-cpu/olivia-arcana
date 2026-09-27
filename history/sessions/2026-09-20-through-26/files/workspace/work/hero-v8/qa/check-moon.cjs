'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const raw=fs.readFileSync(path.join(__dirname,'check-choreography.cjs'),'utf8');
const shim={argv:['node','checker',path.resolve(__dirname,'../hero.js'),'/tmp/unused.json','1000','still'],cwd:()=>process.cwd()};
const {audit,box,sat,faceWitness,pointDistance,source}=new Function('require','process','__dirname',raw.slice(0,raw.indexOf('const report='))+'return {audit,box,sat,faceWitness,pointDistance,source};')(require,shim,__dirname);
const report={sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),range:[.66,1],step:.0001,viewports:[]};
for(const [w,h] of [[1440,1000],[1280,720],[800,900],[390,844],[320,568],[844,390],[640,360],[1024,768]]){
 audit.init(w,h);audit.state({quiet:false,freezeTime:true,time:0,pointer:[0,0]});const dim=audit.dimensions(),map=new Map(),result={viewport:[w,h],pairTests:0,collisionSamples:0,minimumCameraClearance:{distance:Infinity},collisions:[]};
 for(let k=6600;k<=10000;k++){
  const p=k/10000,sample=audit.sample(p),boxes=sample.poses.map(x=>box(x,dim)),moon=boxes.at(-1),distance=pointDistance(sample.camera.eye,moon);
  if(distance<result.minimumCameraClearance.distance)result.minimumCameraClearance={distance,progress:p,eye:Array.from(sample.camera.eye),centre:moon.centre};
  for(let j=0;j<boxes.length-1;j++){
   result.pairTests++;const hit=sat(moon,boxes[j]);if(!hit.overlap)continue;result.collisionSamples++;const item=map.get(j)||{moonIndex:boxes.length-1,otherIndex:j,otherArt:boxes[j].id,ranges:[],worst:0};map.set(j,item);
   let range=item.ranges.at(-1);if(!range||p-range.end>.000101){range={start:p,end:p,face:false};item.ranges.push(range);}range.end=p;range.face ||= !!faceWitness(moon,boxes[j]);
   if(hit.penetration>item.worst){item.worst=hit.penetration;item.progress=p;item.centres=[moon.centre,boxes[j].centre];item.dimensions=[moon.half.map(x=>x*2),boxes[j].half.map(x=>x*2)];}
  }
 }
 result.collisions=[...map.values()].sort((a,b)=>b.worst-a.worst);report.viewports.push(result);console.log(JSON.stringify(result));
}
report.summary={pairTests:report.viewports.reduce((s,v)=>s+v.pairTests,0),collisionSamples:report.viewports.reduce((s,v)=>s+v.collisionSamples,0),minimumCameraClearance:Math.min(...report.viewports.map(v=>v.minimumCameraClearance.distance))};
fs.writeFileSync(path.join(__dirname,'validation-moon.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
