/* Usage:
   node work/qa-materials.cjs --tag pass-1
   node work/qa-materials.cjs --tag hero --only desktop --phases 0
   node work/qa-materials.cjs --tag oracle --only mobile --phases 1 --draw
   Add --fallback or --reduced to examine those paths. Screenshots are CSS-sized.
*/
const {chromium}=require('/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{spawnSync}=require('node:child_process');
const args=process.argv.slice(2),value=(name,defaultValue)=>{const i=args.indexOf(name);return i>=0?args[i+1]:defaultValue};
const root=path.resolve(__dirname,'..'),target=path.resolve(value('--file',path.join(root,'outputs/olivia-arcana.html')));
const tag=value('--tag','latest').replace(/[^a-zA-Z0-9_-]/g,'-');
const out=path.join(root,'work/materials-qa',tag);fs.mkdirSync(out,{recursive:true});
const phases=value('--phases','0,.15,.47,.69,1').split(',').map(Number);
const only=value('--only','both'),settle=Number(value('--wait','950'));
const reduced=args.includes('--reduced'),fallback=args.includes('--fallback');
const wantDraw=args.includes('--draw')||(!args.includes('--phases')&&!args.includes('--no-draw'));
const report={target,tag,timestamp:new Date().toISOString(),options:{phases,only,settle,reduced,fallback},syntax:[],scenarios:[],failures:[]};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
const scripts=[...fs.readFileSync(target,'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
scripts.forEach((match,i)=>{const f=path.join(out,`syntax-${i}.mjs`);fs.writeFileSync(f,match[1]);const result=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});report.syntax.push({index:i,ok:result.status===0,error:result.stderr?.trim()});if(result.status!==0)report.failures.push(`Inline script ${i} syntax: ${result.stderr}`)});
async function inspect(page){return page.evaluate(()=>({
 diagnostics:window.oliviaDiagnostics?.(),width:innerWidth,height:innerHeight,scrollY,
 horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
 rootClass:document.documentElement.className,canvasCount:document.querySelectorAll('canvas').length,
 panels:[...document.querySelectorAll('[data-panel]')].filter(el=>!el.inert).map(el=>({name:el.dataset.panel,opacity:getComputedStyle(el).opacity})),
 reading:{hidden:document.querySelector('#reading')?.hidden,title:document.querySelector('#reading-title')?.textContent},
 fallbackText:[...document.querySelectorAll('#fallback-art text')].map(el=>el.textContent),
 frameCallbacks:window.__qaFrames,mainHasPanels:!!document.querySelector('main .panels')
 }))}
async function move(page,fraction){await page.evaluate(f=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*f,behavior:'instant'}),fraction);await page.waitForTimeout(settle);if(!reduced&&!fallback)await page.waitForFunction(()=>{const d=window.oliviaDiagnostics?.();const target=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);return !d||Math.abs(d.progress-target)<.00008},undefined,{timeout:5000});}
(async()=>{
 if(report.failures.length){save();throw new Error('Syntax validation failed; see report.json')}
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal','--allow-file-access-from-files']});
 try{
  for(const config of [{name:'desktop',viewport:{width:1440,height:1000},dpr:2},{name:'mobile',viewport:{width:390,height:844},dpr:3}].filter(c=>only==='both'||c.name===only)){
   const scenario={name:config.name,viewport:config.viewport,deviceScaleFactor:config.dpr,pageErrors:[],consoleErrors:[],consoleWarnings:[],failedRequests:[],requests:[],states:[],screenshots:[]};report.scenarios.push(scenario);
   const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:config.dpr,isMobile:config.name==='mobile',hasTouch:config.name==='mobile',reducedMotion:reduced?'reduce':'no-preference'});const page=await context.newPage();
   page.on('pageerror',e=>scenario.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')scenario.consoleErrors.push(m.text());if(m.type()==='warning')scenario.consoleWarnings.push(m.text())});page.on('requestfailed',r=>scenario.failedRequests.push({url:r.url(),failure:r.failure()}));page.on('request',r=>scenario.requests.push(r.url()));
   await page.addInitScript(({disableWebGL})=>{window.__qaFrames=0;const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(now=>{window.__qaFrames++;cb(now)});crypto.getRandomValues=a=>{a[0]=19;return a};if(disableWebGL){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args)}}},{disableWebGL:fallback});
   try{
    await page.goto(pathToFileURL(target).href,{waitUntil:'load',timeout:30000});await page.waitForFunction(()=>document.documentElement.classList.contains('has-webgl')||document.documentElement.classList.contains('no-webgl'),undefined,{timeout:15000});await page.waitForTimeout(450);
    for(const fraction of phases){await move(page,fraction);const state=await inspect(page);scenario.states.push({fraction,...state});const filename=`${config.name}-${Math.round(fraction*1000).toString().padStart(4,'0')}.png`;await page.screenshot({path:path.join(out,filename),scale:'css'});scenario.screenshots.push(filename);if(state.horizontalOverflow)report.failures.push(`${config.name}: horizontal overflow at ${fraction}`);if(state.canvasCount!==1)report.failures.push(`${config.name}: expected one canvas, got ${state.canvasCount}`);}
    if(wantDraw){await move(page,1);await page.locator('#draw-card').focus();await page.keyboard.press('Enter');await page.waitForTimeout(reduced?200:1650);scenario.draw=await inspect(page);if(scenario.draw.reading.hidden||!scenario.draw.reading.title)report.failures.push(`${config.name}: reading failed`);const filename=`${config.name}-draw.png`;await page.screenshot({path:path.join(out,filename),scale:'css'});scenario.screenshots.push(filename);}
    const remote=scenario.requests.filter(url=>/^https?:/.test(url));if(remote.length)report.failures.push(`${config.name}: external dependencies ${remote.join(',')}`);
    if(scenario.pageErrors.length||scenario.consoleErrors.length)report.failures.push(`${config.name}: runtime/console errors`);
   }catch(error){scenario.exception=error.stack;report.failures.push(`${config.name}: ${error.message}`);await page.screenshot({path:path.join(out,`${config.name}-exception.png`),scale:'css'}).catch(()=>{})}finally{await context.close();save();console.log(`${config.name}: ${scenario.screenshots.length} screenshots; ${scenario.pageErrors.length} runtime errors; ${scenario.consoleErrors.length} console errors`)}
  }
 }finally{await browser.close();save()}
 console.log(JSON.stringify({folder:out,report:path.join(out,'report.json'),failures:report.failures},null,2));process.exitCode=report.failures.length?1:0;
})().catch(error=>{console.error(error);save();process.exitCode=1});
