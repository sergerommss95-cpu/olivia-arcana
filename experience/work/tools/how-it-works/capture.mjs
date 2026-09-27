// Film the real product on a phone (390×844 at 2×) with Chrome's screencast
// (part of the "How it works" film; see README.md here):
// every repaint is saved with its timestamp, and scenes and taps are logged on
// the same clock, so a composition can cut and caption the footage precisely.
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {seededCrypto} from './seeded.js';

const [target = 'website/out', out = 'footage-en', lang = 'en', seed = ''] = process.argv.slice(2);
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(path.join(out, 'frames'), {recursive: true});
const root = path.resolve(target);
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}` + (lang === 'uk' ? '/uk/' : '/');
const copy = lang === 'uk'
  ? {question: 'Як мені підготуватися до важливої розмови?', outcome: 'Розмова вийшла спокійнішою, ніж я думала. Я почала з того, що для мене важливо.', week: 'Тиждень'}
  : {question: 'How can I prepare for an important conversation?', outcome: 'It went more calmly than I expected. I began with what matters to me.', week: 'A week'};

const browser = await chromium.launch({args: ['--hide-scrollbars']});
const context = await browser.newContext({
  viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
});
if (seed) await context.addInitScript(seededCrypto, Number(seed));
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const frames = [], events = [];
let count = 0;
cdp.on('Page.screencastFrame', async frame => {
  const file = `frames/${String(count++).padStart(5, '0')}.jpg`;
  fs.writeFileSync(path.join(out, file), Buffer.from(frame.data, 'base64'));
  frames.push({file, t: frame.metadata.timestamp, scroll: frame.metadata.scrollOffsetY});
  cdp.send('Page.screencastFrameAck', {sessionId: frame.sessionId}).catch(() => {});
});
const now = () => Date.now() / 1000;
const mark = (type, detail = {}) => events.push({type, t: now(), ...detail});
const view = name => page.waitForFunction(v => document.body.dataset.view === v, name, {timeout: 20000});
async function tap(locator, label) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  mark('tap', {label, x: box.x + box.width / 2, y: box.y + box.height / 2});
  await page.waitForTimeout(260);
  await locator.tap();
}
async function type(locator, text) {
  await locator.focus();
  mark('type', {length: text.length});
  for (const char of text) { await page.keyboard.type(char); await page.waitForTimeout(char === ' ' ? 70 : 42); }
}
async function glide(to, ms = 1400) {
  await page.evaluate(({to, ms}) => new Promise(resolve => {
    const from = scrollY, start = performance.now();
    const step = time => { const k = Math.min(1, (time - start) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, from + (to - from) * e); k < 1 ? requestAnimationFrame(step) : resolve(); };
    requestAnimationFrame(step);
  }), {to, ms});
}

// Start on lapis, as a visitor's previous page would hand over to Olivia's first paint.
await page.setContent('<body style="margin:0;background:#0b192a"></body>');
await cdp.send('Page.startScreencast', {format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1});

mark('scene', {name: 'arrive'});
await page.goto(base, {waitUntil: 'load'});
await page.waitForFunction(() => document.body.classList.contains('mobile-experience'), null, {timeout: 30000});
await page.waitForTimeout(4200);

mark('scene', {name: 'question'});
await tap(page.locator('a.reading-link:visible').first(), 'draw');
await view('question');
await page.waitForTimeout(900);
await tap(page.locator('#question'), 'field');
await type(page.locator('#question'), copy.question);
await page.waitForTimeout(700);
await tap(page.locator('.mobile-question-next'), 'continue');

mark('scene', {name: 'prepare'});
await page.waitForSelector('#question-view[data-mobile-question=prepare]');
await page.waitForTimeout(1100);
await tap(page.locator('#question-form input[type=radio][value="1"]'), 'one-card');
await page.waitForTimeout(800);
await tap(page.locator('#question-form button[type=submit]:visible'), 'choose');

mark('scene', {name: 'choose'});
await view('choose');
await page.locator('#card-choices [data-slot]:visible').first().waitFor();
await page.waitForTimeout(2600);
await tap(page.locator('#card-choices [data-slot]:visible').nth(2), 'card');
await page.waitForFunction(() => document.body.dataset.singleState === 'held');
await page.waitForTimeout(1300);

mark('scene', {name: 'reveal'});
await tap(page.locator('.single-card-actions button:visible'), 'reveal');
await view('reading');
await page.waitForTimeout(3200);

mark('scene', {name: 'read'});
const meaning = await page.evaluate(() => { const el = document.querySelector('#meaning'); return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 250) : 600; });
await glide(meaning, 1800);
await page.waitForTimeout(1600);
const prompt = await page.evaluate(() => { const el = document.querySelector('.reflection-prompt'); return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 200) : 1200; });
await glide(prompt, 1600);
await page.waitForTimeout(1800);

mark('scene', {name: 'keep'});
const keep = await page.evaluate(() => { const el = document.querySelector('#save-reading'); return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 300) : 1800; });
await glide(keep, 1500);
await page.waitForTimeout(500);
await tap(page.locator('#save-reading'), 'keep');
await page.locator('.check-in-next').waitFor({state: 'visible'});
await page.waitForTimeout(700);
const chooser = await page.evaluate(() => { const el = document.querySelector('.check-in-next'); return Math.max(0, el.getBoundingClientRect().top + scrollY - 330); });
await glide(chooser, 1000);
await page.waitForTimeout(1200);
await tap(page.locator('.check-in-next .check-in-choice[data-days="7"]'), 'week');
await page.waitForFunction(() => document.querySelector('.check-in-next')?.dataset.state === 'upcoming');
await page.waitForTimeout(2200);

// A week later: the check-in is due.
await page.evaluate(() => {
  const key = 'olivia-arcana-practice-metadata-v1', envelope = JSON.parse(localStorage.getItem(key));
  const d = new Date(); envelope.entries[0].revisitDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  localStorage.setItem(key, JSON.stringify(envelope));
});
mark('scene', {name: 'return'});
await page.goto(base, {waitUntil: 'load'});
await page.waitForFunction(() => document.body.classList.contains('mobile-experience'), null, {timeout: 30000});
await page.waitForFunction(() => document.querySelector('.mobile-menu-toggle .check-in-dot'), null, {timeout: 8000});
await page.waitForTimeout(2600);
await tap(page.locator('.mobile-menu-toggle'), 'menu');
await page.waitForTimeout(1900);
await tap(page.locator('.mobile-sheet-close'), 'close');
await page.waitForTimeout(700);
await tap(page.locator('a.reading-link:visible').first(), 'draw');
await view('question');
await page.locator('.check-in-waiting').waitFor({state: 'visible'});
await page.waitForTimeout(1500);
await tap(page.locator('.check-in-waiting'), 'waiting');
await view('reading');
await page.locator('.check-in-return').waitFor({state: 'visible'});
await page.waitForTimeout(600);
const panel = await page.evaluate(() => { const el = document.querySelector('.check-in-return'); return Math.max(0, el.getBoundingClientRect().top + scrollY - 70); });
await glide(panel, 1300);
await page.waitForTimeout(1200);
await tap(page.locator('.check-in-return textarea'), 'outcome');
await type(page.locator('.check-in-return textarea'), copy.outcome);
await page.waitForTimeout(700);
await tap(page.locator('.check-in-return .solid-action'), 'kept');
await page.waitForTimeout(2600);

mark('scene', {name: 'almanac'});
await tap(page.locator('.check-in-return .check-in-link'), 'almanac');
await view('journal');
await page.waitForTimeout(3000);
mark('end');

await cdp.send('Page.stopScreencast');
await page.waitForTimeout(300);
fs.writeFileSync(path.join(out, 'footage.json'), JSON.stringify({lang, viewport: {width: 390, height: 844, scale: 2}, frames, events}, null, 1));
const span = frames.at(-1).t - frames[0].t;
console.log(`${frames.length} frames over ${span.toFixed(1)} s (${(frames.length / span).toFixed(1)} fps average)`);
const scenes = events.filter(e => e.type === 'scene' || e.type === 'end');
for (let i = 0; i < scenes.length - 1; i++) {
  const inScene = frames.filter(f => f.t >= scenes[i].t && f.t < scenes[i + 1].t).length;
  console.log(`  ${scenes[i].name.padEnd(8)} ${(scenes[i + 1].t - scenes[i].t).toFixed(1)} s, ${inScene} frames`);
}
await browser.close();
server.close();
