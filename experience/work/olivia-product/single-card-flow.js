/* One physical card connects the deck, the reveal, and the reading. */
import {singleCardTouchIntent,singleCardTouchAction,singleCardMobileLayout} from './single-card-mobile.js';
import {mountCardMaterial} from './card-material.js';
import {mountCardUnveiling} from './card-unveiling.js';
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
// The artwork and its light share this surface; the outer card keeps its path.
export function singleCardSurfaceTransform(x=.5,y=.5,active=true){
 const across=(clamp(x,0,1)-.5)*2,down=(clamp(y,0,1)-.5)*2;
 return `perspective(1200px) translateZ(${active?9:0}px) rotateX(${-down*6}deg) rotateY(${across*7}deg)`;
}
export function initSingleCardFlow({assets,motion,reduced,choose,onRead,announce,onBrowse,unveilingFactory=mountCardUnveiling}){
 let phase='idle',slot=null,quad=null,targetMap=new Map(),generation=0,hoverTimer=0,hoverReturning=false,drag=null,selected=null,activeAnimation=null,quadAnimation=null,selectedByKeyboard=false,suppressClickUntil=0,surfaceAnimation=null,handPointer=null,handStart=null,handMoved=false;
 const words=(en,uk)=>getLocale()==='uk'?uk:en;
 const layer=document.createElement('div');layer.className='single-card-layer';layer.hidden=true;
 layer.innerHTML='<div class="single-card-object"><div class="single-card-surface"><img alt="" draggable="false"></div></div><div class="single-card-actions" hidden><p class="eyebrow"></p><details class="single-card-note" hidden><summary><span class="single-card-note-label"></span><span class="single-card-note-preview" data-no-translate="true"></span><span class="single-card-note-toggle" aria-hidden="true">+</span></summary><blockquote data-no-translate="true"></blockquote></details><button type="button" class="solid-action"></button><p class="single-card-hint" id="single-card-hint"></p></div><a href="#question" class="single-card-return" hidden><span aria-hidden="true">←</span><span></span></a>';
 document.body.append(layer);
 const card=layer.querySelector('.single-card-object'),surface=card.querySelector('.single-card-surface'),image=card.querySelector('img'),actions=layer.querySelector('.single-card-actions'),reveal=actions.querySelector('button'),eyebrow=actions.querySelector('.eyebrow'),hint=actions.querySelector('.single-card-hint'),note=actions.querySelector('.single-card-note'),back=layer.querySelector('.single-card-return');
 back.setAttribute('aria-label',words('Return to your question','Повернутися до запитання'));back.lastElementChild.textContent=words('Your question','До запитання');
 card.setAttribute('aria-hidden','true');
 reveal.setAttribute('aria-describedby','single-card-hint');
 const skip=document.createElement('button');skip.type='button';skip.className='single-card-skip quiet-link';skip.hidden=true;skip.textContent=words('Show my card now','Показати мою карту зараз');layer.append(skip);
 let skipRequested=false,completedReveals=0;
 try{completedReveals=Number(window.sessionStorage?.getItem('olivia-reveal-count'))||0;}catch{}
 const material=mountCardMaterial(surface,{image,getDeckId:()=>selected?.deckId||assets.deckId||'olivia',reduced,enabled:()=>['held','revealed'].includes(phase)});
 const unveiling=unveilingFactory(surface,{image,reduced});
 function actionCopy(revealed=false,error=false){
  eyebrow.textContent=revealed?t(selected?.cardName||'Your card'):words('A moment with your card','Мить із вашою картою');
  reveal.textContent=revealed?words('Read my card','Прочитати карту'):words('Unveil my card','Відкрити мою карту');
  hint.textContent=error?words('The artwork could not load. Your card is safe; try again.','Зображення не завантажилося. Ваша карта збережена; спробуйте ще раз.'):reduced()?words('Take your time. The card waits for you.','Не поспішайте. Карта чекає на вас.'):revealed?words('Explore its surface. Your reading can wait.','Торкніться її поверхні. Читання зачекає.'):words('Touch the card when you feel ready.','Торкніться карти, коли будете готові.');
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
 function resetSurface(instant=false){
  surfaceAnimation?.cancel();surfaceAnimation=null;
  if(handPointer!==null){const pointer=handPointer;handPointer=null;material.touch(.5,.5,false);try{if(card.hasPointerCapture(pointer))card.releasePointerCapture(pointer);}catch{}}
  surface.dataset.settling='true';surface.style.transition=instant?'none':'';
  surface.style.transform=singleCardSurfaceTransform(.5,.5,false);
 }
 function liftSurface(){
  if(reduced())return;
  // A single light lift catches the card's edge as it leaves the stack.
  const animation=surface.animate([
   {offset:0,transform:singleCardSurfaceTransform(.5,.5,false)},
   {offset:.42,transform:'perspective(1200px) translateZ(24px) rotateX(-7deg) rotateY(-9deg)'},
   {offset:1,transform:singleCardSurfaceTransform(.5,.5,false)}
  ],{duration:1450,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  surfaceAnimation=animation;
  animation.finished.then(()=>{if(surfaceAnimation===animation){animation.cancel();surfaceAnimation=null;}},()=>{});
 }
 function state(value){phase=value;skip.hidden=value!=='revealing';if(value==='idle')delete layer.dataset.inspecting;document.body.dataset.singleState=value;layer.dataset.reducedMotion=String(reduced());layer.dataset.deckId=selected?.deckId||assets.deckId||'olivia';back.hidden=!['extracting','held','revealing','revealed'].includes(value);material.setActive(['held','revealed'].includes(value));if(!['held','revealed'].includes(value)){material.touch(.5,.5,false);resetSurface(value==='idle'||value==='hover');}else{surfaceAnimation?.cancel();surfaceAnimation=null;}}
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
   if(layer.dataset.inspecting==='true'&&width>=1040){
    const h=Math.min(700,height*.78),w=h*7/12,cardLeft=left+width*.42-w/2,cardTop=top+(height-h)/2;
    const actionLeft=cardLeft+w+Math.min(70,width*.05),actionWidth=Math.min(290,left+width-actionLeft-40);
    apply({actions:{left:actionLeft,top:top+height*.33,width:actionWidth,maxHeight:height*.6}});
    return quadForRect({left:cardLeft,top:cardTop,width:w,height:h});
   }
   apply({actions:{left:left+(width-Math.min(340,width-48))/2,top:top+height*.76,width:Math.min(340,width-48),maxHeight:height-120}});
   const hidden=actions.hidden;actions.style.visibility='hidden';actions.hidden=false;
   const actionHeight=actions.offsetHeight||118;actions.hidden=hidden;actions.style.visibility='';
   const upper=top+Math.min(128,Math.max(72,height*.12)),gap=24,room=Math.max(1,height-(upper-top)-actionHeight-gap-28),h=Math.min(560,height*.63,room),w=Math.min(width*.42,h*7/12,330),cardHeight=w*12/7;
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
 function unveilingQuad(){
  const viewport=window.visualViewport,view=viewport&&viewport.scale===1?viewport:null;
  const width=view?.width||innerWidth,height=view?.height||innerHeight,left=view?.offsetLeft||0,top=view?.offsetTop||0;
  const h=Math.max(120,Math.min(760,height*.79,height-136,(width-40)*12/7)),w=h*7/12;
  return quadForRect({left:left+(width-w)/2,top:top+Math.max(64,(height-h)/2-8),width:w,height:h});
 }
 function cancelAnimation(){if(activeAnimation&&quadAnimation){const {from,to,duration,lift}=quadAnimation,t=ease(clamp(Number(activeAnimation.currentTime||0)/duration,0,1)),arc=Math.sin(Math.PI*t)*lift;put(from.map(([x,y],j)=>[x+(to[j][0]-x)*t,y+(to[j][1]-y)*t-arc]));}activeAnimation?.cancel();activeAnimation=null;quadAnimation=null;}
 function hideSource(index){motion()?.hideChoice?.(index);for(const button of choices().children)button.toggleAttribute('data-lifted',Number(button.dataset.slot)===index);}
 async function animateQuad(to,duration=1000,lift=0){
  const token=generation;cancelAnimation();const from=quad;
  if(reduced()||duration<=0){put(to);return token===generation;}
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
 function hover(index,keyboard=false){if(!visible()||!['idle','hover'].includes(phase)||choices().inert||drag)return;clearTimeout(hoverTimer);if(phase==='hover'&&slot===index){if(hoverReturning)settleHover(index,true);return;}clearHover();slot=index;card.dataset.slot=index;selectedByKeyboard=keyboard;image.style.rotate='';image.src=assets.back;image.alt='';image.style.transform='';material.refresh();layer.hidden=false;actions.hidden=true;state('hover');put(sourcePoints(index));hideSource(index);settleHover(index,true);}
 function leave(index){if(drag||phase!=='hover'||slot!==index)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>settleHover(index),60);}
 function releasePointer(gesture){try{if(gesture?.button.hasPointerCapture(gesture.id))gesture.button.releasePointerCapture(gesture.id);}catch{/* The browser may release capture during a route or viewport change. */}}
 function cancel(){selectedByKeyboard=false;generation++;clearTimeout(hoverTimer);unveiling.cancel();delete layer.dataset.unveiling;delete layer.dataset.unveilingRest;delete layer.dataset.inspecting;cancelAnimation();const previous=drag;drag=null;releasePointer(previous);selected=null;slot=null;quad=null;state('idle');layer.hidden=true;actions.hidden=true;note.open=false;image.style.transform='';image.style.visibility='';reveal.disabled=false;hideSource(null);document.body.classList.remove('single-reading-arrival');choices().inert=!visible();}
 async function pick(index,keyboard=false){
  if(!visible()||!['idle','hover'].includes(phase)||choices().inert)return;
  clearTimeout(hoverTimer);selectedByKeyboard=keyboard||selectedByKeyboard;
  if(slot!==index){clearHover();slot=index;card.dataset.slot=index;image.style.rotate='';image.src=assets.back;image.alt='';image.style.transform='';material.refresh();put(sourcePoints(index));}
  generation++;cancelAnimation();const token=generation;
  try{selected=choose(index);}catch(error){cancel();announce(words('The card could not be drawn. Please try again.','Не вдалося витягнути карту. Спробуйте ще раз.'));return;}
  if(!selected){cancel();return;}
  unveiling.touch(.46,.62);
  actionCopy();prepareNote();hideSource(index);state('extracting');layer.hidden=false;actions.hidden=true;choices().inert=true;document.querySelector('#random-card').disabled=true;
  liftSurface();
  if(!await animateQuad(stageQuad(),1450,28)||token!==generation)return;
  state('held');actions.hidden=false;put(stageQuad());reveal.disabled=false;image.alt=words('Your chosen card, face down','Ваша обрана карта, сорочкою догори');material.refresh();material.awaken?.();announce(words('Your card has left the deck. Turn it when you are ready.','Ваша карта вже перед вами. Переверніть її, коли будете готові.'));if(selectedByKeyboard)reveal.focus({preventScroll:true});
 }
 function restoreHeld(record,index){
  cancel();if(!record||!Number.isInteger(index))return;
  selected=record;slot=index;card.dataset.slot=index;selectedByKeyboard=true;
  unveiling.touch(.46,.62);
  image.style.rotate='';image.src=assets.back;image.alt=words('Your chosen card, face down','Ваша обрана карта, сорочкою догори');image.style.transform='';
  actionCopy();prepareNote();layer.hidden=false;put(stageQuad());state('held');hideSource(index);material.refresh();
  choices().inert=true;document.querySelector('#random-card').disabled=true;actions.hidden=false;reveal.disabled=false;
  announce(words('Your chosen card is still here. Turn it when you are ready.','Ваша обрана карта досі тут. Переверніть її, коли будете готові.'));reveal.focus({preventScroll:true});
 }
 async function revealCard(){
  if(phase!=='held')return;
  const token=generation;skipRequested=false;state('revealing');reveal.disabled=true;
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
  let approach=null;
  const unveiled=!skipRequested&&await unveiling.reveal({front:nextImage,orientation:selected.orientation,duration:completedReveals?1800:4200,onStart:()=>{
   layer.dataset.unveiling='true';
   layer.dataset.revealCaption=words('Move gently across the card.','Проведіть по карті легким рухом.');
   announce(words('Your card is opening. Move gently across its surface.','Ваша карта відкривається. Легко проведіть по її поверхні.'));
   approach=animateQuad(unveilingQuad(),completedReveals?450:800,0);
   return approach;
  },onProgress:progress=>{
   if(token===generation)layer.dataset.unveilingRest=progress>=.88?'true':'false';
  }});
  if(token!==generation)return;
  if(approach)await approach;
  if(token!==generation)return;
  if(unveiled){
   image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;
   image.style.transform='';
   unveiling.cancel();
   delete layer.dataset.unveiling;delete layer.dataset.unveilingRest;layer.dataset.inspecting='true';
   await animateQuad(stageQuad(),skipRequested?0:completedReveals?450:850,0);
   if(token!==generation)return;
  }else{
   unveiling.cancel();delete layer.dataset.unveiling;delete layer.dataset.unveilingRest;
   if(approach)put(stageQuad());
  // One visible image swaps exactly edge-on. The two halves share angular speed.
  if(!reduced()&&!skipRequested){
   let animation=image.animate(singleCardTurnFrames(),{duration:840,easing:'linear',fill:'forwards'});activeAnimation=animation;
   try{await animation.finished;}catch{return;}if(token!==generation)return;
   image.style.transform=singleCardTurnFrames(true)[0].transform;
   image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;animation.cancel();
   if(!reduced()&&!skipRequested){
    animation=image.animate(singleCardTurnFrames(true),{duration:840,easing:'linear',fill:'forwards'});activeAnimation=animation;
    try{await animation.finished;}catch{return;}if(token!==generation)return;
    image.style.transform='';animation.cancel();activeAnimation=null;
   }else{image.style.transform='';activeAnimation=null;}
  }else{image.style.rotate=selected.orientation==='reversed'?'180deg':'';image.src=nextImage.src;}
  }
  completedReveals++;try{window.sessionStorage?.setItem('olivia-reveal-count',String(completedReveals));}catch{}
  image.alt=t(selected.cardName);actionCopy(true);actions.hidden=false;reveal.disabled=false;put(stageQuad());
  state('revealed');material.refresh();if(!unveiled)material.awaken?.();
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
 skip.addEventListener('click',()=>{if(phase!=='revealing')return;skipRequested=true;skip.hidden=true;unveiling.cancel();activeAnimation?.finish();});
 reveal.addEventListener('click',()=>{if(phase==='held')revealCard();else if(phase==='revealed')readCard();});
 note.addEventListener('toggle',()=>{
  note.querySelector('.single-card-note-toggle').textContent=note.open?'−':'+';
  note.querySelector('summary').setAttribute('aria-label',note.open?words('Fold your question','Згорнути ваше запитання'):words('Unfold your question','Розгорнути ваше запитання'));
  if(['held','revealed'].includes(phase))put(stageQuad());
 });
 // The fixed outer card is the hit area; only its inner material leans.
 // CSS eases each gesture, then goes completely idle after settling.
 function touchSurface(event){
  if(handStart&&Number.isFinite(event.clientX)&&Math.hypot(event.clientX-handStart.x,event.clientY-handStart.y)>8)handMoved=true;
  if(!['held','revealing','revealed'].includes(phase)||reduced()||document.hidden)return;
  if(event.pointerType!=='mouse'&&handPointer!==event.pointerId)return;
  const box=card.getBoundingClientRect(),x=(event.clientX-box.left)/box.width,y=(event.clientY-box.top)/box.height;
  unveiling.touch(clamp(x,0,1),clamp(y,0,1));
  if(phase==='revealing')return;
  surface.dataset.settling='false';surface.style.transition='';
  surface.style.transform=singleCardSurfaceTransform(x,y);
  // Capture belongs to the stable outer card, so forward touch coordinates
  // to the material inside instead of losing them during a phone drag.
  material.touch(clamp(x,0,1),clamp(y,0,1),true);
 }
 card.addEventListener('pointerdown',event=>{
  if(!['held','revealing','revealed'].includes(phase)||event.button!==0||event.isPrimary===false)return;
  handPointer=event.pointerId;
  handStart={x:event.clientX,y:event.clientY};handMoved=false;
  try{card.setPointerCapture(event.pointerId);}catch{}
  touchSurface(event);
 });
 card.addEventListener('pointermove',touchSurface);
 card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')touchSurface(event);});
 card.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&handPointer===null)resetSurface();});
 const releaseSurface=event=>{if(handPointer!==event.pointerId)return;if(handStart&&Number.isFinite(event.clientX)&&Math.hypot(event.clientX-handStart.x,event.clientY-handStart.y)>8)handMoved=true;if(event.type==='pointercancel')handMoved=true;resetSurface();};
 card.addEventListener('pointerup',releaseSurface);
 card.addEventListener('pointercancel',releaseSurface);
 card.addEventListener('lostpointercapture',releaseSurface);
 card.addEventListener('click',event=>{
  if(phase==='held'&&handStart&&!handMoved&&event.detail!==0&&performance.now()>=suppressClickUntil)revealCard();
  handStart=null;handMoved=false;
 });
 // The finite light pass also serves keyboard users, without moving the card.
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
 const resize=()=>{resetSurface(true);if(drag)cancelPointer({pointerId:drag.id});if(phase==='hover')clearHover();else if(['held','revealing','revealed'].includes(phase)){if(quadAnimation)cancelAnimation();put(layer.dataset.unveiling==='true'?unveilingQuad():stageQuad());}};
 addEventListener('resize',resize);
 window.visualViewport?.addEventListener('resize',resize);
 window.visualViewport?.addEventListener('scroll',()=>{if(handheld()&&['held','revealed'].includes(phase))put(stageQuad());});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetSurface(true);if(activeAnimation){if(document.hidden)activeAnimation.pause();else activeAnimation.play();}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{layer.dataset.reducedMotion=String(reduced());if(reduced()){resetSurface(true);activeAnimation?.finish();}});
 return {bind,cancel,pick,restoreHeld,update:targets=>{targetMap=new Map(targets.map(t=>[t.index,t]));},get busy(){return !['idle','hover'].includes(phase);}};
}
