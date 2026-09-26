const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root='<LOCAL_HOME>/Documents/Codex/2026-09-11/i';
const out=path.join(root,'outputs/olivia-arcana-hero');
(async()=>{
 await sharp(path.join(root,'work/generated/olivia-arcana-temple-hero.png')).webp({quality:90,effort:6}).toFile(path.join(out,'assets/sanctuary.webp'));
 await sharp(path.join(root,'work/generated/olivia-arcana-mist-veil.png')).webp({quality:86,alphaQuality:95,effort:6}).toFile(path.join(out,'assets/mist.webp'));
 fs.copyFileSync(path.join(root,'work/generated/olivia-arcana-temple-hero.png'),path.join(out,'assets/sanctuary-original.png'));
 fs.copyFileSync(path.join(root,'work/generated/olivia-arcana-mist-veil.png'),path.join(out,'assets/mist-original.png'));
 fs.copyFileSync(path.join(root,'work/generated/prompts.json'),path.join(out,'assets/generation-prompts.json'));
 const fontDir='<LOCAL_HOME>/olivia-arcana/website/.next/static/media';
 const fonts=[
 ['Cormorant Garamond','normal','300 600','01e4147cff8141ee-s.p.10ked.7w885.g.woff2','cormorant-latin.woff2','latin'],
 ['Cormorant Garamond','normal','300 600','b0947914c9718a1e-s.p.0l.9lak812di~.woff2','cormorant-cyrillic.woff2','cyrillic'],
 ['Cormorant Garamond','italic','300 600','8bd76523131fa0fc-s.p.0jox806dnq5~c.woff2','cormorant-italic-latin.woff2','latin'],
 ['Cormorant Garamond','italic','300 600','591574edbe85c69b-s.p.0rbr02z3z6mfi.woff2','cormorant-italic-cyrillic.woff2','cyrillic'],
 ['DM Sans','normal','300 600','5c285b27cdda1fe8-s.p.0yo6-5yoeeudq.woff2','dm-sans-latin.woff2','latin'],
 ['IBM Plex Mono','normal','400','99e609270109b47d-s.p.16-z~2sp29ex6.woff2','plex-mono-latin.woff2','latin'],
 ['IBM Plex Mono','normal','400','59b15b4bcd7b1eb5-s.p.0x08jh8vondwt.woff2','plex-mono-cyrillic.woff2','cyrillic']
 ];
 fs.mkdirSync(path.join(out,'assets/fonts'),{recursive:true});
 const ranges={latin:'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',cyrillic:'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'};
 let fontStyles='';let linkedFonts='';
 for(const [name,style,weight,filename,dest,subset] of fonts){
  const data=fs.readFileSync(path.join(fontDir,filename));fs.writeFileSync(path.join(out,'assets/fonts',dest),data);
  const prefix=`@font-face{font-family:'${name}';font-style:${style};font-weight:${weight};font-display:swap;`;
  fontStyles+=prefix+`src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2');unicode-range:${ranges[subset]};}\n`;
  linkedFonts+=prefix+`src:url('assets/fonts/${dest}') format('woff2');unicode-range:${ranges[subset]};}\n`;
 }
 const dataUri=(name)=>'data:image/webp;base64,'+fs.readFileSync(path.join(out,'assets',name)).toString('base64');
 const css=fs.readFileSync(path.join(root,'work/hero.css'),'utf8');
 const js=fs.readFileSync(path.join(root,'work/hero.js'),'utf8');
 const shell=fs.readFileSync(path.join(root,'work/hero-shell.html'),'utf8');
 const html=shell.replace('/*FONT_STYLES*/',fontStyles).replace('/*HERO_STYLES*/',css).replace('/*HERO_SCRIPT*/',js).replaceAll('/*SCENE_IMAGE*/',dataUri('sanctuary.webp')).replaceAll('/*MIST_IMAGE*/',dataUri('mist.webp'));
 fs.writeFileSync(path.join(out,'index.html'),html);
 fs.writeFileSync(path.join(out,'hero.css'),linkedFonts+'\n'+css);
 fs.writeFileSync(path.join(out,'hero.js'),js);
 const integrationHtml=shell.replace('<style>/*FONT_STYLES*/\n/*HERO_STYLES*/</style>','<link rel="stylesheet" href="hero.css">').replace('<script>/*HERO_SCRIPT*/</script>','<script src="hero.js" defer></script>').replaceAll('/*SCENE_IMAGE*/','assets/sanctuary.webp').replaceAll('/*MIST_IMAGE*/','assets/mist.webp');
 fs.writeFileSync(path.join(out,'modular.html'),integrationHtml);
 console.log(JSON.stringify({htmlBytes:Buffer.byteLength(html),assets:fs.readdirSync(path.join(out,'assets')).map(f=>({name:f,bytes:fs.statSync(path.join(out,'assets',f)).size}))},null,2));
})();
