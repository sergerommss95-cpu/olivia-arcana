// Walk the one-card phone journey end to end, as a visitor who declines the AI
// reading: home, the crisis note while typing, question, one card, choose, hold,
// reveal, reading, keep, almanac (with the Safari note) and revisit. English runs
// at 390×844 and Ukrainian at 375×812, with an iPhone user agent and touch.
// Run with Playwright's Chromium available:
//   node experience/work/tools/phone-journey.mjs website/out /tmp/journey
//   node experience/work/tools/phone-journey.mjs https://deploy-preview-4--olivia-arcana.netlify.app /tmp/journey
// A directory is served locally the way Netlify serves the static export.
// Nothing can reach the paid model: any request to /api/* other than GET is
// aborted and fails the run. Netlify's deploy-preview toolbar is blocked, because
// production visitors never load it. (Routing switches off the HTTP cache, so
// don't use this tool to weigh pages.) Every interaction is a tap: a mouse click
// would leave a pointer resting over the deck and trigger the desktop hover lift. Screenshots are <lang>-<step>.png; the
// results are printed and written to summary.json. Exits non-zero on a failure.
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [target = 'website/out', out = 'phone-journey'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});

let base = target, server;
if (!/^https?:\/\//.test(target)) {
  const root = path.resolve(target);
  const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
  server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}
const origin = new URL(base).origin;

const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const runs = [
  {lang: 'en', route: '/', viewport: {width: 390, height: 844}, crisis: 'I don’t want to live anymore', question: 'What should I pay attention to this week?', saved: 'Saved'},
  {lang: 'uk', route: '/uk/', viewport: {width: 375, height: 812}, crisis: 'Я не хочу більше жити', question: 'На що мені варто звернути увагу цього тижня?', saved: 'Збережено'},
];

const browser = await chromium.launch();
const results = [];
for (const run of runs) {
  const context = await browser.newContext({viewport: run.viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: iphone});
  const page = await context.newPage();
  const blocked = new Set(), posts = [], errors = [], steps = [];
  await page.route(url => url.pathname.startsWith('/.netlify/scripts/') || url.hostname === 'app.netlify.com', route => { blocked.add(route.request().url()); return route.abort(); });
  await page.route(url => url.origin === origin && url.pathname.startsWith('/api/'), route => {
    if (route.request().method() === 'GET') return route.continue();
    posts.push(`${route.request().method()} ${route.request().url()}`);
    return route.abort();
  });
  // A static export has no functions, so its /api/reading availability check answers 404.
  const expected = url => blocked.has(url) || (server && new URL(url || 'about:blank', base).pathname.startsWith('/api/'));
  page.on('console', message => { if (message.type() === 'error' && !expected(message.location().url)) errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const view = name => page.waitForFunction(value => document.body.dataset.view === value, name, {timeout: 20000});
  async function step(name, action) {
    const entry = {step: name};
    try {
      entry.detail = await action() ?? undefined;
      const extra = await overflow();
      if (extra > 0) throw new Error(`horizontal overflow of ${extra}px`);
      entry.ok = true;
    } catch (error) {
      entry.ok = false;
      entry.error = process.env.JOURNEY_DEBUG ? error.message : error.message.split('\n')[0];
    }
    await page.screenshot({path: path.join(out, `${run.lang}-${String(steps.length + 1).padStart(2, '0')}-${name}.png`)}).catch(() => {});
    steps.push(entry);
    return entry.ok;
  }

  let card = '';
  const ok = await step('home', async () => {
    await page.goto(base + run.route, {waitUntil: 'load'});
    await page.waitForFunction(() => document.body.classList.contains('mobile-experience'), null, {timeout: 30000});
    await page.locator('a.reading-link:visible').first().waitFor({timeout: 10000});
  })
  && await step('crisis-note', async () => {
    await page.locator('a.reading-link:visible').first().tap();
    await view('question');
    await page.fill('#question', run.crisis);
    await page.locator('.support-note').first().waitFor({state: 'visible', timeout: 5000});
    await page.fill('#question', run.question);
    await page.waitForFunction(() => ![...document.querySelectorAll('.support-note')].some(note => note.getClientRects().length), null, {timeout: 5000});
  })
  && await step('prepare', async () => {
    await page.locator('.mobile-question-next').tap();
    await page.waitForSelector('#question-view[data-mobile-question=prepare]', {timeout: 5000});
    await page.locator('#question-form input[type=radio][value="1"]').tap();
    if (!(await page.locator('#question-form input[type=radio][value="1"]').isChecked())) throw new Error('one card could not be chosen');
    const consent = page.locator('#question-form .guidance-choice input[type=checkbox]');
    if (await consent.count() && await consent.isChecked()) throw new Error('the AI reading was pre-selected');
    return {aiServiceAvailable: await consent.count() ? !(await consent.isDisabled()) : null};
  })
  && await step('choose', async () => {
    await page.locator('#question-form button[type=submit]:visible').tap();
    await view('choose');
    const choices = page.locator('#card-choices [data-slot]:visible');
    await choices.first().waitFor({timeout: 10000});
    await page.waitForTimeout(1500);
    return {visibleCards: await choices.count()};
  })
  && await step('hold', async () => {
    await page.locator('#card-choices [data-slot]:visible').nth(2).tap();
    await page.waitForFunction(() => document.body.dataset.singleState === 'held', null, {timeout: 10000});
    await page.locator('.single-card-actions button:visible').waitFor({timeout: 5000});
  })
  && await step('reveal', async () => {
    await page.locator('.single-card-actions button:visible').tap();
    await view('reading');
    await page.waitForFunction(() => document.querySelector('#result-title')?.textContent.trim(), null, {timeout: 15000});
    card = (await page.locator('#result-title').textContent()).replace(/\s+/g, ' ').trim();
    if (!card) throw new Error('the card has no title');
    await page.locator('#result-title').waitFor({state: 'visible', timeout: 10000});
    // On phones the question moves into a disclosure below the title, open when short.
    await page.waitForFunction(question => document.querySelector('#reading-question')?.textContent.includes(question), run.question, {timeout: 5000})
      .catch(() => { throw new Error('the question is not shown with the card'); });
    await page.locator('#reading-question').waitFor({state: 'visible', timeout: 5000});
    if (await page.locator('.guidance-provenance:visible').count()) throw new Error('an AI label appeared although the AI reading was declined');
    const orientation = await page.evaluate(() => document.querySelector('.mobile-reading-orientation')?.textContent.trim());
    if (!orientation) throw new Error('the orientation is not shown');
    return {card, orientation};
  })
  && await step('keep', async () => {
    await page.locator('#save-reading').scrollIntoViewIfNeeded();
    await page.locator('#save-reading').tap();
    await page.waitForFunction(() => document.querySelector('#save-reading')?.textContent.includes('✓'), null, {timeout: 5000});
    const label = (await page.locator('#save-reading').innerText()).replace(/\s+/g, ' ').trim();
    if (!label.startsWith(run.saved)) throw new Error(`unexpected save label "${label}"`);
    return {label};
  })
  && await step('almanac', async () => {
    await page.locator('.mobile-dock a[data-mobile-route=journal]').tap();
    await view('journal');
    const note = await page.locator('.safari-storage-note:visible').count();
    if (!note) throw new Error('the Safari storage note is missing');
    const row = page.locator('#journal-list .journal-row').first();
    await row.waitFor({timeout: 5000});
    if (!(await row.textContent()).replace(/\s+/g, ' ').includes(card)) throw new Error(`the almanac does not list ${card}`);
  })
  && await step('revisit', async () => {
    await page.locator('#journal-list .journal-row').first().tap();
    await page.waitForFunction(() => document.body.dataset.view !== 'journal', null, {timeout: 10000});
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.querySelector(`#${document.body.dataset.view}-view`)?.textContent.replace(/\s+/g, ' ') || '');
    if (!text.includes(card)) throw new Error(`the reopened reading does not show ${card}`);
    return {view: await page.evaluate(() => document.body.dataset.view)};
  });

  const passed = ok && !posts.length && !errors.length;
  results.push({lang: run.lang, viewport: `${run.viewport.width}x${run.viewport.height}`, passed, steps, aiRequestsAttempted: posts, consoleErrors: errors, blocked: [...blocked]});
  console.log(`${run.lang} ${run.viewport.width}x${run.viewport.height}: ${passed ? 'PASS' : 'FAIL'}`);
  for (const entry of steps) console.log(`  ${entry.ok ? 'ok  ' : 'FAIL'} ${entry.step}${entry.detail ? ' ' + JSON.stringify(entry.detail) : ''}${entry.error ? ' — ' + entry.error : ''}`);
  if (posts.length) console.log('  AI requests attempted (aborted):', posts);
  if (errors.length) console.log('  console errors:', errors);
  await context.close();
}
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({target: base, date: new Date().toISOString(), results}, null, 2) + '\n');
await browser.close();
server?.close();
process.exitCode = results.every(result => result.passed) ? 0 : 1;
