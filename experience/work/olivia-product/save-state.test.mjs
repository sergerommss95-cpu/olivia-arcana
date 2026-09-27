import test from 'node:test';
import assert from 'node:assert/strict';
import {saveLabel,setSaveState,guidanceSaveState} from './save-state.js';

class FakeNode {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';}
 setAttribute(name,value){this.attributes[name]=value;}
 replaceChildren(...nodes){this.children=nodes;}
}
globalThis.document={createElement:tag=>new FakeNode(tag),createTextNode:text=>({nodeType:3,textContent:text})};

test('a personal reading on an unkept record is still a first keep',()=>{
 const guidance={source:'ai',locale:'en',synthesis:'Read together.'};
 assert.equal(guidanceSaveState(undefined,guidance),'keep');
 assert.equal(guidanceSaveState(null,guidance),'keep');
});

test('a kept record only asks for an update when the personal reading differs',()=>{
 const guidance={source:'ai',locale:'en',synthesis:'Read together.'};
 assert.equal(guidanceSaveState({id:'a',guidance},{...guidance}),null);
 assert.equal(guidanceSaveState({id:'a'},guidance),'update');
 assert.equal(guidanceSaveState({id:'a',guidance},{...guidance,synthesis:'Another answer.'}),'update');
 assert.equal(guidanceSaveState({id:'a',guidance},{...guidance,locale:'uk'}),'update');
});

test('labels name the right action for readings and spreads',()=>{
 assert.equal(saveLabel('keep'),'Keep this reading');
 assert.equal(saveLabel('keep','spread'),'Keep this spread');
 assert.equal(saveLabel('update','spread'),'Save updated reading');
 assert.equal(saveLabel('saved'),'Saved');
 assert.equal(saveLabel('unknown'),'Keep this reading');
});

test('the button carries its state and a done mark once saved',()=>{
 const button=new FakeNode('button');
 setSaveState(button,'keep');
 assert.equal(button.dataset.saveState,'keep');
 assert.equal(button.children[0].textContent,'Keep this reading ');
 assert.equal(button.children[1].textContent,'↗');
 assert.equal(button.children[1].attributes['aria-hidden'],'true');
 setSaveState(button,'saved',{kind:'spread'});
 assert.equal(button.dataset.saveState,'saved');
 assert.equal(button.children[0].textContent,'Saved ');
 assert.equal(button.children[1].textContent,'✓');
 setSaveState(button,'bogus');
 assert.equal(button.dataset.saveState,'keep');
});

test('Ukrainian labels come from the shared dictionary',()=>{
 const button=new FakeNode('button');
 setSaveState(button,'keep',{kind:'spread',locale:'uk'});
 assert.equal(button.children[0].textContent,'Зберегти розклад ');
 setSaveState(button,'saved',{locale:'uk'});
 assert.equal(button.children[0].textContent,'Збережено ');
 setSaveState(button,'update',{locale:'uk'});
 assert.equal(button.children[0].textContent,'Зберегти оновлене читання ');
});

test('Safari storage note targets iPhone and iPad browsers, not Home Screen apps', async () => {
  const {safariMayClear} = await import('./save-state.js');
  const noMatch = () => ({matches: false});
  const iphone = {userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1'};
  assert.equal(safariMayClear({nav: iphone, match: noMatch}), true);
  assert.equal(safariMayClear({nav: {...iphone, standalone: true}, match: noMatch}), false);
  assert.equal(safariMayClear({nav: iphone, match: () => ({matches: true})}), false);
  assert.equal(safariMayClear({nav: {userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5}, match: noMatch}), true);
  assert.equal(safariMayClear({nav: {userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0}, match: noMatch}), false);
  assert.equal(safariMayClear({nav: {userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)'}, match: noMatch}), false);
});

test('durable storage is requested once and never throws', async () => {
  const {requestDurableStorage} = await import('./save-state.js');
  let asked = 0;
  requestDurableStorage({persisted: async () => false, persist: async () => { asked++; return true; }});
  requestDurableStorage({persisted: async () => true, persist: async () => { asked++; return true; }});
  requestDurableStorage(undefined);
  requestDurableStorage({persisted: () => { throw new Error('blocked'); }, persist: async () => true});
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(asked, 1);
});
