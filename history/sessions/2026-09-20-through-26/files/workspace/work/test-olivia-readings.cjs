const {chromium}=require('/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/playwright');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
(async()=>{
 const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal']});
 const p=await b.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'});
 await p.addInitScript(()=>{let counter=0;crypto.getRandomValues=array=>{array[0]=counter++%22;return array}});
 await p.goto(pathToFileURL(path.resolve('outputs/olivia-arcana.html')).href);await p.waitForTimeout(1000);
 await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await p.waitForTimeout(250);
 const results=[];
 for(const size of [{width:320,height:568},{width:390,height:844},{width:640,height:360},{width:844,height:390}]){
  await p.setViewportSize(size);await p.waitForTimeout(250);await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await p.waitForTimeout(250);
  for(let i=0;i<22;i++){
   await p.locator((size.width===320&&i===0)?'#draw-card':'#draw-again').evaluate(el=>el.click());
   const data=await p.evaluate(()=>{const reading=document.querySelector('#reading');const button=document.querySelector('#draw-again');const footer=document.querySelector('footer');const r=reading.getBoundingClientRect(),br=button.getBoundingClientRect(),fr=footer.getBoundingClientRect();return {title:document.querySelector('#reading-title').textContent,readingBottom:r.bottom,buttonTop:br.top,buttonBottom:br.bottom,footerTop:fr.top,viewportHeight:innerHeight,overflow:br.bottom>fr.top,overlap:Math.max(0,br.bottom-fr.top)}});
   results.push({size,...data});
   if(data.overflow&&i===0){await p.screenshot({path:path.resolve('work/qa',`overflow-${size.width}x${size.height}-${i}.png`)});}
  }
 }
 fs.writeFileSync('work/qa/readings-report.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.filter(x=>x.overflow),null,2));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
