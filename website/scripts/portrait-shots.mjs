// website/scripts/portrait-shots.mjs
// Dev only. Screenshots of /portrait/ against a running `next dev`, in headless
// Chrome over the DevTools protocol (no window, no dependencies). A reading in
// progress is seeded into localStorage, and GET /api/portrait/<id> is answered
// from a fixture on a timeline, so the page runs exactly as it would mid-reading.
//
//   NODE_OPTIONS="--disable-warning=MODULE_TYPELESS_PACKAGE_JSON" \
//   node scripts/portrait-shots.mjs --base http://localhost:3417 --locale en \
//     --viewport 1440x900 --times 1,8,35 [--reduced] [--a-at 40] [--bc-at 70] \
//     [--full] [--ax] --out ../docs/superpowers/evidence/2026-10-16-m3/laying
//
// --a-at N   queued/running until N s after the Laying mounts, then stage A
// --bc-at N  then stages B and C, status "done", with teachings
// --fail-at N  instead, from N s: status "failed" with stage A only (B could not be written)
// --full     capture the whole page height, not just the viewport (this re-lays out
//            the page and restarts running CSS animations: use it for layout, not timing)
// --ax       print the accessibility tree's names for the lattice and live region
// --eval JS  print the value of a page expression after the last shot
// --focus S  focus the element matching selector S before each shot
// --scroll S scroll the element matching selector S to the top of the window before each shot
// --before JS  evaluate a page expression before each shot (e.g. open a dialog)
// --wait MS  how long to let --before settle (default 600)
// --keys K   press keys before each shot (after --focus), e.g. "Tab,Enter,Tab*3,Shift+Tab,Escape";
//            after each, print where focus is and whether it is inside a dialog
// --tag T    add T to the file names

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { citedTeachings, selectTeachings } from "../netlify/portrait/teachings.ts";
import { birthChart } from "../src/lib/astrology/chart.js";
import { arkanPortrait } from "../src/lib/portrait/arkan.js";
import { nameNumbers } from "../src/lib/portrait/numbers.js";
import { signsThroughDay } from "../src/lib/portrait/uncertain.js";
import { buildPacket } from "../src/lib/portrait/packet.js";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const JOB_KEY = "olivia:portrait-job";
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

function args(argv) {
  const out = { base: "http://localhost:3417", locale: "en", viewport: "1440x900", times: "1,8,35", aAt: Infinity, bcAt: Infinity, failAt: Infinity, out: "shots", reduced: false, full: false, ax: false, wait: 600 };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
    if (["reduced", "full", "ax"].includes(key)) out[key] = true;
    else out[key] = argv[++i];
  }
  const [width, height] = String(out.viewport).split("x").map(Number);
  return { ...out, width, height, times: String(out.times).split(",").map(Number).sort((a, b) => a - b), aAt: Number(out.aAt), bcAt: Number(out.bcAt), failAt: Number(out.failAt), wait: Number(out.wait) };
}

/** The reading the page follows: EN from the M2 evidence run, UK from M1's with its packet recalculated. */
function fixture(locale) {
  const bank = readJson(path.join(here, "../netlify/portrait/knowledge/bank.json"));
  if (locale === "en") {
    const run = readJson(path.join(repo, "docs/superpowers/evidence/2026-10-16-m2/m2-medium/m1-en-olena.json"));
    return { id: "fixture-en", packet: run.packet, stages: run.stages, teachings: citedTeachings(selectTeachings(run.packet, bank), bank, run.stages) };
  }
  const run = readJson(path.join(repo, "docs/superpowers/evidence/2026-10-15-m1/uk-unknown-time.json"));
  const date = "1990-03-03", zone = "Europe/Kyiv";
  const packet = buildPacket({
    locale: "uk",
    chart: birthChart({ date, time: null, zone, latitude: 50.45, longitude: 30.52 }),
    arkan: arkanPortrait(date),
    numbers: nameNumbers({ date, name: "Олена Коваль", latin: "Olena Koval" }),
    daySigns: signsThroughDay({ date, zone }),
  });
  return { id: "fixture-uk", packet, stages: run.stages, teachings: run.teachings };
}

function statusAt(seconds, fx, opts) {
  if (seconds < opts.aAt) return { status: seconds < 3 ? "queued" : "running", stages: {}, teachings: {}, error: null };
  if (seconds >= opts.failAt) return { status: "failed", stages: { a: fx.stages.a }, teachings: fx.teachings, error: "stage_b_invalid" };
  if (seconds < opts.bcAt) return { status: "running", stages: { a: fx.stages.a }, teachings: fx.teachings, error: null };
  return { status: "done", stages: fx.stages, teachings: fx.teachings, error: null, costCents: 0 };
}

/** A minimal DevTools client: one browser socket, flattened page sessions. */
async function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  const listeners = [];
  let next = 0;
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else resolve(msg.result);
    } else for (const fn of listeners) fn(msg);
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  return {
    send(method, params = {}, sessionId) {
      const id = ++next;
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    on(fn) { listeners.push(fn); },
    close() { ws.close(); },
  };
}

const KEYS = { Tab: { code: "Tab", vk: 9 }, Enter: { code: "Enter", vk: 13, text: "\r" }, Escape: { code: "Escape", vk: 27 } };
/** Where focus is, said briefly: its role or tag, its name, and whether a dialog holds it. */
const WHERE = `(() => { const el = document.activeElement; if (!el || el === document.body) return "body";
  const name = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 60);
  return \`\${el.getAttribute("role") || el.tagName.toLowerCase()} "\${name}"\${el.closest("[role=dialog]") ? " [in dialog]" : ""}\`; })()`;

/** Presses each key in turn ("Tab*3" thrice, "Shift+Tab" with Shift held) and prints where focus lands. */
async function press(send, list) {
  for (const item of list.split(",").map((k) => k.trim()).filter(Boolean)) {
    const [chord, times] = item.split("*");
    const parts = chord.split("+");
    const key = parts.pop();
    const spec = KEYS[key];
    if (!spec) throw new Error(`unknown key ${key}`);
    const modifiers = parts.includes("Shift") ? 8 : 0;
    for (let n = 0; n < Number(times ?? 1); n++) {
      const base = { key, code: spec.code, windowsVirtualKeyCode: spec.vk, nativeVirtualKeyCode: spec.vk, modifiers };
      await send("Input.dispatchKeyEvent", { type: "keyDown", ...base, ...(spec.text ? { text: spec.text } : {}) });
      await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
      await sleep(key === "Tab" ? 120 : 700);
      const { result } = await send("Runtime.evaluate", { expression: WHERE, returnByValue: true });
      console.log(`key  ${chord.padEnd(9)} → ${result.value}`);
    }
  }
}

function launch() {
  const profile = mkdtempSync(path.join(process.env.TMPDIR || tmpdir(), "portrait-shots-"));
  const chrome = spawn(CHROME, [
    "--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-port=0",
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--disable-extensions", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  const endpoint = new Promise((resolve, reject) => {
    let buffer = "";
    chrome.stderr.on("data", (chunk) => {
      buffer += chunk;
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(buffer);
      if (match) resolve(match[1]);
    });
    chrome.on("exit", (code) => reject(new Error(`Chrome exited (${code})`)));
    setTimeout(() => reject(new Error("Chrome did not start")), 20_000);
  });
  const stop = () => { chrome.kill("SIGTERM"); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500); };
  return { endpoint, stop };
}

async function main() {
  const opts = args(process.argv.slice(2));
  const fx = fixture(opts.locale);
  const route = `${opts.base}${opts.locale === "uk" ? "/uk" : ""}/portrait/`;
  mkdirSync(opts.out, { recursive: true });
  // Warm the dev server's compile so the clock below measures the page, not the build.
  await fetch(route).then((r) => r.text()).catch(() => { throw new Error(`no dev server at ${opts.base}`); });

  const chrome = launch();
  const cdp = await connect(await chrome.endpoint);
  const problems = [];
  try {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const send = (method, params) => cdp.send(method, params, sessionId);
    let mountedAt = null;
    const elapsed = () => (mountedAt === null ? 0 : (performance.now() - mountedAt) / 1000);

    cdp.on((msg) => {
      if (msg.sessionId !== sessionId) return;
      const p = msg.params;
      if (msg.method === "Fetch.requestPaused") {
        const body = JSON.stringify(statusAt(elapsed(), fx, opts));
        send("Fetch.fulfillRequest", {
          requestId: p.requestId, responseCode: 200,
          responseHeaders: [{ name: "content-type", value: "application/json" }, { name: "cache-control", value: "no-store" }],
          body: Buffer.from(body).toString("base64"),
        // A poll aborted mid-flight (a reload, a remount) has nothing left to answer.
        }).catch((e) => { if (!/Invalid InterceptionId/.test(e.message)) problems.push(`fulfill: ${e.message}`); });
      } else if (msg.method === "Runtime.exceptionThrown") {
        problems.push(`exception: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`);
      } else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning", "assert"].includes(p.type)) {
        problems.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)}`);
      } else if (msg.method === "Log.entryAdded" && ["error", "warning"].includes(p.entry.level)) {
        problems.push(`log.${p.entry.level}: ${p.entry.text.slice(0, 300)} ${p.entry.url ?? ""}`);
      }
    });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: opts.width, height: opts.height, deviceScaleFactor: 1, mobile: opts.width < 720 });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: opts.reduced ? "reduce" : "no-preference" }] });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      // The site's install banner is told it was dismissed, so it never covers the page.
      source: `try { localStorage.setItem(${JSON.stringify(JOB_KEY)}, ${JSON.stringify(JSON.stringify({ id: fx.id, packet: fx.packet }))}); localStorage.setItem("olivia-arcana-install-dismissed", String(Date.now())); } catch {}
        document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"; document.head.append(s); });`,
    });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/portrait/*", requestStage: "Request" }] });
    // The clock starts when the Laying mounts, or the reader, for a reading reopened after stage A.
    const mounted = async () => {
      const deadline = performance.now() + 60_000;
      for (;;) {
        if (performance.now() > deadline) throw new Error("neither the Laying nor the reader mounted");
        const { result } = await send("Runtime.evaluate", { expression: "Boolean(document.querySelector('[data-laying], [data-reader]'))", returnByValue: true });
        if (result.value) return performance.now();
        await sleep(40);
      }
    };
    // The first visit compiles the page's chunks and fills the cache; the clock starts on the second.
    await send("Page.navigate", { url: route });
    await mounted();
    await sleep(1500);
    problems.length = 0;
    await send("Page.navigate", { url: route });
    mountedAt = await mounted();

    const tag = `${opts.locale}-${opts.width}x${opts.height}${opts.reduced ? "-reduced" : ""}${opts.tag ? `-${opts.tag}` : ""}`;
    for (const t of opts.times) {
      const wait = mountedAt + t * 1000 - performance.now();
      if (wait > 0) await sleep(wait);
      if (opts.focus) {
        await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(opts.focus)})?.focus()` });
        // What the focus sets in motion (a passage lighting its cards) settles before the shot.
        await sleep(800);
      }
      if (opts.keys) await press(send, opts.keys);
      if (opts.before) {
        await send("Runtime.evaluate", { expression: opts.before, awaitPromise: true });
        await sleep(opts.wait);
      }
      if (opts.scroll) {
        await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(opts.scroll)})?.scrollIntoView({ block: "start", behavior: "instant" })` });
        await sleep(400);
      }
      let clip;
      if (opts.full) {
        const { result } = await send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true });
        clip = { x: 0, y: 0, width: opts.width, height: result.value, scale: 1 };
      }
      const asked = elapsed();
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 80, ...(clip ? { clip, captureBeyondViewport: true } : {}) });
      const file = path.join(opts.out, `${tag}-t${String(t).padStart(2, "0")}.jpg`);
      writeFileSync(file, Buffer.from(shot.data, "base64"));
      console.log(`${file}  (asked at ${asked.toFixed(2)} s, saved at ${elapsed().toFixed(2)} s)`);
    }

    if (opts.eval) {
      const { result, exceptionDetails } = await send("Runtime.evaluate", { expression: opts.eval, returnByValue: true, awaitPromise: true });
      console.log(`eval  ${exceptionDetails ? exceptionDetails.text : JSON.stringify(result.value)}`);
    }
    if (opts.ax) {
      const { nodes } = await send("Accessibility.getFullAXTree");
      const named = nodes.filter((n) => !n.ignored && ["image", "img", "heading", "status", "list", "button", "listitem", "dialog", "link"].includes(n.role?.value) && n.name?.value);
      for (const n of named) console.log(`ax  ${n.role.value.padEnd(9)} ${n.name.value}`);
      const { result } = await send("Runtime.evaluate", { expression: "[...document.querySelectorAll('[role=status]')].map((el) => el.textContent).join(' | ')", returnByValue: true });
      console.log(`ax  live      ${result.value}`);
    }
  } finally {
    cdp.close();
    chrome.stop();
  }
  if (problems.length) {
    console.log(`console: ${problems.length} problem(s)`);
    for (const p of problems) console.log(`  ${p}`);
    process.exitCode = 1;
  } else console.log("console: clean");
}

await main();
