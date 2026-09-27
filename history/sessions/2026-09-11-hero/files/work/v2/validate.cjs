const {chromium}=require('<LOCAL_HOME>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({headless:true,channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}});let errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url='file://<LOCAL_HOME>/Documents/Codex/2026-09-11/i/outputs/olivia-arcana-hero/index.html';
 await p.goto(url);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 const loaded=await p.locator('canvas').evaluate(el=>el.classList.contains('is-ready'));
 await p.keyboard.press('PageDown');await p.waitForTimeout(350);const keyboard=await p.locator('.hero').getAttribute('data-progress');
 await p.getByRole('button',{name:'Pause motion',exact:true}).click();
 const freeze=await p.locator('.hero').getAttribute('data-progress');await p.evaluate(()=>scrollTo(0,1000));await p.waitForTimeout(180);
 const after=await p.locator('.hero').getAttribute('data-progress');
 await p.screenshot({path:'work/v2/frozen1.png'});await p.waitForTimeout(140);await p.screenshot({path:'work/v2/frozen2.png'});
 const freezePixels=fs.readFileSync('work/v2/frozen1.png').equals(fs.readFileSync('work/v2/frozen2.png'));
 await p.getByRole('button',{name:'Play motion',exact:true}).click();await p.waitForTimeout(700);
 await p.getByRole('button',{name:'Skip animation',exact:true}).click();const skipped=await p.locator('.hero').getAttribute('data-progress');
 await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(950);const reversed=await p.locator('.hero').getAttribute('data-progress');
 let viewports=[];
 for(const width of [320,390,700,768,1024,1440]){
  await p.setViewportSize({width,height:width<701?844:900});
  for(const lang of ['en','uk']){
   await p.locator(`[data-language="${lang}"]`).click();
   viewports.push(await p.evaluate(()=>{
    const ranges=[...document.querySelector('h1').children].map(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().right;});
    const actions=document.querySelector('.hero-actions').getBoundingClientRect(),footer=document.querySelector('.hero-footer').getBoundingClientRect();
    return {width:innerWidth,lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,headingClipped:ranges.some(r=>r>innerWidth-12),actionsOverlapFooter:actions.bottom>footer.top};
   }));
  }
 }
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.waitForTimeout(150);
 const reduced=await p.evaluate(()=>({scrollable:document.querySelector('.scroll-sequence').classList.contains('is-scrollable'),paused:document.querySelector('.hero').classList.contains('is-paused'),image:document.querySelector('#scene-image').naturalWidth>0}));
 await p.getByRole('button',{name:'Play motion',exact:true}).click();const optIn=await p.locator('.scroll-sequence').evaluate(el=>el.classList.contains('is-scrollable'));
 await p.emulateMedia({reducedMotion:'no-preference'});await p.reload();await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await p.waitForTimeout(60);
 const fallback=await p.evaluate(()=>({static:!document.querySelector('canvas').classList.contains('is-ready'),noPin:!document.querySelector('.scroll-sequence').classList.contains('is-scrollable'),image:document.querySelector('#scene-image').naturalWidth>0}));
 await b.close();let result={loaded,keyboard,freeze,after,freezePixels,skipped,reversed,viewports,reduced,optIn,fallback,errors};console.log(JSON.stringify(result,null,2));fs.writeFileSync('work/v2/validation.json',JSON.stringify(result,null,2));
})();
