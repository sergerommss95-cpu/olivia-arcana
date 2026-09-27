// One chosen check-in, exported only after a click. No calendar account or subscription.
const pad=value=>String(value).padStart(2,'0');
const utcStamp=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const escapeText=value=>value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const COPY={
 en:{add:'Add this check-in to my calendar',date:'Saved check-in',time:'Your local time',download:'Download this check-in ↓',note:'Import this one-time event into your calendar and confirm its alert. Downloading alone does not turn on reminders. If you change your check-in here, update or delete the event in your calendar too.',privacy:'The file contains a private reminder title and an Olivia link. Your question, cards, topic and notes are not included. Your reading remains in the browser where you saved it.',done:'Calendar file downloaded. Import it into your calendar and check the date, local time and alert.',error:'The file could not be downloaded. Check the saved date and time, then try again.',past:'Choose a future check-in date in your reading and save it first, or choose a later time today.',clock:'That local time does not exist on this date because the clocks change. Choose another time.',summary:'A moment to reflect',description:'Return to a saved reflection with fresh eyes. Open Olivia in the browser where you saved your reading. Import this one-time event and confirm its alert in your calendar. Changes in Olivia do not update this calendar event.'},
 uk:{add:'Додати це повернення до мого календаря',date:'Збережена дата повернення',time:'Ваш місцевий час',download:'Завантажити це нагадування ↓',note:'Імпортуйте цю одноразову подію до календаря й перевірте її сповіщення. Саме завантаження не вмикає нагадувань. Якщо зміните дату тут, також відредагуйте чи видаліть подію у своєму календарі.',privacy:'Файл містить лише нейтральну назву нагадування та посилання на Olivia. Запитання, карти, тема й нотатки до нього не потрапляють. Читання залишається в браузері, де ви його зберегли.',done:'Файл календаря завантажено. Імпортуйте його до календаря й перевірте дату, місцевий час і сповіщення.',error:'Не вдалося завантажити файл. Перевірте збережену дату й час та спробуйте ще раз.',past:'Оберіть майбутню дату повернення в читанні й збережіть її або оберіть пізніший час сьогодні.',clock:'Через переведення годинника такого місцевого часу в цю дату немає. Оберіть інший час.',summary:'Мить для роздумів',description:'Поверніться до збережених роздумів зі свіжим поглядом. Відкрийте Olivia в браузері, де зберегли читання. Імпортуйте цю одноразову подію й перевірте її сповіщення у календарі. Зміни в Olivia не оновлюють цю подію календаря.'},
};
function failure(code,message){const error=new TypeError(message);error.code=code;throw error;}
function parts(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))failure('DATE','Choose a calendar date.');
 const [year,month,day]=date.split('-').map(Number),leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(year<1970||year>9998||month<1||month>12||day<1||day>days[month-1])failure('DATE','This calendar date does not exist.');return [year,month,day];
}
function fold(line){const encoder=new TextEncoder();let result='',segment='',bytes=0;for(const char of line){const count=encoder.encode(char).length;if(bytes+count>75){result+=segment+'\r\n';segment=' ';bytes=1;}segment+=char;bytes+=count;}return result+segment;}
function fingerprint(text){let n=2166136261;for(const code of text)n=Math.imul(n^code.codePointAt(0),16777619);return (n>>>0).toString(16);}

/** Floating civil time intentionally follows the calendar's local time, without a recurrence. */
export function buildCheckInReminder({date,time='09:00',locale='en',kind='single',id,baseURL,now=new Date()}={}){
 if(!COPY[locale])failure('LOCALE','Choose English or Ukrainian.');
 if(!['single','spread'].includes(kind)||typeof id!=='string'||!id.trim()||id.length>128||/[\r\n]/.test(id))failure('READING','Choose a saved reading.');
 if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))failure('TIME','Choose a local time in HH:MM format.');
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))failure('DATE','Use a valid current date.');
 const [year,month,day]=parts(date),[hour,minute]=time.split(':').map(Number),start=new Date(year,month-1,day,hour,minute,0,0);
 if(start.getFullYear()!==year||start.getMonth()!==month-1||start.getDate()!==day||start.getHours()!==hour||start.getMinutes()!==minute)failure('CLOCK_CHANGE','This local time does not exist on the chosen date.');
 if(start<=now)failure('PAST','Choose a future check-in date and time.');
 const end=new Date(Date.UTC(year,month-1,day,hour,minute+5)),copy=COPY[locale];
 const url=new URL(baseURL||`https://oliviaarcana.com/${locale==='uk'?'uk/':''}`);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password)failure('URL','Use an Olivia web address.');
 url.search='';url.hash=kind==='single'?'reading/'+encodeURIComponent(id):'journal';
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Olivia Arcana//One-time reflection//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:olivia-checkin-${fingerprint(kind+':'+id)}-${date.replaceAll('-','')}-${time.replace(':','')}@oliviaarcana.com`,`DTSTAMP:${utcStamp(now)}`,`DTSTART:${date.replaceAll('-','')}T${pad(hour)}${pad(minute)}00`,`DTEND:${utcStamp(end).slice(0,-1)}`,`SUMMARY:${escapeText(copy.summary)}`,`DESCRIPTION:${escapeText(copy.description+'\n'+url.href)}`,`URL:${url.href}`,'CLASS:PRIVATE','TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER;RELATED=START:PT0S',`DESCRIPTION:${escapeText(copy.summary)}`,'END:VALARM','END:VEVENT','END:VCALENDAR'];
 return lines.map(fold).join('\r\n')+'\r\n';
}

let count=0;
export function mountCheckInReminder(container,{date,kind,id,locale='en',baseURL}={}){
 if(!container||typeof container.replaceChildren!=='function'||!COPY[locale])throw new TypeError('Provide a check-in container and a supported language.');
 const copy=COPY[locale],identity='checkin-reminder-'+(++count);let heldTime='09:00',wasOpen=false;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 function update(nextDate){
  const old=container.querySelector('input');if(old)heldTime=old.value;const prior=container.querySelector('details');if(prior)wasOpen=prior.open;
  container.replaceChildren();container.hidden=!nextDate;if(!nextDate)return;
  const section=el('details','checkin-reminder');section.dataset.noTranslate='true';section.open=wasOpen;const summary=el('summary','',copy.add+' +');
  const controls=el('div','checkin-reminder-controls'),label=el('label','',copy.time),input=el('input');label.htmlFor=identity;input.id=identity;input.type='time';input.value=heldTime;input.required=true;input.setAttribute('aria-describedby',identity+'-note');
  const saved=el('p','checkin-reminder-date',copy.date+' · '+nextDate),download=el('button','text-action',copy.download);download.type='button';const note=el('p','privacy-note',copy.note);note.id=identity+'-note';const privacy=el('p','privacy-note',copy.privacy),status=el('p','checkin-reminder-status');status.setAttribute('role','status');
  controls.append(label,input,download);section.append(summary,saved,controls,note,privacy,status);container.append(section);
  input.addEventListener('input',event=>{event.stopPropagation();heldTime=input.value;status.textContent='';});
  download.addEventListener('click',()=>{if(!input.reportValidity())return;let objectURL;try{
   let currentBase=baseURL;
   if(!currentBase&&['http:','https:'].includes(location.protocol))currentBase=location.origin+location.pathname;
   const file=buildCheckInReminder({date:nextDate,time:input.value,locale,kind,id,baseURL:currentBase});objectURL=URL.createObjectURL(new Blob([file],{type:'text/calendar;charset=utf-8'}));const a=el('a');a.href=objectURL;a.download=`olivia-check-in-${nextDate}.ics`;a.hidden=true;document.body.append(a);a.click();a.remove();status.textContent=copy.done;setTimeout(()=>URL.revokeObjectURL(objectURL),30000);
  }catch(error){if(objectURL)URL.revokeObjectURL(objectURL);status.textContent=error.code==='PAST'?copy.past:error.code==='CLOCK_CHANGE'?copy.clock:copy.error;}});
 }
 update(date);return {update};
}
