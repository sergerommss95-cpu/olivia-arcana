import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpreadSession,selectSpreadCard,revealNext,revealAll,createSpreadRecord,saveSpreadRecord,loadSpreadRecords} from './spread-core.js';
import {saveSpreadDraft,loadSpreadDraft} from './spread-draft.js';
import {prepareSpreadResume} from './spread-resume.js';
import {SPREADS,buildSpreadReading} from './spread-content.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const definition=SPREADS.find(s=>s.id==='clarity3');
function chosen(){let session=createSpreadSession({spreadId:'clarity3',count:3,question:'What can I see differently?',reversals:true});for(const slot of [2,8,13])session=selectSpreadCard(session,slot);return session;}
test('fully drawn unsaved spread reload prepares every face before rendering, continues and saves the same reading',()=>{
 for(const revealed of [0,1,3]){
  const storage=memory();let session=chosen();for(let i=0;i<revealed;i++)session=revealNext(session);saveSpreadDraft(storage,{session,note:'My original observation'});
  const pending=loadSpreadDraft(storage);const state=prepareSpreadResume(pending.session,()=>buildSpreadReading(definition,pending.session.cardIds,pending.session.intention,pending.session.orientations));
  assert.equal(state.full,true);assert.equal(state.reading.cards.length,3);
  for(const slot of state.slots){assert.equal(state.reading.cards[slot.index].orientation,slot.orientation);assert.equal(slot.revealed,slot.index<revealed);assert.equal(slot.cardId,session.cardIds[slot.index]);}
  const continued=revealAll(pending.session),record=createSpreadRecord(continued,definition,state.reading,pending.note);saveSpreadRecord(storage,record);
  const saved=loadSpreadRecords(storage)[0];assert.equal(saved.id,session.id);assert.deepEqual(saved.cardIds,session.cardIds);assert.deepEqual(saved.cards.map(card=>card.orientation),session.orientations);assert.equal(saved.question,session.question);assert.equal(saved.note,'My original observation');
 }
});
test('one-of-three recovery does not build an incomplete reading or reveal its selected face',()=>{
 const storage=memory(),session=selectSpreadCard(createSpreadSession({spreadId:'clarity3',count:3,question:'Keep this question'}),18);saveSpreadDraft(storage,{session});
 const recovered=loadSpreadDraft(storage),state=prepareSpreadResume(recovered.session,()=>{throw new Error('Must wait for the whole draw')});
 assert.equal(state.reading,null);assert.equal(state.full,false);assert.equal(state.slots.length,1);assert.equal(state.slots[0].revealed,false);assert.equal(recovered.session.deck.length,78);assert.equal(recovered.session.question,session.question);
});
