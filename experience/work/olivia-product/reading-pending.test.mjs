import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadingReference} from './reading-reference.js';

// Delayed network promises make the before/during/after states observable.
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const answer=text=>({ok:true,json:async()=>({source:'ai',synthesis:text})});
let moduleId=0;
const freshGuidance=()=>import(`./question-guidance.js?pending-regression=${++moduleId}`);

function fixture(t,{reduced=true}={}){
 const keys=['document','window','localStorage','fetch','matchMedia'];
 const originals=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Element{
  constructor(tag){
   this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.events={};this.className='';this.parentNode=null;this.textContent='';this.hidden=false;this.inert=false;
   this.style={setProperty(){}};
   const classes=()=>this.className.split(/\s+/).filter(Boolean);
   this.classList={add:name=>{this.className=[...new Set([...classes(),name])].join(' ');},remove:name=>{this.className=classes().filter(value=>value!==name).join(' ');},toggle:(name,force)=>{const next=force??!classes().includes(name);next?this.classList.add(name):this.classList.remove(name);return next;}};
  }
  get hidden(){return this._hidden===true;}
  set hidden(value){this._hidden=Boolean(value);if(value&&globalThis.document?.activeElement===this)document.activeElement=document.body;}
  get isConnected(){return this.root===true||this.parentNode?.isConnected===true;}
  get childElementCount(){return this.children.length;}
  append(...nodes){for(const node of nodes){node.remove();node.parentNode=this;this.children.push(node);}}
  prepend(node){node.remove();node.parentNode=this;this.children.unshift(node);}
  before(node){const parent=this.parentNode;if(!parent)return;node.remove();node.parentNode=parent;parent.children.splice(parent.children.indexOf(this),0,node);}
  replaceChildren(...nodes){for(const node of [...this.children])node.remove();this.append(...nodes);}
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(node=>node!==this);this.parentNode=null;}}
  querySelector(selector){const matches=node=>selector.startsWith('.')?node.className.split(/\s+/).includes(selector.slice(1)):node.tagName===selector;for(const node of this.children){if(matches(node))return node;const nested=node.querySelector(selector);if(nested)return nested;}return null;}
  setAttribute(name,value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  addEventListener(type,handler){this.events[type]=handler;}
  focus(){document.activeElement=this;}
 }
 const root=new Element('main');root.root=true;
 const body=new Element('body');
 globalThis.document={createElement:tag=>new Element(tag),querySelector:selector=>root.querySelector(selector),body,activeElement:body};
 globalThis.window={OLIVIA_LOCALE:'en'};globalThis.localStorage={getItem:()=>null};globalThis.matchMedia=()=>({matches:reduced});
 t.after(()=>{for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 return {root,element:tag=>new Element(tag)};
}

test('prepared meanings cannot be seen or focused while pending, and failure restores them intact',t=>{
 const {root,element}=fixture(t),meaning=element('p'),prompt=element('p');
 meaning.textContent='An existing card meaning.';prompt.textContent='An existing reflection.';prompt.hidden=true;root.append(meaning,prompt);
 const reference=createReadingReference({nodes:[meaning,prompt],label:'Explore these cards'});
 assert.equal(reference.element.hidden,false);assert.equal(reference.element.open,true);
 reference.setState('pending');
 assert.equal(reference.element.hidden,true);assert.equal(reference.element.inert,true);
 reference.setState('error');
 assert.equal(reference.element.hidden,false);assert.equal(reference.element.inert,false);assert.equal(reference.element.open,true);
 assert.equal(meaning.textContent,'An existing card meaning.');assert.equal(prompt.hidden,true,'restoring the group must preserve a child’s authored visibility');
 reference.setState('ready');
 assert.equal(reference.element.hidden,false);assert.equal(reference.element.open,false);assert.equal(reference.element.querySelector('summary').hidden,false);
 reference.setState('idle');
 assert.equal(reference.element.open,true,'a later ordinary reading must not inherit the prior collapsed state');
});

test('an opted-in reading hides prepared content before the availability check resolves',async t=>{
 const {root,element}=fixture(t),availability=deferred(),response=deferred(),meaning=element('p'),host=element('div');
 meaning.textContent='Prepared text must wait.';root.append(meaning,host);
 const reference=createReadingReference({nodes:[meaning],label:'Explore this card'}),states=[];let posts=0;
 fetch=async(_url,options={})=>options.method==='POST'?(posts++,response.promise):availability.promise;
 const {mountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(host,{id:'no-flash',question:'What deserves attention?',cardId:9},{autoRequest:true,onState:state=>{states.push(state);reference.setState(state);}});
 assert.deepEqual(states,['pending']);assert.equal(reference.element.hidden,true);assert.equal(posts,0);
 assert.equal(host.querySelector('.reading-loader').hidden,false);assert.equal(host.querySelector('.guidance-result'),null);
 availability.resolve({ok:true,json:async()=>({available:true})});await tick();
 assert.equal(posts,1);assert.deepEqual(states,['pending']);
 response.resolve(answer('Take a quieter look at the decision.'));await tick();
 assert.deepEqual(states,['pending','ready']);assert.equal(reference.element.hidden,false);assert.equal(host.querySelector('.reading-loader'),null);
});

test('unavailable service ends the loader without sending the question and returns accessible meanings',async t=>{
 const {root,element}=fixture(t),availability=deferred(),meaning=element('p'),host=element('div');root.append(meaning,host);
 const reference=createReadingReference({nodes:[meaning],label:'Explore this card'}),states=[];let posts=0;
 fetch=async(_url,options={})=>{if(options.method==='POST')posts++;return availability.promise;};
 const {mountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(host,{id:'service-offline',question:'What could help?',cardId:14},{autoRequest:true,onState:state=>{states.push(state);reference.setState(state);}});
 assert.equal(reference.element.hidden,true);
 availability.resolve({ok:true,json:async()=>({available:false})});await tick();
 assert.deepEqual(states,['pending','error']);assert.equal(posts,0);assert.equal(reference.element.hidden,false);assert.equal(reference.element.inert,false);
 assert.equal(host.querySelector('.reading-loader'),null);assert.match(host.querySelector('.guidance-status').textContent,/unavailable/i);
});

test('returning during a consented request resumes preparation and receives one shared answer',async t=>{
 const {root}=fixture(t),response=deferred(),statesA=[],statesB=[],resultsA=[],resultsB=[];let posts=0;
 fetch=async(_url,options={})=>options.method==='POST'?(posts++,response.promise):({ok:true,json:async()=>({available:true})});
 const {mountQuestionGuidance,unmountQuestionGuidance}=await freshGuidance();
 const record={id:'return-pending',question:'Where could I begin with this change?',cardId:0};
 mountQuestionGuidance(root,record,{autoRequest:true,onState:state=>statesA.push(state),onResult:value=>resultsA.push(value)});await tick();
 const firstLoader=root.querySelector('.reading-loader');assert.equal(posts,1);
 unmountQuestionGuidance(root);assert.equal(firstLoader.hidden,true);
 mountQuestionGuidance(root,record,{autoRequest:false,onState:state=>statesB.push(state),onResult:value=>resultsB.push(value)});
 assert.deepEqual(statesB,['pending']);assert.equal(posts,1,'returning does not send another question');
 response.resolve(answer('Begin by making room for one manageable possibility.'));await tick();
 assert.deepEqual(statesA,['pending']);assert.deepEqual(resultsA,[]);
 assert.deepEqual(statesB,['pending','ready']);assert.equal(resultsB.length,1);assert.equal(posts,1);
 const cachedStates=[];mountQuestionGuidance(root,record,{onState:state=>cachedStates.push(state)});
 assert.deepEqual(cachedStates,['ready'],'an already completed answer never flashes another loader');assert.equal(posts,1);
});

test('leaving during the completion animation cancels the reveal and never steals focus',async t=>{
 const {root}=fixture(t,{reduced:false}),response=deferred(),states=[],results=[];
 fetch=async(_url,options={})=>options.method==='POST'?response.promise:({ok:true,json:async()=>({available:true})});
 const {mountQuestionGuidance,unmountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(root,{id:'cancel-completion',question:'How can I respond thoughtfully?',cardId:11},{autoRequest:true,onState:state=>states.push(state),onResult:value=>results.push(value)});await tick();
 const loader=root.querySelector('.reading-loader');loader.focus();
 response.resolve(answer('Make room for a fair response.'));await tick();
 assert.equal(loader.dataset.state,'complete');assert.deepEqual(states,['pending']);
 document.activeElement=null;unmountQuestionGuidance(root);await tick();
 assert.deepEqual(states,['pending']);assert.deepEqual(results,[]);assert.equal(document.activeElement,null);assert.equal(root.querySelector('.question-guidance'),null);
});

test('completion remembers loader focus after hiding it makes the browser focus the body',async t=>{
 const {root}=fixture(t),response=deferred(),reported=[];
 fetch=async(_url,options={})=>options.method==='POST'?response.promise:({ok:true,json:async()=>({available:true})});
 const {mountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(root,{id:'focus-after-hide',question:'What would help me see clearly?',cardId:9},{autoRequest:true,onState:(state,context)=>reported.push({state,...context})});await tick();
 const loader=root.querySelector('.reading-loader');loader.focus();
 response.resolve(answer('Give your own perspective time to become clear.'));await tick();
 assert.equal(loader.hidden,true);
 assert.deepEqual(reported,[{state:'pending'},{state:'ready',focused:true}], 'the page owner must know to restore the reading’s position after pending layout expands');
 assert.equal(document.activeElement,root.querySelector('.guidance-kicker'),'keyboard focus continues at the revealed reading instead of being lost on the body');
});

test('moving focus elsewhere during completion prevents the answer from taking it back',async t=>{
 const {root,element}=fixture(t,{reduced:false}),host=element('div'),navigation=element('a'),response=deferred(),reported=[];
 root.append(host,navigation);
 fetch=async(_url,options={})=>options.method==='POST'?response.promise:({ok:true,json:async()=>({available:true})});
 const {mountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(host,{id:'focus-moved-away',question:'How can I take a considered next step?',cardId:14},{autoRequest:true,onState:(state,context)=>reported.push({state,...context})});await tick();
 host.querySelector('.reading-loader').focus();response.resolve(answer('Give the next step the attention it deserves.'));await tick();
 assert.equal(host.querySelector('.reading-loader').dataset.state,'complete');navigation.focus();
 await new Promise(resolve=>setTimeout(resolve,380));
 assert.deepEqual(reported,[{state:'pending'},{state:'ready',focused:false}]);assert.equal(document.activeElement,navigation);
});

test('a failed personal request reveals fallback content and retry hides it again',async t=>{
 const {root,element}=fixture(t),first=deferred(),second=deferred(),meaning=element('p'),host=element('div');root.append(meaning,host);
 const reference=createReadingReference({nodes:[meaning],label:'Explore this card'}),states=[];let posts=0;
 fetch=async(_url,options={})=>options.method==='POST'?(++posts===1?first.promise:second.promise):({ok:true,json:async()=>({available:true})});
 const {mountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(host,{id:'retry-pending',question:'What should I consider?',cardId:2},{autoRequest:true,onState:state=>{states.push(state);reference.setState(state);}});await tick();
 first.reject(Error('Connection interrupted'));await tick();
 assert.deepEqual(states,['pending','error']);assert.equal(reference.element.hidden,false);
 const retry=host.querySelector('button');assert.equal(retry.disabled,false);const request=retry.events.click();
 assert.deepEqual(states,['pending','error','pending']);assert.equal(reference.element.hidden,true);assert.equal(posts,2);
 second.resolve(answer('Notice what is still unclear before acting.'));await request;
 assert.deepEqual(states,['pending','error','pending','ready']);assert.equal(reference.element.hidden,false);
});

test('a reading without a question never starts a loader or provider request',async t=>{
 const {root}=fixture(t),states=[];let requests=0;
 fetch=async()=>{requests++;throw Error('Should not be requested');};
 const {mountQuestionGuidance}=await freshGuidance();
 mountQuestionGuidance(root,{id:'open-reading',question:'  ',cardId:17},{autoRequest:true,onState:state=>states.push(state)});
 assert.deepEqual(states,['idle']);assert.equal(root.querySelector('.reading-loader'),null);assert.equal(requests,0);
});
