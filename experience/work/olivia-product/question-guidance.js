import {loadRecords,saveRecord} from './core.js';
import {loadSpreadRecords,saveSpreadRecord} from './spread-core.js';
import {validateGuidance} from './saved-guidance.js';
import {readingSections,streamBlocks} from './reading-sections.js';
import {createReadingLoader} from './reading-loader.js';
/** Optional AI synthesis. A question is sent only after explicit consent for this reading. */
let availability;
const cache = new Map();
const requests = new Map();
const streams = new Map();
let choiceId = 0;
const mounted = new WeakMap();
export function unmountQuestionGuidance(container){
 mounted.get(container)?.();mounted.delete(container);
 container.querySelector('.question-guidance')?.remove();
}
const copy = {
 en:{
  choice:'A personal reading of my question',
  how:'How Olivia works',
  manualChoice:'Read these cards together for my question',
  choiceUnavailable:'Personal readings are unavailable here for now. You can still choose cards and explore their meanings.',
  title:'Your personal reading',
  provenance:'Prepared with AI for your question and the cards you chose. It can be mistaken; you decide what fits.',
  action:'Read my cards together ↗',
  checking:'Preparing your reading…',
  unavailable:'Your personal reading is unavailable right now. The meanings of your cards are still here.',
  noQuestion:'Begin with a question to receive a personal reading.',
  pending:'Finding the thread between your question and these cards…',
  failed:'Your personal reading could not be completed. Your cards and question are unchanged. Try again when you’re ready.',
  retry:'Try my reading again ↗',
  download:'Download my reading ↓',
  keep:'Keep my personal reading',
  kept:'Your personal reading is kept in your almanac on this device.',
  keepFailed:'This could not be saved. Download the reading to keep a copy.'
 },
 uk:{
  choice:'Особисте тлумачення мого запитання',
  how:'Як працює Olivia',
  manualChoice:'Пов’язати ці карти з моїм запитанням',
  choiceUnavailable:'Особисті тлумачення поки недоступні. Ви можете вибирати карти й досліджувати їхні значення.',
  title:'Ваше особисте читання',
  provenance:'Підготовлено за допомогою ШІ для вашого запитання й обраних карт. Тлумачення може помилятися; що вам підходить, вирішуєте ви.',
  action:'Прочитати мої карти разом ↗',
  checking:'Готуємо ваше читання…',
  unavailable:'Ваше особисте читання зараз недоступне. Значення ваших карт залишаються тут.',
  noQuestion:'Почніть із запитання, щоб отримати особисте читання.',
  pending:'Шукаємо зв’язок між вашим запитанням і цими картами…',
  failed:'Не вдалося завершити ваше особисте читання. Карти й запитання не змінилися. Спробуйте ще раз, коли будете готові.',
  retry:'Спробувати читання ще раз ↗',
  download:'Завантажити моє читання ↓',
  keep:'Зберегти моє особисте читання',
  kept:'Ваше особисте читання збережено в альманасі на цьому пристрої.',
  keepFailed:'Не вдалося зберегти. Завантажте читання, щоб мати копію.'
 }
};
export function guidancePayload(record,locale='en') {
 return {question:record.question,locale:locale==='uk'?'uk':'en',spreadId:record.spreadId||'single',...(record.readingPlan?{questionDirection:record.readingPlan.direction,originalQuestion:record.readingPlan.originalQuestion}:{}),cards:record.cardIds?record.cardIds.map((id,i)=>({id,orientation:record.orientations?.[i]||record.cards?.[i]?.orientation||'upright'})):[{id:record.cardId,orientation:record.orientation||'upright'}]};
}
async function isAvailable(){
 if(!availability)availability=fetch('/api/reading',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(r=>r?.available===true).catch(()=>false);
 return availability;
}
/** Mount before the draw. A GET checks availability; it carries no reading or question. */
export function mountGuidanceChoice(container, {locale=window.OLIVIA_LOCALE||'en'}={}) {
 container.querySelector('.guidance-choice')?.remove();
 const c=copy[locale]||copy.en, element=document.createElement('div');
 element.className='guidance-choice';element.dataset.noTranslate='true';
 const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');
 input.type='checkbox';input.checked=false;input.disabled=true;input.id=`guidance-choice-${++choiceId}`;
 label.htmlFor=input.id;text.textContent=c.choice;label.append(input,text);
 const more=document.createElement('a');more.className='guidance-how';more.href='#method';more.textContent=c.how;
 const status=document.createElement('p');status.className='guidance-choice-status privacy-note';status.setAttribute('role','status');status.textContent=c.checking;
 element.append(label,more,status);container.append(element);
 let available=false,destroyed=false;
 const ready=isAvailable().then(value=>{
  if(destroyed)return false;
  available=value;input.disabled=!value;
  if(!value)input.checked=false;
  status.textContent=value?'':c.choiceUnavailable;status.hidden=value;
  return value;
 });
 return {element,input,ready,getConsent:()=>available&&input.checked===true,
  setConsent:value=>{input.checked=value===true;},reset:()=>{input.checked=false;},
  destroy:()=>{destroyed=true;input.checked=false;element.remove();}};
}
/**
 * Read the service's NDJSON stream: "text" pieces as they are written, then
 * "done" with the complete reading, or "error". Only "done" returns a reading;
 * anything else rejects, and the page discards what it showed.
 */
export async function readGuidanceStream(body,onText=()=>{}){
 const reader=body.getReader(),decoder=new TextDecoder();
 let buffer='',text='',finished=null;
 const handle=line=>{
  if(!line.trim())return;
  let event;try{event=JSON.parse(line);}catch{throw Error('The reading arrived damaged.');}
  if(event.type==='text'&&typeof event.text==='string'){text+=event.text;onText(text);}
  else if(event.type==='done'){if(event.source!=='ai'||typeof event.synthesis!=='string'||!event.synthesis.trim())throw Error('No interpretation');finished=event.synthesis;}
  else if(event.type==='error')throw Error(event.code||'The reading could not be completed.');
 };
 try{
  while(finished===null){
   const {value,done}=await reader.read();
   if(done)break;
   buffer+=decoder.decode(value,{stream:true});
   for(let end=buffer.indexOf('\n');end>=0&&finished===null;end=buffer.indexOf('\n')){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);handle(line);}
  }
  if(finished===null){buffer+=decoder.decode();handle(buffer);}
 }catch(error){reader.cancel().catch(()=>{});throw error;}
 finally{try{reader.releaseLock();}catch{}}
 if(finished===null)throw Error('The reading stopped before it was complete.');
 return finished;
}
/** Keep consent at the network boundary too, and share a pending request, and its text so far, across remounts. */
export async function requestQuestionGuidance(payload, {consent=false,onText}={}) {
 if(consent!==true)throw new Error('Consent is required for this reading.');
 const key=JSON.stringify(payload);
 if(cache.has(key))return cache.get(key);
 const listen=()=>{const stream=streams.get(key);if(!stream||typeof onText!=='function')return;stream.listeners.add(onText);if(stream.text)onText(stream.text);};
 if(requests.has(key)){listen();try{return await requests.get(key);}finally{streams.get(key)?.listeners.delete(onText);}}
 const stream={text:'',listeners:new Set()};streams.set(key,stream);listen();
 const pending=(async()=>{
  // Ask for the reading as it is written; a service that cannot stream answers with JSON.
  const canStream=typeof ReadableStream==='function'&&typeof TextDecoder==='function';
  const response=await fetch('/api/reading',{method:'POST',headers:{'Content-Type':'application/json',...(canStream?{Accept:'application/x-ndjson, application/json'}:{})},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error(String(response.status));
  let synthesis;
  if(canStream&&/application\/x-ndjson/.test(response.headers?.get?.('content-type')||'')&&response.body?.getReader){
   synthesis=await readGuidanceStream(response.body,text=>{stream.text=text;for(const listener of stream.listeners){try{listener(text);}catch{}}});
  }else{
   const answer=await response.json();
   if(answer.source!=='ai'||typeof answer.synthesis!=='string'||!answer.synthesis.trim())throw Error('No interpretation');
   synthesis=answer.synthesis;
  }
  cache.set(key,synthesis);
  return synthesis;
 })();
 requests.set(key,pending);
 try{return await pending;}finally{if(requests.get(key)===pending){requests.delete(key);streams.delete(key);}}
}
export function mountQuestionGuidance(container, record, {locale=window.OLIVIA_LOCALE||'en',autoRequest=false,onState,onResult,showActions=true}={}) {
 unmountQuestionGuidance(container);
 if(!record)return;
 const c=copy[locale]||copy.en, section=document.createElement('section');section.className='question-guidance';section.dataset.noTranslate='true';
 let reportedState,restoreLoaderFocus=false;
 const loader=createReadingLoader({locale});loader.element.tabIndex=-1;
 mounted.set(container,()=>loader.stop());
 const reportState=(state,context={})=>{if(section.isConnected&&state!==reportedState){reportedState=state;section.dataset.state=state;if(typeof onState==='function')onState(state,context);}};
 const make=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
 const title=make('h3',c.title,'guidance-kicker'),disclosure=make('a',c.how,'guidance-how');disclosure.href='#method';
 disclosure.hidden=autoRequest===true;
 const button=make('button',c.action,'solid-action');button.type='button';button.disabled=true;
 const status=make('p',record.question?.trim()?c.checking:c.noQuestion,'guidance-status');status.setAttribute('role','status');
 const result=make('div','','guidance-result');result.hidden=true;
 const optional=make('details','','guidance-disclosure'),summary=make('summary',c.manualChoice),body=make('div','','guidance-disclosure-body');
 body.append(disclosure,button,status);optional.append(summary,body);
 if(autoRequest===true)section.append(title,button,status,result);
 else{section.classList.add('is-optional');section.append(optional,result);}
 container.prepend(section);
 if(!record.question?.trim()){button.hidden=true;disclosure.hidden=true;reportState('idle');return;}
 const payload=guidancePayload(record,locale),key=JSON.stringify(payload);
 function show(text,kept=false,savedGuidance){
  if(!section.isConnected)return;
  const guidance=validateGuidance(savedGuidance||{source:'ai',locale:payload.locale,synthesis:text,createdAt:new Date().toISOString()});
  const hadFocus=document.activeElement===loader.element||(restoreLoaderFocus&&document.activeElement===document.body);
  restoreLoaderFocus=false;loader.stop();section.removeAttribute('aria-busy');
  // The reading names its source where it is read, as the method page promises.
  section.classList.remove('is-optional');section.replaceChildren(title,make('p',c.provenance,'guidance-provenance'),status,result);
  result.replaceChildren();
  const composed=readingSections(text,locale);
  if(composed.lead){const lead=make('p',composed.lead,'guidance-lead');if(composed.lead.split(/\s+/).length>50)lead.classList.add('is-long');result.append(lead);}
  const readingBody=make('div','','guidance-body');
  for(const part of composed.sections){
   const chapter=make('section','',`guidance-chapter${part.kind==='next-step'?' guidance-next-step':''}`);
   chapter.append(make('h4',part.title));
   for(const paragraph of part.paragraphs)chapter.append(make('p',paragraph));
   readingBody.append(chapter);
  }
  if(readingBody.childElementCount)result.append(readingBody);
  result.hidden=false;status.textContent='';button.hidden=true;
  const actions=make('div','','guidance-actions');
  const download=make('button',c.download,'quiet-link');download.type='button';
  download.onclick=()=>{
   const url=URL.createObjectURL(new Blob([JSON.stringify({question:record.question,cards:payload.cards,source:'ai',synthesis:text,locale:payload.locale},null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download='olivia-interpretation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const keep=make('button',kept?c.kept:c.keep,'solid-action');keep.type='button';keep.disabled=kept;
  keep.onclick=()=>{
   try{
    const spread=!!record.spreadId;
    const prior=(spread?loadSpreadRecords(localStorage):loadRecords(localStorage)).find(v=>v.id===record.id);
    const noteInput=document.querySelector(spread?'#spread-reflection':'#reflection');
    const saved={...(prior||record),note:noteInput?.value??record.note,guidance,updatedAt:new Date().toISOString()};
    (spread?saveSpreadRecord:saveRecord)(localStorage,saved);keep.textContent=c.kept;keep.disabled=true;
    dispatchEvent(new CustomEvent('olivia:guidance-save',{detail:saved}));dispatchEvent(new Event('olivia:journal-change'));
   }catch{status.textContent=c.keepFailed;}
  };
  if(showActions){actions.append(keep,download);result.append(actions);
   const method=make('a',c.how,'guidance-how guidance-result-method');method.href='#method';result.append(method);}
  // Share only the in-memory result. Persistence still requires an explicit Keep action.
  if(section.isConnected&&typeof onResult==='function')onResult({...guidance});
  reportState('ready',{focused:hadFocus});
  if(hadFocus){title.tabIndex=-1;title.focus?.({preventScroll:true});}
 }

 try{const saved=(record.spreadId?loadSpreadRecords(localStorage):loadRecords(localStorage)).find(v=>v.id===record.id)?.guidance;if(saved?.locale===payload.locale){show(saved.synthesis,true,saved);return;}}catch{}
 if(cache.has(key)){show(cache.get(key));return;}
 let requesting=false;
 // A streamed reading: complete paragraphs appear as they are written, with the AI label from the first one.
 let streamBody=null,streamChapter=null,streamCount=0;
 const resetStream=()=>{streamBody=null;streamChapter=null;streamCount=0;delete section.dataset.streamed;};
 function progress(text){
  if(!section.isConnected)return;
  const blocks=streamBlocks(text);
  if(blocks.length<=streamCount)return;
  if(!streamBody){
   restoreLoaderFocus=document.activeElement===loader.element;
   loader.stop();section.dataset.streamed='true';
   section.classList.remove('is-optional');section.replaceChildren(title,make('p',c.provenance,'guidance-provenance'),status,result);
   status.textContent='';result.replaceChildren();result.hidden=false;
   streamBody=make('div','','guidance-body');result.append(streamBody);
  }
  for(const block of blocks.slice(streamCount)){
   if(block.kind==='lead'){const lead=make('p',block.text,'guidance-lead');if(block.text.split(/\s+/).length>50)lead.classList.add('is-long');result.insertBefore(lead,streamBody);}
   else if(block.kind==='heading'){streamChapter=make('section','','guidance-chapter');streamChapter.append(make('h4',block.text));streamBody.append(streamChapter);}
   else{if(!streamChapter){streamChapter=make('section','','guidance-chapter');streamBody.append(streamChapter);}streamChapter.append(make('p',block.text));}
  }
  streamCount=blocks.length;
 }
 function beginPending(){
  resetStream();
  section.classList.remove('is-optional');section.replaceChildren(loader.element);
  loader.start();section.setAttribute('aria-busy','true');reportState('pending');
 }
 function showError(message,retry=true){
  const hadFocus=document.activeElement===loader.element||(restoreLoaderFocus&&document.activeElement===document.body);
  resetStream();
  restoreLoaderFocus=false;loader.stop();section.removeAttribute('aria-busy');
  section.classList.remove('is-optional');section.replaceChildren(title,status,button);
  status.textContent=message;button.textContent=c.retry;button.hidden=!retry;button.disabled=!retry;
  reportState('error',{focused:hadFocus});
  if(hadFocus){title.tabIndex=-1;title.focus?.({preventScroll:true});}
 }
 async function request(){
  if(requesting||!section.isConnected)return;
  requesting=true;beginPending();
  try{
   const synthesis=await requestQuestionGuidance(payload,{consent:true,onText:progress});
   if(!section.isConnected)return;
   // Already on the page: the finished reading replaces the paragraphs without arriving again.
   if(streamBody)show(synthesis);
   else{restoreLoaderFocus=document.activeElement===loader.element;if(await loader.finish()&&section.isConnected)show(synthesis);}
  }catch{if(section.isConnected)showError(c.failed);}
  finally{requesting=false;section.removeAttribute('aria-busy');}
 }
 button.addEventListener('click',request);
 // A remount joins an already consented request; it never sends a new question by itself.
 if(requests.has(key)){request();return;}
 if(autoRequest===true)beginPending();
 isAvailable().then(available=>{
  if(!section.isConnected)return;
  if(autoRequest===true){if(available)request();else showError(c.unavailable,false);return;}
  button.disabled=!available;button.hidden=!available;disclosure.hidden=!available;status.textContent=available?'':c.unavailable;
  reportState('idle');
 });
}
