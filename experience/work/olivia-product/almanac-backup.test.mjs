import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords,STORAGE_KEY} from './core.js';
import {KEEPSAKE_STORAGE_KEY,KEEPSAKE_LIMIT,saveReadingKeepsake,loadReadingKeepsakes} from './reading-keepsake.js';
import {prepareAlmanacImport,applyAlmanacImport} from './almanac-backup.js';
import {consumeQuestionHandoff,QUESTION_HANDOFF_KEY} from './question-handoff.js';
const storage=()=>{const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
const record=(question='What matters?')=>{const s=chooseCard(createSession({question},[0]),0);return createRecord(s,{number:0,name:'The Fool'},{meaning:'A beginning.',prompt:'Where to begin?',practice:'Take one step.'});};
const backup=(r=[],extra={})=>JSON.stringify({schemaVersion:1,oneCardReadings:{schemaVersion:1,records:r},guidedSpreads:{schemaVersion:1,records:[]},practice:[],journey:{schemaVersion:1,entries:[]},...extra});
const meta=id=>({id,kind:'single',topic:'Work',nextStep:'Think',revisitDate:'',outcome:'',reviewedAt:null});
test('complete almanac backup restores readings and personal meanings without replacing notes',()=>{
 const s=storage(),a=record(),b=record('Another question');saveRecord(s,a);
 const raw=backup([{...a,note:'older note'},b],{practice:[meta(b.id)],journey:{schemaVersion:1,entries:[{kind:'single',id:b.id,meaningful:true,associations:[{cardId:0,text:'A meaningful beginning'}]}]}});
 const plan=prepareAlmanacImport(s,raw);assert.equal(plan.added,1);assert.equal(plan.kept,1);applyAlmanacImport(s,plan);
 assert.equal(loadRecords(s).length,2);assert.equal(loadRecords(s).find(r=>r.id===a.id).note,'');
});
test('malformed and conflicting backups leave all existing bytes untouched',()=>{
 const s=storage(),a=record();saveRecord(s,a);const before=new Map(s.map);
 assert.throws(()=>prepareAlmanacImport(s,backup([{...a,question:'Different life event'}],{practice:[meta(a.id)]})),/different questions/);
 assert.throws(()=>prepareAlmanacImport(s,backup([{...a,cardId:99}])));
 assert.deepEqual(s.map,before);
});
test('imported memory must belong to a reading actually included in the backup',()=>{
 const s=storage(),a=record();saveRecord(s,a);
 assert.throws(()=>prepareAlmanacImport(s,backup([],{practice:[meta(a.id)]})),/does not match/);
 assert.throws(()=>prepareAlmanacImport(s,backup([a],{journey:{schemaVersion:1,entries:[{kind:'single',id:a.id,meaningful:true,associations:[{cardId:1,text:'Not drawn'}]}]}})),/does not match/);
});
test('stale preview fails and partial quota failures roll back byte-for-byte',()=>{
 const s=storage(),a=record(),plan=prepareAlmanacImport(s,backup([a]));s.setItem(STORAGE_KEY,'newer data');assert.throws(()=>applyAlmanacImport(s,plan),/changed/);
 const v=storage(),before=new Map(v.map),preview=prepareAlmanacImport(v,backup([a]));let n=0;const real=v.setItem;v.setItem=(k,x)=>{if(++n===3)throw Error('quota');real(k,x);};
 assert.throws(()=>applyAlmanacImport(v,preview),/restored/);assert.deepEqual(v.map,before);
});
test('question handoff is one-use, bounded and expires after thirty minutes',()=>{
 const s=storage(),now=Date.now();s.setItem(QUESTION_HANDOFF_KEY,JSON.stringify({schemaVersion:1,question:' My own question ',createdAt:now}));assert.equal(consumeQuestionHandoff(s,now),'My own question');assert.equal(consumeQuestionHandoff(s,now),null);
 for(const value of [{schemaVersion:1,question:'x',createdAt:now-1800001},{schemaVersion:1,question:'x'.repeat(1601),createdAt:now},{schemaVersion:1,question:'x',createdAt:now+1}]){s.setItem(QUESTION_HANDOFF_KEY,JSON.stringify(value));assert.equal(consumeQuestionHandoff(s,now),null);}
});

import {createQuestionThread,appendQuestionUpdate,loadQuestionHistory,QUESTION_HISTORY_KEY} from './question-history.js';
import {exportJourneyBackup} from './living-deck.js';
test('full backups merge dated question history without losing earlier observations',()=>{
 const source=storage(),r=record();saveRecord(source,r);const thread=createQuestionThread(source,{title:'Finding a direction',kind:'single',id:r.id});
 appendQuestionUpdate(source,{threadId:thread.id,date:'2026-09-25',tried:'I asked.',happened:'',understood:''});
 const target=storage();applyAlmanacImport(target,prepareAlmanacImport(target,JSON.stringify(exportJourneyBackup(source))));
 appendQuestionUpdate(source,{threadId:thread.id,date:'2026-09-26',tried:'',happened:'They listened.',understood:''});
 appendQuestionUpdate(target,{threadId:thread.id,date:'2026-09-27',tried:'',happened:'',understood:'Another observation.'});
 applyAlmanacImport(target,prepareAlmanacImport(target,JSON.stringify(exportJourneyBackup(source))));assert.equal(loadQuestionHistory(target)[0].updates.length,3);
});
test('forged or dangling history references and quota-interrupted history import leave storage intact',()=>{
 const source=storage(),r=record();saveRecord(source,r);createQuestionThread(source,{title:'My question',kind:'single',id:r.id});const value=exportJourneyBackup(source),target=storage();
 value.questionHistory.threads[0].readings[0].snapshot.question='A forged question';assert.throws(()=>prepareAlmanacImport(target,JSON.stringify(value)),/history does not match/);assert.equal(target.map.size,0);
 const valid=JSON.stringify(exportJourneyBackup(source)),plan=prepareAlmanacImport(target,valid);const set=target.setItem;target.setItem=(k,v)=>{if(k===QUESTION_HISTORY_KEY)throw Error('quota');set(k,v);};assert.throws(()=>applyAlmanacImport(target,plan),/restored/);assert.equal(target.map.size,0);
});

test('full backups preserve the chosen deck and reject a history snapshot of another deck',()=>{
 const source=storage(),r={...record(),deckId:'space-between'};saveRecord(source,r);
 createQuestionThread(source,{title:'A reading with this deck',kind:'single',id:r.id});
 const target=storage(),value=exportJourneyBackup(source);
 applyAlmanacImport(target,prepareAlmanacImport(target,JSON.stringify(value)));
 assert.equal(loadRecords(target)[0].deckId,'space-between');
 assert.equal(loadQuestionHistory(target)[0].readings[0].snapshot.deckId,'space-between');
 const forged=structuredClone(value);forged.questionHistory.threads[0].readings[0].snapshot.deckId='olivia';
 const empty=storage();assert.throws(()=>prepareAlmanacImport(empty,JSON.stringify(forged)),/history does not match/);assert.equal(empty.map.size,0);
 const before=new Map(target.map),conflicting=structuredClone(value);conflicting.oneCardReadings.records[0].deckId='olivia';conflicting.questionHistory.threads[0].readings[0].snapshot.deckId='olivia';
 assert.throws(()=>prepareAlmanacImport(target,JSON.stringify(conflicting)),/different questions or draws/);assert.deepEqual(target.map,before);
});

test('legacy backups normalize both reading and question snapshot to the original deck',()=>{
 const source=storage(),r=record();saveRecord(source,r);createQuestionThread(source,{title:'An earlier reading',kind:'single',id:r.id});
 const value=exportJourneyBackup(source);delete value.oneCardReadings.records[0].deckId;delete value.questionHistory.threads[0].readings[0].snapshot.deckId;
 const target=storage();applyAlmanacImport(target,prepareAlmanacImport(target,JSON.stringify(value)));
 assert.equal(loadRecords(target)[0].deckId,'olivia');assert.equal(loadQuestionHistory(target)[0].readings[0].snapshot.deckId,'olivia');
});

const keptBackup=source=>({version:1,entries:loadReadingKeepsakes(source)});
test('backups restore independent kept words without implicitly saving a reading',()=>{
 const source=storage(),r={...record(),deckId:'space-between'};saveReadingKeepsake(source,{record:r,text:'Залиште місце для розмови.',locale:'uk'});
 const target=storage(),plan=prepareAlmanacImport(target,backup([],{keepsakes:keptBackup(source)}));assert.equal(plan.added,0);assert.equal(plan.addedKeepsakes,1);
 const result=applyAlmanacImport(target,plan);assert.equal(result.addedKeepsakes,1);assert.deepEqual(loadReadingKeepsakes(target),loadReadingKeepsakes(source));assert.equal(loadRecords(target).length,0);assert.equal(JSON.parse(target.getItem(KEEPSAKE_STORAGE_KEY)).version,1);
});
test('existing kept words win on import and legacy backups preserve them',()=>{
 const source=storage(),target=storage(),r=record();saveReadingKeepsake(source,{record:r,text:'An earlier sentence.'});saveReadingKeepsake(target,{record:r,text:'The words I want now.'});const before=loadReadingKeepsakes(target);
 const plan=prepareAlmanacImport(target,backup([r],{keepsakes:keptBackup(source)}));assert.equal(plan.addedKeepsakes,0);applyAlmanacImport(target,plan);assert.deepEqual(loadReadingKeepsakes(target),before);
 applyAlmanacImport(target,prepareAlmanacImport(target,backup()));assert.deepEqual(loadReadingKeepsakes(target),before);
 const empty=storage();applyAlmanacImport(empty,prepareAlmanacImport(empty,backup()));assert.deepEqual(loadReadingKeepsakes(empty),[]);
});
test('backup kept words must match an included or existing reading when present',()=>{
 const source=storage(),r=record();saveReadingKeepsake(source,{record:r,text:'The words you chose.'});const entry=loadReadingKeepsakes(source)[0];
 for(const change of [{question:'A different question'},{cardId:1},{deckId:'space-between'}])for(const included of [true,false]){
  const target=storage();if(!included)saveRecord(target,r);const before=new Map(target.map);
  assert.throws(()=>prepareAlmanacImport(target,backup(included?[r]:[],{keepsakes:{version:1,entries:[{...entry,...change}]}})),/Kept words do not match/);assert.deepEqual(target.map,before);
 }
});
test('malformed, duplicate and over-capacity kept words fail without changing any data',()=>{
 const source=storage(),r=record();saveReadingKeepsake(source,{record:r,text:'The words you chose.'});const entry=loadReadingKeepsakes(source)[0],target=storage();
 for(const keepsakes of [null,{schemaVersion:1,entries:[]},{version:1,entries:[entry,entry]},{version:1,entries:[{...entry,text:'x'.repeat(241)}]},{version:1,entries:Array.from({length:KEEPSAKE_LIMIT+1},(_,i)=>({...entry,readingId:String(i)}))}]){
  assert.throws(()=>prepareAlmanacImport(target,backup([],{keepsakes})));assert.equal(target.map.size,0);
 }
 saveReadingKeepsake(target,{record:r,text:'Already here.'});const before=new Map(target.map),entries=Array.from({length:KEEPSAKE_LIMIT},(_,i)=>({...entry,readingId:String(i)}));assert.throws(()=>prepareAlmanacImport(target,backup([],{keepsakes:{version:1,entries}})),/available space/);assert.deepEqual(target.map,before);
});
test('kept words participate in stale-preview protection and the final-write rollback',()=>{
 const source=storage(),r=record();saveReadingKeepsake(source,{record:r,text:'The words you chose.'});const raw=backup([r],{keepsakes:keptBackup(source)});
 const changed=storage(),plan=prepareAlmanacImport(changed,raw);saveReadingKeepsake(changed,{record:r,text:'A newer choice.'});const newer=new Map(changed.map);assert.throws(()=>applyAlmanacImport(changed,plan),error=>error.code==='BACKUP_CHANGED');assert.deepEqual(changed.map,newer);
 const target=storage(),before=new Map(target.map),preview=prepareAlmanacImport(target,raw),set=target.setItem;target.setItem=(key,value)=>{if(key===KEEPSAKE_STORAGE_KEY)throw Error('quota');set(key,value);};assert.throws(()=>applyAlmanacImport(target,preview),error=>error.code==='BACKUP_WRITE_FAILED');assert.deepEqual(target.map,before);
});
