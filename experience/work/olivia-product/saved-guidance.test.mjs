import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGuidance} from './saved-guidance.js';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords} from './core.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('saved interpretation retains AI provenance and is not erased by later note drafts',()=>{
 const s=memory(),session=chooseCard(createSession({question:'What matters?'},[0]),0),record=createRecord(session,{number:0,name:'The Fool'},{meaning:'A start.',prompt:'What next?',practice:'A small step.'});
 const guidance={source:'ai',locale:'uk',synthesis:'Що для вас має значення?',createdAt:new Date().toISOString()};
 saveRecord(s,{...record,guidance});saveRecord(s,{...record,note:'My own words'});
 assert.deepEqual(loadRecords(s)[0].guidance,guidance);assert.equal(loadRecords(s)[0].note,'My own words');
});
test('saved guidance rejects false provenance and malformed dates',()=>{
 const g={source:'ai',locale:'en',synthesis:'A reflection.',createdAt:new Date().toISOString()};
 assert.throws(()=>validateGuidance({...g,source:'human'}));assert.throws(()=>validateGuidance({...g,createdAt:'2026-02-31T00:00:00.000Z'}));assert.throws(()=>validateGuidance({...g,synthesis:' '}));
});
