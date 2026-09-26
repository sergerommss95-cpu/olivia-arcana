const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root='<LOCAL_HOME>/Documents/Codex/2026-09-11/i',out=path.join(root,'outputs/olivia-arcana-hero');
(async()=>{
 const files=[
 ['user-photo.png','<LOCAL_HOME>/Downloads/34EE5F88-5FF7-4271-8DB0-ADE059019032.PNG','arrival-original.webp'],
 ['arrival-background.png',path.join(root,'work/generated-v2/arrival-background.png'),'arrival-background.webp'],
 ['olivia-key.png',path.join(root,'work/generated-v2/olivia-key.png'),'olivia-key.webp']];
 for(const [raw,src,dest] of files){fs.copyFileSync(src,path.join(out,'assets',raw));await sharp(src).webp({quality:95,alphaQuality:100,effort:6}).toFile(path.join(out,'assets',dest));}
 fs.copyFileSync(path.join(root,'work/generated-v2/prompts.json'),path.join(out,'assets/arrival-prompts.json'));
 const {data,info}=await sharp(files[2][1]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=0,y1=0,n=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){if(data[(y*info.width+x)*4+1]-Math.max(data[(y*info.width+x)*4],data[(y*info.width+x)*4+2])<36){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++;}}
 const bw=x1-x0+1,bh=y1-y0+1;
 const bounds={aspect:bw/bh,uv:[x0/info.width,1-(y1+1)/info.height,bw/info.width,bh/info.height],bbox:{x0,y0,x1,y1},imageWidth:info.width,imageHeight:info.height};
 fs.writeFileSync(path.join(out,'assets/foreground-bounds.json'),JSON.stringify(bounds,null,2));
 const fontCSS=fs.readFileSync(path.join(out,'hero.css'),'utf8').split(':root')[0];
 let inlineFonts=fontCSS.replaceAll(/url\('assets\/fonts\/([^']+)'\)/g,(_,f)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join(out,'assets/fonts',f)).toString('base64')})`);
 const css=fs.readFileSync(path.join(root,'work/v2/hero.css'),'utf8');
 const js=fs.readFileSync(path.join(root,'work/v2/scene.js'),'utf8').replace('/*FOREGROUND_BOUNDS*/',JSON.stringify(bounds));
 const shell=fs.readFileSync(path.join(root,'work/v2/hero-shell.html'),'utf8');
 const images={'SCENE_IMAGE':'arrival-original.webp','PLATE_IMAGE':'arrival-background.webp','WOMAN_IMAGE':'olivia-key.webp','MIST_IMAGE':'mist.webp'};
 let html=shell.replace('/*FONT_STYLES*/',inlineFonts).replace('/*HERO_STYLES*/',css).replace('/*HERO_SCRIPT*/',js);
 let modular=shell.replace('<style>/*FONT_STYLES*/\n/*HERO_STYLES*/</style>','<link rel="stylesheet" href="hero.css">').replace('<script>/*HERO_SCRIPT*/</script>','<script src="hero.js" defer></script>');
 for(const [tag,file] of Object.entries(images)){html=html.replaceAll(`/*${tag}*/`,'data:image/webp;base64,'+fs.readFileSync(path.join(out,'assets',file)).toString('base64'));modular=modular.replaceAll(`/*${tag}*/`,'assets/'+file);}
 fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'modular.html'),modular);fs.writeFileSync(path.join(out,'hero.js'),js);fs.writeFileSync(path.join(out,'hero.css'),fontCSS+css);
 console.log(JSON.stringify({bounds,htmlBytes:Buffer.byteLength(html)},null,2));
})();
