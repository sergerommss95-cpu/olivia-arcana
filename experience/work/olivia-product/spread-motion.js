/**
 * A small score for the reading table. These helpers own no clocks or DOM:
 * the ritual can pause, finish or cancel every movement as one transaction.
 */
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const smooth=t=>t*t*t*(10+t*(-15+6*t));
const mix=(a,b,t)=>a+(b-a)*t;
const point=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};
const number=value=>Math.round(value*1000)/1000;
const scores={
 clarity3:{
  // A low opening, a still centre, then the answering wing.
  bend:[-1,0,1],lift:[.72,.94,.72],lean:[-7,1,7],
  deal:[1500,1620,1560],turn:[1480,1580,1540],hold:[2200,2500,2300]
 },
 crossroads5:{
  // Establish the centre. Two equal branches open away from one another;
  // the overlooked view and the next step gently close the composition.
  bend:[0,-1,1,-.25,.25],lift:[.8,1,1,.66,.7],lean:[0,-9,9,-3,3],
  deal:[1580,1660,1660,1510,1590],turn:[1560,1620,1620,1490,1560],hold:[2300,2600,2600,2200,2400]
 },
 compass8:{
  // Alternating approaches create a gathering, with a slower final arrival.
  bend:[-.12,.12,-.8,.8,-1,1,-.45,.45],lift:[.82,.7,.95,.95,.74,.74,.8,.9],lean:[-2,2,-6,6,-8,8,-4,4],
  deal:[1580,1480,1550,1550,1460,1460,1530,1660],turn:[1560,1460,1520,1520,1460,1460,1520,1630],hold:[2300,2200,2300,2300,2400,2400,2400,2700]
 }
};

function score(spreadId,index){
 const s=scores[spreadId]||scores.clarity3;
 const i=clamp(Math.trunc(index)||0,0,s.bend.length-1);
 return {s,i};
}

/** from / to are viewport DOMRects; final card placement remains entirely CSS-owned. */
export function dealMotion({spreadId,index,from,to,angle=0,fromAngle=0,fromWidth=from.width,toWidth=to.width,handheld=false}){
 const {s,i}=score(spreadId,index);
 const screenX=(from.x+from.width/2)-(to.x+to.width/2);
 const screenY=(from.y+from.height/2)-(to.y+to.height/2);
 // The slot is already rotated. Translate in its local coordinates so the
 // departing card begins at the centre of the chosen card in the deck.
 const radians=(Number.isFinite(angle)?angle:0)*Math.PI/180;
 const dx=screenX*Math.cos(radians)+screenY*Math.sin(radians);
 const dy=-screenX*Math.sin(radians)+screenY*Math.cos(radians);
 const distance=Math.hypot(dx,dy);
 const lift=clamp(distance*.14,24,84)*s.lift[i];
 const bow=clamp(distance*.15,18,76)*s.bend[i];
 const startScale=clamp(fromWidth/Math.max(1,toWidth),.18,12);
 const frames=Array.from({length:25},(_,n)=>{
  const offset=n/24;
  // A continuous minimum-jerk time curve avoids a kink at intermediate keys.
  const t=smooth(offset);
  const x=point(dx,dx*.83+bow,dx*.17+bow*.4,0,t);
  const y=point(dy,dy*.7-lift,dy*.1-lift*.28,0,t);
  const scale=mix(startScale,1,smooth(clamp((t-.16)/.84,0,1)));
  const lean=(fromAngle-angle)*(1-t)+s.lean[i]*Math.sin(Math.PI*t)*.45;
  return {offset,transform:`translate(${number(x)}px, ${number(y)}px) scale(${number(scale)}) rotate(${number(lean)}deg)`,opacity:1};
 });
 frames[frames.length-1]={offset:1,transform:'translate(0, 0) scale(1) rotate(0deg)',opacity:1};
 return {frames,options:{duration:handheld?920:s.deal[i],easing:'linear',fill:'none'}};
}

/** One painted surface turns edge-on, changes artwork while invisible, then opens.
 * Splitting a single time curve avoids fragile nested 3D backface compositing.
 */
export function revealMotion({spreadId,index,handheld=false}){
 const {s,i}=score(spreadId,index);
 const lift=spreadId==='compass8'?7:spreadId==='crossroads5'?9:10;
 const lean=s.bend[i]*(spreadId==='crossroads5'?1.7:1.1);
 const frames=half=>Array.from({length:15},(_,n)=>{
  const offset=n/14,t=smooth((half+offset)/2),suspension=Math.sin(Math.PI*t);
  const angle=180*t-(half?180:0);
  return {offset,transform:`translateY(${number(-lift*suspension)}px) rotateZ(${number(lean*suspension)}deg) rotateY(${number(angle)}deg) scale(${number(1+.028*suspension)})`};
 });
 const close=frames(0),open=frames(1);
 close[0]={offset:0,transform:'none'};open[open.length-1]={offset:1,transform:'none'};
 return {close,open,options:{duration:(handheld?1180:s.turn[i])/2,easing:'linear',fill:'none'}};
}

/** A thumb can move several cards, but cannot sweep past either deck edge. */
export function deckBrowseMotion({start,dx,step,count}){
 const last=Math.max(0,count-1),origin=clamp(start,0,last),stride=Math.max(1,step);
 const distance=clamp(dx,-Math.min(3,last-origin)*stride,Math.min(3,origin)*stride);
 const steps=Math.min(3,Math.floor(Math.abs(dx)/stride+.6))*Math.sign(dx);
 return {index:clamp(origin-steps,0,last),offset:distance+(dx-distance)*.16};
}

/** Leave enough stillness for the face and its first sentence to be taken in. */
export function holdDuration(spreadId,index){const {s,i}=score(spreadId,index);return s.hold[i];}
