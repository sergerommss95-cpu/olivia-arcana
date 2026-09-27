// Render the film frame by frame from stage.html and encode it with ffmpeg.
//   node render.mjs <footage-dir> <landscape|portrait> <out.mp4>          full film (near-lossless master)
//   node render.mjs <footage-dir> <landscape|portrait> <dir> --stills 3,10,20   stills at those seconds
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [footage = 'footage-en', layout = 'landscape', out = 'master.mp4', flag, list] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname);
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.js': 'text/javascript'};
const fonts = path.resolve(here, '../../fonts-inline.css');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = pathname === '/fonts-inline.css' ? fonts : path.join(here, pathname);
  if ((file !== fonts && !file.startsWith(here)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'max-age=3600'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const size = layout === 'landscape' ? {width: 1920, height: 1080} : {width: 1080, height: 1350};
const browser = await chromium.launch();
const page = await browser.newPage({viewport: size, deviceScaleFactor: 1});
page.on('pageerror', error => console.error('page error:', error.message));
await page.goto(`http://127.0.0.1:${server.address().port}/stage.html?layout=${layout}&footage=${footage}`);
const {duration, fps} = await page.evaluate(() => window.ready);
const cdp = await page.context().newCDPSession(page);
const shot = async () => Buffer.from((await cdp.send('Page.captureScreenshot', {format: 'png', optimizeForSpeed: true})).data, 'base64');

if (flag === '--stills') {
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
