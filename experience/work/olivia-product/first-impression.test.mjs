import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFirstImpressions,mergeFirstImpressions} from './first-impression.js';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords} from './core.js';
import {createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord,loadSpreadRecords} from './spread-core.js';
import {exportJourneyBackup} from './living-deck.js';
import {prepareAlmanacImport,applyAlmanacImport} from './almanac-backup.js';
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),m};};
const note=cardId=>({cardId,text:'I notice the open space. <my words>',createdAt:'2026-09-25T10:00:00.000Z'});
const single=()=>{const session=chooseCard(createSession({},[0]),0);return createRecord(session,{number:0,name:'The Fool'},{meaning:'A beginning.',prompt:'What do you see?',practice:'Take a moment.'});};
test('first impressions validate card ownership, duplicates, length and exact timestamps',()=>{
 assert.deepEqual(validateFirstImpressions([note(0)],[0]),[note(0)]);
 for(const invalid of [[note(1)],[note(0),note(0)],[{...note(0),text:' '}],[{...note(0),text:'x'.repeat(1201)}],[{...note(0),createdAt:'yesterday'}]])assert.throws(()=>validateFirstImpressions(invalid,[0]));
 assert.throws(()=>mergeFirstImpressions([note(0)],[{...note(0),text:'Rewrite'}],[0]));
});
test('single first impression persists through a stale reflection edit and full backup import',()=>{
 const s=store(),r=single();saveRecord(s,{...r,firstImpressions:[note(0)]});saveRecord(s,{...r,note:'A later thought.'});
 assert.deepEqual(loadRecords(s)[0].firstImpressions,[note(0)]);
 const out=store();applyAlmanacImport(out,prepareAlmanacImport(out,JSON.stringify(exportJourneyBackup(s))));assert.deepEqual(loadRecords(out),loadRecords(s));
 const before=new Map(s.m);assert.throws(()=>saveRecord(s,{...r,firstImpressions:[{...note(0),text:'Overwrite'}]}));assert.deepEqual(s.m,before);
});
test('spread impressions follow actual chosen cards, survive later note saves and export',()=>{
 let session=createSpreadSession({spreadId:'clarity3',count:3},[0,1,2]);for(let i=0;i<3;i++)session=selectSpreadCard(session,i);session=revealAll(session);
 const definition={id:'clarity3',count:3,name:'Clarity',positions:[{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}]};
 const cards=session.cardIds.map((cardId,i)=>({cardId,...definition.positions[i],positionId:definition.positions[i].id,meaning:'A meaning.',prompt:'Notice.',practice:'Try.'}));
 const record=createSpreadRecord(session,definition,{cards,synthesis:{paragraphs:['A connection.'],prompt:'What connects?'}}),s=store();
 saveSpreadRecord(s,{...record,firstImpressions:[note(0),note(2)]});saveSpreadRecord(s,{...record,note:'Later.'});assert.deepEqual(loadSpreadRecords(s)[0].firstImpressions,[note(0),note(2)]);
 assert.throws(()=>saveSpreadRecord(s,{...record,firstImpressions:[note(77)]}));
 const target=store();applyAlmanacImport(target,prepareAlmanacImport(target,JSON.stringify(exportJourneyBackup(s))));assert.deepEqual(loadSpreadRecords(target),loadSpreadRecords(s));
});
