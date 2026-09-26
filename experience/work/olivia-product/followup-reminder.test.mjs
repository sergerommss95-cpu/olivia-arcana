import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCheckInReminder} from './followup-reminder.js';
const unfold=file=>file.replace(/\r\n /g,'');
const field=(file,name)=>unfold(file).split('\r\n').find(line=>line.startsWith(name+':'))?.slice(name.length+1);
const local=(year,month,day,hour=8,minute=0)=>new Date(year,month-1,day,hour,minute,0,0);
const options={date:'2026-10-02',kind:'single',id:'reading-1',now:local(2026,9,25)};

test('exports one five-minute check-in at 09:00 by default with a requested calendar alert',()=>{
 const file=buildCheckInReminder(options);assert.equal(field(file,'DTSTART'),'20261002T090000');assert.equal(field(file,'DTEND'),'20261002T090500');assert.equal(field(file,'SUMMARY'),'A moment to reflect');assert.equal(field(file,'CLASS'),'PRIVATE');assert.equal(field(file,'URL'),'https://oliviaarcana.com/#reading/reading-1');
 assert.doesNotMatch(file,/RRULE|RDATE|RECURRENCE-ID|METHOD:REQUEST|ATTENDEE|ORGANIZER/);assert.equal(file.match(/BEGIN:VEVENT/g).length,1);assert.match(file,/TRIGGER;RELATED=START:PT0S\r\n/);assert.ok(file.endsWith('END:VCALENDAR\r\n'));assert.ok(!/(?<!\r)\n/.test(file));
});
test('time is chosen explicitly, including civil midnight and year rollover',()=>{
 const file=buildCheckInReminder({...options,date:'2026-12-31',time:'23:58'});assert.equal(field(file,'DTSTART'),'20261231T235800');assert.equal(field(file,'DTEND'),'20270101T000300');assert.doesNotMatch(field(file,'DTSTART'),/Z/);
});
test('invalid dates, times, reading IDs and locale cannot become calendar fields',()=>{
 for(const date of ['2026-02-29','2028-02-30','2026-13-01','2026-00-01','2026-04-31','2026-1-01','0000-01-01','9999-12-31','2026-10-02\r\nSUMMARY:bad',null])assert.throws(()=>buildCheckInReminder({...options,date}),e=>e.code==='DATE');
 for(const time of ['9:00','24:00','09:60','09:00\r\nATTENDEE:bad',null])assert.throws(()=>buildCheckInReminder({...options,time}),e=>e.code==='TIME');
 for(const id of ['',null,'x'.repeat(129),'hello\nSUMMARY:bad'])assert.throws(()=>buildCheckInReminder({...options,id}),e=>e.code==='READING');
 assert.throws(()=>buildCheckInReminder({...options,locale:'ru'}));assert.throws(()=>buildCheckInReminder({...options,now:new Date('invalid')}));assert.throws(()=>buildCheckInReminder({...options,baseURL:'file:///private/reading.html'}));
 assert.equal(field(buildCheckInReminder({...options,date:'2028-02-29'}),'DTSTART'),'20280229T090000');
});
test('an elapsed time is rejected without silently moving the chosen check-in date',()=>{
 for(const now of [local(2026,10,2,9),local(2026,10,3)])assert.throws(()=>buildCheckInReminder({...options,now}),e=>e.code==='PAST');
 assert.equal(field(buildCheckInReminder({...options,now:local(2026,10,2,9),time:'10:00'}),'DTSTART'),'20261002T100000');
});
test('calendar content excludes the question, card, topic, action and journal',()=>{
 const file=buildCheckInReminder({...options,question:'Secret question',card:'The secret card',topic:'Private topic',nextStep:'Confidential action',note:'Private note',baseURL:'https://oliviaarcana.com/uk/?private=secret#old'});
 assert.doesNotMatch(file,/Secret question|secret card|Private topic|Confidential action|Private note|private=secret/);assert.equal(field(file,'URL'),'https://oliviaarcana.com/uk/#reading/reading-1');
 assert.equal(field(buildCheckInReminder({...options,kind:'spread'}),'URL'),'https://oliviaarcana.com/#journal');
});
test('Ukrainian text survives UTF-8 line folding and is candid about manual calendar import',()=>{
 const file=buildCheckInReminder({...options,locale:'uk'});assert.equal(field(file,'SUMMARY'),'Мить для роздумів');assert.equal(field(file,'URL'),'https://oliviaarcana.com/uk/#reading/reading-1');assert.match(field(file,'DESCRIPTION'),/Зміни в Olivia не оновлюють/);
 for(const line of file.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.doesNotMatch(unfold(file),/�/);
 assert.equal(field(buildCheckInReminder(options),'UID'),field(buildCheckInReminder({...options,now:local(2026,9,26)}),'UID'),'repeated exports of the same date/time identify the same event');
});
test('nonexistent DST clock times are rejected; valid autumn local time remains selected',()=>{
 const previous=process.env.TZ;try{process.env.TZ='America/New_York';
  assert.throws(()=>buildCheckInReminder({...options,date:'2026-03-08',time:'02:30',now:local(2026,3,7)}),e=>e.code==='CLOCK_CHANGE');
  const autumn=buildCheckInReminder({...options,date:'2026-11-01',time:'09:00',now:local(2026,10,31)});assert.equal(field(autumn,'DTSTART'),'20261101T090000');assert.equal(field(autumn,'DTEND'),'20261101T090500');
 }finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
});
