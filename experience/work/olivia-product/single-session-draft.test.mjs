import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,chooseCard} from './core.js';
import {saveSingleSessionDraft,loadSingleSessionDraft,discardSingleSessionDraft,SINGLE_SESSION_DRAFT_KEY} from './single-session-draft.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const session=()=>createSession({question:'Моє наступне рішення?',intention:'change',reversals:true,deckId:'space-between',artworkEdition:'amielle-relationships-v2',artworkVariant:'women',origin:{practice:'astrology',cardId:17,role:'My recurring question'}});
test('an interrupted question retains its shuffle and private symbolic origin before selection',()=>{
 const storage=memory(),original=session();saveSingleSessionDraft(storage,original);const recovered=loadSingleSessionDraft(storage);assert.deepEqual(recovered,original);assert.ok(Object.isFrozen(recovered.deck));assert.equal(recovered.cardId,null);
});
test('reload before unveiling retains the exact chosen card, slot, reversal and edition',()=>{
 const storage=memory(),original=chooseCard(session(),20);saveSingleSessionDraft(storage,original);const recovered=loadSingleSessionDraft(storage);assert.deepEqual(recovered,original);assert.equal(chooseCard(recovered,2),recovered);assert.equal(recovered.artworkEdition,'amielle-relationships-v2');
});
test('invalid draft does not get erased or substituted with a fresh card',()=>{
 const storage=memory();saveSingleSessionDraft(storage,chooseCard(session(),20));const value=JSON.parse(storage.getItem(SINGLE_SESSION_DRAFT_KEY));value.session.selectedSlot=21;const raw=JSON.stringify(value);storage.setItem(SINGLE_SESSION_DRAFT_KEY,raw);assert.throws(()=>loadSingleSessionDraft(storage));assert.equal(storage.getItem(SINGLE_SESSION_DRAFT_KEY),raw);
});
test('discard leaves the almanac and completed reading draft unchanged',()=>{
 const storage=memory();storage.setItem('completed-record','kept');saveSingleSessionDraft(storage,session());discardSingleSessionDraft(storage);assert.equal(loadSingleSessionDraft(storage),null);assert.equal(storage.getItem('completed-record'),'kept');
});
