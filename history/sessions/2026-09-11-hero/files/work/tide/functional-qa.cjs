const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const url='file://<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-tide/index.html';
const results=[];
function record(name,pass,detail){results.push({name,pass,detail});console.log(JSON.stringify(results.at(-1)));}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 async function open(options={},init){const context=await browser.newContext({viewport:{width:1440,height:900},...options});if(init)await context.addInitScript(init);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.tidePreview&&document.querySelector('#stage').dataset.renderer);await page.evaluate(()=>document.fonts.ready);return {context,page,errors};}
 const {page,context,errors}=await open();
 let state=await page.evaluate(()=>window.tidePreview.state());record('Renderer initialized',state.ready,state);
 await page.evaluate(()=>scrollTo(0,window.tidePreview.state().range*.23));await wait(600);
 await page.locator('#motion').click();const paused1=await page.evaluate(()=>window.tidePreview.state());await page.evaluate(()=>scrollBy(0,150));await wait(450);const paused2=await page.evaluate(()=>window.tidePreview.state());
 record('Pause freezes scene despite scroll',paused2.paused&&paused1.time===paused2.time&&paused1.progress===paused2.progress,{before:paused1,after:paused2});
 await page.locator('#skip').click();record('Skip while paused reaches and focuses reading',await page.evaluate(()=>document.activeElement.id==='reading'&&Math.abs(document.querySelector('#reading').getBoundingClientRect().top)<2),await page.evaluate(()=>({focus:document.activeElement.id,readingTop:document.querySelector('#reading').getBoundingClientRect().top,state:window.tidePreview.state()})));
 await page.locator('[data-intent="1"]').click();record('Intent changes selected state and suggestion',await page.locator('[data-intent="1"]').getAttribute('aria-pressed')==='true'&&(await page.locator('#suggested-question').textContent()).includes('connection'),await page.locator('#suggested-question').textContent());
 await page.locator('#replay').click();await wait(150);record('Replay resets and focuses begin',await page.evaluate(()=>document.activeElement.id==='begin'&&window.tidePreview.state().progress<.001&&scrollY<2),await page.evaluate(()=>({focus:document.activeElement.id,y:scrollY,state:window.tidePreview.state()})));
 await page.locator('#begin').click();await wait(700);record('Begin advances scene',await page.evaluate(()=>window.tidePreview.state().progress>0),await page.evaluate(()=>window.tidePreview.state()));
 await page.keyboard.press('PageDown');await wait(150);const afterKey=await page.evaluate(()=>({state:window.tidePreview.state(),y:scrollY}));record('PageDown advances native scroll',afterKey.y>0,afterKey);
 await page.locator('#skip').click();await page.locator('#replay').click();
 for(const [width,height] of [[320,740],[390,844],[768,1024],[1440,900]]){
  await page.setViewportSize({width,height});await wait(150);
  for(const lang of ['en','uk']){
   await page.evaluate(l=>document.querySelector(`[data-lang="${l}"]`).click(),lang);
   for(const p of [0,.42,.72,1]){
    await page.evaluate(p=>window.tidePreview.seek(p),p);
    const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,lang:document.documentElement.lang,overflow:[...document.querySelectorAll('main button,main a,main p,main h1,main h2')].filter(el=>{const r=el.getBoundingClientRect();return r.width&& (r.right>innerWidth+1||r.left< -1);}).map(el=>({tag:el.tagName,text:el.textContent.trim().slice(0,45),x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right}))}));
    record(`No horizontal overflow ${width} ${lang} p=${p}`,metrics.scrollWidth<=width&&metrics.bodyWidth<=width,{...metrics});
   }
  }
 }
 record('No JavaScript runtime errors',errors.length===0,errors);
 await context.close();
 const rm=await open({viewport:{width:390,height:844},reducedMotion:'reduce'});state=await rm.page.evaluate(()=>window.tidePreview.state());record('Reduced motion removes pinned scroll and stays still',state.reduced&&state.range===0&&state.progress===0,state);const rmTime=state.time;await wait(350);record('Reduced motion has no time animation',(await rm.page.evaluate(()=>window.tidePreview.state().time))===rmTime,await rm.page.evaluate(()=>window.tidePreview.state()));await rm.page.locator('#skip').click();record('Reduced motion skip focuses reading',await rm.page.evaluate(()=>document.activeElement.id==='reading'),await rm.page.evaluate(()=>({focus:document.activeElement.id,y:scrollY})));
 await rm.context.close();
 const fail=await open({},()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:get.call(this,type,...args);};});state=await fail.page.evaluate(()=>window.tidePreview.state());record('WebGL initialization failure exposes static fallback',!state.ready&&state.range===0,await fail.page.evaluate(()=>({state:window.tidePreview.state(),renderer:document.querySelector('#stage').dataset.renderer,motionHidden:document.querySelector('.motion-controls').hidden})));await fail.page.locator('#begin').click();record('Fallback begin reaches reading',await fail.page.evaluate(()=>document.activeElement.id==='reading'),await fail.page.evaluate(()=>({focus:document.activeElement.id,y:scrollY})));
 await fail.context.close();
 const lost=await open();await lost.page.evaluate(()=>document.querySelector('#world-canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await wait(250);record('WebGL context loss recovers static fallback',await lost.page.evaluate(()=>!window.tidePreview.state().ready&&window.tidePreview.state().range===0),await lost.page.evaluate(()=>({state:window.tidePreview.state(),renderer:document.querySelector('#stage').dataset.renderer})));await lost.context.close();
 await browser.close();
 const failures=results.filter(x=>!x.pass);fs.writeFileSync('work/tide/functional-qa.md','# The Tide Opens — bounded functional QA\n\nTested the local self-contained HTML with headless installed Chrome via Playwright. These are functional checks; root owns visual continuity review.\n\n'+results.map(r=>`- ${r.pass?'PASS':'FAIL'} — **${r.name}**${r.pass?'':': `'+JSON.stringify(r.detail)+'`'}`).join('\n')+'\n\n'+(failures.length?`${failures.length} failing check(s).`:'All checks passed.')+'\n');fs.writeFileSync('work/tide/functional-qa.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({summary:{checks:results.length,failures:failures.length}}));
})().catch(e=>{console.error(e);process.exitCode=1;});
