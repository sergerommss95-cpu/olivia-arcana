import test from 'node:test';
import assert from 'node:assert/strict';
import {initMobileReading} from './mobile-reading.js';

class Node {
 constructor(tag,id=''){this.tagName=tag;this.id=id;this.children=[];this.parent=null;this.dataset={};this.hidden=false;this.open=false;this.className='';this._text='';}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set textContent(v){this._text=v;this.children=[];}
 get nextSibling(){if(!this.parent)return null;const s=this.parent.children;return s[s.indexOf(this)+1]||null;}
 detach(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}
 append(...nodes){for(const n of nodes){n.detach();n.parent=this;this.children.push(n);}}
 before(n){n.detach();const s=this.parent.children;n.parent=this.parent;s.splice(s.indexOf(this),0,n);}
 after(n){n.detach();const s=this.parent.children;n.parent=this.parent;s.splice(s.indexOf(this)+1,0,n);}
 replaceWith(n){const p=this.parent,i=p.children.indexOf(this);n.detach();p.children.splice(i,1,n);n.parent=p;this.parent=null;}
 remove(){this.detach();}
}
function setup(){
 const byId={},make=(tag,id,parent)=>{const n=new Node(tag,id);if(id)byId[id]=n;parent?.append(n);return n;};
 const view=make('main','reading-view'),layout=make('div','',view),art=make('div','',layout);art.className='reading-art';
 const copy=make('article','',layout);copy.className='reading-copy';
 const kind=make('p','reading-kind',copy),question=make('p','reading-question',copy),title=make('h1','result-title',copy);
 const save=make('section','save-section',copy),actions=make('div','',save);
 const button=make('button','save-reading',actions),almanac=make('a','view-saved',actions),notes=make('details','',save),status=make('p','save-status',save);
 const spreadSave=make('div','spread-save-section',view),spreadActions=make('div','',spreadSave),spreadButton=make('button','save-spread',spreadActions),spreadLink=make('a','',spreadActions),spreadStatus=make('p','spread-save-status',spreadSave);
 question.textContent='“Should I begin?”';
 const selectors={'.reading-copy':copy,'#reading-view .reading-art':art,'#reading-image':null};
 globalThis.document={documentElement:{lang:'en'},createElement:tag=>new Node(tag),createComment:()=>new Node('#comment'),querySelector:s=>s in selectors?selectors[s]:byId[s.slice(1)]||null};
 globalThis.MutationObserver=class{observe(){}disconnect(){}};
 const media={matches:true,listeners:[],addEventListener(_,fn){this.listeners.push(fn);},removeEventListener(){},change(v){this.matches=v;this.listeners.forEach(fn=>fn());}};
 globalThis.matchMedia=()=>media;
 return {media,copy,save,actions,button,almanac,notes,status,spreadSave,spreadActions,spreadButton,spreadLink,spreadStatus,kind,art,title};
}

test('on a phone the save confirmation sits directly beneath its button',()=>{
 const x=setup(),stop=initMobileReading();
 assert.deepEqual(x.actions.children,[x.button,x.status,x.almanac]);
 assert.deepEqual(x.spreadActions.children,[x.spreadButton,x.spreadStatus,x.spreadLink]);
 assert.equal(x.copy.children[0].className,'mobile-reading-context','the artwork header opens the reading');
 stop();
});

test('widening returns every moved node to its original place',()=>{
 const x=setup(),stop=initMobileReading();
 x.media.change(false);
 assert.deepEqual(x.actions.children,[x.button,x.almanac]);
 assert.deepEqual(x.save.children,[x.actions,x.notes,x.status]);
 assert.deepEqual(x.spreadSave.children,[x.spreadActions,x.spreadStatus]);
 assert.equal(x.copy.children.some(n=>n.className==='mobile-reading-context'),false);
 assert.equal(x.copy.children.some(n=>n.tagName==='#comment'),false,'no placeholder comments remain');
 x.media.change(true);
 assert.deepEqual(x.actions.children,[x.button,x.status,x.almanac],'narrowing again repeats the phone order once');
 stop();
});
