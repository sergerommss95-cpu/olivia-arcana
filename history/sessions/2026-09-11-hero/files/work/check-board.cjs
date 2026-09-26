const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const base='<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-hero';
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1360,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+base+'/design-system.html');await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:base+'/mockups/design-system.png',fullPage:true});
 const board=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,allImagesLoaded:[...document.images].every(i=>i.complete&&i.naturalWidth)}));
 await page.goto('file://'+base+'/index.html');
 await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 const skip=await page.evaluate(()=>document.activeElement.id==='hero-content');
 await page.goto('http://127.0.0.1:8765/modular.html');await page.waitForTimeout(200);
 const modular=await page.locator('canvas').evaluate(el=>el.classList.contains('is-ready'));
 await browser.close();
 let missing=[];
 for(const file of ['modular.html','design-system.html']){
  for(const m of fs.readFileSync(path.join(base,file),'utf8').matchAll(/(?:src|href)="([^"]+)"/g)){
   const v=m[1];if(!v.startsWith('data:')&&!v.startsWith('#')&&!v.startsWith('http')&&!fs.existsSync(path.join(base,v)))missing.push({file,v});
  }
 }
 console.log(JSON.stringify({errors,board,skip,modular,missing},null,2));
})();
