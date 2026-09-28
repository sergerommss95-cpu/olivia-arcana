import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY,loadRecords,createSession,chooseCard,createRecord,saveRecord} from './core.js';
import {SPREAD_STORAGE_KEY,loadSpreadRecords,createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord} from './spread-core.js';
import {METADATA_KEY,DAILY_KEY,DRAFT_KEY,saveMetadata,loadMetadata,saveDaily,loadDaily,loadDailyEntries,saveDraft,loadDraft,restoreDailyReferences} from './practice-core.js';
import {MEMORY_KEY,saveMemory,loadMemories} from './living-deck.js';
import {QUESTION_HISTORY_KEY,createQuestionThread,appendQuestionUpdate,loadQuestionHistory} from './question-history.js';
import {KEEPSAKE_STORAGE_KEY,saveReadingKeepsake,loadReadingKeepsakes} from './reading-keepsake.js';
import {removeReadingAndPractice,restoreReadingAndPractice} from './reading-removal.js';
const NOW='2026-09-25T10:00:00.000Z',THREAD='001a0427-c913-4d6d-a7af-1247227a679b',UPDATE='001a0427-c913-4d6d-a7af-1247227a679c';
const ALL=[STORAGE_KEY,SPREAD_STORAGE_KEY,METADATA_KEY,MEMORY_KEY,QUESTION_HISTORY_KEY,DAILY_KEY,DRAFT_KEY,KEEPSAKE_STORAGE_KEY];
function storage(){const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
const bytes=s=>ALL.map(k=>s.getItem(k));
function record(id='same',cardId=0){const session=chooseCard(createSession({question:'What can I try?',intention:'open'},[cardId]),0);return {...createRecord(session,{number:cardId,name:'A saved card'},{meaning:'Notice.',prompt:'What next?',practice:'Try.'}),id,createdAt:NOW,updatedAt:NOW};}
function spread(){const def={id:'clarity3',count:3,name:'Three',positions:[{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}]};let s=createSpreadSession({spreadId:'clarity3',count:3,question:'What next?'},[0,1,2]);for(let i=0;i<3;i++)s=selectSpreadCard(s,i);s=revealAll(s);return {...createSpreadRecord(s,def,{cards:s.cardIds.map((cardId,i)=>({cardId,positionId:def.positions[i].id,label:def.positions[i].label,meaning:'Notice.',prompt:'What next?',practice:'Try.'})),synthesis:{paragraphs:['Look again.'],prompt:'Notice?'}}),id:'same',createdAt:NOW,updatedAt:NOW};}
function setup(){const s=storage(),one=record();saveRecord(s,one);saveRecord(s,record('another',1));saveSpreadRecord(s,spread());saveMetadata(s,{kind:'single',id:'same',topic:'Work',nextStep:'Call',outcome:'Listened'});saveMetadata(s,{kind:'spread',id:'same',topic:'Home'});saveMemory(s,{kind:'single',id:'same',meaningful:true});saveDaily(s,one,'2026-09-24');saveDaily(s,one,'2026-09-25');saveDaily(s,record('another',1),'2026-09-23');saveDraft(s,{...one,note:'A private draft'});createQuestionThread(s,{title:'My direction',kind:'single',id:'same',threadId:THREAD,now:NOW});appendQuestionUpdate(s,{threadId:THREAD,id:UPDATE,now:NOW,date:'2026-09-25',happened:'A useful conversation'});saveReadingKeepsake(s,{record:one,text:'A sentence from this reading.'});saveReadingKeepsake(s,{record:record('another',1),text:'Another sentence to keep.'});return s;}

test('removal clears journal, matching daily copies, current draft and references; undo restores them',()=>{
 const s=setup(),before=bytes(s),thread=loadQuestionHistory(s)[0],removed=removeReadingAndPractice(s,'single','same');
 assert.deepEqual(loadRecords(s).map(v=>v.id),['another']);assert.deepEqual(loadReadingKeepsakes(s).map(v=>v.readingId),['another']);assert.equal(removed.keepsakes[0].readingId,'same');assert.equal(loadSpreadRecords(s)[0].id,'same');assert.deepEqual(loadMetadata(s).map(v=>v.kind),['spread']);assert.equal(loadMemories(s).length,0);assert.equal(loadDaily(s,'2026-09-24'),null);assert.equal(loadDaily(s,'2026-09-25'),null);assert.equal(loadDailyEntries(s).length,1);assert.equal(loadDraft(s),null);assert.equal(loadQuestionHistory(s)[0].readings.length,0);assert.deepEqual(loadQuestionHistory(s)[0].updates,thread.updates);
 restoreReadingAndPractice(s,removed);assert.deepEqual(loadQuestionHistory(s)[0],thread);assert.deepEqual(new Set(loadRecords(s).map(v=>v.id)),new Set(['same','another']));assert.equal(loadDraft(s).note,'A private draft');assert.equal(loadDailyEntries(s).length,3);assert.equal(loadMetadata(s).find(v=>v.kind==='single').outcome,'Listened');assert.equal(loadMemories(s)[0].meaningful,true);assert.equal(loadReadingKeepsakes(s).length,2);assert.equal(loadReadingKeepsakes(s).find(v=>v.readingId==='same').text,'A sentence from this reading.');
 const restored=bytes(s);restoreReadingAndPractice(s,removed);assert.deepEqual(bytes(s),restored,'a repeated undo is idempotent');assert.equal(s.getItem(SPREAD_STORAGE_KEY),before[1]);
});

test('an interrupted delete rolls every completed write back to the original bytes',()=>{
 for(const failedKey of [STORAGE_KEY,METADATA_KEY,MEMORY_KEY,QUESTION_HISTORY_KEY,DAILY_KEY,DRAFT_KEY,KEEPSAKE_STORAGE_KEY]){
  const s=setup(),before=bytes(s),set=s.setItem;let failed=false;s.setItem=(key,value)=>{if(key===failedKey&&!failed){failed=true;throw new DOMException('Full','QuotaExceededError');}set(key,value);};
  assert.throws(()=>removeReadingAndPractice(s,'single','same'),e=>e.code==='REMOVAL_WRITE_FAILED');assert.deepEqual(bytes(s),before,failedKey);
 }
});

test('an interrupted undo restores the post-delete bytes, including stores initially absent',()=>{
 const s=setup(),removed=removeReadingAndPractice(s,'single','same'),before=bytes(s),set=s.setItem;let failed=false;s.setItem=(key,value)=>{if(key===DAILY_KEY&&!failed){failed=true;throw Error('Blocked');}set(key,value);};assert.throws(()=>restoreReadingAndPractice(s,removed),e=>e.code==='REMOVAL_WRITE_FAILED');assert.deepEqual(bytes(s),before);
});

test('a failed rollback reports that recovery is needed instead of claiming nothing changed',()=>{
 const s=setup(),set=s.setItem;let writes=0;s.setItem=(key,value)=>{if(++writes>1)throw Error('Blocked persistently');set(key,value);};assert.throws(()=>removeReadingAndPractice(s,'single','same'),e=>e.code==='REMOVAL_RECOVERY_NEEDED');
});

test('corrupt related stores prevent all deletion; unrelated daily corruption does not block a spread',()=>{
 for(const key of [STORAGE_KEY,METADATA_KEY,MEMORY_KEY,QUESTION_HISTORY_KEY,DAILY_KEY,DRAFT_KEY,KEEPSAKE_STORAGE_KEY]){const s=setup();s.values.set(key,'{damaged');const before=bytes(s);assert.throws(()=>removeReadingAndPractice(s,'single','same'),e=>e.code==='STORAGE_CORRUPT');assert.deepEqual(bytes(s),before);}
 const s=setup();s.values.set(DAILY_KEY,'{damaged');const keptBefore=s.getItem(KEEPSAKE_STORAGE_KEY),removed=removeReadingAndPractice(s,'spread','same');assert.equal(loadSpreadRecords(s).length,0);assert.equal(s.getItem(KEEPSAKE_STORAGE_KEY),keptBefore);assert.equal(s.getItem(DAILY_KEY),'{damaged');assert.equal(loadRecords(s).length,2);restoreReadingAndPractice(s,removed);assert.equal(loadSpreadRecords(s).length,1);
});

test('undo retains unrelated work and a newer current draft',()=>{
 const s=setup(),removed=removeReadingAndPractice(s,'single','same');const other=record('new',7);saveRecord(s,other);saveDraft(s,other);saveMetadata(s,{kind:'single',id:'new',topic:'New work'});restoreReadingAndPractice(s,removed);assert.equal(loadRecords(s).length,3);assert.equal(loadDraft(s).id,'new');assert.ok(loadMetadata(s).some(v=>v.id==='new'));assert.equal(loadDaily(s,'2026-09-25').id,'same');
});

test('undo refuses a newer card held for the same day and commits no partial restore',()=>{
 const s=setup(),removed=removeReadingAndPractice(s,'single','same');saveDaily(s,record('new',7),'2026-09-25');const before=bytes(s);assert.throws(()=>restoreReadingAndPractice(s,removed),e=>e.code==='RESTORE_CONFLICT');assert.deepEqual(bytes(s),before);assert.equal(loadDaily(s,'2026-09-25').id,'new');
});

test('unsaved reading removal keeps a validated row for undo without needing a saved source',()=>{
 const s=storage(),value=record('unsaved');saveDraft(s,value);const removed=removeReadingAndPractice(s,'single',value.id,value);assert.equal(loadDraft(s),null);assert.equal(loadRecords(s).length,0);restoreReadingAndPractice(s,removed);assert.equal(loadRecords(s)[0].id,'unsaved');assert.equal(loadDraft(s).id,'unsaved');
});

test('identity mismatch or invalid archived days fail before any writes',()=>{
 const s=setup(),before=bytes(s);assert.throws(()=>removeReadingAndPractice(s,'single','same',record('different')),e=>e.code==='VALIDATION');assert.deepEqual(bytes(s),before);assert.throws(()=>restoreDailyReferences(s,[{date:'2026-02-30',record:record()}]),e=>e.code==='VALIDATION');assert.deepEqual(bytes(s),before);
});

test('a kept-words failure during undo rolls the whole restore back byte-for-byte',()=>{
 const s=setup(),removed=removeReadingAndPractice(s,'single','same'),before=bytes(s),set=s.setItem;let failed=false;
 s.setItem=(key,value)=>{if(key===KEEPSAKE_STORAGE_KEY&&!failed){failed=true;throw Error('quota');}set(key,value);};
 assert.throws(()=>restoreReadingAndPractice(s,removed),error=>error.code==='REMOVAL_WRITE_FAILED');assert.deepEqual(bytes(s),before);
});
test('undo rejects unrelated or changed kept words without partially restoring the reading',()=>{
 const s=setup(),removed=removeReadingAndPractice(s,'single','same'),before=bytes(s);
 assert.throws(()=>restoreReadingAndPractice(s,{...removed,keepsakes:[{...removed.keepsakes[0],readingId:'another'}]}),error=>error.code==='VALIDATION');assert.deepEqual(bytes(s),before);
 saveReadingKeepsake(s,{record:record(),text:'Words chosen after removal.'});const newer=bytes(s);
 assert.throws(()=>restoreReadingAndPractice(s,removed),error=>error.code==='RESTORE_CONFLICT');assert.deepEqual(bytes(s),newer);
});
test('single removal clears an independent keepsake even when the full reading was never saved',()=>{
 const s=storage(),one=record('words-only');saveReadingKeepsake(s,{record:one,text:'Keep just these words.'});
 const snapshot=removeReadingAndPractice(s,'single',one.id);assert.equal(loadReadingKeepsakes(s).length,0);assert.equal(snapshot.record,null);
 restoreReadingAndPractice(s,snapshot);assert.equal(loadReadingKeepsakes(s)[0].readingId,one.id);assert.equal(loadRecords(s).length,0);
});
