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
