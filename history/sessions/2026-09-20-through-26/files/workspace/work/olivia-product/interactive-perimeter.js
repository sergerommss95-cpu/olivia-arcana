/**
 * A fine moving edge identifies an actionable surface without changing its
 * geometry, original background, arrows, or keyboard behaviour.
 */
const ACTIONS='button,a[href],summary,[role="button"],input,textarea,select';
const FIELDS='textarea,select,input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"])';
const SKIP='.card-hit,[data-no-perimeter],.skip-link';
const ART='.spread-deck-card,.spread-card,.home-sample-reveal,.home-table-card button,.aj-mini-card,.physical-card-choice,.symbol-card-link';

export function initInteractivePerimeters(root=document){
 const doc=root.ownerDocument||root;
 const win=doc.defaultView;
 if(!win?.MutationObserver)return ()=>{};
 // The native shell and the standalone reading bundle can share one document.
 // Keep one observer even when both progressively enhance the same controls.
 const registry=Symbol.for('olivia.interactive-perimeters');
 if(root[registry])return ()=>{};
 if(new URLSearchParams(win.location.search).get('motion')==='reduce')doc.documentElement.dataset.edgeMotion='off';
 const tracked=new Set();
 let serial=0,queued=false,disposed=false;
 const visibility=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
  for(const entry of entries)entry.target.toggleAttribute('data-edge-visible',entry.isIntersecting);
 },{rootMargin:'0px',threshold:0}):null;

 function add(control){
  if(!control.matches?.(ACTIONS)||control.matches(SKIP)||control.closest('[data-no-perimeter]'))return;
  if(control.tagName==='INPUT'&&['hidden','file'].includes(control.type))return;
  // Native checkboxes and radios keep their own accessible geometry. When a
  // label supplies the visible choice, the light follows that label instead.
  let target=control;
  if(control.matches('input[type="radio"],input[type="checkbox"]')){
   const label=control.closest('label');
   if(!label)return;
   target=label;target.setAttribute('data-edge-toggle','');
  }
  if(tracked.has(target)){
   // Several controls replace their text when state changes. Restore only
   // the decorative child; never replace their content or event handlers.
   if(target.hasAttribute('data-edge-field')||target.querySelector(':scope > olivia-edge'))return;
  }else{
   tracked.add(target);
   target.setAttribute('data-olivia-edge','');
   target.style.setProperty('--oa-edge-delay',`${-(serial++%11)*.83}s`);
   if(win.getComputedStyle(target).position==='static')target.setAttribute('data-edge-static','');
   if(target.matches(FIELDS))target.setAttribute('data-edge-field','');
   if(target.matches(ART))target.setAttribute('data-edge-art','');
   if(target.matches('input[type="range"]'))target.setAttribute('data-edge-range','');
   if(visibility)visibility.observe(target);else target.setAttribute('data-edge-visible','');
  }
  if(target.hasAttribute('data-edge-field')||target.hasAttribute('data-edge-range')||target.querySelector(':scope > olivia-edge'))return;
  const edge=doc.createElement('olivia-edge');
  edge.setAttribute('aria-hidden','true');
  target.append(edge);
 }
 function scan(node){
  if(node.nodeType!==1&&node.nodeType!==9)return;
  add(node);
  node.querySelectorAll?.(ACTIONS).forEach(add);
 }
 function clean(){
  queued=false;
  if(disposed)return;
  for(const target of tracked)if(!target.isConnected){visibility?.unobserve(target);tracked.delete(target);}
 }
 const changes=new win.MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'){add(record.target);continue;}
   // textContent updates remove the edge along with the old label.
   if(record.target.nodeType===1&&record.target.hasAttribute('data-olivia-edge'))add(record.target);
   for(const node of record.addedNodes)if(node.nodeName!=='OLIVIA-EDGE')scan(node);
  }
  if(!queued){queued=true;queueMicrotask(clean);}
 });
 scan(root);
 changes.observe(root.nodeType===9?root.documentElement:root,{subtree:true,childList:true,attributes:true,attributeFilter:['href','type']});
 const dispose=()=>{disposed=true;changes.disconnect();visibility?.disconnect();tracked.clear();if(root[registry]===dispose)delete root[registry];};
 root[registry]=dispose;
 return dispose;
}
