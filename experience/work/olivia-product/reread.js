/**
 * Return and re-read: when someone opens a reading they kept at least a day
 * ago, invite them to look at the cards again and note what they see now.
 * Each re-reading is a dated note in the reading's question history, so it is
 * backed up, restored and removed with everything else in the almanac.
 */
import {loadQuestionHistory,createQuestionThread,appendQuestionUpdate,questionHistoryHref} from './question-history.js';
import {getLocale,t} from './locale.js';

const DAY=20*60*60*1000;
const COPY={
 en:{kicker:'Returning to this reading',title:'Read it again',lead:date=>`You kept this reading on ${date}. Look at the cards again before you read your old notes. What do you see now that you did not see then?`,leadOne:date=>`You kept this reading on ${date}. Look at the card again before you read your old notes. What do you see now that you did not see then?`,label:'What I see now',placeholder:'A detail, a word, a feeling that stands out today…',save:'Keep this re-reading',saved:'Kept in this question’s history, with today’s date.',error:'This could not be saved. Your writing is still here.',earlier:'Earlier re-readings',history:'Open the whole question history ↗',note:'There is no right answer to find. You are noticing how your view has moved.'},
 uk:{kicker:'Повернення до читання',title:'Прочитайте ще раз',lead:date=>`Ви зберегли це читання ${date}. Погляньте на карти ще раз, перш ніж перечитувати свої нотатки. Що ви бачите тепер, чого не бачили тоді?`,leadOne:date=>`Ви зберегли це читання ${date}. Погляньте на карту ще раз, перш ніж перечитувати свої нотатки. Що ви бачите тепер, чого не бачили тоді?`,label:'Що я бачу тепер',placeholder:'Деталь, слово, відчуття, що вирізняється сьогодні…',save:'Зберегти це перечитування',saved:'Збережено в історії цього запитання з сьогоднішньою датою.',error:'Не вдалося зберегти. Ваш текст лишився тут.',earlier:'Попередні перечитування',history:'Відкрити всю історію запитання ↗',note:'Тут немає правильної відповіді, яку треба знайти. Ви помічаєте, як змінився ваш погляд.'},
};
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};

/** True when a kept reading is old enough to be returned to. */
export function isReturn(record,now=Date.now()){
 const created=Date.parse(record?.createdAt||'');
 return Number.isFinite(created)&&now-created>=DAY;
}

export function mountReread({kind,record,container,storage=()=>localStorage,now=Date.now()}){
 container.parentElement?.querySelector('.reread-panel')?.remove();
 if(!record?.id||!isReturn(record,now))return null;
 const locale=getLocale()==='uk'?'uk':'en',c=COPY[locale],getStorage=()=>typeof storage==='function'?storage():storage;
 const date=new Date(record.createdAt).toLocaleDateString(locale==='uk'?'uk-UA':undefined,{day:'numeric',month:'long',year:'numeric'});
 const panel=node('section','reread-panel');panel.dataset.noTranslate='true';panel.setAttribute('aria-labelledby','reread-title-'+kind);
 const heading=node('h2','',c.title);heading.id='reread-title-'+kind;
 panel.append(node('p','eyebrow',c.kicker),heading,node('p','reread-lead',kind==='single'?c.leadOne(date):c.lead(date)));
 const label=node('label','reread-field'),area=node('textarea');area.rows=3;area.maxLength=2000;area.placeholder=c.placeholder;label.append(node('span','',c.label),area);
 const save=node('button','solid-action',c.save+' ↗');save.type='button';
 const status=node('p','reread-status');status.setAttribute('role','status');
 const earlier=node('div','reread-earlier');
 panel.append(label,save,node('p','reread-note',c.note),status,earlier);
 container.parentElement.insertBefore(panel,container);

 const linked=()=>{try{return loadQuestionHistory(getStorage()).filter(v=>v.readings.some(r=>r.kind===kind&&r.id===record.id));}catch{return [];}};
 function paintEarlier(){
  earlier.replaceChildren();
  const threads=linked(),notes=threads.flatMap(v=>v.updates.filter(u=>u.understood.trim()).map(u=>({...u,threadId:v.id}))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if(!notes.length)return;
  earlier.append(node('p','eyebrow',c.earlier));
  const list=node('ol','reread-list');
  for(const note of notes.slice(0,6)){const item=node('li');item.append(node('time','',new Date(note.date+'T12:00:00').toLocaleDateString(locale==='uk'?'uk-UA':undefined,{day:'numeric',month:'long',year:'numeric'})),node('p','',note.understood));list.append(item);}
  earlier.append(list);
  const link=node('a','quiet-link',c.history);link.href=questionHistoryHref(threads[0].id);earlier.append(link);
 }
 save.addEventListener('click',()=>{
  const text=area.value.trim();if(!text){area.focus();return;}
  try{
   const storage=getStorage();
   let thread=linked()[0];
   if(!thread)thread=createQuestionThread(storage,{title:(record.question||'').trim().slice(0,240)||t(record.cardName||record.spreadName||'My reading'),kind,id:record.id});
   appendQuestionUpdate(storage,{threadId:thread.id,understood:text});
   area.value='';status.textContent=c.saved;paintEarlier();
   dispatchEvent(new Event('olivia:question-history-change'));
  }catch{status.textContent=c.error;}
 });
 paintEarlier();
 return panel;
}
