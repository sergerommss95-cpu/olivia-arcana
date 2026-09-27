import {initPractice} from './practice-ui.js';
import {loadDaily,saveDaily,loadDraft,saveDraft,clearDraft} from './practice-core.js';
import {TAROT_CARDS,cardCaption} from './deck-catalog.js';
import {initSpreads} from './spread-ui.js';
import {initSingleCardFlow} from './single-card-flow.js';
import {createSession,chooseCard,createRecord,loadRecords,saveRecord,removeRecord,exportRecords,getLastRecord} from './core.js';
import {CARD_NOTES,INTENTION_NOTES,SAMPLE} from './content.js';
const $=s=>document.querySelector(s), assets=window.OLIVIA_ASSETS;
const cards=TAROT_CARDS,names=cards.map(card=>card.name);
let choiceStart=0,choiceCount=13;
let cardFlow=null,practice=null,dailyMode=false;
let view='home',session=null,currentRecord=null,heldRecord=null,sample=false,transition=0,saveDirty=false,lastRemoved=null; const drafts=new Map(),dirtyIds=new Set();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).get('motion')==='reduce';
const motion=()=>window.motionStudy;
const announce=text=>$('#product-status').textContent=text;
const storage=()=>window.localStorage;
const text=(selector,value)=>$(selector).textContent=value;
const readableDate=value=>new Intl.DateTimeFormat(undefined,{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));
const errorText=error=>error.code==='STORAGE_CORRUPT'?'The saved almanac could not be read. Your existing data has been left untouched. You can still download this reading.':error.code==='STORAGE_LIMIT'?'This browser’s almanac is full. Download this reading to keep it.':'This browser could not save the reading. Download a copy to keep it.';
$('#sample-art').src=assets.cards[9];
if(new URLSearchParams(location.search).get('site')==='1')document.querySelectorAll('[data-site]').forEach(a=>{a.href=a.dataset.site;a.target='_top';});
function refreshReturn(){try{const last=getLastRecord(loadRecords(storage()));$('#resume-link').hidden=!last;if(last){$('#resume-link').textContent=`Return to ${last.cardName.replace(/^The /,'the ')} ↗`;$('#resume-link').dataset.record=last.id;}}catch{}}
function preserveNote(){if(!sample&&currentRecord&&view==='reading'){currentRecord={...currentRecord,note:$('#reflection').value};drafts.set(currentRecord.id,currentRecord);try{saveDraft(storage(),currentRecord);}catch{}}}
function setView(next,{focus=true,keepCard=false}={}){
 if(!keepCard)cardFlow?.cancel();
 if(view==='spreads'&&next!=='spreads')spreads.leave();
 preserveNote();transition++;motion()?.stopJourney();document.body.classList.remove('cinema');$('#leave-cinema').hidden=true;
 view=next;document.body.dataset.view=next;
 for(const id of ['question','choose','reading','journal','spreads','today','method','membership'])$(`#${id}-view`).hidden=next!==id&&!(id==='reading'&&next==='sample');
 $('#card-choices').hidden=next!=='choose';window.scrollTo({top:0,behavior:'instant'});
 if(next==='home'||next==='question')motion()?.setProgress(0);if(['home','question','choose'].includes(next))motion()?.resize();
 $('#opening-type').inert=next!=='home';$('#intro').inert=next!=='home';
 if(focus){const heading={question:'#question-title',choose:'#choose-title',reading:'#result-title',sample:'#result-title',journal:'#journal-title',today:'#today-title'}[next];requestAnimationFrame(()=>{const first=next==='choose'&&!$('#card-choices').inert?$('#card-choices button'):null;(first||(heading?$(heading):null))?.focus({preventScroll:true});});}
}
function goto(next){if(next==='reading'&&currentRecord)next+='/' + currentRecord.id;if(location.hash==='#'+next)route();else location.hash=next;}
function route(){const [next,readingId]=location.hash.slice(1).split('?')[0].split('/');
 if(next==='spreads'){spreads.open(readingId);}
 else if(next==='today'){practice.renderToday();}
 else if(next==='method'||next==='membership'){practice.openPage(next);}
 else if(next==='journal'){setView('journal');renderJournal();practice.renderTopics();}
 else if(next==='question'){dailyMode=false;setView('question');}
 else if(next==='sample'){showSample();}
 else if(next==='reading'){let selected=currentRecord;try{const saved=loadRecords(storage());selected=readingId?(drafts.get(readingId)||saved.find(r=>r.id===readingId)):currentRecord||getLastRecord(saved);}catch(error){announce(errorText(error));}if(selected)renderReading(selected,false);else practice.renderToday();}
 else if(next==='choose'&&session){if(session.cardId===null){setView('choose');openDeck();}else if(heldRecord){setView('choose',{focus:false});motion()?.setProgress(.235);cardFlow.restoreHeld(heldRecord,session.selectedSlot-choiceStart);}else{setView('question');}}
 else {setView('home',{focus:false});refreshReturn();if(next==='discover')requestAnimationFrame(()=>$('#discover').scrollIntoView());}
}
function showSample(){const note=CARD_NOTES[SAMPLE.cardId];renderReading({cardId:SAMPLE.cardId,cardName:names[SAMPLE.cardId],question:SAMPLE.question,intention:'change',interpretation:{...note,connection:''},note:''},true);}
function renderReading(record,isSample,{connected=false}={}){preserveNote();record=drafts.get(record.id)||record;setView(isSample?'sample':'reading',{focus:!connected,keepCard:connected});sample=isSample;if(!isSample)currentRecord=record;
 const id=record.cardId,notes=record.interpretation;
 text('#reading-kind',isSample?'A sample reading':'Your one-card reading');text('#reading-question',record.question?`“${record.question}”`:'An open reading');text('#result-title',record.cardName);const sentences=notes.meaning.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[notes.meaning];text('#meaning',sentences.slice(0,2).join('').trim());text('#full-reflection',sentences.slice(2).join('').trim());$('#full-reflection-details').hidden=sentences.length<=2;$('#full-reflection-details').open=false;text('#reflection-prompt',notes.prompt);text('#practice',notes.practice);text('#card-lesson',CARD_NOTES[id].learn);
 text('#intention-frame',record.intention==='open'?'':INTENTION_NOTES[record.intention]||'');$('#intention-frame').hidden=!$('#intention-frame').textContent;
 $('#reading-image').src=assets.cards[id];$('#reading-image').alt=`${record.cardName} — Olivia Arcana tarot artwork`;text('#card-index',cardCaption(id));
 $('#reflection').value=record.note||'';$('#save-section').hidden=isSample;$('#sample-cta').hidden=!isSample;$('#view-saved').hidden=true;$('#save-status').textContent='';$('#save-reading').firstChild.textContent='Keep this reading ';saveDirty=dirtyIds.size>0;if(dirtyIds.has(record.id))text('#save-status','Unsaved reflection.');
 practice?.attachSingle(record,isSample);
 if(!reduced()&&!connected)$('#reveal-card').animate([{opacity:0,transform:'translateY(30px) rotateY(-35deg) rotate(-6deg)'},{opacity:1,transform:'translateY(0) rotateY(0) rotate(-3deg)'}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
}
function syncTargets(targets){if(view!=='choose'||!session)return;const el=$('#card-choices');if(session.cardId!==null){if(el.classList.contains('fallback-choices')){el.replaceChildren();el.classList.remove('fallback-choices');}return;}const usable=targets.filter(t=>t.points.every(p=>p.every(Number.isFinite)));cardFlow?.update(usable);if(!usable.length)return;choiceCount=usable.length;choiceStart=Math.max(0,Math.min(choiceStart,session.deck.length-choiceCount));syncChoiceNavigation();if(el.classList.contains('fallback-choices'))el.replaceChildren();el.classList.remove('fallback-choices');
 while(el.children.length>usable.length)el.lastChild.remove();usable.forEach((t,i)=>{let button=el.children[i];if(!button){button=document.createElement('button');button.type='button';button.className='card-hit';el.append(button);cardFlow.bind(button);}const xs=t.points.map(p=>p[0]),ys=t.points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;button.dataset.slot=t.index;button.setAttribute('aria-label',`Choose card ${choiceStart+t.index+1} of ${session.deck.length}`);Object.assign(button.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px',zIndex:String(Math.round(10000+t.depth*100)),clipPath:`polygon(${t.points.map(([x,y])=>`${(x-left)/width*100}% ${(y-top)/height*100}%`).join(',')})`});});
}
addEventListener('olivia:card-positions',e=>syncTargets(e.detail));
function syncChoiceNavigation(){
 const nav=$('#choice-navigation');nav.hidden=!session||$('#card-choices').inert;
 if(!session)return;
 $('#choice-range').textContent=`${choiceStart+1}–${Math.min(choiceStart+choiceCount,session.deck.length)} of ${session.deck.length}`;
 $('#choice-previous').disabled=choiceStart===0;$('#choice-next').disabled=choiceStart+choiceCount>=session.deck.length;
}
function refreshChoices(){
 const targets=motion()?.inspect().ready?motion().targets():[];
 if(targets.length)syncTargets(targets);
 else {for(const b of $('#card-choices').children)b.setAttribute('aria-label',`Choose card ${choiceStart+Number(b.dataset.slot)+1} of ${session.deck.length}`);syncChoiceNavigation();}
}
function browseChoices(direction){
 if(view!=='choose'||!session||session.cardId!==null||cardFlow.busy||$('#card-choices').inert)return;
 cardFlow.cancel();choiceStart=Math.max(0,Math.min(session.deck.length-choiceCount,choiceStart+direction*(choiceCount-2)));refreshChoices();
 if(!reduced())$('#cards').animate([{opacity:.55},{opacity:1}],{duration:380,easing:'ease-out'});
}
$('#choice-previous').addEventListener('click',()=>browseChoices(-1));
$('#choice-next').addEventListener('click',()=>browseChoices(1));

async function openDeck(){choiceStart=0;cardFlow.cancel();$('#choice-navigation').hidden=true;const generation=++transition;const start=motion()?.inspect().p||0,finish=.235;$('#choose-status').textContent='The deck is opening…';$('#random-card').disabled=true;$('#card-choices').inert=true;
 if(!reduced()&&motion()?.inspect().ready){await new Promise(resolve=>{let first;function tick(time){if(generation!==transition){resolve();return;}first??=time;const t=Math.min(1,(time-first)/2600),u=t*t*t*(10+t*(-15+6*t));motion().setProgress(start+(finish-start)*u);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});}else motion()?.setProgress(finish);
 if(generation!==transition)return;const targets=motion()?.inspect().ready?motion().targets():[];syncTargets(targets);if(!targets.length){const deck=$('#card-choices');deck.replaceChildren();deck.classList.add('fallback-choices');choiceCount=Math.min(7,session.deck.length);for(let slot=0;slot<choiceCount;slot++){const b=document.createElement('button');b.className='card-hit';b.type='button';b.dataset.slot=slot;b.setAttribute('aria-label',`Choose card ${slot+1} of ${session.deck.length}`);const img=new Image();img.src=assets.back;img.alt='';b.append(img);cardFlow.bind(b);deck.append(b);}}$('#card-choices').inert=false;$('#random-card').disabled=false;syncChoiceNavigation();if(document.activeElement===$('#choose-title'))$('#card-choices button')?.focus({preventScroll:true});$('#choose-status').textContent='Pull a card upwards, or select it with a click. Then turn it when you are ready.';announce('The deck is open. Choose a card, or choose one for me.');
}
$('#question-form').addEventListener('submit',e=>{e.preventDefault();try{preserveNote();session=createSession({question:$('#question').value,intention:new FormData(e.currentTarget).get('intention')},cards.map(c=>c.number));currentRecord=null;heldRecord=null;setView('choose');history.replaceState(null,'','#choose');openDeck();}catch(error){announce('The deck could not be opened in this browser. Please try again.');$('#choose-status').textContent=String(error.message);}});
cardFlow=initSingleCardFlow({assets,motion,reduced,announce,choose(slot){
 if(view!=='choose'||!session||session.cardId!==null)return null;
 session=chooseCard(session,choiceStart+slot);const card=cards[session.cardId],notes=CARD_NOTES[card.number];
 currentRecord=createRecord(session,card,{meaning:notes.meaning,prompt:notes.prompt,practice:notes.practice,connection:INTENTION_NOTES[session.intention]||''},'');if(dailyMode){try{currentRecord=saveDaily(storage(),currentRecord);saveRecord(storage(),currentRecord);}catch(error){announce(errorText(error));}}
 try{saveDraft(storage(),currentRecord);}catch(error){announce(errorText(error));}
 heldRecord=currentRecord;return currentRecord;
},onRead(record){history.replaceState(null,'','#reading/'+record.id);renderReading(record,false,{connected:true});return $('#reading-image');}});
$('#random-card').addEventListener('click',()=>{if(cardFlow.busy||!session||session.cardId!==null)return;choiceStart=0;refreshChoices();cardFlow.pick(0,document.activeElement===$('#random-card'));});$('#change-question').addEventListener('click',()=>goto('question'));
$('#reflection').addEventListener('input',()=>{preserveNote();saveDirty=true;if(currentRecord)dirtyIds.add(currentRecord.id);text('#save-status','Unsaved reflection.');$('#save-reading').firstChild.textContent='Save reflection ';});
$('#save-reading').addEventListener('click',()=>{if(!currentRecord||sample)return;currentRecord={...currentRecord,note:$('#reflection').value,updatedAt:new Date().toISOString()};try{saveRecord(storage(),currentRecord);clearDraft(storage(),currentRecord.id);drafts.set(currentRecord.id,currentRecord);dirtyIds.delete(currentRecord.id);saveDirty=dirtyIds.size>0;text('#save-status','Kept in your almanac, on this device.');$('#save-reading').firstChild.textContent='Saved ';$('#view-saved').hidden=false;dispatchEvent(new Event('olivia:journal-change'));refreshReturn();}catch(error){text('#save-status',errorText(error));}});
function download(name,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download-reading').addEventListener('click',()=>{if(!currentRecord)return;preserveNote();download('olivia-reading.json',exportRecords([currentRecord]));});
$('#export-journal').addEventListener('click',()=>{try{const all=new Map(loadRecords(storage()).map(r=>[r.id,r]));for(const [id,draft] of drafts)if(!all.has(id)||dirtyIds.has(id))all.set(id,draft);download('olivia-almanac.json',JSON.stringify({schemaVersion:1,oneCardReadings:JSON.parse(exportRecords([...all.values()])),guidedSpreads:spreads.exportJournal(),practice:practice.exportMetadata()},null,2));}catch(error){text('#journal-status',errorText(error));}});
function renderJournal(){const list=$('#journal-list');list.replaceChildren();text('#journal-status','');let records;try{records=loadRecords(storage());}catch(error){text('#journal-status',errorText(error));$('#export-journal').disabled=true;return;}const savedIds=new Set(records.map(r=>r.id));const merged=new Map(records.map(r=>[r.id,r]));for(const [id,draft] of drafts){if(!merged.has(id)||dirtyIds.has(id))merged.set(id,draft);}records=[...merged.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));$('#export-journal').disabled=!records.length;
 if(!records.length){const section=document.createElement('section');section.className='empty-journal';const h=document.createElement('h2');h.textContent='Your first page is waiting.';const p=document.createElement('p');p.textContent='Draw a card and keep a thought. Your reading will be here when you return.';const a=document.createElement('a');a.href='#question';a.className='solid-action';a.textContent='Draw your first card ↗';section.append(h,p,a);list.append(section);spreads.renderJournal();return;}
 records.forEach(record=>{const button=document.createElement('button');button.className='journal-row';button.type='button';const img=document.createElement('img');img.src=assets.cards[record.cardId];img.alt='';img.loading='lazy';const info=document.createElement('div'),date=document.createElement('time'),h=document.createElement('h2'),p=document.createElement('p'),arrow=document.createElement('span');date.dateTime=record.createdAt;date.textContent=readableDate(record.createdAt)+(!savedIds.has(record.id)?' · Unsaved draft':dirtyIds.has(record.id)?' · Unsaved changes':'');h.textContent=record.cardName;p.textContent=record.question||record.note||'An open reading';arrow.textContent='↗';info.append(date,h,p);button.append(img,info,arrow);button.addEventListener('click',()=>{preserveNote();currentRecord=drafts.get(record.id)||record;goto('reading');});const row=document.createElement('div');row.className='journal-entry';row.append(button);const remove=document.createElement('button');remove.type='button';remove.className='quiet-link remove-entry';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+record.cardName+' reading');remove.addEventListener('click',()=>{try{const practiceData=practice.remove('single',record.id);try{removeRecord(storage(),record.id);}catch(error){practice.restore(practiceData);throw error;}dispatchEvent(new Event('olivia:journal-change'));lastRemoved={record,practiceData};if(currentRecord?.id===record.id)currentRecord=null;if(heldRecord?.id===record.id)heldRecord=null;drafts.delete(record.id);clearDraft(storage(),record.id);dirtyIds.delete(record.id);saveDirty=dirtyIds.size>0;renderJournal();text('#journal-status','Reading removed.');const undo=document.createElement('button');undo.className='quiet-link';undo.textContent='Undo';undo.addEventListener('click',()=>{try{saveRecord(storage(),lastRemoved.record);practice.restore(lastRemoved.practiceData);dispatchEvent(new Event('olivia:journal-change'));lastRemoved=null;renderJournal();refreshReturn();}catch(error){text('#journal-status',errorText(error));}});$('#journal-status').append(' ',undo);refreshReturn();}catch(error){text('#journal-status',errorText(error));}});row.append(remove);list.append(row);});
 spreads.renderJournal();
}
$('#resume-link').addEventListener('click',e=>{try{const last=getLastRecord(loadRecords(storage()));if(last){e.preventDefault();preserveNote();currentRecord=drafts.get(last.id)||last;goto('reading');}}catch{}});
$('#journey').addEventListener('click',()=>{if(!document.body.classList.contains('cinema')){document.body.classList.add('cinema');$('#leave-cinema').hidden=false;window.scrollTo({top:0,behavior:'instant'});motion()?.resize();}},true);
$('#leave-cinema').addEventListener('click',()=>{setView('home',{focus:false});motion()?.setProgress(0);});
$('.brand').addEventListener('click',e=>{e.preventDefault();goto('home');});document.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>goto('home')));
addEventListener('olivia:practice-save',event=>{if(event.detail.kind!=='single')return;const record=event.detail.record;currentRecord=record;drafts.set(record.id,record);dirtyIds.delete(record.id);saveDirty=dirtyIds.size>0;text('#save-status','Kept in your almanac, on this device.');$('#save-reading').firstChild.textContent='Saved ';$('#view-saved').hidden=false;try{clearDraft(storage(),record.id);}catch{}});
addEventListener('hashchange',route);addEventListener('storage',()=>{for(const id of drafts.keys())if(!dirtyIds.has(id))drafts.delete(id);refreshReturn();if(view==='journal'){renderJournal();}});addEventListener('beforeunload',e=>{if(saveDirty){e.preventDefault();e.returnValue='';}});
const spreads=initSpreads({assets,names,show:setView,goto,reduced,announce,onComplete:record=>practice?.attachSpread(record),removePractice:(kind,id)=>practice.remove(kind,id),restorePractice:snapshot=>practice.restore(snapshot)});
practice=initPractice({assets,show:setView,goto,openReading(record){preserveNote();try{const draft=loadDraft(storage());if(draft?.id===record.id)record=draft;}catch{}currentRecord=drafts.get(record.id)||record;drafts.set(record.id,currentRecord);goto('reading');},openSpread:record=>spreads.restore(record),startDaily(){
 try{const held=loadDaily(storage());if(held){currentRecord=held;goto('reading');return;}dailyMode=true;preserveNote();session=createSession({question:'What could I pay attention to today?',intention:'open'},cards.map(c=>c.number));currentRecord=null;heldRecord=null;setView('choose');history.replaceState(null,'','#choose');openDeck();}catch(error){announce(errorText(error));}
}});
try{const draft=loadDraft(storage());if(draft){currentRecord=draft;drafts.set(draft.id,draft);const saved=loadRecords(storage()).find(record=>record.id===draft.id);if(!saved||saved.note!==draft.note){dirtyIds.add(draft.id);saveDirty=true;}}}catch(error){announce(errorText(error));}
if(!location.hash){try{if(loadRecords(storage()).length||loadDaily(storage())||loadDraft(storage()))history.replaceState(null,'','#today');}catch{}}
refreshReturn();route();
