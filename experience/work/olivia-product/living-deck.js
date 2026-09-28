import {QUESTION_HISTORY_KEY,loadQuestionHistory,serializeQuestionHistory} from './question-history.js';
import {KEEPSAKE_STORAGE_KEY,loadReadingKeepsakes} from './reading-keepsake.js';
/** User-confirmed memories. Reading records and their original draws remain untouched. */
import {ReadingError,loadRecords,STORAGE_KEY} from './core.js';
import {loadSpreadRecords,SPREAD_STORAGE_KEY} from './spread-core.js';
import {loadMetadata,getMetadata,METADATA_KEY} from './practice-core.js';

export const MEMORY_KEY='olivia-arcana-card-memories-v1';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=message=>{throw new ReadingError('VALIDATION',message);};
const keyOf=(kind,id)=>JSON.stringify([kind,id]);
function identity(kind,id){if(!['single','spread'].includes(kind)||typeof id!=='string'||!id.trim()||id.length>128)fail('A saved reading is required.');return {kind,id};}
function validateMemory(value){
 if(!object(value))fail('A card memory must be an object.');
 const id=identity(value.kind,value.id);
 if(typeof value.meaningful!=='boolean'||!Array.isArray(value.associations))fail('This card memory is incomplete.');
 const seen=new Set(),associations=value.associations.map(a=>{
  if(!object(a)||!Number.isInteger(a.cardId)||a.cardId<0||a.cardId>77||seen.has(a.cardId)||typeof a.text!=='string'||!a.text.trim()||a.text.length>600)fail('A personal meaning must name one card and contain at most 600 characters.');
  seen.add(a.cardId);return {cardId:a.cardId,text:a.text.trim()};
 });
 return {...id,meaningful:value.meaningful,associations};
}
export function validateMemories(values){
 if(!Array.isArray(values))fail('Memories must be a list.');
 const entries=values.map(validateMemory),seen=new Set();
 for(const entry of entries){const key=keyOf(entry.kind,entry.id);if(seen.has(key))fail('A memory is duplicated.');seen.add(key);}
 return entries;
}
function storageReady(storage){if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw new ReadingError('STORAGE_UNAVAILABLE','Your browser could not open your memories.');}
export function loadMemories(storage){
 storageReady(storage);let raw;
 try{raw=storage.getItem(MEMORY_KEY);}catch(cause){throw new ReadingError('STORAGE_UNAVAILABLE','Your browser could not open your memories.',cause);}
 if(raw===null)return [];
 try{const value=JSON.parse(raw);if(!object(value)||value.schemaVersion!==1)fail('The memory format is not recognised.');return validateMemories(value.entries);}
 catch(cause){throw new ReadingError('STORAGE_CORRUPT','Your memories could not be opened. The saved data has not been changed.',cause);}
}
function write(storage,entries){
 const validated=validateMemories(entries);
 try{storage.setItem(MEMORY_KEY,JSON.stringify({schemaVersion:1,entries:validated}));}
 catch(cause){throw new ReadingError(cause?.name==='QuotaExceededError'||cause?.code===22?'STORAGE_QUOTA':'STORAGE_UNAVAILABLE','Your browser could not save this memory. Your previous memories are unchanged.',cause);}
 return validated;
}
export function getMemory(entries,kind,id){identity(kind,id);return validateMemories(entries).find(e=>e.kind===kind&&e.id===id)||{kind,id,meaningful:false,associations:[]};}
export function saveMemory(storage,value){
 if(!object(value))fail('A memory is required.');
 identity(value.kind,value.id);const entries=loadMemories(storage),entry=validateMemory({...getMemory(entries,value.kind,value.id),...value});
 const index=entries.findIndex(e=>e.kind===entry.kind&&e.id===entry.id);
 if(index<0)entries.push(entry);else entries[index]=entry;
 write(storage,entries);return entry;
}
export function removeMemory(storage,kind,id){
 identity(kind,id);const entries=loadMemories(storage),index=entries.findIndex(e=>e.kind===kind&&e.id===id);
 if(index<0)return null;const [removed]=entries.splice(index,1);write(storage,entries);return removed;
}
export function restoreMemory(storage,snapshot){return snapshot?saveMemory(storage,validateMemory(snapshot)):null;}

/** Each store is read independently; one corrupt store does not hide another. */
export function loadJourney(storage){
 const errors=[];let singles=[],spreads=[],metadata=[],memories=[];
 for(const [key,read,assign] of [[STORAGE_KEY,loadRecords,v=>singles=v],[SPREAD_STORAGE_KEY,loadSpreadRecords,v=>spreads=v],[METADATA_KEY,loadMetadata,v=>metadata=v],[MEMORY_KEY,loadMemories,v=>memories=v]]){
  try{assign(read(storage));}catch(error){errors.push({key,error});}
 }
 const entries=[...singles.map(record=>({kind:'single',record})),...spreads.map(record=>({kind:'spread',record}))].map(entry=>({
  ...entry,key:keyOf(entry.kind,entry.record.id),cardIds:entry.kind==='single'?[entry.record.cardId]:[...entry.record.cardIds],
  metadata:getMetadata(metadata,entry.kind,entry.record.id),memory:getMemory(memories,entry.kind,entry.record.id),
 })).sort((a,b)=>b.record.createdAt.localeCompare(a.record.createdAt)||a.key.localeCompare(b.key));
 return {entries,metadata,memories,errors};
}
export function topicTimeline(entries,topic=''){
 const selected=typeof topic==='string'?topic.trim().toLocaleLowerCase():'';
 return entries.filter(e=>!selected||e.metadata.topic.toLocaleLowerCase()===selected).slice().sort((a,b)=>a.record.createdAt.localeCompare(b.record.createdAt)||a.key.localeCompare(b.key));
}
export function cardHistory(entries,cardId){
 if(!Number.isInteger(cardId)||cardId<0||cardId>77)fail('Choose a card from 0 to 77.');
 return entries.filter(entry=>entry.cardIds.includes(cardId)).map(entry=>({...entry,association:entry.memory.associations.find(a=>a.cardId===cardId)?.text||''}));
}
export function saveAssociation(storage,{kind,id,cardId,text}){
 if(!Number.isInteger(cardId)||cardId<0||cardId>77||typeof text!=='string'||text.length>600)fail('A personal meaning must contain at most 600 characters.');
 const state=loadJourney(storage),journalKey=kind==='single'?STORAGE_KEY:SPREAD_STORAGE_KEY;
 const failure=state.errors.find(e=>e.key===journalKey||e.key===MEMORY_KEY);if(failure)throw failure.error;
 const entry=state.entries.find(e=>e.kind===kind&&e.record.id===id);
 if(!entry||!entry.cardIds.includes(cardId))fail('This card must belong to the saved reading.');
 const associations=entry.memory.associations.filter(a=>a.cardId!==cardId);
 if(text.trim())associations.push({cardId,text:text.trim()});
 return saveMemory(storage,{kind,id,associations});
}
/** Recovery copies preserve exact bytes, including malformed envelopes and unknown fields. */
export function exportJourneyRecovery(storage){
 storageReady(storage);const stores={};
 for(const key of [STORAGE_KEY,SPREAD_STORAGE_KEY,METADATA_KEY,MEMORY_KEY,QUESTION_HISTORY_KEY,KEEPSAKE_STORAGE_KEY]){
  try{stores[key]=storage.getItem(key);}catch(cause){throw new ReadingError('STORAGE_UNAVAILABLE','The browser could not prepare a recovery copy.',cause);}
 }
 return {format:'olivia-journey-recovery',schemaVersion:1,exportedAt:new Date().toISOString(),stores};
}
/** The same importable envelope as the almanac's main download, without unsaved drafts. */
export function exportJourneyBackup(storage){
 return {schemaVersion:1,oneCardReadings:{schemaVersion:1,records:loadRecords(storage)},guidedSpreads:{schemaVersion:1,records:loadSpreadRecords(storage)},practice:loadMetadata(storage),journey:{schemaVersion:1,entries:loadMemories(storage)},questionHistory:serializeQuestionHistory(loadQuestionHistory(storage)),keepsakes:{version:1,entries:loadReadingKeepsakes(storage)}};
}
/** Non-destructive import: conflicting readings must be reconciled explicitly elsewhere. */
export function mergeMemories(storage,envelope){
 if(!object(envelope)||envelope.schemaVersion!==1)fail('Choose a valid Olivia memory backup.');
 const incoming=validateMemories(envelope.entries),current=loadMemories(storage),keys=new Set(current.map(e=>keyOf(e.kind,e.id)));
 const additions=incoming.filter(e=>!keys.has(keyOf(e.kind,e.id)));
 if(additions.length)write(storage,[...current,...additions]);
 return {added:additions.length,kept:incoming.length-additions.length};
}
