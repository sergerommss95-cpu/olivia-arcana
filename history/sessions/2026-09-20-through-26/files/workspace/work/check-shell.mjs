import * as THREE from './three.module.min.js';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function buildOraclePoses('),source.indexOf('function configurePoses()'));
const build=new Function('THREE',`${body};return buildOraclePoses;`)(THREE);
function box(pose){const axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)].map(v=>v.applyQuaternion(pose.q));return {center:pose.p.clone().addScaledVector(axes[2],.0305*pose.s),axes,half:[1.258,1.908,.022].map(x=>x*pose.s)}}
function overlaps(a,b){const axes=[...a.axes,...b.axes];for(const x of a.axes)for(const y of b.axes){const z=x.clone().cross(y);if(z.lengthSq()>1e-10)axes.push(z.normalize())}const delta=b.center.clone().sub(a.center);return axes.every(axis=>Math.abs(delta.dot(axis))<a.axes.reduce((n,v,i)=>n+Math.abs(axis.dot(v))*a.half[i],0)+b.axes.reduce((n,v,i)=>n+Math.abs(axis.dot(v))*b.half[i],0)-1e-7)}
for(const mobile of [false,true]){const boxes=build(THREE,mobile).map(box),hits=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(overlaps(boxes[i],boxes[j]))hits.push([i,j]);console.log(JSON.stringify({mobile,pairs:231,overlaps:hits}));if(hits.length)process.exitCode=1}
