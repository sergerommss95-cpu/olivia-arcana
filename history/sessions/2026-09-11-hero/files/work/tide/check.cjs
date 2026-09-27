const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path');
const root='<LOCAL_HOME>/Documents/Codex/2026-09-11/i',out=path.join(root,'outputs/olivia-arcana-tide');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const p=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='warning')errors.push(m.text())});await p.goto('file://'+out+'/index.html');await p.waitForFunction(()=>window.tidePreview?.state().ready,{timeout:15000});await p.evaluate(()=>document.fonts.ready);
for(const at of [0,.2,.42,.56,.65,.78,1]){await p.evaluate(value=>window.tidePreview.seek(value),at);await p.waitForTimeout(450);await p.screenshot({path:out+'/mockups/desktop-'+String(at).replace('.','')+'.png'});}
await p.locator('#skip').click();await p.screenshot({path:out+'/mockups/reading-desktop.png'});
console.log({errors,state:await p.evaluate(()=>window.tidePreview.state()),focus:await p.evaluate(()=>document.activeElement.id)});
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>window.scrollTo(0,0));
for(const at of [0,.42,.65,1]){await p.evaluate(value=>window.tidePreview.seek(value),at);await p.waitForTimeout(450);await p.screenshot({path:out+'/mockups/mobile-'+String(at).replace('.','')+'.png'});}
await p.locator('[data-lang="uk"]').click();await p.evaluate(()=>window.tidePreview.seek(0));await p.screenshot({path:out+'/mockups/mobile-uk.png'});
await p.locator('#skip').click();await p.screenshot({path:out+'/mockups/reading-mobile-uk.png'});
await browser.close();})();
