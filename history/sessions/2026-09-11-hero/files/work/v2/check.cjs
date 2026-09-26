const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({headless:true,channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',msg=>{if(msg.type()==='warning')console.log(msg.text());});
 await p.goto('file://<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-hero/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
 const start=await p.evaluate(()=>({ready:document.querySelector('canvas').className,scrollHeight:document.documentElement.scrollHeight,stageHeight:document.querySelector('.hero').offsetHeight,progress:document.querySelector('.hero').dataset.progress}));
 for(const [name,at] of [['start',0],['mid',.52],['close',1]]){await p.evaluate(t=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*t),at);await p.waitForTimeout(950);await p.screenshot({path:`outputs/olivia-arcana-hero/mockups/arrival-desktop-${name}.png`});}
 const end=await p.evaluate(()=>({progress:document.querySelector('.hero').dataset.progress,scale:document.querySelector('.hero').dataset.figureScale,stageTop:document.querySelector('.hero').getBoundingClientRect().top}));
 await p.getByRole('button',{name:'Українська',exact:true}).click();await p.screenshot({path:'outputs/olivia-arcana-hero/mockups/arrival-desktop-uk.png'});
 await p.setViewportSize({width:390,height:844});await p.locator('[data-language="en"]').click();
 for(const [name,at] of [['start',0],['close',1]]){await p.evaluate(t=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*t),at);await p.waitForTimeout(950);await p.screenshot({path:`outputs/olivia-arcana-hero/mockups/arrival-mobile-${name}.png`});}
 const mobile=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,progress:document.querySelector('.hero').dataset.progress,scale:document.querySelector('.hero').dataset.figureScale}));
 await b.close();console.log(JSON.stringify({start,end,mobile,errors},null,2));
})();
