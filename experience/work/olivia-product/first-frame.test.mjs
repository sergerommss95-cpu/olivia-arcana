import test from 'node:test';
import assert from 'node:assert/strict';
import {firstFrame,holdSectionArt} from './first-frame.js';
import {HELD_ART,showArt} from './held-art.js';
import {createMasthead,mastheadMarkup} from './mobile-masthead.js';

function page({phone=true,lang='en',view}={}){
 const listeners={};
 const element=tag=>({tagName:tag.toUpperCase(),className:'',dataset:{},innerHTML:'',addEventListener(type,fn,options){listeners[type]={fn,options};}});
 const children=[];
 const classes=new Set(['min-h-screen']);
 const body={dataset:view?{view}:{},classList:{add:name=>classes.add(name),contains:name=>classes.has(name)},append:node=>children.push(node)};
 const doc={body,documentElement:{lang},createElement:element,querySelector:selector=>selector==='header.mobile-masthead'?children.find(node=>node.className==='mobile-masthead')||null:null};
 const win={matchMedia:query=>({matches:phone&&query==='(max-width:700px)'})};
 return {doc,win,body,classes,children,listeners};
}

test('a phone gets its composition and masthead before the first paint',()=>{
 const x=page();
 assert.equal(firstFrame(x.doc,x.win),true);
 assert.ok(x.classes.has('mobile-experience'));
 assert.equal(x.body.dataset.view,'home');
 assert.equal(x.body.dataset.mobileImmersive,'true');
 assert.equal(x.children.length,1);
 const [header]=x.children;
 assert.equal(header.className,'mobile-masthead');
 assert.equal(header.dataset.noTranslate,'true');
 assert.equal(header.dataset.arrival,'true');
 assert.equal(header.innerHTML,mastheadMarkup('en'));
 assert.match(header.innerHTML,/aria-label="Explore"/);
});

test('the masthead arrives once: its arrival marker is removed after the entrance',()=>{
 const x=page();firstFrame(x.doc,x.win);
 const [header]=x.children;
 assert.equal(x.listeners.animationend.options.once,true);
 x.listeners.animationend.fn();
 assert.equal(header.dataset.arrival,undefined);
});

test('Ukrainian pages get the Ukrainian menu label',()=>{
 const x=page({lang:'uk'});firstFrame(x.doc,x.win);
 assert.match(x.children[0].innerHTML,/aria-label="Досліджуйте"/);
 assert.equal(x.children[0].innerHTML,mastheadMarkup('uk'));
});

test('an existing view and masthead are kept',()=>{
 const x=page({view:'question'});
 x.children.push(createMasthead(x.doc,'en'));
 firstFrame(x.doc,x.win);
 assert.equal(x.body.dataset.view,'question');
 assert.equal(x.children.length,1);
});

test('desktop is left exactly as it was',()=>{
 const x=page({phone:false});
 assert.equal(firstFrame(x.doc,x.win),false);
 assert.deepEqual([...x.classes],['min-h-screen']);
 assert.deepEqual(x.body.dataset,{});
 assert.equal(x.children.length,0);
});

test('the shared masthead markup matches the phone shell in both languages',()=>{
 for(const [locale,label] of [['en','Explore'],['uk','Досліджуйте']]){
  const markup=mastheadMarkup(locale);
  assert.ok(markup.startsWith('<a class="mobile-signature" href="#home" aria-label="Olivia Arcana">Olivia <span>ARCANA</span></a>'));
  assert.ok(markup.includes(`<button type="button" class="mobile-menu-toggle" aria-label="${label}" aria-haspopup="dialog" aria-controls="mobile-explore"><span>${label}</span>`));
 }
 assert.equal(mastheadMarkup('fr'),mastheadMarkup('en'));
});

function artPage({io=true}={}){
 const practice={name:'practice'},sample={name:'sample'};
 const image=(art,src,section)=>{const attrs={src};const img={nodeType:1,tagName:'IMG',dataset:{homeArt:art},getAttribute:name=>attrs[name]??null,closest:selector=>selector==='section'?section:null,matches:selector=>selector==='img[data-home-art]'&&img.dataset.homeArt!==undefined};Object.defineProperty(img,'src',{get:()=>attrs.src,set:value=>{attrs.src=value;}});return img;};
 const star=image('17','/experience/assets/17-the-star.webp',practice),back=image('back','/experience/assets/card-back.webp',practice),hermit=image('9','/experience/assets/09-the-hermit.webp',sample),loose=image('2','/experience/assets/02-the-high-priestess.webp',null);
 const markup={nodeType:1,tagName:'DIV',querySelectorAll:()=>[star,back,hermit,loose]};
 const state={ready:null,watching:false,observed:[],unobserved:[]};
 const win={MutationObserver:class{constructor(fn){state.mutations=fn;}observe(){state.watching=true;}disconnect(){state.watching=false;}},addEventListener:(type,fn,options)=>{if(type==='scroll'){state.scroll=fn;state.scrollOptions=options;}}};
 if(io)win.IntersectionObserver=class{constructor(fn,options){state.near=fn;state.options=options;}observe(node){state.observed.push(node);}unobserve(node){state.unobserved.push(node);}};
 const doc={documentElement:{},addEventListener:(type,fn,options)=>{if(type==='DOMContentLoaded'){state.ready=fn;state.readyOptions=options;}}};
 return {doc,win,state,star,hermit,back,loose,practice,sample,markup};
}

test('phones hold section card art, backs included, while the page is parsed',()=>{
 const x=artPage();
 holdSectionArt(x.doc,x.win);
 assert.equal(x.state.watching,true);
 x.state.mutations([{addedNodes:[x.markup,{nodeType:3}]}]);
 for(const [img,src] of [[x.star,'/experience/assets/17-the-star.webp'],[x.hermit,'/experience/assets/09-the-hermit.webp'],[x.back,'/experience/assets/card-back.webp']]){
  assert.equal(img.src,HELD_ART);
  assert.equal(img.dataset.heldSrc,src);
 }
});

test('nothing loads before the visitor scrolls; then each section as it comes within a screen',()=>{
 const x=artPage();holdSectionArt(x.doc,x.win);x.state.mutations([{addedNodes:[x.markup]}]);
 x.state.ready();
 assert.equal(x.state.readyOptions.once,true);
 assert.equal(x.state.watching,false);
 assert.equal(x.state.near,undefined);
 assert.deepEqual(x.state.scrollOptions,{once:true,passive:true});
 x.state.scroll();
 assert.equal(x.state.options.rootMargin,'0px 0px 100% 0px');
 // Sections are watched, not the images inside 3D cards or the carousel.
 assert.deepEqual(x.state.observed,[x.practice,x.sample,x.loose]);
 x.state.near([{isIntersecting:true,target:x.practice},{isIntersecting:false,target:x.sample}]);
 assert.equal(x.star.src,'/experience/assets/17-the-star.webp');
 assert.equal(x.star.dataset.heldSrc,undefined);
 assert.equal(x.hermit.src,HELD_ART);
 assert.deepEqual(x.state.unobserved,[x.practice]);
 x.state.near([{isIntersecting:true,target:x.loose}]);
 assert.equal(x.loose.src,'/experience/assets/02-the-high-priestess.webp');
});

test('a card shown in the meantime is never replaced by the held one',()=>{
 const x=artPage();holdSectionArt(x.doc,x.win);x.state.mutations([{addedNodes:[x.markup]}]);x.state.ready();x.state.scroll();
 x.star.src='/experience/assets/21-the-world.webp';
 x.state.near([{isIntersecting:true,target:x.practice}]);
 assert.equal(x.star.src,'/experience/assets/21-the-world.webp');
 assert.equal(x.star.dataset.heldSrc,undefined);
});

test('without IntersectionObserver every held card loads at the first scroll',()=>{
 const x=artPage({io:false});holdSectionArt(x.doc,x.win);x.state.mutations([{addedNodes:[x.star,x.back]}]);
 x.state.ready();
 assert.equal(x.star.src,HELD_ART);
 x.state.scroll();
 assert.equal(x.star.src,'/experience/assets/17-the-star.webp');
 assert.equal(x.back.src,'/experience/assets/card-back.webp');
});

test('a held back takes the phone back the app assigns, then loads it on approach',()=>{
 const x=artPage();holdSectionArt(x.doc,x.win);x.state.mutations([{addedNodes:[x.markup]}]);
 showArt(x.back,'/experience/assets/card-back-phone.webp');
 assert.equal(x.back.src,HELD_ART);
 x.state.ready();x.state.scroll();x.state.near([{isIntersecting:true,target:x.practice}]);
 assert.equal(x.back.src,'/experience/assets/card-back-phone.webp');
});

test('showArt updates a held image instead of loading it early',()=>{
 const x=artPage();holdSectionArt(x.doc,x.win);x.state.mutations([{addedNodes:[x.markup]}]);
 showArt(x.hermit,'/experience/assets/09-the-hermit.v2.webp');
 assert.equal(x.hermit.src,HELD_ART);
 assert.equal(x.hermit.dataset.heldSrc,'/experience/assets/09-the-hermit.v2.webp');
 x.state.ready();x.state.scroll();x.state.near([{isIntersecting:true,target:x.sample}]);
 assert.equal(x.hermit.src,'/experience/assets/09-the-hermit.v2.webp');
 const loose={dataset:{},src:''};
 showArt(loose,'/experience/assets/card-back.webp');
 assert.equal(loose.src,'/experience/assets/card-back.webp');
 showArt(null,'x');showArt(x.star,undefined);
});

test('a page without section art adds no scroll listener',()=>{
 const x=artPage();holdSectionArt(x.doc,x.win);x.state.mutations([{addedNodes:[{nodeType:1,tagName:'IMG',dataset:{},matches:()=>false}]}]);
 x.state.ready();
 assert.equal(x.state.scroll,undefined);
});
