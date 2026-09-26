import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY,createSession,chooseCard,createRecord,saveRecord,removeRecord} from './core.js';
import {SPREAD_STORAGE_KEY,createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord} from './spread-core.js';
import {METADATA_KEY,saveMetadata,loadMetadata} from './practice-core.js';
import {MEMORY_KEY,loadMemories,getMemory,saveMemory,removeMemory,restoreMemory,validateMemories,loadJourney,topicTimeline,cardHistory,saveAssociation,exportJourneyRecovery,exportJourneyBackup,mergeMemories} from './living-deck.js';
import {journeyCopy} from './almanac-journey.js';

function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
function single(id='one',cardId=77,date='2026-09-24T10:00:00.000Z'){
 const session=chooseCard(createSession({question:'What can I try?',intention:'open'},[cardId]),0);
 return {...createRecord(session,{number:cardId,name:'A saved card'},{meaning:'An original meaning.',prompt:'A prompt.',practice:'A practice.'},'A private note.'),id,createdAt:date,updatedAt:date};
}
function spread(id='one'){
 const definition={id:'clarity3',count:3,name:'Three perspectives',positions:[{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}]};
 let session=createSpreadSession({spreadId:'clarity3',count:3,question:'Which part matters?'},[0,36,77]);
 for(let i=0;i<3;i++)session=selectSpreadCard(session,i);session=revealAll(session);
 const cards=session.cardIds.map((cardId,i)=>({cardId,positionId:definition.positions[i].id,label:definition.positions[i].label,meaning:'Original spread meaning.',prompt:'Notice.',practice:'Try.'}));
 return {...createSpreadRecord(session,definition,{cards,synthesis:{paragraphs:['A relationship.'],prompt:'What connects?'}}),id,createdAt:'2026-09-23T10:00:00.000Z',updatedAt:'2026-09-23T10:00:00.000Z'};
}

test('a unified topic timeline retains both stores, even when record IDs coincide',()=>{
 const s=storage(),one=single(),many=spread();saveRecord(s,one);saveSpreadRecord(s,many);
 saveMetadata(s,{kind:'single',id:'one',topic:'My direction',nextStep:'Ask a friend.',revisitDate:'2026-10-02',outcome:'A useful conversation.',reviewedAt:'2026-10-02T12:00:00.000Z'});
 saveMetadata(s,{kind:'spread',id:'one',topic:'my direction',nextStep:'Listen.'});
 const before=[s.getItem(STORAGE_KEY),s.getItem(SPREAD_STORAGE_KEY),s.getItem(METADATA_KEY)];
 const state=loadJourney(s),thread=topicTimeline(state.entries,'MY DIRECTION');assert.equal(state.errors.length,0);assert.equal(thread.length,2);assert.equal(thread[0].kind,'spread');assert.equal(thread[1].metadata.outcome,'A useful conversation.');
 assert.deepEqual(thread[0].cardIds,many.cardIds);assert.deepEqual(thread[1].cardIds,[77]);assert.deepEqual([s.getItem(STORAGE_KEY),s.getItem(SPREAD_STORAGE_KEY),s.getItem(METADATA_KEY)],before);
});

test('personal meanings require a real source card and never overwrite reading or metadata',()=>{
 const s=storage();saveRecord(s,single());saveMetadata(s,{kind:'single',id:'one',topic:'Work',nextStep:'A call.'});
 const bytes=[s.getItem(STORAGE_KEY),s.getItem(METADATA_KEY)];
 saveMemory(s,{kind:'single',id:'one',meaningful:true});saveAssociation(s,{kind:'single',id:'one',cardId:77,text:'  A steady beginning in my own words.  '});
 const history=cardHistory(loadJourney(s).entries,77);assert.equal(history.length,1);assert.equal(history[0].association,'A steady beginning in my own words.');assert.equal(history[0].memory.meaningful,true);
 assert.throws(()=>saveAssociation(s,{kind:'single',id:'one',cardId:1,text:'Not drawn.'}),e=>e.code==='VALIDATION');
 assert.throws(()=>saveAssociation(s,{kind:'single',id:'missing',cardId:77,text:'No source.'}),e=>e.code==='VALIDATION');
 assert.deepEqual([s.getItem(STORAGE_KEY),s.getItem(METADATA_KEY)],bytes);
 saveMemory(s,{kind:'single',id:'one',meaningful:false});assert.equal(cardHistory(loadJourney(s).entries,77)[0].association,history[0].association);
 saveAssociation(s,{kind:'single',id:'one',cardId:77,text:''});assert.deepEqual(loadMemories(s)[0].associations,[]);
});

test('removal and undo restore exact memory while absent records never enter the living deck',()=>{
 const s=storage(),record=single();saveRecord(s,record);saveMemory(s,{kind:'single',id:'one',meaningful:true});saveAssociation(s,{kind:'single',id:'one',cardId:77,text:'A chosen memory.'});
 const before=loadMemories(s),removed=removeMemory(s,'single','one');removeRecord(s,'one');assert.equal(loadJourney(s).entries.length,0);assert.deepEqual(loadMemories(s),[]);
 saveRecord(s,record);restoreMemory(s,removed);assert.deepEqual(loadMemories(s),before);
 removeRecord(s,'one');assert.equal(cardHistory(loadJourney(s).entries,77).length,0);assert.deepEqual(loadMemories(s),before,'dormant memory is preserved if another tab removes its source');
});

test('validation rejects invalid IDs, duplicate references and malformed entries without writes',()=>{
 const s=storage();saveMemory(s,{kind:'single',id:'safe',meaningful:true});const before=s.getItem(MEMORY_KEY);
 for(const value of [{kind:'other',id:'safe'},{kind:'single',id:''},{kind:'single',id:'safe',meaningful:'yes'},{kind:'single',id:'safe',associations:[{cardId:78,text:'No'}]},{kind:'single',id:'safe',associations:[{cardId:-1,text:'No'}]},{kind:'single',id:'safe',associations:[{cardId:0,text:' '}]},{kind:'single',id:'safe',associations:[{cardId:0,text:'x'.repeat(601)}]},{kind:'single',id:'safe',associations:[{cardId:0,text:'One'},{cardId:0,text:'Two'}]}]){
  assert.throws(()=>saveMemory(s,value),e=>e.code==='VALIDATION');assert.equal(s.getItem(MEMORY_KEY),before);
 }
 assert.throws(()=>validateMemories([loadMemories(s)[0],loadMemories(s)[0]]),e=>e.code==='VALIDATION');
});

test('corrupt stores are isolated, exported byte-for-byte, and never replaced',()=>{
 const s=storage();saveRecord(s,single());saveSpreadRecord(s,spread());const raw='{incomplete memory';s.setItem(MEMORY_KEY,raw);s.setItem(SPREAD_STORAGE_KEY,'a broken spread store');
 const state=loadJourney(s);assert.equal(state.entries.length,1);assert.equal(state.errors.length,2);assert.equal(state.entries[0].record.cardId,77);
 assert.throws(()=>saveMemory(s,{kind:'single',id:'one',meaningful:true}),e=>e.code==='STORAGE_CORRUPT');
 assert.equal(s.getItem(MEMORY_KEY),raw);const recovery=exportJourneyRecovery(s);assert.equal(recovery.stores[MEMORY_KEY],raw);assert.equal(recovery.stores[SPREAD_STORAGE_KEY],'a broken spread store');assert.equal(loadMetadata(s).length,0);
});

test('blocked and full storage report failure without mutating the previous memory',()=>{
 const s=storage();saveMemory(s,{kind:'single',id:'one',meaningful:true});const before=s.getItem(MEMORY_KEY);
 s.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};assert.throws(()=>saveMemory(s,{kind:'single',id:'one',meaningful:false}),e=>e.code==='STORAGE_QUOTA');assert.equal(s.getItem(MEMORY_KEY),before);
 assert.throws(()=>loadMemories({getItem(){throw Error('Blocked');},setItem(){}}),e=>e.code==='STORAGE_UNAVAILABLE');
});

test('restoring memory backups adds missing entries and preserves local conflicts',()=>{
 const s=storage();saveMemory(s,{kind:'single',id:'same',meaningful:true});const result=mergeMemories(s,{schemaVersion:1,entries:[{kind:'single',id:'same',meaningful:false,associations:[]},{kind:'spread',id:'same',meaningful:true,associations:[{cardId:0,text:'A beginning.'}]}]});
 assert.deepEqual(result,{added:1,kept:1});assert.equal(getMemory(loadMemories(s),'single','same').meaningful,true);assert.equal(loadMemories(s).length,2);
 const before=s.getItem(MEMORY_KEY);assert.throws(()=>mergeMemories(s,{schemaVersion:1,entries:[{kind:'single',id:'bad',meaningful:true,associations:[{cardId:800,text:'Invalid'}]}]}));assert.equal(s.getItem(MEMORY_KEY),before);
});

test('normal journey export includes both complete journals, follow-up fields and confirmed memories',()=>{
 const s=storage(),one=single(),many=spread();saveRecord(s,one);saveSpreadRecord(s,many);saveMetadata(s,{kind:'single',id:one.id,topic:'Work',nextStep:'Call.',outcome:'A conversation.'});saveMemory(s,{kind:'spread',id:many.id,meaningful:true});
 const backup=exportJourneyBackup(s);assert.deepEqual(backup.oneCardReadings.records,[one]);assert.deepEqual(backup.guidedSpreads.records,[many]);assert.equal(backup.practice[0].outcome,'A conversation.');assert.deepEqual(backup.journey,{schemaVersion:1,entries:loadMemories(s)});assert.equal(backup.schemaVersion,1);
});

test('English and Ukrainian surfaces have complete authored copy',()=>{
 const en=journeyCopy('en'),uk=journeyCopy('uk');assert.deepEqual(Object.keys(en),Object.keys(uk));for(const key of Object.keys(en)){assert.equal(typeof uk[key],'string');assert.ok(uk[key].length);assert.notEqual(uk[key],en[key],key);}
});
