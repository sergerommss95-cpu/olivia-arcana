// Smaller copies of the 78 card faces for responsive <img srcset> (see src/lib/daily/card-src.ts).
// The masters in public/cards/ are 896×1536; a phone figure at 15rem never needs more than
// 640px and most figures fit 448px, so serving the master everywhere wastes ~200 KB a card.
//
//   node scripts/card-sizes.mjs          # writes only missing or outdated copies
//   node scripts/card-sizes.mjs --force  # rewrites every copy
//
// Output keeps the master's filename: public/cards/w448/NN_slug.webp and public/cards/w640/NN_slug.webp.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const cards = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/cards');
const WIDTHS = [448, 640];
const DECK = 78;
// Faces only: the back (back-448.webp) and the thumbs/ and wheel/ folders are not part of the set.
const FACE = /^\d{2}_[a-z0-9_]+\.webp$/;
const force = process.argv.includes('--force');

const faces = fs.readdirSync(cards).filter((name) => FACE.test(name)).sort();
// srcset promises every size for every card, so a partial deck is an error, not a warning.
if (faces.length !== DECK) throw new Error(`Expected ${DECK} card faces in ${cards}, found ${faces.length}.`);

const totals = Object.fromEntries(WIDTHS.map((w) => [w, { written: 0, kept: 0, bytes: 0 }]));
for (const w of WIDTHS) fs.mkdirSync(path.join(cards, `w${w}`), { recursive: true });

for (const name of faces) {
  const source = path.join(cards, name);
  const sourceTime = fs.statSync(source).mtimeMs;
  await Promise.all(WIDTHS.map(async (w) => {
    const target = path.join(cards, `w${w}`, name);
    const total = totals[w];
    if (!force && fs.existsSync(target) && fs.statSync(target).mtimeMs >= sourceTime) {
      total.kept++;
      total.bytes += fs.statSync(target).size;
      return;
    }
    // Write beside the target and rename, so the running dev server never serves a half-written file.
    const temporary = `${target}.tmp`;
    await sharp(source)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(temporary);
    fs.renameSync(temporary, target);
    total.written++;
    total.bytes += fs.statSync(target).size;
  }));
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
const masters = faces.reduce((sum, name) => sum + fs.statSync(path.join(cards, name)).size, 0);
console.log(`${faces.length} faces, masters ${kb(masters)}.`);
for (const w of WIDTHS) {
  const { written, kept, bytes } = totals[w];
  console.log(`w${w}: ${written} written, ${kept} up to date, ${kb(bytes)} total (${kb(bytes / faces.length)} a card).`);
}
