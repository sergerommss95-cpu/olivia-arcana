import {SearchMoonPhase} from 'astronomy-engine';

/** Astronomical events, expressed in the visitor's calendar. No birth data or forecasts. */
export function nextLunarCheckIns(now=new Date(), timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw new TypeError('A valid starting date is required.');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
 return [['new',0],['full',180]].map(([phase,angle])=>{
  const result=SearchMoonPhase(angle,new Date(now.getTime()+1000),35);
  if(!result)throw new Error('The next lunar phase could not be calculated.');
  const parts=Object.fromEntries(formatter.formatToParts(result.date).map(p=>[p.type,p.value]));
  return {phase,at:result.date.toISOString(),date:`${parts.year}-${parts.month}-${parts.day}`,timeZone};
 });
}

export function mountLunarCheckIns(container,{input,locale='en',now=new Date()}={}){
 const uk=locale==='uk',box=document.createElement('div');box.className='lunar-checkin';box.dataset.noTranslate='true';
 const label=document.createElement('p');label.textContent=uk?'Або поверніться за ритмом Місяця':'Or return with the rhythm of the Moon';box.append(label);
 try{for(const event of nextLunarCheckIns(now)){
  const b=document.createElement('button');b.type='button';b.className='lunar-date';
  const icon=document.createElement('span');icon.className='lunar-disc '+event.phase;icon.setAttribute('aria-hidden','true');
  const copy=document.createElement('span'),name=document.createElement('strong'),date=document.createElement('span');
  name.textContent=event.phase==='new'?(uk?'Молодик':'New moon'):(uk?'Повня':'Full moon');
  date.textContent=new Intl.DateTimeFormat(uk?'uk-UA':'en-GB',{day:'numeric',month:'short'}).format(new Date(event.date+'T12:00:00'));
  copy.append(name,date);b.append(icon,copy);b.setAttribute('aria-label',(uk?'Обрати дату: ':'Set check-in: ')+name.textContent+', '+date.textContent);
  b.onclick=()=>{input.value=event.date;input.dispatchEvent(new Event('input',{bubbles:true}));for(const sibling of box.querySelectorAll('button'))sibling.setAttribute('aria-pressed',String(sibling===b));};
  b.setAttribute('aria-pressed','false');box.append(b);
 }}catch{box.hidden=true;}
 const note=document.createElement('small');note.textContent=uk?'Дата у вашому часовому поясі. Оберіть і збережіть наступний крок.':'Dates in your time zone. Choose one, then save your next step.';box.append(note);container.append(box);return box;
}
