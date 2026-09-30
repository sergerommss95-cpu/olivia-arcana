import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpreadSession,selectSpreadCard,revealNext} from './spread-core.js';
import {saveSpreadDraft,loadSpreadDraft,discardSpreadDraft,SPREAD_DRAFT_KEY} from './spread-draft.js';
const memory=()=>{const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const create=()=>createSpreadSession({question:'Що змінилося відтоді?',intention:'change',spreadId:'clarity3',count:3,reversals:true,deckId:'space-between',artworkEdition:'amielle-relationships-v1',artworkVariant:'women',origin:{practice:'astrology',cardId:17,role:'My question'}});
test('reload keeps the actual deck, one selected slot, reversal and artwork preference without another draw',()=>{
 const storage=memory(),session=selectSpreadCard(create(),18);saveSpreadDraft(storage,{session});const recovered=loadSpreadDraft(storage).session;
 assert.deepEqual(recovered,session);assert.equal(recovered.question,session.question);assert.equal(recovered.selectedSlots[0],18);assert.equal(recovered.artworkVariant,'women');
 const next=selectSpreadCard(recovered,24);assert.equal(next.cardIds[0],session.cardIds[0]);assert.equal(next.cardIds[1],session.deck[24]);assert.equal(next.orientations[1],session.deckOrientations[24]);assert.ok(Object.isFrozen(recovered.deck));
});
test('partial reveals and original first impressions survive interruption',()=>{
 const storage=memory();let session=create();for(const slot of [2,8,13])session=selectSpreadCard(session,slot);session=revealNext(session);
 const firstImpressions=[{cardId:session.cardIds[0],text:'I notice a boundary.',createdAt:'2026-09-30T16:00:00.000Z'}];saveSpreadDraft(storage,{session,note:'My own words',firstImpressions});
 const recovered=loadSpreadDraft(storage);assert.equal(recovered.session.revealedCount,1);assert.deepEqual(recovered.firstImpressions,firstImpressions);assert.equal(recovered.note,'My own words');
});
test('invalid slots and malformed stored drafts are rejected without erasing their source',()=>{
 const storage=memory(),session=selectSpreadCard(create(),0);saveSpreadDraft(storage,{session});const draft=JSON.parse(storage.getItem(SPREAD_DRAFT_KEY));draft.session.selectedSlots[0]=1;const raw=JSON.stringify(draft);storage.setItem(SPREAD_DRAFT_KEY,raw);
 assert.throws(()=>loadSpreadDraft(storage));assert.equal(storage.getItem(SPREAD_DRAFT_KEY),raw);assert.throws(()=>saveSpreadDraft(storage,{session:{...session,revealedCount:4}}));assert.equal(storage.getItem(SPREAD_DRAFT_KEY),raw);
});
test('explicit discard removes only interrupted draft, preserving saved journal data',()=>{
 const storage=memory();storage.setItem('olivia-arcana-spreads-v1','saved entries');saveSpreadDraft(storage,{session:create()});discardSpreadDraft(storage);assert.equal(loadSpreadDraft(storage),null);assert.equal(storage.getItem('olivia-arcana-spreads-v1'),'saved entries');
});
test('denied storage is surfaced without silently substituting a fresh draw',()=>{
 const storage={getItem(){throw new Error('denied');},setItem(){throw new Error('quota');}};assert.throws(()=>loadSpreadDraft(storage),/denied/);assert.throws(()=>saveSpreadDraft(storage,{session:create()}),/quota/);
});
