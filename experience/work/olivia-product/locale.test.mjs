import test from 'node:test';
import assert from 'node:assert/strict';
import { TAROT_CARDS } from './deck-catalog.js';
import { UK_CARDS } from './locale-uk.js';
import { t, translateMarkup, localizeCardNotes, localizeSpreadReading } from './locale.js';
import { SPREADS, buildSpreadReading } from './spread-content.js';
import { createSpreadSession, selectSpreadCard, revealAll, createSpreadRecord } from './spread-core.js';

test('every stable deck identity has complete Ukrainian core content', () => {
  assert.equal(TAROT_CARDS.length, 78);
  for (const card of TAROT_CARDS) {
    const uk = UK_CARDS[card.name];
    assert.ok(uk, card.name);
    for (const field of ['name', 'upright', 'reversed', 'advice']) assert.match(uk[field], /[А-Яа-яІіЇїЄєҐґ]/u, `${card.name}: ${field}`);
    assert.ok(uk.keywords.length >= 2);
  }
});

test('server translation preserves script bytes, stable IDs and navigation routes', () => {
  const script = '<script>const text="Today"; const less = 1 < 2; const data={question:"Work"};</script>';
  const html = '<html lang="en"><a id="reading" href="#question">Begin a reading</a><a class="language-link" href="/uk/" lang="uk" hreflang="uk" data-language="uk">Українська</a><textarea id="question" placeholder="What would I like to see more clearly?"></textarea>' + script + '</html>';
  const uk = translateMarkup(html);
  assert.ok(uk.includes(script));
  assert.ok(uk.includes('id="reading" href="#question"'));
  assert.ok(uk.includes('<html lang="uk">'));
  assert.ok(uk.includes('Почати читання'));
  assert.ok(uk.includes('Що я хочу побачити ясніше?'));
  assert.ok(uk.includes('href="/" lang="en" hreflang="en" data-language="en">English</a>'));
});

test('translation leaves arbitrary questions unchanged and handles authored dynamic labels', () => {
  assert.equal(t('Should I leave this job and move to Kyiv?', 'uk'), 'Should I leave this job and move to Kyiv?');
  assert.equal(t('The Moon', 'uk'), 'Місяць');
  assert.equal(t('The Moon', 'en'), 'The Moon');
  assert.equal(t('3 cards · Your guided reading', 'uk'), '3 карти · Ваш розклад');
  assert.equal(t('2 of 5 chosen · Path B', 'uk'), '2 з 5 обрано · Шлях Б');
});

test('localization preserves the draw and explicitly uses reversed meaning when requested', () => {
  const note = { meaning: 'English meaning', prompt: 'English prompt' };
  assert.equal(localizeCardNotes(18, note, { locale: 'en' }), note);
  const localized = localizeCardNotes(18, note, { locale: 'uk', reversed: true });
  assert.equal(localized.meaning, UK_CARDS['The Moon'].reversed);
  for (const definition of SPREADS) {
    const ids = Array.from({ length: definition.count }, (_, i) => i + 20);
    const source = { ...buildSpreadReading(definition, ids), question: 'My own exact question' };
    const snapshot = JSON.stringify(source);
    const reading = localizeSpreadReading(source, definition, 'uk');
    assert.deepEqual(reading.cards.map(card => card.cardId), ids);
    assert.deepEqual(reading.cards.map(card => card.positionId), source.cards.map(card => card.positionId));
    assert.deepEqual(reading.cards.map(card => card.label), source.cards.map(card => card.label));
    assert.equal(reading.question, source.question);
    assert.equal(JSON.stringify(source), snapshot);
    assert.ok(reading.synthesis.paragraphs.every(value => /[А-Яа-яІіЇїЄєҐґ]/u.test(value)));
  }
});

test('a Ukrainian spread can be saved with its original card and position identities', () => {
  for (const definition of SPREADS) {
    let session = createSpreadSession({ spreadId: definition.id, count: definition.count, question: 'Моє власне запитання' });
    for (let i = 0; i < definition.count; i++) session = selectSpreadCard(session, i);
    session = revealAll(session);
    const reading = localizeSpreadReading(buildSpreadReading(definition, session.cardIds), definition, 'uk');
    const record = createSpreadRecord(session, definition, reading);
    assert.equal(record.question, 'Моє власне запитання');
    assert.deepEqual(record.cardIds, session.cardIds);
    assert.match(record.synthesis.paragraphs[0], /[А-Яа-яІіЇїЄєҐґ]/u);
  }
});
