import test from 'node:test';import assert from 'node:assert/strict';
import {chooseReturnReflection} from './home-return.js';
const entry=(id,kind='single',createdAt='2026-09-30T12:00:00.000Z')=>({kind,record:{id,createdAt}});
const meta=(id,kind='single',revisitDate='2026-09-30')=>({id,kind,topic:'',nextStep:'',revisitDate,outcome:'',reviewedAt:null});
test('home offers only existing readings, prefers a due return and supports spreads',()=>{
 const chosen=chooseReturnReflection([entry('recent'),entry('older','spread','2026-09-20T12:00:00.000Z')],[meta('missing'),meta('older','spread')],'2026-09-30');
 assert.equal(chosen.record.id,'older');assert.equal(chosen.kind,'spread');assert.equal(chosen.due,true);
});
test('future/reviewed returns do not imply overdue work; empty histories stay empty',()=>{
 const m={...meta('old'),reviewedAt:'2026-09-30T12:00:00.000Z'};
 assert.equal(chooseReturnReflection([],[],'2026-09-30'),null);
 const result=chooseReturnReflection([entry('latest'),entry('old','single','2026-09-20T12:00:00.000Z')],[m,meta('latest','single','2026-10-10')],'2026-09-30');
 assert.equal(result.record.id,'latest');assert.equal(result.due,false);
});
