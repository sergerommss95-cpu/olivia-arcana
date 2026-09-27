import test from 'node:test';
import assert from 'node:assert/strict';
import {savePracticeReading} from './practice-ui.js';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords} from './core.js';
import {createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord,loadSpreadRecords} from './spread-core.js';

const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
const question='What kind of work should I look for next month?';
const guidance={source:'ai',locale:'en',synthesis:'Look for work that values your experience and gives it room to grow.',createdAt:'2026-09-25T12:00:00.000Z'};
function create(kind){
 if(kind==='single')return createRecord(chooseCard(createSession({question},[20]),0),{number:20,name:'Judgement'},{meaning:'A call to reassess.',prompt:'What feels ready?',practice:'Name a strength.'});
 const spread={id:'clarity3',name:'A little clarity',count:3,positions:[{id:'situation',label:'The situation'},{id:'complication',label:'What complicates it'},{id:'next',label:'A helpful next step'}]};
 let session=createSpreadSession({spreadId:spread.id,count:3,question},[20,3,73]);
 for(let i=0;i<3;i++)session=selectSpreadCard(session,i);
 session=revealAll(session);
 return createSpreadRecord(session,spread,{cards:session.cardIds.map((cardId,i)=>({cardId,positionId:spread.positions[i].id,label:spread.positions[i].label,meaning:'A card meaning.',prompt:'What do you notice?',practice:'Choose a step.'})),synthesis:{paragraphs:['Consider the cards together.'],prompt:'What connects?'}});
}
for(const kind of ['single','spread']){
 const load=kind==='single'?loadRecords:loadSpreadRecords,save=kind==='single'?saveRecord:saveSpreadRecord;
 test(`${kind}: next-step or memory save keeps an answer received after controls mounted`,()=>{
  const storage=memory(),mounted=create(kind);let current=mounted;
  const options={kind,record:mounted,getRecord:(type,id)=>{assert.equal(type,kind);assert.equal(id,mounted.id);return current;},note:'I will ask about mentoring.'};
  current={...mounted,guidance,note:'Earlier note'};
  const kept=savePracticeReading(storage,options),stored=load(storage)[0];
  assert.deepEqual(stored.guidance,guidance);assert.deepEqual(kept,stored);
  assert.equal(stored.note,options.note);assert.equal(stored.question,question);
  assert.deepEqual(stored.cardIds??[stored.cardId],mounted.cardIds??[mounted.cardId]);
  if(kind==='spread')assert.deepEqual(stored.cards,mounted.cards);
  assert.equal(mounted.guidance,undefined);
 });
 test(`${kind}: memory save updates a previously saved reading with its new answer`,()=>{
  const storage=memory(),mounted=create(kind);save(storage,mounted);
  const kept=savePracticeReading(storage,{kind,record:mounted,getRecord:()=>({...mounted,guidance}),note:'My current reflection'});
  assert.deepEqual(load(storage)[0].guidance,guidance);assert.deepEqual(kept,load(storage)[0]);assert.equal(kept.note,'My current reflection');
 });
 test(`${kind}: returned save record includes guidance already kept by the main save action`,()=>{
  const storage=memory(),mounted=create(kind);save(storage,{...mounted,guidance});
  const kept=savePracticeReading(storage,{kind,record:mounted,note:'A later note'});
  assert.deepEqual(kept.guidance,guidance);assert.equal(kept.note,'A later note');
 });
 test(`${kind}: a different active reading cannot replace the mounted draw`,()=>{
  const storage=memory(),mounted=create(kind),other=create(kind);
  const kept=savePracticeReading(storage,{kind,record:mounted,getRecord:()=>({...other,guidance}),note:'This reading only'});
  assert.equal(kept.id,mounted.id);assert.equal(kept.guidance,undefined);assert.equal(load(storage).length,1);
 });
}
