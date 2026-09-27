const fs=require('fs'),path=require('path');
const opentype=require('/Users/macbookpro/olivia-arcana/website/node_modules/opentype.js');
const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const mark=require('./mark.cjs');
const bin=fs.readFileSync('work/olivia-identity/CormorantGaramond-Medium.ttf');
const font=opentype.parse(bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.length));
console.log(JSON.stringify({family:font.names.fontFamily,version:font.names.version,designer:font.names.designer,license:font.names.license,licenseURL:font.names.licenseURL,copyright:font.names.copyright},null,2));
function lettering(text,size,tracking){
 const glyphs=font.stringToGlyphs(text),s=size/font.unitsPerEm;let x=0,paths=[];
 for(let i=0;i<glyphs.length;i++){
  const g=glyphs[i];paths.push(g.getPath(x,0,size).toPathData(3));
  x+=g.advanceWidth*s;
  if(i<glyphs.length-1){x+=font.getKerningValue(g,glyphs[i+1])*s+tracking;}
 }
 return {d:paths.join(' '),width:x};
}
const olivia=lettering('OLIVIA',107,8.7),arcana=lettering('ARCANA',32,15.8);
function wordmark(center,base,color){return `<g fill="${color}"><path aria-label="OLIVIA" transform="translate(${(center-olivia.width/2).toFixed(3)} ${base})" d="${olivia.d}"/><path aria-label="ARCANA" transform="translate(${(center-arcana.width/2).toFixed(3)} ${base+64})" d="${arcana.d}"/></g>`;}
const title='<title>OLIVIA ARCANA</title><desc>A slender arch frames two parted veil contours. The central opening remains empty. Outlined Cormorant Garamond lettering.</desc>';
function primary(color='#112d3c',bg='') {return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="Olivia Arcana">${title}${bg?`<rect width="800" height="800" fill="${bg}"/>`:''}<g transform="translate(211.2 52) scale(1.18)">${mark.paths(color)}</g>${wordmark(400,599,color)}</svg>`;}
function horizontal(color='#112d3c',bg='') {return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="350" viewBox="0 0 1000 350" role="img" aria-label="Olivia Arcana">${title}${bg?`<rect width="1000" height="350" fill="${bg}"/>`:''}<g transform="translate(110 20) scale(.82)">${mark.paths(color)}</g>${wordmark(627,170,color)}</svg>`;}
function wordonly(color='#112d3c'){return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="260" viewBox="0 0 700 260" role="img" aria-label="Olivia Arcana">${title}${wordmark(350,133,color)}</svg>`;}
(async()=>{
 const out='outputs/olivia-threshold/';
 for (const [name,svg] of Object.entries({'logo-primary-dark':primary(),'logo-primary-light':primary('#eee7d7'),'logo-horizontal-dark':horizontal(),'logo-horizontal-light':horizontal('#eee7d7'),'wordmark-dark':wordonly(),'wordmark-light':wordonly('#eee7d7')})){
  fs.writeFileSync(out+name+'.svg',svg);
  await sharp(Buffer.from(svg)).resize({width:name.startsWith('logo-primary')?1600:2000}).png().toFile(out+name+'.png');
 }
 await sharp(Buffer.from(primary('#112d3c','#f2ede3'))).resize(800,800).png().toFile('work/olivia-threshold/lockup-preview.png');
 for(const [name,svg]of Object.entries({'symbol-dark':mark.svg(),'symbol-light':mark.svg('#eee7d7'),'symbol-gold':mark.svg('#aa8954')})){await sharp(Buffer.from(svg)).resize(960,1170).png().toFile(out+name+'.png')}
 fs.writeFileSync(out+'README-logo.txt',`OLIVIA ARCANA — THE VEILED THRESHOLD

The original native-vector symbol is built from three filled Bézier contours: one architectural arch and two tapering veils. The negative opening is deliberately empty. It derives from the user's selected Veiled Threshold card artwork, rather than an olive or generic celestial icon.

logo-primary-* : centered primary lockup, symbol and outlined wordmark
logo-horizontal-* : horizontal web/print lockup
wordmark-* : lettering only
symbol-* : emblem only
-dark : dark lapis ink on transparent background
-light : warm ivory ink on transparent background
symbol-guide.png : plain-white image-generation reference

Every SVG letterform is a path, without font dependencies. PNG exports are transparent except the guide. The flat logo has no texture, shadow, stroke filter or embedded raster. Keep decorative sculptural interpretations separate from the master identity.

Typography: Cormorant Garamond Medium, Christian Thalmann / The Cormorant Project Authors. Source: Google Fonts Cormorant Garamond v21 Medium; static font URL recorded in work/fonts.css. Letterforms are converted to paths with adjusted kerning and tracking; the letterforms themselves remain Cormorant. License: SIL Open Font License 1.1, included in FONT-LICENSE.txt.

Use the emblem at least 32 px high, and the centered primary lockup at least 200 px high. At small header sizes, use the horizontal lockup or the symbol.
`);
})();
