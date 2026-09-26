const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root='<LOCAL_HOME>/Documents/Codex/2026-09-11/i',src=path.join(root,'work/tide'),out=path.join(root,'outputs/olivia-arcana-tide');
(async()=>{
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
const artwork=[
 ['original','<LOCAL_HOME>/Downloads/34EE5F88-5FF7-4271-8DB0-ADE059019032.PNG','original.webp',true],
 ['plate',path.join(root,'work/generated-v2/arrival-background.png'),'sea-clean-plate.webp',false],
 ['matte','<LOCAL_HOME>/olivia-arcana/hero-lab/assets/olivia-cutout-raw.png','olivia-original-matte.png',true],
 ['sanctuary',path.join(root,'work/generated/olivia-arcana-temple-hero.png'),'quiet-temple.webp',false]
];
for(const [id,file,name,lossless] of artwork){const target=path.join(out,'assets',name);if(!fs.existsSync(target)){if(name.endsWith('.png'))fs.copyFileSync(file,target);else await sharp(file).webp(lossless?{lossless:true,effort:6}:{quality:93,effort:6}).toFile(target);}}
fs.cpSync('<LOCAL_HOME>/olivia-arcana/hero-lab/assets/fonts',path.join(out,'assets/fonts'),{recursive:true});
const fontCSS=fs.readFileSync(path.join(root,'outputs/olivia-arcana-hero/hero.css'),'utf8').split(':root')[0]+"\n@font-face{font-family:'IBM Plex Sans';font-style:normal;font-weight:400;src:url('assets/fonts/plex-sans-cyrillic.woff2') format('woff2');font-display:swap;unicode-range:U+0400-052F,U+2DE0-2DFF,U+A640-A69F}\n";
const inlineFonts=fontCSS.replaceAll(/url\('assets\/fonts\/([^']+)'\)/g,(_,name)=>'url(data:font/woff2;base64,'+fs.readFileSync(path.join(out,'assets/fonts',name)).toString('base64')+')');
const css=fs.readFileSync(path.join(src,'style.css'),'utf8');
const glsl=fs.readFileSync(path.join(src,'world.glsl'),'utf8');
const js=fs.readFileSync(path.join(src,'app.js'),'utf8').replace('/*FRAGMENT*/',()=>JSON.stringify(glsl));
const template=fs.readFileSync(path.join(src,'index.template.html'),'utf8');
let html=template.replace('/*FONTS*/',()=>inlineFonts).replace('/*STYLE*/',()=>css).replace('/*SCRIPT*/',()=>js);
let modular=template.replace('<style>/*FONTS*/\n/*STYLE*/</style>','<link rel="stylesheet" href="style.css">').replace('<script>/*SCRIPT*/</script>','<script src="app.js" defer></script>');
for(const [id,file,name] of artwork){const marker='/*'+id.toUpperCase()+'*/',mime=name.endsWith('.png')?'image/png':'image/webp';html=html.replace(marker,'data:'+mime+';base64,'+fs.readFileSync(path.join(out,'assets',name)).toString('base64'));modular=modular.replace(marker,'assets/'+name);}
fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'modular.html'),modular);fs.writeFileSync(path.join(out,'style.css'),fontCSS+css);fs.writeFileSync(path.join(out,'app.js'),js);fs.writeFileSync(path.join(out,'world.glsl'),glsl);
console.log('Built standalone and modular: '+Buffer.byteLength(html)+' bytes; '+artwork.map(x=>x[2]).join(', '));
})();
