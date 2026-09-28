import {createReadingReference} from './reading-reference.js';
import {setSaveState,guidanceSaveState} from './save-state.js';
import {syncSupportNote} from './support-note.js';
import {mountGuidanceChoice,unmountQuestionGuidance} from './question-guidance.js';
import {simplifyPreferences,simplifySaving,readingSteps} from './journey-entry.js';
import {mountFirstImpression} from './first-impression.js';
import {getLocale,t,localizeSpreadReading,localizeEditorialLine,localizePositionPrompt} from './locale.js';
import {bindDeckGesture} from './deck-gesture.js';
import {initQuestionCoach,validateQuestionPlan,applyQuestionPlan,mountQuestionPlan,QUESTION_LIMIT} from './question-coach.js';
import {SPREADS,buildSpreadReading} from './spread-content.js';
import {MEMBERSHIP_LIVE,isSpreadFree} from './membership.js';
import {dealMotion,revealMotion,holdDuration,deckBrowseMotion} from './spread-motion.js';
import {spreadEditorial,cardEditorial} from './spread-editorial.js';
import {createSpreadSession,selectSpreadCard,revealNext,revealAll,createSpreadRecord,loadSpreadRecords,saveSpreadRecord,removeSpreadRecord,exportSpreadRecords} from './spread-core.js';

/** The spread ritual is independent of the approved WebGL hero timeline. */
export function initSpreads({assets,names,show,goto,reduced,announce,onComplete=()=>{},onSingleQuestion=()=>{},removePractice=()=>null,restorePractice=()=>{}}) {
 const $=s=>document.querySelector(s), el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 const isSite=window.OLIVIA_NATIVE===true||(new URLSearchParams(location.search).get('site')==='1'&&parent!==window);
 const memberURL='#membership';
 const spreadOpen=s=>isSpreadFree(s?.id);
 let access={status:isSite?'loading':'unavailable',paid:false},requestId='',accessTimer;
 let current=null,definition=null,session=null,reading=null,record=null,isPreview=false,active=-1,playing=false,busy=false,generation=0,flowGeneration=0,unsaved=false;
 const animations=new Set(), drafts=new Map(),dirty=new Set();
 let synthesisIndex=0,questionCoach=null,questionSetup=null,approvedPlan=null,guidanceConsent=false;
 const guidanceConsents=new Set();
 let deckStart=38,deckFocus=38,gathered=false,mobileCard=0,browseStart=null;
 const handheldQuery=matchMedia('(max-width:700px)'),handheld=()=>handheldQuery.matches;
 const deckResets=[];
 const copy=(en,uk)=>getLocale()==='uk'?uk:en;
 const detailOpen=new Set();let firstImpressions=[];const impressionSeen=new Set();
 const previewQuestion=t('What would help me approach an important change with more clarity?');
 const previewIds={clarity3:[9,18,14],crossroads5:[6,7,12,2,14],compass8:[18,9,2,16,15,8,12,17]};
 const root=el('main','product-page spread-page');root.id='spreads-view';root.hidden=true;root.setAttribute('aria-labelledby','spreads-title');
 root.innerHTML=`<div class="page-top"><a class="brand" href="#home">Olivia <span>ARCANA</span></a><a class="quiet-link" href="#journal">My almanac ↗</a></div>
 <div id="spread-library"><div class="spread-intro"><div><p class="eyebrow">A fuller conversation</p><h1 id="spreads-title" tabindex="-1">When a question<br>has <em>many sides.</em></h1></div><p>Let each card hold a different part of the picture. Explore what connects them, then find a step that feels like your own.</p></div><div class="spread-collection"><div class="spread-options" id="spread-options" aria-label="Choose a spread"></div><div class="spread-showcase"><div id="spread-showcase-art" class="spread-showcase-art" aria-hidden="true"></div><div class="spread-showcase-caption"><div><p class="eyebrow" id="showcase-count"></p><p id="showcase-invitation"></p></div><button class="text-action" id="preview-current">Explore a sample ↗</button></div></div></div>
 <div class="spread-entry"><div><p class="eyebrow">Your question, held in context</p><h2>Bring your<br><em>own question.</em></h2><p>A small spread can be enough. Choose more cards when there are genuinely different parts of a situation to explore.</p><p class="privacy-note">Drawn from Olivia’s full 78-card deck: Major and Minor Arcana. You can include reversed cards when you begin. Interpretations are curated reflections, not predictions.</p></div><form id="spread-question-form"><label for="spread-question">Your question <span>(optional)</span></label><textarea id="spread-question" maxlength="1600" rows="3" placeholder="What do I need to understand about this situation?"></textarea><div id="spread-paths" hidden><label for="spread-path-a">Path A<input id="spread-path-a" maxlength="120" placeholder="Your first option"></label><label for="spread-path-b">Path B<input id="spread-path-b" maxlength="120" placeholder="Your second option"></label></div><fieldset><legend>A place to begin</legend><div class="intention-options"><label><input type="radio" name="spread-intention" value="open" checked><span>Stay open</span></label><label><input type="radio" name="spread-intention" value="relationships"><span>Relationships</span></label><label><input type="radio" name="spread-intention" value="work"><span>Work</span></label><label><input type="radio" name="spread-intention" value="change"><span>Change</span></label></div></fieldset><label class="orientation-option"><input type="checkbox" id="spread-reversals"><span>Include reversed cards<small>Explore inward, blocked or changing expressions of a card.</small></span></label><p id="spread-access" role="status"></p><button class="solid-action" id="begin-spread" type="submit">Begin this spread ↗</button><a id="spread-membership" class="text-action">Explore membership ↗</a><button type="button" id="refresh-spread-access" class="quiet-link">Check my membership again</button><p class="privacy-note">${MEMBERSHIP_LIVE?'One-card and three-card readings are free. Five- and eight-card spreads are for members. ':'Every reading is free: one, three, five or eight cards.'}</p><a href="#question" class="quiet-link">Prefer a single card? Begin here ↗</a></form></div></div>
 <section id="spread-ritual" hidden aria-labelledby="spread-ritual-title"><div class="spread-ritual-head"><div><p class="eyebrow" id="spread-kind"></p><h1 id="spread-ritual-title" tabindex="-1"></h1><details class="deck-question-disclosure"><summary>${copy("The question you’re holding","Ваше запитання")}</summary><p id="spread-held-question" class="question-quote"></p></details></div><button class="quiet-link" id="leave-spread">← All spreads</button></div><div class="spread-workspace"><div class="spread-scene"><div id="spread-board" class="spread-board" aria-label="Your spread"></div><div id="spread-deck-area"><p class="eyebrow" id="spread-pick-label"></p><div class="spread-deck" id="spread-deck" aria-label="Choose cards from the deck"></div><button class="text-action" id="deal-spread">Let the deck choose ↗</button></div></div><aside class="spread-insight"><div id="spread-position-copy"></div><nav class="spread-card-nav" id="spread-card-nav" aria-label="Explore revealed cards" hidden><button id="inspect-previous" class="quiet-link" aria-label="Previous revealed card">←</button><span id="inspect-count"></span><button id="inspect-next" class="quiet-link" aria-label="Next revealed card">→</button></nav><div class="spread-controls"><p id="spread-progress" role="status"></p><div><button class="solid-action" id="reveal-next" hidden>Reveal the first card ↗</button><button class="quiet-link" id="reveal-flow" hidden>Watch the reveal</button><button class="quiet-link" id="reveal-skip" hidden>Reveal all now</button></div></div><button id="show-synthesis" class="text-action" hidden>Read the cards together ↗</button></aside></div>
 <section class="spread-synthesis" id="spread-synthesis" hidden><div class="spread-synthesis-title"><p class="eyebrow">The whole picture</p><h2 tabindex="-1" id="spread-together-title">Read <em>together.</em></h2><p id="spread-synthesis-question" class="question-quote"></p></div><div class="spread-synthesis-copy"><div id="spread-synthesis-copy-guidance"></div><div id="spread-connections" class="spread-connections" aria-hidden="true"></div><nav id="synthesis-tabs" class="synthesis-tabs" aria-label="Connections between your cards"></nav><div id="spread-paragraphs" aria-live="polite"></div><button id="synthesis-next" class="text-action">Continue the thread ↗</button><div class="reflection-prompt synthesis-reflection"><span class="eyebrow">A question to take with you</span><p id="spread-takeaway"></p></div><div id="spread-save-section"><label for="spread-reflection">What connects with your life? <span>(optional)</span></label><textarea id="spread-reflection" maxlength="4000" rows="3" placeholder="The connection I notice. The next step I can take…"></textarea><div class="save-actions"><button id="save-spread" class="solid-action">Keep this spread ↗</button><a href="#journal" class="quiet-link">My almanac ↗</a></div><p id="spread-save-status" role="status"></p><button id="download-spread" class="quiet-link">Download this spread ↓</button><p class="privacy-note">Saved on this browser and device. Download a copy for your own backup.</p></div><div id="spread-preview-cta" hidden><p>You chose these cards around an example question. Membership lets you bring your own question and keep your reading.</p><a class="text-action" id="preview-membership">Make room for your own question ↗</a></div><a href="#method" class="quiet-link">How Olivia works ↗</a><button class="quiet-link" id="another-spread">Choose another spread ↗</button></div></section></section><dialog id="spread-art-dialog" class="spread-art-dialog" aria-labelledby="spread-art-title"><button id="close-spread-art" class="quiet-link" aria-label="Close card detail">Close ×</button><div class="spread-art-detail"><img id="spread-detail-image" alt=""><div><p class="eyebrow" id="spread-art-position"></p><h2 id="spread-art-title"></h2><p id="spread-art-line"></p></div></div></dialog>`;
 $('#journal-view').before(root);
 simplifySaving($('#spread-save-section'),$('#spread-reflection'),getLocale());
 const revealOptions=el('details','reveal-options');revealOptions.append(el('summary','',copy('Reveal options','Способи відкриття')));$('#reveal-next').after(revealOptions);revealOptions.append($('#reveal-flow'),$('#reveal-skip'));

 // Reuse one question form so samples, membership and the question coach follow
 // the same validated start path. Opening/cancelling never changes the draw.
 const questionEntry=$('.spread-entry'),questionHome=questionEntry.parentElement;
 const questionPanel=el('div','spread-question-editor');questionPanel.hidden=true;
 const questionReturn=el('button','quiet-link',copy('← Return to the deck','← Повернутися до колоди'));
 questionReturn.type='button';questionReturn.id='return-to-spread';
 const questionNotice=el('p','question-restart-note');questionNotice.id='question-restart-note';
 questionPanel.append(questionReturn,questionNotice);$('.spread-ritual-head').after(questionPanel);
 const questionAction=el('button','text-action');questionAction.type='button';questionAction.id='edit-spread-question';
 const ritualActions=el('div','spread-ritual-actions');$('.spread-ritual-head').append(ritualActions);ritualActions.append(questionAction,$('#leave-spread'));
 function adaptRitualHeader(){
  const hadFocus=document.activeElement===questionAction;
  $('#leave-spread').textContent=handheld()?copy('← Back','← Назад'):t('← All spreads');
  if(handheld()){
   const question=$('.deck-question-disclosure');question.append(questionAction);
   if(hadFocus)question.open=true;
  }
  else ritualActions.prepend(questionAction);
  if(hadFocus)questionAction.focus({preventScroll:true});
 }
 adaptRitualHeader();
 const ownQuestion=el('button','solid-action',copy('Ask your own question ↗','Поставити своє запитання ↗'));ownQuestion.type='button';ownQuestion.id='ask-spread-question';
 const entryActions=el('div','spread-entry-actions');$('#preview-current').before(entryActions);entryActions.append(ownQuestion,$('#preview-current'));
 function closeQuestionEditor(){
  if(questionEntry.parentElement===questionPanel){questionHome.insertBefore(questionEntry,otherSpreads);spreadConsentChoice.reset();}
  questionPanel.hidden=true;root.classList.remove('is-writing');
 }
 function openQuestionEditor(){
  if(busy||playing||!session||(!isPreview&&(record||session.cardIds.length)))return;
  chooseDefinition(definition.id);
  if(!isPreview&&questionSetup){
   $('#spread-question').value=questionSetup.question;$('#spread-path-a').value=questionSetup.pathA;$('#spread-path-b').value=questionSetup.pathB;
   for(const input of $('#spread-question-form').querySelectorAll('[name="spread-intention"]'))input.checked=input.value===session.intention;
   $('#spread-reversals').checked=session.reversals;if(session.readingPlan){questionCoach?.restore(session.readingPlan);approvedPlan=session.readingPlan;}else questionCoach?.reset();spreadConsentChoice.setConsent(guidanceConsents.has(session.id));renderAccess();
  }
  questionPanel.append(questionEntry);questionPanel.hidden=false;root.classList.add('is-writing');
  questionNotice.hidden=!session.cardIds.length;
  questionNotice.textContent=copy('Your own question begins a fresh reading. You can return to this sample without changing it.','Ваше запитання починає новий розклад. Ви можете повернутися до цього прикладу без змін.');
  questionEntry.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});$('#spread-question').focus({preventScroll:true});
 }
 ownQuestion.addEventListener('click',()=>{questionEntry.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});$('#spread-question').focus({preventScroll:true});});
 questionAction.addEventListener('click',openQuestionEditor);
 questionReturn.addEventListener('click',()=>{closeQuestionEditor();if(handheld())$('.deck-question-disclosure').open=true;questionAction.focus({preventScroll:true});});
 // Bring the question above the catalogue. Other sizes stay one disclosure away.
 const collection=$('.spread-collection'),otherSpreads=el('details','other-spreads');
 otherSpreads.dataset.noTranslate='true';otherSpreads.append(el('summary','',copy('Explore other spreads · 3, 5 or 8 cards','Інші розклади · 3, 5 або 8 карт')));
 collection.before(questionEntry,otherSpreads);otherSpreads.append(collection);
 const entryIntro=questionEntry.firstElementChild;entryIntro.replaceChildren(el('p','eyebrow',copy('BEGIN WITH WHAT MATTERS TO YOU','ПОЧНІТЬ ІЗ ВАЖЛИВОГО')),el('h1','',copy('What would you like to understand?','Що ви хочете зрозуміти?')),el('p','',copy('Ask in your own words. A three-card reading is a good place to begin.','Запитайте своїми словами. Розклад із трьох карт — добрий початок.')));
 $('#spread-library .spread-intro').hidden=true;$('#spreads-title').id='spread-catalog-title';entryIntro.querySelector('h1').id='spreads-title';entryIntro.querySelector('h1').tabIndex=-1;
 const spreadEntrySteps=readingSteps(0,getLocale());questionEntry.prepend(spreadEntrySteps);
 simplifyPreferences($('#spread-question-form'),$('#spread-reversals'),getLocale());
 const recommendation=el('div','spread-recommendation');recommendation.dataset.noTranslate='true';
 const cardCount=n=>copy(n+' cards',n+(n<5?' карти':' карт'));
 const sizeChoice=el('fieldset','spread-size-choice');sizeChoice.append(el('legend','sr-only',copy('How many cards','Скільки карт')));
 for(const s of SPREADS){
  const label=el('label'),radio=el('input'),face=el('span');
  radio.type='radio';radio.name='spread-size';radio.value=s.id;
  face.append(el('b','',String(s.count)),el('em','',copy('cards',s.count<5?'карти':'карт')),el('small','',t(s.name)));
  label.append(radio,face);sizeChoice.append(label);
  radio.addEventListener('change',()=>{if(radio.checked)chooseDefinition(s.id);});
 }
 recommendation.append(el('p','eyebrow',copy('YOUR READING','ВАШЕ ЧИТАННЯ')),sizeChoice,el('h3'),el('p'));$('#spread-question').after(recommendation);$('#spread-question').placeholder=copy('What would I like to see more clearly?','Що я хочу побачити ясніше?');
 const spreadConsentHost=el('div');$('#spread-access').before(spreadConsentHost);const spreadConsentChoice=mountGuidanceChoice(spreadConsentHost,{locale:getLocale()});spreadConsentChoice.input.addEventListener('change',()=>{if(questionEntry.parentElement===questionPanel&&session&&!spreadConsentChoice.input.checked)guidanceConsents.delete(session.id);});
 const sampleShortcut=el('button','quiet-link',copy('Just exploring? Try a sample','Хочете спробувати? Відкрийте приклад'));sampleShortcut.type='button';sampleShortcut.onclick=()=>start(selected(),true);questionEntry.append(sampleShortcut);
 const updateRecommendation=()=>{const s=selected();for(const r of sizeChoice.querySelectorAll('input'))r.checked=r.value===s.id;recommendation.querySelector('h3').textContent=t(s.name)+' · '+cardCount(s.count);recommendation.querySelector('p:not(.eyebrow)').textContent=t(s.description)+(MEMBERSHIP_LIVE?' '+(s.count===3?copy('Free.','Безкоштовно.'):copy('Included with membership.','Входить у підписку.')):'');};
 const stageIntro=el('div','deck-stage-intro');
 stageIntro.innerHTML=`<p class="eyebrow">${copy('THE CHOICE IS YOURS','ВИБІР ЗА ВАМИ')}</p><h2>${copy('Let your hand <br><em>decide.</em>','Довіртеся <br><em>своєму вибору.</em>')}</h2><p class="deck-stage-description">${copy('Move through the deck. Lift the card that draws you in.','Перегляньте колоду. Витягніть карту, яка вас приваблює.')}</p>`;
 const mobilePosition=el('h2','mobile-position-title');mobilePosition.dataset.noTranslate='true';
 $('#spread-board').before(stageIntro);stageIntro.append($('#spread-pick-label'),mobilePosition);

 const tableHint=el('p','spread-table-hint','Your cards, at your pace. Begin with the first.');tableHint.id='spread-table-hint';$('#spread-board').before(tableHint);
 for(const id of ['#spread-membership','#preview-membership']){$(id).href=memberURL;}
 const selected=()=>SPREADS.find(s=>s.id===current)||SPREADS[0];
 const compositions={
  clarity3:[{x:25,y:53,r:-13,w:26,face:0},{x:53,y:45,r:3,w:31,face:1},{x:80,y:59,r:14,w:24,face:2}],
  crossroads5:[{x:50,y:44,r:-2,w:26,face:0},{x:20,y:60,r:-13,w:22,face:1},{x:82,y:53,r:13,w:22,face:2},{x:34,y:26,r:-9,w:19},{x:67,y:76,r:7,w:19}],
  compass8:[{x:48,y:48,r:-5,w:27,face:0},{x:20,y:67,r:-16,w:19},{x:20,y:26,r:-9,w:17,face:2},{x:71,y:19,r:13,w:17},{x:81,y:43,r:12,w:19,face:4},{x:80,y:78,r:17,w:18},{x:39,y:15,r:-6,w:17},{x:46,y:86,r:8,w:18,face:7}]
 };
 for(const [i,s] of SPREADS.entries()){
  const article=el('article','spread-option');article.dataset.spread=s.id;
  const b=el('button','spread-option-select');b.type='button';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',`Choose ${s.name}, ${s.count} cards`);
  const number=el('span','spread-option-number',String(s.count).padStart(2,'0'));number.setAttribute('aria-hidden','true');
  const copy=el('span','spread-option-copy');copy.append(el('span','eyebrow',s.kicker+(MEMBERSHIP_LIVE?(s.id==='clarity3'?' · Free':' · Membership'):'')),el('h2','',s.name),el('p','',s.description));
  const arrow=el('span','spread-option-arrow','↗');arrow.setAttribute('aria-hidden','true');b.append(number,copy,arrow);
  b.addEventListener('click',()=>chooseDefinition(s.id));article.append(b);$('#spread-options').append(article);
 }
 function showComposition(s,animate=true){
  const art=$('#spread-showcase-art');art.dataset.spread=s.id;art.replaceChildren();
  for(const [i,p] of compositions[s.id].entries()){
   const img=el('img','showcase-card');img.loading='lazy';img.decoding='async';img.src=p.face===undefined?assets.back:assets.cards[previewIds[s.id][p.face]];img.alt='';img.style.cssText=`--cx:${p.x}%;--cy:${p.y}%;--cr:${p.r}deg;--cw:${p.w}%;z-index:${p.face===0?9:i+1}`;art.append(img);
   if(animate&&!reduced())runAnimation(img,[{opacity:0,transform:`translate(-50%,calc(-50% + 28px)) rotate(${p.r-5}deg)`},{opacity:1,transform:`translate(-50%,-50%) rotate(${p.r}deg)`}],{duration:1100,delay:i*65,easing:'cubic-bezier(.18,.72,.2,1)',fill:'backwards'});
  }
  $('#showcase-count').textContent=`${s.count} cards · ${s.goodFor}`;
  $('#showcase-invitation').textContent=spreadEditorial(s.id).invitation;
  $('#preview-current').textContent=copy('Try a sample ↗','Спробувати приклад ↗');
 }
 function chooseDefinition(id){const changed=current!==id;current=id;if(changed)approvedPlan=null;if(questionCoach){questionCoach.element.hidden=id!=='clarity3';if(changed)questionCoach.reset();}$('#spread-paths').hidden=id!=='crossroads5';for(const input of $('#spread-paths').querySelectorAll('input'))input.required=id==='crossroads5';for(const a of document.querySelectorAll('.spread-option')){const checked=a.dataset.spread===id;a.classList.toggle('selected',checked);a.querySelector('button').setAttribute('aria-pressed',String(checked));}$('#begin-spread').textContent=`Begin ${selected().name} ↗`;if(changed)showComposition(selected(),current!==null);updateRecommendation();renderAccess();}
 $('#preview-membership').addEventListener('click',event=>{if(spreadOpen(definition)){event.preventDefault();openQuestionEditor();}});
 $('#preview-current').addEventListener('click',()=>start(selected(),true));
 chooseDefinition(SPREADS[0].id);
 function refreshAccess(){clearTimeout(accessTimer);if(!MEMBERSHIP_LIVE){renderAccess();return;}if(!isSite){access={status:'unavailable',paid:false};renderAccess();return;}access={status:'loading',paid:false};renderAccess();requestId=crypto.randomUUID();parent.postMessage({type:'olivia:subscription:request',requestId},location.origin);accessTimer=setTimeout(()=>{if(access.status==='loading'){access={status:'unavailable',paid:false};renderAccess();}},10000);}
 function renderAccess(){$('#begin-spread').textContent=copy('Choose my cards ↗','Обрати мої карти ↗');const free=spreadOpen(selected()),paid=access.status==='ready'&&access.paid===true;$('#begin-spread').hidden=!(free||paid);$('#spread-access').hidden=false;$('#spread-membership').hidden=free||paid||access.status==='loading';$('#refresh-spread-access').hidden=free||!isSite||access.status==='loading';$('#spread-access').textContent=free?(current==='clarity3'?'Your three-card reading is free. Bring a question, choose each card, and keep what you notice.':'Bring a question, choose each card, and keep what you notice.'):access.status==='loading'?'Checking your membership…':paid?'Your membership includes this guided spread.':access.status==='unavailable'?'Membership cannot be verified here. You can still try an example, or choose the free three-card reading.':'This spread is included with membership. Try an example before deciding.';}

 addEventListener('message',event=>{const data=event.data;if(!isSite||event.source!==parent||event.origin!==location.origin||data?.type!=='olivia:subscription:state'||data.requestId!==requestId||!['loading','ready','unavailable'].includes(data.status))return;access={status:data.status,paid:data.paid===true&&['insight','premium','vip'].includes(data.tier)};if(data.status!=='loading')clearTimeout(accessTimer);renderAccess();});
 $('#refresh-spread-access').addEventListener('click',refreshAccess);refreshAccess();

 const status=message=>{$('#spread-progress').textContent=message;announce(message);};
 function preserve(){if(record&&!isPreview){record={...record,note:$('#spread-reflection').value};drafts.set(record.id,record);}}
 function receiveSpreadGuidance(id,guidance){
  if(record?.id!==id)return;
  record={...record,guidance};drafts.set(id,record);
  let kept;try{kept=loadSpreadRecords(localStorage).find(value=>value.id===id);}catch{}
  // A spread that was never kept is still a first keep; only a kept one is updated.
  const state=guidanceSaveState(kept,guidance);if(!state)return;
  dirty.add(id);unsaved=true;
  $('#spread-save-status').textContent=t('Your personal reading is ready. Save to keep it.');
  setSaveState($('#save-spread'),state,{kind:'spread'});
 }
 function receiveSavedSpreadGuidance(saved){
  if(!saved.spreadId||record?.id!==saved.id)return;
  const note=$('#spread-reflection').value;
  record={...record,note,guidance:saved.guidance};drafts.set(saved.id,record);
  if(note===(saved.note||'')){
   dirty.delete(saved.id);$('#spread-save-status').textContent=t('Kept in your almanac, on this device.');
   setSaveState($('#save-spread'),'saved',{kind:'spread'});
  }else{
   dirty.add(saved.id);$('#spread-save-status').textContent=t('Unsaved reflection.');
   setSaveState($('#save-spread'),'reflection',{kind:'spread'});
  }
  unsaved=dirty.size>0;
 }
 function halt(){generation++;flowGeneration++;playing=false;busy=false;for(const reset of deckResets)reset();root.classList.remove('is-pulling','is-dealing','is-browsing');root.style.removeProperty('--deck-swipe-x');browseStart=null;for(const animation of animations)animation.cancel();animations.clear();$('#reveal-flow').textContent='Watch the reveal';}
 function resetGuidance(){unmountQuestionGuidance($('#spread-synthesis-copy-guidance'));root.dataset.guidanceState='idle';root.dataset.guidanceWaiting='false';}
 function leave(){resetGuidance();closeQuestionEditor();preserve();halt();$('#spread-art-dialog').close();root.hidden=true;}
 function enter(){show('spreads');root.hidden=false;}
 function library(){resetGuidance();closeQuestionEditor();preserve();halt();root.classList.remove('is-choosing');enter();root.setAttribute('aria-labelledby','spreads-title');$('#spread-library').hidden=false;$('#spread-ritual').hidden=true;$('#spreads-title').focus({preventScroll:true});renderAccess();}
 function runAnimation(node,frames,options){if(reduced())return Promise.resolve();const animation=node.animate(frames,options);animations.add(animation);if(document.hidden)animation.pause();return animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));}
 document.addEventListener('visibilitychange',()=>{for(const animation of animations)document.hidden?animation.pause():animation.play();});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reduced())for(const animation of animations)animation.finish();});
 function initBoard(){const board=$('#spread-board');board.replaceChildren();board.dataset.count=definition.count;board.style.setProperty('--spread-count',definition.count);board.dataset.spread=definition.id;board.classList.remove('has-focus');for(const [i,p] of definition.positions.entries()){const pos=definition.layout[i];const slot=el('div','spread-slot');slot.dataset.index=i;slot.style.setProperty('--slot-index',i);slot.style.cssText=`--slot-index:${i};--x:${pos.x*100}%;--y:${pos.y*100}%;--angle:${pos.rotate||0}deg`;const b=el('button','spread-card');b.type='button';b.disabled=true;b.dataset.position=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`${i+1}. ${p.label}. Waiting for a card.`);const rotator=el('span','spread-card-turn');const back=el('img','spread-card-back');back.src=assets.back;back.alt='';const face=el('img','spread-card-face');face.alt='';rotator.append(back,face);b.append(rotator);const label=el('span','spread-slot-label',`${String(i+1).padStart(2,'0')} · ${p.label}`);slot.append(b,label);slot.style.zIndex=String(i+1);b.addEventListener('click',()=>{if(i<session.revealedCount)inspect(i);else if(i===session.revealedCount&&session.cardIds.length===definition.count)revealOne();});board.append(slot);}focusMobileCard(0); }
 const availableSlots=()=>session?session.deck.map((_,i)=>i).filter(i=>!session.selectedSlots.includes(i)):[];
 const fanCount=()=>handheld()?5:$('#spread-deck').clientWidth<600?7:11;
 function focusMobileCard(index){
  mobileCard=index;
  for(const [i,slot] of [...$('#spread-board').children].entries()){
   const distance=Math.max(-2,Math.min(2,i-index));
   slot.dataset.mobileCurrent=String(i===index);slot.style.setProperty('--mobile-distance',distance);
   slot.style.setProperty('--mobile-depth',Math.abs(distance));slot.style.setProperty('--mobile-scale',1-Math.abs(distance)*.065);
   slot.querySelector('button').tabIndex=handheld()&&i!==index?-1:0;
  }
 }
 function browseByHand({phase,dx}){
  if(phase==='start'){browseStart=deckStart;root.classList.add('is-browsing');}
  if(browseStart===null)return;
  const width=parseFloat($('#spread-deck').style.getPropertyValue('--fan-width'))||190;
  const motion=deckBrowseMotion({start:browseStart,dx,step:width*.43,count:availableSlots().length});
  if(phase==='move'){root.style.setProperty('--deck-swipe-x',motion.offset+'px');return;}
  if(phase==='end')deckStart=motion.index;
  if(phase==='end'||phase==='cancel'){
   browseStart=null;root.classList.remove('is-browsing');root.style.removeProperty('--deck-swipe-x');layoutDeck();
  }
 }
 function layoutDeck(){
  if(!session)return;
  const deck=$('#spread-deck'),available=availableSlots(),count=fanCount();
  deckStart=Math.max(0,Math.min(deckStart,available.length-1));
  const narrow=deck.clientWidth<600;
  const phone=handheld(),landscape=phone&&innerWidth>innerHeight;
  const width=phone?Math.min(228,Math.max(landscape?116:166,Math.min(innerWidth*.58,innerHeight*(landscape?.35:.285)))):Math.min(narrow?192:266,Math.max(narrow?154:174,innerHeight*(narrow?.225:.25)));
  const step=width*(phone?.105:.38);
  deck.style.setProperty('--fan-width',width+'px');
  deck.style.setProperty('--fan-height',(width*1.716+(narrow?86:66))+'px');
  for(const b of deck.children){
   const slot=Number(b.dataset.slot),index=available.indexOf(slot),offset=index-deckStart;
   const visibleCard=index>=0&&Math.abs(offset)<=Math.floor(count/2);
   b.hidden=index<0;b.dataset.inView=String(visibleCard);b.dataset.deckCenter=String(offset===0);
   b.disabled=!visibleCard||busy||playing;b.tabIndex=visibleCard&&slot===deckFocus?0:-1;
   if(index<0)continue;
   const angle=Math.max(-18,Math.min(18,offset*(phone?4.4:3.1)));
   b.dataset.angle=angle;b.style.setProperty('--fan-x',Math.max(-8,Math.min(8,offset))*step+'px');
   b.style.setProperty('--fan-y',(phone?Math.min(36,Math.abs(offset)*12):Math.min(120,offset*offset*1.8))+'px');b.style.setProperty('--fan-angle',angle+'deg');
   b.style.setProperty('--fan-depth',Math.min(2,Math.abs(offset)));b.dataset.deckDepth=String(Math.min(2,Math.abs(offset)));
   b.style.setProperty('--fan-order',String(100-Math.abs(offset)*2+(offset>=0?1:0)));
  }
  if(!available.includes(deckFocus)||Math.abs(available.indexOf(deckFocus)-deckStart)>Math.floor(count/2)){
   deckFocus=available[deckStart];const centre=deck.querySelector(`[data-slot="${deckFocus}"]`);if(centre&&!centre.disabled)centre.tabIndex=0;
  }
  $('#deck-previous').disabled=busy||playing||deckStart===0;
  $('#deck-next').disabled=busy||playing||deckStart>=available.length-1;
  $('#deck-position').max=Math.max(0,available.length-1);$('#deck-position').value=deckStart;$('#deck-position').disabled=busy||playing;
  $('#deck-position').setAttribute('aria-valuetext',copy(`Card ${deckStart+1} of ${available.length}`,`Карта ${deckStart+1} із ${available.length}`));
  $('#deck-browse-status').textContent=phone?copy(`${deckStart+1} of ${available.length}`,`${deckStart+1} із ${available.length}`):copy(`${available.length} cards · move through the deck`,`${available.length} карт · переглядайте колоду`);
  $('#deck-browse-hint').textContent=phone?copy('Swipe to explore. Pull up or tap to choose.','Гортайте. Потягніть угору або торкніться карти.'):copy('Pull upwards to choose. A tap works, too.','Потягніть угору, щоб обрати. Або торкніться карти.');
 }
 function browseDeck(direction){
  if(busy||playing||root.classList.contains('is-pulling'))return;
  deckStart+=direction*(handheld()?1:3);layoutDeck();
 }
 function focusDeck(slot){
  const available=availableSlots(),index=available.indexOf(slot);
  if(index<0)return;
  deckStart=index;deckFocus=slot;layoutDeck();$(`#spread-deck [data-slot="${slot}"]`).focus({preventScroll:true});
 }
 function buildDeck(){
  const deck=$('#spread-deck');for(const reset of deckResets)reset();deckResets.length=0;deck.replaceChildren();deckStart=Math.floor(availableSlots().length/2);deckFocus=availableSlots()[deckStart];
  root.classList.toggle('spread-reduced',reduced());
  for(let slot=0;slot<session.deck.length;slot++){
   const b=el('button','spread-deck-card');b.type='button';b.dataset.slot=slot;
   b.setAttribute('aria-label',`Choose card ${slot+1} for the spread`);b.setAttribute('aria-describedby','deck-browse-hint');
   const image=el('img');image.src=assets.back;image.alt='';b.append(image);
   deckResets.push(bindDeckGesture(b,{reduced,enabled:()=>!busy&&!playing&&!b.hidden&&!b.disabled,canBrowse:handheld,onBrowse:browseByHand,choose:keyboard=>dealOne(slot,keyboard),onPull:progress=>{root.classList.toggle('is-pulling',progress>0);root.style.setProperty('--pull-progress',progress);}}));
   b.addEventListener('focus',()=>{deckFocus=slot;for(const other of deck.children)other.tabIndex=other===b?0:-1;});
   b.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();if(busy||playing)return;
    const available=availableSlots(),index=available.indexOf(slot);
    const next=event.key==='Home'?0:event.key==='End'?available.length-1:Math.max(0,Math.min(available.length-1,index+(event.key==='ArrowRight'?1:-1)));
    focusDeck(available[next]);
   });deck.append(b);
  }layoutDeck();
 }
 const deckNavigation=el('div','deck-navigation');
 deckNavigation.innerHTML=`<button class="quiet-link" id="deck-previous" aria-label="Previous cards in the deck">←</button><div class="deck-position-control"><input type="range" id="deck-position" min="0" max="77" value="38" step="1" aria-label="${copy('Move through the deck','Переглянути колоду')}"><span id="deck-browse-status"></span></div><button class="quiet-link" id="deck-next" aria-label="Next cards in the deck">→</button>`;
 $('#spread-deck').after(deckNavigation);
 const deckHint=el('p','deck-browse-hint',copy('Pull upwards to choose. A tap works, too.','Потягніть угору, щоб обрати. Або торкніться карти.'));deckHint.id='deck-browse-hint';deckNavigation.after(deckHint);const dock=el('div','deck-dock');$('#spread-deck').after(dock);dock.append(deckHint,deckNavigation,$('#deal-spread'));
 $('#deck-position').addEventListener('input',event=>{if(busy||playing||root.classList.contains('is-pulling'))return;deckStart=Number(event.target.value);layoutDeck();});
 $('#deck-previous').addEventListener('click',()=>browseDeck(-1));$('#deck-next').addEventListener('click',()=>browseDeck(1));
 new ResizeObserver(()=>{if($('#spread-deck').clientWidth)layoutDeck();}).observe($('#spread-deck'));
 handheldQuery.addEventListener('change',()=>{adaptRitualHeader();for(const reset of deckResets)reset();focusMobileCard(mobileCard);if(session&&!$('#spread-ritual').hidden)controls();});
 function prepareView(){resetGuidance();syncSupportNote($('.spread-ritual-head'),isPreview?'':session.question,getLocale());root.dataset.guidanceWaiting=String(guidanceConsents.has(session.id)&&!!session.question?.trim());closeQuestionEditor();mountQuestionPlan(planHost,session.readingPlan,getLocale());gathered=!!record;$('.deck-question-disclosure').open=!handheld()&&(gathered||!isPreview);$('.deck-question-disclosure summary').textContent=isPreview?copy('Sample question','Приклад запитання'):copy('Your question','Ваше запитання');enter();$('.spread-workspace').dataset.count=definition.count;$('.spread-workspace').dataset.phase=gathered?'dealt':'choosing';root.classList.toggle('is-choosing',!gathered);stageIntro.hidden=gathered;root.setAttribute('aria-labelledby','spread-ritual-title');$('#spread-library').hidden=true;$('#spread-ritual').hidden=false;$('#spread-synthesis').hidden=true;synthesisIndex=0;detailOpen.clear();$('#spread-card-nav').hidden=true;$('#spread-kind').textContent=isPreview?'Interactive preview · Full 78-card deck':`${definition.count} cards · Your guided reading`;$('#spread-ritual-title').textContent=definition.name;$('.spread-ritual-head .reading-steps')?.remove();$('.spread-ritual-head').prepend(readingSteps(1,getLocale()));$('#spread-held-question').textContent=session.question?`“${session.question}”`:'An open reading';$('#spread-together-title').innerHTML='Read <em>together.</em>';$('#spread-reflection').value=record?.note||'';$('#spread-save-section .reading-notes').open=!!record?.note;$('#spread-save-status').textContent='';setSaveState($('#save-spread'),'keep',{kind:'spread'});$('#spread-save-section').hidden=isPreview;$('#spread-preview-cta').hidden=!isPreview;$('#spread-preview-cta p').textContent=definition.id==='clarity3'?'You can bring your own question and keep a complete three-card reading for free.':spreadOpen(definition)?'You chose these cards around an example question. Bring your own question to this spread and keep your reading.':'You chose these cards around an example question. Membership lets you bring your own question to this deeper spread.';$('#preview-membership').textContent=definition.id==='clarity3'?'Begin your free three-card reading ↗':spreadOpen(definition)?'Ask your own question ↗':'Explore membership ↗';$('#preview-membership').href=spreadOpen(definition)?'#spreads':'#membership';$('#spread-ritual-title').focus({preventScroll:true});initBoard();buildDeck();controls();initialCopy();}
 function start(s,preview,options={}){
  if(!preview&&!spreadOpen(s)&&!(access.status==='ready'&&access.paid)){renderAccess();return;}
  const intention=options.intention??new FormData($('#spread-question-form')).get('spread-intention');
  const question=options.plan?.question??(preview?(s.id==='crossroads5'?previewQuestion+'\n'+t('Path A: make the change. Path B: stay and reshape the current situation.'):previewQuestion):s.id==='crossroads5'?[$('#spread-question').value,t('Path A')+': '+$('#spread-path-a').value,t('Path B')+': '+$('#spread-path-b').value].filter(Boolean).join('\n'):$('#spread-question').value);
  if(question.length>QUESTION_LIMIT)throw new TypeError(getLocale()==='uk'?'Скоротіть запитання й назви шляхів до 1 600 символів разом.':'Keep your question and path names within 1,600 characters in total.');
  const next=createSpreadSession({question,intention:preview?'change':intention,spreadId:s.id,count:s.count,reversals:!preview&&(options.reversals??$('#spread-reversals').checked),...(options.plan?{readingPlan:options.plan}:{})});
  guidanceConsent=!preview&&(options.guidanceConsent??spreadConsentChoice.getConsent());if(guidanceConsent)guidanceConsents.add(next.id);spreadConsentChoice.reset();
  if(!preview)questionSetup={question:s.id==='crossroads5'?$('#spread-question').value:next.question,pathA:$('#spread-path-a').value,pathB:$('#spread-path-b').value};
  preserve();halt();if(session&&!record){dirty.delete(session.id);unsaved=dirty.size>0;}firstImpressions=[];impressionSeen.clear();definition=s;chooseDefinition(s.id);isPreview=preview;record=null;active=-1;session=next;reading=null;history.replaceState(null,'','#spreads');prepareView();status(preview?`Choose ${s.count} cards for this example question. The deck waits for you.`:`Choose ${s.count} cards, one at a time, or let the deck choose.`);
 }
 function startPlan(value,{intention='open',reversals=false,guidanceConsent=false}={}){
  const plan=validateQuestionPlan(value),spread=applyQuestionPlan(SPREADS.find(item=>item.id===plan.spreadId),plan);
  return start(spread,false,{plan,intention,reversals,guidanceConsent});
 }
 function currentReading(){
  const value=localizeSpreadReading(buildSpreadReading(definition,session.cardIds,session.intention,session.orientations),definition);
  if(!definition.readingPlan)return value;
  return {...value,cards:value.cards.map((card,index)=>({...card,label:definition.positions[index].label,prompt:definition.positions[index].prompt}))};
 }
 const coachHost=el('div');$('#spread-access').before(coachHost);
 questionCoach=initQuestionCoach({container:coachHost,input:$('#spread-question'),locale:getLocale(),onApprove:plan=>{ $('#spread-question').value=plan.question;approvedPlan=plan;questionCoach.close();recommendation.querySelector('h3').textContent=plan.spreadName||copy('Your three-card reading','Ваш розклад із трьох карт');recommendation.querySelector('p:not(.eyebrow)').textContent=plan.positions.map(p=>p.label).join(' · ');renderAccess();$('#begin-spread').focus({preventScroll:true});},onSkip:()=>{renderAccess();$('#begin-spread').focus({preventScroll:true});}});
 questionCoach.element.addEventListener('toggle',renderAccess);
 const planHost=el('div');$('#spread-held-question').after(planHost);
 $('#spread-question-form').addEventListener('submit',e=>{e.preventDefault();try{if(current==='clarity3'&&approvedPlan?.question===$('#spread-question').value.trim())startPlan(approvedPlan,{intention:new FormData(e.currentTarget).get('spread-intention'),reversals:$('#spread-reversals').checked,guidanceConsent:spreadConsentChoice.getConsent()});else start(selected(),false);}catch(error){$('#spread-access').textContent=error instanceof TypeError?error.message:t('The deck could not be opened. Please try again.');}});
 function initialCopy(){
  const container=$('#spread-position-copy'),editorial=definition.questionEditorial||spreadEditorial(definition.id);
  container.replaceChildren(el('p','eyebrow','Take a moment'),el('h2','',editorial.gesture),el('p','spread-invitation',editorial.invitation));
  const list=el('ol','spread-role-list');for(const p of definition.positions)list.append(el('li','',p.label));const structure=el('details','spread-deeper spread-structure');structure.append(el('summary','',`${definition.count} positions, each with a purpose`),list);container.append(structure,el('p','spread-reading-hint','Choose your cards from the deck. They stay face down until you are ready to turn them.'));
 }
 function controls(){if(!session)return;root.dataset.revealed=String(session.revealedCount);questionAction.hidden=!!record||(!isPreview&&session.cardIds.length>0);questionAction.disabled=busy||playing;questionAction.textContent=isPreview?copy('Ask your own question ↗','Поставити своє запитання ↗'):copy('Edit your question','Змінити запитання');const full=session.cardIds.length===definition.count,ready=full&&!!reading,complete=session.revealedCount===definition.count;$('.spread-ritual-head .reading-steps')?.replaceWith(readingSteps(full?2:1,getLocale()));$('.spread-workspace').dataset.phase=gathered?'dealt':'choosing';root.classList.toggle('is-choosing',!gathered);stageIntro.hidden=gathered;$('#spread-deck-area').hidden=gathered;$('#spread-table-hint').hidden=!gathered||complete;$('.spread-controls').hidden=complete&&!busy;$('#reveal-next').hidden=!ready||complete;$('#reveal-next').disabled=busy||playing;$('#reveal-next').textContent=handheld()?copy(`Reveal ${session.revealedCount?'next':'first'} card · ${Math.min(session.revealedCount+1,definition.count)} / ${definition.count} ↗`,`Відкрити ${session.revealedCount?'наступну':'першу'} карту · ${Math.min(session.revealedCount+1,definition.count)} / ${definition.count} ↗`):session.revealedCount?`Reveal ${definition.positions[session.revealedCount]?.label||'next card'} ↗`:'Reveal the first card ↗';$('#reveal-flow').hidden=!ready||complete;$('#reveal-flow').disabled=busy&&!playing;$('#reveal-skip').hidden=!ready||complete;$('#show-synthesis').hidden=!complete||busy;$('#show-synthesis').className='solid-action';$('#show-synthesis').textContent=copy('Your complete reading ↓','Ваше повне читання ↓');$('#deal-spread').disabled=busy||playing;const artLook=$('.art-look');if(artLook)artLook.disabled=busy;$('#inspect-previous').disabled=busy||playing||active<=0;$('#inspect-next').disabled=busy||playing||active>=session.revealedCount-1;$('#spread-pick-label').textContent=full?'':handheld()?copy(`CHOOSE CARD ${String(session.cardIds.length+1).padStart(2,'0')} / ${String(definition.count).padStart(2,'0')}`,`ОБЕРІТЬ КАРТУ ${String(session.cardIds.length+1).padStart(2,'0')} / ${String(definition.count).padStart(2,'0')}`):`${session.cardIds.length} of ${definition.count} chosen · ${definition.positions[session.cardIds.length].label}`;mobilePosition.textContent=full?'':t(definition.positions[session.cardIds.length].label);layoutDeck();for(const [i,slot] of [...$('#spread-board').children].entries()){slot.classList.toggle('is-next',ready&&!complete&&i===session.revealedCount);slot.querySelector('button').disabled=!ready||busy||playing||(!full&&i>=session.revealedCount)||i>session.revealedCount;} }
 async function dealOne(slot,keyboard=false){
  if(busy)return;
  if(session.cardIds.length>=definition.count||session.selectedSlots.includes(slot)||!Number.isInteger(slot)||slot<0||slot>=session.deck.length)return;
  const token=generation,index=session.cardIds.length,available=availableSlots(),sourceIndex=available.indexOf(slot);
  if(Math.abs(sourceIndex-deckStart)>Math.floor(fanCount()/2)){deckStart=sourceIndex;layoutDeck();}
  const source=$(`#spread-deck [data-slot="${slot}"]`),surface=source.querySelector('img'),from=surface.getBoundingClientRect(),fromWidth=surface.offsetWidth;
  const matrix=new DOMMatrixReadOnly(getComputedStyle(source).transform),surfaceMatrix=new DOMMatrixReadOnly(getComputedStyle(surface).transform),fromAngle=(Math.atan2(matrix.b,matrix.a)+Math.atan2(surfaceMatrix.b,surfaceMatrix.a))*180/Math.PI;
  busy=true;questionAction.disabled=true;session=selectSpreadCard(session,slot);
  const target=$('#spread-board').children[index],card=target.querySelector('.spread-card');
  target.classList.add('dealt');card.setAttribute('aria-label',`${index+1}. ${definition.positions[index].label}. Reveal card.`);
  card.querySelector('.spread-card-face').src=assets.cards[session.cardIds[index]];card.querySelector('.spread-card-face').dataset.orientation=session.orientations?.[index]||'upright';
  const to=card.getBoundingClientRect();source.hidden=true;for(const b of $('#spread-deck').children)b.disabled=true;$('#deck-position').disabled=true;$('#deal-spread').disabled=true;$('#deck-previous').disabled=true;$('#deck-next').disabled=true;target.classList.add('is-arriving');root.classList.add('is-dealing');status(`${index+1} of ${definition.count} · ${definition.positions[index].label}`);
  const flight=dealMotion({spreadId:definition.id,index,from,to,fromWidth,toWidth:card.offsetWidth,fromAngle,angle:0,handheld:handheld()});
  await runAnimation(card,flight.frames,flight.options);
  if(token!==generation)return;
  target.classList.remove('is-arriving');root.classList.remove('is-dealing');
  if(session.cardIds.length===definition.count){await openSpreadTable(token);if(token!==generation)return;reading=currentReading();status((definition.questionEditorial||spreadEditorial(definition.id)).arrival);}
  busy=false;
  controls();
  if(keyboard){if(reading)$('#spread-board .spread-card').focus({preventScroll:true});else focusDeck(availableSlots()[Math.min(sourceIndex,availableSlots().length-1)]);}
 }
 async function openSpreadTable(token){
  const slots=[...$('#spread-board').children],before=slots.map(slot=>{
   const card=slot.querySelector('.spread-card'),m=new DOMMatrixReadOnly(getComputedStyle(slot).transform);
   return {rect:card.getBoundingClientRect(),width:card.offsetWidth,angle:Math.atan2(m.b,m.a)*180/Math.PI};
  });
  gathered=true;$('.deck-question-disclosure').open=!handheld();controls();
  const flights=slots.map((slot,i)=>{
   const card=slot.querySelector('.spread-card'),to=card.getBoundingClientRect(),from=before[i],m=new DOMMatrixReadOnly(getComputedStyle(slot).transform),angle=Math.atan2(m.b,m.a),x=from.rect.x+from.rect.width/2-to.x-to.width/2,y=from.rect.y+from.rect.height/2-to.y-to.height/2;
   const dx=x*Math.cos(angle)+y*Math.sin(angle),dy=-x*Math.sin(angle)+y*Math.cos(angle),scale=from.width/card.offsetWidth;
   return runAnimation(card,[{transform:`translate(${dx}px,${dy}px) rotate(${from.angle-angle*180/Math.PI}deg) scale(${scale})`},{transform:'none'}],{duration:handheld()?720:1050,delay:handheld()?0:i*42,fill:'backwards',easing:'cubic-bezier(.22,.72,.18,1)'});
  });
  await Promise.all(flights);if(token!==generation)return;
  $('#spread-board').scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
  const hint=$('.spread-reading-hint');if(hint)hint.textContent='Your cards are here. Turn one when you are ready, then take a moment with what it shows you.';
 }
 async function dealSequence(keyboard=false){if(busy||playing)return;playing=true;const token=generation;while(session.cardIds.length<definition.count&&token===generation){const available=availableSlots();const slot=available[Math.min(deckStart,available.length-1)];await dealOne(slot);}if(token!==generation)return;playing=false;controls();if(keyboard)$('#spread-board .spread-card').focus({preventScroll:true});}
 $('#deal-spread').addEventListener('click',event=>dealSequence(event.detail===0));
 function inspect(index){
  if(index<0||index>=session.revealedCount)return;
  const old=active;active=index;focusMobileCard(index);$('#spread-board').classList.add('has-focus');
  for(const [i,slot] of [...$('#spread-board').children].entries()){slot.classList.toggle('active',i===index);slot.style.zIndex=String(i===index?30:i+1);slot.querySelector('button').setAttribute('aria-pressed',String(i===index));}
  const c=reading.cards[index],p=definition.positions[index],box=$('#spread-position-copy'),editorial={line:localizeEditorialLine(c.cardId,p.id,cardEditorial(c.cardId,p.id).line)};if(c.orientation==='reversed')editorial.line=c.meaning;
  box.replaceChildren(el('p','eyebrow',`${String(index+1).padStart(2,'0')} / ${p.label}`),el('h2','',names[c.cardId]+(c.orientation==='reversed'?' · Reversed':'')),el('p','spread-card-lead',editorial.line));
  const prompt=el('div','reflection-prompt');prompt.append(el('span','eyebrow','A question to sit with'),el('p','',definition.readingPlan?p.prompt:localizePositionPrompt(p.id,p.prompt)));box.append(prompt);
  const details=el('details','spread-deeper'),summary=el('summary','','Explore the meaning');details.open=detailOpen.has(index);details.append(summary,el('p','',c.meaning),el('p','',c.prompt),el('p','spread-practice',c.practice));details.addEventListener('toggle',()=>{if(details.open)detailOpen.add(index);else detailOpen.delete(index);});box.append(details);
  const entry=firstImpressions.find(v=>v.cardId===c.cardId);
  if(entry){const holder=el('details','reading-observation');holder.append(el('summary','',copy('Your first impression','Ваш перший погляд')));box.append(holder);mountFirstImpression(holder,{cardId:c.cardId,entry,locale:getLocale()});}
  const look=el('button','quiet-link art-look','Look closely at the artwork ↗');look.addEventListener('click',openArt);box.append(look);
  $('#spread-card-nav').hidden=false;$('#inspect-previous').disabled=index===0;$('#inspect-next').disabled=index>=session.revealedCount-1;$('#inspect-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(definition.count).padStart(2,'0')}`;
  if(old!==index)runAnimation(box,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
 function openArt(){if(busy||active<0||!reading)return;if(playing){playing=false;flowGeneration++;$('#reveal-flow').textContent='Continue the reveal';controls();}const c=reading.cards[active];$('#spread-detail-image').src=assets.cards[c.cardId];$('#spread-detail-image').dataset.orientation=c.orientation||'upright';$('#spread-detail-image').alt=names[c.cardId]+' — Olivia Arcana';$('#spread-art-title').textContent=names[c.cardId];$('#spread-art-position').textContent=definition.positions[active].label;$('#spread-art-line').textContent=(c.orientation==='reversed'?c.meaning:localizeEditorialLine(c.cardId,c.positionId,cardEditorial(c.cardId,c.positionId).line));$('#spread-art-line').hidden=root.dataset.guidanceWaiting==='true'||root.dataset.guidanceState==='pending';$('#spread-art-dialog').showModal();}
 $('#close-spread-art').addEventListener('click',()=>$('#spread-art-dialog').close());
 $('#spread-art-dialog').addEventListener('click',e=>{if(e.target===$('#spread-art-dialog'))$('#spread-art-dialog').close();});
 $('#inspect-previous').addEventListener('click',()=>{if(!busy&&!playing)inspect(active-1);});$('#inspect-next').addEventListener('click',()=>{if(!busy&&!playing)inspect(active+1);});
 function renderRevealed(index,pose='none'){
  const slot=$('#spread-board').children[index],b=slot.querySelector('button');slot.classList.add('revealed');
  b.setAttribute('aria-label',`${index+1}. ${definition.positions[index].label}: ${names[session.cardIds[index]]}. Explore this card.`);
  b.querySelector('.spread-card-face').alt=names[session.cardIds[index]];b.querySelector('.spread-card-face').dataset.orientation=reading.cards[index].orientation||'upright';b.querySelector('.spread-card-turn').style.transform=pose;
 }
 async function revealOne(){
  if(busy||session.revealedCount>=definition.count)return;
  const token=generation,index=session.revealedCount,previousMobileCard=mobileCard;busy=true;focusMobileCard(index);controls();
  const slot=$('#spread-board').children[index],turn=slot.querySelector('.spread-card-turn'),face=slot.querySelector('.spread-card-face');
  // Decode before rotating: the front is ready at the exact edge-on change.
  try{await face.decode();}catch{}
  if(token!==generation)return;
  if(handheld()&&previousMobileCard!==index){await runAnimation(slot,[{opacity:1},{opacity:1}],{duration:420});if(token!==generation)return;}
  const turning=revealMotion({spreadId:definition.id,index,handheld:handheld()});
  turn.style.transform=turning.close.at(-1).transform;
  await runAnimation(turn,turning.close,turning.options);
  if(token!==generation)return;
  session=revealNext(session);renderRevealed(index,turning.open[0].transform);
  await runAnimation(turn,turning.open,turning.options);
  if(token!==generation)return;
  turn.style.transform='none';busy=false;inspect(index);
  status(`${index+1} of ${definition.count} revealed · ${definition.positions[index].label}: ${names[session.cardIds[index]]}`);
  if(session.revealedCount===definition.count)complete();controls();
 }
 async function flow(){if(playing){playing=false;flowGeneration++;$('#reveal-flow').textContent='Continue the reveal';controls();return;}if(busy)return;playing=true;const playback=++flowGeneration;$('#reveal-flow').textContent='Pause the reveal';const token=generation;while(playing&&session.revealedCount<definition.count&&token===generation&&playback===flowGeneration){await revealOne();if(token!==generation||playback!==flowGeneration)return;if(playing&&session.revealedCount<definition.count)await runAnimation($('#spread-progress'),[{opacity:1},{opacity:1}],{duration:holdDuration(definition.id,session.revealedCount-1)});if(token!==generation||playback!==flowGeneration)return;}if(token!==generation||playback!==flowGeneration)return;playing=false;$('#reveal-flow').textContent='Watch the reveal';controls();}
 $('#reveal-next').addEventListener('click',revealOne);$('#reveal-flow').addEventListener('click',flow);
 $('#reveal-skip').addEventListener('click',()=>{halt();session=revealAll(session);session.cardIds.forEach((_,i)=>renderRevealed(i));inspect(session.revealedCount-1);complete();controls();status('All cards revealed. Explore each position or read them together.');});
 $('.spread-synthesis-title').append($('#spread-connections'));
 const spreadReference=createReadingReference({nodes:[$('#spread-paragraphs'),$('.synthesis-reflection')],label:copy('Explore the card meanings & connections','Дослідити значення та зв’язки карт')});
 const chapterTitles=()=>reading.synthesis.paragraphs.map((_,i)=>(definition.questionEditorial||spreadEditorial(definition.id)).chapters[i]||'Another connection');
 const connectionGroups={clarity3:[[0,1],[0,1,2]],crossroads5:[[0],[1,2],[3,4]],compass8:[[0,1],[2,3],[4,5],[6,7]]};
 function renderConnection(index){
  if(index<0||index>=reading.synthesis.paragraphs.length)return;
  synthesisIndex=index;const chapters=chapterTitles(),group=session.cardIds.map((_,index)=>index);
  const art=$('#spread-connections');art.replaceChildren();for(const [i,n] of group.entries()){const figure=el('figure'),img=el('img');img.src=assets.cards[session.cardIds[n]];img.alt='';if(reading.cards[n].orientation==='reversed')img.style.rotate='180deg';figure.style.setProperty('--lean',(i-(group.length-1)/2)*7+'deg');figure.append(img,el('figcaption','',definition.positions[n].label));art.append(figure);}
  const box=$('#spread-paragraphs');box.replaceChildren(el('p','eyebrow',`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`),el('h3','',chapters[index]),el('p','',reading.synthesis.paragraphs[index]));
  box.querySelector('h3').tabIndex=-1;
  for(const [i,b] of [...$('#synthesis-tabs').children].entries())b.setAttribute('aria-current',i===index?'step':'false');
  $('#synthesis-next').hidden=index===chapters.length-1;
  // The reflection is always available; chapters let the reader control the pace.
  runAnimation(box,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:500,easing:'ease-out'});
 }
 function complete(){
  if(!record&&!isPreview){record={...createSpreadRecord(session,definition,reading),firstImpressions:[...firstImpressions]};drafts.set(record.id,record);}
  const nav=$('#synthesis-tabs');nav.replaceChildren();nav.hidden=true;$('#synthesis-next').hidden=true;
  renderConnection(0);$('#synthesis-next').hidden=true;
  const paragraphs=$('#spread-paragraphs');paragraphs.replaceChildren();
  for(const [i,value] of reading.synthesis.paragraphs.entries()){const section=el('section','reading-connection');section.append(el('h3','',chapterTitles()[i]),el('p','',value));paragraphs.append(section);}
  $('#spread-synthesis').hidden=false;
  spreadReference.setState('idle');root.dataset.guidanceState='idle';
  const completedId=record?.id,completedGeneration=generation;
  function guidanceState(state,{focused=false}={}){
   if(record?.id!==completedId||generation!==completedGeneration)return;
   const wasPending=root.dataset.guidanceState==='pending';
   spreadReference.setState(state);root.dataset.guidanceState=state;
   if(state==='ready'||state==='error'||state==='idle'){
    root.dataset.guidanceWaiting='false';
    if(wasPending&&focused&&!root.hidden)$('#spread-synthesis').scrollIntoView({behavior:'instant',block:'start'});
   }
   if(state==='pending'&&!wasPending&&!root.hidden){
    $('#spread-art-dialog').close();
    requestAnimationFrame(()=>{
     if(root.hidden||record?.id!==completedId||generation!==completedGeneration||root.dataset.guidanceState!=='pending')return;
     $('#spread-synthesis').scrollIntoView({behavior:'instant',block:'start'});
     $('#spread-synthesis .reading-loader')?.focus({preventScroll:true});
    });
   }
  }
  onComplete(isPreview?null:record,{guidanceConsent:!isPreview&&guidanceConsents.delete(record?.id),onGuidanceState:guidanceState,onGuidanceResult:guidance=>receiveSpreadGuidance(completedId,guidance)});
  $('#spread-takeaway').textContent=reading.synthesis.prompt;$('#spread-synthesis-question').textContent=session.question?`“${session.question}”`:'An open reading';
 }
 $('#synthesis-next').addEventListener('click',()=>{renderConnection(synthesisIndex+1);$('#spread-paragraphs h3').focus({preventScroll:true});});
 $('#show-synthesis').addEventListener('click',()=>{$('#spread-synthesis').hidden=false;$('#spread-synthesis').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});$('#spread-together-title').focus({preventScroll:true});});
 $('#spread-reflection').addEventListener('input',()=>{if(record&&!isPreview){dirty.add(record.id);unsaved=true;$('#spread-save-status').textContent='Unsaved reflection.';setSaveState($('#save-spread'),$('#save-spread').dataset.saveState==='keep'?'keep':'reflection',{kind:'spread'});}});
 const notifyJournal=()=>dispatchEvent(new Event('olivia:journal-change'));
 $('#save-spread').addEventListener('click',()=>{if(!record||isPreview)return;preserve();try{record={...record,updatedAt:new Date().toISOString()};saveSpreadRecord(localStorage,record);drafts.set(record.id,record);dirty.delete(record.id);unsaved=dirty.size>0;$('#spread-save-status').textContent='Kept in your almanac, on this device.';setSaveState($('#save-spread'),'saved',{kind:'spread'});notifyJournal();}catch(error){$('#spread-save-status').textContent=error.message||'This spread could not be saved. Download a copy to keep it.';}});
 function download(filename,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=el('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('#download-spread').addEventListener('click',()=>{if(!record||isPreview)return;preserve();download('olivia-spread.json',exportSpreadRecords([record]));});
 for(const id of ['#leave-spread','#another-spread'])$(id).addEventListener('click',library);
 function restore(saved){guidanceConsent=false;guidanceConsents.delete(saved.id);preserve();halt();record=drafts.get(saved.id)||saved;firstImpressions=[...(record.firstImpressions||[])];impressionSeen.clear();const base=SPREADS.find(s=>s.id===record.spreadId);if(!base)return;definition=record.readingPlan?applyQuestionPlan(base,record.readingPlan):{...base,positions:base.positions.map((position,index)=>({...position,label:record.cards[index].label}))};isPreview=false;session={...record,count:record.cardIds.length,selectedSlots:[],deck:[]};reading=localizeSpreadReading({cards:record.cards,synthesis:record.synthesis},definition);if(record.readingPlan)reading={...reading,cards:reading.cards.map((card,index)=>({...card,label:definition.positions[index].label,prompt:definition.positions[index].prompt}))};history.replaceState(null,'','#spreads');prepareView();session.cardIds.forEach((id,i)=>{const slot=$('#spread-board').children[i];slot.classList.add('dealt');slot.querySelector('.spread-card-face').src=assets.cards[id];renderRevealed(i);});complete();inspect(0);controls();status('Your saved spread. The original cards and positions are unchanged.');let kept=false;try{kept=loadSpreadRecords(localStorage).some(value=>value.id===record.id);}catch{}if(dirty.has(record.id)){$('#spread-save-status').textContent=t('Unsaved changes. Save to keep them.');setSaveState($('#save-spread'),kept?'update':'keep',{kind:'spread'});}else if(kept)setSaveState($('#save-spread'),'saved',{kind:'spread'});}
 function renderJournal(){const journal=$('#journal-list');$('#spread-journal-section')?.remove();const section=el('section','spread-journal-section');section.id='spread-journal-section';section.append(el('p','eyebrow','Your guided spreads'));const msg=el('p','spread-journal-message');section.append(msg);let records;try{records=loadSpreadRecords(localStorage);}catch(error){msg.textContent=error.message;journal.after(section);return;}const savedIds=new Set(records.map(r=>r.id)),merged=new Map(records.map(r=>[r.id,r]));for(const [id,draft]of drafts)if(!merged.has(id)||dirty.has(id))merged.set(id,draft);records=[...merged.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));if(journal.querySelector('.empty-journal'))journal.querySelector('.empty-journal').hidden=records.length>0;$('#export-journal').disabled=false;/* A backup may contain question observations even after its last reading is removed. */if(!records.length){section.append(el('p','spread-empty','A fuller reading can have a place here, too.'));const link=el('a','text-action','Explore guided spreads ↗');link.href='#spreads';section.append(link);}for(const r of records){const row=el('div','journal-entry'),button=el('button','journal-row');button.type='button';const image=el('img');image.src=assets.cards[r.cardIds[0]];image.alt='';const info=el('div');info.append(el('time','',new Date(r.createdAt).toLocaleDateString(getLocale()==='uk'?'uk-UA':undefined,{day:'numeric',month:'long',year:'numeric'})+(!savedIds.has(r.id)?' · Unsaved draft':dirty.has(r.id)?' · Unsaved changes':'')),el('h2','',`${r.spreadName} · ${r.cardIds.length} cards`),el('p','',r.question||r.note||'An open reading'));button.append(image,info,el('span','','↗'));button.addEventListener('click',()=>restore(r));row.append(button);const remove=el('button','quiet-link remove-entry','Remove');remove.type='button';remove.setAttribute('aria-label',`Remove ${r.spreadName} spread`);remove.addEventListener('click',()=>{try{const practiceData=removePractice('spread',r.id,r);if(record?.id===r.id){record=null;session=null;reading=null;active=-1;}drafts.delete(r.id);dirty.delete(r.id);unsaved=dirty.size>0;notifyJournal();renderJournal();const message=$('#spread-journal-section .spread-journal-message');message.textContent='Spread removed. ';const undo=el('button','quiet-link','Undo');undo.addEventListener('click',()=>{try{restorePractice(practiceData);notifyJournal();renderJournal();}catch(error){message.textContent=error.message;}});message.append(undo);}catch(error){msg.textContent=error.message;}});row.append(remove);section.append(row);}if(records.length){const exp=el('button','text-action','Download my spreads ↓');exp.addEventListener('click',()=>download('olivia-spreads.json',exportSpreadRecords(records)));section.append(exp);}journal.after(section);}
 addEventListener('storage',()=>{for(const id of drafts.keys())if(!dirty.has(id))drafts.delete(id);if(document.body.dataset.view==='journal')renderJournal();});
 addEventListener('olivia:practice-save',event=>{if(event.detail.kind!=='spread')return;record=event.detail.record;drafts.set(record.id,record);dirty.delete(record.id);unsaved=dirty.size>0;$('#spread-save-status').textContent='Kept in your almanac, on this device.';setSaveState($('#save-spread'),'saved',{kind:'spread'});});
 addEventListener('beforeunload',e=>{if(unsaved){e.preventDefault();e.returnValue='';}});
addEventListener('olivia:guidance-save',event=>receiveSavedSpreadGuidance(event.detail));
 $('#spread-question-form a[href="#question"]').addEventListener('click',event=>{event.preventDefault();const options={question:$('#spread-question').value,intention:new FormData($('#spread-question-form')).get('spread-intention'),reversals:$('#spread-reversals').checked,guidanceConsent:spreadConsentChoice.getConsent()};spreadConsentChoice.reset();onSingleQuestion(options);});
 function prepareQuestion({question='',intention='open',reversals=false,guidanceConsent=false}={}){library();$('#spread-question').value=question;for(const input of $('#spread-question-form').querySelectorAll('[name="spread-intention"]'))input.checked=input.value===intention;$('#spread-reversals').checked=reversals;spreadConsentChoice.setConsent(guidanceConsent);otherSpreads.open=true;history.replaceState(null,'','#spreads');$('#spread-question').focus({preventScroll:true});}
 function startPersonal({question='',intention='open',reversals=false,guidanceConsent=false}={}){chooseDefinition('clarity3');$('#spread-question').value=question;for(const input of $('#spread-question-form').querySelectorAll('[name="spread-intention"]'))input.checked=input.value===intention;$('#spread-reversals').checked=reversals;return start(SPREADS.find(s=>s.id==='clarity3'),false,{intention,reversals,guidanceConsent});}
 return {leave,library,startPlan,startPersonal,prepareQuestion,renderJournal,getRecord(id){return record?.id===id?record:drafts.get(id);},exportJournal(){const all=new Map(loadSpreadRecords(localStorage).map(r=>[r.id,r]));for(const [id,r]of drafts)if(!all.has(id)||dirty.has(id))all.set(id,r);return JSON.parse(exportSpreadRecords([...all.values()]));},open(id){if(SPREADS.some(s=>s.id===id))chooseDefinition(id);library();},restore};
}
