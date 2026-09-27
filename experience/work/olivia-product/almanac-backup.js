import {QUESTION_HISTORY_KEY,loadQuestionHistory,mergeQuestionHistoryEntries} from './question-history.js';
import {STORAGE_KEY,loadRecords,MAX_RECORDS,ReadingError} from './core.js';
import {SPREAD_STORAGE_KEY,loadSpreadRecords,MAX_SPREAD_RECORDS} from './spread-core.js';
import {METADATA_KEY,loadMetadata} from './practice-core.js';
import {MEMORY_KEY,loadMemories} from './living-deck.js';
import {getLocale} from './locale.js';

const specs=[
 {key:STORAGE_KEY,field:'records',read:loadRecords,limit:MAX_RECORDS,id:v=>v.id},
 {key:SPREAD_STORAGE_KEY,field:'records',read:loadSpreadRecords,limit:MAX_SPREAD_RECORDS,id:v=>v.id},
 {key:METADATA_KEY,field:'entries',read:loadMetadata,id:v=>JSON.stringify([v.kind,v.id])},
 {key:MEMORY_KEY,field:'entries',read:loadMemories,id:v=>JSON.stringify([v.kind,v.id])},
 {key:QUESTION_HISTORY_KEY,field:'threads',read:loadQuestionHistory,id:v=>v.id},
];
const fail=message=>{throw new ReadingError('BACKUP_INVALID',message);};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const memoryStorage=map=>({getItem:key=>map.get(key)??null,setItem:()=>{throw new Error('Validation is read-only');}});
const empty=field=>({schemaVersion:1,[field]:[]});

/** Validate every entry before exposing an import. Existing IDs always win. */
export function prepareAlmanacImport(storage,raw){
 if(typeof raw!=='string'||raw.length>8*1024*1024)fail('Choose an Olivia JSON backup smaller than 8 MB.');
 let value;try{value=JSON.parse(raw);}catch{fail('This file is not valid JSON.');}
 if(!object(value)||value.schemaVersion!==1||!object(value.oneCardReadings)||!object(value.guidedSpreads)||!Array.isArray(value.practice))fail('Choose a complete Olivia almanac backup.');
 const source=new Map([
  [STORAGE_KEY,JSON.stringify(value.oneCardReadings)],
  [SPREAD_STORAGE_KEY,JSON.stringify(value.guidedSpreads)],
  [METADATA_KEY,JSON.stringify({schemaVersion:1,entries:value.practice})],
  [MEMORY_KEY,JSON.stringify(value.journey??empty('entries'))],
  [QUESTION_HISTORY_KEY,JSON.stringify(value.questionHistory??empty('threads'))],
 ]);
 const incoming=specs.map(spec=>spec.read(memoryStorage(source)));
 const previous=new Map(specs.map(spec=>[spec.key,storage.getItem(spec.key)]));
 const current=specs.map(spec=>spec.read(memoryStorage(previous)));
 const conflicting=new Set();
 for(let i=0;i<2;i++)for(const record of incoming[i]){
  const prior=current[i].find(v=>v.id===record.id);if(!prior)continue;
  const fields=i===0?['createdAt','question','intention','cardId','orientation','source']:['createdAt','question','intention','spreadId','cardIds','readingPlan'];
  if(fields.some(key=>JSON.stringify(prior[key])!==JSON.stringify(record[key])) || i===1 && JSON.stringify(prior.cards.map(({cardId,orientation,positionId,label})=>({cardId,orientation,positionId,label})))!==JSON.stringify(record.cards.map(({cardId,orientation,positionId,label})=>({cardId,orientation,positionId,label}))))conflicting.add(JSON.stringify([i===0?'single':'spread',record.id]));
 }
 if(conflicting.size)fail('This backup contains reading identifiers that belong to different questions or draws. No data was imported.');
 let added=0,kept=0;const merged=incoming.map((list,i)=>{
  if(i===4)return mergeQuestionHistoryEntries(current[i],list);
  const spec=specs[i],ids=new Set(current[i].map(spec.id)),add=list.filter(v=>!ids.has(spec.id(v)));
  if(i<2){added+=add.length;kept+=list.length-add.length;}
  if(spec.limit&&add.length+current[i].length>spec.limit)fail('This backup exceeds the available space in your almanac. Export and organise your saved readings first.');
  return [...current[i],...add];
 });
 // Imported metadata must refer to a reading, and personal meanings to its actual cards.
 const readings=new Map([...incoming[0].map(v=>[JSON.stringify(['single',v.id]),[v.cardId]]),...incoming[1].map(v=>[JSON.stringify(['spread',v.id]),v.cardIds])]);
 for(let i=2;i<4;i++)for(const entry of incoming[i]){
  const cards=readings.get(JSON.stringify([entry.kind,entry.id]));
  if(!cards||i===3&&entry.associations.some(a=>!cards.includes(a.cardId)))fail('A personal note does not match its saved reading. No data was imported.');
 }
 const originalReadings=new Map([...incoming[0].map(v=>[JSON.stringify(['single',v.id]),v]),...incoming[1].map(v=>[JSON.stringify(['spread',v.id]),v])]);
 for(const thread of incoming[4])for(const link of thread.readings){
  const original=originalReadings.get(JSON.stringify([link.kind,link.id]));
  const expected=original&&{question:original.question,createdAt:original.createdAt,cardIds:link.kind==='single'?[original.cardId]:original.cardIds,orientations:link.kind==='single'?[original.orientation]:original.cards.map(c=>c.orientation)};
  if(!original||JSON.stringify(link.snapshot)!==JSON.stringify(expected))fail('A question history does not match its saved reading. No data was imported.');
 }
 const next=new Map(specs.map((spec,i)=>[spec.key,JSON.stringify({schemaVersion:1,[spec.field]:merged[i]})]));
 return {added,kept,memories:incoming[3].length,previous,next};
}

/** Reject stale previews. Roll back completed writes if a browser quota interrupts import. */
export function applyAlmanacImport(storage,plan){
 if(!(plan?.previous instanceof Map)||!(plan?.next instanceof Map))fail('Preview the backup before importing it.');
 for(const spec of specs)if(storage.getItem(spec.key)!==plan.previous.get(spec.key))throw new ReadingError('BACKUP_CHANGED','Your almanac changed. Please select the backup again.');
 const written=[];
 try{for(const spec of specs){storage.setItem(spec.key,plan.next.get(spec.key));written.push(spec.key);}}
 catch(cause){let restored=true;for(const key of written.reverse())try{const old=plan.previous.get(key);if(old===null)storage.removeItem(key);else storage.setItem(key,old);}catch{restored=false;}
  throw new ReadingError(restored?'BACKUP_WRITE_FAILED':'BACKUP_RECOVERY_NEEDED',restored?'Import could not be saved. Your previous almanac was restored.':'The browser interrupted import and recovery. Keep your backup file; do not clear browser data.',cause);
 }
 return {added:plan.added,kept:plan.kept};
}

export function initAlmanacImport(container,{onImported=()=>{}}={}){
 const uk=getLocale()==='uk';container.dataset.noTranslate='true';
 const pick=document.createElement('button');pick.type='button';pick.className='quiet-link';pick.textContent=uk?'Імпортувати резервну копію ↑':'Import a backup ↑';
 const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
 const panel=document.createElement('div');panel.className='backup-panel';panel.hidden=true;
 const status=document.createElement('p');status.className='backup-status';status.setAttribute('role','status');
 const errorText=error=>uk?(error.code==='BACKUP_CHANGED'?'Альманах змінився. Оберіть файл ще раз.':error.code==='BACKUP_RECOVERY_NEEDED'?'Браузер перервав імпорт і відновлення. Збережіть файл резервної копії та не очищуйте дані браузера.':'Не вдалося імпортувати копію. Перевірте файл і вільне місце в браузері. Наявні записи не було замінено.'):error.message;
 pick.addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const selected=file.files?.[0];if(!selected)return;panel.replaceChildren();panel.hidden=true;status.textContent='';
  try{if(selected.size>8*1024*1024)fail('Choose a backup smaller than 8 MB.');const plan=prepareAlmanacImport(localStorage,await selected.text());
   const copy=document.createElement('p');copy.textContent=uk?`Нових записів: ${plan.added}. Наявних: ${plan.kept}. Наявні записи й нотатки збережуться без змін. Файл залишається на цьому пристрої.`:`${plan.added} new readings. ${plan.kept} already here. Existing readings and notes will be kept as they are. This file stays on your device.`;
   const confirm=document.createElement('button');confirm.type='button';confirm.className='solid-action';confirm.textContent=uk?'Імпортувати записи':'Import readings';
   const cancel=document.createElement('button');cancel.type='button';cancel.className='quiet-link';cancel.textContent=uk?'Скасувати':'Cancel';cancel.onclick=()=>{panel.hidden=true;};
   confirm.onclick=()=>{try{confirm.disabled=true;const result=applyAlmanacImport(localStorage,plan);panel.hidden=true;onImported();dispatchEvent(new Event('olivia:journal-change'));status.textContent=uk?`Імпортовано нових записів: ${result.added}.`:`Imported ${result.added} new readings. Your almanac is ready.`;}catch(error){status.textContent=errorText(error);confirm.disabled=false;}};
   panel.append(copy,confirm,cancel);panel.hidden=false;
  }catch(error){status.textContent=errorText(error);}finally{file.value='';}
 });container.append(pick,file,panel,status);
}
