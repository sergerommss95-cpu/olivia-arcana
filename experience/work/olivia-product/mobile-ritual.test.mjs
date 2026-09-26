import test from 'node:test';
import assert from 'node:assert/strict';
import {deckBrowseMotion,dealMotion,revealMotion} from './spread-motion.js';

test('a sideways thumb browse reaches every card in the full deck in either direction',()=>{
 let index=38;
 const seen=new Set([index]);
 for(let i=0;i<78;i++){index=deckBrowseMotion({start:index,dx:-100,step:100,count:78}).index;seen.add(index);}
 assert.equal(index,77);
 for(let i=0;i<78;i++){index=deckBrowseMotion({start:index,dx:100,step:100,count:78}).index;seen.add(index);}
 assert.equal(index,0);assert.equal(seen.size,78);
});

test('the deck settles deliberately and resists its edges without selecting an invalid card',()=>{
 assert.equal(deckBrowseMotion({start:38,dx:39,step:100,count:78}).index,38);
 assert.equal(deckBrowseMotion({start:38,dx:41,step:100,count:78}).index,37);
 assert.equal(deckBrowseMotion({start:38,dx:-650,step:100,count:78}).index,41);
 const first=deckBrowseMotion({start:0,dx:100,step:100,count:78});
 assert.equal(first.index,0);assert.ok(first.offset>0&&first.offset<30);
 const last=deckBrowseMotion({start:76,dx:-100,step:100,count:77});
 assert.equal(last.index,76);assert.ok(last.offset<0&&last.offset>-30);
 for(let count=1;count<=78;count++)for(const dx of [-600,-90,0,90,600]){
  const value=deckBrowseMotion({start:77,dx,step:90,count});
  assert.ok(Number.isInteger(value.index)&&value.index>=0&&value.index<count);
 }
});

test('handheld timings retain the exact authored paths and continuous artwork swap',()=>{
 const args={spreadId:'clarity3',index:1,from:{x:100,y:300,width:208,height:357},to:{x:180,y:160,width:28,height:48}};
 const desktop=dealMotion(args),mobile=dealMotion({...args,handheld:true});
 assert.deepEqual(mobile.frames,desktop.frames);assert.equal(mobile.options.duration,920);assert.equal(desktop.options.duration,1620);
 const deskTurn=revealMotion(args),phoneTurn=revealMotion({...args,handheld:true});
 assert.deepEqual(phoneTurn.close,deskTurn.close);assert.deepEqual(phoneTurn.open,deskTurn.open);
 assert.equal(phoneTurn.options.duration,590);assert.equal(deskTurn.options.duration,790);
});
