/** Reuse the reading's own nodes in a phone-sized context. No duplicate answers,
 * controls, or stored reading data; the original document returns on resize. */
export function initMobileReading({breakpoint='(max-width: 700px)'}={}) {
 const media=matchMedia(breakpoint);
 let active=false,context=null,observer=null,placements=[],questions=[],orientation=null;
 const move=(node,parent)=>{
  const anchor=document.createComment('mobile-reading-position');
  node.before(anchor);placements.push({node,anchor});parent.append(node);
 };
 const questionDisclosure=node=>{
  if(!node)return null;
  const details=document.createElement('details');details.className='mobile-reading-question';
  const summary=document.createElement('summary');summary.dataset.noTranslate='true';
  summary.textContent=document.documentElement.lang.startsWith('uk')?'Ваше запитання':'Your question';
  details.append(summary);node.before(details);move(node,details);
  questions.push({node,details,text:null});return details;
 };
 const updateQuestions=()=>{
  for(const item of questions){
   const value=item.node.textContent.trim();
   if(value===item.text)continue;
   item.text=value;item.details.open=value.length<=180;
   item.details.dataset.concise=String(value.length<=180);
   item.details.hidden=!value;
  }
 };
 const updateOrientation=()=>{
  if(!orientation)return;
  const reversed=document.querySelector('#reading-image')?.dataset.orientation==='reversed';
  const uk=document.documentElement.lang.startsWith('uk');
  orientation.textContent=reversed?(uk?'Перевернута карта':'Reversed'):(uk?'Пряме положення':'Upright');
 };
 function mount(){
  if(active)return;
  const reading=document.querySelector('.reading-copy'),art=document.querySelector('#reading-view .reading-art');
  const kind=document.querySelector('#reading-kind'),title=document.querySelector('#result-title'),question=document.querySelector('#reading-question');
  if(!reading||!art||!kind||!title||!question)return;
  active=true;context=document.createElement('header');context.className='mobile-reading-context';
  kind.before(context);
  move(kind,context);move(art,context);move(title,context);
  orientation=document.createElement('p');orientation.className='mobile-reading-orientation';orientation.dataset.noTranslate='true';
  context.append(orientation);
  const disclosure=questionDisclosure(question);
  context.append(disclosure);
  questionDisclosure(document.querySelector('#spread-synthesis-question'));
  updateQuestions();updateOrientation();
  observer=new MutationObserver(()=>{updateQuestions();updateOrientation();});
  for(const item of questions)observer.observe(item.node,{childList:true,subtree:true,characterData:true});
  const image=document.querySelector('#reading-image');
  if(image)observer.observe(image,{attributes:true,attributeFilter:['data-orientation']});
 }
 function restore(){
  if(!active)return;
  observer?.disconnect();observer=null;
  for(const {node,anchor} of placements)anchor.replaceWith(node);
  for(const {details} of questions)details.remove();
  context?.remove();context=null;orientation=null;placements=[];questions=[];active=false;
 }
 const sync=()=>media.matches?mount():restore();
 media.addEventListener('change',sync);sync();
 return ()=>{media.removeEventListener('change',sync);restore();};
}
