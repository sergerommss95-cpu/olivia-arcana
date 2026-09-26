// Phone-sized hero art. On stages narrower than 700 px, hero.js draws each
// Major Arcana onto a 512×1024 canvas with high-quality smoothing. Doing the
// same resize once here lets phones download ~1.8 MB instead of ~5.3 MB for
// identical texture dimensions. The generated files are committed, so builds
// stay deterministic. Run with Playwright's Chromium available:
//   node experience/work/tools/phone-art.mjs \
//     experience/work/hero-v12/assets/public/cards-portal \
//     experience/work/hero-v12/assets/public/cards-portal-phone 0.85
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const [src, dst, quality='0.85'] = process.argv.slice(2);
fs.mkdirSync(dst, {recursive: true});
const b = await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p = await b.newPage();
await p.setContent('<canvas></canvas>');
let total = 0, before = 0;
for (const name of fs.readdirSync(src).filter(n => n.endsWith('.webp')).sort()) {
  const bytes = fs.readFileSync(path.join(src, name));
  before += bytes.length;
  const out = await p.evaluate(async ({b64, q}) => {
    const img = new Image(); img.src = 'data:image/webp;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', q));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return {b64: btoa(s), w: img.naturalWidth, h: img.naturalHeight};
  }, {b64: bytes.toString('base64'), q: Number(quality)});
  const data = Buffer.from(out.b64, 'base64');
  fs.writeFileSync(path.join(dst, name), data);
  total += data.length;
  console.log(name, `${out.w}x${out.h}`, bytes.length, '->', data.length);
}
console.log('total', before, '->', total);
await b.close();
