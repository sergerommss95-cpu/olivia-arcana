import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { oliviaLaunchTarget } = require('./launch.js');
const { oliviaTelegramLink } = require('./adapter.js');

const launchHash = (language) => '#tgWebAppData=' + encodeURIComponent(new URLSearchParams({ user: JSON.stringify({ id: 1, first_name: 'A', language_code: language }), auth_date: '1', hash: 'x' }).toString()) + '&tgWebAppVersion=10.3&tgWebAppPlatform=ios';

test('language comes from the Telegram user, then from a remembered choice', () => {
  assert.match(oliviaLaunchTarget('', launchHash('uk'), null), /^\/tg\/uk\/\?r=today#tgWebAppData=/);
  assert.match(oliviaLaunchTarget('', launchHash('ru'), null), /^\/tg\/en\//);
  assert.match(oliviaLaunchTarget('', launchHash('en'), 'uk'), /^\/tg\/uk\//);
  assert.match(oliviaLaunchTarget('', '', null), /^\/tg\/en\/\?r=today$/);
});

test('start parameters open the matching screen; anything else opens Today', () => {
  const route = (start) => decodeURIComponent(oliviaLaunchTarget('?tgWebAppStartParam=' + start, '', 'en').split('?r=')[1]);
  assert.equal(route('spreads'), 'spreads');
  assert.equal(route('journal'), 'journal');
  assert.equal(route('card_17'), 'spreads/card-17');
  for (const other of ['card_78', 'card_1x', '%3Cscript%3E', 'constructor', '__proto__', 'toString', 'hasOwnProperty']) assert.equal(route(other), 'today', other);
});

test('links: Mini App routes stay inside, the rest of the site opens in the browser', () => {
  const origin = 'https://oliviaarcana.com';
  assert.deepEqual(oliviaTelegramLink('#journal', origin, 'en'), { type: 'ignore' });
  assert.deepEqual(oliviaTelegramLink('/#spreads', origin, 'en'), { type: 'route', route: 'spreads' });
  assert.deepEqual(oliviaTelegramLink('https://oliviaarcana.com/?experience=question', origin, 'en'), { type: 'route', route: 'question' });
  assert.deepEqual(oliviaTelegramLink('/uk/', origin, 'en'), { type: 'language', language: 'uk', route: 'today' });
  assert.deepEqual(oliviaTelegramLink('/#home', origin, 'uk'), { type: 'language', language: 'en', route: 'today' });
  assert.deepEqual(oliviaTelegramLink('https://oliviaarcana.com/learn/', origin, 'en'), { type: 'external', url: 'https://oliviaarcana.com/learn/' });
  assert.deepEqual(oliviaTelegramLink('https://t.me/OliviaArcanaBot', origin, 'en'), { type: 'telegram', url: 'https://t.me/OliviaArcanaBot' });
  assert.deepEqual(oliviaTelegramLink('tel:7333', origin, 'uk'), { type: 'ignore' });
});

test('Ukrainian users reach the Ukrainian library; the deck page language link switches pages', () => {
  const origin = 'https://oliviaarcana.com';
  assert.deepEqual(oliviaTelegramLink('https://oliviaarcana.com/cards/the-star/', origin, 'uk'), { type: 'external', url: 'https://oliviaarcana.com/uk/cards/the-star/' });
  assert.deepEqual(oliviaTelegramLink('https://oliviaarcana.com/uk/learn/', origin, 'uk'), { type: 'external', url: 'https://oliviaarcana.com/uk/learn/' });
  assert.deepEqual(oliviaTelegramLink('https://oliviaarcana.com/cards/the-star/', origin, 'en'), { type: 'external', url: 'https://oliviaarcana.com/cards/the-star/' });
  assert.deepEqual(oliviaTelegramLink('/tg/en/?r=today&lang=uk#decks', origin, 'en'), { type: 'language', language: 'uk', route: 'decks' });
  assert.deepEqual(oliviaTelegramLink('/tg/uk/?lang=uk#decks', origin, 'uk'), { type: 'ignore' });
});

test('script-like and data links are blocked, not passed through', () => {
  const origin = 'https://oliviaarcana.com';
  for (const href of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:msgbox(1)']) assert.deepEqual(oliviaTelegramLink(href, origin, 'en'), { type: 'block' }, href);
});
