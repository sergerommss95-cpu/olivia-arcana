/** Keep the personal answer in the foreground without losing the card reference. */
export function createReadingReference({nodes,label}) {
 const details=document.createElement('details');
 details.className='reading-reference';
 const summary=document.createElement('summary');summary.dataset.noTranslate='true';
 summary.textContent=label;
 const content=document.createElement('div');content.className='reading-reference-content';
 nodes[0].before(details);details.append(summary,content);
 for(const node of nodes)content.append(node);
 function setState(state){
  const personal=state==='ready';
  details.hidden=state==='pending';
  details.inert=state==='pending';
  details.classList.toggle('has-personal-reading',personal);
  summary.hidden=!personal;
  details.open=!personal;
 }
 setState('idle');
 return {element:details,setState};
}
