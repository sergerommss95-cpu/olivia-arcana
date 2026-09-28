// Render a film frame by frame from its page and encode it with ffmpeg.
//   node render.mjs <footage-dir> <landscape|portrait> <out.mp4>                    full film (near-lossless master)
//   node render.mjs <footage-dir> <landscape|portrait> <dir> --stills 3,10,20       stills at those seconds
// The page is the product film (film.html) unless --page stage.html asks for the walkthrough.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
const list = option('--stills'), stage = option('--page') || 'film.html';
const [footage = 'footage-en', layout = 'landscape', out = 'master.mp4'] = args;
const here = path.dirname(new URL(import.meta.url).pathname);
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.webp': 'image/webp'};
// Files from elsewhere in the repository. The deck shows Temperance, the card seed 17 draws;
// if the capture draws another card, point card-face.webp at that card.
const shared = {
  '/fonts-inline.css': path.resolve(here, '../../fonts-inline.css'),
  '/card-back.webp': path.resolve(here, '../../../outputs/olivia-card-back.webp'),
  '/card-face.webp': path.resolve(here, '../../hero-v12/assets/public/cards-portal/14_temperance.webp'),
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = shared[pathname] || path.join(here, pathname);
  if ((!shared[pathname] && !file.startsWith(here)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'max-age=3600'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const size = layout === 'landscape' ? {width: 1920, height: 1080} : {width: 1080, height: 1350};
const browser = await chromium.launch();
const page = await browser.newPage({viewport: size, deviceScaleFactor: 1});
page.on('pageerror', error => console.error('page error:', error.message));
await page.goto(`http://127.0.0.1:${server.address().port}/${stage}?layout=${layout}&footage=${footage}`);
const {duration, fps} = await page.evaluate(() => window.ready);
const cdp = await page.context().newCDPSession(page);
const shot = async () => Buffer.from((await cdp.send('Page.captureScreenshot', {format: 'png', optimizeForSpeed: true})).data, 'base64');

if (list) {
  fs.mkdirSync(out, {recursive: true});
  for (const t of list.split(',').map(Number)) {
    await page.evaluate(time => window.render(time), t);
    fs.writeFileSync(path.join(out, `${layout}-${String(t).padStart(5, '0')}.png`), await shot());
  }
  console.log(`stills written to ${out}`);
} else {
  const total = Math.round(duration * fps);
  const ffmpeg = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv444p', out], {stdio: ['pipe', 'inherit', 'inherit']});
  const started = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate(time => window.render(time), i / fps);
    const png = await shot();
    if (!ffmpeg.stdin.write(png)) await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    if (i % 150 === 0) console.log(`  ${i}/${total} frames, ${((Date.now() - started) / 1000).toFixed(0)} s`);
  }
  ffmpeg.stdin.end();
  await new Promise(resolve => ffmpeg.on('close', resolve));
  console.log(`${out}: ${total} frames (${duration.toFixed(1)} s) in ${((Date.now() - started) / 1000).toFixed(0)} s`);
}
await browser.close();
server.close();
