import test from 'node:test';
import assert from 'node:assert/strict';
import { previousDaily, whenLabel, dayCaption } from './today-pair-dates.js';

const entry = (date, cardId) => ({ date, record: { cardId } });

test('finds the latest earlier day with a different card', () => {
  const entries = [entry('2026-09-20', 3), entry('2026-09-26', 17), entry('2026-09-27', 9), entry('2026-09-28', 9)];
  assert.equal(previousDaily(entries, '2026-09-28', 9).date, '2026-09-26');
  assert.equal(previousDaily(entries, '2026-09-28', 9).gap, 2);
  assert.equal(previousDaily(entries, '2026-09-28', 5).date, '2026-09-27');
});

test('ignores days more than a month back', () => {
  assert.equal(previousDaily([entry('2026-08-01', 3)], '2026-09-28', 9), null);
  assert.equal(previousDaily([], '2026-09-28', 9), null);
});

test('phrases when the earlier card was drawn', () => {
  assert.equal(whenLabel('2026-09-27', 1, 'en'), 'yesterday');
  assert.equal(whenLabel('2026-09-27', 1, 'uk'), 'вчора');
  assert.equal(whenLabel('2026-09-23', 5, 'uk'), 'в середу');
  assert.equal(whenLabel('2026-09-22', 6, 'en'), 'on Tuesday');
  assert.equal(whenLabel('2026-09-22', 6, 'uk'), 'у вівторок');
  assert.equal(whenLabel('2026-09-12', 16, 'en'), 'on 12 September');
  assert.equal(whenLabel('2026-09-12', 16, 'uk'), '12 вересня');
});

test('captions the earlier day in the nominative', () => {
  assert.equal(dayCaption('2026-09-23', 5, 'uk'), 'Середа');
  assert.equal(dayCaption('2026-09-23', 5, 'en'), 'Wednesday');
  assert.equal(dayCaption('2026-09-27', 1, 'uk'), 'Учора');
  assert.equal(dayCaption('2026-09-12', 16, 'en'), '12 September');
});

import {mountTodayPair} from './today-pair.js';
import {createDeckController} from './deck-library.js';

// Minimal DOM surface for this component: verify record artwork, not CSS or layout.
class PairNode {
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.listeners={};this.attributes={};}
  append(...nodes){this.children.push(...nodes);}
  prepend(...nodes){this.children.unshift(...nodes);}
  after(node){this.inserted=node;}
  before(){}
  querySelector(){return null;}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(key,fn){this.listeners[key]=fn;}
}
const descendants=node=>[node,...node.children.flatMap(descendants)];
test('today pairs keep both original deck identities after preference changes',()=>{
  const makeArt=name=>({back:`${name}/back.webp`,cards:Object.fromEntries(Array.from({length:78},(_,id)=>[id,`${name}/${id}.webp`]))});
  const controller=createDeckController({original:makeArt('olivia'),collections:{'space-between':makeArt('amielle')}});
  const older={cardId:17,deckId:'space-between'},daily={cardId:9,deckId:'olivia'};
  const prior=globalThis.document;globalThis.document={createElement:tag=>new PairNode(tag)};
  try{
    for(const selected of ['olivia','space-between']){
      controller.select(selected);
      const after=new PairNode('div');after.parentElement=new PairNode('main');
      const panel=mountTodayPair({after,entries:[{date:'2026-09-27',record:older}],today:'2026-09-28',daily,images:controller.assets.cards,artFor:controller.assets.forRecord,nameOf:id=>`Card ${id}`,locale:'en'});
      const nodes=descendants(panel);
      assert.deepEqual(nodes.filter(node=>node.tagName==='img').map(node=>node.src),['amielle/17.webp','olivia/9.webp']);
      assert.ok(!nodes.some(node=>node.textContent?.startsWith('Carved on both:')));
      const bridge=nodes.find(node=>node.tagName==='button'&&node.textContent==='4. A shared symbol');bridge.listeners.click();
      assert.equal(nodes.find(node=>node.className==='today-pair-prompt').textContent,'Look for a gesture, a direction or a colour the two images have in common. What changes from one card to the other?');
    }
  }finally{globalThis.document=prior;}
});
