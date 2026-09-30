import test from 'node:test';
import assert from 'node:assert/strict';
import {journalReceiptFrames,showJournalReceipt} from './journal-motion.js';
function fixture({reduced=false,hidden=false}={}){
 const listeners=new Map(),nodes=[];let resolve,reject,removed=false;
 const events={addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type){listeners.delete(type);}};
 const media={...events,matches:reduced},win={...events,innerHeight:800,matchMedia:()=>media};
 const animation={finished:new Promise((yes,no)=>{resolve=yes;reject=no;}),cancel(){reject(new Error('cancelled'));}};
 const doc={...events,hidden,defaultView:win,body:{append(node){nodes.push(node);}},createElement(){return {style:{},setAttribute(){},animate(){return animation;},remove(){removed=true;}};}};
 const image={ownerDocument:doc,src:'saved.webp',getBoundingClientRect:()=>({left:10,top:10,bottom:210,width:100,height:200})};
 const target={getBoundingClientRect:()=>({left:300,top:20,bottom:64,width:44,height:44})};
 return {doc,image,target,nodes,listeners,resolve:()=>resolve(),get removed(){return removed;}};
}
test('journal receipt ends at the visible journal target and shrinks without moving the real card',()=>{
 const frames=journalReceiptFrames({left:0,top:0,width:100,height:200},{left:250,top:10,width:44,height:44});
 assert.equal(frames[0].transform,'translate(0, 0) scale(1)');assert.equal(frames.at(-1).transform,'translate(222px, -68px) scale(0.44)');assert.equal(frames.at(-1).opacity,0);
});
test('receipt cleans up on completion and does not alter source artwork',async()=>{
 const x=fixture(),receipt=showJournalReceipt(x);assert.equal(x.nodes.length,1);assert.equal(x.image.src,'saved.webp');x.resolve();assert.equal(await receipt.finished,true);assert.equal(x.removed,true);assert.equal(x.listeners.size,0);
});
test('cancel and page interruption remove the receipt and resolve safely',async()=>{
 for(const interrupt of ['cancel','pagehide','visibilitychange']){
  const x=fixture(),receipt=showJournalReceipt(x);
  if(interrupt==='cancel')receipt.cancel();else x.listeners.get(interrupt)();
  assert.equal(await receipt.finished,false);assert.equal(x.removed,true);assert.equal(x.listeners.size,0);
 }
});
test('reduced motion or hidden document never creates a decorative surface',async()=>{
 for(const options of [{reduced:true},{hidden:true}]){const x=fixture(options);assert.equal(await showJournalReceipt(x).finished,false);assert.equal(x.nodes.length,0);}
});

test('an offscreen reading uses a small in-viewport card beside the visible save action',async()=>{
 const x=fixture();x.doc.defaultView.innerWidth=390;
 x.image.getBoundingClientRect=()=>({left:20,top:-600,width:300,height:514});
 const fromElement={getBoundingClientRect:()=>({left:12,top:650,width:366,height:48})};
 const receipt=showJournalReceipt({...x,fromElement});
 assert.equal(x.nodes.length,1);const style=x.nodes[0].style;
 assert.equal(style.width,'84px');assert.ok(parseFloat(style.left)>=8);assert.ok(parseFloat(style.left)+84<=382);
 assert.ok(parseFloat(style.top)>=8);assert.ok(parseFloat(style.top)+parseFloat(style.height)<=792);
 assert.equal(x.image.src,'saved.webp');receipt.cancel();assert.equal(await receipt.finished,false);
});
test('offscreen source without a visible origin or destination creates no receipt',async()=>{
 for(const offscreenTarget of [false,true]){
  const x=fixture();x.image.getBoundingClientRect=()=>({left:10,top:-600,width:100,height:200});
  if(offscreenTarget)x.target.getBoundingClientRect=()=>({left:10,top:900,width:44,height:44});
  const fromElement={getBoundingClientRect:()=>({left:10,top:offscreenTarget?200:900,width:100,height:44})};
  assert.equal(await showJournalReceipt({...x,fromElement}).finished,false);assert.equal(x.nodes.length,0);
 }
});
test('repeated mobile receipts can be cancelled independently without retaining surfaces',async()=>{
 for(let i=0;i<3;i++){
  const x=fixture();x.image.getBoundingClientRect=()=>({left:10,top:-600,width:100,height:200});
  const fromElement={getBoundingClientRect:()=>({left:10,top:400,width:100,height:44})};
  const receipt=showJournalReceipt({...x,fromElement});receipt.cancel();receipt.cancel();
  assert.equal(await receipt.finished,false);assert.equal(x.removed,true);assert.equal(x.listeners.size,0);
 }
});
