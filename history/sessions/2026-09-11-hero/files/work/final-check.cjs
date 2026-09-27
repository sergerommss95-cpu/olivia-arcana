const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('sharp'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-hero/index.html');await page.evaluate(()=>document.fonts.ready);
 let checks=[];
 for(const width of [320,390,430,700,768,1024,1440,1920]){
  await page.setViewportSize({width,height:width<701?844:900});
  for(const lang of ['en','uk']){
   await page.locator(`[data-language="${lang}"]`).click();
   checks.push(await page.evaluate(()=>{
    const h1=document.querySelector('h1'),footer=document.querySelector('.hero-footer').getBoundingClientRect(),trust=document.querySelector('.trust').getBoundingClientRect();
    const ranges=[...h1.children].map(e=>{let r=document.createRange();r.selectNodeContents(e);let b=r.getBoundingClientRect();return {right:Math.round(b.right),left:Math.round(b.left)};});
    return {width:innerWidth,lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,headlineClipped:ranges.some(r=>r.right>innerWidth-12||r.left<0),textOverFooter:trust.bottom>footer.top,ranges};
   }));
  }
 }
 await page.setViewportSize({width:1440,height:900});await page.locator('[data-language="en"]').click();
 await page.screenshot({path:'work/motion-a.png'});await page.waitForTimeout(1200);await page.screenshot({path:'work/motion-b.png'});
 const a=await sharp('work/motion-a.png').raw().toBuffer({resolveWithObject:true}),b=await sharp('work/motion-b.png').raw().toBuffer();
 const cropDiff=(x,y,w,h)=>{let total=0,n=0;for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)for(let k=0;k<3;k++){let i=(py*a.info.width+px)*a.info.channels+k;total+=Math.abs(a.data[i]-b[i]);n++;}return +(total/n).toFixed(4);};
 const motion={waterMeanDifference:cropDiff(800,660,500,120),columnMeanDifference:cropDiff(950,410,70,95),cloudMeanDifference:cropDiff(1100,130,120,80)};
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.getByRole('button',{name:'Play motion'}).click();
 const explicitPlay=await page.evaluate(()=>({mist:getComputedStyle(document.querySelector('.mist')).animationName,paused:document.querySelector('.hero').classList.contains('is-paused')}));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();
 const glFallback=await page.evaluate(()=>{const c=document.querySelector('canvas');const gl=c.getContext('webgl');gl.getExtension('WEBGL_lose_context').loseContext();return true;});
 await page.waitForTimeout(100);
 const fallbackVisible=await page.evaluate(()=>({canvasVisible:document.querySelector('canvas').classList.contains('is-ready'),imageLoaded:document.querySelector('.scene-image').naturalWidth>0,headline:!!document.querySelector('h1').innerText}));
 const offline=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await offline.goto('file://<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-hero/index.html');
 const noJS=await offline.locator('h1').isVisible();
 await browser.close();
 const report={checks,errors,motion,explicitPlay,fallbackVisible,noJS};fs.writeFileSync('work/final-check-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})();
