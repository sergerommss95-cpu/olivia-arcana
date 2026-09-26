/* One physical card connects the deck, the reveal, and the reading. */
import {singleCardTouchIntent,singleCardTouchAction,singleCardMobileLayout} from './single-card-mobile.js';
const WIDTH=320,HEIGHT=WIDTH*12/7;
const ease=t=>t*t*t*(10+t*(-15+6*t));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const translate=(points,x,y)=>points.map(([px,py])=>[px+x,py+y]);
export function cardQuadMatrix(points){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=points;
 const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 const denominator=dx1*dy2-dx2*dy1;
 let g=0,h=0;
 if(Math.abs(denominator)>.00001){g=(dx3*dy2-dx2*dy3)/denominator;h=(dx1*dy3-dx3*dy1)/denominator;}
 return `matrix3d(${(x1-x0+g*x1)/WIDTH},${(y1-y0+g*y1)/WIDTH},0,${g/WIDTH},${(x3-x0+h*x3)/HEIGHT},${(y3-y0+h*y3)/HEIGHT},0,${h/HEIGHT},0,0,1,0,${x0},${y0},0,1)`;
}
function quadForRect(rect,angle=0){const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),x=rect.left+rect.width/2,y=rect.top+rect.height/2;return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([px,py])=>[x+px*rect.width/2*c-py*rect.height/2*s,y+px*rect.width/2*s+py*rect.height/2*c]);}
export function mobileCardSourceQuad(bounds,width,height,angle=0){
 // A rotated bounding box is larger than the card. Recover its unrotated
 // dimensions around the same centre before applying the authored fan angle.
 return quadForRect({left:bounds.left+(bounds.width-width)/2,top:bounds.top+(bounds.height-height)/2,width,height},angle);
}
export function initSingleCardFlow({assets,motion,reduced,choose,onRead,announce,onBrowse}){
 let phase='idle',slot=null,quad=null,targetMap=new Map(),generation=0,hoverTimer=0,hoverReturning=false,drag=null,selected=null,activeAnimation=null,quadAnimation=null,selectedByKeyboard=false,suppressClickUntil=0;
 const layer=document.createElement('div');layer.className='single-card-layer';layer.hidden=true;
 layer.innerHTML='<div class="single-card-object"><img alt="" draggable="false"></div><div class="single-card-actions" hidden><p class="eyebrow">Your card is waiting</p><button type="button" class="solid-action">Reveal this card <span aria-hidden="true">↗</span></button><p class="single-card-hint">Take a moment. Turn it when you are ready.</p></div>';
 document.body.append(layer);
 const card=layer.querySelector('.single-card-object'),image=card.querySelector('img'),actions=layer.querySelector('.single-card-actions'),reveal=actions.querySelector('button');
 card.setAttribute('aria-hidden','true');
 const stage=()=>document.querySelector('#motion-stage'),choices=()=>document.querySelector('#card-choices');
 const visible=()=>document.body.dataset.view==='choose';
 const handheld=()=>matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)').matches;
 function state(value){phase=value;document.body.dataset.singleState=value;}
 function put(points){quad=points;card.style.transform=cardQuadMatrix(points);}
 function sourcePoints(index){
  const t=targetMap.get(index),rect=stage().getBoundingClientRect(),fallback=choices().querySelector(`[data-slot="${index}"]`);
  if(t)return translate(t.points,rect.left,rect.top);
  const bounds=fallback?.getBoundingClientRect();
  if(fallback?.hasAttribute('data-mobile-card'))return mobileCardSourceQuad(bounds,fallback.offsetWidth,fallback.offsetHeight,parseFloat(getComputedStyle(fallback).getPropertyValue('--mobile-card-angle'))||0);
  return quadForRect(bounds||{left:innerWidth/2-80,top:innerHeight*.4,width:160,height:160*12/7});
 }
 function stageQuad(){
  if(!handheld()){
   delete layer.dataset.mobileLayout;
   const h=Math.max(160,Math.min(innerHeight*.52,520)),w=Math.min(innerWidth*.66,h*7/12,310);return quadForRect({left:(innerWidth-w)/2,top:innerHeight*.25,width:w,height:w*12/7});
  }
  // Layer padding is the mobile shell's resolved safe-area/header/navigation inset.
  // Avoid mixing svh placement with innerHeight when Safari's chrome changes.
  const viewport=window.visualViewport,view=viewport&&viewport.scale===1?viewport:null;
  const style=getComputedStyle(layer),insets={};
  for(const side of ['top','right','bottom','left'])insets[side]=parseFloat(style.getPropertyValue('padding-'+side))||({top:104,right:20,bottom:20,left:20}[side]);
  const options={width:view?.width||innerWidth,height:view?.height||innerHeight,left:view?.offsetLeft||0,top:view?.offsetTop||0,insets};
  function apply(layout){
   layer.dataset.mobileLayout=layout.mode;
   for(const [key,value] of Object.entries(layout.actions))layer.style.setProperty('--single-actions-'+key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),value+'px');
  }
  apply(singleCardMobileLayout(options));
  const hidden=actions.hidden,visibility=actions.style.visibility;
  actions.style.visibility='hidden';actions.hidden=false;
  const actionsHeight=actions.offsetHeight||120;
  actions.hidden=hidden;actions.style.visibility=visibility;
  const layout=singleCardMobileLayout({...options,actionsHeight});apply(layout);
  return quadForRect(layout.card);
 }
 function cancelAnimation(){if(activeAnimation&&quadAnimation){const {from,to,duration,lift}=quadAnimation,t=ease(clamp(Number(activeAnimation.currentTime||0)/duration,0,1)),arc=Math.sin(Math.PI*t)*lift;put(from.map(([x,y],j)=>[x+(to[j][0]-x)*t,y+(to[j][1]-y)*t-arc]));}activeAnimation?.cancel();activeAnimation=null;quadAnimation=null;}
 function hideSource(index){motion()?.hideChoice?.(index);for(const button of choices().children)button.toggleAttribute('data-lifted',Number(button.dataset.slot)===index);}
 async function animateQuad(to,duration=1000,lift=0){
  const token=generation;cancelAnimation();const from=quad;
  if(reduced()){put(to);return token===generation;}
  const frames=Array.from({length:33},(_,i)=>{const t=ease(i/32),arc=Math.sin(Math.PI*t)*lift;return {offset:i/32,transform:cardQuadMatrix(from.map(([x,y],j)=>[x+(to[j][0]-x)*t,y+(to[j][1]-y)*t-arc]))};});
  const animation=card.animate(frames,{duration,easing:'linear',fill:'both'});activeAnimation=animation;quadAnimation={from,to,duration,lift};
  try{await animation.finished;}catch{return false;}if(token!==generation)return false;put(to);animation.cancel();if(activeAnimation===animation){activeAnimation=null;quadAnimation=null;}return true;
 }
 // The reading can scroll or reflow during arrival; follow its live image box.
 async function arriveAt(destination,duration=1100){
  cancelAnimation();const token=generation,from=quad;
  const target=()=>{const rect=destination.getBoundingClientRect(),w=destination.offsetWidth,h=destination.offsetHeight;return quadForRect({left:rect.left+(rect.width-w)/2,top:rect.top+(rect.height-h)/2,width:w,height:h},-3);};
  if(reduced()){put(target());return token===generation;}
  const clock=card.animate([{opacity:1},{opacity:1}],{duration});activeAnimation=clock;
  let frame;
  const tick=()=>{if(token!==generation||activeAnimation!==clock)return;const to=target(),t=ease(clamp(Number(clock.currentTime||0)/duration,0,1));put(from.map(([x,y],j)=>[x+(to[j][0]-x)*t,y+(to[j][1]-y)*t]));frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);
  try{await clock.finished;}catch{return false;}finally{cancelAnimationFrame(frame);}
  if(token!==generation)return false;put(target());clock.cancel();activeAnimation=null;return true;
 }
 function clearHover(){clearTimeout(hoverTimer);if(phase!=='hover')return;generation++;hoverReturning=false;cancelAnimation();hideSource(null);layer.hidden=true;slot=null;quad=null;state('idle');}
 async function settleHover(index,lifted=false){
  if(phase!=='hover'||slot!==index)return;clearTimeout(hoverTimer);const token=++generation;hoverReturning=!lifted;
  const source=sourcePoints(index),finished=await animateQuad(lifted?translate(source,0,-20):source,300);
  if(finished&&token===generation&&!lifted)clearHover();
 }
 function hover(index,keyboard=false){if(!visible()||!['idle','hover'].includes(phase)||choices().inert||drag)return;clearTimeout(hoverTimer);if(phase==='hover'&&slot===index){if(hoverReturning)settleHover(index,true);return;}clearHover();slot=index;card.dataset.slot=index;selectedByKeyboard=keyboard;image.style.rotate='';image.src=assets.back;image.alt='';image.style.transform='';layer.hidden=false;actions.hidden=true;state('hover');put(sourcePoints(index));hideSource(index);settleHover(index,true);}
 function leave(index){if(drag||phase!=='hover'||slot!==index)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>settleHover(index),60);}
 function releasePointer(gesture){try{if(gesture?.button.hasPointerCapture(gesture.id))gesture.button.releasePointerCapture(gesture.id);}catch{/* The browser may release capture during a route or viewport change. */}}
 function cancel(){selectedByKeyboard=false;generation++;clearTimeout(hoverTimer);cancelAnimation();const previous=drag;drag=null;releasePointer(previous);selected=null;slot=null;quad=null;state('idle');layer.hidden=true;actions.hidden=true;image.style.transform='';image.style.visibility='';hideSource(null);document.body.classList.remove('single-reading-arrival');choices().inert=!visible();}
 async function pick(index,keyboard=false){
  if(!visible()||!['idle','hover'].includes(phase)||choices().inert)return;
  clearTimeout(hoverTimer);selectedByKeyboard=keyboard||selectedByKeyboard;
  if(slot!==index){clearHover();slot=index;card.dataset.slot=index;image.style.rotate='';image.src=assets.back;image.alt='';image.style.transform='';put(sourcePoints(index));}
  generation++;cancelAnimation();const token=generation;
  try{selected=choose(index);}catch(error){cancel();announce('The card could not be drawn. Please try again.');return;}
  if(!selected){cancel();return;}
  hideSource(index);state('extracting');layer.hidden=false;actions.hidden=true;choices().inert=true;document.querySelector('#random-card').disabled=true;
  if(!await animateQuad(stageQuad(),1250,28)||token!==generation)return;
  state('held');actions.hidden=false;if(handheld())put(stageQuad());reveal.disabled=false;image.alt='Your chosen card, face down';announce('Your card has left the deck. Reveal it when you are ready.');if(selectedByKeyboard)reveal.focus({preventScroll:true});
 }
 function restoreHeld(record,index){
  cancel();if(!record||!Number.isInteger(index))return;
  selected=record;slot=index;card.dataset.slot=index;selectedByKeyboard=true;
  image.style.rotate='';image.src=assets.back;image.alt='Your chosen card, face down';image.style.transform='';
  layer.hidden=false;put(stageQuad());state('held');hideSource(index);
  choices().inert=true;document.querySelector('#random-card').disabled=true;actions.hidden=false;reveal.disabled=false;
  announce('Your chosen card is still here. Reveal it when you are ready.');reveal.focus({preventScroll:true});
 }
 async function revealCard(){
  if(phase!=='held')return;const token=generation;state('revealing');reveal.disabled=true;actions.hidden=true;
  // There is only one visible image. Swap it exactly edge-on, never layer two backs.
  const nextImage=new Image();nextImage.src=assets.cards[selected.cardId];try{await nextImage.decode();}catch{}
  if(token!==generation)return;
  if(!reduced()){
   let a=image.animate([{transform:'perspective(1100px) rotateY(0deg)'},{transform:'perspective(1100px) rotateY(90deg)'}],{duration:620,easing:'cubic-bezier(.55,0,.75,.65)',fill:'forwards'});activeAnimation=a;try{await a.finished;}catch{return;}if(token!==generation)return;image.style.transform='perspective(1100px) rotateY(-90deg)';image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;a.cancel();
   a=image.animate([{transform:'perspective(1100px) rotateY(-90deg)'},{transform:'perspective(1100px) rotateY(0deg)'}],{duration:740,easing:'cubic-bezier(.15,.35,.25,1)',fill:'forwards'});activeAnimation=a;try{await a.finished;}catch{return;}if(token!==generation)return;image.style.transform='';a.cancel();activeAnimation=null;
  }else {image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;}
  image.alt=selected.cardName;state('revealed');announce(`${selected.cardName}. Your reading is opening.`);
  if(!reduced()){const a=image.animate([{opacity:1},{opacity:1}],{duration:500});activeAnimation=a;try{await a.finished;}catch{return;}if(token!==generation)return;activeAnimation=null;}
  document.body.classList.add('single-reading-arrival');const destination=onRead(selected);
  if(token!==generation||!destination)return;
  state('arriving');if(!await arriveAt(destination)||token!==generation)return;
  layer.hidden=true;hideSource(null);document.body.classList.remove('single-reading-arrival');state('idle');
  if(!reduced()){const copy=document.querySelector('.reading-copy');copy.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'});}
  if(selectedByKeyboard)(document.querySelector('#reading-view[data-guidance-state="pending"] .reading-loader')||document.querySelector('#result-title')).focus({preventScroll:true});
 }
 reveal.addEventListener('click',revealCard);
 function trackPointer(event){
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(drag.mobile){
   Object.assign(drag,singleCardTouchIntent(drag,dx,dy));
   // A horizontal or undecided diagonal gesture never lifts a card toward a draw.
   if(drag.axis!=='pull'){put(translate(drag.points,drag.axis==='browse'?clamp(dx,-100,100)*.28:0,0));return;}
  }else drag.moved ||= Math.abs(dy)>6||Math.abs(dx)>6;
  put(translate(drag.points,clamp(dx,-100,100)*.35,clamp(dy,-innerHeight*.4,12)));
 }
 function cancelPointer(event){
  if(!drag||event.pointerId!==drag.id)return;
  const previous=drag;drag=null;suppressClickUntil=performance.now()+400;releasePointer(previous);
  settleHover(Number(previous.button.dataset.slot));
 }
 function bind(button){
  button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover(Number(button.dataset.slot));});
  button.addEventListener('pointerleave',()=>leave(Number(button.dataset.slot)));
  button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))hover(Number(button.dataset.slot),true);});
  button.addEventListener('blur',()=>leave(Number(button.dataset.slot)));
  button.addEventListener('click',e=>{if(performance.now()<suppressClickUntil)return;if(!drag)pick(Number(button.dataset.slot),e.detail===0);});
  button.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false||drag||choices().inert||!['idle','hover'].includes(phase))return;hover(Number(button.dataset.slot));cancelAnimation();drag={id:e.pointerId,button,startX:e.clientX,startY:e.clientY,points:quad,moved:false,axis:null,dx:0,dy:0,mobile:handheld()&&e.pointerType!=='mouse'};try{button.setPointerCapture(e.pointerId);}catch{cancelPointer(e);}});
  button.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;trackPointer(e);});
  button.addEventListener('pointerup',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   // Quick swipes can arrive without a final pointermove; inspect the release too.
   if(drag.mobile)trackPointer(e);
   const previous=drag,result=previous.mobile?singleCardTouchAction(previous):{type:!previous.moved||e.clientY-previous.startY<-36?'choose':'cancel'};
   suppressClickUntil=performance.now()+400;drag=null;releasePointer(previous);
   if(result.type==='browse'&&typeof onBrowse==='function'){clearHover();onBrowse(result.direction);}
   else if(result.type==='choose')pick(Number(button.dataset.slot));
   else settleHover(Number(button.dataset.slot),e.pointerType==='mouse');
  });
  button.addEventListener('pointercancel',cancelPointer);
  button.addEventListener('lostpointercapture',cancelPointer);
  button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=[...choices().querySelectorAll('button')],i=all.indexOf(button),next=e.key==='Home'?0:e.key==='End'?all.length-1:clamp(i+(e.key==='ArrowRight'?1:-1),0,all.length-1);all[next]?.focus({preventScroll:true});});
 }
 // The lifted tip is also a hit area; source and clone share one guarded gesture.
 bind(card);
 const resize=()=>{if(drag)cancelPointer({pointerId:drag.id});if(phase==='hover')clearHover();else if(phase==='held'||(handheld()&&['revealing','revealed'].includes(phase)))put(stageQuad());};
 addEventListener('resize',resize);
 window.visualViewport?.addEventListener('resize',resize);
 window.visualViewport?.addEventListener('scroll',()=>{if(handheld()&&phase==='held')put(stageQuad());});
 document.addEventListener('visibilitychange',()=>{if(activeAnimation){if(document.hidden)activeAnimation.pause();else activeAnimation.play();}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reduced())activeAnimation?.finish();});
 return {bind,cancel,pick,restoreHeld,update:targets=>{targetMap=new Map(targets.map(t=>[t.index,t]));},get busy(){return !['idle','hover'].includes(phase);}};
}
