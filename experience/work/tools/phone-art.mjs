// Phone-sized hero art. On stages narrower than 700 px, hero.js draws each
// Major Arcana onto a 512×1024 canvas with high-quality smoothing. Doing the
// same resize once here lets phones download far less for identical texture
// dimensions. Each texture is resized in Chromium's canvas (hero.js's own
// resampling), then encoded with sharp's slower WebP settings: quality 81,
// effort 6, smart subsampling. Against the lossless resize that matches the
// earlier canvas encode at quality 0.85 (PSNR 36.4 vs 36.3 dB) in 12% fewer bytes.
// The phone card back (768 px wide, the most any phone view shows) is made the
// same way from the approved back. Generated files are committed, so builds stay
// deterministic. Needs Playwright's Chromium and the website's sharp dependency:
//   npm --prefix website ci --ignore-scripts
//   node experience/work/tools/phone-art.mjs \
//     experience/work/hero-v12/assets/public/cards-portal \
//     experience/work/hero-v12/assets/public/cards-portal-phone \
//     experience/outputs/olivia-card-back.webp experience/outputs/olivia-card-back-phone.webp
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const sharp = createRequire(path.resolve('website/package.json'))('sharp');
const [src, dst, backSrc, backDst] = process.argv.slice(2);
const encode = input => sharp(input).webp({quality: 81, effort: 6, smartSubsample: true}).toBuffer();
fs.mkdirSync(dst, {recursive: true});
// Chromium's default canvas (not SwiftShader), the resize the quality figures were measured on.
const b = await chromium.launch();
const p = await b.newPage();
await p.setContent('<canvas></canvas>');
let total = 0, before = 0;
for (const name of fs.readdirSync(src).filter(n => n.endsWith('.webp')).sort()) {
  const bytes = fs.readFileSync(path.join(src, name));
  before += bytes.length;
  const png = await p.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/webp;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png').split(',')[1];
  }, bytes.toString('base64'));
  const data = await encode(Buffer.from(png, 'base64'));
  fs.writeFileSync(path.join(dst, name), data);
  total += data.length;
  console.log(name, bytes.length, '->', data.length);
}
console.log('total', before, '->', total);
await b.close();
if (backSrc && backDst) {
  const meta = await sharp(backSrc).metadata(), width = 768, height = Math.round(meta.height * width / meta.width);
  const data = await encode(await sharp(backSrc).resize(width, height, {kernel: 'lanczos3'}).png().toBuffer());
  fs.writeFileSync(backDst, data);
  console.log(path.basename(backSrc), `${meta.width}x${meta.height}`, fs.statSync(backSrc).size, '->', `${width}x${height}`, data.length);
}
