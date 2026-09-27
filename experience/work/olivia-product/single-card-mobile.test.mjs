import test from 'node:test';
import assert from 'node:assert/strict';
import {singleCardTouchIntent,singleCardTouchAction,singleCardMobileLayout} from './single-card-mobile.js';
import {mobileCardSourceQuad} from './single-card-flow.js';

function gesture(...positions){
 return positions.reduce((state,[x,y])=>singleCardTouchIntent(state,x,y),{axis:null,moved:false,dx:0,dy:0});
}

test('a phone tap or clear upward pull chooses; downward or slight movement returns',()=>{
 for(const path of [[[0,0]],[[3,-2]],[[1,-17],[5,-70]]])assert.deepEqual(singleCardTouchAction(gesture(...path)),{type:'choose'});
 for(const path of [[[0,20]],[[0,-24]],[[0,-60],[0,0]]])assert.deepEqual(singleCardTouchAction(gesture(...path)),{type:'cancel'});
});

test('horizontal phone swipes browse both ways, even without an intermediate move',()=>{
 assert.deepEqual(singleCardTouchAction(gesture([-80,-8])),{type:'browse',direction:1});
 assert.deepEqual(singleCardTouchAction(gesture([80,8])),{type:'browse',direction:-1});
 assert.deepEqual(singleCardTouchAction(gesture([25,2])),{type:'cancel'});
});

test('a sideways swipe cannot become a card choice when the thumb curves upward',()=>{
 const swipe=gesture([-18,-1],[-75,-55],[-49,-140]);
 assert.equal(swipe.axis,'browse');
 assert.deepEqual(singleCardTouchAction(swipe),{type:'browse',direction:1});
 const returnTowardOrigin=gesture([18,1],[3,-140]);
 assert.equal(returnTowardOrigin.axis,'browse');
 assert.deepEqual(singleCardTouchAction(returnTowardOrigin),{type:'cancel'});
});

test('ambiguous diagonals and vertical pulls that turn sideways never draw accidentally',()=>{
 for(const path of [[[12,-12],[90,-90]],[[2,-18],[100,-80]],[[20,20],[2,0]]]){
  assert.deepEqual(singleCardTouchAction(gesture(...path)),{type:'cancel'});
 }
 assert.equal(gesture([2,-18],[100,-80]).axis,'pull','the first axis remains locked');
});

function assertFits(layout,options){
 const {card,actions}=layout,{width,height,left=0,top=0,insets,actionsHeight}=options;
 const bounds={left:left+insets.left,right:left+width-insets.right,top:top+insets.top,bottom:top+height-insets.bottom};
 for(const [name,rect] of [['card',card],['actions',{...actions,height:Math.min(actionsHeight,actions.maxHeight)}]]){
  assert.ok(rect.left>=bounds.left-1e-8,`${name} left stays inside usable screen`);
  assert.ok(rect.top>=bounds.top-1e-8,`${name} top clears header and safe area`);
  assert.ok(rect.left+rect.width<=bounds.right+1e-8,`${name} right stays inside usable screen`);
  assert.ok(rect.top+rect.height<=bounds.bottom+1e-8,`${name} bottom clears browser and safe area`);
 }
 assert.ok(card.width>0&&card.height>0,'card stays visible');
 assert.ok(Math.abs(card.height/card.width-12/7)<1e-8,'artwork ratio remains intact');
 assert.ok(card.top+card.height<=actions.top||card.left+card.width<=actions.left,'card and reveal controls never overlap');
}

for(const [width,height,actionsHeight,safeTop,safeBottom] of [
 [320,568,118,0,0], [375,667,148,0,0], [390,844,126,47,34], [430,932,164,59,34],
 [320,420,142,0,0], [390,390,146,0,0], [320,420,450,0,0], [568,320,136,0,21], [667,375,156,0,21], [844,390,180,0,21],
]){
 test(`held card and action fit ${width}×${height} with safe areas and localized action height`,()=>{
  const options={width,height,actionsHeight,insets:{top:76+safeTop,right:20,left:20,bottom:20+safeBottom}};
  const layout=singleCardMobileLayout(options);
  assertFits(layout,options);
  assert.equal(layout.mode,width>height&&width>=560?'landscape':'portrait');
 });
}

test('the visual viewport offset moves the card and reveal action together',()=>{
 const options={width:390,height:580,actionsHeight:144,insets:{top:76,right:20,bottom:54,left:20}};
 const original=singleCardMobileLayout(options),shifted=singleCardMobileLayout({...options,left:11,top:93});
 for(const name of ['card','actions']){
  assert.equal(shifted[name].left-original[name].left,11);
  assert.equal(shifted[name].top-original[name].top,93);
  assert.equal(shifted[name].width,original[name].width);
 }
 assertFits(shifted,{...options,left:11,top:93});
});

test('lifting a rotated mobile DOM card preserves its corners rather than its enlarged bounding box',()=>{
 const width=196,height=336,cx=197,cy=380;
 for(const angle of [-16,-8,0,8,16]){
  const radians=angle*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
  const expected=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]]
   .map(([x,y])=>[cx+x*c-y*s,cy+x*s+y*c]);
  const xs=expected.map(point=>point[0]),ys=expected.map(point=>point[1]);
  const bounds={left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  const actual=mobileCardSourceQuad(bounds,width,height,angle);
  for(let i=0;i<4;i++)for(let axis=0;axis<2;axis++)assert.ok(Math.abs(actual[i][axis]-expected[i][axis])<1e-8,`angle ${angle}, corner ${i}, axis ${axis} remains continuous`);
  assert.ok(Math.abs(Math.hypot(actual[1][0]-actual[0][0],actual[1][1]-actual[0][1])-width)<1e-8,'lift starts at the original artwork width');
 }
});
