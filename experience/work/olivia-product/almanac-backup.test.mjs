import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords,STORAGE_KEY} from './core.js';
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
