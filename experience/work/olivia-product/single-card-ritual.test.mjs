import test from 'node:test';
import assert from 'node:assert/strict';
import {initSingleCardFlow,singleCardTurnFrames,singleCardSurfaceTransform} from './single-card-flow.js';

const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
class Element{
 constructor(name='div'){this.name=name;this.children=[];this.dataset={};this.hidden=false;this.listeners={};this.attributes={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.offsetHeight=120;this.scrollHeight=120;this.offsetWidth=220;this.inert=false;this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(name,value){this.attributes[name]=value;}
 toggleAttribute(name,value){if(value)this.attributes[name]='';else delete this.attributes[name];}
 hasAttribute(name){return name in this.attributes;}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 dispatch(type,event={}){for(const fn of this.listeners[type]||[])fn({...event,type});}
 setPointerCapture(id){this.capturedPointer=id;}
 hasPointerCapture(id){return this.capturedPointer===id;}
 releasePointerCapture(id){if(this.capturedPointer===id)this.capturedPointer=null;}
 focus(){globalThis.document.activeElement=this;this.dispatch('focus');}
 getBoundingClientRect(){return {left:180,top:190,width:220,height:377};}
 querySelector(selector){return this.selectors?.[selector]||null;}
 get lastElementChild(){return this.children.at(-1);}
 set innerHTML(value){
  if(!value.includes('single-card-object'))return;
  const card=new Element(),surface=new Element(),image=new Element('img'),actions=new Element(),button=new Element('button'),eyebrow=new Element('p'),hint=new Element('p'),note=new Element('details'),summary=new Element('summary'),label=new Element('span'),preview=new Element('span'),toggle=new Element('span'),quote=new Element('blockquote'),back=new Element('a');
  // The material renderer is tested separately; this DOM double has no canvas host.
  card.selectors={img:image,'.single-card-surface':surface};surface.selectors={img:image};actions.selectors={button,'.eyebrow':eyebrow,'.single-card-hint':hint,'.single-card-note':note};note.selectors={summary,'.single-card-note-label':label,'.single-card-note-preview':preview,'.single-card-note-toggle':toggle,blockquote:quote};back.append(new Element('span'),new Element('span'));
  this.selectors={'.single-card-object':card,'.single-card-actions':actions,'.single-card-return':back};
 }
}
function setup({reduced=true,decode=()=>Promise.resolve(),locale='en',unveilingFactory}={}){
 const body=new Element('body');body.dataset.view='choose';const stage=new Element(),choices=new Element(),random=new Element('button'),destination=new Element('img'),title=new Element('h1'),source=new Element('button');source.dataset.slot='0';choices.append(source);choices.selectors={'[data-slot="0"]':source};
 const animations=[],windowListeners={},documentListeners={},mediaListeners={};
 const dispatch=(registry,type,event={})=>{for(const listener of registry[type]||[])listener(event);};
 Element.prototype.animate=function(){let resolve,reject;const finished=new Promise((res,rej)=>{resolve=res;reject=rej;});const animation={finished,currentTime:0,cancel(){reject(new Error('cancelled'));},finish:resolve,pause(){},play(){}};animations.push(animation);return animation;};
 const document={body,documentElement:{lang:locale},createElement:name=>new Element(name),addEventListener(type,fn){(documentListeners[type]??=[]).push(fn);},querySelector:selector=>({'#motion-stage':stage,'#card-choices':choices,'#random-card':random,'#reading-image':destination,'#result-title':title}[selector]||null)};
 const window={OLIVIA_LOCALE:locale,location:{pathname:'/',search:''},visualViewport:null};
 Object.assign(globalThis,{document,window,innerWidth:1280,innerHeight:900,addEventListener(type,fn){(windowListeners[type]??=[]).push(fn);},matchMedia:query=>({matches:false,addEventListener(type,fn){(mediaListeners[query]??=[]).push(fn);}}),requestAnimationFrame:()=>1,cancelAnimationFrame(){},Image:class{naturalWidth=400;decode(){return decode();}}});
 let chosen=0,read=0;const announcements=[],record={cardId:0,cardName:'The Fool',question:'What can I begin?',deckId:'space-between'};
 const flow=initSingleCardFlow({assets:{back:'back.png',cards:['face.png'],deckId:'space-between'},motion:()=>null,reduced:()=>reduced,choose:()=>{chosen++;return record;},onRead:()=>{read++;body.dataset.view='reading';return destination;},announce:value=>announcements.push(value),unveilingFactory});
 const layer=body.children[0],card=layer.querySelector('.single-card-object'),image=card.querySelector('img'),actions=layer.querySelector('.single-card-actions'),button=actions.querySelector('button');
 return {flow,body,layer,card,surface:card.querySelector('.single-card-surface'),image,actions,button,animations,announcements,record,resize(){dispatch(windowListeners,'resize');},setReduced(value){reduced=value;dispatch(mediaListeners,'(prefers-reduced-motion: reduce)',{matches:value});},get chosen(){return chosen;},get read(){return read;}};
}

test('the single card has one uninterrupted edge-on turn and settles flat',()=>{
 const close=singleCardTurnFrames(),open=singleCardTurnFrames(true),angle=f=>Number(f.transform.match(/rotateY\((.*?)deg\)/)[1]),lift=f=>Number(f.transform.match(/translateY\((.*?)px\)/)[1]);
 assert.equal(angle(close[0]),0);assert.equal(angle(close.at(-1)),90);assert.equal(angle(open[0]),-90);assert.equal(angle(open.at(-1)),0);
 assert.equal(lift(close.at(-1)),lift(open[0]));assert.ok(lift(close.at(-1))<0);
 assert.ok(Math.abs((90-angle(close.at(-2)))-(angle(open[1])+90))<1e-8,'angular speed remains continuous at the swap');
 for(const frames of [close,open])for(let i=1;i<frames.length;i++)assert.ok(angle(frames[i])>=angle(frames[i-1]));
});

test('turning holds the same card for inspection; only Read my card opens the reading',async()=>{
 const x=setup();await x.flow.pick(0,true);assert.equal(x.body.dataset.singleState,'held');assert.equal(x.button.textContent,'Unveil my card');assert.equal(x.layer.dataset.deckId,'space-between');
 x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.image.src,'face.png');assert.equal(x.button.textContent,'Read my card');assert.equal(x.read,0);assert.equal(x.chosen,1);assert.equal(x.flow.busy,true);
 x.button.dispatch('click');await flush();assert.equal(x.read,1);assert.equal(x.chosen,1);assert.equal(x.layer.hidden,true);
});

test('an unreadable face leaves the back and allows a retry without a second draw',async()=>{
 let fails=true;const x=setup({decode:()=>fails?Promise.reject(new Error('offline')):Promise.resolve()});await x.flow.pick(0);
 x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'held');assert.equal(x.image.src,'back.png');assert.equal(x.button.disabled,false);assert.match(x.announcements.at(-1),/could not load/);assert.equal(x.read,0);
 fails=false;x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.chosen,1);
});

test('leaving while a face decodes never reveals or opens a stale card',async()=>{
 let ready;const x=setup({decode:()=>new Promise(resolve=>{ready=resolve;})});await x.flow.pick(0);x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'revealing');
 x.flow.cancel();ready();await flush();assert.equal(x.body.dataset.singleState,'idle');assert.equal(x.layer.hidden,true);assert.equal(x.image.src,'back.png');assert.equal(x.read,0);
});

test('leaving during extraction or the physical turn cancels the active animation',async()=>{
 const x=setup({reduced:false});const picking=x.flow.pick(0);assert.equal(x.body.dataset.singleState,'extracting');x.flow.cancel();await picking;assert.equal(x.layer.hidden,true);assert.equal(x.body.dataset.singleState,'idle');
 const pickingAgain=x.flow.pick(0);x.animations.at(-1).finish();await pickingAgain;x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'revealing');x.flow.cancel();await flush();assert.equal(x.body.dataset.singleState,'idle');assert.equal(x.layer.hidden,true);assert.equal(x.read,0);
});

test('Ukrainian controls leave a visitor’s question untouched',async()=>{
 const x=setup({locale:'uk'});await x.flow.pick(0);assert.equal(x.button.textContent,'Відкрити мою карту');
 const note=x.actions.querySelector('.single-card-note');assert.equal(note.querySelector('blockquote').textContent,'What can I begin?');
 x.button.dispatch('click');await flush();assert.equal(x.button.textContent,'Прочитати карту');assert.equal(x.read,0);
});


test('the hand surface bounds the lean and returns to a neutral card',()=>{
 assert.equal(singleCardSurfaceTransform(-5,8),singleCardSurfaceTransform(0,1));
 assert.match(singleCardSurfaceTransform(0,1),/rotateX\(-6deg\) rotateY\(-7deg\)/);
 assert.equal(singleCardSurfaceTransform(.5,.5,false),'perspective(1200px) translateZ(0px) rotateX(0deg) rotateY(0deg)');
});

test('touch explores the chosen card without changing its outer path or drawing again',async()=>{
 const x=setup({reduced:false});const picking=x.flow.pick(0);x.animations.at(-1).finish();await picking;
 const path=x.card.style.transform;
 x.card.dispatch('pointerdown',{pointerId:7,pointerType:'touch',button:0,clientX:350,clientY:470});
 x.card.dispatch('pointermove',{pointerId:7,pointerType:'touch',clientX:220,clientY:230});
 assert.match(x.surface.style.transform,/rotateX\([^0]/);assert.equal(x.card.style.transform,path);assert.equal(x.chosen,1);assert.equal(x.read,0);
 x.card.dispatch('pointerup',{pointerId:7,pointerType:'touch'});
 assert.equal(x.surface.style.transform,singleCardSurfaceTransform(.5,.5,false));assert.equal(x.surface.dataset.settling,'true');assert.equal(x.body.dataset.singleState,'held');
});

test('turning or cancelling releases the touch surface before the next physical motion',async()=>{
 const x=setup({reduced:false});const picking=x.flow.pick(0);x.animations.at(-1).finish();await picking;
 x.card.dispatch('pointermove',{pointerId:1,pointerType:'mouse',clientX:210,clientY:225});
 assert.notEqual(x.surface.style.transform,singleCardSurfaceTransform(.5,.5,false));
 x.button.dispatch('click');await flush();assert.equal(x.surface.style.transform,singleCardSurfaceTransform(.5,.5,false));
 x.flow.cancel();assert.equal(x.surface.style.transition,'none');assert.equal(x.layer.hidden,true);
});

test('reduced motion keeps the surface completely still while controls remain functional',async()=>{
 const x=setup();await x.flow.pick(0);const rest=x.surface.style.transform;
 x.card.dispatch('pointerdown',{pointerId:2,pointerType:'touch',button:0,clientX:220,clientY:230});
 x.card.dispatch('pointermove',{pointerId:2,pointerType:'touch',clientX:350,clientY:470});
 assert.equal(x.surface.style.transform,rest);assert.equal(x.animations.length,0);assert.equal(x.button.textContent,'Unveil my card');
 x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.read,0);
});

test('a physical tap on the held card reveals the same draw without opening its reading',async()=>{
 const x=setup();await x.flow.pick(0);
 const pointer={pointerId:1,pointerType:'touch',button:0,clientX:280,clientY:300};
 x.card.dispatch('pointerdown',pointer);x.card.dispatch('pointerup',pointer);x.card.dispatch('click',{detail:1});await flush();
 assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.image.src,'face.png');assert.equal(x.chosen,1);assert.equal(x.read,0);assert.equal(x.button.textContent,'Read my card');
});

test('exploring the held surface does not become a reveal when the pointer is released',async()=>{
 const x=setup({reduced:false}),picking=x.flow.pick(0);x.animations.at(-1).finish();await picking;
 x.card.dispatch('pointerdown',{pointerId:1,pointerType:'touch',button:0,clientX:280,clientY:300});
 x.card.dispatch('pointermove',{pointerId:1,pointerType:'touch',clientX:310,clientY:330});
 x.card.dispatch('pointerup',{pointerId:1,pointerType:'touch',clientX:310,clientY:330});
 x.card.dispatch('click',{detail:1});await flush();
 assert.equal(x.body.dataset.singleState,'held');assert.equal(x.image.src,'back.png');assert.equal(x.chosen,1);assert.equal(x.read,0);
});

test('reduced motion and a quick release still distinguish a drag from a tap',async()=>{
 for(const sendMove of [true,false]){
  const x=setup();await x.flow.pick(0);
  x.card.dispatch('pointerdown',{pointerId:1,pointerType:'touch',button:0,clientX:280,clientY:300});
  if(sendMove)x.card.dispatch('pointermove',{pointerId:1,pointerType:'touch',clientX:330,clientY:350});
  x.card.dispatch('pointerup',{pointerId:1,pointerType:'touch',clientX:330,clientY:350});
  x.card.dispatch('click',{detail:1});await flush();
  assert.equal(x.body.dataset.singleState,'held',sendMove?'reduced-motion drag must stay face down':'release displacement must count even without pointermove');
  assert.equal(x.image.src,'back.png');assert.equal(x.chosen,1);
 }
});

test('resizing during the fallback turn cannot strand the card with disabled controls',async()=>{
 const x=setup({reduced:false}),picking=x.flow.pick(0);x.animations.at(-1).finish();await picking;
 x.button.dispatch('click');await flush();assert.equal(x.body.dataset.singleState,'revealing');
 x.resize();await flush();
 // Let any replacement/remaining half of the physical turn finish.
 for(let i=0;i<3;i++){x.animations.at(-1).finish();await flush();}
 assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.button.disabled,false);assert.equal(x.actions.hidden,false);assert.equal(x.image.src,'face.png');assert.equal(x.read,0);
});

test('enabling reduced motion midway through the fallback turn completes without another animation',async()=>{
 const x=setup({reduced:false}),picking=x.flow.pick(0);x.animations.at(-1).finish();await picking;
 x.button.dispatch('click');await flush();const before=x.animations.length;
 x.setReduced(true);await flush();
 assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.animations.length,before);assert.equal(x.button.disabled,false);assert.equal(x.image.src,'face.png');assert.equal(x.chosen,1);assert.equal(x.read,0);
});

test('the click following a reduced-motion fan selection does not also unveil the held card',async()=>{
 const x=setup();x.card.dataset.slot='0';
 x.card.dispatch('pointerenter',{pointerType:'mouse',clientX:280,clientY:300});await flush();
 assert.equal(x.body.dataset.singleState,'hover');
 const pointer={pointerId:1,pointerType:'touch',button:0,clientX:280,clientY:300};
 x.card.dispatch('pointerdown',pointer);x.card.dispatch('pointerup',pointer);await flush();
 assert.equal(x.body.dataset.singleState,'held');assert.equal(x.chosen,1);
 x.card.dispatch('click',{detail:1});await flush();
 assert.equal(x.body.dataset.singleState,'held');assert.equal(x.image.src,'back.png');assert.equal(x.chosen,1);assert.equal(x.read,0);
});

test('fresh and restored cards start from a neutral origin while current-card touch still guides its reveal',async()=>{
 for(const nextCard of ['pick','restore']){
  let pointer=[.46,.62];const origins=[];
  const x=setup({reduced:false,unveilingFactory:()=>({
   touch(x,y){pointer=[x,y];},cancel(){},
   reveal(){origins.push([...pointer]);return Promise.resolve(false);}
  })});
  let picking=x.flow.pick(0,true);x.animations.at(-1).finish();await picking;
  x.card.dispatch('pointermove',{pointerId:1,pointerType:'mouse',clientX:213,clientY:491.6});
  x.button.dispatch('click');await flush();
  assert.ok(Math.abs(origins[0][0]-.15)<1e-8&&Math.abs(origins[0][1]-.8)<1e-8,'the active card must open from its own latest touch');
  x.flow.cancel();
  if(nextCard==='pick'){
   picking=x.flow.pick(0,true);x.animations.at(-1).finish();await picking;
  }else x.flow.restoreHeld(x.record,0);
  // A keyboard/button activation should not inherit a previous card’s corner.
  x.button.dispatch('click');await flush();
  assert.deepEqual(origins[1],[.46,.62]);
  assert.equal(x.chosen,nextCard==='pick'?2:1);assert.equal(x.read,0);
  x.flow.cancel();
 }
});

test('skip during image decoding shows the same card immediately once its artwork is ready',async()=>{
 let ready;const x=setup({reduced:false,decode:()=>new Promise(resolve=>{ready=resolve;})});
 x.flow.restoreHeld(x.record,0);x.button.dispatch('click');await flush();
 const skip=x.layer.children.find(child=>child.className==='single-card-skip quiet-link');
 assert.equal(skip.hidden,false);skip.dispatch('click');ready();await flush();
 assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.image.src,'face.png');assert.equal(x.read,0);assert.equal(skip.hidden,true);
 assert.equal(x.animations.length,0,'skip must not replace the shader with an obligatory turn');
});

test('skip cancels an active material opening and never starts a fallback turn',async()=>{
 let release;const x=setup({reduced:false,unveilingFactory:()=>({touch(){},cancel(){release?.(false);},reveal(){return new Promise(resolve=>{release=resolve;});}})});
 x.flow.restoreHeld(x.record,0);x.button.dispatch('click');await flush();
 const skip=x.layer.children.find(child=>child.className==='single-card-skip quiet-link');skip.dispatch('click');await flush();
 assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.image.src,'face.png');assert.equal(x.animations.length,0);assert.equal(x.read,0);
});

test('repeat reveals shorten the material passage without redrawing or auto-opening the reading',async()=>{
 const durations=[];const x=setup({reduced:false,unveilingFactory:()=>({touch(){},cancel(){},reveal(options){durations.push(options.duration);return Promise.resolve(false);}})});
 for(let i=0;i<2;i++){
  x.flow.restoreHeld(x.record,0);x.button.dispatch('click');await flush();
  x.animations.at(-1).finish();await flush();x.animations.at(-1).finish();await flush();
  assert.equal(x.body.dataset.singleState,'revealed');
 }
 assert.deepEqual(durations,[4200,1800]);assert.equal(x.read,0);
});

test('skip during the camera approach finishes its clock and cannot resume the cancelled reveal',async()=>{
 let release,approach;const x=setup({reduced:false,unveilingFactory:()=>({touch(){},cancel(){release?.(false);},reveal(options){approach=options.onStart();return new Promise(resolve=>{release=resolve;});}})});
 x.flow.restoreHeld(x.record,0);x.button.dispatch('click');await flush();assert.equal(x.animations.length,1);
 x.layer.children.find(child=>child.className==='single-card-skip quiet-link').dispatch('click');await flush();await approach;await flush();
 assert.equal(x.body.dataset.singleState,'revealed');assert.equal(x.image.src,'face.png');assert.equal(x.animations.length,1);assert.equal(x.read,0);
});
