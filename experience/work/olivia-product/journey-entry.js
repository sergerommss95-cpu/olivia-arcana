import {getLocale} from './locale.js';
import {MEMBERSHIP_LIVE} from './membership.js';
/** A question first; a small, explained recommendation instead of a catalogue. */
export function initReadingEntry({form,input,assets,onMore}) {
 const uk=getLocale()==='uk',copy=(en,ua)=>uk?ua:en;
 let chosen=null;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
 const recommendation=el('section','reading-recommendation');recommendation.dataset.noTranslate='true';
 const art=el('div','recommendation-art');art.setAttribute('aria-hidden','true');
 for(let i=0;i<3;i++){const img=new Image();img.src=assets.back;img.alt='';img.style.setProperty('--i',i);art.append(img);}
 const content=el('div','recommendation-copy'),kicker=el('p','eyebrow'),title=el('h3'),description=el('p'),change=el('details','reading-size-choice');
 const summary=el('summary','',copy('Change the reading','Змінити формат'));change.append(summary);
 const options=el('div','reading-size-options');
 for(const [count,label,detail] of [[1,copy('A fresh perspective','Свіжий погляд'),copy('One card · Free','Одна карта · Безкоштовно')],[3,copy('Untangle a situation','Розібратися в ситуації'),copy('Three cards · Free','Три карти · Безкоштовно')]]){
  const labelNode=el('label'),radio=document.createElement('input');radio.type='radio';radio.name='reading-size';radio.value=count;
  const span=el('span');span.append(el('strong','',label),el('small','',detail));labelNode.append(radio,span);options.append(labelNode);
  radio.addEventListener('change',()=>{chosen=count;render();});
 }
 const more=el('button','quiet-link',MEMBERSHIP_LIVE?copy('Explore five or eight cards · Membership ↗','П’ять або вісім карт · Підписка ↗'):copy('Explore five or eight cards ↗','П’ять або вісім карт ↗'));more.type='button';more.addEventListener('click',onMore);options.append(more);change.append(options);
 content.append(kicker,title,description,change);recommendation.append(art,content);
 input.after(recommendation);
 const examples=el('details','question-examples');examples.dataset.noTranslate='true';examples.append(el('summary','',copy('Need a little inspiration?','Потрібне натхнення?')));
 for(const example of (uk?['Що допоможе мені зробити наступний крок?','Що я можу побачити інакше в цих стосунках?','Чому варто приділити увагу сьогодні?']:['What could help me take the next step?','What could I see differently in this relationship?','What deserves my attention today?'])){
  const b=el('button','',example);b.type='button';b.addEventListener('click',()=>{input.value=example;input.dispatchEvent(new Event('input',{bubbles:true}));examples.open=false;input.focus();});examples.append(b);
 }
 input.before(examples);
 const getCount=()=>chosen??(input.value.trim()?3:1);
 function render(){const count=getCount();recommendation.dataset.count=count;kicker.textContent=copy('A PLACE TO BEGIN · FREE','З ЧОГО ПОЧАТИ · БЕЗКОШТОВНО');title.textContent=count===1?copy('One card. A fresh perspective.','Одна карта. Свіжий погляд.'):copy('Three cards. A little clarity.','Три карти. Трохи ясності.');description.textContent=count===1?copy('A simple reflection, with or without a question.','Простий роздум — із запитанням чи без нього.'):copy('Your situation, what complicates it, and a helpful next step.','Ситуація, її складність і корисний наступний крок.');for(const radio of options.querySelectorAll('input'))radio.checked=Number(radio.value)===count;const submit=form.querySelector('button[type=submit]');submit.textContent=count===1?copy('Choose my card ↗','Обрати мою карту ↗'):copy('Choose my three cards ↗','Обрати мої три карти ↗');}
 input.addEventListener('input',render);render();return {getCount,refresh:render,setCount(count){chosen=count;render();},setPlan(plan){chosen=3;render();title.textContent=plan.spreadName||title.textContent;description.textContent=plan.positions.map(p=>p.label).join(' · ');}};
}

export function simplifyPreferences(form,checkbox,locale='en'){
 const details=document.createElement('details');details.className='reading-preferences';details.dataset.noTranslate='true';const summary=document.createElement('summary');summary.textContent=locale==='uk'?'Тема й перевернуті карти · Необов’язково':'Topic & reversed cards · Optional';details.append(summary);const fieldset=form.querySelector('fieldset');fieldset.before(details);details.append(fieldset,checkbox.closest('label'));return details;
}

export function readingSteps(active,locale='en'){
 const nav=document.createElement('ol');nav.className='reading-steps';nav.dataset.noTranslate='true';nav.setAttribute('aria-label',locale==='uk'?'Етапи читання':'Your reading');
 (locale==='uk'?['Запитання','Вибір карт','Ваше читання']:['Your question','Choose your cards','Your reading']).forEach((name,i)=>{const li=document.createElement('li');li.textContent=name;li.dataset.step=i+1;if(i===active)li.setAttribute('aria-current','step');if(i<active)li.className='is-done';nav.append(li);});return nav;
}

export function simplifySaving(section,input,locale='en'){
 const notes=document.createElement('details');notes.className='reading-notes';notes.dataset.noTranslate='true';
 const summary=document.createElement('summary');summary.textContent=locale==='uk'?'Додати свій роздум · Необов’язково':'Add your reflection · Optional';notes.append(summary);
 const label=section.querySelector(`label[for="${input.id}"]`),actions=section.querySelector('.save-actions');actions.after(notes);notes.append(label,input);
 return notes;
}
