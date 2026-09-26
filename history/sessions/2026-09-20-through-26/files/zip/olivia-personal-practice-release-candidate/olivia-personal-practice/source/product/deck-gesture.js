/* Keep the hit area still while the artwork follows the hand. */
export function bindDeckGesture(button,{enabled,choose}){
 const image=button.querySelector('img');
 let drag=null,suppressUntil=0;
 image.draggable=false;
 function reset(){drag=null;button.removeAttribute('data-dragging');image.style.transform='';}
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0||!enabled()||drag)return;
  const pose=getComputedStyle(image).transform;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,pose:pose==='none'?'':pose,moved:false};
  button.dataset.dragging='true';image.style.transform=pose;
  button.setPointerCapture(event.pointerId);
 });
 button.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  drag.moved ||= Math.hypot(dx,dy)>7;
  const x=Math.max(-85,Math.min(85,dx))*.45,y=Math.max(-220,Math.min(12,dy)),r=Number(button.dataset.angle||0)*Math.PI/180;
  image.style.transform=`translate(${x*Math.cos(r)+y*Math.sin(r)}px,${-x*Math.sin(r)+y*Math.cos(r)}px) ${drag.pose}`;
 });
 button.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const accepted=!drag.moved||event.clientY-drag.y<-40;
  suppressUntil=performance.now()+450;
  if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
  if(accepted&&enabled())choose(false); // Capture this exact visible pose before returning the source.
  reset();
 });
 button.addEventListener('pointercancel',event=>{if(drag&&event.pointerId===drag.id)reset();});
 button.addEventListener('lostpointercapture',event=>{if(drag&&event.pointerId===drag.id)reset();});
 button.addEventListener('click',event=>{
  if(performance.now()<suppressUntil||!enabled())return;
  choose(event.detail===0);
 });
 return reset;
}
