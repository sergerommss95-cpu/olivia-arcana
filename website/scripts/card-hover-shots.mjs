// website/scripts/card-hover-shots.mjs
// Dev only. Evidence for the card name plate (components/CardNameHover.tsx):
// headless Chrome over the DevTools protocol (no window) points a real mouse
// (Input.dispatchMouseEvent) at a card's centre, or tabs onto it, on each
// scene below, prints what the plate says, and saves the viewport and a close
// crop as JPEG. Portrait scenes answer /api/portrait/<id> from the M2 fixture,
// as scripts/portrait-shots.mjs does.
//
//   NODE_OPTIONS="--disable-warning=MODULE_TYPELESS_PACKAGE_JSON" \
//   node scripts/card-hover-shots.mjs --base http://127.0.0.1:3417 \
//     --out ../docs/superpowers/evidence/2026-10-17-card-hover [--only cards-grid,laying-face-down] [--tag v2]
//     [--eval JS]   print a page expression once each scene is set up

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { citedTeachings, selectTeachings } from "../netlify/portrait/teachings.ts";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const PROFILE = { v: 1, date: "1990-03-03", time: "14:30", place: { en: "Kyiv", uk: "Київ", country: "UA", countryEn: "Ukraine", countryUk: "Україна", lat: 50.45, lon: 30.52, zone: "Europe/Kyiv" } };
const nth = (selector, n = 0) => `document.querySelectorAll(${JSON.stringify(selector)})[${n}]`;
const notInDock = (selector) => `[...document.querySelectorAll(${JSON.stringify(selector)})].find((el) => !el.closest("[data-dock]"))`;

/**
 * Each scene: a page, what to wait for, an optional setup, the element to point at
 * (or to tab onto, with focus: true), and what the plate should say (null: no plate).
 */
const SCENES = [
  { name: "cards-grid", path: "/cards/", target: nth(".cl-row .cl-thumb", 4), expect: "IV The Emperor" },
  { name: "cards-grid-keyboard", path: "/cards/", focus: true, target: nth("a.cl-row", 17), expect: "XVII The Star" },
  // Tab onto a card below the fold: the browser scrolls to it, and the plate follows once the scroll stops.
  { name: "cards-grid-keyboard-scroll", path: "/cards/", focus: true, fromTop: true, target: nth("a.cl-row", 40), expect: "Five of Cups" },
  { name: "card-page-hero", path: "/cards/the-star/", target: nth("main img"), expect: null },
  { name: "card-page-pair", path: "/cards/the-star/", target: `document.querySelectorAll("#pairs img")[1]` },
  { name: "card-page-shared", path: "/cards/the-star/", target: `document.querySelector("#shared-title")?.parentElement.querySelector("img")` },
  { name: "uk-cards-grid", path: "/uk/cards/", target: nth("main ul img", 2), expect: "II Верховна Жриця" },
  { name: "uk-card-page-pair", path: "/uk/cards/the-moon/", target: `document.querySelectorAll("#pairs img")[1]` },
  { name: "learn-hub", path: "/learn/", target: nth("main img", 1) },
  // A chart reopened from this device (the seeded profile) arrives with its three cards already turned.
  { name: "birth-chart-three", path: "/astrology/birth-chart/", seed: { "olivia:birth-profile": PROFILE }, ready: "main a img",
    target: `[...document.querySelectorAll("main a img")].find((img) => /\\/cards\\/\\d\\d_/.test(img.src))`, expect: "XVIII The Moon" },
  // Showing the chart again from the filled form ("Change details", then submit) deals the three cards face down.
  { name: "birth-chart-face-down", path: "/astrology/birth-chart/", seed: { "olivia:birth-profile": PROFILE }, ready: "main a img",
    setup: `(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Change details").click(); await wait(600);
      document.querySelector("main form button[type=submit]").click(); await wait(1800); })()`,
    target: `[...document.querySelectorAll("main button img")].find((img) => img.src.includes("/cards/back"))`, expect: null },
  { name: "birth-chart-wheel", path: "/astrology/birth-chart/", seed: { "olivia:birth-profile": PROFILE }, ready: "main a img", target: nth("main button img[src*='/wheel/']", 2) },
  { name: "birth-chart-carry", path: "/astrology/birth-chart/", seed: { "olivia:birth-profile": PROFILE }, ready: "main a img", target: nth("main img[src*='/thumbs/']") },
  // The reading experience (its own hashed deck files) on the homepage.
  { name: "home-card", path: "/", ready: "document.querySelector('img[src*=\"17-the-star\"]')", settle: 3000, target: `document.querySelector('img[src*="17-the-star"]')` },
  // The sample card is dealt face down (its face turned away under backface-visibility: hidden).
  { name: "home-face-down", path: "/", ready: "document.querySelector('img[src*=\"09-the-hermit\"]')", settle: 3000, target: `document.querySelector('img[src*="09-the-hermit"]')`, expect: null },
  { name: "laying-face-down", path: "/portrait/", portrait: "running", ready: "[data-laying] [data-turned=true]", settle: 1200, target: nth("[data-laying] [data-turned=false]"), expect: null },
  { name: "laying-turned", path: "/portrait/", portrait: "running", ready: "[data-laying] [data-turned=true]", settle: 1200, target: nth("[data-laying] [data-turned=true]") },
  { name: "reader-dock", path: "/portrait/", portrait: "done", ready: "[data-dock] [data-turned=true]", target: nth("[data-dock] [data-turned=true]", 3) },
  { name: "reader-maps", path: "/portrait/", portrait: "done", ready: "[data-reader]", target: notInDock("a [data-pos]") },
  { name: "reader-maps-sky", path: "/portrait/", portrait: "done", ready: "[data-reader]", target: `document.querySelector("a[aria-label] > img[src*='/cards/']")` },
  // A 12 px card glyph in a passage's seal, beside the card's name: too small to be a card.
  { name: "reader-seal-glyph", path: "/portrait/", portrait: "done", ready: "[data-reader]", target: `[...document.querySelectorAll("[data-reader] li img")].find((img) => !img.closest("[data-dock]"))`, expect: null },
  // A tap (touch) on a card: no hover on touch, so no plate.
  { name: "reader-dock-touch", path: "/portrait/", portrait: "done", ready: "[data-dock] [data-turned=true]", touch: true, target: nth("[data-dock] [data-turned=true]", 3), expect: null },
  // Reduced motion: the plate only fades (no rise).
  { name: "cards-grid-reduced", path: "/cards/", reduced: true, target: nth(".cl-row .cl-thumb", 9), expect: "IX The Hermit" },
  { name: "why-drawer", path: "/portrait/", portrait: "done", ready: "[data-reader]",
    setup: `(async () => { document.querySelector('button[aria-haspopup="dialog"][aria-label^="Why"]').click(); await new Promise((r) => setTimeout(r, 2600)); })()`,
    target: nth("[role=dialog] [data-turned=true]"), expect: null },
  { name: "uk-reader-dock", path: "/uk/portrait/", portrait: "done", locale: "uk", ready: "[data-dock] [data-turned=true]", target: nth("[data-dock] [data-turned=true]", 0) },
];

function args(argv) {
  const out = { base: "http://127.0.0.1:3417", out: "shots", viewport: "1440x900", only: "", tag: "", eval: "" };
  for (let i = 0; i < argv.length; i += 2) out[argv[i].replace(/^--/, "")] = argv[i + 1];
  const [width, height] = out.viewport.split("x").map(Number);
  return { ...out, width, height, only: out.only ? out.only.split(",") : null };
}

function fixture(locale) {
  const bank = readJson(path.join(here, "../netlify/portrait/knowledge/bank.json"));
  const name = locale === "uk" ? "m1-uk-olena" : "m1-en-olena";
  const run = readJson(path.join(repo, `docs/superpowers/evidence/2026-10-16-m2/m2-medium/${name}.json`));
  return { id: `fixture-${name}`, packet: run.packet, stages: run.stages, teachings: citedTeachings(selectTeachings(run.packet, bank), bank, run.stages) };
}

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
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`)); else resolve(msg.result);
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

function launch() {
  const profile = mkdtempSync(path.join(process.env.TMPDIR || tmpdir(), "card-hover-"));
  const chrome = spawn(CHROME, ["--headless=new", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--disable-extensions", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const endpoint = new Promise((resolve, reject) => {
    let buffer = "";
    chrome.stderr.on("data", (chunk) => { buffer += chunk; const m = /DevTools listening on (ws:\/\/\S+)/.exec(buffer); if (m) resolve(m[1]); });
    chrome.on("exit", (code) => reject(new Error(`Chrome exited (${code})`)));
    setTimeout(() => reject(new Error("Chrome did not start")), 20_000);
  });
  return { endpoint, stop: () => { chrome.kill("SIGTERM"); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500); } };
}

const PLATE = `(() => { const p = document.querySelector("[data-card-plate]"); if (!p) return { missing: true };
  const r = p.getBoundingClientRect(); const s = getComputedStyle(p);
  return { state: p.dataset.state, side: p.dataset.side, text: [...p.children].filter((c) => !c.hidden).map((c) => c.textContent).join(" "), opacity: s.opacity, font: s.fontFamily.split(",")[0] + " " + s.fontSize,
    rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }, transform: s.transform }; })()`;

async function scene(cdp, opts, s) {
  const problems = [];
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => cdp.send(method, params, sessionId);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(`${s.name}: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  };
  const fx = s.portrait ? fixture(s.locale ?? "en") : null;
  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    const p = msg.params;
    if (msg.method === "Fetch.requestPaused") {
      const body = s.portrait === "done"
        ? { status: "done", stages: fx.stages, teachings: fx.teachings, error: null, costCents: 0 }
        : { status: "running", stages: {}, teachings: {}, error: null };
      send("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: "content-type", value: "application/json" }, { name: "cache-control", value: "no-store" }],
        body: Buffer.from(JSON.stringify(body)).toString("base64") }).catch(() => {});
    } else if (msg.method === "Runtime.exceptionThrown") problems.push(`exception: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`);
    else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning", "assert"].includes(p.type)) problems.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)}`);
    else if (msg.method === "Log.entryAdded" && ["error", "warning"].includes(p.entry.level)) problems.push(`log.${p.entry.level}: ${p.entry.text.slice(0, 300)} ${p.entry.url ?? ""}`);
  });
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: opts.width, height: opts.height, deviceScaleFactor: 1, mobile: false });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: s.reduced ? "reduce" : "no-preference" }] });
    if (s.touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    const seed = { "olivia-arcana-install-dismissed": String(Date.now()), ...(s.seed ?? {}) };
    if (fx) seed["olivia:portrait-job"] = { id: fx.id, packet: fx.packet };
    const writes = Object.entries(seed).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(typeof v === "string" ? v : JSON.stringify(v))});`).join(" ");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `try { ${writes} } catch {}
      document.addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = "nextjs-portal{display:none!important}"; document.head.append(st); });` });
    if (fx) await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/portrait/*", requestStage: "Request" }] });
    await send("Page.navigate", { url: `${opts.base}${s.path}` });
    const ready = s.ready ? (s.ready.includes("document.") ? s.ready : `document.querySelector(${JSON.stringify(s.ready)})`) : s.target;
    const deadline = Date.now() + 60_000;
    while (!(await evaluate(`Boolean(document.readyState === "complete" && (${ready}))`).catch(() => false))) {
      if (Date.now() > deadline) throw new Error(`${s.name}: never ready`);
      await sleep(150);
    }
    await sleep(s.settle ?? 900);
    if (s.setup) await evaluate(s.setup);
    if (opts.eval) console.log(`eval ${s.name}: ${JSON.stringify(await evaluate(opts.eval))}`);

    // Bring the card to the middle of the window, then point at it or tab onto it.
    if (!s.fromTop) await evaluate(`(${s.target}).scrollIntoView({ block: "center", behavior: "instant" })`);
    await sleep(500);
    const measure = `(() => { const r = (${s.target}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, w: r.width, h: r.height }; })()`;
    const box = await evaluate(measure);
    let hit = "";
    if (s.focus) {
      // Focus the control before the card's link, then a real Tab onto it.
      await evaluate(`(() => { const t = ${s.target}; const all = [...document.querySelectorAll("a[href],button,input,[tabindex]:not([tabindex='-1'])")].filter((el) => el.getClientRects().length);
        all[all.indexOf(t) - 1].focus({ preventScroll: true }); })()`);
      const tab = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 };
      await send("Input.dispatchKeyEvent", { type: "keyDown", ...tab });
      await send("Input.dispatchKeyEvent", { type: "keyUp", ...tab });
      if (s.fromTop) await sleep(300);
      hit = await evaluate(`document.activeElement === (${s.target}) ? "focused: " + document.activeElement.textContent.trim().replace(/\\s+/g, " ").slice(0, 50) : "focus missed: " + document.activeElement.outerHTML.slice(0, 80)`);
    } else if (s.touch) {
      const point = [{ x: Math.round(box.x), y: Math.round(box.y) }];
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point });
      await sleep(80);
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      hit = "tapped";
    } else {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 });
      await sleep(120);
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(box.x), y: Math.round(box.y) });
      // A scene that leans toward the pointer moves its cards: settle onto the card where it now is.
      await sleep(300);
      Object.assign(box, await evaluate(measure));
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(box.x), y: Math.round(box.y) });
      hit = await evaluate(`(() => { const h = document.elementFromPoint(${Math.round(box.x)}, ${Math.round(box.y)}); return h ? h.tagName.toLowerCase() + (h.className && typeof h.className === "string" ? "." + h.className.split(" ")[0] : "") + (h.src ? " " + h.src.split("/").slice(-2).join("/") : "") : "nothing"; })()`);
    }
    await sleep(450);
    Object.assign(box, await evaluate(measure));
    const plate = await evaluate(PLATE);
    const on = plate.state === "on";
    const pass = s.expect === undefined ? on : s.expect === null ? !on : on && plate.text === s.expect;
    const tag = opts.tag ? `-${opts.tag}` : "";
    const file = path.join(opts.out, `${s.name}${tag}.jpg`);
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    // A close crop: the card and its plate, at twice the size.
    const left = Math.max(0, Math.min(box.left, on ? plate.rect.x : box.left) - 40);
    const top = Math.max(0, Math.min(box.top, on ? plate.rect.y : box.top) - 30);
    const right = Math.min(opts.width, Math.max(box.left + box.w, on ? plate.rect.x + plate.rect.w : 0) + 40);
    const bottom = Math.min(opts.height, Math.max(box.top + box.h, on ? plate.rect.y + plate.rect.h : 0) + 30);
    const scroll = await evaluate("({ x: scrollX, y: scrollY })");
    const close = await send("Page.captureScreenshot", { format: "jpeg", quality: 85, clip: { x: left + scroll.x, y: top + scroll.y, width: right - left, height: Math.min(bottom - top, 520), scale: 2 } });
    writeFileSync(path.join(opts.out, `${s.name}${tag}-close.jpg`), Buffer.from(close.data, "base64"));
    console.log(`${pass ? "ok  " : "FAIL"} ${s.name.padEnd(22)} ${on ? `"${plate.text}" ${plate.side} at ${plate.rect.x},${plate.rect.y} ${plate.rect.w}x${plate.rect.h} (${plate.font}${s.reduced ? `, transform ${plate.transform}` : ""})` : "no plate"}  | ${hit}`);
    if (problems.length) for (const p of problems) console.log(`     ${p}`);
    return { pass, problems: problems.length };
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

async function main() {
  const opts = args(process.argv.slice(2));
  mkdirSync(opts.out, { recursive: true });
  const chrome = launch();
  const cdp = await connect(await chrome.endpoint);
  let failed = 0;
  let noisy = 0;
  try {
    for (const s of SCENES.filter((x) => !opts.only || opts.only.includes(x.name))) {
      try {
        const r = await scene(cdp, opts, s);
        if (!r.pass) failed++;
        if (r.problems) noisy++;
      } catch (e) { failed++; console.log(`FAIL ${s.name.padEnd(22)} ${e.message}`); }
    }
  } finally {
    cdp.close();
    chrome.stop();
  }
  console.log(`${failed ? `${failed} failed` : "all as expected"}; console ${noisy ? `noisy on ${noisy} scene(s)` : "clean"}`);
  if (failed || noisy) process.exitCode = 1;
}

await main();
