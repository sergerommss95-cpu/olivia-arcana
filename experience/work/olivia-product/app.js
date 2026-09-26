import {initMobileQuestion} from './mobile-question.js';
import {initMobileExperience} from './mobile-experience.js';
import {initMobileReading} from './mobile-reading.js';
import {initInteractivePerimeters} from './interactive-perimeter.js';
import {createReadingReference} from './reading-reference.js';
import {setSaveState,guidanceSaveState} from './save-state.js';
import {mountFirstImpression} from './first-impression.js';
import {loadQuestionHistory,serializeQuestionHistory} from './question-history.js';
import {initHomeShowcase} from './home-showcase.js';
import {initSymbolTrails} from './symbol-trails.js';
import {initPhysicalReading} from './physical-reading.js';
import {initAlmanacJourney} from './almanac-journey.js';
import {initQuestionCoach} from './question-coach.js';
import {initAlmanacImport} from './almanac-backup.js';
import {consumeQuestionHandoff} from './question-handoff.js';
import {getLocale,t,initLocale,localizeCardNotes} from './locale.js';
import {mountQuestionGuidance,mountGuidanceChoice,unmountQuestionGuidance} from './question-guidance.js';
import {initReadingEntry,simplifyPreferences,simplifySaving,readingSteps} from './journey-entry.js';
import {initPractice} from './practice-ui.js';
import {loadDaily,saveDaily,loadDraft,saveDraft,clearDraft} from './practice-core.js';
import {TAROT_CARDS,cardCaption} from './deck-catalog.js';
import {initSpreads} from './spread-ui.js';
import {initSingleCardFlow} from './single-card-flow.js';
import {createSession,chooseCard,createRecord,loadRecords,saveRecord,removeRecord,exportRecords,getLastRecord} from './core.js';
import {CARD_NOTES,cardNotesForOrientation,INTENTION_NOTES,SAMPLE} from './content.js';
const $=s=>document.querySelector(s), assets=window.OLIVIA_ASSETS;
const cards=TAROT_CARDS,names=cards.map(card=>card.name);
let choiceStart=0,choiceCount=13;
let cardFlow=null,practice=null,dailyMode=false;
let view='home',session=null,currentRecord=null,heldRecord=null,sample=false,transition=0,saveDirty=false,lastRemoved=null; const drafts=new Map(),dirtyIds=new Set();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).get('motion')==='reduce';
const motion=()=>window.motionStudy;
const impressionSeen=new Set(),guidanceConsents=new Set();
let readingEntry=null,guidanceChoice=null,approvedQuestionPlan=null;
$('#result-title').after($('#reading-copy-guidance'));
const singleReference=createReadingReference({nodes:[$('#meaning'),$('#full-reflection-details'),$('#intention-frame'),$('.reading-copy .reflection-prompt'),$('#practice')],label:getLocale()==='uk'?'Дослідити значення цієї карти':'Explore this card’s meaning'});
const announce=text=>$('#product-status').textContent=t(text);
const storage=()=>window.localStorage;
const text=(selector,value)=>$(selector).textContent=selector==='#reading-question'?value:t(value);
const readableDate=value=>new Intl.DateTimeFormat(getLocale()==='uk'?'uk-UA':undefined,{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));
const errorText=error=>error.code==='STORAGE_CORRUPT'?'The saved almanac could not be read. Your existing data has been left untouched. You can still download this reading.':error.code==='STORAGE_LIMIT'?'This browser’s almanac is full. Download this reading to keep it.':'This browser could not save the reading. Download a copy to keep it.';
$('#sample-art').src=assets.cards[9];
if(window.OLIVIA_NATIVE||new URLSearchParams(location.search).get('site')==='1')document.querySelectorAll('[data-site]').forEach(a=>{a.href=getLocale()==='uk'&&a.dataset.site==='/academy'?'/uk/cards/':a.dataset.site;a.target='_top';});
function refreshReturn(){try{const last=getLastRecord(loadRecords(storage()));$('#resume-link').hidden=!last;if(last){$('#resume-link').textContent=getLocale()==='uk'?`Повернутися до карти «${t(last.cardName)}» ↗`:`Return to ${last.cardName.replace(/^The /,'the ')} ↗`;$('#resume-link').dataset.record=last.id;}}catch{}}
function preserveNote(){if(!sample&&currentRecord&&view==='reading'){currentRecord={...currentRecord,note:$('#reflection').value};drafts.set(currentRecord.id,currentRecord);try{saveDraft(storage(),currentRecord);}catch{}}}
function receiveSingleGuidance(id,guidance){
 if(currentRecord?.id!==id)return;
 currentRecord={...currentRecord,guidance};drafts.set(id,currentRecord);
 let kept;try{kept=loadRecords(storage()).find(value=>value.id===id);}catch{}
 // A reading that was never kept is still a first keep; only a kept one is updated.
 const state=guidanceSaveState(kept,guidance);if(!state)return;
 dirtyIds.add(id);saveDirty=true;
 text('#save-status','Your personal reading is ready. Save to keep it.');
 setSaveState($('#save-reading'),state);
}
function receiveSavedSingleGuidance(saved){
 if(saved.spreadId||currentRecord?.id!==saved.id)return;
 const note=$('#reflection').value;
 currentRecord={...currentRecord,note,guidance:saved.guidance};drafts.set(saved.id,currentRecord);
 if(note===(saved.note||'')){
  dirtyIds.delete(saved.id);text('#save-status','Kept in your almanac, on this device.');
  setSaveState($('#save-reading'),'saved');$('#view-saved').hidden=false;
  try{clearDraft(storage(),saved.id);}catch{}
 }else{
  dirtyIds.add(saved.id);text('#save-status','Unsaved reflection.');
  setSaveState($('#save-reading'),'reflection');
 }
 saveDirty=dirtyIds.size>0;
}
function setView(next,{focus=true,keepCard=false}={}){
 if(!keepCard)cardFlow?.cancel();
 if(['reading','sample'].includes(view)&&!['reading','sample'].includes(next))unmountQuestionGuidance($('#reading-copy-guidance'));
 if(view==='spreads'&&next!=='spreads')spreads.leave();
 preserveNote();transition++;motion()?.stopJourney();document.body.classList.remove('cinema');$('#leave-cinema').hidden=true;
 view=next;document.body.dataset.view=next;
 for(const id of ['question','choose','reading','journal','spreads','today','method','membership','journey','my-deck','physical','symbols'])$(`#${id}-view`).hidden=next!==id&&!(id==='reading'&&next==='sample');
 $('#card-choices').hidden=next!=='choose';window.scrollTo({top:0,behavior:'instant'});
 if(next==='home'||next==='question')motion()?.setProgress(0);if(next==='home')motion()?.resumeHome();if(['home','question','choose'].includes(next))motion()?.resize();
 $('#opening-type').inert=next!=='home';$('#intro').inert=next!=='home';
 if(focus){const heading={question:'#question-title',choose:'#choose-title',reading:'#result-title',sample:'#result-title',journal:'#journal-title',today:'#today-title'}[next];requestAnimationFrame(()=>{const first=next==='choose'&&!$('#card-choices').inert?$('#card-choices button'):null;(first||($('#reading-view').dataset.guidanceState==='pending'&&next==='reading'?$('#reading-view .reading-loader'):(heading?$(heading):null)))?.focus({preventScroll:true});});}
}
function goto(next){if(next==='reading'&&currentRecord)next+='/' + currentRecord.id;if(location.hash==='#'+next)route();else location.hash=next;}
function route(){const [next,readingId]=location.hash.slice(1).split('?')[0].split('/');
 if(next.startsWith('p=')){setView('home',{focus:false});const progress=Number(new URLSearchParams(location.hash.slice(1)).get('p'));if(Number.isFinite(progress))motion()?.setProgress(Math.max(0,Math.min(1,progress)));}
 else if(next==='spreads'){spreads.open(readingId);}
 else if(next==='physical'){physical.render();}
 else if(next==='symbols'){symbols.render(readingId);}
 else if(next==='journey'){journey.renderJourney();}
 else if(next==='my-deck'){journey.renderDeck(readingId);}
 else if(next==='today'){practice.renderToday();}
 else if(next==='method'||next==='membership'){practice.openPage(next);}
 else if(next==='journal'){setView('journal');renderJournal();practice.renderTopics();}
 else if(next==='question'){dailyMode=false;setView('question');}
 else if(next==='sample'){showSample();}
 else if(next==='reading'){let selected=currentRecord;try{const saved=loadRecords(storage());selected=readingId?(drafts.get(readingId)||saved.find(r=>r.id===readingId)):currentRecord||getLastRecord(saved);}catch(error){announce(errorText(error));}if(selected)renderReading(selected,false);else practice.renderToday();}
 else if(next==='choose'&&session){if(session.cardId===null){setView('choose');openDeck();}else if(heldRecord){setView('choose',{focus:false});motion()?.setProgress(.235);cardFlow.restoreHeld(heldRecord,session.selectedSlot-choiceStart);}else{setView('question');}}
 else {setView('home',{focus:false});refreshReturn();if(next==='discover')requestAnimationFrame(()=>$('#discover').scrollIntoView());}
}
function showSample(){const note=CARD_NOTES[SAMPLE.cardId];renderReading({cardId:SAMPLE.cardId,cardName:names[SAMPLE.cardId],question:t(SAMPLE.question),intention:'change',interpretation:{...note,connection:''},note:''},true);}
function renderReading(record,isSample,{connected=false}={}){
 for(const node of document.querySelectorAll('[data-impression-hidden]')){node.hidden=node.dataset.impressionHidden==='true';delete node.dataset.impressionHidden;}
 $('#single-impression')?.remove();preserveNote();record=drafts.get(record.id)||record;setView(isSample?'sample':'reading',{focus:!connected,keepCard:connected});sample=isSample;if(!isSample)currentRecord=record;
 const id=record.cardId,notes=localizeCardNotes(id,record.interpretation,{orientation:record.orientation});
 text('#reading-kind',isSample?'A sample reading':record.source==='physical'?(getLocale()==='uk'?'З вашої фізичної колоди':'From your physical deck'):'Your one-card reading');text('#reading-question',record.question?`“${record.question}”`:'An open reading');text('#result-title',record.cardName);const sentences=notes.meaning.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[notes.meaning];text('#meaning',sentences.slice(0,2).join('').trim());text('#full-reflection',sentences.slice(2).join('').trim());$('#full-reflection-details').hidden=sentences.length<=2;$('#full-reflection-details').open=false;text('#reflection-prompt',notes.prompt);text('#practice',notes.practice);text('#card-lesson',notes.learn||CARD_NOTES[id].learn);
 text('#intention-frame',record.intention==='open'?'':INTENTION_NOTES[record.intention]||'');$('#intention-frame').hidden=!$('#intention-frame').textContent;
 $('#reading-image').dataset.orientation=record.orientation||'upright';$('#reading-image').src=assets.cards[id];$('#reading-image').alt=`${record.cardName} — Olivia Arcana tarot artwork`;text('#card-index',cardCaption(id)+(record.orientation==='reversed'?' · Reversed':' · Upright'));
 $('#reflection').value=record.note||'';$('#save-section .reading-notes').open=!!record.note;$('#save-section').hidden=isSample;$('#sample-cta').hidden=!isSample;$('#view-saved').hidden=true;$('#save-status').textContent='';
 let kept=null;try{kept=isSample?null:loadRecords(storage()).find(r=>r.id===record.id)||null;}catch{}
 const dirty=dirtyIds.has(record.id),sameNote=!!kept&&(kept.note||'')===(record.note||''),noteChanged=kept?!sameNote:!!record.note;
 setSaveState($('#save-reading'),!kept?'keep':!dirty&&sameNote?'saved':noteChanged?'reflection':'update');saveDirty=dirtyIds.size>0;
 if(dirty)text('#save-status',!noteChanged&&record.guidance?'Your personal reading is ready. Save to keep it.':'Unsaved reflection.');
 if(!isSample&&!dirty&&sameNote){text('#save-status','Kept in your almanac, on this device.');$('#view-saved').hidden=false;}
 practice?.attachSingle(record,isSample);
 singleReference.setState('idle');$('#reading-view').dataset.guidanceState='idle';
 mountQuestionGuidance($('#reading-copy-guidance'),isSample?null:record,{showActions:false,autoRequest:!isSample&&connected&&guidanceConsents.delete(record.id),onState:(state,{focused=false}={})=>{
  if(!isSample&&currentRecord?.id!==record.id)return;
  singleReference.setState(state);$('#reading-view').dataset.guidanceState=state;
  if(state==='pending')requestAnimationFrame(()=>{if(view==='reading'&&currentRecord?.id===record.id&&$('#reading-view').dataset.guidanceState==='pending')$('#reading-view .reading-loader')?.focus({preventScroll:true});});
  if(focused&&view==='reading'&&state!=='pending'&&matchMedia('(max-width:800px)').matches)$('#reading-copy-guidance').scrollIntoView({behavior:'instant',block:'start'});
 },onResult:guidance=>receiveSingleGuidance(record.id,guidance)});
 // A personal observation never blocks the meaning. Keep existing impressions visible.
 if(!isSample){const entry=record.firstImpressions?.find(v=>v.cardId===id);if(entry){const host=document.createElement('details');host.id='single-impression';host.className='reading-observation';const label=document.createElement('summary');label.textContent=getLocale()==='uk'?'Ваш перший погляд':'Your first impression';host.append(label);$('#save-section').before(host);mountFirstImpression(host,{cardId:id,entry,locale:getLocale()});}}
 if(!reduced()&&!connected)$('#reveal-card').animate([{opacity:0,transform:'translateY(30px) rotateY(-35deg) rotate(-6deg)'},{opacity:1,transform:'translateY(0) rotateY(0) rotate(-3deg)'}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
}
function mobileSingleDeck(){
 if(view!=='choose'||!session||session.cardId!==null)return false;
 const el=$('#card-choices');if(!matchMedia('(max-width:700px)').matches)return false;
 choiceCount=Math.min(5,session.deck.length);choiceStart=Math.max(0,Math.min(choiceStart,session.deck.length-choiceCount));
 if(!el.classList.contains('mobile-single-deck')){el.replaceChildren();el.classList.remove('fallback-choices');el.classList.add('mobile-single-deck');}
 cardFlow?.update([]);
 while(el.children.length>choiceCount)el.lastChild.remove();
 for(let i=0;i<choiceCount;i++){
  let button=el.children[i];if(!button){button=document.createElement('button');button.type='button';button.className='card-hit';button.dataset.slot=i;button.dataset.mobileCard='true';const img=new Image();img.src=assets.back;img.alt='';img.draggable=false;button.append(img);el.append(button);cardFlow.bind(button);}
  const distance=i-Math.floor(choiceCount/2);button.style.setProperty('--mobile-card-distance',distance);button.style.setProperty('--mobile-card-depth',Math.abs(distance));button.style.setProperty('--mobile-card-angle',`${distance*6}deg`);button.style.zIndex=String(20-Math.abs(distance));button.setAttribute('aria-label',getLocale()==='uk'?`Обрати карту ${choiceStart+i+1} з ${session.deck.length}`:`Choose card ${choiceStart+i+1} of ${session.deck.length}`);
 }
 syncChoiceNavigation();return true;
}
function syncTargets(targets){if(view!=='choose'||!session)return;const el=$('#card-choices');if(session.cardId!==null&&el.classList.contains('mobile-single-deck')&&matchMedia('(max-width:700px)').matches)return;if(mobileSingleDeck())return;if(el.classList.contains('mobile-single-deck')){el.replaceChildren();el.classList.remove('mobile-single-deck');}if(session.cardId!==null){if(el.classList.contains('fallback-choices')){el.replaceChildren();el.classList.remove('fallback-choices');}return;}const usable=targets.filter(t=>t.points.every(p=>p.every(Number.isFinite)));cardFlow?.update(usable);if(!usable.length)return;choiceCount=usable.length;choiceStart=Math.max(0,Math.min(choiceStart,session.deck.length-choiceCount));syncChoiceNavigation();if(el.classList.contains('fallback-choices'))el.replaceChildren();el.classList.remove('fallback-choices');
 while(el.children.length>usable.length)el.lastChild.remove();usable.forEach((t,i)=>{let button=el.children[i];if(!button){button=document.createElement('button');button.type='button';button.className='card-hit';el.append(button);cardFlow.bind(button);}const xs=t.points.map(p=>p[0]),ys=t.points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;button.dataset.slot=t.index;const label=getLocale()==='uk'?`Обрати карту ${choiceStart+t.index+1} з ${session.deck.length}`:`Choose card ${choiceStart+t.index+1} of ${session.deck.length}`;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);Object.assign(button.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px',zIndex:String(Math.round(10000+t.depth*100)),clipPath:`polygon(${t.points.map(([x,y])=>`${(x-left)/width*100}% ${(y-top)/height*100}%`).join(',')})`});});
}
addEventListener('olivia:card-positions',e=>syncTargets(e.detail));
matchMedia('(max-width:700px)').addEventListener('change',event=>{
 const deck=$('#card-choices');
 if(view==='choose'&&session?.cardId===null){const opening=deck.inert;cardFlow.cancel();refreshChoices();deck.inert=opening;syncChoiceNavigation();}
 else if(!event.matches&&deck.classList.contains('mobile-single-deck')){
  // The lifted card owns its animation now. Remove only the obsolete deck,
  // whose phone dimensions no longer apply, without cancelling the held card.
  deck.replaceChildren();deck.classList.remove('mobile-single-deck');
 }
});
function syncChoiceNavigation(){
 const nav=$('#choice-navigation');nav.hidden=!session||$('#card-choices').inert;
 if(!session)return;
 $('#choice-range').textContent=`${choiceStart+1}–${Math.min(choiceStart+choiceCount,session.deck.length)} of ${session.deck.length}`;
 $('#choice-previous').disabled=choiceStart===0;$('#choice-next').disabled=choiceStart+choiceCount>=session.deck.length;
}
function refreshChoices(){
 if(view!=='choose'||!session||session.cardId!==null)return;
 if(mobileSingleDeck())return;
 const targets=motion()?.inspect().ready?motion().targets():[];
 if(targets.length)syncTargets(targets);
 else fallbackSingleDeck();
}
function fallbackSingleDeck(){
 const deck=$('#card-choices');choiceCount=Math.min(7,session.deck.length);choiceStart=Math.max(0,Math.min(choiceStart,session.deck.length-choiceCount));cardFlow?.update([]);
 if(!deck.classList.contains('fallback-choices')||deck.children.length!==choiceCount){
  deck.replaceChildren();deck.classList.remove('mobile-single-deck');deck.classList.add('fallback-choices');
  for(let slot=0;slot<choiceCount;slot++){const b=document.createElement('button');b.className='card-hit';b.type='button';b.dataset.slot=slot;const img=new Image();img.src=assets.back;img.alt='';b.append(img);cardFlow.bind(b);deck.append(b);}
 }
 for(const b of deck.children)b.setAttribute('aria-label',getLocale()==='uk'?`Обрати карту ${choiceStart+Number(b.dataset.slot)+1} з ${session.deck.length}`:`Choose card ${choiceStart+Number(b.dataset.slot)+1} of ${session.deck.length}`);
 syncChoiceNavigation();
}
function browseChoices(direction){
 if(view!=='choose'||!session||session.cardId!==null||cardFlow.busy||$('#card-choices').inert)return;
 cardFlow.cancel();choiceStart=Math.max(0,Math.min(session.deck.length-choiceCount,choiceStart+direction*(choiceCount-2)));refreshChoices();
 if(!reduced()){const phone=matchMedia('(max-width:700px)').matches,target=phone?$('#card-choices'):$('#cards');target.animate(phone?[{opacity:.7,transform:`translateX(${direction*14}px)`},{opacity:1,transform:'translateX(0)'}]:[{opacity:.55},{opacity:1}],{duration:380,easing:'ease-out'});}
}
$('#choice-previous').addEventListener('click',()=>browseChoices(-1));
$('#choice-next').addEventListener('click',()=>browseChoices(1));

async function openDeck(){choiceStart=0;cardFlow.cancel();$('#choice-navigation').hidden=true;const generation=++transition;const start=motion()?.inspect().p||0,finish=.235;$('#choose-status').textContent='The deck is opening…';$('#random-card').disabled=true;$('#card-choices').inert=true;
 if(!reduced()&&motion()?.inspect().ready){await new Promise(resolve=>{let first;function tick(time){if(generation!==transition){resolve();return;}first??=time;const t=Math.min(1,(time-first)/2600),u=t*t*t*(10+t*(-15+6*t));motion().setProgress(start+(finish-start)*u);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});}else motion()?.setProgress(finish);
 if(generation!==transition)return;const targets=motion()?.inspect().ready?motion().targets():[];syncTargets(targets);if(!targets.length&&!mobileSingleDeck())fallbackSingleDeck();$('#card-choices').inert=false;$('#random-card').disabled=false;syncChoiceNavigation();if(document.activeElement===$('#choose-title'))$('#card-choices button')?.focus({preventScroll:true});$('#choose-status').textContent=matchMedia('(pointer:coarse)').matches?'Tap a card, or pull it upward. Then turn it when you are ready.':'Pull a card upwards, or select it with a click. Then turn it when you are ready.';announce('The deck is open. Choose a card, or choose one for me.');
}
$('#question-form').addEventListener('submit',e=>{e.preventDefault();try{preserveNote();if(readingEntry?.getCount()===3){dailyMode=false;const options={question:$('#question').value,intention:new FormData(e.currentTarget).get('intention'),reversals:$('#allow-reversals').checked,guidanceConsent:guidanceChoice?.getConsent()===true};if(approvedQuestionPlan?.question===$('#question').value.trim())spreads.startPlan(approvedQuestionPlan,options);else spreads.startPersonal(options);guidanceChoice.reset();return;}session=createSession({question:$('#question').value,intention:new FormData(e.currentTarget).get('intention'),reversals:$('#allow-reversals').checked},cards.map(c=>c.number));if(guidanceChoice?.getConsent())guidanceConsents.add(session.id);guidanceChoice?.reset();currentRecord=null;heldRecord=null;setView('choose');history.replaceState(null,'','#choose');openDeck();}catch(error){announce('The deck could not be opened in this browser. Please try again.');$('#choose-status').textContent=String(error.message);}});
cardFlow=initSingleCardFlow({assets,motion,reduced,announce,onBrowse:browseChoices,choose(slot){
 if(view!=='choose'||!session||session.cardId!==null)return null;
 session=chooseCard(session,choiceStart+slot);const card=cards[session.cardId],notes=localizeCardNotes(card.number,cardNotesForOrientation(card.number,session.orientation),{orientation:session.orientation});
 currentRecord=createRecord(session,card,{meaning:notes.meaning,prompt:notes.prompt,practice:notes.practice,connection:INTENTION_NOTES[session.intention]||''},'');if(dailyMode){try{currentRecord=saveDaily(storage(),currentRecord);saveRecord(storage(),currentRecord);}catch(error){announce(errorText(error));}}
 try{saveDraft(storage(),currentRecord);}catch(error){announce(errorText(error));}
 heldRecord=currentRecord;return currentRecord;
},onRead(record){history.replaceState(null,'','#reading/'+record.id);renderReading(record,false,{connected:true});return $('#reading-image');}});
$('#random-card').addEventListener('click',()=>{if(cardFlow.busy||!session||session.cardId!==null)return;choiceStart=0;refreshChoices();cardFlow.pick(0,document.activeElement===$('#random-card'));});$('#change-question').addEventListener('click',()=>goto('question'));
$('#reflection').addEventListener('input',()=>{preserveNote();saveDirty=true;if(currentRecord)dirtyIds.add(currentRecord.id);text('#save-status','Unsaved reflection.');setSaveState($('#save-reading'),$('#save-reading').dataset.saveState==='keep'?'keep':'reflection');});
$('#save-reading').addEventListener('click',()=>{if(!currentRecord||sample)return;currentRecord={...currentRecord,note:$('#reflection').value,updatedAt:new Date().toISOString()};try{saveRecord(storage(),currentRecord);clearDraft(storage(),currentRecord.id);drafts.set(currentRecord.id,currentRecord);dirtyIds.delete(currentRecord.id);saveDirty=dirtyIds.size>0;text('#save-status','Kept in your almanac, on this device.');setSaveState($('#save-reading'),'saved');$('#view-saved').hidden=false;dispatchEvent(new Event('olivia:journal-change'));refreshReturn();}catch(error){text('#save-status',errorText(error));}});
function download(name,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download-reading').addEventListener('click',()=>{if(!currentRecord)return;preserveNote();download('olivia-reading.json',exportRecords([currentRecord]));});
$('#export-journal').addEventListener('click',()=>{try{const all=new Map(loadRecords(storage()).map(r=>[r.id,r]));for(const [id,draft] of drafts)if(!all.has(id)||dirtyIds.has(id))all.set(id,draft);download('olivia-almanac.json',JSON.stringify({schemaVersion:1,oneCardReadings:JSON.parse(exportRecords([...all.values()])),guidedSpreads:spreads.exportJournal(),practice:practice.exportMetadata(),journey:journey.exportData(),questionHistory:serializeQuestionHistory(loadQuestionHistory(storage()))},null,2));}catch(error){text('#journal-status',errorText(error));}});
function renderJournal(){const list=$('#journal-list');list.replaceChildren();text('#journal-status','');let records;try{records=loadRecords(storage());}catch(error){text('#journal-status',errorText(error));$('#export-journal').disabled=true;return;}const savedIds=new Set(records.map(r=>r.id));const merged=new Map(records.map(r=>[r.id,r]));for(const [id,draft] of drafts){if(!merged.has(id)||dirtyIds.has(id))merged.set(id,draft);}records=[...merged.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));$('#export-journal').disabled=false;/* A backup may contain question observations even after its last reading is removed. */
 if(!records.length){const section=document.createElement('section');section.className='empty-journal';const h=document.createElement('h2');h.textContent='Your first page is waiting.';const p=document.createElement('p');p.textContent='Draw a card and keep a thought. Your reading will be here when you return.';const a=document.createElement('a');a.href='#question';a.className='solid-action';a.textContent='Draw your first card ↗';section.append(h,p,a);list.append(section);spreads.renderJournal();return;}
 records.forEach(record=>{const button=document.createElement('button');button.className='journal-row';button.type='button';const img=document.createElement('img');img.src=assets.cards[record.cardId];img.alt='';img.loading='lazy';const info=document.createElement('div'),date=document.createElement('time'),h=document.createElement('h2'),p=document.createElement('p'),arrow=document.createElement('span');date.dateTime=record.createdAt;date.textContent=readableDate(record.createdAt)+(!savedIds.has(record.id)?' · Unsaved draft':dirtyIds.has(record.id)?' · Unsaved changes':'');h.textContent=record.cardName;p.textContent=record.question||record.note||'An open reading';arrow.textContent='↗';info.append(date,h,p);button.append(img,info,arrow);button.addEventListener('click',()=>{preserveNote();currentRecord=drafts.get(record.id)||record;goto('reading');});const row=document.createElement('div');row.className='journal-entry';row.append(button);const remove=document.createElement('button');remove.type='button';remove.className='quiet-link remove-entry';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+record.cardName+' reading');remove.addEventListener('click',()=>{try{const practiceData=practice.remove('single',record.id,record);dispatchEvent(new Event('olivia:journal-change'));lastRemoved={record,practiceData};if(currentRecord?.id===record.id)currentRecord=null;if(heldRecord?.id===record.id)heldRecord=null;drafts.delete(record.id);dirtyIds.delete(record.id);saveDirty=dirtyIds.size>0;renderJournal();text('#journal-status','Reading removed.');const undo=document.createElement('button');undo.className='quiet-link';undo.textContent='Undo';undo.addEventListener('click',()=>{try{practice.restore(lastRemoved.practiceData);dispatchEvent(new Event('olivia:journal-change'));lastRemoved=null;renderJournal();refreshReturn();}catch(error){text('#journal-status',error.message||errorText(error));}});$('#journal-status').append(' ',undo);refreshReturn();}catch(error){text('#journal-status',error.message||errorText(error));}});row.append(remove);list.append(row);});
 spreads.renderJournal();
}
$('#resume-link').addEventListener('click',e=>{try{const last=getLastRecord(loadRecords(storage()));if(last){e.preventDefault();preserveNote();currentRecord=drafts.get(last.id)||last;goto('reading');}}catch{}});
$('#journey').addEventListener('click',event=>{
 if(!document.body.classList.contains('cinema')){document.body.classList.add('cinema');$('#leave-cinema').hidden=false;motion()?.resize();}
},true);
$('#leave-cinema').addEventListener('click',()=>{setView('home',{focus:false});});
$('.scroll-cue').addEventListener('click',event=>{if(matchMedia('(max-width:700px)').matches&&!document.body.classList.contains('cinema'))return;if(!reduced()&&(motion()?.inspect().p||0)<.94){event.preventDefault();motion()?.unfold();}});
$('.brand').addEventListener('click',e=>{e.preventDefault();goto('home');});document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>goto('home')));
addEventListener('olivia:practice-save',event=>{if(event.detail.kind!=='single')return;const record=event.detail.record;currentRecord=record;drafts.set(record.id,record);dirtyIds.delete(record.id);saveDirty=dirtyIds.size>0;text('#save-status','Kept in your almanac, on this device.');setSaveState($('#save-reading'),'saved');$('#view-saved').hidden=false;try{clearDraft(storage(),record.id);}catch{}});
addEventListener('olivia:guidance-save',event=>receiveSavedSingleGuidance(event.detail));
addEventListener('hashchange',route);addEventListener('storage',()=>{for(const id of drafts.keys())if(!dirtyIds.has(id))drafts.delete(id);refreshReturn();if(view==='journal'){renderJournal();}});addEventListener('beforeunload',e=>{if(saveDirty){e.preventDefault();e.returnValue='';}});
const spreads=initSpreads({assets,names,show:setView,goto,reduced,announce,onSingleQuestion(options){$('#question').value=options.question;for(const input of $('#question-form').querySelectorAll('[name="intention"]'))input.checked=input.value===options.intention;$('#allow-reversals').checked=options.reversals;guidanceChoice.setConsent(options.guidanceConsent);readingEntry.setCount(1);goto('question');},onComplete:(record,{guidanceConsent=false,onGuidanceState,onGuidanceResult}={})=>{practice?.attachSpread(record);mountQuestionGuidance($('#spread-synthesis-copy-guidance'),record,{showActions:false,autoRequest:guidanceConsent,onState:onGuidanceState,onResult:onGuidanceResult});},removePractice:(kind,id,record)=>practice.remove(kind,id,record),restorePractice:snapshot=>practice.restore(snapshot)});
practice=initPractice({assets,show:setView,goto,getRecord(kind,id){return kind==='spread'?spreads.getRecord(id):(currentRecord?.id===id?currentRecord:drafts.get(id));},openReading(record){preserveNote();try{const draft=loadDraft(storage());if(draft?.id===record.id)record=draft;}catch{}currentRecord=drafts.get(record.id)||record;drafts.set(record.id,currentRecord);goto('reading');},openSpread:record=>spreads.restore(record),startDaily(){
 try{const held=loadDaily(storage());if(held){currentRecord=held;goto('reading');return;}dailyMode=true;preserveNote();session=createSession({question:t('What could I pay attention to today?'),intention:'open'},cards.map(c=>c.number));currentRecord=null;heldRecord=null;setView('choose');history.replaceState(null,'','#choose');openDeck();}catch(error){announce(errorText(error));}
}});
const physical=initPhysicalReading({assets,show:setView,locale:getLocale(),onComplete(record){saveRecord(storage(),record);preserveNote();currentRecord=record;drafts.set(record.id,record);dispatchEvent(new Event('olivia:journal-change'));goto('reading');}});
const symbolRoot=document.createElement('main');symbolRoot.id='symbols-view';symbolRoot.hidden=true;document.body.append(symbolRoot);
const symbols=initSymbolTrails({assets,show:setView,locale:getLocale()});
initHomeShowcase({assets,locale:getLocale(),reduced});
const journey=initAlmanacJourney({assets,show:setView,openReading(record){preserveNote();currentRecord=drafts.get(record.id)||record;goto('reading');},openSpread:record=>spreads.restore(record)});
const entryCoach=initQuestionCoach({container:$('#question-coach'),input:$('#question'),locale:getLocale(),onApprove(plan){$('#question').value=plan.question;approvedQuestionPlan=plan;readingEntry.setPlan(plan);entryCoach.close();$('#question-form button[type=submit]').focus({preventScroll:true});},onSkip(){}});

simplifySaving($('#save-section'),$('#reflection'),getLocale());
simplifyPreferences($('#question-form'),$('#allow-reversals'),getLocale());
$('#question-title').before(readingSteps(0,getLocale()));$('#question-view>.eyebrow').hidden=true;
$('#choose-title').before(readingSteps(1,getLocale()));
$('.reading-copy').prepend(readingSteps(2,getLocale()));
const consentHost=document.createElement('div');$('#question-form button[type=submit]').before(consentHost);guidanceChoice=mountGuidanceChoice(consentHost,{locale:getLocale()});
readingEntry=initReadingEntry({form:$('#question-form'),input:$('#question'),assets,onMore(){const consent=guidanceChoice.getConsent();guidanceChoice.reset();spreads.prepareQuestion({question:$('#question').value,intention:new FormData($('#question-form')).get('intention'),reversals:$('#allow-reversals').checked,guidanceConsent:consent});}});
const questionIntro=document.createElement('div');questionIntro.className='question-entry-intro';$('#question-title').before(questionIntro);questionIntro.append($('#question-title'),$('#question-view>p:not(.eyebrow)'));const questionExtras=document.createElement('div');questionExtras.className='question-entry-extras';$('#question-form').append(questionExtras);questionExtras.append($('#question-form .reading-preferences'),$('#question-coach'));

for(const [en,uk,path] of [['Your story so far','Ваша історія','journey'],['Your living deck','Ваша жива колода','my-deck'],['Log a physical card','Записати фізичну карту','physical'],['Follow the symbols','Мова символів','symbols']]){const a=document.createElement('a');a.href='#'+path;a.textContent=(getLocale()==='uk'?uk:en)+' ↗';a.dataset.noTranslate='true';$('#almanac-links').append(a);}
const journalExplore=document.createElement('details');journalExplore.className='journal-explore';const journalExploreTitle=document.createElement('summary');journalExploreTitle.textContent=getLocale()==='uk'?'Досліджуйте свою практику':'Explore your practice';$('#almanac-links').before(journalExplore);journalExplore.append(journalExploreTitle,$('#almanac-links'));
initAlmanacImport($('#almanac-import'),{onImported(){renderJournal();practice.renderTopics();refreshReturn();}});
try{const carried=consumeQuestionHandoff(sessionStorage);if(carried){$('#question').value=carried;$('#question').dispatchEvent(new Event('input'));history.replaceState(null,'',location.pathname+location.search+'#question');}}catch{}
try{const draft=loadDraft(storage());if(draft){currentRecord=draft;drafts.set(draft.id,draft);const saved=loadRecords(storage()).find(record=>record.id===draft.id);if(!saved||saved.note!==draft.note){dirtyIds.add(draft.id);saveDirty=true;}}}catch(error){announce(errorText(error));}
const coachConversation=document.createElement('a');coachConversation.className='quiet-link';coachConversation.href=(window.OLIVIA_NATIVE?'':'https://oliviaarcana.com')+(getLocale()==='uk'?'/uk/ask/':'/ask/');coachConversation.dataset.noTranslate='true';coachConversation.textContent=getLocale()==='uk'?'Спершу обміркувати запитання з ШІ ↗':'Think through your question with AI first ↗';coachConversation.addEventListener('click',event=>{const question=$('#question').value.trim();if(!question)return;try{sessionStorage.setItem('olivia-question-handoff-v1',JSON.stringify({schemaVersion:1,question,createdAt:Date.now()}));}catch{event.preventDefault();announce(getLocale()==='uk'?'Скопіюйте запитання перед переходом. Браузер не зміг його перенести.':'Copy your question before continuing. This browser could not carry it across.');}});$('#question-view').append(coachConversation);
const physicalLink=document.createElement('a');physicalLink.href='#physical';physicalLink.className='quiet-link';physicalLink.dataset.noTranslate='true';physicalLink.textContent=getLocale()==='uk'?'Витягнули карту з власної колоди? Запишіть її ↗':'Already drawn from your own deck? Log your card ↗';$('#question-view').append(physicalLink);
const moreWays=document.createElement('details');moreWays.className='other-reading-ways';const moreSummary=document.createElement('summary');moreSummary.textContent=getLocale()==='uk'?'Інші способи почати':'Other ways to begin';moreWays.append(moreSummary,coachConversation,physicalLink);questionIntro.append($('#question-view>[data-home]'));$('#question-form .question-entry-extras').append(moreWays);
const requestedEntry=new URLSearchParams(location.search).get('experience');
if(!location.hash&&['question','journal','spreads','today'].includes(requestedEntry))history.replaceState(null,'',location.pathname+location.search+'#'+requestedEntry);
// The root always opens the hero; returning readers have Today and the resume link.
initLocale(document.body);
initMobileExperience({locale:getLocale()});
initMobileQuestion({locale:getLocale()});
initMobileReading();
initInteractivePerimeters();
refreshReturn();route();
