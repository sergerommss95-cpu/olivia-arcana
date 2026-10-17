// website/scripts/card-mid.mjs
// The Major Arcana cut at 420 px wide into public/cards/mid/, the middle step
// of the portrait's srcset between the 120 px thumbnails and the 896 px art.
// A card the portrait shows 130–280 px wide (or 64 px on a 3× phone) takes
// this cut instead of the full art. Only the Majors: the portrait deals no
// other card. Made with sharp, which Next already installs for its images.
//
//   node scripts/card-mid.mjs

import { mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTH = 420;
const QUALITY = 80;
const here = path.dirname(fileURLToPath(import.meta.url));
const cards = path.join(here, "../public/cards");
const out = path.join(cards, "mid");
mkdirSync(out, { recursive: true });

const majors = readdirSync(cards).filter((f) => /^\d\d_[a-z_]+\.webp$/.test(f) && Number(f.slice(0, 2)) < 22).sort();
if (majors.length !== 22) throw new Error(`expected the 22 Majors in ${cards}, found ${majors.length}`);

let before = 0;
let after = 0;
for (const file of majors) {
  const target = path.join(out, file);
  const info = await sharp(path.join(cards, file)).resize({ width: WIDTH }).webp({ quality: QUALITY, effort: 6 }).toFile(target);
  before += statSync(path.join(cards, file)).size;
  after += info.size;
  console.log(`${file.padEnd(28)} ${info.width}×${info.height}  ${(info.size / 1024).toFixed(1)} kB`);
}
console.log(`22 cards: ${(before / 1024).toFixed(0)} kB at 896 px → ${(after / 1024).toFixed(0)} kB at ${WIDTH} px`);
