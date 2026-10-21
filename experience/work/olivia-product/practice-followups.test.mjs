import test from 'node:test';
import assert from 'node:assert/strict';
import {METADATA_KEY,loadMetadata,saveMetadata,appendFollowup,practiceRetrospective,listRevisits} from './practice-core.js';
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
test('legacy metadata loads with optional new fields and keeps original response through repeated returns',()=>{
 const s=storage();s.setItem(METADATA_KEY,JSON.stringify({schemaVersion:1,entries:[{kind:'single',id:'a',topic:'Work',nextStep:'Ask a friend',revisitDate:'',outcome:'',reviewedAt:null}]}));
 assert.deepEqual(loadMetadata(s)[0].followups,[]);
 saveMetadata(s,{kind:'single',id:'a',response:'I disagree with the interpretation.',resonance:'disagree',title:'My decision'});
 appendFollowup(s,'single','a',{now:'The conversation helped.',nextStep:'Take a pause',createdAt:'2026-10-01T12:00:00.000Z',revisitDate:'2026-10-10'});
 appendFollowup(s,'single','a',{now:'I chose another approach.',nextStep:'',createdAt:'2026-10-10T12:00:00.000Z'});
 const entry=loadMetadata(s)[0];assert.equal(entry.originalResponse,'I disagree with the interpretation.');assert.equal(entry.originalNextStep,'Ask a friend');assert.equal(entry.followups.length,2);assert.equal(entry.resonance,'disagree');
 assert.equal(practiceRetrospective([entry]).returns,2);assert.equal(listRevisits([entry],'2026-10-11').due.length,0);
});
test('invalid or empty follow-up never overwrites stored reflection; a future return stays pending',()=>{
 const s=storage();saveMetadata(s,{kind:'spread',id:'b',response:'My words',nextStep:'Notice'});const before=s.getItem(METADATA_KEY);
 assert.throws(()=>appendFollowup(s,'spread','b',{now:' ',createdAt:'2026-10-01T12:00:00.000Z'}));assert.equal(s.getItem(METADATA_KEY),before);
 appendFollowup(s,'spread','b',{now:'A change',createdAt:'2026-10-01T12:00:00.000Z',revisitDate:'2026-10-02'});assert.equal(listRevisits(loadMetadata(s),'2026-10-02').due.length,1);
});
test('complete backup import preserves original words and every dated follow-up',async()=>{
 const {prepareAlmanacImport,applyAlmanacImport}=await import('./almanac-backup.js');
 const {createSession,chooseCard,createRecord}=await import('./core.js');
 const session=chooseCard(createSession({question:'What can I notice?'},[0]),0);
 const record=createRecord(session,{number:0,name:'The Fool'},{meaning:'Begin.',prompt:'What matters?',practice:'Pause.'});
 const source=storage();saveMetadata(source,{kind:'single',id:record.id,response:'Not my experience',resonance:'disagree',nextStep:'Ask',title:'My own view'});appendFollowup(source,'single',record.id,{now:'I noticed another possibility',nextStep:'Listen',createdAt:'2026-10-01T12:00:00.000Z'});
 const raw=JSON.stringify({schemaVersion:1,oneCardReadings:{schemaVersion:1,records:[record]},guidedSpreads:{schemaVersion:1,records:[]},practice:loadMetadata(source)});
 const target=storage();applyAlmanacImport(target,prepareAlmanacImport(target,raw));assert.deepEqual(loadMetadata(target),loadMetadata(source));
});

test('a stale editor cannot erase a dated follow-up saved elsewhere',()=>{
 const s=storage();const stale=saveMetadata(s,{kind:'single',id:'c',response:'First words'});
 appendFollowup(s,'single','c',{now:'An observation',createdAt:'2026-10-01T12:00:00.000Z'});
 const before=s.getItem(METADATA_KEY);assert.throws(()=>saveMetadata(s,{...stale,response:'An edit'}));assert.equal(s.getItem(METADATA_KEY),before);
});
