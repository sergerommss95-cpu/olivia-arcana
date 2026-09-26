import assert from 'node:assert/strict';
import {initMobileQuestion} from './mobile-question.js';
class Node {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.hidden=false;this.open=false;this.dataset={};this.children=[];this.listeners=new Map();this.selectors=new Map();this.value='';this.innerHTML='';this.textContent='';}
 querySelector(s){return this.selectors.get(s)||null;}
 detach(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}}
 contains(n){return n===this||this.children.some(c=>c.contains(n));}
 getClientRects(){let n=this;while(n){if(n.hidden)return [];n=n.parentElement;}return [{}];}
 append(...children){for(const c of children){c.detach();c.parentElement=this;this.children.push(c);}}
 prepend(c){c.detach();c.parentElement=this;this.children.unshift(c);}
 after(c){if(this.parentElement){const p=this.parentElement;c.detach();c.parentElement=p;p.children.splice(p.children.indexOf(this)+1,0,c);}}
 before(c){if(this.parentElement){const p=this.parentElement;c.detach();c.parentElement=p;p.children.splice(p.children.indexOf(this),0,c);}}
 addEventListener(type,fn,opts){const arr=this.listeners.get(type)||[];arr.push({fn,capture:!!opts?.capture});this.listeners.set(type,arr);}
 fire(type){const event={defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true},stopImmediatePropagation(){this.stopped=true}};for(const item of [...this.listeners.get(type)||[]].sort((a,b)=>Number(b.capture)-Number(a.capture))){item.fn(event);if(event.stopped)break;}return event;}
 focus(){document.activeElement=this;}
 blur(){if(document.activeElement===this)document.activeElement=document.body;}
 scrollIntoView(){}
}
function setup(mobile=true,locale='en'){
 const nodes={form:new Node('form'),input:new Node('textarea'),title:new Node('h2'),view:new Node('section'),recommendation:new Node('section'),choice:new Node('details'),label:new Node('label'),examples:new Node('details'),submit:new Node('button'),extras:new Node(),consent:new Node(),consentHost:new Node(),body:new Node('body')};
 nodes.title.innerHTML='What is on<br><em>your mind?</em>';nodes.title.tabIndex=-1;nodes.body.dataset.view='home';nodes.consentHost.append(nodes.consent);nodes.form.append(nodes.label,nodes.examples,nodes.input,nodes.recommendation,nodes.consentHost,nodes.submit,nodes.extras);nodes.view.append(nodes.title,nodes.form);
 for(const [selector,key]of[['.reading-recommendation','recommendation'],['.reading-size-choice','choice'],['label[for=question]','label'],['.question-examples','examples'],['button[type=submit]','submit'],['.question-entry-extras','extras'],['.guidance-choice','consent']])nodes.form.selectors.set(selector,nodes[key]);
 globalThis.document={body:nodes.body,activeElement:nodes.body,querySelector(selector){return nodes[{'#question-form':'form','#question':'input','#question-title':'title','#question-view':'view'}[selector]]},createElement:tag=>new Node(tag),createComment:()=>new Node('comment')};
 const mq={matches:mobile,listeners:[],addEventListener(type,fn){this.listeners.push(fn)},change(value){this.matches=value;this.listeners.forEach(fn=>fn())}};globalThis.matchMedia=()=>mq;
 let observer;globalThis.MutationObserver=class{constructor(fn){observer=fn}observe(){}};
 let submissions=0;nodes.form.addEventListener('submit',()=>submissions++);
 const api=initMobileQuestion({locale});
 return {...nodes,mq,api,route(view){nodes.body.dataset.view=view;observer()},get submissions(){return submissions},get next(){return nodes.form.children.find(n=>n.className==='solid-action mobile-question-next')},get preview(){return nodes.form.children.find(n=>n.className==='mobile-question-preview')}};
}
{
 const x=setup();assert.equal(x.api.getPhase(),'compose');assert.equal(x.input.hidden,false);assert.equal(x.submit.hidden,true);x.input.value='Should I start a creative project?';const event=x.form.fire('submit');assert.equal(event.defaultPrevented,true);assert.equal(x.submissions,0);assert.equal(x.api.getPhase(),'prepare');assert.equal(x.input.hidden,true);assert.equal(x.consentHost.hidden,false);assert.equal(x.preview.children[0].textContent,x.input.value);assert.equal(document.activeElement,x.title);x.form.fire('submit');assert.equal(x.submissions,1);x.preview.children[1].fire('click');assert.equal(x.api.getPhase(),'compose');assert.equal(x.input.value,'Should I start a creative project?');assert.equal(document.activeElement,x.input);console.log('PASS compose/prepare gates native submit and retains question');
}
{
 const x=setup();x.next.fire('click');x.mq.change(false);assert.equal(x.input.hidden,false);assert.equal(x.submit.hidden,false);assert.equal(x.title.innerHTML,'What is on<br><em>your mind?</em>');assert.equal(x.choice.open,false);assert.equal(x.next.hidden,true);x.form.fire('submit');assert.equal(x.submissions,1);x.mq.change(true);assert.equal(x.api.getPhase(),'prepare');assert.equal(x.submit.hidden,false);console.log('PASS desktop restoration and phone state retained');
}
{
 const x=setup();x.route('question');x.next.fire('click');x.input.value='A retained question';x.route('choose');x.route('question');assert.equal(x.api.getPhase(),'compose');assert.equal(x.input.value,'A retained question');console.log('PASS route return resets composition without erasing question');
}
{
 const x=setup(true,'uk');assert.equal(x.next.textContent,'Продовжити →');x.next.fire('click');assert.match(x.title.innerHTML,/Яку форму/);console.log('PASS Ukrainian phase copy');
}
{
 const x=setup();x.next.fire('click');x.preview.children[1].focus();x.mq.change(false);assert.equal(document.activeElement,x.title);assert.equal(x.preview.hidden,true);console.log('PASS widening restores focus from hidden mobile preview');
}

{
 const x=setup();assert.ok(x.form.children.indexOf(x.input)<x.form.children.indexOf(x.examples));assert.ok(x.form.children.indexOf(x.examples)<x.form.children.indexOf(x.next));x.mq.change(false);assert.ok(x.form.children.indexOf(x.examples)<x.form.children.indexOf(x.input));assert.equal(x.form.children.filter(n=>n===x.examples).length,1);x.mq.change(true);assert.ok(x.form.children.indexOf(x.input)<x.form.children.indexOf(x.examples));assert.equal(x.form.children.filter(n=>n===x.examples).length,1);console.log('PASS examples relocate and restore original order without duplication');
}
{
 const x=setup();x.next.fire('click');x.mq.change(false);x.input.focus();x.mq.change(true);assert.ok(!(document.activeElement===x.input&&x.input.hidden));console.log('PASS narrowing restores focus');
}
