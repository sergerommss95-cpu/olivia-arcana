import {bindDeckGesture} from './deck-gesture.js';
import {SPREADS,buildSpreadReading} from './spread-content.js';
import {dealMotion,revealMotion,holdDuration} from './spread-motion.js';
import {spreadEditorial,cardEditorial} from './spread-editorial.js';
import {createSpreadSession,selectSpreadCard,revealNext,revealAll,createSpreadRecord,loadSpreadRecords,saveSpreadRecord,removeSpreadRecord,exportSpreadRecords} from './spread-core.js';

/** The spread ritual is independent of the approved WebGL hero timeline. */
export function initSpreads({assets,names,show,goto,reduced,announce}) {
 const $=s=>document.querySelector(s), el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 const isSite=new URLSearchParams(location.search).get('site')==='1'&&parent!==window;
 const memberURL=isSite?'/pricing':'https://oliviaarcana.com/pricing';
 let access={status:isSite?'loading':'unavailable',paid:false},requestId='',accessTimer;
 let current=null,definition=null,session=null,reading=null,record=null,isPreview=false,active=-1,playing=false,busy=false,generation=0,flowGeneration=0,unsaved=false;
 const animations=new Set(), drafts=new Map(),dirty=new Set();
 let synthesisIndex=0;
 let deckStart=0,deckFocus=3,gathered=false;
 const detailOpen=new Set();
 const previewQuestion='What would help me approach an important change with more clarity?';
 const previewIds={clarity3:[9,18,14],crossroads5:[6,7,12,2,14],compass8:[18,9,2,16,15,8,12,17]};
 const root=el('main','product-page spread-page');root.id='spreads-view';root.hidden=true;root.setAttribute('aria-labelledby','spreads-title');
 root.innerHTML=`<div class="page-top"><a class="brand" href="#home">Olivia <span>ARCANA</span></a><a class="quiet-link" href="#journal">My almanac ↗</a></div>
 <div id="spread-library"><div class="spread-intro"><div><p class="eyebrow">A fuller conversation · For members</p><h1 id="spreads-title" tabindex="-1">When a question<br>has <em>many sides.</em></h1></div><p>Let each card hold a different part of the picture. Explore what connects them, then find a step that feels like your own.</p></div><div class="spread-collection"><div class="spread-options" id="spread-options" aria-label="Choose a spread"></div><div class="spread-showcase"><div id="spread-showcase-art" class="spread-showcase-art" aria-hidden="true"></div><div class="spread-showcase-caption"><div><p class="eyebrow" id="showcase-count"></p><p id="showcase-invitation"></p></div><button class="text-action" id="preview-current">Explore a sample ↗</button></div></div></div>
 <div class="spread-entry"><div><p class="eyebrow">Your question, held in context</p><h2>Bring your<br><em>own question.</em></h2><p>A small spread can be enough. Choose more cards when there are genuinely different parts of a situation to explore.</p><p class="privacy-note">Drawn from Olivia’s 22 Major Arcana. All cards are read upright. Interpretations are curated reflections, not predictions.</p></div><form id="spread-question-form"><label for="spread-question">Your question <span>(optional · up to 240 characters)</span></label><textarea id="spread-question" maxlength="240" rows="3" placeholder="What do I need to understand about this situation?"></textarea><div id="spread-paths" hidden><label for="spread-path-a">Path A<input id="spread-path-a" maxlength="120" placeholder="Your first option"></label><label for="spread-path-b">Path B<input id="spread-path-b" maxlength="120" placeholder="Your second option"></label></div><fieldset><legend>A place to begin</legend><div class="intention-options"><label><input type="radio" name="spread-intention" value="open" checked><span>Stay open</span></label><label><input type="radio" name="spread-intention" value="relationships"><span>Relationships</span></label><label><input type="radio" name="spread-intention" value="work"><span>Work</span></label><label><input type="radio" name="spread-intention" value="change"><span>Change</span></label></div></fieldset><p id="spread-access" role="status"></p><button class="solid-action" id="begin-spread" type="submit">Begin this spread ↗</button><a id="spread-membership" class="text-action">Explore membership ↗</a><button type="button" id="refresh-spread-access" class="quiet-link">Check my membership again</button><p class="privacy-note">One-card readings are free. Guided spreads are for members. Your question and reflections stay in this browser.</p><a href="#question" class="quiet-link">Prefer a single card? Begin here ↗</a></form></div></div>
 <section id="spread-ritual" hidden aria-labelledby="spread-ritual-title"><div class="spread-ritual-head"><div><p class="eyebrow" id="spread-kind"></p><h1 id="spread-ritual-title" tabindex="-1"></h1><p id="spread-held-question" class="question-quote"></p></div><button class="quiet-link" id="leave-spread">← All spreads</button></div><div class="spread-workspace"><div class="spread-scene"><div id="spread-board" class="spread-board" aria-label="Your spread"></div><div id="spread-deck-area"><p class="eyebrow" id="spread-pick-label"></p><div class="spread-deck" id="spread-deck" aria-label="Choose cards from the deck"></div><button class="text-action" id="deal-spread">Let the deck choose ↗</button></div></div><aside class="spread-insight"><div id="spread-position-copy"></div><nav class="spread-card-nav" id="spread-card-nav" aria-label="Explore revealed cards" hidden><button id="inspect-previous" class="quiet-link" aria-label="Previous revealed card">←</button><span id="inspect-count"></span><button id="inspect-next" class="quiet-link" aria-label="Next revealed card">→</button></nav><div class="spread-controls"><p id="spread-progress" role="status"></p><div><button class="solid-action" id="reveal-next" hidden>Reveal the first card ↗</button><button class="quiet-link" id="reveal-flow" hidden>Watch the reveal</button><button class="quiet-link" id="reveal-skip" hidden>Reveal all now</button></div></div><button id="show-synthesis" class="text-action" hidden>Read the cards together ↗</button></aside></div>
 <section class="spread-synthesis" id="spread-synthesis" hidden><div class="spread-synthesis-title"><p class="eyebrow">The whole picture</p><h2 tabindex="-1" id="spread-together-title">Read <em>together.</em></h2><p id="spread-synthesis-question" class="question-quote"></p></div><div class="spread-synthesis-copy"><div id="spread-connections" class="spread-connections" aria-hidden="true"></div><nav id="synthesis-tabs" class="synthesis-tabs" aria-label="Connections between your cards"></nav><div id="spread-paragraphs" aria-live="polite"></div><button id="synthesis-next" class="text-action">Continue the thread ↗</button><div class="reflection-prompt synthesis-reflection"><span class="eyebrow">A question to take with you</span><p id="spread-takeaway"></p></div><div id="spread-save-section"><label for="spread-reflection">What connects with your life? <span>(optional)</span></label><textarea id="spread-reflection" maxlength="4000" rows="3" placeholder="The connection I notice. The next step I can take…"></textarea><div class="save-actions"><button id="save-spread" class="solid-action">Keep this spread ↗</button><a href="#journal" class="quiet-link">My almanac ↗</a></div><p id="spread-save-status" role="status"></p><button id="download-spread" class="quiet-link">Download this spread ↓</button><p class="privacy-note">Saved on this browser and device. Download a copy for your own backup.</p></div><div id="spread-preview-cta" hidden><p>You chose these cards around an example question. Membership lets you bring your own question and keep your reading.</p><a class="text-action" id="preview-membership">Make room for your own question ↗</a></div><p class="provenance">Curated card meanings, interpreted through each position and read in relation to one another. Your question is shown alongside them; this guide does not analyse your words or know another person’s thoughts.</p><button class="quiet-link" id="another-spread">Choose another spread ↗</button></div></section></section><dialog id="spread-art-dialog" class="spread-art-dialog" aria-labelledby="spread-art-title"><button id="close-spread-art" class="quiet-link" aria-label="Close card detail">Close ×</button><div class="spread-art-detail"><img id="spread-detail-image" alt=""><div><p class="eyebrow" id="spread-art-position"></p><h2 id="spread-art-title"></h2><p id="spread-art-line"></p></div></div></dialog>`;
 $('#journal-view').before(root);
 const tableHint=el('p','spread-table-hint','Your cards, at your pace. Begin with the first.');tableHint.id='spread-table-hint';$('#spread-board').before(tableHint);
 for(const id of ['#spread-membership','#preview-membership']){$(id).href=memberURL;if(isSite)$(id).target='_top';}
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
  const copy=el('span','spread-option-copy');copy.append(el('span','eyebrow',s.kicker),el('h2','',s.name),el('p','',s.description));
  const arrow=el('span','spread-option-arrow','↗');arrow.setAttribute('aria-hidden','true');b.append(number,copy,arrow);
  b.addEventListener('click',()=>chooseDefinition(s.id));article.append(b);$('#spread-options').append(article);
 }
 function showComposition(s,animate=true){
  const art=$('#spread-showcase-art');art.dataset.spread=s.id;art.replaceChildren();
  for(const [i,p] of compositions[s.id].entries()){
   const img=el('img','showcase-card');img.src=p.face===undefined?assets.back:assets.cards[previewIds[s.id][p.face]];img.alt='';img.style.cssText=`--cx:${p.x}%;--cy:${p.y}%;--cr:${p.r}deg;--cw:${p.w}%;z-index:${p.face===0?9:i+1}`;art.append(img);
   if(animate&&!reduced())runAnimation(img,[{opacity:0,transform:`translate(-50%,calc(-50% + 28px)) rotate(${p.r-5}deg)`},{opacity:1,transform:`translate(-50%,-50%) rotate(${p.r}deg)`}],{duration:1100,delay:i*65,easing:'cubic-bezier(.18,.72,.2,1)',fill:'backwards'});
  }
  $('#showcase-count').textContent=`${s.count} cards · ${s.goodFor}`;
  $('#showcase-invitation').textContent=spreadEditorial(s.id).invitation;
  $('#preview-current').textContent=`Preview ${s.name} ↗`;
 }
 function chooseDefinition(id){const changed=current!==id;current=id;$('#spread-paths').hidden=id!=='crossroads5';for(const input of $('#spread-paths').querySelectorAll('input'))input.required=id==='crossroads5';for(const a of document.querySelectorAll('.spread-option')){const checked=a.dataset.spread===id;a.classList.toggle('selected',checked);a.querySelector('button').setAttribute('aria-pressed',String(checked));}$('#begin-spread').textContent=`Begin ${selected().name} ↗`;if(changed)showComposition(selected(),current!==null);}
 $('#preview-current').addEventListener('click',()=>start(selected(),true));
 chooseDefinition(SPREADS[0].id);
 function refreshAccess(){clearTimeout(accessTimer);if(!isSite){access={status:'unavailable',paid:false};renderAccess();return;}access={status:'loading',paid:false};renderAccess();requestId=crypto.randomUUID();parent.postMessage({type:'olivia:subscription:request',requestId},location.origin);accessTimer=setTimeout(()=>{if(access.status==='loading'){access={status:'unavailable',paid:false};renderAccess();}},10000);}
 function renderAccess(){const paid=access.status==='ready'&&access.paid===true;$('#begin-spread').hidden=!paid;$('#spread-membership').hidden=paid||access.status==='loading';$('#refresh-spread-access').hidden=!isSite||access.status==='loading';$('#spread-access').textContent=access.status==='loading'?'Checking your membership…':paid?'Your membership includes all three guided spreads.':access.status==='unavailable'?'Membership cannot be verified here. You can explore every spread with a free preview.':'Guided spreads are included with a paid membership. Explore a free preview above.';}
 addEventListener('message',event=>{const data=event.data;if(!isSite||event.source!==parent||event.origin!==location.origin||data?.type!=='olivia:subscription:state'||data.requestId!==requestId||!['loading','ready','unavailable'].includes(data.status))return;access={status:data.status,paid:data.paid===true&&['insight','premium','vip'].includes(data.tier)};if(data.status!=='loading')clearTimeout(accessTimer);renderAccess();});
 $('#refresh-spread-access').addEventListener('click',refreshAccess);refreshAccess();

 const status=message=>{$('#spread-progress').textContent=message;announce(message);};
 function preserve(){if(record&&!isPreview){record={...record,note:$('#spread-reflection').value};drafts.set(record.id,record);}}
 function halt(){generation++;flowGeneration++;playing=false;busy=false;for(const animation of animations)animation.cancel();animations.clear();$('#reveal-flow').textContent='Watch the reveal';}
 function leave(){preserve();halt();$('#spread-art-dialog').close();root.hidden=true;}
 function enter(){show('spreads');root.hidden=false;}
 function library(){preserve();halt();enter();root.setAttribute('aria-labelledby','spreads-title');$('#spread-library').hidden=false;$('#spread-ritual').hidden=true;$('#spreads-title').focus({preventScroll:true});renderAccess();}
 function runAnimation(node,frames,options){if(reduced())return Promise.resolve();const animation=node.animate(frames,options);animations.add(animation);if(document.hidden)animation.pause();return animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));}
 document.addEventListener('visibilitychange',()=>{for(const animation of animations)document.hidden?animation.pause():animation.play();});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(reduced())for(const animation of animations)animation.finish();});
 function initBoard(){const board=$('#spread-board');board.replaceChildren();board.dataset.count=definition.count;board.dataset.spread=definition.id;board.classList.remove('has-focus');for(const [i,p] of definition.positions.entries()){const pos=definition.layout[i];const slot=el('div','spread-slot');slot.dataset.index=i;slot.style.cssText=`--x:${pos.x*100}%;--y:${pos.y*100}%;--angle:${pos.rotate||0}deg`;const b=el('button','spread-card');b.type='button';b.disabled=true;b.dataset.position=String(i+1).padStart(2,'0');b.setAttribute('aria-label',`${i+1}. ${p.label}. Waiting for a card.`);const rotator=el('span','spread-card-turn');const back=el('img','spread-card-back');back.src=assets.back;back.alt='';const face=el('img','spread-card-face');face.alt='';rotator.append(back,face);b.append(rotator);const label=el('span','spread-slot-label',`${String(i+1).padStart(2,'0')} · ${p.label}`);slot.append(b,label);slot.style.zIndex=String(i+1);b.addEventListener('click',()=>{if(i<session.revealedCount)inspect(i);else if(i===session.revealedCount&&session.cardIds.length===definition.count)revealOne();});board.append(slot);} }
 const availableSlots=()=>session?session.deck.map((_,i)=>i).filter(i=>!session.selectedSlots.includes(i)):[];
 const fanCount=()=>$('#spread-deck').clientWidth<580?5:7;
 function layoutDeck(){
  if(!session)return;
  const deck=$('#spread-deck'),available=availableSlots(),count=fanCount();
  deckStart=Math.max(0,Math.min(deckStart,available.length-count));
  const visible=available.slice(deckStart,deckStart+count);
  if(!visible.includes(deckFocus))deckFocus=visible[Math.floor(visible.length/2)];
  const width=Math.min(116,(deck.clientWidth-34)/(count===5?3.9:5.15)),step=width*.69;
  deck.style.setProperty('--fan-width',width+'px');
  deck.style.setProperty('--fan-height',(width*1.716+85)+'px');
  for(const b of deck.children){
   const slot=Number(b.dataset.slot),index=visible.indexOf(slot),visibleCard=index>=0;
   b.hidden=!visibleCard;b.disabled=!visibleCard||busy||playing;b.tabIndex=visibleCard&&slot===deckFocus?0:-1;
   if(!visibleCard)continue;
   const offset=index-(visible.length-1)/2,angle=offset*7;
   b.dataset.angle=angle;b.style.setProperty('--fan-x',offset*step+'px');
   b.style.setProperty('--fan-y',Math.abs(offset)**2*4+'px');b.style.setProperty('--fan-angle',angle+'deg');
   b.style.setProperty('--fan-order',String(index+1));
  }
  $('#deck-previous').disabled=busy||playing||deckStart===0;
  $('#deck-next').disabled=busy||playing||deckStart+count>=available.length;
  $('#deck-browse-status').textContent=available.length?`${deckStart+1}–${Math.min(deckStart+count,available.length)} of ${available.length} cards`:'';
 }
 function browseDeck(direction){
  if(busy||playing)return;
  deckStart+=direction*(fanCount()-2);layoutDeck();
 }
 function focusDeck(slot){
  const available=availableSlots(),index=available.indexOf(slot),count=fanCount();
  if(index<0)return;
  if(index<deckStart)deckStart=index;else if(index>=deckStart+count)deckStart=index-count+1;
  deckFocus=slot;layoutDeck();$(`#spread-deck [data-slot="${slot}"]`).focus({preventScroll:true});
 }
 function buildDeck(){
  const deck=$('#spread-deck');deck.replaceChildren();deckStart=0;deckFocus=3;
  root.classList.toggle('spread-reduced',reduced());
  for(let slot=0;slot<22;slot++){
   const b=el('button','spread-deck-card');b.type='button';b.dataset.slot=slot;
   b.setAttribute('aria-label',`Choose card ${slot+1} for the spread`);b.setAttribute('aria-describedby','deck-browse-hint');
   const image=el('img');image.src=assets.back;image.alt='';b.append(image);
   bindDeckGesture(b,{enabled:()=>!busy&&!playing&&!b.hidden&&!b.disabled,choose:keyboard=>dealOne(slot,keyboard)});
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
 deckNavigation.innerHTML='<button class="quiet-link" id="deck-previous" aria-label="Previous cards in the deck">←</button><span id="deck-browse-status" aria-live="polite"></span><button class="quiet-link" id="deck-next" aria-label="Next cards in the deck">→</button>';
 $('#spread-deck').after(deckNavigation);
 const deckHint=el('p','deck-browse-hint','Lift a card from the deck, or tap to choose.');deckHint.id='deck-browse-hint';deckNavigation.after(deckHint);
 $('#deck-previous').addEventListener('click',()=>browseDeck(-1));$('#deck-next').addEventListener('click',()=>browseDeck(1));
 new ResizeObserver(()=>{if($('#spread-deck').clientWidth)layoutDeck();}).observe($('#spread-deck'));
 function prepareView(){gathered=!!record;enter();$('.spread-workspace').dataset.count=definition.count;$('.spread-workspace').dataset.phase=gathered?'dealt':'choosing';root.setAttribute('aria-labelledby','spread-ritual-title');$('#spread-library').hidden=true;$('#spread-ritual').hidden=false;$('#spread-synthesis').hidden=true;synthesisIndex=0;detailOpen.clear();$('#spread-card-nav').hidden=true;$('#spread-kind').textContent=isPreview?'Interactive preview · 22 Major Arcana':`${definition.count} cards · Your guided reading`;$('#spread-ritual-title').textContent=definition.name;$('#spread-held-question').textContent=session.question?`“${session.question}”`:'An open reading';$('#spread-together-title').innerHTML='Read <em>together.</em>';$('#spread-reflection').value=record?.note||'';$('#spread-save-status').textContent='';$('#spread-save-section').hidden=isPreview;$('#spread-preview-cta').hidden=!isPreview;$('#spread-ritual-title').focus({preventScroll:true});initBoard();buildDeck();controls();initialCopy();}
 function start(s,preview){if(!preview&&!(access.status==='ready'&&access.paid)){renderAccess();return;}preserve();halt();definition=s;chooseDefinition(s.id);isPreview=preview;record=null;active=-1;const intention=new FormData($('#spread-question-form')).get('spread-intention');session=createSpreadSession({question:preview?(s.id==='crossroads5'?previewQuestion+'\nPath A: make the change. Path B: stay and reshape the current situation.':previewQuestion):s.id==='crossroads5'?[$('#spread-question').value,'Path A: '+$('#spread-path-a').value,'Path B: '+$('#spread-path-b').value].filter(Boolean).join('\n'):$('#spread-question').value,intention:preview?'change':intention,spreadId:s.id,count:s.count});reading=null;history.replaceState(null,'','#spreads');prepareView();status(preview?`Choose ${s.count} cards for this example question. The deck waits for you.`:`Choose ${s.count} cards, one at a time, or let the deck choose.`);}
 $('#spread-question-form').addEventListener('submit',e=>{e.preventDefault();try{start(selected(),false);}catch{$('#spread-access').textContent='The deck could not be opened. Please try again.';}});
 function initialCopy(){
  const container=$('#spread-position-copy'),editorial=spreadEditorial(definition.id);
  container.replaceChildren(el('p','eyebrow','Take a moment'),el('h2','',editorial.gesture),el('p','spread-invitation',editorial.invitation));
  const list=el('ol','spread-role-list');for(const p of definition.positions)list.append(el('li','',p.label));const structure=el('details','spread-deeper spread-structure');structure.append(el('summary','',`${definition.count} positions, each with a purpose`),list);container.append(structure,el('p','spread-reading-hint','Choose your cards from the deck. They stay face down until you are ready to turn them.'));
 }
 function controls(){if(!session)return;const full=session.cardIds.length===definition.count,ready=full&&!!reading,complete=session.revealedCount===definition.count;$('.spread-workspace').dataset.phase=gathered?'dealt':'choosing';$('#spread-deck-area').hidden=gathered;$('#spread-table-hint').hidden=!gathered||complete;$('.spread-controls').hidden=complete&&!busy;$('#reveal-next').hidden=!ready||complete;$('#reveal-next').disabled=busy||playing;$('#reveal-next').textContent=session.revealedCount?`Reveal ${definition.positions[session.revealedCount]?.label||'next card'} ↗`:'Reveal the first card ↗';$('#reveal-flow').hidden=!ready||complete;$('#reveal-flow').disabled=busy&&!playing;$('#reveal-skip').hidden=!ready||complete;$('#show-synthesis').hidden=!complete||busy;$('#deal-spread').disabled=busy||playing;const artLook=$('.art-look');if(artLook)artLook.disabled=busy;$('#inspect-previous').disabled=busy||playing||active<=0;$('#inspect-next').disabled=busy||playing||active>=session.revealedCount-1;$('#spread-pick-label').textContent=full?'':`${session.cardIds.length} of ${definition.count} chosen · ${definition.positions[session.cardIds.length].label}`;layoutDeck();for(const [i,slot] of [...$('#spread-board').children].entries()){slot.classList.toggle('is-next',ready&&!complete&&i===session.revealedCount);slot.querySelector('button').disabled=!ready||busy||playing||(!full&&i>=session.revealedCount)||i>session.revealedCount;} }
 async function dealOne(slot,keyboard=false){
  if(session.cardIds.length>=definition.count||session.selectedSlots.includes(slot)||!Number.isInteger(slot)||slot<0||slot>=session.deck.length)return;
  const token=generation,index=session.cardIds.length,available=availableSlots(),sourceIndex=available.indexOf(slot);
  if(sourceIndex<deckStart||sourceIndex>=deckStart+fanCount()){deckStart=Math.max(0,sourceIndex-Math.floor(fanCount()/2));layoutDeck();}
  const source=$(`#spread-deck [data-slot="${slot}"]`),surface=source.querySelector('img'),from=surface.getBoundingClientRect(),fromWidth=surface.offsetWidth;
  const matrix=new DOMMatrixReadOnly(getComputedStyle(source).transform),surfaceMatrix=new DOMMatrixReadOnly(getComputedStyle(surface).transform),fromAngle=(Math.atan2(matrix.b,matrix.a)+Math.atan2(surfaceMatrix.b,surfaceMatrix.a))*180/Math.PI;
  busy=true;session=selectSpreadCard(session,slot);
  const target=$('#spread-board').children[index],card=target.querySelector('.spread-card');
  target.classList.add('dealt');card.setAttribute('aria-label',`${index+1}. ${definition.positions[index].label}. Reveal card.`);
  card.querySelector('.spread-card-face').src=assets.cards[session.cardIds[index]];
  const to=card.getBoundingClientRect();controls();status(`${index+1} of ${definition.count} · ${definition.positions[index].label}`);
  const flight=dealMotion({spreadId:definition.id,index,from,to,fromWidth,toWidth:card.offsetWidth,fromAngle,angle:definition.layout[index].rotate||0});
  await runAnimation(card,flight.frames,flight.options);
  if(token!==generation)return;
  if(session.cardIds.length===definition.count){await openSpreadTable(token);if(token!==generation)return;reading=buildSpreadReading(definition,session.cardIds,session.intention);status(spreadEditorial(definition.id).arrival);}
  busy=false;
  controls();
  if(keyboard){if(reading)$('#spread-board .spread-card').focus({preventScroll:true});else focusDeck(availableSlots()[Math.min(sourceIndex,availableSlots().length-1)]);}
 }
 async function openSpreadTable(token){
  const slots=[...$('#spread-board').children],before=slots.map(slot=>{
   const card=slot.querySelector('.spread-card'),m=new DOMMatrixReadOnly(getComputedStyle(slot).transform);
   return {rect:card.getBoundingClientRect(),width:card.offsetWidth,angle:Math.atan2(m.b,m.a)*180/Math.PI};
  });
  gathered=true;controls();
  const flights=slots.map((slot,i)=>{
   const card=slot.querySelector('.spread-card'),to=card.getBoundingClientRect(),from=before[i],m=new DOMMatrixReadOnly(getComputedStyle(slot).transform),angle=Math.atan2(m.b,m.a),x=from.rect.x+from.rect.width/2-to.x-to.width/2,y=from.rect.y+from.rect.height/2-to.y-to.height/2;
   const dx=x*Math.cos(angle)+y*Math.sin(angle),dy=-x*Math.sin(angle)+y*Math.cos(angle),scale=from.width/card.offsetWidth;
   return runAnimation(card,[{transform:`translate(${dx}px,${dy}px) rotate(${from.angle-angle*180/Math.PI}deg) scale(${scale})`},{transform:'none'}],{duration:1050,delay:i*42,fill:'backwards',easing:'cubic-bezier(.22,.72,.18,1)'});
  });
  await Promise.all(flights);if(token!==generation)return;
  slots[0].querySelector('.spread-card').scrollIntoView({block:'center',behavior:reduced()?'instant':'smooth'});
  const hint=$('.spread-reading-hint');if(hint)hint.textContent='Your cards are here. Turn one when you are ready, then take a moment with what it shows you.';
 }
 async function dealSequence(keyboard=false){if(busy||playing)return;playing=true;const token=generation;while(session.cardIds.length<definition.count&&token===generation){const slot=session.deck.findIndex((_,i)=>!session.selectedSlots.includes(i));await dealOne(slot);}if(token!==generation)return;playing=false;controls();if(keyboard)$('#spread-board .spread-card').focus({preventScroll:true});}
 $('#deal-spread').addEventListener('click',event=>dealSequence(event.detail===0));
 function inspect(index){
  if(index<0||index>=session.revealedCount)return;
  const old=active;active=index;$('#spread-board').classList.add('has-focus');
  for(const [i,slot] of [...$('#spread-board').children].entries()){slot.classList.toggle('active',i===index);slot.style.zIndex=String(i===index?30:i+1);slot.querySelector('button').setAttribute('aria-pressed',String(i===index));}
  const c=reading.cards[index],p=definition.positions[index],box=$('#spread-position-copy'),editorial=cardEditorial(c.cardId,p.id);
  box.replaceChildren(el('p','eyebrow',`${String(index+1).padStart(2,'0')} / ${p.label}`),el('h2','',names[c.cardId]),el('p','spread-card-lead',editorial.line));
  const prompt=el('div','reflection-prompt');prompt.append(el('span','eyebrow','A question to sit with'),el('p','',p.prompt));box.append(prompt);
  const details=el('details','spread-deeper'),summary=el('summary','','Explore the meaning');details.open=detailOpen.has(index);details.append(summary,el('p','',c.meaning),el('p','',c.prompt),el('p','spread-practice',c.practice));details.addEventListener('toggle',()=>{if(details.open)detailOpen.add(index);else detailOpen.delete(index);});box.append(details);
  const look=el('button','quiet-link art-look','Look closely at the artwork ↗');look.addEventListener('click',openArt);box.append(look);
  $('#spread-card-nav').hidden=false;$('#inspect-previous').disabled=index===0;$('#inspect-next').disabled=index>=session.revealedCount-1;$('#inspect-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(definition.count).padStart(2,'0')}`;
  if(old!==index)runAnimation(box,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
 function openArt(){if(busy||active<0||!reading)return;if(playing){playing=false;flowGeneration++;$('#reveal-flow').textContent='Continue the reveal';controls();}const c=reading.cards[active];$('#spread-detail-image').src=assets.cards[c.cardId];$('#spread-detail-image').alt=names[c.cardId]+' — Olivia Arcana';$('#spread-art-title').textContent=names[c.cardId];$('#spread-art-position').textContent=definition.positions[active].label;$('#spread-art-line').textContent=cardEditorial(c.cardId,c.positionId).line;$('#spread-art-dialog').showModal();}
 $('#close-spread-art').addEventListener('click',()=>$('#spread-art-dialog').close());
 $('#spread-art-dialog').addEventListener('click',e=>{if(e.target===$('#spread-art-dialog'))$('#spread-art-dialog').close();});
 $('#inspect-previous').addEventListener('click',()=>{if(!busy&&!playing)inspect(active-1);});$('#inspect-next').addEventListener('click',()=>{if(!busy&&!playing)inspect(active+1);});
 function renderRevealed(index,pose='none'){
  const slot=$('#spread-board').children[index],b=slot.querySelector('button');slot.classList.add('revealed');
  b.setAttribute('aria-label',`${index+1}. ${definition.positions[index].label}: ${names[session.cardIds[index]]}. Explore this card.`);
  b.querySelector('.spread-card-face').alt=names[session.cardIds[index]];b.querySelector('.spread-card-turn').style.transform=pose;
 }
 async function revealOne(){
  if(busy||session.revealedCount>=definition.count)return;
  const token=generation,index=session.revealedCount;busy=true;controls();
  const slot=$('#spread-board').children[index],turn=slot.querySelector('.spread-card-turn'),face=slot.querySelector('.spread-card-face');
  // Decode before rotating: the front is ready at the exact edge-on change.
  try{await face.decode();}catch{}
  if(token!==generation)return;
  const turning=revealMotion({spreadId:definition.id,index});
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
 const chapterTitles=()=>reading.synthesis.paragraphs.map((_,i)=>spreadEditorial(definition.id).chapters[i]||'Another connection');
 const connectionGroups={clarity3:[[0,1],[0,1,2]],crossroads5:[[0],[1,2],[3,4]],compass8:[[0,1],[2,3],[4,5],[6,7]]};
 function renderConnection(index){
  if(index<0||index>=reading.synthesis.paragraphs.length)return;
  synthesisIndex=index;const chapters=chapterTitles(),group=connectionGroups[definition.id][index]||[0,definition.count-1];
  const art=$('#spread-connections');art.replaceChildren();for(const [i,n] of group.entries()){const figure=el('figure'),img=el('img');img.src=assets.cards[session.cardIds[n]];img.alt='';figure.style.setProperty('--lean',(i-(group.length-1)/2)*7+'deg');figure.append(img,el('figcaption','',definition.positions[n].label));art.append(figure);}
  const box=$('#spread-paragraphs');box.replaceChildren(el('p','eyebrow',`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`),el('h3','',chapters[index]),el('p','',reading.synthesis.paragraphs[index]));
  box.querySelector('h3').tabIndex=-1;
  for(const [i,b] of [...$('#synthesis-tabs').children].entries())b.setAttribute('aria-current',i===index?'step':'false');
  $('#synthesis-next').hidden=index===chapters.length-1;
  // The reflection is always available; chapters let the reader control the pace.
  runAnimation(box,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:500,easing:'ease-out'});
 }
 function complete(){
  if(!record&&!isPreview){record=createSpreadRecord(session,definition,reading);drafts.set(record.id,record);}
  const nav=$('#synthesis-tabs');nav.replaceChildren();chapterTitles().forEach((title,i)=>{const b=el('button','',String(i+1).padStart(2,'0'));b.setAttribute('aria-label',title);b.addEventListener('click',()=>renderConnection(i));nav.append(b);});renderConnection(0);
  $('#spread-takeaway').textContent=reading.synthesis.prompt;$('#spread-synthesis-question').textContent=session.question?`“${session.question}”`:'An open reading';
 }
 $('#synthesis-next').addEventListener('click',()=>{renderConnection(synthesisIndex+1);$('#spread-paragraphs h3').focus({preventScroll:true});});
 $('#show-synthesis').addEventListener('click',()=>{$('#spread-synthesis').hidden=false;$('#spread-synthesis').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});$('#spread-together-title').focus({preventScroll:true});});
 $('#spread-reflection').addEventListener('input',()=>{if(record&&!isPreview){dirty.add(record.id);unsaved=true;$('#spread-save-status').textContent='Unsaved reflection.';}});
 const notifyJournal=()=>dispatchEvent(new Event('olivia:journal-change'));
 $('#save-spread').addEventListener('click',()=>{if(!record||isPreview)return;preserve();try{record={...record,updatedAt:new Date().toISOString()};saveSpreadRecord(localStorage,record);drafts.set(record.id,record);dirty.delete(record.id);unsaved=dirty.size>0;$('#spread-save-status').textContent='Kept in your almanac, on this device.';notifyJournal();}catch(error){$('#spread-save-status').textContent=error.message||'This spread could not be saved. Download a copy to keep it.';}});
 function download(filename,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=el('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('#download-spread').addEventListener('click',()=>{if(!record||isPreview)return;preserve();download('olivia-spread.json',exportSpreadRecords([record]));});
 for(const id of ['#leave-spread','#another-spread'])$(id).addEventListener('click',library);
 function restore(saved){preserve();halt();definition=SPREADS.find(s=>s.id===saved.spreadId);if(!definition)return;record=drafts.get(saved.id)||saved;isPreview=false;session={...record,count:record.cardIds.length,selectedSlots:[],deck:[]};reading={cards:record.cards,synthesis:record.synthesis};history.replaceState(null,'','#spreads');prepareView();session.cardIds.forEach((id,i)=>{const slot=$('#spread-board').children[i];slot.classList.add('dealt');slot.querySelector('.spread-card-face').src=assets.cards[id];renderRevealed(i);});complete();inspect(0);controls();status('Your saved spread. The original cards and positions are unchanged.');if(dirty.has(record.id))$('#spread-save-status').textContent='Unsaved reflection.';}
 function renderJournal(){const journal=$('#journal-list');$('#spread-journal-section')?.remove();const section=el('section','spread-journal-section');section.id='spread-journal-section';section.append(el('p','eyebrow','Your guided spreads'));const msg=el('p','spread-journal-message');section.append(msg);let records;try{records=loadSpreadRecords(localStorage);}catch(error){msg.textContent=error.message;journal.after(section);return;}const savedIds=new Set(records.map(r=>r.id)),merged=new Map(records.map(r=>[r.id,r]));for(const [id,draft]of drafts)if(!merged.has(id)||dirty.has(id))merged.set(id,draft);records=[...merged.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));if(journal.querySelector('.empty-journal'))journal.querySelector('.empty-journal').hidden=records.length>0;$('#export-journal').disabled=!records.length&&!journal.querySelector('.journal-entry');if(!records.length){section.append(el('p','spread-empty','A fuller reading can have a place here, too.'));const link=el('a','text-action','Explore guided spreads ↗');link.href='#spreads';section.append(link);}for(const r of records){const row=el('div','journal-entry'),button=el('button','journal-row');button.type='button';const image=el('img');image.src=assets.cards[r.cardIds[0]];image.alt='';const info=el('div');info.append(el('time','',new Date(r.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})+(!savedIds.has(r.id)?' · Unsaved draft':dirty.has(r.id)?' · Unsaved changes':'')),el('h2','',`${r.spreadName} · ${r.cardIds.length} cards`),el('p','',r.question||r.note||'An open reading'));button.append(image,info,el('span','','↗'));button.addEventListener('click',()=>restore(r));row.append(button);const remove=el('button','quiet-link remove-entry','Remove');remove.type='button';remove.setAttribute('aria-label',`Remove ${r.spreadName} spread`);remove.addEventListener('click',()=>{try{removeSpreadRecord(localStorage,r.id);if(record?.id===r.id){record=null;session=null;reading=null;active=-1;}drafts.delete(r.id);dirty.delete(r.id);unsaved=dirty.size>0;notifyJournal();renderJournal();const message=$('#spread-journal-section .spread-journal-message');message.textContent='Spread removed. ';const undo=el('button','quiet-link','Undo');undo.addEventListener('click',()=>{try{saveSpreadRecord(localStorage,r);notifyJournal();renderJournal();}catch(error){message.textContent=error.message;}});message.append(undo);}catch(error){msg.textContent=error.message;}});row.append(remove);section.append(row);}if(records.length){const exp=el('button','text-action','Download my spreads ↓');exp.addEventListener('click',()=>download('olivia-spreads.json',exportSpreadRecords(records)));section.append(exp);}journal.after(section);}
 addEventListener('storage',()=>{for(const id of drafts.keys())if(!dirty.has(id))drafts.delete(id);if(document.body.dataset.view==='journal')renderJournal();});
 addEventListener('beforeunload',e=>{if(unsaved){e.preventDefault();e.returnValue='';}});
 return {leave,library,renderJournal,exportJournal(){const all=new Map(loadSpreadRecords(localStorage).map(r=>[r.id,r]));for(const [id,r]of drafts)if(!all.has(id)||dirty.has(id))all.set(id,r);return JSON.parse(exportSpreadRecords([...all.values()]));},open(){library();},restore};
}
