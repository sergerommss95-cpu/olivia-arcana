'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const text=fs.readFileSync(path.join(__dirname,'check-choreography.cjs'),'utf8');
const shim={argv:['node','checker',path.resolve(__dirname,'../hero.js'),'/tmp/no.json','1000','still'],cwd:()=>process.cwd()};
const {audit,box,clippedProjection,source}=new Function('require','process','__dirname',text.slice(0,text.indexOf('const report='))+'return {audit,box,clippedProjection,source};')(require,shim,__dirname);
const a=source.indexOf('function mul('),b=source.indexOf('const vert='),c=source.indexOf('function sceneFrame('),d=source.indexOf('\nfunction draw(',c);
const states=[{quiet:false,freezeTime:true,time:0,pointer:[0,0]}];for(const time of [0,7,17,31,47,63,78])for(const pointer of [[1,1],[-1,1],[1,-1],[-1,-1]])states.push({quiet:false,freezeTime:false,time,pointer});
const report={sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),arithmeticSha256:crypto.createHash('sha256').update(source.slice(a,b)+source.slice(c,d)).digest('hex'),states,viewports:[]};
for(const [w,h] of [[1440,1000],[1280,720],[800,900],[390,844],[320,568],[844,390],[640,360],[1024,768]]){
 audit.init(w,h);const dims=audit.dimensions(),landscape=w/h>=1.4&&h<=600,header=w<=600?60:landscape?54:70,footer=h-(w<=600?18:landscape?10:26)-36,r={viewport:[w,h],opening:null,closing:null};
 for(const p of [0,1]){const bounds={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};let worst=null;
  for(const state of states){audit.state(state);const sample=audit.sample(p);for(const pose of sample.poses){const pts=clippedProjection(box(pose,dims),w,h,sample.camera).points;if(!pts.length)continue;const xs=pts.map(x=>x.x),ys=pts.map(x=>x.y),x={left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};bounds.left=Math.min(bounds.left,x.left);bounds.right=Math.max(bounds.right,x.right);bounds.top=Math.min(bounds.top,x.top);bounds.bottom=Math.max(bounds.bottom,x.bottom);const m=Math.min(x.left,w-x.right,x.top-header,footer-x.bottom);if(!worst||m<worst.margin)worst={margin:m,id:pose.id,key:pose.key,state};}}
  r[p===0?'opening':'closing']={bounds,minimumMargins:{left:bounds.left,right:w-bounds.right,nav:bounds.top-header,footer:footer-bounds.bottom},worst};
 }
 report.viewports.push(r);
}
report.passing=report.viewports.every(v=>[v.opening,v.closing].every(x=>Object.values(x.minimumMargins).every(m=>m>=0)));
fs.writeFileSync(path.join(__dirname,'validation-bookends.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
