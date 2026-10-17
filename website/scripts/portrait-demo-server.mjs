// website/scripts/portrait-demo-server.mjs
// Dev only. Serves a static export (`out/`) and fakes /api/portrait on a timeline, so the Birth Portrait can be tried
// end to end on this machine or a phone on the same Wi-Fi without the Netlify functions or the AI Gateway.
// The reading text is a fixed sample (the M2 eval readings for the fictional "Olena Koval"); the cards, numbers and sky
// come from whatever the visitor types, because the page computes the packet itself.
//
//   NODE_OPTIONS="--disable-warning=MODULE_TYPELESS_PACKAGE_JSON" \
//   node scripts/portrait-demo-server.mjs <out-dir> [port]      (A_AT=32 BC_AT=60 seconds by default)
//
// Anything under <out-dir>/mock/ is served as-is, so design mockups can sit beside the real pages.
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [outArg, portArg] = process.argv.slice(2);
if (!outArg) throw new Error("usage: portrait-demo-server.mjs <out-dir> [port]");
const outDir = path.resolve(outArg);
const PORT = Number(portArg ?? 4321);
const A_AT = Number(process.env.A_AT ?? 32);
const BC_AT = Number(process.env.BC_AT ?? 60);
const { selectTeachings, citedTeachings } = await import(path.join(web, "netlify/portrait/teachings.ts"));
const bank = JSON.parse(readFileSync(path.join(web, "netlify/portrait/knowledge/bank.json"), "utf8"));
const evidence = path.join(web, "../docs/superpowers/evidence/2026-10-16-m2/m2-medium");

function sample(locale) {
  const run = JSON.parse(readFileSync(path.join(evidence, locale === "uk" ? "m1-uk-olena.json" : "m1-en-olena.json"), "utf8"));
  const { outline: _hidden, ...a } = run.stages.a;
  return { stages: { ...run.stages, a }, teachings: citedTeachings(selectTeachings(run.packet, bank), bank, run.stages) };
}
const SAMPLES = { en: sample("en"), uk: sample("uk") };
const jobs = new Map();

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json", ".mp4": "video/mp4", ".avif": "image/avif" };
const send = (res, code, body, type = "application/json") => {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

function status(job) {
  const s = (Date.now() - job.started) / 1000;
  const fx = SAMPLES[job.locale];
  if (s < A_AT) return { status: s < 3 ? "queued" : "running", stages: {}, teachings: {}, error: null };
  if (s < BC_AT) return { status: "running", stages: { a: fx.stages.a }, teachings: fx.teachings, error: null };
  return { status: "done", stages: fx.stages, teachings: fx.teachings, error: null, costCents: 0 };
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/portrait" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      let locale = "en";
      try { locale = JSON.parse(raw)?.packet?.locale === "uk" ? "uk" : "en"; } catch { /* default */ }
      const id = randomUUID();
      jobs.set(id, { started: Date.now(), locale });
      console.log(`new demo reading ${id.slice(0, 8)} (${locale})`);
      send(res, 202, { id });
    });
    return;
  }
  const m = url.pathname.match(/^\/api\/portrait\/([\w-]+)$/);
  if (m) { const job = jobs.get(m[1]); return job ? send(res, 200, status(job)) : send(res, 404, { error: "missing" }); }
  if (url.pathname.startsWith("/api/")) return send(res, 404, { error: "not in demo" });

  let file = path.join(outDir, decodeURIComponent(url.pathname));
  if (!file.startsWith(outDir)) return send(res, 403, "no", "text/plain");
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith("/")) { res.writeHead(308, { location: `${url.pathname}/${url.search}` }); return res.end(); }
    file = path.join(file, "index.html");
  } else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file)) return send(res, 404, existsSync(path.join(outDir, "404.html")) ? readFileSync(path.join(outDir, "404.html")) : "Not found", "text/html; charset=utf-8");
  send(res, 200, readFileSync(file), TYPES[path.extname(file)] ?? "application/octet-stream");
}).listen(PORT, "0.0.0.0", () => {
  const lan = Object.values(networkInterfaces()).flat().find((i) => i?.family === "IPv4" && !i.internal)?.address;
  console.log(`demo on http://localhost:${PORT}/portrait/  (phone on same Wi-Fi: http://${lan}:${PORT}/portrait/)  stage A at ${A_AT}s, chapters at ${BC_AT}s`);
});
