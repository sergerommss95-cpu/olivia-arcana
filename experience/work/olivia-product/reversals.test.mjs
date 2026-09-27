import test from 'node:test';
import assert from 'node:assert/strict';
import { ReadingError, STORAGE_KEY, createDeckOrientations, createSession, chooseCard, createRecord, loadRecords, saveRecord, exportRecords } from './core.js';
import { SPREAD_STORAGE_KEY, createSpreadSession, selectSpreadCard, revealNext, revealAll, createSpreadRecord, loadSpreadRecords, saveSpreadRecord, exportSpreadRecords } from './spread-core.js';
import { CARD_NOTES, REVERSED_NOTES, cardNotesForOrientation } from './content.js';
import { SPREADS, buildSpreadReading } from './spread-content.js';

const storage = () => { const map = new Map(); return { getItem:key=>map.get(key)??null, setItem:(key,value)=>map.set(key,value) }; };
const invalid = error => error instanceof ReadingError && error.code === 'VALIDATION';

function single() {
  const session = chooseCard(createSession({ reversals:true }, [18], () => 1), 0);
  return createRecord(session, { number:18, name:'The Moon' }, cardNotesForOrientation(18, session.orientation));
}
function spread() {
  const definition=SPREADS[0];
  let calls=0;
  let session=createSpreadSession({ spreadId:definition.id, count:3, reversals:true }, [0,18,21], () => calls++ % 2);
  for (const slot of [2,0,1]) session=selectSpreadCard(session,slot);
  session=revealAll(session);
  const reading=buildSpreadReading(definition,session.cardIds,'open',session.orientations);
  return {session,reading,definition,record:createSpreadRecord(session,definition,reading)};
}

test('upright-only mode never requests orientation randomness; reversal source validates its values', () => {
  assert.deepEqual(createDeckOrientations(3,false,()=>{throw new Error('Must not sample');}),['upright','upright','upright']);
  let sample=0;
  assert.deepEqual(createDeckOrientations(4,true,()=>sample++),['upright','reversed','upright','reversed']);
  assert.throws(()=>createDeckOrientations(3,'true'),invalid);
  assert.throws(()=>createDeckOrientations(3,true,()=>-1),invalid);
});

test('single-card orientation belongs to its initial deck slot and cannot change after selection', () => {
  const original=createSession({reversals:true},[18],()=>1);
  const selected=chooseCard(original,0);
  assert.equal(selected.orientation,'reversed');
  assert.equal(chooseCard(selected,0),selected);
  assert.equal(Object.isFrozen(selected.deckOrientations),true);
  assert.throws(()=>chooseCard({...selected,orientation:'upright'},0),invalid);
  assert.throws(()=>chooseCard({...original,reversals:false},0),invalid);
});

test('saved/exported orientation is stable and legacy single records migrate to upright', () => {
  const store=storage(), record=single();
  saveRecord(store,record);
  assert.equal(loadRecords(store)[0].orientation,'reversed');
  assert.equal(JSON.parse(exportRecords(loadRecords(store))).records[0].orientation,'reversed');
  assert.throws(()=>saveRecord(store,{...record,orientation:'upright'}),invalid);
  const {orientation,...legacy}=record;
  store.setItem(STORAGE_KEY,JSON.stringify({schemaVersion:1,records:[legacy]}));
  assert.equal(loadRecords(store)[0].orientation,'upright');
});

test('spread orientations follow pick order and remain fixed throughout reveal and persistence', () => {
  const {session,reading,definition,record}=spread();
  assert.deepEqual(session.orientations,session.selectedSlots.map(slot=>session.deckOrientations[slot]));
  assert.equal(Object.isFrozen(session.orientations),true);
  assert.deepEqual(revealNext(session).orientations,session.orientations);
  assert.deepEqual(revealAll(session).orientations,session.orientations);
  const store=storage(); saveSpreadRecord(store,record);
  assert.deepEqual(loadSpreadRecords(store)[0].cards.map(card=>card.orientation),session.orientations);
  assert.deepEqual(JSON.parse(exportSpreadRecords([record])).records[0].cards.map(card=>card.orientation),session.orientations);
  const tampered={...record,cards:record.cards.map((card,i)=>({...card,orientation:i===0?(card.orientation==='upright'?'reversed':'upright'):card.orientation}))};
  assert.throws(()=>saveSpreadRecord(store,tampered),invalid);
  assert.throws(()=>createSpreadRecord(session,definition,{...reading,cards:tampered.cards}),invalid);
});

test('legacy spread records and sessions stay upright, including later selections', () => {
  const {record}=spread(), store=storage();
  store.setItem(SPREAD_STORAGE_KEY,JSON.stringify({schemaVersion:1,records:[{...record,cards:record.cards.map(({orientation,...card})=>card)}]}));
  assert.deepEqual(loadSpreadRecords(store)[0].cards.map(card=>card.orientation),['upright','upright','upright']);
  const current=createSpreadSession({spreadId:'clarity3',count:3});
  const {orientations,deckOrientations,reversals,...legacy}=current;
  assert.deepEqual(selectSpreadCard(legacy,2).orientations,['upright']);
});

test('all 78 cards have distinct reversed reflections and mixed spread synthesis names reversals', () => {
  assert.equal(Object.keys(REVERSED_NOTES).length,78);
  for(let id=0;id<78;id++) {
    const note=cardNotesForOrientation(id,'reversed');
    assert.notEqual(note.meaning,CARD_NOTES[id].meaning);
    for(const key of ['meaning','prompt','practice','learn']) assert.ok(note[key]?.length>10,`${id} ${key}`);
  }
  const reading=buildSpreadReading('clarity3',[18,0,21],'open',['reversed','upright','upright']);
  assert.match(reading.cards[0].meaning,/The Moon reversed/);
  assert.match(reading.synthesis.paragraphs.join(' '),/The Moon reversed/);
  assert.throws(()=>buildSpreadReading('clarity3',[18,0,21],'open',['reversed']),TypeError);
});
