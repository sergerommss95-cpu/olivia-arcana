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
