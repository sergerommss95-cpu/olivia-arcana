/* One physical card connects the deck, the reveal, and the reading. */
import {singleCardTouchIntent,singleCardTouchAction,singleCardMobileLayout} from './single-card-mobile.js';
import {mountCardMaterial} from './card-material.js';
import {getLocale,t} from './locale.js';
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
// Both halves share one timing curve, so the physical turn carries through its edge.
export function singleCardTurnFrames(opening=false){
 return Array.from({length:25},(_,i)=>{const progress=(i/24+(opening?1:0))/2,angle=180*ease(progress)-(opening?180:0),lift=-8*Math.sin(Math.PI*progress);return {offset:i/24,transform:`perspective(1400px) translateY(${lift}px) rotateY(${angle}deg)`};});
}
export function initSingleCardFlow({assets,motion,reduced,choose,onRead,announce,onBrowse}){
 let phase='idle',slot=null,quad=null,targetMap=new Map(),generation=0,hoverTimer=0,hoverReturning=false,drag=null,selected=null,activeAnimation=null,quadAnimation=null,selectedByKeyboard=false,suppressClickUntil=0;
 const words=(en,uk)=>getLocale()==='uk'?uk:en;
 const layer=document.createElement('div');layer.className='single-card-layer';layer.hidden=true;
 layer.innerHTML='<div class="single-card-object"><img alt="" draggable="false"></div><div class="single-card-actions" hidden><p class="eyebrow"></p><details class="single-card-note" hidden><summary><span class="single-card-note-label"></span><span class="single-card-note-preview" data-no-translate="true"></span><span class="single-card-note-toggle" aria-hidden="true">+</span></summary><blockquote data-no-translate="true"></blockquote></details><button type="button" class="solid-action"></button><p class="single-card-hint" id="single-card-hint"></p></div><a href="#question" class="single-card-return" hidden><span aria-hidden="true">←</span><span></span></a>';
 document.body.append(layer);
 const card=layer.querySelector('.single-card-object'),image=card.querySelector('img'),actions=layer.querySelector('.single-card-actions'),reveal=actions.querySelector('button'),eyebrow=actions.querySelector('.eyebrow'),hint=actions.querySelector('.single-card-hint'),note=actions.querySelector('.single-card-note'),back=layer.querySelector('.single-card-return');
 back.setAttribute('aria-label',words('Return to your question','Повернутися до запитання'));back.lastElementChild.textContent=words('Your question','До запитання');
 card.setAttribute('aria-hidden','true');
 reveal.setAttribute('aria-describedby','single-card-hint');
 const material=mountCardMaterial(card,{image,getDeckId:()=>selected?.deckId||assets.deckId||'olivia',reduced,enabled:()=>['hover','held','revealed'].includes(phase)});
 function actionCopy(revealed=false,error=false){
  eyebrow.textContent=revealed?t(selected?.cardName||'Your card'):words('A moment with your card','Мить із вашою картою');
  reveal.textContent=revealed?words('Read my card','Прочитати карту'):words('Turn my card','Перевернути карту');
  hint.textContent=error?words('The artwork could not load. Your card is safe; try turning it again.','Зображення не завантажилося. Ваша карта збережена; спробуйте перевернути її знову.'):revealed?words('Let your eye wander. Your reading can wait.','Роздивіться карту. Читання зачекає.'):words('Take a breath. Turn it when you are ready.','Зробіть вдих. Переверніть, коли будете готові.');
  hint.classList.toggle('has-error',error);
 }
 function prepareNote(){
  const question=typeof selected?.question==='string'?selected.question.trim():'';
  note.open=false;note.hidden=!question;
  note.querySelector('.single-card-note-label').textContent=words('Your question','Ваше запитання');
  note.querySelector('.single-card-note-preview').textContent=question;
  note.querySelector('blockquote').textContent=question;
  note.querySelector('summary').setAttribute('aria-label',words('Unfold your question','Розгорнути ваше запитання'));
 }
 const stage=()=>document.querySelector('#motion-stage'),choices=()=>document.querySelector('#card-choices');
 const visible=()=>document.body.dataset.view==='choose';
 const handheld=()=>matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)').matches;
 function state(value){phase=value;document.body.dataset.singleState=value;layer.dataset.reducedMotion=String(reduced());layer.dataset.deckId=selected?.deckId||assets.deckId||'olivia';back.hidden=!['extracting','held','revealing','revealed'].includes(value);material.setActive(['hover','held','revealed'].includes(value));if(!['hover','held','revealed'].includes(value))material.touch(.5,.5,false);}
 function put(points){quad=points;card.style.transform=cardQuadMatrix(points);}
 function sourcePoints(index){
  const t=targetMap.get(index),rect=stage().getBoundingClientRect(),fallback=choices().querySelector(`[data-slot="${index}"]`);
  if(t)return translate(t.points,rect.left,rect.top);
  const bounds=fallback?.getBoundingClientRect();
  if(fallback?.hasAttribute('data-mobile-card'))return mobileCardSourceQuad(bounds,fallback.offsetWidth,fallback.offsetHeight,parseFloat(getComputedStyle(fallback).getPropertyValue('--mobile-card-angle'))||0);
  return quadForRect(bounds||{left:innerWidth/2-80,top:innerHeight*.4,width:160,height:160*12/7});
 }
 function stageQuad(){
  const viewport=window.visualViewport,view=viewport&&viewport.scale===1?viewport:null;
  const width=view?.width||innerWidth,height=view?.height||innerHeight,left=view?.offsetLeft||0,top=view?.offsetTop||0;
  function apply(layout){
   for(const [key,value] of Object.entries(layout.actions))layer.style.setProperty('--single-actions-'+key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),value+'px');
  }
  if(!handheld()){
   delete layer.dataset.mobileLayout;
   apply({actions:{left:left+(width-Math.min(340,width-48))/2,top:top+height*.76,width:Math.min(340,width-48),maxHeight:height-120}});
   const hidden=actions.hidden;actions.style.visibility='hidden';actions.hidden=false;
   const actionHeight=actions.offsetHeight||118;actions.hidden=hidden;actions.style.visibility='';
   const upper=top+Math.min(180,Math.max(84,height*.19)),gap=24,room=Math.max(1,height-(upper-top)-actionHeight-gap-28),h=Math.min(520,height*.54,room),w=Math.min(width*.42,h*7/12,310),cardHeight=w*12/7;
   const cardTop=upper+Math.max(0,(room-cardHeight)*.28);
   apply({actions:{left:left+(width-Math.min(340,width-48))/2,top:cardTop+cardHeight+gap,width:Math.min(340,width-48),maxHeight:Math.max(90,top+height-cardTop-cardHeight-gap-20)}});
   layer.style.setProperty('--single-note-left',Math.min(left+width-Math.min(240,width*.27)-28,left+(width+w)/2+34)+'px');
   layer.style.setProperty('--single-note-top',(cardTop+cardHeight*.55)+'px');
   layer.style.setProperty('--single-note-width',Math.min(240,width*.27)+'px');
   return quadForRect({left:left+(width-w)/2,top:cardTop,width:w,height:cardHeight});
  }
  // Card, folded question and actions share the actual visible phone viewport.
  const style=getComputedStyle(layer),insets={};
  for(const side of ['top','right','bottom','left'])insets[side]=parseFloat(style.getPropertyValue('padding-'+side))||({top:104,right:20,bottom:20,left:20}[side]);
  const options={width,height,left,top,insets};
  const initial=singleCardMobileLayout(options);layer.dataset.mobileLayout=initial.mode;apply(initial);
  const hidden=actions.hidden,visibility=actions.style.visibility;
  actions.style.visibility='hidden';actions.hidden=false;
  const actionsHeight=actions.scrollHeight||actions.offsetHeight||120;
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
 async function arriveAt(destination,duration=1350){
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
 function hover(index,keyboard=false){if(!visible()||!['idle','hover'].includes(phase)||choices().inert||drag)return;clearTimeout(hoverTimer);if(phase==='hover'&&slot===index){if(hoverReturning)settleHover(index,true);return;}clearHover();slot=index;card.dataset.slot=index;selectedByKeyboard=keyboard;image.style.rotate='';image.src=assets.back;image.alt='';image.style.transform='';material.refresh();layer.hidden=false;actions.hidden=true;state('hover');material.touch(.42,.32,true);put(sourcePoints(index));hideSource(index);settleHover(index,true);}
 function leave(index){if(drag||phase!=='hover'||slot!==index)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>settleHover(index),60);}
 function releasePointer(gesture){try{if(gesture?.button.hasPointerCapture(gesture.id))gesture.button.releasePointerCapture(gesture.id);}catch{/* The browser may release capture during a route or viewport change. */}}
 function cancel(){selectedByKeyboard=false;generation++;clearTimeout(hoverTimer);cancelAnimation();const previous=drag;drag=null;releasePointer(previous);selected=null;slot=null;quad=null;state('idle');layer.hidden=true;actions.hidden=true;note.open=false;image.style.transform='';image.style.visibility='';reveal.disabled=false;hideSource(null);document.body.classList.remove('single-reading-arrival');choices().inert=!visible();}
 async function pick(index,keyboard=false){
  if(!visible()||!['idle','hover'].includes(phase)||choices().inert)return;
  clearTimeout(hoverTimer);selectedByKeyboard=keyboard||selectedByKeyboard;
  if(slot!==index){clearHover();slot=index;card.dataset.slot=index;image.style.rotate='';image.src=assets.back;image.alt='';image.style.transform='';material.refresh();put(sourcePoints(index));}
  generation++;cancelAnimation();const token=generation;
  try{selected=choose(index);}catch(error){cancel();announce(words('The card could not be drawn. Please try again.','Не вдалося витягнути карту. Спробуйте ще раз.'));return;}
  if(!selected){cancel();return;}
  actionCopy();prepareNote();hideSource(index);state('extracting');layer.hidden=false;actions.hidden=true;choices().inert=true;document.querySelector('#random-card').disabled=true;
  if(!await animateQuad(stageQuad(),1450,18)||token!==generation)return;
  state('held');material.touch(.42,.32,true);actions.hidden=false;put(stageQuad());reveal.disabled=false;image.alt=words('Your chosen card, face down','Ваша обрана карта, сорочкою догори');material.refresh();announce(words('Your card has left the deck. Turn it when you are ready.','Ваша карта вже перед вами. Переверніть її, коли будете готові.'));if(selectedByKeyboard)reveal.focus({preventScroll:true});
 }
 function restoreHeld(record,index){
  cancel();if(!record||!Number.isInteger(index))return;
  selected=record;slot=index;card.dataset.slot=index;selectedByKeyboard=true;
  image.style.rotate='';image.src=assets.back;image.alt=words('Your chosen card, face down','Ваша обрана карта, сорочкою догори');image.style.transform='';
  actionCopy();prepareNote();layer.hidden=false;put(stageQuad());state('held');hideSource(index);material.refresh();
  choices().inert=true;document.querySelector('#random-card').disabled=true;actions.hidden=false;reveal.disabled=false;
  announce(words('Your chosen card is still here. Turn it when you are ready.','Ваша обрана карта досі тут. Переверніть її, коли будете готові.'));reveal.focus({preventScroll:true});
 }
 async function revealCard(){
  if(phase!=='held')return;
  const token=generation;state('revealing');reveal.disabled=true;
  reveal.textContent=words('Preparing your card…','Готуємо вашу карту…');
  // Keep the back in place until the face is decoded. A failed image is retryable.
  const nextImage=new Image();let timeout;
  try{
   const source=(assets.forRecord?.(selected)||assets).cards[selected.cardId];
   if(!source)throw new Error('Missing card artwork');
   nextImage.src=source;
   await Promise.race([nextImage.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Card image timed out')),12000);})]);
   if(!nextImage.naturalWidth)throw new Error('Empty card artwork');
  }catch{
   if(token!==generation)return;
   state('held');actionCopy(false,true);reveal.disabled=false;actions.hidden=false;put(stageQuad());
   announce(hint.textContent);if(selectedByKeyboard)reveal.focus({preventScroll:true});return;
  }finally{clearTimeout(timeout);}
  if(token!==generation)return;
  actions.hidden=true;
  // One visible image swaps exactly edge-on. The two halves share angular speed.
  if(!reduced()){
   let animation=image.animate(singleCardTurnFrames(),{duration:840,easing:'linear',fill:'forwards'});activeAnimation=animation;
   try{await animation.finished;}catch{return;}if(token!==generation)return;
   image.style.transform=singleCardTurnFrames(true)[0].transform;
   image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;animation.cancel();
   if(!reduced()){
    animation=image.animate(singleCardTurnFrames(true),{duration:840,easing:'linear',fill:'forwards'});activeAnimation=animation;
    try{await animation.finished;}catch{return;}if(token!==generation)return;
    image.style.transform='';animation.cancel();activeAnimation=null;
   }else{image.style.transform='';activeAnimation=null;}
  }else{image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;}
  image.alt=t(selected.cardName);actionCopy(true);actions.hidden=false;reveal.disabled=false;put(stageQuad());
  state('revealed');material.refresh();material.touch(.42,.32,true);
  announce(words(`${t(selected.cardName)}. Take your time. Read your card when you are ready.`,`${t(selected.cardName)}. Не поспішайте. Прочитайте карту, коли будете готові.`));
  if(selectedByKeyboard)reveal.focus({preventScroll:true});
 }
 async function readCard(){
  if(phase!=='revealed')return;
  const token=generation;state('arriving');actions.hidden=true;reveal.disabled=true;
  document.body.classList.add('single-reading-arrival');let destination;
  try{destination=onRead(selected);}catch{
   if(token!==generation)return;
   document.body.classList.remove('single-reading-arrival');state('revealed');actions.hidden=false;reveal.disabled=false;
   hint.textContent=words('Your card is still here. Try opening the reading again.','Ваша карта досі тут. Спробуйте відкрити читання знову.');announce(hint.textContent);return;
  }
  if(token!==generation)return;
  if(!destination){document.body.classList.remove('single-reading-arrival');state('revealed');actions.hidden=false;reveal.disabled=false;return;}
  if(!await arriveAt(destination)||token!==generation)return;
  layer.hidden=true;hideSource(null);document.body.classList.remove('single-reading-arrival');state('idle');
  if(!reduced())document.querySelector('.reading-copy')?.animate([{opacity:0},{opacity:1}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'});
  if(selectedByKeyboard)(document.querySelector('#reading-view[data-guidance-state="pending"] .reading-loader')||document.querySelector('#result-title'))?.focus({preventScroll:true});
 }
 reveal.addEventListener('click',()=>{if(phase==='held')revealCard();else if(phase==='revealed')readCard();});
 note.addEventListener('toggle',()=>{
  note.querySelector('.single-card-note-toggle').textContent=note.open?'−':'+';
  note.querySelector('summary').setAttribute('aria-label',note.open?words('Fold your question','Згорнути ваше запитання'):words('Unfold your question','Розгорнути ваше запитання'));
  if(['held','revealed'].includes(phase))put(stageQuad());
 });
 // The material owns pointer tracking; keyboard focus supplies the same close light.
 reveal.addEventListener('focus',()=>{if(['held','revealed'].includes(phase))material.touch(.52,.38,true);});
 reveal.addEventListener('blur',()=>material.touch(.5,.5,false));
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
 const resize=()=>{if(drag)cancelPointer({pointerId:drag.id});if(phase==='hover')clearHover();else if(['held','revealing','revealed'].includes(phase))put(stageQuad());};
 addEventListener('resize',resize);
 window.visualViewport?.addEventListener('resize',resize);
 window.visualViewport?.addEventListener('scroll',()=>{if(handheld()&&['held','revealed'].includes(phase))put(stageQuad());});
 document.addEventListener('visibilitychange',()=>{if(activeAnimation){if(document.hidden)activeAnimation.pause();else activeAnimation.play();}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{layer.dataset.reducedMotion=String(reduced());if(reduced())activeAnimation?.finish();});
 return {bind,cancel,pick,restoreHeld,update:targets=>{targetMap=new Map(targets.map(t=>[t.index,t]));},get busy(){return !['idle','hover'].includes(phase);}};
}
