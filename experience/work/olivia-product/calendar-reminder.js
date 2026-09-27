// RFC 5545 calendar export. No push permission, subscription, network or journal access.
const pad = value => String(value).padStart(2, '0');
const localStamp = date => `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
const utcStamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const escapeText = value => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const COPY = {
 en: {
  title:'Make a little room each day.',
  intro:'Add a five-minute daily reminder to your own calendar, at a time that suits you.',
  label:'Your local time',download:'Download calendar reminder ↗',
  note:'Import the file into your calendar and confirm its notification settings. Olivia does not send push notifications. To change or stop reminders, edit or delete the recurring event in your calendar.',
  privacy:'Only a link to Today is included. Your question, cards and journal stay out of the calendar file.',
  done:'Calendar file downloaded. Open it in your calendar, confirm the daily repeat and enable an alert there. Downloading alone does not activate notifications.',
  error:'The reminder could not be downloaded. Check the time and try again.',
  summary:'A moment with Olivia Arcana',
  description:'Take five minutes for a card and a reflection. Open Today when you are ready. Enable alerts in your calendar if you want a notification. Edit or delete this recurring event in your calendar to change or stop reminders.',
 },
 uk: {
  title:'Трохи простору щодня.',
  intro:'Додайте до свого календаря щоденне нагадування на п’ять хвилин — у зручний для вас час.',
  label:'Ваш місцевий час',download:'Завантажити нагадування ↗',
  note:'Імпортуйте файл до календаря й перевірте налаштування сповіщень. Olivia не надсилає push-сповіщень. Щоб змінити або вимкнути нагадування, відредагуйте чи видаліть повторювану подію у своєму календарі.',
  privacy:'Файл містить лише посилання на «Сьогодні». Ваше запитання, обрані карти й записи альманаху до нього не потрапляють.',
  done:'Файл календаря завантажено. Відкрийте його у своєму календарі, підтвердьте щоденне повторення та ввімкніть сповіщення. Саме завантаження не активує нагадувань.',
  error:'Не вдалося завантажити нагадування. Перевірте час і спробуйте ще раз.',
  summary:'Мить з Olivia Arcana',
  description:'Приділіть п’ять хвилин карті та власним роздумам. Відкрийте «Сьогодні», коли будете готові. Для сповіщень увімкніть нагадування у своєму календарі. Щоб змінити або вимкнути нагадування, відредагуйте чи видаліть цю повторювану подію в календарі.',
 },
};
// Fold at 75 octets without splitting UTF-8 code points; continuation starts with one space.
function foldLine(line) {
 const encoder = new TextEncoder();
 let output='', current='', bytes=0;
 for (const character of line) {
  const size=encoder.encode(character).length;
  if(bytes+size>75){output+=current+'\r\n';current=' ';bytes=1;}
  current+=character;bytes+=size;
 }
 return output+current;
}

export function buildDailyReminder({time,locale='en',now=new Date()}={}) {
 if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new TypeError('Choose a local time in HH:MM format.');
 if(locale!=='en'&&locale!=='uk')throw new TypeError('Choose English or Ukrainian.');
 if(!(now instanceof Date)||!Number.isFinite(now.getTime())||now.getFullYear()<1970||now.getFullYear()>9998)throw new TypeError('Use a valid current date.');
 const [hour,minute]=time.split(':').map(Number);
 let start;
 // A nonexistent clock time on the spring daylight-saving transition is skipped.
 // The first event always starts at the chosen local time and strictly after now.
 for(let offset=0;offset<8;offset++) {
  const candidate=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset,hour,minute,0,0);
  if(candidate>now&&candidate.getHours()===hour&&candidate.getMinutes()===minute){start=candidate;break;}
 }
 if(!start)throw new RangeError('No upcoming local time could be found.');
 // Work in civil time for the floating DTEND so the event stays five wall-clock minutes.
 const end=new Date(Date.UTC(start.getFullYear(),start.getMonth(),start.getDate(),hour,minute+5));
 const url=`https://oliviaarcana.com/${locale==='uk'?'uk/':''}?experience=today`;
 const copy=COPY[locale];
 const lines=[
  'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Olivia Arcana//Daily reflection//EN','CALSCALE:GREGORIAN',
  'BEGIN:VEVENT',`UID:olivia-daily-${now.getTime()}-${hour}${pad(minute)}@oliviaarcana.com`,
  `DTSTAMP:${utcStamp(now)}`,`DTSTART:${localStamp(start)}`,`DTEND:${utcStamp(end).slice(0,-1)}`,
  'RRULE:FREQ=DAILY',`SUMMARY:${escapeText(copy.summary)}`,`DESCRIPTION:${escapeText(copy.description+'\n'+url)}`,
  `URL:${url}`,'TRANSP:TRANSPARENT','CLASS:PRIVATE','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER;RELATED=START:PT0S',
  `DESCRIPTION:${escapeText(copy.summary)}`,'END:VALARM','END:VEVENT','END:VCALENDAR',
 ];
 return lines.map(foldLine).join('\r\n')+'\r\n';
}

let reminderCount=0;
export function initCalendarReminder(container,{locale}={}) {
 if(!container||typeof container.replaceChildren!=='function')throw new TypeError('Provide a reminder container.');
 const language=locale||container.dataset.calendarLocale||(document.documentElement.lang==='uk'?'uk':'en');
 if(!COPY[language])throw new TypeError('Choose English or Ukrainian.');
 const copy=COPY[language], id=`calendar-reminder-${++reminderCount}`;
 const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
 const section=element('section','calendar-reminder');section.setAttribute('aria-labelledby',id+'-title');
 const title=element('h2','',copy.title);title.id=id+'-title';
 const intro=element('p','',copy.intro), form=element('form','calendar-reminder-form');
 const label=element('label','',copy.label);label.htmlFor=id+'-time';
 const input=element('input','');input.type='time';input.id=id+'-time';input.name='reminder-time';input.value='09:00';input.required=true;input.setAttribute('aria-describedby',id+'-note');
 const button=element('button','solid-action',copy.download);button.type='submit';
 const note=element('p','privacy-note',copy.note);note.id=id+'-note';
 const privacy=element('p','privacy-note',copy.privacy), status=element('p','calendar-reminder-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(label,input,button);section.append(title,intro,form,note,privacy,status);container.replaceChildren(section);
 const onSubmit=event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  let url;
  try {
   const file=buildDailyReminder({time:input.value,locale:language});
   url=URL.createObjectURL(new Blob([file],{type:'text/calendar;charset=utf-8'}));
   const link=document.createElement('a');link.href=url;link.download=`olivia-daily-${language}.ics`;link.hidden=true;
   document.body.append(link);link.click();link.remove();
   status.textContent=copy.done;
   // Leave the blob alive long enough for browsers to finish initiating a download.
   setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch{if(url)URL.revokeObjectURL(url);status.textContent=copy.error;}
 };
 form.addEventListener('submit',onSubmit);
 return ()=>form.removeEventListener('submit',onSubmit);
}
