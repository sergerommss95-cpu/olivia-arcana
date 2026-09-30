import test from 'node:test';
import assert from 'node:assert/strict';
import { launchAvailability } from './launch-policy.js';
import { forgetBirthData, exportBirthData, BIRTH_KEYS } from './birth-storage.js';
import { register, login, getMe, updateBirthData } from './api.ts';
import { createPortalSession, telegramStarsLink } from './payments.ts';
test('all public flag combinations fail closed until source approval', () => {
 for (const accounts of [undefined,'true','false','1']) for (const payments of [undefined,'true','false','1']) assert.deepEqual(launchAvailability({accounts,payments}),{accounts:false,payments:false});
 const review = {accountsApproved:true,sellerVerified:true,providerApproved:true,paidTermsApproved:true};
 for (const key of Object.keys(review)) assert.equal(launchAvailability({accounts:'true',payments:'true'},{...review,[key]:false}).payments,false);
});
test('direct auth, birth upload, portal and Stars cannot bypass paused UI', async t => {
 let calls=0; t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('network forbidden');});
 for (let i=0;i<2;i++) for (const action of [()=>register('x','x'),()=>login('x','x'),()=>getMe(),()=>updateBirthData({date:'private'}),()=>createPortalSession()]) await assert.rejects(action(),/paused/);
 assert.throws(()=>telegramStarsLink('insight_monthly'),/paused/);assert.equal(calls,0);
});
test('birth export is lossless; repeated deletion removes both sources and preserves journals',()=>{
 const values=new Map([...BIRTH_KEYS.map(k=>[k,JSON.stringify({input:{year:1990},v:1})]),['olivia:journal','original words'],['olivia:spreads','saved artwork']]);
 const storage={getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)};
 const backup=exportBirthData(storage);assert.equal(backup.stores[BIRTH_KEYS[1]],values.get(BIRTH_KEYS[1]));
 assert.equal(forgetBirthData(storage),true);assert.equal(forgetBirthData(storage),true);
 for(const key of BIRTH_KEYS)assert.equal(storage.getItem(key),null);
 assert.equal(storage.getItem('olivia:journal'),'original words');assert.equal(storage.getItem('olivia:spreads'),'saved artwork');
});
test('partial deletion is reported and independent stores are still attempted',()=>{
 const removed=[];const storage={removeItem:k=>{if(k===BIRTH_KEYS[0])throw Error('blocked');removed.push(k)},getItem:()=>null};
 assert.equal(forgetBirthData(storage),false);assert.deepEqual(removed,[BIRTH_KEYS[1]]);
 assert.throws(()=>exportBirthData({getItem:()=>{throw Error('blocked')}}),/blocked/);
});
test('current and legacy profile loaders stay empty after forgetting and reload', async t=>{
 const {forgetProfile,loadProfile,legacyBirth}=await import('./astrology/profile.ts');
 const values=new Map([[BIRTH_KEYS[0],JSON.stringify({v:1,date:'1990-01-02',place:{zone:'Europe/Kyiv'}})],[BIRTH_KEYS[1],JSON.stringify({input:{year:1990,month:1,day:2,hour:8,minute:30,latitude:50,longitude:30}})],['journal','saved']]);
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)}});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage});
 assert.ok(loadProfile());assert.ok(legacyBirth());assert.equal(forgetProfile(),true);
 for(let reload=0;reload<2;reload++){assert.equal(loadProfile(),null);assert.equal(legacyBirth(),null)}
 assert.equal(values.get('journal'),'saved');
});
