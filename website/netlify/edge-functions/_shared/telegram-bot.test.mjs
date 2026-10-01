import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replyTo, botLocale, createTelegramHandler } from './telegram-bot.ts';

const SITE = 'https://oliviaarcana.com/';
const update = (text, { lang = 'en', type = 'private', from = {} } = {}) => ({
  update_id: 1,
  message: { message_id: 7, date: 0, chat: { id: 4242, type }, from: { id: 4242, is_bot: false, first_name: 'Reader', language_code: lang, ...from }, text },
});
const buttons = reply => (reply.reply_markup?.inline_keyboard || []).flat();
const appUrls = reply => buttons(reply).filter(button => button.web_app).map(button => button.web_app.url);
const app = start => `https://oliviaarcana.com/tg/${start ? `?startapp=${start}` : ''}`;
const ask = (text, options) => replyTo(update(text, options));

// Every reply this bot can send, in both languages.
const EVERY = ['/start', '/start contact', '/start card_17', '/today', '/spreads', '/journal', '/help', '/privacy', '/unknown', 'hello', 'I want to die', 'Не хочу жити'];
const everyReply = () => ['en', 'uk'].flatMap(lang => EVERY.map(text => ({ lang, reply: ask(text, { lang }) })));

test('/start welcomes with the three Mini App doors and the website, in both languages', () => {
  const en = ask('/start');
  assert.equal(en.method, 'sendMessage');
  assert.equal(en.chat_id, 4242);
  assert.deepEqual(en.link_preview_options, { is_disabled: true });
  assert.match(en.text, /Olivia Arcana/);
  assert.match(en.text, /never predicts/);
  assert.match(en.text, /device/);
  assert.deepEqual(appUrls(en), [app('today'), app('question'), app('spreads')]);
  assert.deepEqual(buttons(en).map(button => button.text), ['Choose today’s card', 'Ask a question', 'Lay out three cards', 'Visit the website']);
  assert.equal(buttons(en).at(-1).url, SITE);

  const uk = ask('/start', { lang: 'uk' });
  assert.match(uk.text, /Вітаємо/);
  assert.match(uk.text, /не передбачає/);
  assert.deepEqual(appUrls(uk), [app('today'), app('question'), app('spreads')]);
  assert.equal(buttons(uk)[0].text, 'Обрати карту дня');
  assert.equal(buttons(uk).at(-1).url, `${SITE}uk/`);
});

test('commands answer in the reader’s language with the matching Mini App screen', () => {
  for (const lang of ['en', 'uk']) {
    assert.deepEqual(appUrls(ask('/today', { lang })), [app('today')]);
    assert.deepEqual(appUrls(ask('/spreads', { lang })), [app('spreads')]);
    assert.deepEqual(appUrls(ask('/journal', { lang })), [app('journal')]);
    assert.deepEqual(appUrls(ask('/help', { lang })), [app()]);
    assert.match(ask('/help', { lang }).text, /https:\/\/oliviaarcana\.com\/contact\//);
    const privacy = ask('/privacy', { lang });
    assert.match(privacy.text, /https:\/\/oliviaarcana\.com\/privacy\//);
    assert.equal(privacy.reply_markup, undefined);
  }
  assert.match(ask('/today').text, /all 78/);
  assert.match(ask('/today', { lang: 'uk' }).text, /з усіх 78/);
  assert.match(ask('/spreads', { lang: 'uk' }).text, /Розклад на три карти/);
  assert.match(ask('/journal').text, /almanac/);
  assert.match(ask('/journal', { lang: 'uk' }).text, /альманах/);
  assert.match(ask('/help').text, /AI/);
  assert.match(ask('/help', { lang: 'uk' }).text, /ШІ/);
  assert.match(ask('/privacy').text, /does not store your messages/);
  assert.match(ask('/privacy', { lang: 'uk' }).text, /не зберігає ваших повідомлень/);
  // An unknown command gets the help text rather than silence.
  assert.equal(ask('/settings').text, ask('/help').text);
});

test('a command addressed to this bot by name is the same command; one for another bot is ignored', () => {
  assert.deepEqual(ask('/help@OliviaArcanaBot'), ask('/help'));
  assert.deepEqual(ask('/today@oliviaarcanabot', { lang: 'uk' }), ask('/today', { lang: 'uk' }));
  assert.deepEqual(ask('/start@OliviaArcanaBot card_17'), ask('/start card_17'));
  assert.equal(ask('/help@SomeOtherBot'), null);
});

test('website start payloads: contact, a card, and payment links that sell nothing', () => {
  const welcome = ask('/start');
  for (const lang of ['en', 'uk']) {
    const contact = ask('/start contact', { lang });
    assert.match(contact.text, /https:\/\/oliviaarcana\.com\/contact\//);
    assert.deepEqual(appUrls(contact), [app()]);
  }
  const card = ask('/start card_17');
  assert.equal(card.text, welcome.text);
  assert.equal(appUrls(card)[0], app('card_17'));
  assert.equal(buttons(card)[0].text, 'Open this card');
  assert.equal(appUrls(ask('/start card_0'))[0], app('card_0'));
  assert.equal(appUrls(ask('/start card_77', { lang: 'uk' }))[0], app('card_77'));
  for (const payload of ['card_99', 'card_78', 'card_-1', 'pay_x', 'pay_monthly', 'cancel', 'paused', 'waitlist', 'anything']) {
    const reply = ask(`/start ${payload}`);
    assert.deepEqual(reply, welcome, payload);
    assert.doesNotMatch(JSON.stringify(reply), /pay|price|checkout|subscri|purchase|£|\$|€/i, payload);
  }
  assert.deepEqual(ask('/start pay_x', { lang: 'uk' }), ask('/start', { lang: 'uk' }));
});

test('self-harm and danger language gets the product’s support lines and no tarot button', () => {
  for (const text of ['I want to die', 'I keep thinking about suicide', '/start I want to die']) {
    const reply = ask(text);
    assert.match(reply.text, /^You don’t have to hold this alone/);
    for (const line of ['The cards can wait.', 'Lifeline Ukraine: 7333', 'Emergency: 112', 'Samaritans', '988', 'https://findahelpline.com']) assert.ok(reply.text.includes(line), line);
    assert.equal(reply.reply_markup, undefined);
  }
  for (const text of ['Не хочу жити', 'Я думаю про самогубство']) {
    const reply = ask(text, { lang: 'uk' });
    assert.match(reply.text, /^Вам не треба нести це наодинці/);
    for (const line of ['Карти можуть зачекати.', 'Екстрена допомога: 112 — в Україні та Європі', 'Lifeline Ukraine: 7333 — цілодобово й безкоштовно', 'Інші країни: https://findahelpline.com']) assert.ok(reply.text.includes(line), line);
    assert.equal(reply.reply_markup, undefined);
  }
  // The same safety net in a caption.
  const photo = update(undefined);
  delete photo.message.text;
  photo.message.caption = 'I want to die';
  assert.equal(replyTo(photo).reply_markup, undefined);
});

test('the support words match the product’s support note', () => {
  const source = readFileSync(new URL('../../../../experience/work/olivia-product/support-note.js', import.meta.url), 'utf8');
  for (const lang of ['en', 'uk']) {
    const lines = ask(lang === 'uk' ? 'Не хочу жити' : 'I want to die', { lang }).text.split('\n');
    assert.ok(source.includes(`'${lines[0]}'`), lines[0]);
    assert.ok(source.includes(`'${lines[2]}'`), lines[2]);
    for (const line of lines.slice(4, -1)) {
      const [label, rest] = line.split(': ');
      assert.ok(source.includes(`['${label}', `), label);
      const detail = lang === 'uk' ? rest.split(' — ')[1] : rest.match(/\((.*)\)$/)[1];
      assert.ok(source.includes(`'${detail}'`), detail);
    }
  }
});

test('other text gets a gentle note and the Open button', () => {
  const en = ask('Should I change jobs?');
  assert.match(en.text, /doesn’t read messages here yet/);
  assert.deepEqual(appUrls(en), [app()]);
  const uk = ask('Привіт', { lang: 'uk' });
  assert.match(uk.text, /не читає повідомлень/);
  assert.equal(buttons(uk)[0].text, 'Відкрити Olivia Arcana');
});

test('only private text messages from people get a reply', () => {
  for (const type of ['group', 'supergroup', 'channel']) assert.equal(ask('/start', { type }), null, type);
  assert.equal(ask('/start', { from: { is_bot: true } }), null);
  assert.equal(replyTo({ update_id: 2, callback_query: { id: '1', data: 'x' } }), null);
  assert.equal(replyTo({ update_id: 3, edited_message: update('/start').message }), null);
  assert.equal(replyTo({ update_id: 4, my_chat_member: { chat: { id: 1, type: 'private' } } }), null);
  const sticker = update('x');
  delete sticker.message.text;
  sticker.message.sticker = { file_id: 'a' };
  assert.equal(replyTo(sticker), null);
  const access = update('x');
  delete access.message.text;
  access.message.write_access_allowed = { web_app_name: 'olivia' };
  assert.equal(replyTo(access), null);
  for (const junk of [null, undefined, 42, 'text', [], {}, { message: null }, { message: { chat: { id: '4242', type: 'private' }, text: '/start' } }]) assert.equal(replyTo(junk), null);
});

test('language follows Telegram: Ukrainian for uk, English otherwise', () => {
  assert.equal(botLocale('uk'), 'uk');
  assert.equal(botLocale('UK-ua'), 'uk');
  for (const code of ['en', 'ru', 'de', 'ukr', '', undefined, null]) assert.equal(botLocale(code), 'en', String(code));
  const noLanguage = update('/today');
  delete noLanguage.message.from.language_code;
  assert.deepEqual(replyTo(noLanguage), ask('/today'));
  assert.deepEqual(ask('/today', { lang: 'ru' }), ask('/today'));
});

test('every reply fits Telegram’s limits and links only to oliviaarcana.com', () => {
  for (const { lang, reply } of everyReply()) {
    assert.ok(reply.text.length >= 1 && reply.text.length <= 4096, reply.text);
    assert.deepEqual(reply.link_preview_options, { is_disabled: true });
    for (const button of buttons(reply)) {
      const url = button.web_app?.url || button.url;
      assert.ok(url.startsWith(SITE), url);
      assert.ok(button.text.length >= 1 && button.text.length <= 64, button.text);
    }
    for (const url of reply.text.match(/https?:\/\/\S+/g) || []) assert.ok(url.startsWith(SITE) || url === 'https://findahelpline.com', url);
    assert.ok(new TextEncoder().encode(JSON.stringify(reply)).length < 8192);
    assert.equal(/\p{Extended_Pictographic}/u.test(JSON.stringify(reply)), false, lang);
  }
});

test('copy follows the house style in each language', () => {
  for (const { lang, reply } of everyReply()) {
    const words = [reply.text, ...buttons(reply).map(button => button.text)].join('\n');
    assert.doesNotMatch(words, /'/, words);
    assert.doesNotMatch(words, /"/, words);
    if (lang === 'en') {
      assert.doesNotMatch(words, /[—–]/, words);
      assert.doesNotMatch(words, /[а-яіїєґ]{3}/i, words);
    } else {
      assert.doesNotMatch(words, /(^|[^а-яіїєґ’])(ти|тебе|тобі|твій|твоя|твоє|твої)(?=$|[^а-яіїєґ’])/iu, words);
      // «запитання» is the reader's question; bare «питання» should not appear.
      assert.doesNotMatch(words.replace(/запитання/gi, ''), /питання/i, words);
    }
    assert.doesNotMatch(words, /\b(will happen|destin\w*|fate|luck\w*|streak (of|going)|don’t miss|hurry)\b/i, words);
  }
});

// The handler, as Netlify runs it.
const SECRET = 'test_webhook-secret_0123456789';
const post = (body, headers = {}) => new Request('https://oliviaarcana.com/api/telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': SECRET, ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('the webhook refuses requests without the right secret, and says nothing about why', async () => {
  const handler = createTelegramHandler({ env: key => (key === 'TELEGRAM_WEBHOOK_SECRET' ? SECRET : undefined) });
  const unconfigured = createTelegramHandler({ env: () => undefined });
  const blank = createTelegramHandler({ env: () => '   ' });
  for (const [run, request] of [
    [unconfigured, post(update('/start'))],
    [blank, post(update('/start'), { 'X-Telegram-Bot-Api-Secret-Token': '' })],
    [handler, post(update('/start'), { 'X-Telegram-Bot-Api-Secret-Token': 'wrong' })],
    [handler, post(update('/start'), { 'X-Telegram-Bot-Api-Secret-Token': SECRET.slice(0, -1) + 'X' })],
    [handler, post(update('/start'), { 'X-Telegram-Bot-Api-Secret-Token': SECRET + 'x' })],
    [handler, new Request('https://oliviaarcana.com/api/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update('/start')) })],
    [handler, new Request('https://oliviaarcana.com/api/telegram')],
  ]) {
    const response = await run(request);
    assert.equal(response.status, 401);
    assert.equal(await response.text(), '');
  }
});

test('the webhook accepts only bounded JSON posts', async () => {
  const handler = createTelegramHandler({ env: key => (key === 'TELEGRAM_WEBHOOK_SECRET' ? SECRET : undefined) });
  const get = await handler(new Request('https://oliviaarcana.com/api/telegram', { headers: { 'X-Telegram-Bot-Api-Secret-Token': SECRET } }));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await handler(post(update('/start'), { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await handler(post(`{"update_id":1,"pad":"${'x'.repeat(70000)}"}`))).status, 413);
  assert.equal((await handler(post('{not json'))).status, 400);
});

test('the webhook answers with the Bot API call in its body, or an empty 200', async () => {
  const handler = createTelegramHandler({ env: key => (key === 'TELEGRAM_WEBHOOK_SECRET' ? SECRET : undefined) });
  const response = await handler(post(update('/start card_17', { lang: 'uk' })));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  const body = await response.json();
  assert.deepEqual(body, ask('/start card_17', { lang: 'uk' }));
  assert.equal(body.method, 'sendMessage');
  for (const irrelevant of [update('/start', { type: 'group' }), { update_id: 9, callback_query: {} }, [], '"hello"', null]) {
    const quiet = await handler(post(irrelevant));
    assert.equal(quiet.status, 200);
    assert.equal(await quiet.text(), '');
  }
});

test('telegram.ts loads outside Deno and reads its secret from Netlify.env at request time', async () => {
  const values = {};
  globalThis.Netlify = { env: { get: key => values[key] } };
  try {
    const { default: handler, config } = await import('../telegram.ts');
    assert.equal(config.path, '/api/telegram');
    assert.equal((await handler(post(update('/today')))).status, 401);
    values.TELEGRAM_WEBHOOK_SECRET = SECRET;
    const response = await handler(post(update('/today')));
    assert.equal(response.status, 200);
    assert.deepEqual(appUrls(await response.json()), [app('today')]);
    assert.equal((await handler(post(update('/today'), { 'X-Telegram-Bot-Api-Secret-Token': 'nope' }))).status, 401);
  } finally { delete globalThis.Netlify; }
});

test('the edge copy of the safety patterns matches the product', () => {
  const product = readFileSync(new URL('../../../../experience/work/olivia-product/support-note.js', import.meta.url), 'utf8');
  const copy = readFileSync(new URL('./support-patterns.js', import.meta.url), 'utf8');
  const block = text => text.slice(text.indexOf('const PATTERNS = ['), text.indexOf('];', text.indexOf('const PATTERNS = [')) + 2);
  const check = text => text.slice(text.indexOf('export function needsSupport'));
  assert.equal(block(copy), block(product));
  assert.equal(check(copy).trim(), check(product).slice(0, check(product).indexOf('\n}\n') + 2).trim());
});
