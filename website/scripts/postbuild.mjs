// Static-export fix-ups that Next's single root layout cannot express.
// The root layout renders <html lang="en">; every page under /uk/ is Ukrainian,
// so its exported HTML must say so for screen readers, translation prompts and
// search engines. (src/app/uk/layout.tsx keeps the attribute right after
// client-side navigation.)
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve(process.argv[2] || 'out');
const ukRoot = path.join(out, 'uk');
if (!fs.existsSync(ukRoot)) throw new Error(`No exported Ukrainian pages in ${ukRoot}. Run next build first.`);

let changed = 0;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    const next = html.replace(/<html lang="en"/, '<html lang="uk"');
    if (next === html) {
      if (!/<html lang="uk"/.test(html)) throw new Error(`Unexpected <html> element in ${file}`);
      continue;
    }
    fs.writeFileSync(file, next);
    changed++;
  }
}
visit(ukRoot);
console.log(`Marked ${changed} exported Ukrainian pages with lang="uk".`);

// Deck selection must ship with the native routes and complete artwork together.
// A production build from a divergent branch previously dropped these pages.
for (const route of ['decks', 'uk/decks']) {
  const file = path.join(out, route, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing required route: /${route}/`);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('Amielle') || !html.includes('<h1')) {
    throw new Error(`Deck collection was not rendered in /${route}/`);
  }
}
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'experience/manifest.json'), 'utf8'));
for (const id of ['olivia', 'space-between', 'amielle-relationships-v1', 'amielle-relationships-v2']) {
  const deck = manifest.decks?.[id];
  if (!deck?.back || Object.keys(deck.cards || {}).length !== 78) {
    throw new Error(`Incomplete exported deck: ${id}`);
  }
  for (const asset of [deck.back, ...Array.from({ length: 78 }, (_, card) => deck.cards[card])]) {
    if (!asset || !manifest.assets[asset] || !fs.existsSync(path.join(out, 'experience', asset))) {
      throw new Error(`Missing exported artwork for ${id}: ${asset}`);
    }
  }
}
console.log('Verified both Decks routes and two complete 78-card decks.');

for(const edition of [manifest.decks['amielle-relationships-v1'],manifest.decks['amielle-relationships-v2']]){
for(const variant of ['men','women'])for(const id of [6,15,25]){const asset=edition.variants?.[variant]?.[id];if(!asset||!manifest.assets[asset]||!fs.existsSync(path.join(out,'experience',asset)))throw new Error(`Missing Amielle alternative: ${variant}/${id}`);}
}
console.log('Verified versioned Amielle artwork and six couple alternatives.');
