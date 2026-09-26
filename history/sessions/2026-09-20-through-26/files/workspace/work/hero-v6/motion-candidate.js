function mul(a,b){let o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[i*4+j]+=a[k*4+j]*b[i*4+k];return o;}
function model(v){const[x,y,z,rx,ry,rz,s]=v,cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);return new Float32Array([(cy*cz+sy*sx*sz)*s,cx*sz*s,(-sy*cz+cy*sx*sz)*s,0,(-cy*sz+sy*sx*cz)*s,cx*cz*s,(sy*sz+cy*sx*cz)*s,0,sy*cx*s,-sx*s,cy*cx*s,0,x,y,z,1]);}
function perspective(aspect,z){const f=1/Math.tan(38*Math.PI/360),n=.5,far=40;const pr=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]);const view=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,-z,1]);return mul(pr,view);}
const CARD_W=1.1667,CARD_H=2,CARD_T=.011;let COUNT=14;
const qstep=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const ramp=(a,b,t)=>qstep((t-a)/(b-a));
// Ease velocity only at the shoulders. A steady middle gives each face time
// in the foreground instead of accelerating the entire train through it.
function travelPace(progress){
 const u=clamp((progress-.055)/.905),shoulder=.18;
 const integral=x=>x*x*x*x*(2.5-3*x+x*x);
 if(u<shoulder)return shoulder*integral(u/shoulder)/(1-shoulder);
 if(u>1-shoulder)return 1-shoulder*integral((1-u)/shoulder)/(1-shoulder);
 return (u-shoulder/2)/(1-shoulder);
}
// Keep the typography tied to the same card poses after retiming the journey.
function copyPace(progress){
 if(progress<=.055||progress>=.96)return progress;
 const distance=travelPace(progress);let low=0,high=1;
 for(let i=0;i<24;i++){const mid=(low+high)/2;if(qstep(mid)<distance)low=mid;else high=mid;}
 return .055+.905*(low+high)/2;
}
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s);
function rotate(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];}
// A fixed spatial rail, sampled by arc length. Each card travels through it once.
// Release and arrival are staggered along the same rail; no whole-scene auto zoom.
let rail=[],railLength=0,railStations=[],attitude;
const startFrame=model([0,0,0,-.12,-.34,-.13,1]),endFrame=model([0,0,0,-.07,-Math.PI+.14,.055,1]);
const startNormal=rotate(startFrame,[0,0,1]),endNormal=rotate(endFrame,[0,0,1]);
function catmull(a,b,c,d,t){const t2=t*t,t3=t2*t;return b.map((v,j)=>.5*((2*v)+(-a[j]+c[j])*t+(2*a[j]-5*v+4*c[j]-d[j])*t2+(-a[j]+3*v-3*c[j]+d[j])*t3));}
function makeTracks(){
 const portrait=w/h<1.0;COUNT=portrait?5:9;
 const ids=[18,17,2,19,21,9,0,6,14];tracks=Array.from({length:COUNT},(_,i)=>({id:ids[i],i}));
 const short=h<650;
 const tan=Math.tan(19*Math.PI/180),aspect=w/h;
 const screen=([x,y,z])=>[(x-.5)*2*tan*(10.4-z)*aspect,(.5-y)*2*tan*(10.4-z),z];
 const start=screen(portrait?[.58,short?.35:.39,0]:[.66,.45,0]);
 const finish=screen(portrait?[.64,short?.32:.35,0]:[.70,short?.50:.43,0]);
 const stops=portrait?[[.885,.29,1.7],[.90,.24,-3],[.60,.22,-3],[.28,.30,-3],[.31,.40,-.2],[.34,.70,1.7],[.31,.72,-4.6],[.65,.55,-4.6]]:
 [[.88,short?.35:.30,1.7],[.89,short?.31:.24,-3],[.66,short?.31:.24,-3],[.33,short?.33:.28,-3],[.20,.40,-.2],[.34,short?.65:.69,1.7],[.34,short?.70:.72,-4.6],[.68,.54,-4.6]];
 // Clear each packet along its own face normal before changing orientation.
 const points=[start,add(start,scale(startNormal,.6)),add(start,scale(startNormal,1.5)),...stops.map(screen),add(finish,scale(endNormal,1.5)),add(finish,scale(endNormal,.6)),finish];
 rail=[];railLength=0;
 for(let segment=0;segment<points.length-1;segment++)for(let k=0;k<48;k++){
  const t=k/48,v=catmull(points[Math.max(0,segment-1)],points[segment],points[segment+1],points[Math.min(points.length-1,segment+2)],t);
  if(rail.length)railLength+=Math.hypot(...v.map((x,j)=>x-rail[rail.length-1].point[j]));
  rail.push({point:v,d:railLength});
 }
 const v=points[points.length-1];railLength+=Math.hypot(...v.map((x,j)=>x-rail[rail.length-1].point[j]));rail.push({point:v,d:railLength});
 railStations=points.map((_,i)=>rail[i*48].d/railLength);
 // Shared angular derivatives preserve momentum through compatible keys.
 // Direction changes and flat clearances still settle naturally without overshoot.
 attitude={
  yaw:angularTrack([[0,-.34],[railStations[2],-.34],[railStations[3],-Math.PI/2],[railStations[4],-Math.PI/2],[railStations[5],-.40],[.515,-Math.PI+.16],[.70,-Math.PI-.14],[.90,-Math.PI+.14],[1,-Math.PI+.14]]),
  bank:angularTrack([[0,-.13],[railStations[2],-.13],[railStations[3],0],[railStations[4],0],[railStations[5],.17],[.53,.21],[.72,-.14],[.90,.055],[1,.055]]),
  pitch:angularTrack([[0,-.12],[railStations[2],-.12],[railStations[3],0],[railStations[4],0],[railStations[5],.22],[.53,-.12],[.72,.08],[.90,-.07],[1,-.07]])
 };
 // Shared derivatives make adjacent distance segments C1 instead of a polyline.
 for(let i=0;i<rail.length;i++){const prev=rail[Math.max(0,i-1)].point,next=rail[Math.min(rail.length-1,i+1)].point;const delta=next.map((v,j)=>v-prev[j]),length=Math.hypot(...delta);rail[i].tangent=delta.map(v=>v/length);}
}
function onRail(distance){
 const d=clamp(distance,0,railLength);let lo=0,hi=rail.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(rail[mid].d<d)lo=mid;else hi=mid;}
 const a=rail[lo],b=rail[hi],length=b.d-a.d,f=(d-a.d)/Math.max(.00001,length),f2=f*f,f3=f2*f;
 return a.point.map((v,j)=>(2*f3-3*f2+1)*v+(f3-2*f2+f)*length*a.tangent[j]+(-2*f3+3*f2)*b.point[j]+(f3-f2)*length*b.tangent[j]);
}
// f(0)=f'(0)=f''(0)=0; f(1)=f'(1)=1 and f''(1)=0.
// Every card therefore leaves/rests smoothly even when the shared train is moving.
function softDistance(d){const edge=1.1;if(d<=0)return 0;if(d>=railLength)return railLength;const shoulder=x=>{const t=x/edge;return edge*t*t*t*(6+t*(-8+3*t));};if(d<edge)return shoulder(d);if(d>railLength-edge)return railLength-shoulder(railLength-d);return d;}
function angularTrack(keys){
 const intervals=keys.slice(1).map((v,i)=>v[0]-keys[i][0]);
 const slopes=keys.slice(1).map((v,i)=>(v[1]-keys[i][1])/intervals[i]);
 const derivatives=keys.map((_,i)=>{
  if(i===0||i===keys.length-1||slopes[i-1]*slopes[i]<=0)return 0;
  const before=intervals[i-1],after=intervals[i],a=2*after+before,b=after+2*before;
  return (a+b)/(a/slopes[i-1]+b/slopes[i]);
 });
 return {keys,derivatives};
}
function angleAt(t,track){
 const {keys,derivatives}=track;
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
  const length=keys[i][0]-keys[i-1][0],u=clamp((t-keys[i-1][0])/length),u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*keys[i-1][1]+(u3-2*u2+u)*length*derivatives[i-1]+(-2*u3+3*u2)*keys[i][1]+(u3-u2)*length*derivatives[i];
 }
 return keys[keys.length-1][1];
}
function ribbon(progress){
 const t=progress,portrait=w/h<1.0,short=h<650,tan=Math.tan(19*Math.PI/180);
 const flightHeight=portrait?.21:.235,flightScale=flightHeight*10.4*tan;
 const gap=flightScale*(portrait?mix(4.6,4.9,ramp(.60,.85,w/h)):4.9);
 const train=(COUNT-1)*gap;
 const drive=travelPace(t);
 const travelled=drive*(railLength+train);
 const startScale=(portrait?(short?.33:.39):.47)*10.4*tan;
 const endScale=(portrait?(short?.36:.425):.59)*10.4*tan;
 const idle=!quiet&&!freezeTime;
 const breath=idle?Math.sin(time*.45)*.012:0;
 // A compact normal stack opens slightly before the procession. Parallel faces
 // retain their order and return to the original spacing before any loop returns.
 const packetLift=ramp(.008,.085,t)*(1-ramp(.10,.225,t));
 const packetPitch=.014+.024*packetLift;
 const poses=[];
 for(let i=0;i<COUNT;i++){
  const d=travelled-i*gap,position=softDistance(d),u=clamp(position/railLength);
  const release=ramp(0,1.35,position),arrival=ramp(railLength-1.35,railLength,position);
  const near=ramp(.38,.55,u)*(1-ramp(.73,.90,u));
  const scaleFlight=flightScale*(1+.19*near);
  const k=mix(mix(startScale,scaleFlight,release),endScale,arrival);
  const c=onRail(position);
  // Remaining cards occupy the real starting packet. Arrived cards gather behind the Moon.
  for(let j=0;j<3;j++)c[j]+=(1-release)*(-i*packetPitch)*startScale*startNormal[j]+arrival*(i*.014)*endScale*endNormal[j];
  const yaw=angleAt(u,attitude.yaw),bank=angleAt(u,attitude.bank),pitch=angleAt(u,attitude.pitch);
  const m=model([c[0]+ptr[0]*.075,c[1]-ptr[1]*.055+breath,c[2],pitch,yaw,bank,k]);
  poses.push({id:tracks[i].id,centre:c,matrix:m,u,d,scale:k});
 }
 diagnostics.clearance={railLength,gap,travelled,arrival:ramp(railLength-2.2,railLength,travelled),cards:COUNT};
 return poses;
}

// const vert= marks the end of the arithmetic-only motion block.
