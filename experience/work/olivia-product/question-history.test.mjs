import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,chooseCard,createRecord,saveRecord,STORAGE_KEY,removeRecord} from './core.js';
import {createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord,SPREAD_STORAGE_KEY} from './spread-core.js';
import {saveMetadata,METADATA_KEY} from './practice-core.js';
import {QUESTION_HISTORY_KEY,loadQuestionHistory,validateQuestionHistory,serializeQuestionHistory,createQuestionThread,linkQuestionReading,appendQuestionUpdate,removeReadingReferences,restoreReadingReferences,mergeQuestionHistoryEntries,mergeQuestionHistory,questionHistoryCopy,questionHistoryHref,questionHistoryEvents} from './question-history.js';
const THREAD='002204dc-c24d-414c-af01-865acfd13312',OTHER='002204dc-c24d-414c-af01-865acfd13313',UPDATE='002204dc-c24d-414c-af01-865acfd13314',NEXT='002204dc-c24d-414c-af01-865acfd13315';
const NOW='2026-09-25T10:00:00.000Z';
function storage(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key),data};}
function single(id='same') {const s=chooseCard(createSession({question:'What could I try?',intention:'open'},[0]),0);return {...createRecord(s,{number:0,name:'The Fool'},{meaning:'A beginning.',prompt:'Notice.',practice:'Try.'}),id,createdAt:NOW,updatedAt:NOW};}
function spread(id='same') {const definition={id:'clarity3',count:3,name:'Three perspectives',positions:[{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}]};let s=createSpreadSession({spreadId:'clarity3',count:3,question:'What could I try?'},[0,1,2]);for(let i=0;i<3;i++)s=selectSpreadCard(s,i);s=revealAll(s);const cards=s.cardIds.map((cardId,i)=>({cardId,positionId:definition.positions[i].id,label:definition.positions[i].label,meaning:'A meaning.',prompt:'Notice.',practice:'Try.'}));return {...createSpreadRecord(s,definition,{cards,synthesis:{paragraphs:['A relationship.'],prompt:'What connects?'}}),id,createdAt:NOW,updatedAt:NOW};}
function setup(){const s=storage();saveRecord(s,single());saveRecord(s,single('unrelated'));saveSpreadRecord(s,spread());saveMetadata(s,{kind:'single',id:'same',topic:'Direction',nextStep:'Old step',outcome:'Old outcome'});saveMetadata(s,{kind:'single',id:'unrelated',topic:'Direction'});return s;}
const start=s=>createQuestionThread(s,{title:'A direction I trust',kind:'single',id:'same',threadId:THREAD,now:NOW});
const note=(s,options={})=>appendQuestionUpdate(s,{threadId:THREAD,id:UPDATE,now:NOW,date:'2026-09-25',tried:'I asked for time.',happened:'They listened.',understood:'I can ask.',...options});

test('only explicit kind + id links enter a stable question history; source metadata stays untouched',()=>{
 const s=setup(),before=[s.getItem(STORAGE_KEY),s.getItem(SPREAD_STORAGE_KEY),s.getItem(METADATA_KEY)],one=start(s);
 assert.equal(one.id,THREAD);assert.equal(one.readings.length,1);assert.equal(one.readings[0].id,'same');
 linkQuestionReading(s,{threadId:THREAD,kind:'spread',id:'same',now:NOW});
 const [thread]=loadQuestionHistory(s);assert.deepEqual(thread.readings.map(v=>[v.kind,v.id]),[['single','same'],['spread','same']]);assert.deepEqual(thread.readings[1].snapshot.cardIds,JSON.parse(before[1]).records[0].cardIds);
 assert.deepEqual([s.getItem(STORAGE_KEY),s.getItem(SPREAD_STORAGE_KEY),s.getItem(METADATA_KEY)],before);assert.equal(loadQuestionHistory(s).some(v=>v.readings.some(r=>r.id==='unrelated')),false);
 assert.equal(questionHistoryHref(THREAD),'#journey?story='+THREAD);
});

test('dated observations append without changing earlier words or reading metadata',()=>{
 const s=setup();start(s);const first=note(s);const before=s.getItem(METADATA_KEY);
 note(s,{id:NEXT,date:'2026-09-26',tried:'',happened:'',understood:'A new perspective.'});
 const thread=loadQuestionHistory(s)[0];assert.equal(thread.updates.length,2);assert.deepEqual(thread.updates[0],first);assert.equal(s.getItem(METADATA_KEY),before);
 assert.throws(()=>note(s),e=>e.code==='QUESTION_HISTORY_CONFLICT');assert.deepEqual(loadQuestionHistory(s)[0].updates[0],first);
});

test('linking a reading twice is idempotent and snapshots preserve original question/cards/orientation',()=>{
 const s=setup();start(s);const before=s.getItem(QUESTION_HISTORY_KEY);
 linkQuestionReading(s,{threadId:THREAD,kind:'single',id:'same',now:'2026-10-01T12:00:00.000Z'});assert.equal(s.getItem(QUESTION_HISTORY_KEY),before);
 const existing=loadQuestionHistory(s)[0];assert.deepEqual(existing.readings[0].snapshot,{question:'What could I try?',createdAt:NOW,cardIds:[0],orientations:['upright']});
 removeRecord(s,'same');assert.deepEqual(loadQuestionHistory(s)[0],existing,'a source removed elsewhere does not destroy its history snapshot');
 assert.throws(()=>linkQuestionReading(s,{threadId:THREAD,kind:'single',id:'same'}),e=>e.code==='VALIDATION');
});

test('deleting and undoing reading references preserve thread identity, observations and link order',()=>{
 const s=setup();start(s);note(s);linkQuestionReading(s,{threadId:THREAD,kind:'spread',id:'same',now:NOW});createQuestionThread(s,{title:'Another history',kind:'single',id:'same',threadId:OTHER,now:NOW});
 const before=loadQuestionHistory(s),removed=removeReadingReferences(s,'single','same');assert.equal(removed.links.length,2);const after=loadQuestionHistory(s);assert.equal(after[0].updates.length,1);assert.equal(after[0].readings[0].kind,'spread');assert.equal(after[1].readings.length,0);
 restoreReadingReferences(s,removed);assert.deepEqual(loadQuestionHistory(s),before);restoreReadingReferences(s,removed);assert.deepEqual(loadQuestionHistory(s),before);
});

test('restore rejects a mismatching identity without partial writes',()=>{
 const s=setup();start(s);const removed=removeReadingReferences(s,'single','same'),before=s.getItem(QUESTION_HISTORY_KEY);removed.links[0].reading.id='other';assert.throws(()=>restoreReadingReferences(s,removed),e=>e.code==='VALIDATION');assert.equal(s.getItem(QUESTION_HISTORY_KEY),before);
});

test('corrupt, blocked and full stores fail without discarding existing data',()=>{
 const s=setup();start(s);const original=s.getItem(QUESTION_HISTORY_KEY);s.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};assert.throws(()=>note(s),e=>e.code==='STORAGE_QUOTA');assert.equal(s.getItem(QUESTION_HISTORY_KEY),original);
 s.data.set(QUESTION_HISTORY_KEY,'{broken');assert.throws(()=>loadQuestionHistory(s),e=>e.code==='STORAGE_CORRUPT');assert.throws(()=>note(s),e=>e.code==='STORAGE_CORRUPT');assert.equal(s.getItem(QUESTION_HISTORY_KEY),'{broken');
 assert.throws(()=>loadQuestionHistory({getItem(){throw Error('blocked');},setItem(){}}),e=>e.code==='STORAGE_UNAVAILABLE');
});

test('invalid dates, empty observations, oversized text and duplicate identifiers cannot mutate history',()=>{
 const s=setup();start(s);const before=s.getItem(QUESTION_HISTORY_KEY);
 for(const options of [{date:'2026-02-29'},{date:'2026-13-01'},{date:'0000-01-01'},{tried:' ',happened:'',understood:''},{tried:'x'.repeat(1001)},{happened:'x'.repeat(2001)},{id:'not-a-uuid'},{now:'2026-09-31T10:00:00.000Z'}]){assert.throws(()=>note(s,options),e=>e.code==='VALIDATION');assert.equal(s.getItem(QUESTION_HISTORY_KEY),before);}
 const thread=loadQuestionHistory(s)[0];assert.throws(()=>validateQuestionHistory([thread,thread]),e=>e.code==='VALIDATION');assert.throws(()=>validateQuestionHistory([{...thread,readings:[thread.readings[0],thread.readings[0]]}]),e=>e.code==='VALIDATION');
 assert.throws(()=>createQuestionThread(s,{title:'No source',kind:'single',id:'missing',threadId:OTHER,now:NOW}),e=>e.code==='VALIDATION');assert.equal(s.getItem(QUESTION_HISTORY_KEY),before);
});

test('backup union retains independent append entries and rejects same-ID content conflicts',()=>{
 const s=setup();start(s);note(s);const earlier=loadQuestionHistory(s);note(s,{id:NEXT,understood:'A later note.'});const later=loadQuestionHistory(s);
 assert.deepEqual(mergeQuestionHistoryEntries(earlier,later),later);assert.deepEqual(mergeQuestionHistoryEntries(later,earlier),later);assert.deepEqual(mergeQuestionHistory(s,serializeQuestionHistory(earlier)),later);
 const changed=structuredClone(earlier);changed[0].updates[0].tried='Different words';const before=s.getItem(QUESTION_HISTORY_KEY);assert.throws(()=>mergeQuestionHistory(s,serializeQuestionHistory(changed)),e=>e.code==='QUESTION_HISTORY_CONFLICT');assert.equal(s.getItem(QUESTION_HISTORY_KEY),before);
 const renamed=structuredClone(earlier);renamed[0].title='Different title';assert.throws(()=>mergeQuestionHistoryEntries(later,renamed),e=>e.code==='QUESTION_HISTORY_CONFLICT');assert.deepEqual(loadQuestionHistory(s),later);
});

test('both locales have complete copy for question histories',()=>{const en=questionHistoryCopy('en'),uk=questionHistoryCopy('uk');assert.deepEqual(Object.keys(en),Object.keys(uk));for(const key of Object.keys(en)){assert.ok(uk[key]);assert.notEqual(en[key],uk[key],key);}});

test('same-day observations follow the reading while an explicitly backdated note keeps its calendar position',()=>{
 const thread={readings:[{linkedAt:'2026-09-25T15:00:00.000Z'}],updates:[{date:'2026-09-25',createdAt:'2026-09-25T16:00:00.000Z'},{date:'2026-09-24',createdAt:'2026-09-25T17:00:00.000Z'}]};
 const events=questionHistoryEvents(thread,stamp=>stamp.slice(0,10));
 assert.deepEqual(events.map(e=>e.type),['update','reading','update']);
 assert.equal(events[0].update.date,'2026-09-24');
});
