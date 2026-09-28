import {mountCardMaterial} from './card-material.js';
import {mountReadingKeepsake} from './reading-keepsake.js';

/** The same material and personal words continue from the held card into a reading. */
export function mountReadingTouch({record,assets,locale='en',reduced=()=>false,getText}){
 const page=document.querySelector('#reading-view'),holder=document.querySelector('#reveal-card'),image=document.querySelector('#reading-image');
 const uk=locale==='uk';
 page.dataset.readingDeck=record.deckId||'olivia';
 const material=mountCardMaterial(holder,{image,getDeckId:()=>record.deckId||'olivia',reduced,enabled:true});
 const controls=document.createElement('div');controls.className='reading-touch-controls';controls.dataset.noTranslate='true';
 const button=document.createElement('button');button.type='button';button.className='reading-light-action';
 button.textContent=uk?'Пограти зі світлом':'Explore the light';
 const hint=document.createElement('p');hint.textContent=uk?'Або проведіть пальцем по карті.':'Or brush your finger across the card.';
 controls.append(button,hint);holder.after(controls);
 let frame=0,dead=false,active=true,keepsake=null,lastTime=0;
 function stop(){cancelAnimationFrame(frame);frame=0;material.touch(.5,.5,false);button.removeAttribute('aria-pressed');}
 function play(){
  if(!active||dead)return;
  stop();if(reduced())return;
  button.setAttribute('aria-pressed','true');lastTime=performance.now();
  const tick=now=>{
   if(dead||!active||document.hidden){stop();return;}
   const p=Math.min(1,(now-lastTime)/3400),ease=p*p*(3-2*p);
   material.touch(.18+.65*ease,.62-.27*Math.sin(ease*Math.PI),true);
   if(p<1)frame=requestAnimationFrame(tick);else stop();
  };frame=requestAnimationFrame(tick);
 }
 button.addEventListener('click',play);
 const interrupt=()=>{if(frame)stop();};holder.addEventListener('pointerdown',interrupt);
 const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
 const mq=matchMedia('(prefers-reduced-motion: reduce)');
 const syncMotion=()=>{controls.hidden=reduced();if(reduced())stop();};mq.addEventListener('change',syncMotion);syncMotion();
 const arrival=new MutationObserver(()=>{material.setActive(active&&!document.body.classList.contains('single-reading-arrival'));material.refresh();});
 arrival.observe(document.body,{attributes:true,attributeFilter:['class']});
 const host=document.createElement('div');host.id='single-keepsake';host.hidden=true;
 document.querySelector('#save-section').before(host);
 function setState(state='idle',updated=record){
  if(dead)return;
  record=updated;
  active=state!=='pending';material.setActive(active&&!document.body.classList.contains('single-reading-arrival'));
  controls.hidden=!active||reduced();
  if(!active){host.hidden=true;stop();return;}
  if(!record.id){host.hidden=true;return;}
  if(keepsake)keepsake.update({record,getText,assets,locale});
  else keepsake=mountReadingKeepsake(host,{record,getText,assets,locale});
 }
 return {setState,destroy(){dead=true;stop();arrival.disconnect();material.destroy();keepsake?.destroy();controls.remove();host.remove();holder.removeEventListener('pointerdown',interrupt);document.removeEventListener('visibilitychange',visibility);mq.removeEventListener('change',syncMotion);}};
}
