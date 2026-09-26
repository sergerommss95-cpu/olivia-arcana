import {loadRecords,saveRecord} from './core.js';
import {loadSpreadRecords,saveSpreadRecord} from './spread-core.js';
import {validateGuidance} from './saved-guidance.js';
/** Explicit, optional AI synthesis. Never sends notes, history or questions on mount. */
let availability;
const cache = new Map();
const copy = {
 en:{title:'Your question, in context',description:'Connect these cards to the situation you described.',consent:'When you choose this, your question, its original wording (if you refined it), selected cards and spread positions are sent to our AI provider. Your journal notes and other readings are not sent. AI can make mistakes; use this as a reflection, not a prediction.',action:'Interpret my question ↗',checking:'Checking availability…',unavailable:'Question-specific AI is currently unavailable. The card reflections remain available below.',noQuestion:'Add a question before drawing to explore it with AI.',pending:'Reading your question alongside the cards…',failed:'The interpretation could not be completed. Your cards and question are unchanged. Please try again.',retry:'Try again ↗',label:'AI-assisted interpretation',download:'Download this interpretation ↓',keep:'Keep this reading and interpretation',kept:'Reading and interpretation kept in your almanac on this device.',keepFailed:'This could not be saved. Download the interpretation to keep a copy.'},
 uk:{title:'Ваше запитання в контексті',description:'Подивіться, як ці карти пов’язані з описаною ситуацією.',consent:'Після натискання ваше запитання, його початкове формулювання (якщо ви його уточнили), вибрані карти та їхні позиції буде надіслано постачальнику ШІ. Нотатки й інші читання не надсилаються. ШІ може помилятися: це привід для роздумів, а не передбачення.',action:'Осмислити моє запитання ↗',checking:'Перевіряємо доступність…',unavailable:'Тлумачення запитань за допомогою ШІ зараз недоступне. Нижче залишаються значення ваших карт.',noQuestion:'Щоб звернутися до ШІ, додайте запитання перед вибором карт.',pending:'Осмислюємо ваше запитання разом із картами…',failed:'Не вдалося завершити тлумачення. Ваші карти й запитання не змінилися. Спробуйте ще раз.',retry:'Спробувати ще раз ↗',label:'Тлумачення за допомогою ШІ',download:'Завантажити тлумачення ↓',keep:'Зберегти читання й тлумачення',kept:'Читання й тлумачення збережено в альманасі на цьому пристрої.',keepFailed:'Не вдалося зберегти. Завантажте тлумачення, щоб мати копію.'}
};
export function guidancePayload(record,locale='en') {
 return {question:record.question,locale:locale==='uk'?'uk':'en',spreadId:record.spreadId||'single',...(record.readingPlan?{questionDirection:record.readingPlan.direction,originalQuestion:record.readingPlan.originalQuestion}:{}),cards:record.cardIds?record.cardIds.map((id,i)=>({id,orientation:record.orientations?.[i]||record.cards?.[i]?.orientation||'upright'})):[{id:record.cardId,orientation:record.orientation||'upright'}]};
}
async function isAvailable(){
 if(!availability)availability=fetch('/api/reading',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(r=>r?.available===true).catch(()=>false);
 return availability;
}
export function mountQuestionGuidance(container, record, {locale=window.OLIVIA_LOCALE||'en'}={}) {
 container.querySelector('.question-guidance')?.remove();
 if(!record)return;
 const c=copy[locale]||copy.en, section=document.createElement('section');section.className='question-guidance';section.dataset.noTranslate='true';
 const make=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
 const title=make('h3',c.title),description=make('p',c.description),disclosure=make('p',c.consent,'privacy-note');
 const button=make('button',c.action,'solid-action');button.type='button';button.disabled=true;
 const status=make('p',record.question?.trim()?c.checking:c.noQuestion,'guidance-status');status.setAttribute('role','status');
 const result=make('div','','guidance-result');result.hidden=true;
 section.append(title,description,disclosure,button,status,result);container.prepend(section);
 if(!record.question?.trim()){button.hidden=true;disclosure.hidden=true;return;}
 const payload=guidancePayload(record,locale),key=JSON.stringify(payload);
 function show(text,kept=false){result.replaceChildren(make('p',c.label,'eyebrow'));for(const paragraph of text.split(/\n\s*\n/))result.append(make('p',paragraph));result.hidden=false;status.textContent='';button.hidden=true;const download=make('button',c.download,'quiet-link');download.type='button';download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({question:record.question,cards:payload.cards,source:'ai',synthesis:text,locale:payload.locale},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='olivia-interpretation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};result.append(download);
 const keep=make('button',kept?c.kept:c.keep,'solid-action');keep.type='button';keep.disabled=kept;
 keep.onclick=()=>{try{const guidance=validateGuidance({source:'ai',locale:payload.locale,synthesis:text,createdAt:new Date().toISOString()});const spread=!!record.spreadId;const prior=(spread?loadSpreadRecords(localStorage):loadRecords(localStorage)).find(v=>v.id===record.id);const noteInput=document.querySelector(spread?'#spread-reflection':'#reflection');const saved={...(prior||record),note:noteInput?.value??record.note,guidance,updatedAt:new Date().toISOString()};(spread?saveSpreadRecord:saveRecord)(localStorage,saved);keep.textContent=c.kept;keep.disabled=true;dispatchEvent(new CustomEvent('olivia:guidance-save',{detail:saved}));dispatchEvent(new Event('olivia:journal-change'));}catch{status.textContent=c.keepFailed;}};result.append(keep);
 }
 try{const saved=(record.spreadId?loadSpreadRecords(localStorage):loadRecords(localStorage)).find(v=>v.id===record.id)?.guidance;if(saved?.locale===payload.locale){show(saved.synthesis,true);return;}}catch{}
 if(cache.has(key)){show(cache.get(key));return;}
 isAvailable().then(available=>{if(!section.isConnected)return;button.disabled=!available;status.textContent=available?'':c.unavailable;});
 button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent=c.pending;
  try{
   const response=await fetch('/api/reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw Error(String(response.status));
   const answer=await response.json();
   if(answer.source!=='ai'||typeof answer.synthesis!=='string'||!answer.synthesis.trim())throw Error('No interpretation');
   cache.set(key,answer.synthesis);if(section.isConnected)show(answer.synthesis);
  }catch{if(section.isConnected){status.textContent=c.failed;button.textContent=c.retry;button.disabled=false;}}
 });
}
