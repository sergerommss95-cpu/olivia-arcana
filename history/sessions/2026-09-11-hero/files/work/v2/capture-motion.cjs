const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 fs.mkdirSync('work/v2/frames',{recursive:true});
 const b=await chromium.launch({headless:true,channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto('file://<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-hero/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
 for(let i=0;i<100;i++){
  let t=Math.max(0,Math.min(1,(i-12)/70));
  await p.evaluate(t=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*t),t);
  await p.waitForTimeout(50);await p.screenshot({path:`work/v2/frames/${String(i).padStart(3,'0')}.jpg`,type:'jpeg',quality:88});
 }
 await b.close();console.log('Captured 100 animation frames');
})();
