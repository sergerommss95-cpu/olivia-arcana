const {chromium} = require('/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright');
(async()=>{
const browser = await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal']});
const page = await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/olivia-card-back-art-directions.html',{waitUntil:'domcontentloaded'});
await page.locator('#references').scrollIntoViewIfNeeded();
await page.evaluate(()=>Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}))); 
const imageReport=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({alt:i.alt,loaded:i.complete&&i.naturalWidth>0,width:i.naturalWidth})));
await page.locator('#references').screenshot({path:'work/card-back-research/references-proof.png'});
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:'outputs/olivia-card-back-research-preview.png'});
const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'work/card-back-research/mobile-proof.png'});
const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
console.log(JSON.stringify({errors,imageReport,desktopOverflow,mobileOverflow,concepts:await page.locator('.concept').count()},null,2));
await browser.close();
})();
