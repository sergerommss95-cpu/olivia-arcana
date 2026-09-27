const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = process.cwd();
const ts = require(path.join(root, 'node_modules/typescript'));
const React = require(path.join(root, 'node_modules/react'));
const { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server'));
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText, file);
}
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
const originalLoad = Module._load;
Module._load = function(request, parent, ...rest) {
  if (request === '@/components/transitions/TransitionLink') return { __esModule: true, default: props => React.createElement('a', props) };
  if (request.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
  return originalLoad.call(this, request, parent, ...rest);
};
const { computeNatalChart } = require(path.join(root, 'src/lib/natal-chart.ts'));
const Atlas = require(path.join(root, 'src/components/chart/NatalAtlas.tsx')).default;
const base = { year: 1995, month: 6, day: 15, hour: 14, minute: 30, latitude: 51.5074, longitude: -.1278, timezone: 1, city: 'London', timeKnown: true };
const timed = computeNatalChart(base);
const originalTimed = JSON.stringify(timed);
const html = renderToStaticMarkup(React.createElement(Atlas, { chart: timed, intro: false, onNewChart() {} }));
assert.equal(JSON.stringify(timed), originalTimed, 'Rendering must not alter computation results');
assert.match(html, /Whole-sign houses/);
assert.match(html, />ASC<\/text>/);
assert.match(html, />MC<\/text>/);
assert.match(html, /Sun in Gemini/);
assert.match(html, /aria-pressed="true"/);
assert.equal((html.match(/role="button"/g) || []).length, 10);
assert.equal((html.match(/class="anchor"/g) || []).length, 10);
assert.equal((html.match(/class="planetDisc"/g) || []).length, 10);
let untimed;
for (let day = 1; day <= 28; day++) {
  const chart = computeNatalChart({ ...base, day, hour: 12, minute: 0, timeKnown: false });
  if (chart.moonSignUncertain) { untimed = chart; break; }
}
assert.ok(untimed, 'The fixture must include a Moon ingress on the unknown-time date');
const originalUntimed = JSON.stringify(untimed);
const partial = renderToStaticMarkup(React.createElement(Atlas, { chart: untimed, intro: false, onNewChart() {} }));
assert.equal(JSON.stringify(untimed), originalUntimed);
assert.match(partial, /Planet positions use local noon/);
assert.match(partial, /Birth time may change this sign/);
assert.match(partial, /The Moon moved from/);
assert.match(partial, /Rising unknown/);
assert.doesNotMatch(partial, />ASC<\/text>|>MC<\/text>/);
assert.doesNotMatch(partial, /class="houses"/);
assert.doesNotMatch(partial, /House [0-9]/);
assert.equal((partial.match(/class="anchor"/g) || []).length, 10);
console.log('Timed chart render: 10 anchored planets, ASC/MC, houses, default Sun reading; data unchanged.');
console.log(`Untimed chart render: ${untimed.input.year}-${untimed.input.month}-${untimed.input.day}, Moon-ingress uncertainty visible, no houses/angles, noon label; data unchanged.`);
