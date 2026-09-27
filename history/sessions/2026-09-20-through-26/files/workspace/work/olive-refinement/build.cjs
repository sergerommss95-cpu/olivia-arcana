const fs=require('fs');
const path=require('path');
const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const olive=require('./olive.cjs');
const root=path.resolve(__dirname,'../..');
const outputs=path.join(root,'outputs');
const out=path.join(outputs,'card-back-options-elegant');
const prior=path.join(outputs,'card-back-options-material');
const designs=JSON.parse(fs.readFileSync(path.join(prior,'designs.json')));
async function main(){
 fs.mkdirSync(out,{recursive:true});
 for(const name of ['designs.json','prompts.json'])fs.copyFileSync(path.join(prior,name),path.join(out,name));
 fs.writeFileSync(path.join(out,'olive-mark.svg'),olive.svg());
 fs.writeFileSync(path.join(outputs,'olive-refinement/olive-mark.svg'),olive.svg());
 for(const d of designs){
  const source=path.join(root,'work/material-backs/plates',d.id+'.png');
  const {width:W,height:H}=await sharp(source).metadata();
  const scale=H*.135/207,x=W/2-50.5*scale,y=H/2-114.5*scale;
  const plate=fs.readFileSync(source).toString('base64');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${d.id} — ${d.name}</title><desc>Olivia Arcana card-back design with a refined botanical olive emblem. Lapis artwork with editable native vector mark.</desc><defs><clipPath id="trim"><rect width="${W}" height="${H}" rx="${W*.029}"/></clipPath>${olive.defs}</defs><g clip-path="url(#trim)"><image href="data:image/png;base64,${plate}" width="${W}" height="${H}"/><g transform="translate(${x} ${y}) scale(${scale})">${olive.body}</g></g></svg>`;
  fs.writeFileSync(path.join(out,d.id+'.svg'),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out,d.id+'.png'));
  await sharp(Buffer.from(svg)).webp({quality:96,effort:6}).toFile(path.join(out,d.id+'.webp'));
  console.log('Rendered '+d.id);
 }
 const galleryPath=path.join(outputs,'olivia-card-backs.html');
 const previousGallery=path.join(outputs,'olive-refinement/gallery-before.html');
 let html=fs.readFileSync(galleryPath,'utf8');
 if(!fs.existsSync(previousGallery))fs.writeFileSync(previousGallery,html.replaceAll('card-back-options-material/','../card-back-options-material/'));
 html=html.replaceAll('card-back-options-material','card-back-options-elegant')
  .replace('The original olive mark','The refined olive')
  .replace('Lapis, fine engraving and the original olive inlay.','Lapis, fine engraving and a more delicate olive inlay.');
 const start=html.indexOf('<svg class="olive"'),end=html.indexOf('</svg>',start)+6;
 if(start>=0){
  const headerMark=olive.svg().replace('<svg xmlns','<svg class="olive" xmlns').replace('viewBox="0 0 100 230"','viewBox="-50 -5 200 240"').replace('width="300" height="690"','width="40" height="40"');
  html=html.slice(0,start)+headerMark+html.slice(end);
 }
 html=html.replace(/<link rel="icon"[^>]*>/,'<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,'+Buffer.from(olive.svg()).toString('base64')+'">');
 fs.writeFileSync(galleryPath,html);
 fs.writeFileSync(path.join(out,'design-notes.md'),`# Olivia Arcana — refined olive\n\nThe olive emblem has been redrawn as native vector paths: a tapering stem, three upward lanceolate leaves, and an elongated, tilted fruit. Its silhouette is narrower at the same card-height footprint. Satin champagne-gold shading and a fine grain replace the broad, glossy bevels. The ten lapis/ivory material plates are unchanged.\n\nThe material plates were created using built-in ImageGen with the real Moon card as a reference. The plate prompts are in prompts.json. The olive refinement was drawn directly in SVG; olive-mark.svg is the transparent editable mark.\n\nEach card SVG embeds its plate and contains an editable vector emblem; it is mixed raster/vector. Full-size PNG and WebP exports are included. This revision is applied to the local card-back gallery, pending selection for the hero.\n`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
