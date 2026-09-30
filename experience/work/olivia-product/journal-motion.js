/** A finite visual receipt after a successful local save. Never performs the save. */
export function journalReceiptFrames(from,to){
 const dx=to.left+to.width/2-from.left-from.width/2;
 const dy=to.top+to.height/2-from.top-from.height/2;
 const scale=Math.min(.55,Math.max(.12,to.width/Math.max(1,from.width)));
 return [
  {offset:0,transform:'translate(0, 0) scale(1)',opacity:.85},
  {offset:.45,transform:`translate(${dx*.45}px, ${dy*.45-24}px) scale(.72)`,opacity:.72},
  {offset:1,transform:`translate(${dx}px, ${dy}px) scale(${scale})`,opacity:0}
 ];
}

/** Returns a cancellable receipt; callers confirm saving and focus independently. */
export function showJournalReceipt({image,target,fromElement,reduced=false}={}){
 const empty={finished:Promise.resolve(false),cancel(){}};
 const doc=image?.ownerDocument,win=doc?.defaultView;
 if(!image||!target||!win||doc.hidden||reduced||win.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return empty;
 let from=image.getBoundingClientRect();const to=target.getBoundingClientRect();
 const visible=rect=>rect?.width>0&&rect.height>0&&rect.top<win.innerHeight&&rect.top+rect.height>0&&rect.left<(win.innerWidth||Infinity)&&rect.left+rect.width>0;
 if(!visible(to))return empty;
 if(!visible(from)){
  const origin=fromElement?.getBoundingClientRect();
  if(!visible(origin))return empty;
  // A phone save often happens below the artwork. Offer a small visual receipt
  // beside that action rather than flying the full-size card from offscreen.
  const width=Math.min(84,Math.max(1,(win.innerWidth||390)-16));
  const ratio=image.naturalWidth>0&&image.naturalHeight>0?image.naturalHeight/image.naturalWidth:12/7;
  const height=Math.min(width*ratio,Math.max(1,win.innerHeight-16));
  const left=Math.max(8,Math.min((win.innerWidth||390)-width-8,origin.left+origin.width/2-width/2));
  const top=Math.max(8,Math.min(win.innerHeight-height-8,origin.top-height-8));
  from={left,top,width,height};
 }
 const receipt=doc.createElement('img');receipt.src=image.currentSrc||image.src;receipt.alt='';receipt.setAttribute('aria-hidden','true');
 Object.assign(receipt.style,{position:'fixed',left:`${from.left}px`,top:`${from.top}px`,width:`${from.width}px`,height:`${from.height}px`,objectFit:'contain',pointerEvents:'none',zIndex:'100',transformOrigin:'center',borderRadius:'6px'});
 doc.body.append(receipt);
 let animation,done=false;
 const media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 const clean=()=>{if(done)return;done=true;receipt.remove();doc.removeEventListener('visibilitychange',interrupt);win.removeEventListener('pagehide',interrupt);media?.removeEventListener?.('change',changedMotion);};
 const interrupt=()=>{animation?.cancel();clean();};
 const changedMotion=()=>{if(media?.matches)interrupt();};
 try{animation=receipt.animate(journalReceiptFrames(from,to),{duration:650,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});}catch{clean();return empty;}
 doc.addEventListener('visibilitychange',interrupt);win.addEventListener('pagehide',interrupt);media?.addEventListener?.('change',changedMotion);
 const finished=animation.finished.then(()=>{clean();return true;},()=>{clean();return false;});
 return {finished,cancel:interrupt};
}
