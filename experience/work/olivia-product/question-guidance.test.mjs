import test from 'node:test';
import assert from 'node:assert/strict';
import {guidancePayload,requestQuestionGuidance,readGuidanceStream} from './question-guidance.js';
test('AI receives the stated question and fixed orientation, but never the private journal',()=>{
 const record={id:'private-id',question:'How can I explore changing jobs?',cardId:9,orientation:'reversed',note:'private journal',interpretation:{meaning:'not trusted prompt'},createdAt:'private-date'};
 assert.deepEqual(guidancePayload(record,'uk'),{question:record.question,locale:'uk',spreadId:'single',cards:[{id:9,orientation:'reversed'}]});
});
test('saved spread orientations and card order survive into synthesis, legacy is upright',()=>{
 assert.deepEqual(guidancePayload({question:'Compare both options',spreadId:'clarity3',cardIds:[9,18,14],cards:[{orientation:'reversed'},{},{orientation:'upright'}]}).cards,[{id:9,orientation:'reversed'},{id:18,orientation:'upright'},{id:14,orientation:'upright'}]);
});


test('question synthesis cannot send anything without explicit per-reading consent',async t=>{
 const prior=globalThis.fetch;let sent=0;
 globalThis.fetch=async()=>{sent++;throw Error('Should not send');};
 t.after(()=>{globalThis.fetch=prior;});
 const payload=guidancePayload({question:'A private question that was not opted in',cardId:9});
 for(const consent of [undefined,false,'true',1]){
  await assert.rejects(requestQuestionGuidance(payload,{consent}),/Consent is required/);
 }
 assert.equal(sent,0);
});

test('a consented reading remounted while pending sends one request and reuses its answer',async t=>{
 const prior=globalThis.fetch;let sent=0,finish;
 globalThis.fetch=async(url,options)=>{
  sent++;assert.equal(url,'/api/reading');assert.equal(options.method,'POST');
  const body=JSON.parse(options.body);
  assert.equal(body.question,'How could I prepare for the move?');
  assert.equal('note' in body,false);
  return new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({source:'ai',synthesis:'One useful preparation is to identify the information you still need.'})});});
 };
 t.after(()=>{globalThis.fetch=prior;});
 const payload=guidancePayload({question:'How could I prepare for the move?',cardId:6,note:'Never transmitted'});
 const first=requestQuestionGuidance(payload,{consent:true});
 const remounted=requestQuestionGuidance(payload,{consent:true});
 assert.equal(sent,1);finish();
 assert.equal(await first,await remounted);
 assert.equal(await requestQuestionGuidance(payload,{consent:true}),await first);
 assert.equal(sent,1);
});

test('an interrupted interpretation can be retried without caching failure',async t=>{
 const prior=globalThis.fetch;let sent=0;
 globalThis.fetch=async()=>{
  sent++;
  if(sent===1)throw Error('Connection interrupted');
  return {ok:true,json:async()=>({source:'ai',synthesis:'What could you learn from a small first step?'})};
 };
 t.after(()=>{globalThis.fetch=prior;});
 const payload=guidancePayload({question:'Where can I begin after this interruption?',cardId:1});
 await assert.rejects(requestQuestionGuidance(payload,{consent:true}),/Connection interrupted/);
 assert.match(await requestQuestionGuidance(payload,{consent:true}),/small first step/);
 assert.equal(sent,2);
});

test('an invalid provider response is not presented or cached as a personal interpretation',async t=>{
 const prior=globalThis.fetch;let sent=0;
 globalThis.fetch=async()=>{sent++;return {ok:true,json:async()=>sent===1?({source:'prepared',synthesis:'Generic fallback'}):({source:'ai',synthesis:'A question-specific reflection.'})};};
 t.after(()=>{globalThis.fetch=prior;});
 const payload=guidancePayload({question:'A question for validating the response source',cardId:14});
 await assert.rejects(requestQuestionGuidance(payload,{consent:true}),/No interpretation/);
 assert.equal(await requestQuestionGuidance(payload,{consent:true}),'A question-specific reflection.');
 assert.equal(sent,2);
});

// A small DOM fixture exercises the component's asynchronous lifecycle without a browser.
function guidanceDOM(t){
 const originals=Object.fromEntries(['document','window','localStorage','fetch'].map(key=>[key,globalThis[key]]));
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.events={};this.style={setProperty(){}};this.className='';this.parentNode=null;this.textContent='';this.classList={remove:name=>{this.className=this.className.split(' ').filter(value=>value!==name).join(' ');},add:name=>{this.className=[...new Set([...this.className.split(' '),name])].join(' ').trim();}};}
  get isConnected(){return this.root===true||this.parentNode?.isConnected===true;}
  get childElementCount(){return this.children.length;}
  append(...children){for(const child of children){child.remove();child.parentNode=this;this.children.push(child);}}
  prepend(child){child.remove();child.parentNode=this;this.children.unshift(child);}
  replaceChildren(...children){for(const child of [...this.children])child.remove();this.append(...children);}
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;}}
  querySelector(selector){const match=node=>selector.startsWith('.')?node.className.split(' ').includes(selector.slice(1)):node.tagName===selector;for(const child of this.children){if(match(child))return child;const nested=child.querySelector(selector);if(nested)return nested;}return null;}
  setAttribute(key,value){this.attributes[key]=value;}
  removeAttribute(key){delete this.attributes[key];}
  addEventListener(event,fn){this.events[event]=fn;}
 }
 const root=new Element('main');root.root=true;
 globalThis.document={createElement:tag=>new Element(tag),querySelector:selector=>root.querySelector(selector)};
 globalThis.window={OLIVIA_LOCALE:'en'};globalThis.localStorage={getItem:()=>null};
 t.after(()=>{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}});
 return root;
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('question choice stays opt-in while explanation moves to the method page',async t=>{
 const root=guidanceDOM(t);let posts=0;
 globalThis.fetch=async(_url,options={})=>{if(options.method==='POST')posts++;return {ok:true,json:async()=>({available:true})};};
 const {mountGuidanceChoice}=await import('./question-guidance.js?presentation=quiet-choice');
 const choice=mountGuidanceChoice(root);await choice.ready;
 assert.equal(choice.getConsent(),false);assert.equal(posts,0);
 assert.equal(root.querySelector('.guidance-choice-status').hidden,true);
 assert.equal(root.querySelector('.guidance-how').href,'#method');
 assert.equal(root.querySelector('.guidance-how').textContent,'How Olivia works');
 assert.equal(root.querySelector('.guidance-privacy-details'),null);
 choice.input.checked=true;assert.equal(choice.getConsent(),true);
 choice.reset();assert.equal(choice.getConsent(),false);
});

test('presentation waits for an explicit action, then makes the personal answer primary and reports cached readiness',async t=>{
 const root=guidanceDOM(t);let posts=0,finish,writes=0;
 localStorage.setItem=()=>{writes++;};
 globalThis.fetch=async(_url,options={})=>{
  if(options.method!=='POST')return {ok:true,json:async()=>({available:true})};
  posts++;return new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({source:'ai',synthesis:'The cards point toward meaningful work.\n\nJudgement and The Empress connect renewal with patient growth.'})});});
 };
 const {mountQuestionGuidance}=await import('./question-guidance.js?presentation=1');
 const record={id:'presentation-reading',question:'What kind of work would fulfil me?',cardId:20};
 const states=[],results=[];mountQuestionGuidance(root,record,{onState:state=>states.push(state),onResult:result=>results.push(result)});await tick();
 assert.deepEqual(states,['idle']);assert.equal(posts,0);
 const pending=root.querySelector('button').events.click();
 assert.deepEqual(states,['idle','pending']);assert.equal(posts,1);
 finish();await pending;
 assert.deepEqual(states,['idle','pending','ready']);
 assert.equal(results.length,1);assert.equal(results[0].source,'ai');assert.equal(results[0].locale,'en');
 assert.match(results[0].synthesis,/meaningful work/);assert.equal(new Date(results[0].createdAt).toISOString(),results[0].createdAt);
 assert.equal(writes,0,'rendering a personal answer must not silently save it');
 assert.equal(root.querySelector('h3').textContent,'Your personal reading');
 assert.equal(root.querySelector('.guidance-lead').textContent,'The cards point toward meaningful work.');
 assert.match(root.querySelector('.guidance-body').querySelector('p').textContent,/Judgement and The Empress/);
 assert.equal(root.querySelector('.guidance-source'),null);
 assert.equal(root.querySelector('.guidance-result-method').textContent,'How Olivia works');
 assert.equal(root.querySelector('.guidance-result-method').href,'#method');
 const cachedStates=[],cachedResults=[];mountQuestionGuidance(root,record,{onState:state=>cachedStates.push(state),onResult:result=>cachedResults.push(result)});
 assert.deepEqual(cachedStates,['ready']);assert.equal(posts,1);
 assert.equal(cachedResults[0].synthesis,results[0].synthesis);assert.equal(writes,0);
});

test('detached reading cannot announce completion, while failures restore the fallback state and allow retry',async t=>{
 const root=guidanceDOM(t);let finish,fail=true;
 globalThis.fetch=async(_url,options={})=>{
  if(options.method!=='POST')return {ok:true,json:async()=>({available:true})};
  return new Promise((resolve,reject)=>{finish=()=>fail?reject(Error('Offline')):resolve({ok:true,json:async()=>({source:'ai',synthesis:'A considered direction.'})});});
 };
 const {mountQuestionGuidance}=await import('./question-guidance.js?presentation=2');
 const states=[],results=[];mountQuestionGuidance(root,{question:'How can I begin?',cardId:1},{autoRequest:true,onState:state=>states.push(state),onResult:result=>results.push(result)});await tick();
 assert.deepEqual(states,['pending']);finish();await tick();assert.deepEqual(states,['pending','error']);
 assert.equal(root.querySelector('button').disabled,false);
 fail=false;const retry=root.querySelector('button').events.click();assert.deepEqual(states,['pending','error','pending']);
 root.querySelector('.question-guidance').remove();finish();await retry;
 assert.deepEqual(states,['pending','error','pending']);assert.deepEqual(results,[],'a detached reading must not publish its late result');
 const empty=[];mountQuestionGuidance(root,{cardId:1},{onState:state=>empty.push(state)});assert.deepEqual(empty,['idle']);
});

test('a saved personal answer publishes its original timestamp without rewriting storage or contacting the provider',async t=>{
 const root=guidanceDOM(t);
 const {createSession,chooseCard,createRecord,saveRecord}=await import('./core.js');
 const values=new Map();let writes=0,requests=0;
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes++;values.set(key,value);}};
 const session=chooseCard(createSession({question:'What can I carry forward?'},[0]),0);
 const record=createRecord(session,{number:0,name:'The Fool'},{meaning:'A beginning.',prompt:'What is possible?',practice:'Notice one opening.'});
 record.guidance={source:'ai',locale:'en',synthesis:'The Fool carries a willingness to begin again.',createdAt:'2026-09-24T12:30:00.000Z'};
 saveRecord(localStorage,record);writes=0;
 globalThis.fetch=async()=>{requests++;throw Error('A saved answer does not need a provider request');};
 const {mountQuestionGuidance}=await import('./question-guidance.js?presentation=saved');
 const results=[],states=[];mountQuestionGuidance(root,record,{onResult:result=>results.push(result),onState:state=>states.push(state)});
 assert.deepEqual(results,[record.guidance]);assert.deepEqual(states,['ready']);assert.equal(writes,0);assert.equal(requests,0);
});

const ndjson=(events,{split=5,hold}={})=>new ReadableStream({async start(out){const bytes=new TextEncoder().encode(events.map(event=>JSON.stringify(event)+'\n').join(''));for(let i=0;i<bytes.length;i+=split){out.enqueue(bytes.slice(i,i+split));if(hold&&i===0)await hold;}out.close();}});
const streamed=(events,options)=>new Response(ndjson(events,options),{headers:{'Content-Type':'application/x-ndjson; charset=utf-8'}});

test('a streamed reading reports its text as it grows and returns only the confirmed reading',async()=>{
 const seen=[];
 const synthesis=await readGuidanceStream(ndjson([{type:'text',text:'Одна '},{type:'text',text:'думка.'},{type:'done',synthesis:'Одна думка.',source:'ai',locale:'uk',cardIds:[1]}],{split:3}),text=>seen.push(text));
 assert.equal(synthesis,'Одна думка.');
 assert.deepEqual(seen,['Одна ','Одна думка.']);
 await assert.rejects(readGuidanceStream(ndjson([{type:'text',text:'Partial'},{type:'error',code:'incomplete_response'}])),/incomplete_response/);
 await assert.rejects(readGuidanceStream(ndjson([{type:'text',text:'Partial'}])),/stopped before it was complete/);
 await assert.rejects(readGuidanceStream(ndjson([{type:'done',synthesis:'Generic',source:'prepared'}])),/No interpretation/);
 await assert.rejects(readGuidanceStream(new Response('{"type":"text"\n').body),/damaged/);
});

test('the page asks for a stream, shares the text so far with a remount, and caches only the complete reading',async t=>{
 const prior=globalThis.fetch;let sent=0,release;const hold=new Promise(resolve=>{release=resolve;});
 globalThis.fetch=async(url,options)=>{sent++;assert.match(options.headers.Accept,/application\/x-ndjson/);return streamed([{type:'text',text:'First paragraph.\n\n'},{type:'text',text:'Second.'},{type:'done',synthesis:'First paragraph.\n\nSecond.',source:'ai',locale:'en',cardIds:[4]}],{split:4,hold});};
 t.after(()=>{globalThis.fetch=prior;});
 const payload=guidancePayload({question:'What would steady me this week?',cardId:4});
 const first=[],second=[];
 const one=requestQuestionGuidance(payload,{consent:true,onText:text=>first.push(text)});
 await new Promise(resolve=>setTimeout(resolve,5));
 const two=requestQuestionGuidance(payload,{consent:true,onText:text=>second.push(text)});
 release();
 assert.equal(await one,'First paragraph.\n\nSecond.');
 assert.equal(await two,await one);
 assert.equal(sent,1);
 assert.equal(first.at(-1),'First paragraph.\n\nSecond.');
 assert.equal(second.at(-1),'First paragraph.\n\nSecond.');
 assert.equal(await requestQuestionGuidance(payload,{consent:true}),'First paragraph.\n\nSecond.');
 assert.equal(sent,1);
});

test('a stream that breaks off is not cached, and a retry asks again',async t=>{
 const prior=globalThis.fetch;let sent=0;
 globalThis.fetch=async()=>{sent++;return sent===1?streamed([{type:'text',text:'Half a thought'},{type:'error',code:'connection_interrupted'}]):streamed([{type:'text',text:'Whole.'},{type:'done',synthesis:'Whole.',source:'ai',locale:'en',cardIds:[2]}]);};
 t.after(()=>{globalThis.fetch=prior;});
 const payload=guidancePayload({question:'Where do I begin again?',cardId:2});
 await assert.rejects(requestQuestionGuidance(payload,{consent:true}),/connection_interrupted/);
 assert.equal(await requestQuestionGuidance(payload,{consent:true}),'Whole.');
 assert.equal(sent,2);
});
