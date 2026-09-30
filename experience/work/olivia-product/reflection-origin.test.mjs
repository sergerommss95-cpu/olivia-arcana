import test from 'node:test';import assert from 'node:assert/strict';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords,exportRecords} from './core.js';
import {createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord,loadSpreadRecords} from './spread-core.js';
import {guidancePayload} from './question-guidance.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
const origin={practice:'astrology',cardId:19,role:'Sun'};
const notes={meaning:'A symbolic perspective.',prompt:'What matters?',practice:'Pause.'};
test('astrology origin persists locally through draw/save/export and cannot be rewritten',()=>{
 const session=chooseCard(createSession({question:'What can I notice?',origin:{...origin,birthDate:'private'}},[0],()=>0),0);
 const record=createRecord(session,{number:0,name:'The Fool'},notes),store=memory();saveRecord(store,record);
 assert.deepEqual(loadRecords(store)[0].origin,origin);assert.deepEqual(JSON.parse(exportRecords([record])).records[0].origin,origin);
 assert.throws(()=>saveRecord(store,{...record,origin:{...origin,cardId:2}}));
 const request=guidancePayload(record);assert.equal(request.origin,undefined);assert.doesNotMatch(JSON.stringify(request),/birthDate/);
});
test('spread origin remains stable across ordered reveal and journal updates',()=>{
 const definition={id:'clarity3',count:3,name:'Clarity',positions:['situation','complication','next-step'].map(id=>({id,label:id}))};
 let s=createSpreadSession({question:'What matters?',origin,spreadId:definition.id,count:3},[0,1,2],()=>0);
 for(let i=0;i<3;i++)s=selectSpreadCard(s,i);s=revealAll(s);
 const record=createSpreadRecord(s,definition,{cards:s.cardIds.map((cardId,i)=>({...notes,cardId,positionId:definition.positions[i].id,label:definition.positions[i].label})),synthesis:{paragraphs:['Together.'],prompt:'What now?'}}),store=memory();
 saveSpreadRecord(store,record);saveSpreadRecord(store,{...record,note:'My words'});assert.deepEqual(loadSpreadRecords(store)[0].origin,origin);
 assert.throws(()=>saveSpreadRecord(store,{...record,origin:undefined}));
});
