/* The button stays still. Only its painted surface follows the hand. */
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const round=value=>Math.round(value*1000)/1000;

/** onPull receives a 0–1 commitment progress; 0 always ends a gesture.
 * choose runs before the surface is restored so the next animation can start
 * from the exact card pose under the user's hand.
 */
export function bindDeckGesture(button,{enabled,choose,onPull=()=>{},reduced=reducedMotion,canBrowse=()=>false,onBrowse=()=>{}}){
 const image=button.querySelector('img');
 let drag=null,suppressUntil=0,returnAnimation=null;
 const restingTransform=image.style.transform,restingTransition=image.style.transition;
 image.draggable=false;
 function stopReturn(){
  if(returnAnimation){const animation=returnAnimation;returnAnimation=null;animation.cancel();}
 }
 function release(id){
  try{if(button.hasPointerCapture(id))button.releasePointerCapture(id);}catch{/* The pointer may already have been released by the browser. */}
 }
 function restore(animate=false){
  const from=image.style.transform;
  stopReturn();button.removeAttribute('data-dragging');
  // Disable the CSS hover transition while reading its destination. The return
  // is one uninterrupted movement, even when the pointer has left the card.
  image.style.transition='none';image.style.transform=restingTransform;
  const to=getComputedStyle(image).transform;
  if(animate&&!reduced()&&image.animate&&from&&from!==to){
   const animation=image.animate([{transform:from},{transform:to}],{duration:360,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
   returnAnimation=animation;
   animation.finished.then(()=>{
    if(returnAnimation!==animation)return;
    returnAnimation=null;image.style.transition=restingTransition;
   },()=>{});
  }else image.style.transition=restingTransition;
  onPull(0);
 }
 function reset(){
  const current=drag;drag=null;
  if(current?.axis==='browse')onBrowse({phase:'cancel',dx:current.dx});
  if(current){suppressUntil=performance.now()+450;release(current.id);}
  restore(false);
 }
 function cancel(event){
  if(!drag||event.pointerId!==drag.id)return;
  const current=drag;drag=null;suppressUntil=performance.now()+450;
  if(current.axis==='browse')onBrowse({phase:'cancel',dx:current.dx});
  release(current.id);restore(true);
 }
 function track(event){
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  drag.moved ||= Math.hypot(dx,dy)>7;
  drag.dx=dx;drag.dy=dy;
  // A phone gesture chooses its axis once. A sideways browse cannot become a
  // card choice when the thumb curves upward at the end of the same swipe.
  if(drag.browse&&!drag.axis&&Math.hypot(dx,dy)>10){
   if(Math.abs(dx)>Math.abs(dy)*1.2)drag.axis='browse';
   else if(Math.abs(dy)>Math.abs(dx)*1.2)drag.axis='pull';
   if(drag.axis==='browse'){
    button.removeAttribute('data-dragging');image.style.transform=drag.pose;
    onPull(0);onBrowse({phase:'start',dx:0});
   }
  }
  if(drag.axis==='browse'){onBrowse({phase:'move',dx});return;}
  const progress=clamp(-dy/drag.threshold,0,1);
  // Pulling vertically is direct. Across the deck there is gentle resistance;
  // beyond the card's height resistance increases rather than hitting a stop.
  const limit=drag.height*.9;
  const y=dy< -limit?-limit+(dy+limit)*.18:dy>0?Math.min(dy,60)*.18:dy;
  const x=Math.tanh(dx/drag.width)*drag.width*.48;
  const r=drag.angle*Math.PI/180;
  const tilt=drag.reduced?0:clamp(dx/drag.width*3,-3,3)*progress;
  image.style.transform=`translate(${round(x*Math.cos(r)+y*Math.sin(r))}px,${round(-x*Math.sin(r)+y*Math.cos(r))}px) rotate(${round(tilt)}deg) ${drag.pose}`;
  onPull(progress);
 }
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.isPrimary===false||!enabled()||drag)return;
  const pose=getComputedStyle(image).transform;
  stopReturn();
  const rect=image.getBoundingClientRect?.();
  const height=image.offsetHeight||rect?.height||260,width=image.offsetWidth||rect?.width||height*.583;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,dy:0,height,width,threshold:clamp(height*.21,48,112),angle:Number(button.dataset.angle)||0,pose:pose==='none'?'':pose,moved:false,reduced:reduced(),browse:canBrowse(),axis:null};
  image.style.transition='none';button.dataset.dragging='true';image.style.transform=pose;
  try{button.setPointerCapture(event.pointerId);}catch{reset();}
 });
 button.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  if(!enabled()){cancel(event);return;}
  event.preventDefault();track(event);
 });
 button.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  // A quick pull may have no final pointermove. Evaluate the released position.
  if(event.clientX-drag.x!==drag.dx||event.clientY-drag.y!==drag.dy)track(event);
  const current=drag,accepted=!current.moved||(-current.dy>=current.threshold&&-current.dy>Math.abs(current.dx)*(current.browse?1.2:.72)&&(!current.browse||current.axis==='pull'));
  // Clear ownership before releasePointerCapture: lostpointercapture can fire
  // synchronously, and must not erase the source pose before choose reads it.
  drag=null;suppressUntil=performance.now()+450;release(current.id);
  if(current.axis==='browse'){
   onBrowse({phase:enabled()?'end':'cancel',dx:current.dx});restore(false);
  }else if(accepted&&enabled()){
   try{choose(false);}finally{restore(false);}
  }else restore(true);
 });
 button.addEventListener('pointercancel',cancel);
 button.addEventListener('lostpointercapture',cancel);
 button.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!drag)return;
  event.preventDefault();cancel({pointerId:drag.id});
 });
 button.addEventListener('click',event=>{
  if(drag||performance.now()<suppressUntil||!enabled())return;
  choose(event.detail===0);
 });
 return reset;
}
