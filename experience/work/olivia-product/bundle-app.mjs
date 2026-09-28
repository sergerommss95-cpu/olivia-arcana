// Bundle app.js twice: the full build (Ukrainian pages and the portable file)
// and an English build without the Ukrainian dictionary and card notes, which
// English visitors never use. Called by build.py.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const esbuild = require(path.join(here, '../background-study/node_modules/esbuild'));

const common = {
  entryPoints: [path.join(here, 'app.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  charset: 'utf8',
  target: 'es2022',
  logLevel: 'warning',
};

// English pages keep the same modules with empty Ukrainian data: t() then
// returns the English source and card notes stay in English.
const englishOnly = {
  name: 'english-only',
  setup(build) {
    build.onResolve({ filter: /\/(locale-uk|card-notes-uk)\.js$/ }, args => ({ path: args.path, namespace: 'english-only' }));
    build.onLoad({ filter: /.*/, namespace: 'english-only' }, args => ({
      loader: 'js',
      contents: args.path.includes('card-notes-uk') ? 'export const UK_NOTES = {};' : 'export const UK_TEXT = {}; export const UK_CARDS = {};',
    }));
  },
};

await esbuild.build({ ...common, outfile: path.join(here, 'app.bundle.js') });
await esbuild.build({ ...common, outfile: path.join(here, 'app.en.bundle.js'), plugins: [englishOnly] });
