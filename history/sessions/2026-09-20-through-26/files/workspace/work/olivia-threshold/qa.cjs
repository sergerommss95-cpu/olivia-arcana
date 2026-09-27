const fs=require('fs');const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');const mark=require('./mark.cjs');
(async()=>{
const items=[];let x=45;
for(const h of [32,48,64,96,160]){const b=await sharp(Buffer.from(mark.svg('#122c3a'))).resize({height:h}).png().toBuffer();items.push({input:b,left:x,top:190-h});x+=Math.round(h*.9)+40}
await sharp({create:{width:800,height:260,channels:4,background:'#f2ede3'}}).composite(items).png().toFile('work/olivia-threshold/small-size-proof.png');
const files=fs.readdirSync('outputs/olivia-threshold').filter(f=>f.endsWith('.svg'));
const report=[];
for(const f of files){const s=fs.readFileSync('outputs/olivia-threshold/'+f,'utf8');const {width,height}=await sharp(Buffer.from(s)).metadata();report.push({file:f,width,height,pathCount:(s.match(/<path\b/g)||[]).length,hasText:/<text\b/.test(s),hasRaster:/<image\b/.test(s),hasExternal:/href=/.test(s)})}
fs.writeFileSync('work/olivia-threshold/logo-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})();
