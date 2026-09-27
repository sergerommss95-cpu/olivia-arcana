// Check-ins on the static export: keep a reading, choose "a week", make it due,
// see the signs (menu dot, menu line, the row on the question step, the Today
// dot), answer "How did it turn out?" and check storage; then the same reading on
// desktop, where "Not yet" moves it a week. Continue must keep its place at
// Safari's heights (664 and 553 px) when the row is shown.
//   node experience/work/tools/checkin-journey.mjs website/out /tmp/checkins en
//   node experience/work/tools/checkin-journey.mjs website/out /tmp/checkins uk
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [target = 'website/out', out = 'checkin-journey', lang = 'en'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const root = path.resolve(target);
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const route = lang === 'uk' ? '/uk/' : '/';
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const browser = await chromium.launch();
const log = [];
const check = (ok, message) => { log.push(`${ok ? 'ok  ' : 'FAIL'} ${message}`); if (!ok) process.exitCode = 1; };
const errors = [];

const context = await browser.newContext({viewport: lang === 'uk' ? {width: 375, height: 812} : {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: iphone});
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/\/api\//.test(m.location().url || '')) errors.push(m.text()); });
const view = name => page.waitForFunction(v => document.body.dataset.view === v, name, {timeout: 20000});
const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
const plus = (date, days) => { const [y, m, d] = date.split('-').map(Number); const r = new Date(Date.UTC(y, m - 1, d + days)); return r.toISOString().slice(0, 10); };

await page.goto(base + route, {waitUntil: 'load'});
await page.waitForFunction(() => document.body.classList.contains('mobile-experience'), null, {timeout: 30000});
check(!(await page.locator('.mobile-menu-toggle .check-in-dot').count()), 'first visit: no dot on the menu');
await page.locator('a.reading-link:visible').first().tap();
await view('question');
check(!(await page.locator('.check-in-waiting').count()), 'first visit: no check-in row on the question step');
await page.fill('#question', lang === 'uk' ? 'Як мені підготуватися до важливої розмови?' : 'How can I prepare for an important conversation?');
await page.locator('.mobile-question-next').tap();
await page.waitForSelector('#question-view[data-mobile-question=prepare]');
await page.locator('#question-form input[type=radio][value="1"]').tap();
await page.locator('#question-form button[type=submit]:visible').tap();
await view('choose');
await page.locator('#card-choices [data-slot]:visible').first().waitFor();
await page.waitForTimeout(1500);
await page.locator('#card-choices [data-slot]:visible').nth(2).tap();
await page.waitForFunction(() => document.body.dataset.singleState === 'held');
await page.locator('.single-card-actions button:visible').tap();
await view('reading');
await page.waitForTimeout(2000);
check(await page.locator('.check-in-next').evaluate(el => el.hidden), 'before keeping: the check-in chooser is hidden');
await page.locator('#save-reading').scrollIntoViewIfNeeded();
await page.locator('#save-reading').tap();
await page.waitForFunction(() => document.querySelector('#save-reading')?.textContent.includes('✓'));
await page.locator('.check-in-next').waitFor({state: 'visible', timeout: 5000});
const chips = await page.locator('.check-in-next .check-in-choice').allTextContents();
check(chips.length >= 4, `after keeping: the chooser offers ${chips.join(' | ')}`);
await page.locator('.check-in-next').scrollIntoViewIfNeeded();
await page.evaluate(() => scrollBy(0, -120));
await page.waitForTimeout(500);
await page.screenshot({path: path.join(out, `${lang}-1-chooser.png`)});
await page.locator('.check-in-next .check-in-choice[data-days="7"]').tap();
await page.waitForFunction(() => document.querySelector('.check-in-next')?.dataset.state === 'upcoming');
const chosen = (await page.locator('.check-in-next h3').textContent()).trim();
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('olivia-arcana-practice-metadata-v1')).entries);
check(stored.length === 1 && stored[0].revisitDate === plus(today, 7) && stored[0].reviewedAt === null, `"a week" stores ${stored[0]?.revisitDate} (expected ${plus(today, 7)}); the title reads "${chosen}"`);
await page.waitForTimeout(400);
await page.screenshot({path: path.join(out, `${lang}-2-chosen.png`)});
const editorDate = await page.locator('#single-practice-date').count();
check(editorDate === 0, 'the editor no longer carries its own date field');

// A week later: make the check-in due and return as a visitor would.
await page.evaluate(date => {
  const key = 'olivia-arcana-practice-metadata-v1', envelope = JSON.parse(localStorage.getItem(key));
  envelope.entries[0].revisitDate = date; localStorage.setItem(key, JSON.stringify(envelope));
}, today);
await page.goto(base + route, {waitUntil: 'load'});
await page.waitForFunction(() => document.body.classList.contains('mobile-experience'), null, {timeout: 30000});
await page.waitForFunction(() => document.documentElement.dataset.checkInsDue === '1', null, {timeout: 5000}).catch(() => {});
await page.waitForTimeout(2600);
const menuLabel = await page.locator('.mobile-menu-toggle').getAttribute('aria-label');
check(await page.locator('.mobile-menu-toggle .check-in-dot').count() === 1, `returning: the menu carries a dot, labelled "${menuLabel}"`);
await page.screenshot({path: path.join(out, `${lang}-3-home-returning.png`)});
await page.locator('.mobile-menu-toggle').tap();
await page.waitForTimeout(700);
const note = (await page.locator('.mobile-explore a[href="#today"] small').textContent()).trim();
check(/1/.test(note), `the menu's Today line reads "${note}"`);
await page.screenshot({path: path.join(out, `${lang}-4-menu.png`)});
await page.locator('.mobile-sheet-close').tap();
await page.waitForTimeout(400);
await page.locator('a.reading-link:visible').first().tap();
await view('question');
await page.locator('.check-in-waiting').waitFor({state: 'visible', timeout: 5000});
const row = (await page.locator('.check-in-waiting').innerText()).replace(/\s+/g, ' ').trim();
check(Boolean(row), `the question step shows "${row}"`);
const questionBox = await page.locator('.mobile-question-next').boundingBox();
check(questionBox && questionBox.y + questionBox.height <= 844, `the question step's Continue stays in view (bottom ${questionBox && Math.round(questionBox.y + questionBox.height)} px)`);
await page.screenshot({path: path.join(out, `${lang}-5-question-row.png`)});
// Safari's visible heights: Continue must sit where it sits without the row.
for (const height of [664, 553]) {
  await page.setViewportSize({width: lang === 'uk' ? 375 : 390, height});
  await page.waitForTimeout(300);
  const withRow = await page.evaluate(() => Math.round(document.querySelector('.mobile-question-next').getBoundingClientRect().bottom + scrollY));
  const saved = await page.evaluate(() => { const row = document.querySelector('.check-in-waiting'); const holder = document.createElement('template'); row.replaceWith(holder); window.__row = [row, holder]; return true; });
  await page.waitForTimeout(200);
  const without = await page.evaluate(() => Math.round(document.querySelector('.mobile-question-next').getBoundingClientRect().bottom + scrollY));
  await page.evaluate(() => { const [row, holder] = window.__row; holder.replaceWith(row); });
  check(withRow <= without + 2, `at ${height} px tall, Continue ends at ${withRow} px with the row and ${without} px without`);
}
await page.setViewportSize(lang === 'uk' ? {width: 375, height: 812} : {width: 390, height: 844});
await page.waitForTimeout(300);
await page.locator('.check-in-waiting').tap();
await view('reading');
await page.locator('.check-in-return').waitFor({state: 'visible', timeout: 5000});
await page.locator('.check-in-return').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({path: path.join(out, `${lang}-6-return.png`)});
await page.locator('.check-in-return .solid-action').tap();
check((await page.locator('.check-in-return .check-in-status').textContent()).trim().length > 0, 'an empty answer asks for a few words');
await page.locator('.check-in-return textarea').fill(lang === 'uk' ? 'Розмова відбулася спокійніше, ніж я очікувала.' : 'The conversation went more calmly than I expected.');
await page.locator('.check-in-return .solid-action').tap();
await page.waitForTimeout(500);
const after = await page.evaluate(() => JSON.parse(localStorage.getItem('olivia-arcana-practice-metadata-v1')).entries[0]);
check(Boolean(after.outcome) && Boolean(after.reviewedAt), `kept: outcome "${after.outcome.slice(0, 30)}…", reviewed at ${after.reviewedAt}`);
check((await page.locator('.check-in-return h2').textContent()).trim().length > 0, `the panel now reads "${(await page.locator('.check-in-return h2').textContent()).trim()}"`);
await page.screenshot({path: path.join(out, `${lang}-7-kept.png`)});
check(!(await page.locator('.mobile-menu-toggle .check-in-dot').count()), 'the menu dot is gone once answered');
const editorOutcome = await page.locator('#single-practice-outcome').inputValue();
check(editorOutcome === after.outcome, 'the editor shows the same return note');
const state = await page.evaluate(() => ({records: localStorage.getItem('olivia-arcana-readings-v1'), meta: localStorage.getItem('olivia-arcana-practice-metadata-v1')}));
await context.close();

// The same kept reading on desktop, due again, opened from Today.
const desktop = await browser.newContext({viewport: {width: 1440, height: 900}});
await desktop.addInitScript(({records, meta, date}) => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  const envelope = JSON.parse(meta);
  envelope.entries[0].revisitDate = date; envelope.entries[0].reviewedAt = null; envelope.entries[0].outcome = '';
  localStorage.setItem('olivia-arcana-readings-v1', records);
  localStorage.setItem('olivia-arcana-practice-metadata-v1', JSON.stringify(envelope));
}, {...state, date: today});
const d = await desktop.newPage();
d.on('pageerror', e => errors.push('desktop: ' + e.message));
await d.goto(base + route, {waitUntil: 'load'});
await d.waitForTimeout(3500);
check(await d.locator('a.today-nav .check-in-dot').count() === 1, 'desktop: Today in the header carries a dot');
await d.screenshot({path: path.join(out, `${lang}-8-desktop-home.png`)});
await d.goto(base + route + '#today', {waitUntil: 'load'});
await d.waitForTimeout(1500);
await d.locator('.revisit-row').first().click();
await d.waitForFunction(() => document.body.dataset.view === 'reading');
await d.locator('.check-in-return').waitFor({state: 'visible', timeout: 5000});
await d.waitForTimeout(600);
await d.screenshot({path: path.join(out, `${lang}-9-desktop-return.png`)});
await d.locator('.check-in-return .check-in-link').click();
await d.waitForTimeout(500);
const later = await d.evaluate(() => JSON.parse(localStorage.getItem('olivia-arcana-practice-metadata-v1')).entries[0]);
check(later.revisitDate === plus(today, 7) && later.reviewedAt === null, `desktop: "Not yet" moves the check-in to ${later.revisitDate}`);
await d.locator('.check-in-next').scrollIntoViewIfNeeded();
await d.waitForTimeout(400);
await d.screenshot({path: path.join(out, `${lang}-10-desktop-chooser.png`)});
await desktop.close();

check(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
console.log(log.join('\n'));
await browser.close();
server.close();
