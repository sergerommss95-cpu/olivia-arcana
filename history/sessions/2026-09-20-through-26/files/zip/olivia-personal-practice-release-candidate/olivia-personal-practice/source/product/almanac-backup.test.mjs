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
