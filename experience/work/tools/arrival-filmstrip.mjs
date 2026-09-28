// Film the first seconds of a visit to the homepage, as a phone on 4G with a
// mid-range CPU and as a desktop, and report FCP, LCP and CLS. Use it to judge
// the arrival (blank frames, layout jumps, when the page becomes readable).
// Run with Playwright's Chromium available:
//   node experience/work/tools/arrival-filmstrip.mjs website/out /tmp/arrival
//   node experience/work/tools/arrival-filmstrip.mjs https://deploy-preview-4--olivia-arcana.netlify.app /tmp/arrival
// A directory is served locally the way Netlify serves the static export.
// Frames are JPEGs named <profile>-<en|uk>-<ms>.jpg, plus one contact sheet
// per profile and language (<profile>-<en|uk>-sheet.png). Each visit starts from
// a plain grey page: browsers keep showing the previous page until the new one
// paints, so grey frames mean "not painted yet", never a white flash.
import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [target = 'website/out', out = 'arrival-filmstrip'] = process.argv.slice(2);
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

const profiles = {
  phone: {
    context: {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'},
    network: {latency: 120, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8}, cpu: 4,
  },
  desktop: {
    context: {viewport: {width: 1440, height: 900}},
    network: {latency: 40, downloadThroughput: 40e6 / 8, uploadThroughput: 10e6 / 8}, cpu: 1,
  },
};
const marks = [300, 700, 1200, 2000, 3000, 4500, 7000, 12000];

const browser = await chromium.launch({args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
for (const [name, profile] of Object.entries(profiles)) for (const [lang, route] of [['en', '/'], ['uk', '/uk/']]) {
  const context = await browser.newContext(profile.context);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  // A new context starts with an empty cache. Don't disable the cache (or add
  // Playwright routes, which do the same): hero.js requests the card back the
  // markup has already loaded, and a first visit fetches it only once.
  // Netlify's deploy-preview toolbar is blocked because production never loads it.
  await cdp.send('Network.setBlockedURLs', {urls: ['*/.netlify/scripts/*', '*://app.netlify.com/*']});
  await cdp.send('Network.emulateNetworkConditions', {offline: false, ...profile.network});
  if (profile.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: profile.cpu});
  await page.addInitScript(() => {
    const perf = window.__arrival = {fcp: 0, lcp: 0, cls: 0};
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.name === 'first-contentful-paint') perf.fcp = e.startTime; }).observe({type: 'paint', buffered: true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) perf.lcp = e.startTime; }).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) perf.cls += e.value; }).observe({type: 'layout-shift', buffered: true});
  });
  await page.setContent('<body style="margin:0;background:#777"></body>');
  const tag = `${name}-${lang}`, start = Date.now(), frames = [];
  page.goto(base + route, {waitUntil: 'commit'}).catch(() => {});
  for (const mark of marks) {
    const wait = mark - (Date.now() - start);
    if (wait > 0) await page.waitForTimeout(wait);
    // CDP captures the current frame; Playwright's screenshot would wait for fonts.
    const shot = await cdp.send('Page.captureScreenshot', {format: 'jpeg', quality: 72}).catch(() => null);
    if (!shot) continue;
    const file = `${tag}-${String(mark).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(out, file), Buffer.from(shot.data, 'base64'));
    frames.push({file, at: Date.now() - start});
  }
  const perf = await page.evaluate(() => window.__arrival).catch(() => null);
  console.log(tag, JSON.stringify({perf, frames: frames.map(f => `${f.file}@${f.at}ms`)}));
  await context.close();

  const width = name === 'phone' ? 170 : 420, cols = name === 'phone' ? 8 : 4;
  const cells = frames.map(f => `<figure><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(out, f.file)).toString('base64')}"><figcaption>${f.at} ms</figcaption></figure>`).join('');
  const sheet = await browser.newPage({viewport: {width: cols * (width + 6) + 6, height: 300}});
  await sheet.setContent(`<body style="margin:0;background:#222;color:#eee;font:12px sans-serif"><div style="display:grid;grid-template-columns:repeat(${cols},${width}px);gap:6px;padding:6px">${cells}</div><style>figure{margin:0}img{width:${width}px;display:block}</style></body>`);
  await sheet.waitForLoadState('load');
  await sheet.screenshot({path: path.join(out, `${tag}-sheet.png`), fullPage: true});
  await sheet.close();
}
await browser.close();
server?.close();
