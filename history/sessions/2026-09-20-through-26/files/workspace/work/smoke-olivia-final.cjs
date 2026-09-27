const {chromium}=require('/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal']});const results=[];
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce',deviceScaleFactor:1});const name=`final-${viewport.width}x${viewport.height}`;const result={viewport,errors:[],consoleErrors:[],states:[]};
  page.on('pageerror',error=>result.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')result.consoleErrors.push(message.text())});
  await page.addInitScript(()=>{crypto.getRandomValues=array=>{array[0]=10;return array}});
  await page.goto(pathToFileURL(path.resolve('outputs/olivia-arcana.html')).href);await page.waitForTimeout(600);
  for(const fraction of [0,.48,.65,1]){
   await page.evaluate(f=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*f,behavior:'instant'}),fraction);await page.waitForTimeout(180);
   const state=await page.evaluate(()=>{const button=document.querySelector('#draw-card');const r=button.getBoundingClientRect();const footer=document.querySelector('footer').getBoundingClientRect();return {diagnostics:window.oliviaDiagnostics?.(),overflow:document.documentElement.scrollWidth>innerWidth,buttonRect:{top:r.top,bottom:r.bottom},footerTop:footer.top}});result.states.push({fraction,...state});
   if(fraction===0||fraction===1)await page.screenshot({path:`work/qa/${name}-${fraction===0?'hero':'oracle'}.png`});
  }
  await page.locator('#draw-card').focus();await page.keyboard.press('Enter');await page.waitForTimeout(200);
  result.reading=await page.evaluate(()=>{const r=document.querySelector('#draw-again').getBoundingClientRect();const footer=document.querySelector('footer').getBoundingClientRect();return {title:document.querySelector('#reading-title').textContent,hidden:document.querySelector('#reading').hidden,buttonRect:{top:r.top,bottom:r.bottom},footerTop:footer.top,withinViewport:r.bottom<=innerHeight,aboveFooter:r.bottom<=footer.top}});
  await page.screenshot({path:`work/qa/${name}-reading.png`});results.push(result);await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const fallback={errors:[],consoleErrors:[]};page.on('pageerror',e=>fallback.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')fallback.consoleErrors.push(m.text())});await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args)}});await page.goto(pathToFileURL(path.resolve('outputs/olivia-arcana.html')).href);await page.waitForTimeout(400);await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(150);await page.locator('#draw-card').click();fallback.result=await page.evaluate(()=>({rootClass:document.documentElement.className,readingHidden:document.querySelector('#reading').hidden,title:document.querySelector('#reading-title').textContent}));await page.screenshot({path:'work/qa/final-mobile-fallback.png'});await page.close();
 await browser.close();fs.writeFileSync('work/qa/final-smoke-report.json',JSON.stringify({results,fallback},null,2));console.log(JSON.stringify({results:results.map(r=>({viewport:r.viewport,errors:r.errors,consoleErrors:r.consoleErrors,oracle:r.states.at(-1),reading:r.reading})),fallback},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
