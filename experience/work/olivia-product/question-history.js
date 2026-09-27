/** Explicit, device-local question histories. Linking and dated observations never edit a reading. */
import {ReadingError,loadRecords} from './core.js';
import {loadSpreadRecords} from './spread-core.js';
import {getLocale} from './locale.js';
import {localDate} from './practice-core.js';

export const QUESTION_HISTORY_KEY='olivia-arcana-question-history-v1';
export const MAX_QUESTION_THREADS=150;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=message=>{throw new ReadingError('VALIDATION',message);};
const conflict=()=>{throw new ReadingError('QUESTION_HISTORY_CONFLICT','This question history has conflicting saved entries. Nothing was replaced.');};
const keyOf=v=>JSON.stringify([v.kind,v.id]);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const text=(value,label,max,required=false)=>{if(typeof value!=='string'||value.length>max||required&&!value.trim())fail(`${label} is invalid.`);return value;};
function uuid(value){if(typeof value!=='string'||!/^([a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12})$/i.test(value))fail('A stable question identifier is required.');return value.toLowerCase();}
function newId(){if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();if(!globalThis.crypto?.getRandomValues)fail('This browser cannot create a private question identifier.');const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
function timestamp(value){if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)fail('A valid date and time is required.');return value;}
function date(value){if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value)||value.slice(0,4)==='0000'||!Number.isFinite(Date.parse(value+'T12:00:00.000Z'))||new Date(value+'T12:00:00.000Z').toISOString().slice(0,10)!==value)fail('Use a valid calendar date.');return value;}
function identity(kind,id){if(!['single','spread'].includes(kind))fail('A saved reading type is required.');return {kind,id:text(id,'Reading identifier',128,true)};}
function snapshot(value,kind){
 if(!object(value)||!Array.isArray(value.cardIds)||!Array.isArray(value.orientations))fail('A reading snapshot is required.');
 const cardIds=[...value.cardIds],orientations=[...value.orientations];
 if(!cardIds.length||cardIds.length>(kind==='single'?1:8)||kind==='single'&&cardIds.length!==1||new Set(cardIds).size!==cardIds.length||cardIds.some(id=>!Number.isInteger(id)||id<0||id>77)||orientations.length!==cardIds.length||orientations.some(o=>!['upright','reversed'].includes(o)))fail('The reading snapshot has invalid cards.');
 return {question:text(value.question,'Question',1600),createdAt:timestamp(value.createdAt),cardIds,orientations};
}
function reading(value){if(!object(value))fail('A reading link is required.');return {...identity(value.kind,value.id),linkedAt:timestamp(value.linkedAt),snapshot:snapshot(value.snapshot,value.kind)};}
function update(value){
 if(!object(value))fail('A dated observation is required.');
 const result={id:uuid(value.id),createdAt:timestamp(value.createdAt),date:date(value.date),tried:text(value.tried,'What I tried',1000),happened:text(value.happened,'What happened',2000),understood:text(value.understood,'What I understand now',2000)};
 if(![result.tried,result.happened,result.understood].some(s=>s.trim()))fail('Write at least one observation.');return result;
}
function unique(values,key,label){const ids=new Set();for(const value of values){const id=key(value);if(ids.has(id))fail(`A ${label} is duplicated.`);ids.add(id);}return values;}
function thread(value){
 if(!object(value)||!Array.isArray(value.readings)||!Array.isArray(value.updates)||value.readings.length>300||value.updates.length>300)fail('This question history is invalid or full.');
 return {id:uuid(value.id),title:text(value.title,'History title',240,true).trim(),createdAt:timestamp(value.createdAt),readings:unique(value.readings.map(reading),keyOf,'reading link'),updates:unique(value.updates.map(update),v=>v.id,'observation')};
}
export function validateQuestionHistory(values){if(!Array.isArray(values)||values.length>MAX_QUESTION_THREADS)fail('The question history list is invalid or full.');return unique(values.map(thread),v=>v.id,'question history');}
export function serializeQuestionHistory(threads){return {schemaVersion:1,threads:validateQuestionHistory(threads)};}
function storageReady(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new ReadingError('STORAGE_UNAVAILABLE','The browser could not open your question histories.');}
export function loadQuestionHistory(storage){
 storageReady(storage);let raw;try{raw=storage.getItem(QUESTION_HISTORY_KEY);}catch(cause){throw new ReadingError('STORAGE_UNAVAILABLE','The browser could not open your question histories.',cause);}if(raw===null)return [];
 try{const envelope=JSON.parse(raw);if(!object(envelope)||envelope.schemaVersion!==1)fail('The question history format is not recognised.');return validateQuestionHistory(envelope.threads);}catch(cause){throw new ReadingError('STORAGE_CORRUPT','Your question histories could not be opened. The original data is untouched.',cause);}
}
function write(storage,threads){const envelope=serializeQuestionHistory(threads);try{storage.setItem(QUESTION_HISTORY_KEY,JSON.stringify(envelope));}catch(cause){throw new ReadingError(['QuotaExceededError','NS_ERROR_DOM_QUOTA_REACHED'].includes(cause?.name)||[22,1014].includes(cause?.code)?'STORAGE_QUOTA':'STORAGE_UNAVAILABLE','Your question history could not be saved. Previous entries are unchanged.',cause);}return envelope.threads;}
function savedReading(storage,kind,id,now){
 identity(kind,id);const record=(kind==='single'?loadRecords(storage):loadSpreadRecords(storage)).find(v=>v.id===id);if(!record)fail('Save this reading before adding it to a question history.');
 return reading({kind,id,linkedAt:now,snapshot:{question:record.question,createdAt:record.createdAt,cardIds:kind==='single'?[record.cardId]:record.cardIds,orientations:kind==='single'?[record.orientation||'upright']:record.cards.map(c=>c.orientation||'upright')}});
}
export function createQuestionThread(storage,{title,kind,id,threadId=newId(),now=new Date().toISOString()}){
 const threads=loadQuestionHistory(storage),created=thread({id:threadId,title,createdAt:now,readings:[savedReading(storage,kind,id,now)],updates:[]});if(threads.some(v=>v.id===created.id))conflict();write(storage,[...threads,created]);return created;
}
export function linkQuestionReading(storage,{threadId,kind,id,now=new Date().toISOString()}){
 const threads=loadQuestionHistory(storage),entry=threads.find(v=>v.id===uuid(threadId));if(!entry)fail('Choose an existing question history.');
 const linked=savedReading(storage,kind,id,now),prior=entry.readings.find(v=>keyOf(v)===keyOf(linked));if(prior){if(!same(prior.snapshot,linked.snapshot))conflict();return entry;}
 entry.readings.push(linked);write(storage,threads);return entry;
}
export function appendQuestionUpdate(storage,{threadId,date:day=localDate(),tried='',happened='',understood='',id=newId(),now=new Date().toISOString()}){
 const threads=loadQuestionHistory(storage),entry=threads.find(v=>v.id===uuid(threadId));if(!entry)fail('Choose an existing question history.');
 const added=update({id,createdAt:now,date:day,tried,happened,understood});if(entry.updates.some(v=>v.id===added.id))conflict();entry.updates.push(added);write(storage,threads);return added;
}
/** One write removes references only; the user's question and observations remain. */
export function removeReadingReferences(storage,kind,id){
 identity(kind,id);const threads=loadQuestionHistory(storage),links=[];for(const entry of threads){const index=entry.readings.findIndex(v=>v.kind===kind&&v.id===id);if(index>=0){const [reading]=entry.readings.splice(index,1);links.push({threadId:entry.id,index,reading});}}
 if(links.length)write(storage,threads);return {kind,id,links};
}
export function restoreReadingReferences(storage,value){
 if(!value)return null;if(!object(value)||!Array.isArray(value.links))fail('A question history restore snapshot is required.');identity(value.kind,value.id);
 const threads=loadQuestionHistory(storage),seen=new Set();for(const link of value.links){if(!object(link)||!Number.isInteger(link.index)||link.index<0||seen.has(link.threadId))fail('A question history restore link is invalid.');seen.add(link.threadId);const id=uuid(link.threadId),ref=reading(link.reading);if(ref.kind!==value.kind||ref.id!==value.id)fail('The restored reading does not match.');const entry=threads.find(v=>v.id===id);if(!entry)conflict();const prior=entry.readings.find(v=>keyOf(v)===keyOf(ref));if(prior&&!same(prior,ref))conflict();if(!prior)entry.readings.splice(Math.min(link.index,entry.readings.length),0,ref);}
 if(value.links.length)write(storage,threads);return value;
}
/** Pure union used by backup previews; same IDs with different content are never silently replaced. */
export function mergeQuestionHistoryEntries(current,incoming){
 const result=validateQuestionHistory(current),source=validateQuestionHistory(incoming);for(const entry of source){const prior=result.find(v=>v.id===entry.id);if(!prior){result.push(entry);continue;}if(prior.title!==entry.title||prior.createdAt!==entry.createdAt)conflict();for(const [field,key] of [['readings',keyOf],['updates',v=>v.id]])for(const value of entry[field]){const found=prior[field].find(v=>key(v)===key(value));if(found&&!same(found,value))conflict();if(!found)prior[field].push(value);}}
 return validateQuestionHistory(result);
}
export function mergeQuestionHistory(storage,envelope){if(!object(envelope)||envelope.schemaVersion!==1)fail('Choose a valid question history backup.');const current=loadQuestionHistory(storage),merged=mergeQuestionHistoryEntries(current,envelope.threads);if(!same(current,merged))write(storage,merged);return merged;}

const COPY={
 en:{continue:'Continue this question',intro:'Connect the readings you choose, then keep dated notes on what you try and discover.',choose:'A question history',new:'Start a new question history',title:'Give this question a name',titleHint:'e.g. Finding a direction I can trust',create:'Start this history',connect:'Connect this reading',saved:'This reading is connected. Earlier readings and notes are unchanged.',error:'This could not be saved. Your writing is still here; earlier entries are unchanged. Try again or download a backup.',corrupt:'Your saved question histories could not be opened. Download a recovery copy before changing browser data.',linked:'Connected to',open:'Open question history ↗',empty:'Start with one saved reading. Only the readings you choose will belong to this history.',all:'Your question histories',reading:'A reading to start with',addReading:'Connect another saved reading',readingPlaceholder:'Choose a saved reading',noReadings:'Save a reading to begin a question history.',noMore:'All your saved readings are already connected.',when:'Date',tried:'What I tried',happened:'What happened',understood:'What I understand now',append:'Keep a dated observation',observationIntro:'Fill in what matters today. Each save adds an entry; earlier words stay as you wrote them.',keep:'Add this observation',observationSaved:'A new dated observation is kept.',required:'Write in at least one of the three fields.',untitled:'An open reading',start:'Started',readingDate:'Reading from',linkedDate:'Connected',observation:'Observation',missing:'This reading is no longer in the almanac. Its original question and cards remain here.',openReading:'Open reading ↗',cardCount:'cards',historyEmpty:'Your history has room for what happens next.',noLinks:'The linked readings were removed. Your observations are still here.',topics:'Browse saved readings by topic',topicHint:'Topics help you browse. They do not connect readings into a question history.',unsaved:'Your observation has unsaved changes.',private:'Only on this device. You choose what belongs together.'},
 uk:{continue:'Продовжити це запитання',intro:'Поєднайте обрані вами читання й додавайте датовані нотатки про свої кроки та відкриття.',choose:'Історія запитання',new:'Почати нову історію запитання',title:'Назвіть це запитання',titleHint:'Наприклад: Знайти напрям, якому я довіряю',create:'Почати цю історію',connect:'Додати це читання',saved:'Читання додано. Попередні читання й нотатки не змінилися.',error:'Не вдалося зберегти. Ваш текст залишається тут, а попередні записи не змінилися. Спробуйте ще раз або завантажте резервну копію.',corrupt:'Не вдалося відкрити історії запитань. Перш ніж змінювати дані браузера, завантажте копію для відновлення.',linked:'Додано до',open:'Відкрити історію запитання ↗',empty:'Почніть зі збереженого читання. До цієї історії належатимуть лише читання, які ви оберете.',all:'Ваші історії запитань',reading:'Читання для початку',addReading:'Додати ще одне збережене читання',readingPlaceholder:'Оберіть збережене читання',noReadings:'Збережіть читання, щоб почати історію запитання.',noMore:'Усі збережені читання вже додано.',when:'Дата',tried:'Що я спробував / спробувала',happened:'Що сталося',understood:'Що я розумію тепер',append:'Додати датоване спостереження',observationIntro:'Заповніть те, що важливо сьогодні. Кожне збереження додає запис — попередні слова залишаться вашими.',keep:'Додати це спостереження',observationSaved:'Нове датоване спостереження збережено.',required:'Запишіть щось хоча б в одному з трьох полів.',untitled:'Відкрите читання',start:'Початок',readingDate:'Читання від',linkedDate:'Додано',observation:'Спостереження',missing:'Цього читання вже немає в альманасі. Його початкове запитання й карти залишаються тут.',openReading:'Відкрити читання ↗',cardCount:'карт',historyEmpty:'У цій історії є місце для того, що буде далі.',noLinks:'Пов’язані читання видалено. Ваші спостереження залишаються тут.',topics:'Переглянути збережені читання за темою',topicHint:'Теми допомагають переглядати читання, але не поєднують їх в історію запитання.',unsaved:'У спостереженні є незбережені зміни.',private:'Лише на цьому пристрої. Ви вирішуєте, що поєднати.'}
};
export const questionHistoryCopy=(locale=getLocale())=>COPY[locale==='uk'?'uk':'en'];
const node=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
const field=(label,tag='input')=>{const wrap=node('label','qh-field'),input=node(tag);wrap.append(node('span','',label),input);return {wrap,input};};
const notify=()=>globalThis.dispatchEvent?.(new Event('olivia:question-history-change'));
export const questionHistoryHref=id=>'#journey?story='+encodeURIComponent(uuid(id));
/** A progressive disclosure mounted by both one-card and spread follow-up views. */
export function mountQuestionHistoryControl({kind,record,container,storage=()=>localStorage,beforeSave,onChange=()=>{}}){
 container.querySelector('.qh-reading-control')?.remove();if(!record?.id)return null;const c=questionHistoryCopy(),getStorage=()=>typeof storage==='function'?storage():storage;
 const details=node('details','qh-reading-control');details.dataset.noTranslate='true';details.append(node('summary','',c.continue));const content=node('div','qh-control-content'),status=node('p','qh-status');status.setAttribute('role','status');details.append(content,status);container.append(details);
 function paint(){
  content.replaceChildren();let threads;try{threads=loadQuestionHistory(getStorage());}catch{status.textContent=c.corrupt;return;}content.append(node('p','qh-help',c.intro));
  const connected=threads.filter(v=>v.readings.some(r=>r.kind===kind&&r.id===record.id));for(const entry of connected){const a=node('a','qh-story-link',c.linked+': '+entry.title+' ↗');a.href=questionHistoryHref(entry.id);content.append(a);}
  const form=node('form','qh-connect-form'),choice=field(c.choose,'select'),title=field(c.title);choice.input.append(new Option(c.new,''));for(const entry of threads.filter(v=>!connected.some(vv=>vv.id===v.id)))choice.input.append(new Option(entry.title,entry.id));title.input.type='text';title.input.maxLength=240;title.input.required=true;title.input.placeholder=c.titleHint;title.input.value=(record.question||'').slice(0,240);
  const submit=node('button','qh-primary',c.create);submit.type='submit';choice.input.addEventListener('change',()=>{title.wrap.hidden=!!choice.input.value;title.input.required=!choice.input.value;submit.textContent=choice.input.value?c.connect:c.create;});form.append(choice.wrap,title.wrap,submit);content.append(form,node('p','qh-fineprint',c.private));
  form.addEventListener('submit',event=>{event.preventDefault();try{beforeSave?.();const entry=choice.input.value?linkQuestionReading(getStorage(),{threadId:choice.input.value,kind,id:record.id}):createQuestionThread(getStorage(),{title:title.input.value,kind,id:record.id});paint();status.textContent=c.saved;const a=node('a','qh-story-link',c.open);a.href=questionHistoryHref(entry.id);status.append(a);notify();onChange(entry);}catch{status.textContent=c.error;}});
 }
 paint();return details;
}

/** Calendar order, then actual save time: a same-day observation follows its reading. */
export function questionHistoryEvents(thread,calendarDay=date=>localDate(new Date(date))){
 return [...thread.readings.map(reading=>({type:'reading',date:calendarDay(reading.linkedAt),at:reading.linkedAt,reading})),...thread.updates.map(update=>({type:'update',date:update.date,at:update.createdAt,update}))].sort((a,b)=>a.date.localeCompare(b.date)||a.at.localeCompare(b.at));
}
