import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyReminder } from './calendar-reminder.js';
const unfold = file => file.replace(/\r\n /g,'');
function field(file,name){return unfold(file).split('\r\n').find(line=>line.startsWith(name+':'))?.slice(name.length+1);}
function localDate(year,month,day,hour,minute,second=0){return new Date(year,month-1,day,hour,minute,second);}

test('calendar repeats daily, starts in the future, ends five minutes later and requests a start alert',()=>{
 const file=buildDailyReminder({time:'09:00',locale:'en',now:localDate(2026,9,25,8,30)});
 assert.equal(field(file,'DTSTART'),'20260925T090000');assert.equal(field(file,'DTEND'),'20260925T090500');
 assert.equal(field(file,'RRULE'),'FREQ=DAILY');assert.match(file,/TRIGGER;RELATED=START:PT0S\r\n/);
 assert.match(file,/BEGIN:VALARM\r\nACTION:DISPLAY/);assert.equal(field(file,'URL'),'https://oliviaarcana.com/?experience=today');
 assert.ok(file.endsWith('END:VCALENDAR\r\n'));assert.ok(!/(?<!\r)\n/.test(file));assert.match(field(file,'DTSTAMP'),/^\d{8}T\d{6}Z$/);
});
test('an elapsed or identical chosen time schedules tomorrow, including year rollover',()=>{
 for(const now of [localDate(2026,12,31,9,0),localDate(2026,12,31,9,0,1),localDate(2026,12,31,22,0)]) {
  assert.equal(field(buildDailyReminder({time:'09:00',now}),'DTSTART'),'20270101T090000');
 }
 const late=buildDailyReminder({time:'23:58',now:localDate(2026,12,31,23,57)});
 assert.equal(field(late,'DTEND'),'20270101T000300');
});
test('Ukrainian stays intact after UTF-8-safe line folding, with no line over 75 octets',()=>{
 const file=buildDailyReminder({time:'10:00',locale:'uk',now:localDate(2026,9,25,8,0)});
 assert.equal(field(file,'SUMMARY'),'Мить з Olivia Arcana');assert.equal(field(file,'URL'),'https://oliviaarcana.com/uk/?experience=today');
 assert.match(field(file,'DESCRIPTION'),/Приділіть п’ять хвилин/);
 for(const line of file.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
 assert.doesNotMatch(unfold(file),/�/);
});
test('calendar input cannot inject fields or private content',()=>{
 for(const time of ['9:00','24:00','12:60','09:00\r\nATTENDEE:private@example.com','',null])assert.throws(()=>buildDailyReminder({time}));
 assert.throws(()=>buildDailyReminder({time:'09:00',locale:'ru'}));assert.throws(()=>buildDailyReminder({time:'09:00',now:new Date('invalid')}));
 const file=buildDailyReminder({time:'09:00',question:'Private job question',journal:'Secret note',now:localDate(2026,9,25,8,0)});
 assert.doesNotMatch(file,/Private job|Secret note|ATTENDEE|ORGANIZER|mailto:/);
});
test('floating time stays local across daylight-saving changes; nonexistent spring clock time is skipped',()=>{
 const oldTZ=process.env.TZ;
 try {
  process.env.TZ='America/New_York';
  const spring=buildDailyReminder({time:'02:30',now:localDate(2026,3,8,1,0)});
  assert.equal(field(spring,'DTSTART'),'20260309T023000');
  const autumn=buildDailyReminder({time:'09:00',now:localDate(2026,10,31,10,0)});
  assert.equal(field(autumn,'DTSTART'),'20261101T090000');assert.equal(field(autumn,'DTEND'),'20261101T090500');
  assert.doesNotMatch(autumn,/DTSTART[^\r\n]*(Z|TZID)/);
 }finally { if(oldTZ===undefined)delete process.env.TZ;else process.env.TZ=oldTZ; }
});
