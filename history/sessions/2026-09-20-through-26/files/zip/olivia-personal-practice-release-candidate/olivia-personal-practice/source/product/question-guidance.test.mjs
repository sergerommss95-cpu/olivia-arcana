import test from 'node:test';
import assert from 'node:assert/strict';
import {guidancePayload} from './question-guidance.js';
test('AI receives the stated question and fixed orientation, but never the private journal',()=>{
 const record={id:'private-id',question:'How can I explore changing jobs?',cardId:9,orientation:'reversed',note:'private journal',interpretation:{meaning:'not trusted prompt'},createdAt:'private-date'};
 assert.deepEqual(guidancePayload(record,'uk'),{question:record.question,locale:'uk',spreadId:'single',cards:[{id:9,orientation:'reversed'}]});
});
test('saved spread orientations and card order survive into synthesis, legacy is upright',()=>{
 assert.deepEqual(guidancePayload({question:'Compare both options',spreadId:'clarity3',cardIds:[9,18,14],cards:[{orientation:'reversed'},{},{orientation:'upright'}]}).cards,[{id:9,orientation:'reversed'},{id:18,orientation:'upright'},{id:14,orientation:'upright'}]);
});
