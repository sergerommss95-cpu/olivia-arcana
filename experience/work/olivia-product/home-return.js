import {getMetadata,listRevisits,localDate} from './practice-core.js';

/** A scheduled return has priority; otherwise offer the last kept reflection. */
export function chooseReturnReflection(records,metadata,today=localDate()){
 const available=new Map(records.map(entry=>[`${entry.kind}:${entry.record.id}`,entry]));
 const due=listRevisits(metadata,today).due.find(entry=>available.has(`${entry.kind}:${entry.id}`));
 const entry=due?available.get(`${due.kind}:${due.id}`):[...records].sort((a,b)=>b.record.createdAt.localeCompare(a.record.createdAt))[0];
 return entry?{...entry,meta:getMetadata(metadata,entry.kind,entry.record.id),due:!!due}:null;
}

export function renderHomeReturn(host,entry,{assets,locale='en',open}={}){
 if(!host)return;host.replaceChildren();host.hidden=!entry;if(!entry)return;
 host.dataset.noTranslate='';const uk=locale==='uk';host.setAttribute('aria-label',uk?'Ваш попередній погляд':'Your earlier reflection');
 const el=(tag,text)=>{const node=host.ownerDocument.createElement(tag);if(text)node.textContent=text;return node;};
 const image=el('img');image.src=assets.forRecord(entry.record).cards[entry.record.cardId??entry.record.cardIds[0]];image.alt='';image.loading='lazy';image.width=84;image.height=144;
 const copy=el('div'),label=el('p',uk?'ДУМКА, ДО ЯКОЇ МОЖНА ПОВЕРНУТИСЯ':'A THOUGHT TO RETURN TO');label.className='home-mini-label';
 const title=el('h2',entry.meta.title||entry.record.question||(uk?'Ваш попередній погляд':'Your earlier perspective'));
 const original=el('blockquote',entry.meta.originalResponse||entry.record.note||(uk?'Що Ви помічаєте тепер?':'What do you notice now?'));
 const help=el('p',uk?'Ваші початкові слова залишаться. Додайте те, що змінилося, і один наступний крок.':'Your original words stay. Add what changed and one next step.');
 const button=el('button',uk?'Тоді · Тепер · Далі ↗':'Then · Now · Next ↗');button.type='button';button.className='text-action';button.addEventListener('click',()=>open(entry));
 copy.append(label,title,original,help,button);host.append(image,copy);
}
