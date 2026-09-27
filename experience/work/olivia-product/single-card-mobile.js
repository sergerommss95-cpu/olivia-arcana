const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

/** The first clear axis owns the whole touch gesture, including a curved release. */
export function singleCardTouchIntent(previous,dx,dy){
 const distance=Math.hypot(dx,dy);
 let axis=previous.axis||null;
 if(!axis&&distance>10){
  if(Math.abs(dx)>Math.abs(dy)*1.25)axis='browse';
  else if(Math.abs(dy)>Math.abs(dx)*1.25)axis='pull';
 }
 return {axis,moved:previous.moved||distance>7,dx,dy};
}

export function singleCardTouchAction(gesture){
 if(!gesture.moved)return {type:'choose'};
 if(gesture.axis==='browse'&&Math.abs(gesture.dx)>=42)return {type:'browse',direction:gesture.dx<0?1:-1};
 if(gesture.axis==='pull'&&gesture.dy< -36&&-gesture.dy>Math.abs(gesture.dx)*1.25)return {type:'choose'};
 return {type:'cancel'};
}

/** Both the physical card and its action use the same visible viewport bounds. */
export function singleCardMobileLayout({width,height,left=0,top=0,insets={},actionsHeight=120}){
 const bounds={left:left+(insets.left??20),top:top+(insets.top??104),right:left+width-(insets.right??20),bottom:top+height-(insets.bottom??20)};
 const availableWidth=Math.max(1,bounds.right-bounds.left),availableHeight=Math.max(1,bounds.bottom-bounds.top);
 const landscape=width>height&&width>=560;
 let card,actions;
 if(landscape){
  const columnWidth=availableWidth*.45,cardHeight=Math.min(520,availableHeight,columnWidth*12/7),cardWidth=cardHeight*7/12;
  const actionsWidth=Math.min(340,availableWidth*.48);
  card={left:bounds.left+(columnWidth-cardWidth)/2,top:bounds.top+(availableHeight-cardHeight)/2,width:cardWidth,height:cardHeight};
  actions={left:bounds.right-actionsWidth,top:bounds.top+Math.max(0,(availableHeight-actionsHeight)/2),width:actionsWidth,maxHeight:availableHeight};
 }else{
  const actionsWidth=Math.min(340,availableWidth),gap=clamp(height*.025,14,24);
  // Larger text may need a scrollable action region, but it must never cover
  // the selected artwork. Keep a visible card above that region on short phones.
  const actionsMaxHeight=Math.max(1,availableHeight-gap-Math.min(120,availableHeight*.4));
  const actionTop=bounds.bottom-Math.min(actionsHeight,actionsMaxHeight);
  const cardRoom=Math.max(1,actionTop-gap-bounds.top),cardHeight=Math.min(520,cardRoom,availableWidth*.78*12/7),cardWidth=cardHeight*7/12;
  card={left:bounds.left+(availableWidth-cardWidth)/2,top:bounds.top+(cardRoom-cardHeight)/2,width:cardWidth,height:cardHeight};
  actions={left:bounds.left+(availableWidth-actionsWidth)/2,top:actionTop,width:actionsWidth,maxHeight:actionsMaxHeight};
 }
 return {mode:landscape?'landscape':'portrait',card,actions};
}
