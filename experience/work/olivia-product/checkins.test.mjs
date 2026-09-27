import test from 'node:test';
import assert from 'node:assert/strict';
import {CHECK_IN_CHOICES, addDays, checkInStatus, dueCheckIns, formatDay, checkInCopy} from './checkins.js';

const meta = fields => ({kind: 'single', id: 'a', topic: '', nextStep: '', revisitDate: '', outcome: '', reviewedAt: null, ...fields});

test('calendar arithmetic crosses months, years and leap days without clock changes', () => {
 assert.equal(addDays('2026-09-27', 3), '2026-09-30');
 assert.equal(addDays('2026-09-27', 7), '2026-10-04');
 assert.equal(addDays('2026-12-29', 7), '2027-01-05');
 assert.equal(addDays('2028-02-27', 2), '2028-02-29');
 assert.equal(addDays('2027-02-27', 2), '2027-03-01');
 // The last Sunday of March and October (daylight-saving changes in Europe).
 assert.equal(addDays('2027-03-27', 1), '2027-03-28');
 assert.equal(addDays('2026-10-24', 7), '2026-10-31');
 assert.equal(addDays('2026-10-04', -7), '2026-09-27');
 assert.throws(() => addDays('27/09/2026', 1), TypeError);
 assert.throws(() => addDays('2026-09-27', 1.5), TypeError);
});

test('the three quick choices are a few days, a week and a month', () => {
 assert.deepEqual(CHECK_IN_CHOICES.map(([, days]) => days), [3, 7, 30]);
});

test('a check-in is none, upcoming, due or reviewed', () => {
 assert.equal(checkInStatus(meta({}), '2026-09-27'), 'none');
 assert.equal(checkInStatus(meta({revisitDate: '2026-10-04'}), '2026-09-27'), 'upcoming');
 assert.equal(checkInStatus(meta({revisitDate: '2026-10-04'}), '2026-10-04'), 'due');
 assert.equal(checkInStatus(meta({revisitDate: '2026-10-04'}), '2026-11-01'), 'due');
 assert.equal(checkInStatus(meta({revisitDate: '2026-10-04', reviewedAt: '2026-10-04T08:00:00.000Z'}), '2026-10-05'), 'reviewed');
 assert.equal(checkInStatus(meta({reviewedAt: '2026-10-04T08:00:00.000Z'}), '2026-10-05'), 'reviewed');
 assert.equal(checkInStatus(null, '2026-10-05'), 'none');
});

test('only due, unreviewed check-ins of readings that are still kept are waiting, oldest first', () => {
 const metadata = [
  meta({id: 'later', revisitDate: '2026-10-10'}),
  meta({id: 'due-2', revisitDate: '2026-10-03'}),
  meta({id: 'reviewed', revisitDate: '2026-09-30', reviewedAt: '2026-10-01T09:00:00.000Z'}),
  meta({id: 'removed', revisitDate: '2026-09-29'}),
  meta({kind: 'spread', id: 'due-1', revisitDate: '2026-09-30'}),
  meta({id: 'none'}),
 ];
 const singles = ['later', 'due-2', 'reviewed', 'none'].map(id => ({id, cardName: 'The Star'}));
 const spreads = [{id: 'due-1', spreadName: 'Clarity'}];
 const due = dueCheckIns({metadata, singles, spreads, today: '2026-10-04'});
 assert.deepEqual(due.map(entry => [entry.kind, entry.meta.id]), [['spread', 'due-1'], ['single', 'due-2']]);
 assert.equal(due[0].record.spreadName, 'Clarity');
 assert.deepEqual(dueCheckIns({metadata: [], singles, spreads, today: '2026-10-04'}), []);
});

test('dates read naturally in Ukrainian, with or without the weekday', () => {
 assert.equal(formatDay('2026-10-04', 'uk'), '4 жовтня');
 assert.equal(formatDay('2026-10-04', 'uk', {weekday: true}), 'неділя, 4 жовтня');
 assert.equal(formatDay('2026-10-04', 'en', {weekday: true}, 'en-GB'), 'Sunday 4 October');
});

test('the waiting count agrees in number in both languages', () => {
 const en = checkInCopy('en'), uk = checkInCopy('uk');
 assert.equal(en.waiting(1), '1 check-in waiting');
 assert.equal(en.waiting(3), '3 check-ins waiting');
 assert.equal(uk.waiting(1), 'на вас чекає 1 повернення');
 assert.equal(uk.waiting(2), 'на вас чекають 2 повернення');
 assert.equal(uk.waiting(5), 'на вас чекають 5 повернень');
 assert.equal(uk.waiting(11), 'на вас чекають 11 повернень');
 assert.equal(uk.waiting(21), 'на вас чекає 21 повернення');
 assert.equal(uk.waiting(24), 'на вас чекають 24 повернення');
});

test('Ukrainian copy uses the formal address, «» quotes and the typographic apostrophe', () => {
 const uk = checkInCopy('uk');
 const strings = Object.values(uk).flatMap(value => typeof value === 'function' ? [value('X')] : typeof value === 'object' ? Object.values(value) : [value]);
 const text = strings.join(' ');
 assert.doesNotMatch(text, /(^|[^а-яіїєґ’])(ти|тебе|тобі|твій|твоя|твоє|твої)([^а-яіїєґ’]|$)/iu);
 assert.doesNotMatch(text, /[а-яіїєґ]'[а-яіїєґ]/iu);
 assert.equal(uk.quote('Як бути?'), '«Як бути?»');
 assert.equal(checkInCopy('fr'), checkInCopy('en'));
});
