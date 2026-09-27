function cameraPose(progress){
 const passage=ramp(.18,.40,progress)*(1-ramp(.76,.98,progress));
 const eye=[Math.sin(progress*Math.PI*2)*.24*passage,Math.sin(progress*Math.PI)*.14*passage,mix(10.4,9.7,passage)];
 const view=lookAt(eye,[eye[0]*.2,0,-1.5],Math.sin(progress*Math.PI*2)*.008*passage);
 const fov=38,f=1/Math.tan(fov*Math.PI/360),near=.12,far=75;
 const projection=new Float32Array([f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
 return {eye,view,vp:mul(projection,view),fov};
}
const START=[-.12,-.34],END=[-.07,-Math.PI+.14];
let story;
function screenPoint(x,y,z,eyeZ=10.4){const t=Math.tan(19*Math.PI/180)*(eyeZ-z);return [(x-.5)*2*t*w/h,(.5-y)*2*t,z];}
function makeTracks(){
 const portrait=w/h<1.15,short=h<(portrait?760:650),unit=Math.tan(19*Math.PI/180)*10.4;
 COUNT=portrait?9:13;
 const start=screenPoint(portrait?.58:.66,portrait?(short?.35:.39):.45,0);
 const end=screenPoint(portrait?.64:.70,portrait?(short?.32:.35):(short?.50:.48),0);
 const ss=(portrait?(short?.36:.46):(short?.58:.62))*unit,es=(portrait?(short?.38:.455):(short?.63:.68))*unit;
 const ids=portrait?[0,19,2,21,14,6,8,17,18]:[0,19,2,21,14,6,8,9,11,1,3,17,18];
 story={portrait,short,start,end,ss,es,unit};
 tracks=ids.map((id,i)=>({id,i,u:i/(COUNT-1)}));
}
function ribbon(progress){
 const {portrait,start,end,ss,es,unit}=story,poses=[];
 const open=ramp(.065,.285,progress),turn=ramp(.29,.565,progress),part=ramp(.585,.77,progress),close=ramp(.855,.99,progress);
 const flourish=open*(1-close),space=ramp(.095,.30,progress)*(1-close);
 const yaw=mix(mix(START[1],-.13,open),END[1],turn),pitch=mix(START[0],END[0],turn)+Math.sin(turn*Math.PI)*.13;
 const bank=mix(-.10,.055,turn)+Math.sin(open*Math.PI)*.035;
 const rotation=model([0,0,0,pitch,yaw,bank,1]);
 const cardScale=mix(mix(ss,unit*(portrait?.355:.47),open),es,close);
 const gap=mix(.017*cardScale,portrait?.40:.52,space),half=(COUNT-1)*gap/2;
 const settled=close;
 const mid=[0,portrait?.08:0,-(portrait?2.3:3.35)*space];
 let anchor=start.map((v,j)=>mix(mix(v,mid[j],open),end[j],settled));
 // The first reverse and the final Moon each retain their original screen anchor.
 const edgeAnchor=mix(half,-half,turn)*(1-space),offset=rotate(rotation,[0,0,edgeAnchor]);
 anchor=anchor.map((v,j)=>v-offset[j]);
 const actor=new Float32Array(rotation);actor[12]=anchor[0];actor[13]=anchor[1];actor[14]=anchor[2];
 for(const {id,i,u}of tracks){
  const t=u-.5,phase=t*Math.PI;
  // A single long S gesture: every card belongs to the same evolving surface.
  const width=portrait?2.25:8.9,height=portrait?2.3:1.22;
  let x=t*width*flourish;
  let y=height*Math.sin(phase*(portrait?1.7:1.25)+turn*.48)*flourish;
  let rz=mix(0,t*(portrait?.34:.48)+Math.sin(phase)*.07,flourish);
  const z=(.5-u)*(COUNT-1)*gap;
  let s=cardScale;
  if(i===COUNT-1){
   // The Moon becomes the still focal point while the two wings travel past it.
   x=mix(x,0,part*(1-close));y=mix(y,portrait?.20:.05,part*(1-close));rz=mix(rz,0,part);
   s=mix(s,unit*(portrait?.43:.66),part*(1-close));
  }else{
   const halfCount=(COUNT-1)/2,side=i<halfCount?-1:1,rank=i%halfCount;
   const wingX=-side*((portrait?1.60:3.05)+rank*(portrait?.085:.24));
   const wingY=side*(rank-(halfCount-1)/2)*(portrait?.51:.51);
   x=mix(x,wingX,part*(1-close));y=mix(y,wingY,part*(1-close));
   rz=mix(rz,side*(.15+rank*.045),part*(1-close));
  }
  const local=model([x,y,z,0,0,rz,s]),matrix=mul(actor,local);
  poses.push({id,centre:[matrix[12],matrix[13],matrix[14]],matrix,u:progress,d:progress,scale:s});
 }
 diagnostics.clearance={cards:COUNT,phase:progress<.29?'unfolding':progress<.585?'turn':progress<.855?'reveal':'gathering'};
 return poses;
}
