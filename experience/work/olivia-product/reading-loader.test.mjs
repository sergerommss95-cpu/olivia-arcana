import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadingLoader} from './reading-loader.js';

function fixture(t,{reduced=false}={}){
 const keys=['document','matchMedia','setTimeout','clearTimeout'];
 const originals=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));
 const timers=new Map();let serial=0;
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.isConnected=true;this.style={setProperty(){}};}
  append(...nodes){this.children.push(...nodes);}
  setAttribute(key,value){this.attributes[key]=value;}
 }
 globalThis.document={createElement:tag=>new Element(tag)};
 globalThis.matchMedia=()=>({matches:reduced});
 globalThis.setTimeout=(callback,duration)=>{timers.set(++serial,{callback,duration});return serial;};
 globalThis.clearTimeout=id=>timers.delete(id);
 t.after(()=>{for(const [key,value]of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}});
 return timers;
}

test('working state has honest accessible status and no JavaScript progress timer',t=>{
 const timers=fixture(t);const loader=createReadingLoader();
 assert.equal(loader.element.hidden,true);loader.start();
 assert.equal(loader.element.hidden,false);assert.equal(loader.element.dataset.state,'working');
 assert.equal(loader.element.attributes['aria-busy'],'true');
 assert.equal(loader.element.children[0].textContent,'Preparing your personal reading');
 assert.equal(loader.element.children[1].children[1].textContent,'ARCANA');
 assert.equal(timers.size,0);
});

test('completion waits only for a short fade and concurrent finishes share it',async t=>{
 const timers=fixture(t);const loader=createReadingLoader();loader.start();
 const finished=loader.finish();assert.equal(loader.finish(),finished);assert.equal(timers.size,1);
 const [timer]=timers.values();assert.equal(timer.duration,360);timer.callback();
 assert.equal(await finished,true);assert.equal(loader.element.hidden,true);
 assert.equal(loader.element.attributes['aria-busy'],'false');
});

test('stopping or restarting cancels completion without revealing an obsolete answer',async t=>{
 const timers=fixture(t);const loader=createReadingLoader();loader.start();
 const stopped=loader.finish();loader.stop();
 assert.equal(await stopped,false);assert.equal(timers.size,0);assert.equal(loader.element.hidden,true);
 loader.start();const restarted=loader.finish();loader.start();
 assert.equal(await restarted,false);assert.equal(timers.size,0);
 assert.equal(loader.element.dataset.state,'working');assert.equal(loader.element.hidden,false);
});

test('reduced motion and detached views finish immediately',async t=>{
 const timers=fixture(t,{reduced:true});const loader=createReadingLoader({locale:'uk'});loader.start();
 assert.equal(loader.element.children[0].textContent,'Готуємо ваше особисте читання');
 assert.equal(await loader.finish(),true);assert.equal(timers.size,0);
 globalThis.matchMedia=()=>({matches:false});loader.start();loader.element.isConnected=false;
 assert.equal(await loader.finish(),true);assert.equal(timers.size,0);
});
