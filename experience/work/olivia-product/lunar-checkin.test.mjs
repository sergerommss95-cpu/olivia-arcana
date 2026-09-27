import test from 'node:test';
import assert from 'node:assert/strict';
import {nextLunarCheckIns} from './lunar-checkin.js';
test('next lunar check-ins are future phases and match April 2024 eclipse new moon',()=>{
 const [n,f]=nextLunarCheckIns(new Date('2024-04-01T00:00:00Z'),'UTC');
 assert.equal(n.phase,'new');assert.equal(n.date,'2024-04-08');
 assert.ok(Math.abs(Date.parse(n.at)-Date.parse('2024-04-08T18:21:00Z'))<120000);
 assert.equal(f.date,'2024-04-23');assert.ok(Date.parse(f.at)>Date.parse(n.at));
});
test('local calendar date follows the actual phase instant across date boundaries',()=>{
 const now=new Date('2024-04-01T00:00:00Z');
 const east=nextLunarCheckIns(now,'Pacific/Auckland'),west=nextLunarCheckIns(now,'America/Los_Angeles');
 assert.equal(east[0].at,west[0].at);assert.equal(east[0].date,'2024-04-09');assert.equal(west[0].date,'2024-04-08');
 assert.throws(()=>nextLunarCheckIns(new Date(NaN)));assert.throws(()=>nextLunarCheckIns(now,'Not/AZone'));
});
test('starting after a phase finds the following lunation instead of a past date',()=>{
 const now=new Date('2024-04-09T00:00:00Z');const [n]=nextLunarCheckIns(now,'UTC');assert.equal(n.date,'2024-05-08');assert.ok(Date.parse(n.at)>now.getTime());
});
