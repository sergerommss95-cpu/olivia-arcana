import puppeteer from '/Users/macbookpro/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const STATES = process.argv.slice(2).length ? process.argv.slice(2) : ['0.05', '0.30', '0.55', '0.75', '1'];
const errs = [];

for (const s of STATES) {
  // One browser per state: the page is heavy and six reloads in a single
  // process was enough to get the runner OOM-killed.
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist',
           '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  page.on('pageerror', e => errs.push(`${s} pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error' && !/Hydration|hydrat/i.test(m.text())) errs.push(`${s} console: ${m.text().slice(0, 160)}`);
  });

  await page.goto(`http://localhost:3300/#deal=${s}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 4000)));
  const found = await page.evaluate(() => {
    const st = document.querySelector('.td-stage');
    if (!st) return false;
    scrollTo(0, Math.max(0, st.getBoundingClientRect().top + scrollY - 190));
    return true;
  });
  if (!found) { console.log(s, 'NO .td-stage'); await browser.close(); continue; }
  await page.evaluate(() => new Promise(r => setTimeout(r, 1600)));
  const info = await page.evaluate(() => {
    const st = document.querySelector('.td-stage');
    return { a: st.style.getPropertyValue('--td-a'), ready: st.classList.contains('is-ready') };
  });
  const el = await page.$('.plate-oracle');
  await el.screenshot({ path: `deal-${s.replace('.', '_')}.png` });
  console.log(s, JSON.stringify(info));
  await browser.close();
}
console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 8).join('\n') : 'no page errors');
