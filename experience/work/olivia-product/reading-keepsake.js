/** A sentence chosen by the reader, kept separately from the reading itself. */
export const KEEPSAKE_STORAGE_KEY='olivia-reading-keepsakes-v1';
export const KEEPSAKE_LIMIT=48;
export const KEEPSAKE_TEXT_LIMIT=240;
const STORAGE_CHAR_LIMIT=240000;
const COPY={
 en:{title:'Keep these words',intro:'Take a sentence from this reading with you.',choose:'Choose my words',source:'A sentence from your reading',words:'The words you want to keep',help:'Choose a sentence, then make it your own if you wish.',keep:'Keep these words',update:'Keep my changes',cancel:'Cancel',edit:'Edit words',remove:'Remove',download:'Download phone wallpaper',downloading:'Preparing your wallpaper…',kept:'Kept in this browser.',removed:'Your words have been removed from this browser.',savedLabel:'Your kept words',privacy:'Your saved words stay in this browser. You can also keep the full reading below.',wallpaperNote:'The wallpaper includes your words, card and deck names.',exported:'Wallpaper downloaded. Open the PNG on your phone to set it as your wallpaper.',exportError:'The wallpaper could not be downloaded. Please try again.',storageError:'This browser could not keep your words. You can still download a wallpaper.',corrupt:'Your kept words could not be read. Existing data has been left untouched. You can still download a wallpaper.',full:'You have reached 48 kept sentences. Remove one from another reading to make room, or download this wallpaper.',invalid:'Write between 1 and 240 characters.',notReady:'Your reading text is not ready yet.',count:n=>`${n} / 240`,card:'Card',wallpaper:'Words to return to'},
 uk:{title:'Збережіть ці слова',intro:'Візьміть із собою речення з цього читання.',choose:'Обрати слова',source:'Речення з вашого читання',words:'Слова, які хочеться зберегти',help:'Оберіть речення й за бажанням перекажіть його своїми словами.',keep:'Зберегти ці слова',update:'Зберегти зміни',cancel:'Скасувати',edit:'Змінити слова',remove:'Видалити',download:'Завантажити шпалери для телефона',downloading:'Готуємо ваші шпалери…',kept:'Збережено в цьому браузері.',removed:'Ваші слова видалено з цього браузера.',savedLabel:'Ваші збережені слова',privacy:'Збережені слова залишаються в цьому браузері. Нижче можна зберегти й повне читання.',wallpaperNote:'На шпалерах будуть ваші слова, назви карти й колоди.',exported:'Шпалери завантажено. Відкрийте PNG на телефоні й установіть його як шпалери.',exportError:'Не вдалося завантажити шпалери. Спробуйте ще раз.',storageError:'Не вдалося зберегти слова в цьому браузері. Ви можете завантажити шпалери.',corrupt:'Не вдалося прочитати збережені слова. Наявні дані залишилися без змін. Ви можете завантажити шпалери.',full:'У вас уже збережено 48 речень. Видаліть одне з іншого читання або завантажте ці шпалери.',invalid:'Напишіть від 1 до 240 символів.',notReady:'Текст вашого читання ще не готовий.',count:n=>`${n} / 240`,card:'Карта',wallpaper:'Слова, до яких можна повернутися'},
};
const clean=value=>typeof value==='string'?value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').replace(/\s+/gu,' ').trim():'';
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
const deckOf=record=>record?.deckId==='space-between'?'space-between':'olivia';
const deckName=record=>deckOf(record)==='space-between'?'Amielle':'Olivia';
const identity=record=>`${record.id}\u001f${deckOf(record)}\u001f${record.cardId}`;
const entryIdentity=entry=>`${entry.readingId}\u001f${entry.deckId}\u001f${entry.cardId}`;
const validDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
function validRecord(record){return record&&typeof record.id==='string'&&record.id.length>0&&record.id.length<=128&&!/[\u0000-\u001f]/.test(record.id)&&Number.isInteger(record.cardId)&&record.cardId>=0&&record.cardId<78;}

export function normalizeKeepsakeText(value){
 const text=clean(value);
 if(!text||text.length>KEEPSAKE_TEXT_LIMIT)fail('TEXT');
 return text;
}
/** Suggestions contain only words already present in the supplied reading. */
export function readingSentenceChoices(value,locale='en'){
 const paragraphs=(Array.isArray(value)?value:[value]).filter(part=>typeof part==='string').flatMap(part=>part.split(/\n+/)).filter(part=>!/^\s*#{1,6}\s/u.test(part)&&!/^\s*\*\*[^.!?…]+\*\*\s*$/u.test(part)).map(part=>clean(part.replace(/^\s*[-*•]\s+/u,'').replace(/\*\*/g,''))).filter(Boolean);
 const segments=[];
 for(const paragraph of paragraphs){
  const sentences=typeof Intl?.Segmenter==='function'?[...new Intl.Segmenter(locale==='uk'?'uk':'en',{granularity:'sentence'}).segment(paragraph)].map(part=>part.segment):paragraph.match(/[^.!?…]+[.!?…]*[”’»"]*/gu)||[paragraph];
  for(const sentence of sentences){
   let text=clean(sentence);
   if(text.length>KEEPSAKE_TEXT_LIMIT){text=text.slice(0,KEEPSAKE_TEXT_LIMIT);const end=text.lastIndexOf(' ');if(end>120)text=text.slice(0,end);}
   if(text.length>=12&&!segments.includes(text))segments.push(text);
  }
 }
 return segments.slice(0,40);
}
function normalizeEntry(entry){
 if(!entry||typeof entry!=='object'||!validRecord({id:entry.readingId,cardId:entry.cardId})||!['olivia','space-between'].includes(entry.deckId)||!['en','uk'].includes(entry.locale)||!validDate(entry.createdAt)||!validDate(entry.updatedAt)||typeof entry.question!=='string'||entry.question.length>4000||typeof entry.cardName!=='string'||!entry.cardName||entry.cardName.length>140)fail('STORAGE_CORRUPT');
 let text;try{text=normalizeKeepsakeText(entry.text);}catch{fail('STORAGE_CORRUPT');}
 return {readingId:entry.readingId,deckId:entry.deckId,cardId:entry.cardId,cardName:clean(entry.cardName),question:clean(entry.question),locale:entry.locale,text,createdAt:entry.createdAt,updatedAt:entry.updatedAt};
}
export function loadReadingKeepsakes(storage){
 let raw;try{raw=storage.getItem(KEEPSAKE_STORAGE_KEY);}catch{fail('STORAGE');}
 if(raw===null)return [];
 if(typeof raw!=='string'||raw.length>STORAGE_CHAR_LIMIT)fail('STORAGE_CORRUPT');
 let parsed;try{parsed=JSON.parse(raw);}catch{fail('STORAGE_CORRUPT');}
 if(parsed?.version!==1||!Array.isArray(parsed.entries)||parsed.entries.length>KEEPSAKE_LIMIT)fail('STORAGE_CORRUPT');
 return validateReadingKeepsakes(parsed.entries);
}
function writeEntries(storage,entries){
 const raw=JSON.stringify({version:1,entries});
 if(raw.length>STORAGE_CHAR_LIMIT)fail('STORAGE_LIMIT');
 try{storage.setItem(KEEPSAKE_STORAGE_KEY,raw);}catch{fail('STORAGE');}
}
export function saveReadingKeepsake(storage,{record,text,locale='en',now=new Date()}={}){
 if(!validRecord(record))fail('READING');
 const words=normalizeKeepsakeText(text),entries=loadReadingKeepsakes(storage),index=entries.findIndex(entry=>entryIdentity(entry)===identity(record));
 if(index<0&&entries.length>=KEEPSAKE_LIMIT)fail('STORAGE_LIMIT');
 const timestamp=now.toISOString();
 const entry=normalizeEntry({readingId:record.id,deckId:deckOf(record),cardId:record.cardId,cardName:clean(record.cardName)||COPY[locale==='uk'?'uk':'en'].card,question:clean(record.question),locale:locale==='uk'?'uk':'en',text:words,createdAt:index<0?timestamp:entries[index].createdAt,updatedAt:timestamp});
 if(index<0)entries.push(entry);else entries[index]=entry;
 writeEntries(storage,entries);return entry;
}
/** Reusable at the almanac backup boundary; no browser access or writes. */
export function validateReadingKeepsakes(value){
 if(!Array.isArray(value)||value.length>KEEPSAKE_LIMIT)fail('STORAGE_CORRUPT');
 const entries=value.map(normalizeEntry),ids=entries.map(entryIdentity);
 if(new Set(ids).size!==ids.length)fail('STORAGE_CORRUPT');
 return entries;
}
/** A reading ID removes every associated sentence, including other locales/decks. */
export function removeReadingKeepsake(storage,record){
 if(typeof record==='string'?(!record||record.length>128):!validRecord(record))fail('READING');
 const entries=loadReadingKeepsakes(storage),next=entries.filter(entry=>typeof record==='string'?entry.readingId!==record:entryIdentity(entry)!==identity(record));
 if(next.length!==entries.length)writeEntries(storage,next);
 return next;
}
/** Undo/import merges preserve any words edited more recently in this browser. */
export function restoreReadingKeepsakes(storage,value){
 const incoming=validateReadingKeepsakes(value),entries=loadReadingKeepsakes(storage),merged=new Map(entries.map(entry=>[entryIdentity(entry),entry]));
 for(const entry of incoming){const key=entryIdentity(entry),prior=merged.get(key);if(!prior||entry.updatedAt>prior.updatedAt)merged.set(key,entry);}
 if(merged.size>KEEPSAKE_LIMIT)fail('STORAGE_LIMIT');
 const result=[...merged.values()];writeEntries(storage,result);return result;
}

/** Break a long word as well as normal prose; canvas must never clip the sentence. */
export function wrapKeepsakeText(context,text,width){
 const lines=[];let line='';
 for(const word of text.split(/\s+/u)){
  if(context.measureText(line?`${line} ${word}`:word).width<=width){line=line?`${line} ${word}`:word;continue;}
  if(line){lines.push(line);line='';}
  if(context.measureText(word).width<=width){line=word;continue;}
  for(const char of word){if(line&&context.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
 }
 if(line)lines.push(line);return lines;
}
function artSource(assets,record){return assets?.forRecord?.(record)?.cards?.[record.cardId]||assets?.cards?.[record.cardId]||'';}
function loadArt(src){return new Promise((resolve,reject)=>{if(!src){reject(new Error('ART'));return;}const image=new Image();image.crossOrigin='anonymous';image.onload=()=>image.naturalWidth?resolve(image):reject(new Error('ART'));image.onerror=()=>reject(new Error('ART'));image.src=src;});}
function cover(context,image,x,y,width,height){
 const inset=.065,sx=image.naturalWidth*inset,sy=image.naturalHeight*inset,sw=image.naturalWidth*(1-inset*2),sh=image.naturalHeight*(1-inset*2),scale=Math.max(width/sw,height/sh),cropW=width/scale,cropH=height/scale;
 context.drawImage(image,sx+(sw-cropW)/2,sy+(sh-cropH)/2,cropW,cropH,x,y,width,height);
}
function oliveImpression(context,x,y){
 context.save();context.translate(x,y);context.strokeStyle='#b7a276';context.fillStyle='#b7a276';context.lineWidth=1.7;context.beginPath();context.moveTo(-37,15);context.quadraticCurveTo(-1,-5,39,-17);context.stroke();
 for(let i=0;i<5;i++){const px=-23+i*12,py=8-i*5;context.save();context.translate(px,py);context.rotate(i%2?-.35:-1.25);context.beginPath();context.ellipse(0,-6,3.5,10,0,0,Math.PI*2);context.stroke();context.restore();}context.restore();
}
/** Creates a local PNG only. It never stores the reading or contacts a service. */
export async function createKeepsakeWallpaper({record,text,assets,locale='en'}={}){
 const words=normalizeKeepsakeText(text),image=await loadArt(artSource(assets,record));
 if(document.fonts?.load)await Promise.allSettled([document.fonts.load('64px "Cormorant Garamond"',words),document.fonts.load('24px "DM Sans"',record.cardName||'')]);
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const context=canvas.getContext('2d');if(!context)throw new Error('CANVAS');
 const background=deckOf(record)==='space-between'?'#302130':'#102638';
 context.fillStyle=background;context.fillRect(0,0,1080,1920);
 // Full-bleed sculptural detail leaves a quiet area for the phone's clock.
 cover(context,image,0,220,1080,830);
 context.fillStyle=background;context.fillRect(0,1050,1080,870);
 context.fillStyle='#c7b58f';context.textAlign='left';context.textBaseline='top';context.font='400 25px "DM Sans", sans-serif';
 const caption=`${deckName(record)} · ${clean(record.cardName)||COPY[locale==='uk'?'uk':'en'].card}`;
 const captions=wrapKeepsakeText(context,caption,844);captions.slice(0,2).forEach((line,index)=>context.fillText(line,118,1120+index*35));
 let fontSize=70,lines=[];
 do{context.font=`400 ${fontSize}px "Cormorant Garamond", Georgia, serif`;lines=wrapKeepsakeText(context,words,844);if(lines.length*fontSize*1.16<=465)break;fontSize-=2;}while(fontSize>36);
 const quoteY=1218;context.fillStyle='#f1e9d6';lines.forEach((line,index)=>context.fillText(line,118,quoteY+index*fontSize*1.16));
 oliveImpression(context,540,1760);context.textAlign='center';context.font='400 23px "DM Sans", sans-serif';context.fillStyle='#c7b58f';context.fillText('OLIVIA ARCANA',540,1830);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG');return blob;
}

let sequence=0;
/** Mount after the visible reading is ready. getText returns that reading's plain text. */
export function mountReadingKeepsake(host,options={}){
 if(!host||typeof host.replaceChildren!=='function')throw new TypeError('Provide a keepsake host.');
 let config={locale:'en',...options},saved=null,editing=false,draft='',message='',errorCode='',destroyed=false,busy=false,revision=0;
 const id=`reading-keepsake-${++sequence}`,objectURLs=new Set();
 const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const storage=()=>config.storage||globalThis.localStorage;
 const copy=()=>COPY[config.locale==='uk'?'uk':'en'];
 const readText=()=>{try{return typeof config.getText==='function'?config.getText():config.record?.guidance?.synthesis||config.record?.meaning||'';}catch{return '';}};
 const report=code=>{errorCode=code;message=code==='STORAGE_CORRUPT'?copy().corrupt:code==='STORAGE_LIMIT'?copy().full:code==='TEXT'?copy().invalid:copy().storageError;};
 function reload(){saved=null;errorCode='';message='';if(!validRecord(config.record))return;try{saved=loadReadingKeepsakes(storage()).find(entry=>entryIdentity(entry)===identity(config.record))||null;}catch(error){report(error.code);}}
 function focus(selector){host.querySelector(selector)?.focus({preventScroll:true});}
 function announce(){const status=host.querySelector('.keepsake-status');if(status){status.textContent=message;status.dataset.error=String(Boolean(errorCode));}}
 function startEdit(){
  const choices=readingSentenceChoices(readText(),config.locale);if(!saved&&!choices.length){message=copy().notReady;announce();return;}
  editing=true;draft=saved?.text||choices[0];if(!errorCode)message='';render();focus('textarea');
 }
 async function download(button,text){
  if(busy)return;const currentRevision=revision;busy=true;button.disabled=true;button.textContent=copy().downloading;message=copy().downloading;errorCode='';announce();
  try{
   const record={...config.record,cardName:saved&&!editing?saved.cardName:config.record.cardName},blob=await createKeepsakeWallpaper({record,text,assets:config.assets,locale:config.locale});
   if(destroyed||currentRevision!==revision)return;
   const url=URL.createObjectURL(blob);objectURLs.add(url);const anchor=make('a');anchor.href=url;anchor.download=`${deckName(record).toLowerCase()}-words-${String(record.cardId).padStart(2,'0')}.png`;anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();
   setTimeout(()=>{URL.revokeObjectURL(url);objectURLs.delete(url);},30000);message=copy().exported;
  }catch{if(!destroyed&&currentRevision===revision){message=copy().exportError;errorCode='EXPORT';}}
  finally{if(!destroyed&&currentRevision===revision){busy=false;button.disabled=false;button.textContent=copy().download;announce();}}
 }
 function render(){
  if(destroyed)return;host.replaceChildren();
  const choices=readingSentenceChoices(readText(),config.locale);host.hidden=!validRecord(config.record)||(!saved&&!choices.length);if(host.hidden)return;
  const c=copy(),section=make('section','reading-keepsake');section.dataset.noTranslate='true';section.dataset.deck=deckOf(config.record);section.dataset.state=editing?'editing':saved?'kept':'new';section.setAttribute('aria-labelledby',id+'-title');
  const title=make('h3','keepsake-title',c.title);title.id=id+'-title';section.append(title);
  const status=make('p','keepsake-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.id=id+'-status';
  if(editing){
   const help=make('p','keepsake-intro',c.help);section.append(help);
   const form=make('form','keepsake-editor');
   if(choices.length){
    const sourceLabel=make('label','keepsake-label',c.source);sourceLabel.htmlFor=id+'-source';const select=make('select','keepsake-source');select.id=id+'-source';
    const placeholder=make('option','',c.source);placeholder.value='';select.append(placeholder);
    choices.forEach((sentence,index)=>{const option=make('option','',sentence);option.value=String(index);if(sentence===draft)option.selected=true;select.append(option);});
    select.addEventListener('change',()=>{if(select.value==='')return;input.value=choices[Number(select.value)];draft=input.value;count.textContent=c.count(draft.length);input.setCustomValidity('');focus('textarea');});form.append(sourceLabel,select);
   }
   const label=make('label','keepsake-label',c.words);label.htmlFor=id+'-words';const input=make('textarea','keepsake-words');input.id=id+'-words';input.value=draft;input.rows=3;input.maxLength=KEEPSAKE_TEXT_LIMIT;input.required=true;input.setAttribute('aria-describedby',id+'-count '+id+'-privacy');
   const count=make('span','keepsake-count',c.count(draft.length));count.id=id+'-count';
   input.addEventListener('input',()=>{draft=input.value;count.textContent=c.count(draft.length);input.setCustomValidity('');});
   const actions=make('div','keepsake-actions'),keep=make('button','keepsake-primary',saved?c.update:c.keep);keep.type='submit';
   const cancel=make('button','keepsake-text-action',c.cancel);cancel.type='button';cancel.addEventListener('click',()=>{editing=false;draft='';if(!errorCode)message='';render();focus(saved?'.keepsake-edit':'.keepsake-primary');});actions.append(keep,cancel);
   form.addEventListener('submit',event=>{event.preventDefault();try{normalizeKeepsakeText(input.value);saved=saveReadingKeepsake(storage(),{record:config.record,text:input.value,locale:config.locale});editing=false;errorCode='';message=c.kept;render();focus('.keepsake-preview');}catch(error){report(error.code);if(error.code==='TEXT'){input.setCustomValidity(c.invalid);input.reportValidity();}announce();}});
   form.append(label,input,count,actions);section.append(form);
   const exportDraft=make('button','keepsake-text-action keepsake-export',c.download);exportDraft.type='button';exportDraft.addEventListener('click',()=>{try{download(exportDraft,normalizeKeepsakeText(input.value));}catch(error){report(error.code);announce();input.focus();}});section.append(exportDraft);
  }else if(saved){
   const preview=make('figure','keepsake-preview');preview.tabIndex=-1;preview.setAttribute('aria-label',c.savedLabel);
   const src=artSource(config.assets,config.record);if(src){const art=make('img','keepsake-art');art.src=src;art.alt='';art.loading='lazy';preview.append(art);}
   const words=make('div','keepsake-preview-copy'),quote=make('blockquote','',saved.text),caption=make('figcaption','',`${saved.cardName} · ${deckName(saved)}`);words.append(quote,caption);preview.append(words);section.append(preview);
   const actions=make('div','keepsake-actions'),exportButton=make('button','keepsake-primary',c.download);exportButton.type='button';exportButton.addEventListener('click',()=>download(exportButton,saved.text));
   const edit=make('button','keepsake-text-action keepsake-edit',c.edit);edit.type='button';edit.addEventListener('click',startEdit);
   const remove=make('button','keepsake-text-action keepsake-remove',c.remove);remove.type='button';remove.addEventListener('click',()=>{try{removeReadingKeepsake(storage(),config.record);saved=null;editing=false;errorCode='';message=c.removed;render();focus('.keepsake-primary');}catch(error){report(error.code);announce();}});actions.append(exportButton,edit,remove);section.append(actions);
  }else{
   section.append(make('p','keepsake-intro',c.intro));const choose=make('button','keepsake-primary',c.choose);choose.type='button';choose.addEventListener('click',startEdit);section.append(choose);
  }
  const privacy=make('p','keepsake-note',c.privacy);privacy.id=id+'-privacy';section.append(privacy);if(saved||editing)section.append(make('p','keepsake-note keepsake-wallpaper-note',c.wallpaperNote));section.append(status);host.append(section);announce();
 }
 function onStorage(event){if(event.key!==KEEPSAKE_STORAGE_KEY||editing)return;reload();render();}
 globalThis.addEventListener?.('storage',onStorage);reload();render();
 return {update(next={}){const prior=validRecord(config.record)?identity(config.record):'';config={...config,...next};revision++;busy=false;if(!validRecord(config.record)||identity(config.record)!==prior){editing=false;draft='';reload();}else if(!editing)reload();render();},destroy(){destroyed=true;revision++;globalThis.removeEventListener?.('storage',onStorage);objectURLs.forEach(url=>URL.revokeObjectURL(url));objectURLs.clear();host.replaceChildren();host.hidden=true;}};
}
