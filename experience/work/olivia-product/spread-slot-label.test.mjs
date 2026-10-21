import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpreadSession,selectSpreadCard} from './spread-core.js';
import {saveSpreadDraft,loadSpreadDraft} from './spread-draft.js';
import {spreadSlotLabel} from './spread-slot-label.js';
test('recovered selected slot is announced as face down, while the next position is still waiting in EN and UK',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const session=selectSpreadCard(createSpreadSession({spreadId:'clarity3',count:3,question:'What matters?'}),4);saveSpreadDraft(storage,{session});const recovered=loadSpreadDraft(storage).session;
 assert.equal(spreadSlotLabel(0,'Situation',recovered.cardIds.length>0),'1. Situation. Selected card, face down.');
 assert.equal(spreadSlotLabel(1,'Complication',recovered.cardIds.length>1),'2. Complication. Waiting for a card.');
 assert.equal(spreadSlotLabel(0,'Ситуація',true,'uk'),'1. Ситуація. Карту обрано, сорочкою догори.');
 assert.equal(spreadSlotLabel(1,'Що ускладнює',false,'uk'),'2. Що ускладнює. Очікує на карту.');
});
