// The personal reading as it is written, end to end without a paid call: the
// static export plus the real reading service (reading-service.ts) behind
// /api/reading, whose provider is a local fake that writes a reading slowly as
// server-sent events. A phone visitor consents to the AI reading and reveals a
// card; paragraphs must appear with the AI label and only grow, the finished
// reading must not arrive twice, and with mode "break" the partial text must go.
//   node experience/work/tools/stream-reading.mjs website/out /tmp/stream en ok
//   node experience/work/tools/stream-reading.mjs website/out /tmp/stream uk ok
//   node experience/work/tools/stream-reading.mjs website/out /tmp/stream en break
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createHandler} from '../../../website/netlify/edge-functions/_shared/reading-service.ts';

const [target = 'website/out', out = 'stream-reading', lang = 'en', mode = 'ok'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const root = path.resolve(target);
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
const reading = lang === 'uk'
  ? 'Ця карта пропонує подивитися на розмову як на спільний пошук, а не суперечку.\n\n## Що відкриває карта\nВона звертає увагу на те, що ви хочете зберегти в стосунках, навіть коли погляди різняться.\n\nЗапитайте себе, яку одну річ ви хочете почути від іншої людини.\n\n## Наступний крок\nЗапишіть два речення, з яких ви хотіли б почати розмову.'
  : 'This card invites you to treat the conversation as a shared search rather than a contest.\n\n## What the card opens\nIt draws attention to what you want to keep in the relationship, even where your views differ.\n\nAsk yourself which one thing you most want the other person to hear.\n\n## A next step\nWrite the two sentences you would like to open the conversation with.';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const provider = async () => {
  const encoder = new TextEncoder();
  const event = (type, data) => encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  return new Response(new ReadableStream({
    async start(outStream) {
      outStream.enqueue(event('message_start', {type: 'message_start', message: {id: 'msg_local', content: []}}));
      outStream.enqueue(event('content_block_start', {type: 'content_block_start', index: 0, content_block: {type: 'text', text: ''}}));
      const words = reading.split(/(?<=\s)/);
      for (let i = 0; i < words.length; i += 3) {
        await sleep(110);
        outStream.enqueue(event('content_block_delta', {type: 'content_block_delta', index: 0, delta: {type: 'text_delta', text: words.slice(i, i + 3).join('')}}));
        if (mode === 'break' && i > words.length / 2) { outStream.enqueue(event('error', {type: 'error', error: {type: 'overloaded_error', message: 'Overloaded'}})); outStream.close(); return; }
      }
      outStream.enqueue(event('content_block_stop', {type: 'content_block_stop', index: 0}));
      outStream.enqueue(event('message_delta', {type: 'message_delta', delta: {stop_reason: 'end_turn'}}));
      outStream.enqueue(event('message_stop', {type: 'message_stop'}));
      outStream.close();
    },
  }), {headers: {'Content-Type': 'text/event-stream'}});
};
const handler = createHandler('reading', {env: name => ({ANTHROPIC_API_KEY: 'local-test'})[name], fetch: provider});
let posts = 0;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/reading') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (req.method === 'POST') posts++;
    const request = new Request(url.href, {method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined});
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) for await (const chunk of response.body) res.write(chunk);
    res.end();
    return;
  }
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}` + (lang === 'uk' ? '/uk/' : '/');
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const browser = await chromium.launch();
const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: iphone});
const page = await context.newPage();
const errors = [], log = [];
const check = (ok, message) => { log.push(`${ok ? 'ok  ' : 'FAIL'} ${message}`); if (!ok) process.exitCode = 1; };
page.on('pageerror', e => errors.push(e.message));
const view = name => page.waitForFunction(v => document.body.dataset.view === v, name, {timeout: 20000});
await page.goto(base, {waitUntil: 'load'});
await page.waitForFunction(() => document.body.classList.contains('mobile-experience'), null, {timeout: 30000});
await page.locator('a.reading-link:visible').first().tap();
await view('question');
await page.fill('#question', lang === 'uk' ? 'Як мені підготуватися до важливої розмови?' : 'How can I prepare for an important conversation?');
await page.locator('.mobile-question-next').tap();
await page.waitForSelector('#question-view[data-mobile-question=prepare]');
await page.locator('#question-form input[type=radio][value="1"]').tap();
const consent = page.locator('#question-form .guidance-choice input[type=checkbox]');
await page.waitForFunction(() => { const box = document.querySelector('#question-form .guidance-choice input[type=checkbox]'); return box && !box.disabled; }, null, {timeout: 10000});
await consent.tap();
check(await consent.isChecked(), 'the visitor consents to a personal reading');
await page.locator('#question-form button[type=submit]:visible').tap();
await view('choose');
await page.locator('#card-choices [data-slot]:visible').first().waitFor();
await page.waitForTimeout(1500);
await page.locator('#card-choices [data-slot]:visible').nth(2).tap();
await page.waitForFunction(() => document.body.dataset.singleState === 'held');
await page.locator('.single-card-actions button:visible').tap();
await view('reading');
const started = Date.now();
const samples = [];
let shot = false;
for (let i = 0; i < 40; i++) {
  const state = await page.evaluate(() => { const s = document.querySelector('.question-guidance'); return s && {state: s.dataset.state, streamed: s.dataset.streamed || null, paragraphs: s.querySelectorAll('.guidance-lead, .guidance-chapter > p').length, label: Boolean(s.querySelector('.guidance-provenance')), loader: Boolean(s.querySelector('.reading-loader:not([hidden])')), actions: s.querySelectorAll('.guidance-actions button').length}; });
  samples.push({t: Date.now() - started, ...state});
  if (!shot && state?.state === 'pending' && state.streamed && state.paragraphs >= 2) { shot = true; await page.locator('.question-guidance').scrollIntoViewIfNeeded().catch(() => {}); await page.screenshot({path: path.join(out, `${lang}-${mode}-1-writing.png`)}); }
  if (state?.state === 'ready' || state?.state === 'error') break;
  await page.waitForTimeout(150);
}
fs.writeFileSync(path.join(out, `${lang}-${mode}-samples.json`), JSON.stringify(samples, null, 1));
const writing = samples.filter(sample => sample.state === 'pending' && sample.streamed && sample.paragraphs > 0);
if (mode === 'ok') {
  check(writing.length > 0 && writing.every(sample => sample.label), `while written: ${writing.length} samples show paragraphs (1 to ${Math.max(0, ...writing.map(sample => sample.paragraphs))}) with the AI label`);
  const counts = writing.map(sample => sample.paragraphs);
  check(counts.every((count, i) => i === 0 || count >= counts[i - 1]), 'paragraphs only ever grow');
  const last = samples.at(-1);
  const page_state = await page.evaluate(() => ({view: document.querySelector('#reading-view')?.dataset.guidanceState, keep: document.querySelector('#save-reading')?.dataset.saveState, replay: getComputedStyle(document.querySelector('.question-guidance .guidance-result')).animationName}));
  check(last.state === 'ready' && page_state.view === 'ready' && page_state.keep === 'keep' && page_state.replay === 'none', `finished: ${last.paragraphs} paragraphs; reading view ${page_state.view}; save button "${page_state.keep}"; no second arrival (${page_state.replay})`);
  const firstText = writing[0]?.t ?? -1;
  check(firstText >= 0 && firstText < 3000, `first paragraph on the page after ${firstText} ms (the whole reading took about ${last.t} ms)`);
  const shown = await page.evaluate(() => [...document.querySelectorAll('.question-guidance .guidance-lead, .question-guidance h4')].map(el => el.textContent.trim()));
  check(shown.length >= 3, `final structure: ${shown.join(' | ').slice(0, 160)}`);
} else {
  const last = samples.at(-1);
  check(writing.length > 0, 'part of the reading was shown before it broke off');
  check(last.state === 'error' && last.paragraphs === 0 && !last.label, `after the break: state ${last.state}; the partial text and its label are gone`);
}
await page.locator('.question-guidance').scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({path: path.join(out, `${lang}-${mode}-2-final.png`)});
check(posts === 1, `one request reached the reading service (${posts})`);
check(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
console.log(log.join('\n'));
await browser.close();
server.close();
