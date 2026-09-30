/** Reading removal and undo stage all related local stores, then commit with rollback. */
import {ReadingError,STORAGE_KEY,loadRecords,saveRecord,removeRecord,getLastRecord} from './core.js';
import {SPREAD_STORAGE_KEY,loadSpreadRecords,saveSpreadRecord,removeSpreadRecord,getLastSpreadRecord} from './spread-core.js';
import {METADATA_KEY,DAILY_KEY,DRAFT_KEY,loadMetadata,removeMetadata,saveMetadata,loadDraft,clearDraft,saveDraft,loadDailyEntries,removeDailyReferences,restoreDailyReferences} from './practice-core.js';
import {MEMORY_KEY,loadMemories,removeMemory,restoreMemory} from './living-deck.js';
import {QUESTION_HISTORY_KEY,loadQuestionHistory,removeReadingReferences,restoreReadingReferences} from './question-history.js';
import {KEEPSAKE_STORAGE_KEY,loadReadingKeepsakes,removeReadingKeepsake,restoreReadingKeepsakes,validateReadingKeepsakes} from './reading-keepsake.js';
const fail=message=>{throw new ReadingError('VALIDATION',message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const readKeepsakes=storage=>{try{return loadReadingKeepsakes(storage);}catch(cause){throw new ReadingError(cause.code||'STORAGE_CORRUPT','Your kept words could not be read. Existing data is unchanged.',cause);}};
const identity=(kind,id)=>{if(!['single','spread'].includes(kind)||typeof id!=='string'||!id.trim()||id.length>128)fail('Choose a saved reading.');};
function stage(storage,kind){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function')throw new ReadingError('STORAGE_UNAVAILABLE','This browser could not change your almanac.');
 const keys=[kind==='single'?STORAGE_KEY:SPREAD_STORAGE_KEY,METADATA_KEY,MEMORY_KEY,QUESTION_HISTORY_KEY,...(kind==='single'?[DAILY_KEY,DRAFT_KEY,KEEPSAKE_STORAGE_KEY]:[])];let previous;
 try{previous=new Map(keys.map(key=>[key,storage.getItem(key)]));}catch(cause){throw new ReadingError('STORAGE_UNAVAILABLE','This browser could not open your almanac.',cause);}
 const values=new Map(previous),memory={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.set(key,null)};
 (kind==='single'?loadRecords:loadSpreadRecords)(memory);loadMetadata(memory);loadMemories(memory);loadQuestionHistory(memory);if(kind==='single'){loadDailyEntries(memory);loadDraft(memory);readKeepsakes(memory);}
 return {keys,previous,values,memory};
}
function commit(storage,{keys,previous,values}){
 for(const key of keys)if(storage.getItem(key)!==previous.get(key))throw new ReadingError('STORAGE_CHANGED','Your almanac changed. Please try again.');
 const written=[];try{for(const key of keys){const value=values.get(key);if(value===previous.get(key))continue;if(value===null)storage.removeItem(key);else storage.setItem(key,value);written.push(key);}}
 catch(cause){let recovered=true;for(const key of written.reverse())try{const value=previous.get(key);if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{recovered=false;}
  throw new ReadingError(recovered?'REMOVAL_WRITE_FAILED':'REMOVAL_RECOVERY_NEEDED',recovered?'The change could not be saved. Your previous almanac was restored.':'The browser interrupted the change and recovery. Download a recovery copy and keep your current browser data.',cause);
 }
}
/** Optional record preserves an unsaved row for undo. Its draw must match any saved source. */
export function removeReadingAndPractice(storage,kind,id,record){
 identity(kind,id);const staged=stage(storage,kind),s=staged.memory,records=(kind==='single'?loadRecords:loadSpreadRecords)(s),saved=records.find(value=>value.id===id)||null;
 let restoredRecord=saved;if(record){if(record.id!==id)fail('The reading does not match this removal.');restoredRecord=(kind==='single'?getLastRecord:getLastSpreadRecord)([record]);if(saved)(kind==='single'?saveRecord:saveSpreadRecord)(s,restoredRecord);}
 const result={kind,id,record:restoredRecord,metadata:removeMetadata(s,kind,id),memory:removeMemory(s,kind,id),questionReferences:removeReadingReferences(s,kind,id),daily:[],currentDraft:null,keepsakes:[]};
 if(kind==='single'){result.keepsakes=loadReadingKeepsakes(s).filter(entry=>entry.readingId===id);removeReadingKeepsake(s,id);result.daily=removeDailyReferences(s,id);const draft=loadDraft(s);if(draft?.id===id){result.currentDraft=draft;clearDraft(s,id);}}
 (kind==='single'?removeRecord:removeSpreadRecord)(s,id);commit(storage,staged);return result;
}
/** Undo merges into current stores and rejects conflicts; it never rewinds unrelated work. */
export function restoreReadingAndPractice(storage,snapshot){
 if(!snapshot)return null;const {kind,id}=snapshot;identity(kind,id);const staged=stage(storage,kind),s=staged.memory;
 if(snapshot.record){if(snapshot.record.id!==id)fail('The reading does not match this restore.');const existing=(kind==='single'?loadRecords:loadSpreadRecords)(s).find(v=>v.id===id);if(existing&&!same(existing,snapshot.record))throw new ReadingError('RESTORE_CONFLICT','This reading has changed since removal. Your current almanac is unchanged.');(kind==='single'?saveRecord:saveSpreadRecord)(s,snapshot.record);}
 for(const [field,load,save] of [['metadata',loadMetadata,saveMetadata],['memory',loadMemories,restoreMemory]])if(snapshot[field]){
  const value=snapshot[field];if(value.kind!==kind||value.id!==id)fail('A restored note does not match this reading.');const existing=load(s).find(v=>v.kind===kind&&v.id===id);if(existing&&!same(existing,value))throw new ReadingError('RESTORE_CONFLICT','A note has changed since removal. Your current almanac is unchanged.');save(s,value);
 }
 if(snapshot.questionReferences){if(snapshot.questionReferences.kind!==kind||snapshot.questionReferences.id!==id)fail('The question links do not match this reading.');restoreReadingReferences(s,snapshot.questionReferences);}
 if(kind==='single'){
  // Older undo snapshots have no keepsakes. Validate before committing any store.
  let kept;try{kept=validateReadingKeepsakes(snapshot.keepsakes??[]);}catch{fail('The kept words in this restore are invalid.');}
  if(kept.some(entry=>entry.readingId!==id))fail('The kept words do not match this reading.');
  if(kept.length){
   const current=loadReadingKeepsakes(s);
   for(const entry of kept){const prior=current.find(value=>value.readingId===entry.readingId&&value.deckId===entry.deckId&&value.cardId===entry.cardId);if(prior&&!same(prior,entry))throw new ReadingError('RESTORE_CONFLICT','Your kept words have changed since removal. Your current almanac is unchanged.');}
   restoreReadingKeepsakes(s,kept);
  }
  if(!Array.isArray(snapshot.daily)||snapshot.daily.some(v=>v?.record?.id!==id))fail('The held days do not match this reading.');restoreDailyReferences(s,snapshot.daily);
  if(snapshot.currentDraft){if(snapshot.currentDraft.id!==id)fail('The draft does not match this reading.');const current=loadDraft(s);if(!current)saveDraft(s,snapshot.currentDraft);else if(current.id===id&&!same(current,snapshot.currentDraft))throw new ReadingError('RESTORE_CONFLICT','This draft has changed since removal. Your current almanac is unchanged.');}
 }
 commit(storage,staged);return snapshot;
}
