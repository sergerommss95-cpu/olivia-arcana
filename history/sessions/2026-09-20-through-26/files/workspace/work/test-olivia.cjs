const { chromium } = require('/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const target = path.resolve(process.argv[2] || path.join(root, 'outputs/olivia-arcana.html'));
const out = path.join(root, 'work/qa');
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(target).href;
const report = { target, timestamp: new Date().toISOString(), scenarios: [], failures: [] };
const check = (scenario, name, ok, detail) => {
  scenario.checks.push({ name, ok: !!ok, detail });
  if (!ok) report.failures.push(`${scenario.name}: ${name}${detail ? ` (${JSON.stringify(detail)})` : ''}`);
};

async function snapshot(page) {
  return page.evaluate(() => {
    const reading = document.querySelector('#reading');
    const motion = document.querySelector('#motion-toggle');
    return {
      title: document.title,
      viewport: [innerWidth, innerHeight],
      scrollY, scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      canvases: [...document.querySelectorAll('canvas')].map(c => ({ width:c.width, height:c.height, rect:{ width:c.getBoundingClientRect().width, height:c.getBoundingClientRect().height } })),
      webglContexts: window.__qaWebGL || [],
      reading: reading && { hidden: reading.hidden, ariaHidden: reading.getAttribute('aria-hidden'), display: getComputedStyle(reading).display, visible: !!reading.getClientRects().length && getComputedStyle(reading).visibility !== 'hidden' && getComputedStyle(reading).display !== 'none', text: reading.innerText.trim().slice(0, 600) },
      motion: motion && { text: motion.innerText, pressed: motion.getAttribute('aria-pressed'), label: motion.getAttribute('aria-label') },
      bodyClass: document.body.className,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      diagnostics:window.oliviaDiagnostics?.() || null,
      animationFrames:window.__qaFrames || 0,
      rootClass:document.documentElement.className,
      activeElement: { tag: document.activeElement?.tagName, id:document.activeElement?.id, text: document.activeElement?.innerText?.slice(0, 100) },
      fallbackText: [...document.querySelectorAll('[class*="fallback"],[id*="fallback"]')].map(el => ({ text:el.innerText, visible:!!el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' })),
    };
  });
}

async function run(browser, name, options = {}) {
  const viewport = options.viewport || (options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  const context = await browser.newContext({ viewport, deviceScaleFactor: options.mobile ? 3 : 2, isMobile:!!options.mobile, hasTouch:!!options.mobile, reducedMotion: options.reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const scenario = { name, options, checks:[], consoleErrors:[], pageErrors:[], requestFailures:[], requests:[], snapshots:[], screenshots:[] };
  report.scenarios.push(scenario);
  page.on('console', msg => { if (msg.type() === 'error') scenario.consoleErrors.push(msg.text()); });
  page.on('pageerror', e => scenario.pageErrors.push(e.message));
  page.on('requestfailed', req => scenario.requestFailures.push({ url:req.url(), failure:req.failure() }));
  page.on('request', req => scenario.requests.push(req.url()));
  await page.addInitScript(({ noWebGL }) => {
    window.__qaWebGL = [];
    window.__qaFrames = 0;
    const nativeRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = function(cb) { return nativeRaf.call(window, now => { window.__qaFrames++; cb(now); }); };
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (/webgl|experimental-webgl/.test(type)) {
        const result = noWebGL ? null : original.call(this, type, ...args);
        window.__qaWebGL.push({ type, success:!!result });
        return result;
      }
      return original.call(this, type, ...args);
    };
  }, { noWebGL:!!options.noWebGL });

  try {
    await page.goto(url, { waitUntil:'load', timeout:30000 });
    await page.waitForTimeout(1500);
    const initial = await snapshot(page);
    scenario.initial = initial;
    check(scenario, 'No horizontal overflow at entry', !initial.horizontalOverflow);
    check(scenario, 'Title identifies Olivia', /olivia/i.test(initial.title), initial.title);
    check(scenario, 'Single canvas', options.noWebGL ? initial.canvases.length <= 1 : initial.canvases.length === 1, initial.canvases);
    if (!options.noWebGL) check(scenario, 'WebGL initialized', initial.webglContexts.some(x => x.success), initial.webglContexts);
    if (options.reduced) {
      check(scenario, 'Reduced motion media preference applied', initial.reducedMotion);
      await page.waitForTimeout(600);
      const idle = await snapshot(page);
      scenario.reducedIdle = { before:initial.animationFrames, after:idle.animationFrames };
      check(scenario, 'Reduced motion is idle between inputs', idle.animationFrames - initial.animationFrames <= 1, scenario.reducedIdle);
    }
    if (initial.diagnostics) {
      check(scenario, '22 tarot cards', initial.diagnostics.cards === 22, initial.diagnostics);
      check(scenario, '7 sculptural archetypes', initial.diagnostics.archetypes === 7, initial.diagnostics);
      check(scenario, 'DPR clamped', initial.diagnostics.pixelRatio <= (options.mobile ? 1.35 : 1.65), initial.diagnostics.pixelRatio);
    }
    check(scenario, 'Reading initially hidden', !initial.reading?.visible, initial.reading);
    const remoteRequests = scenario.requests.filter(request => /^https?:/i.test(request));
    check(scenario, 'No network dependencies', remoteRequests.length === 0, remoteRequests);

    const phases = options.noWebGL ? [0, 1] : options.reduced ? [0, 0.5, 1] : [0, 0.15, 0.3, 0.48, 0.65, 0.82, 1];
    for (const fraction of phases) {
      await page.evaluate(f => window.scrollTo({ top:(document.documentElement.scrollHeight - innerHeight) * f, behavior:'instant' }), fraction);
      await page.waitForTimeout(options.reduced ? 220 : 1000);
      const shot = path.join(out, `${name}-${String(Math.round(fraction*100)).padStart(3, '0')}.png`);
      await page.screenshot({ path:shot });
      scenario.screenshots.push(shot);
      const state = await snapshot(page);
      scenario.snapshots.push({ fraction, ...state });
      check(scenario, `No horizontal overflow at ${fraction}`, !state.horizontalOverflow);
    }

    const draw = page.locator('#draw-card');
    check(scenario, 'Draw control exists', await draw.count() === 1);
    if (await draw.count()) {
      await draw.scrollIntoViewIfNeeded();
      await draw.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(950);
      scenario.afterDraw = await snapshot(page);
      check(scenario, 'Keyboard draw reveals reading', scenario.afterDraw.reading?.visible && !!scenario.afterDraw.reading.text, scenario.afterDraw.reading);
      const shot = path.join(out, `${name}-reading.png`);
      await page.screenshot({ path:shot });
      scenario.screenshots.push(shot);
      // A second draw should remain functional without throwing or removing the output.
      await page.locator('#draw-again').focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      scenario.afterSecondDraw = await snapshot(page);
      check(scenario, 'Second keyboard draw remains readable', scenario.afterSecondDraw.reading?.visible && !!scenario.afterSecondDraw.reading.text, scenario.afterSecondDraw.reading);
    }

    const motion = page.locator('#motion-toggle');
    check(scenario, 'Motion toggle exists', await motion.count() === 1);
    if (await motion.count()) {
      const before = (await snapshot(page)).motion;
      await motion.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      const after = (await snapshot(page)).motion;
      scenario.motionToggle = { before, after };
      check(scenario, 'Motion toggle reports state change', JSON.stringify(before) !== JSON.stringify(after), scenario.motionToggle);
    }

    for (const anchor of ['beginning', 'unfold', 'oracle']) {
      const links = page.locator(`header a[href="#${anchor}"]`);
      const targetExists = await page.locator(`#${anchor}`).count() > 0;
      check(scenario, `Anchor target #${anchor} exists`, targetExists);
      if (await links.count()) {
        const visible = await links.first().isVisible();
        if (visible) {
          await links.first().click();
          await page.waitForTimeout(600);
          check(scenario, `Navigation to #${anchor} updates URL`, page.url().endsWith(`#${anchor}`), page.url());
        }
      }
    }
    if (options.mobile) {
      await page.setViewportSize({ width:844, height:390 });
      await page.waitForTimeout(600);
      scenario.afterLandscapeResize = await snapshot(page);
      check(scenario, 'No overflow after landscape resize', !scenario.afterLandscapeResize.horizontalOverflow);
      const resizedShot = path.join(out, `${name}-landscape.png`);
      await page.screenshot({ path:resizedShot });
      scenario.screenshots.push(resizedShot);
    }
    check(scenario, 'No uncaught runtime errors', scenario.pageErrors.length === 0, scenario.pageErrors);
    const significantConsoleErrors = scenario.consoleErrors.filter(message => !(options.noWebGL && /Error creating WebGL context|THREE.WebGLRenderer|WebGL context/i.test(message)));
    check(scenario, 'No unexpected console errors', significantConsoleErrors.length === 0, significantConsoleErrors);
    if (options.noWebGL) check(scenario, 'Fallback visible', scenario.initial.fallbackText.some(x => x.visible && x.text.trim()), scenario.initial.fallbackText);
  } catch (error) {
    scenario.exception = error.stack;
    report.failures.push(`${name}: ${error.message}`);
    try { await page.screenshot({ path:path.join(out, `${name}-exception.png`) }); } catch (_) {}
  } finally {
    await context.close();
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`${name}: ${scenario.checks.filter(c => c.ok).length}/${scenario.checks.length} checks passed; ${scenario.pageErrors.length} runtime errors; ${scenario.consoleErrors.length} console errors`);
  }
}

(async () => {
  if (!fs.existsSync(target)) throw new Error(`HTML target not yet present: ${target}`);
  const browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--use-angle=metal', '--allow-file-access-from-files'] });
  try {
    await run(browser, 'desktop');
    await run(browser, 'mobile', { mobile:true });
    await run(browser, 'narrow-mobile', { mobile:true, viewport:{ width:320, height:568 } });
    await run(browser, 'reduced-motion', { reduced:true });
    await run(browser, 'webgl-fallback', { noWebGL:true });
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({ report:path.join(out, 'report.json'), failures:report.failures }, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode=1; });
