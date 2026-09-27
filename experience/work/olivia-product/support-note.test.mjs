import test from 'node:test';
import assert from 'node:assert/strict';
import {needsSupport} from './support-note.js';

test('recognises clear self-harm and danger language in English, Ukrainian and Russian', () => {
  for (const question of [
    'I keep thinking about suicide. Is there a way out?',
    'Should I just end my life',
    'I want to die and nothing helps',
    'I don’t want to live anymore',
    'I have been hurting myself again',
    'I am in danger at home, what do the cards say?',
    'Я думаю про самогубство',
    'Не хочу жити, що мені робити?',
    'Хочу покінчити з собою',
    'Іноді хочеться вбити себе',
    'Я заподіяла собі шкоди',
    'Мені небезпечно вдома',
    'Не хочу жить',
    'Хочу покончить с собой',
  ]) assert.equal(needsSupport(question), true, question);
});

test('leaves ordinary questions about endings, change and effort alone', () => {
  for (const question of [
    'Should I end my relationship?',
    'Is it time to end this chapter at work?',
    'How do I cut myself off from a draining friendship?',
    'What does the Death card mean for my career change?',
    'Is my business in danger of losing its focus?',
    'Чи варто завершити ці стосунки?',
    'Що означає карта Смерть для моєї нової роботи?',
    'Як мені відпустити минуле?',
    'Як убезпечити себе фінансово?',
    'I’m killing it at work lately — what next?',
    '',
  ]) assert.equal(needsSupport(question), false, question);
  assert.equal(needsSupport(undefined), false);
});
