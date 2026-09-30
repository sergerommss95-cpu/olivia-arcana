import test from 'node:test';
import assert from 'node:assert/strict';
import {initReadingEntry} from './journey-entry.js';

class Element {
 constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.dataset={};this.listeners={};this.attributes={};this.style={setProperty(){}};this.value='';this.textContent='';this.className='';}
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
 before(node){node.parent=this.parent;const siblings=this.parent.children;siblings.splice(siblings.indexOf(this),0,node);}
 after(node){node.parent=this.parent;const siblings=this.parent.children;siblings.splice(siblings.indexOf(this)+1,0,node);}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);}
 focus(){}
 matches(selector){return selector==='input'?this.tag==='input':selector==='button[type=submit]'?this.tag==='button'&&this.type==='submit':selector.startsWith('.')?this.className.split(' ').includes(selector.slice(1)):this.tag===selector;}
 querySelectorAll(selector){return this.children.flatMap(node=>[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
function setup(locale='en'){
 globalThis.document={documentElement:{lang:locale},createElement:tag=>new Element(tag)};
 globalThis.window={OLIVIA_LOCALE:locale,location:{pathname:'/',search:''}};
 globalThis.Image=class extends Element {constructor(){super('img');}};
 const form=new Element('form'),input=new Element('textarea'),submit=new Element('button');submit.type='submit';form.append(input,submit);
 const entry=initReadingEntry({form,input,assets:{back:'back.png'},onMore(){}});
 return {entry,form,input,submit,recommendation:form.querySelector('.reading-recommendation'),radio:count=>form.querySelectorAll('input').find(node=>Number(node.value)===count)};
}

test('typing or autofilling a question keeps the displayed one-card reading and action',()=>{
 const x=setup();assert.equal(x.entry.getCount(),1);assert.equal(x.submit.textContent,'Choose my card ↗');
 x.input.value='How can I bring more warmth into my friendships?';
 assert.equal(x.entry.getCount(),1,'autofill cannot route a one-card button into a spread');
 x.input.dispatchEvent(new Event('input'));
 assert.equal(x.entry.getCount(),1);assert.equal(x.submit.textContent,'Choose my card ↗');assert.equal(x.recommendation.dataset.count,1);assert.equal(x.radio(1).checked,true);
 x.input.value='';x.input.dispatchEvent(new Event('input'));assert.equal(x.entry.getCount(),1);
});

test('an explicit three-card selection stays consistent through edits to the question',()=>{
 const x=setup();x.radio(3).dispatchEvent(new Event('change'));
 assert.equal(x.entry.getCount(),3);assert.equal(x.submit.textContent,'Choose my three cards ↗');assert.equal(x.radio(3).checked,true);
 x.input.value='What deserves my attention?';x.input.dispatchEvent(new Event('input'));assert.equal(x.entry.getCount(),3);
 x.radio(1).dispatchEvent(new Event('change'));assert.equal(x.entry.getCount(),1);assert.equal(x.submit.textContent,'Choose my card ↗');
});

test('an approved coached plan can explicitly choose a three-card reading',()=>{
 const x=setup();x.entry.setPlan({spreadName:'Where to begin',positions:[{label:'Here'},{label:'The tension'},{label:'The next step'}]});
 assert.equal(x.entry.getCount(),3);assert.equal(x.recommendation.querySelector('h3').textContent,'Where to begin');assert.equal(x.submit.textContent,'Choose my three cards ↗');
 x.entry.setCount(1);assert.equal(x.entry.getCount(),1);assert.equal(x.submit.textContent,'Choose my card ↗');
});

test('the Ukrainian question flow offers the same stable one-card choice',()=>{
 const x=setup('uk');x.input.value='На що мені варто звернути увагу?';x.input.dispatchEvent(new Event('input'));
 assert.equal(x.entry.getCount(),1);assert.equal(x.submit.textContent,'Обрати мою карту ↗');
 x.radio(3).dispatchEvent(new Event('change'));assert.equal(x.entry.getCount(),3);assert.equal(x.submit.textContent,'Обрати мої три карти ↗');
});
