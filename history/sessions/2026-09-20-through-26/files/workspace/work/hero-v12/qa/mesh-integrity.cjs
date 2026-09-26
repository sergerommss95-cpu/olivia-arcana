'use strict';
// Independent geometric checks on the actual generated card mesh. No rendering mock.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../hero.js'),'utf8');
const dimensions=source.match(/const CARD_W=([^,]+),CARD_H=([^,]+),CARD_T=([^;]+);/).slice(1).map(Number);
const [W,H,T]=dimensions,context={Float32Array,Uint16Array,Math,CARD_W:W,CARD_H:H,CARD_T:T};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function makeMesh(){'),source.indexOf('function shader('))+';globalThis.mesh=makeMesh();',context);
const {v,i}=context.mesh,vertices=Array.from({length:v.length/8},(_,k)=>Array.from(v.slice(k*8,k*8+8))),triangles=Array.from({length:i.length/3},(_,k)=>Array.from(i.slice(k*3,k*3+3)));
const sub=(a,b)=>a.map((x,k)=>x-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,k)=>s+x*b[k],0),norm=a=>Math.hypot(...a),point=n=>vertices[n].slice(0,3);
const welded=[],lookup=new Map(),ids=vertices.map(v=>{const key=v.slice(0,3).map(x=>Math.round(x*1e8)).join(',');if(!lookup.has(key)){lookup.set(key,welded.length);welded.push(v.slice(0,3));}return lookup.get(key);});
const edges=new Map(),adj=Array.from({length:welded.length},()=>new Set());let minArea=Infinity,minNormalAgreement=Infinity,volume=0,degenerate=0,invalidIndices=0,frontFaces=0,backFaces=0;
for(const triangle of triangles){if(triangle.some(k=>k>=vertices.length||k<0))invalidIndices++;const [a,b,c]=triangle.map(point),n=cross(sub(b,a),sub(c,a)),area=norm(n)/2;minArea=Math.min(minArea,area);if(area<1e-12)degenerate++;const average=triangle.reduce((acc,k)=>acc.map((x,j)=>x+vertices[k][j+3]),[0,0,0]);minNormalAgreement=Math.min(minNormalAgreement,dot(n,average)/(norm(n)*norm(average)));volume+=dot(a,cross(b,c))/6;
 if(triangle.every(k=>vertices[k][5]===1)){frontFaces++;if(n[2]<=0)throw Error('Positive-Z face winding inverted');}
 if(triangle.every(k=>vertices[k][5]===-1)){backFaces++;if(n[2]>=0)throw Error('Negative-Z face winding inverted');}
 const t=triangle.map(k=>ids[k]);for(let e=0;e<3;e++){const p=t[e],q=t[(e+1)%3],key=[Math.min(p,q),Math.max(p,q)].join(',');const list=edges.get(key)||[];list.push(p<q?1:-1);edges.set(key,list);adj[p].add(q);adj[q].add(p);}}
const seen=new Set([0]),todo=[0];while(todo.length){for(const k of adj[todo.pop()])if(!seen.has(k)){seen.add(k);todo.push(k);}}
const tests=[];const check=(name,pass,detail)=>tests.push({name,pass,...detail});
check('All vertices, normals and UVs are finite',vertices.every(v=>v.every(Number.isFinite)));
check('Unit normals',vertices.every(v=>Math.abs(norm(v.slice(3,6))-1)<1e-6));
check('UVs remain inside artwork rectangle',vertices.every(v=>v[6]>=0&&v[6]<=1&&v[7]>=0&&v[7]<=1));
check('Indices are valid and triangles nondegenerate',invalidIndices===0&&degenerate===0,{minTriangleArea:minArea,invalidIndices,degenerate});
check('All winding agrees with outward vertex normals',minNormalAgreement>.8,{minNormalAgreement});
check('Artwork faces sit on actual opposite outer planes',frontFaces===44&&backFaces===44&&vertices.filter(v=>Math.abs(v[5])===1).every(v=>Math.abs(v[2]-Math.sign(v[5])*T/2)<1e-8),{frontFaces,backFaces});
check('Closed welded two-manifold with opposite edge incidence',Array.from(edges.values()).every(x=>x.length===2&&x[0]+x[1]===0),{boundaryEdges:Array.from(edges.values()).filter(x=>x.length!==2).length});
check('One connected component, sphere topology, positive volume',seen.size===welded.length&&welded.length-edges.size+triangles.length===2&&volume>0,{weldedVertices:welded.length,edges:edges.size,triangles:triangles.length,euler:welded.length-edges.size+triangles.length,volume});
check('Mesh stays inside former clearance envelope',vertices.every(v=>Math.abs(v[0])<=W/2+1e-7&&Math.abs(v[1])<=H/2+1e-7&&Math.abs(v[2])<=T/2+1e-8),{maxExtents:[0,1,2].map(axis=>Math.max(...vertices.map(v=>Math.abs(v[axis])))),oldHalfExtents:[W/2,H/2,T/2]});
const radius=.045;check('No disconnected square corners outside rounded footprint',vertices.every(v=>{const qx=Math.max(Math.abs(v[0])-(W/2-radius),0),qy=Math.max(Math.abs(v[1])-(H/2-radius),0);return Math.hypot(qx,qy)<=radius+1e-7;}));
check('Artwork side selection follows geometric side, independent of view winding',source.includes('vFace=aNormal.z;')&&source.includes('if(vFace>0.)tex=texture2D(uBack')&&source.includes('else tex=texture2D(uDetail'));
check('Main and shadow silhouettes use geometry without fragment discard',!source.slice(source.indexOf('const frag='),source.indexOf('function makeMesh')).includes('discard')&&!source.slice(source.indexOf('let shadowState='),source.indexOf('function cameraPose')).includes('discard'));
const result={source:'work/hero-v12/hero.js',sourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),scope:'Actual rounded card geometry and shader source invariants. Does not rasterize shaders or replace browser visual review.',vertices:vertices.length,indices:i.length,passed:tests.filter(t=>t.pass).length,total:tests.length,tests};fs.writeFileSync(path.join(__dirname,'mesh-integrity-report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=tests.some(t=>!t.pass)?1:0;
