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
const olivia=lettering('OLIVIA',107,7.4),arcana=lettering('ARCANA',32,16.7);
function wordmark(center,base,color){return `<g fill="${color}"><path aria-label="OLIVIA" transform="translate(${(center-olivia.width/2).toFixed(3)} ${base})" d="${olivia.d}"/><path aria-label="ARCANA" transform="translate(${(center-arcana.width/2).toFixed(3)} ${base+64})" d="${arcana.d}"/></g>`;}
const title='<title>OLIVIA ARCANA</title><desc>A single olive bough turns through an open oval. Five slender leaves and two fruits follow its curved silhouette. Outlined Cormorant Garamond lettering.</desc>';
function primary(color='#112d3c',bg='') {return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="Olivia Arcana">${title}${bg?`<rect width="800" height="800" fill="${bg}"/>`:''}<g transform="translate(223 78) scale(1.08)">${mark.paths(color)}</g>${wordmark(400,613,color)}</svg>`;}
function horizontal(color='#112d3c',bg='') {return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="350" viewBox="0 0 1000 350" role="img" aria-label="Olivia Arcana">${title}${bg?`<rect width="1000" height="350" fill="${bg}"/>`:''}<g transform="translate(15 20) scale(.82)">${mark.paths(color)}</g>${wordmark(627,170,color)}</svg>`;}
function wordonly(color='#112d3c'){return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="260" viewBox="0 0 700 260" role="img" aria-label="Olivia Arcana">${title}${wordmark(350,133,color)}</svg>`;}
(async()=>{
 const out='outputs/olivia-identity/';
 for (const [name,svg] of Object.entries({'logo-primary-dark':primary(),'logo-primary-light':primary('#eee7d7'),'logo-horizontal-dark':horizontal(),'logo-horizontal-light':horizontal('#eee7d7'),'wordmark-dark':wordonly(),'wordmark-light':wordonly('#eee7d7')})){
  fs.writeFileSync(out+name+'.svg',svg);
  await sharp(Buffer.from(svg)).resize({width:name.startsWith('logo-primary')?1600:2000}).png().toFile(out+name+'.png');
 }
 await sharp(Buffer.from(primary('#112d3c','#f2ede3'))).resize(800,800).png().toFile('work/olivia-identity/lockup-preview.png');
 for(const [name,svg]of Object.entries({'symbol-dark':mark.svg(),'symbol-light':mark.svg('#eee7d7'),'symbol-color':mark.svg('#15323f','','#af8d54')})){await sharp(Buffer.from(svg)).resize(1080,1200).png().toFile(out+name+'.png')}
 fs.writeFileSync(out+'README-logo.txt',`OLIVIA ARCANA — THE OPEN OLIVE\n\nThe symbol is an original native-vector drawing, authored from five independent lanceolate leaf contours, two olive contours, two connecting twigs and one continuous variable-width Bézier bough. Its open oval and serpentine turn derive from the movement in the client-supplied ivory/lapis olive-bough reference. No generative image, stock icon or automatic tracing is embedded in the logo.\n\nlogo-primary-* : centered primary lockup, symbol and outlined wordmark\nlogo-horizontal-* : compact horizontal web/print lockup\nwordmark-* : lettering only\nsymbol-* : emblem only\n-dark : dark lapis ink on transparent background\n-light : warm ivory ink on transparent background\nsymbol-color : lapis with two muted gold fruit accents\nsymbol-guide.png : flat dark symbol on a plain white field, for image-generation reference only\n\nAll SVG letterforms are paths, without font dependencies. All PNG exports except the guide have transparent backgrounds. Do not add strokes or drop shadows to the master marks. Use the symbol as a separate flat identity mark; the sculptural illustration is a decorative application.\n\nTypography: Cormorant Garamond Medium, Christian Thalmann / Catharsis Fonts. Source: Google Fonts, Cormorant Garamond v21 Medium, from the static font URL recorded in work/fonts.css. Font licensing in embedded metadata: SIL Open Font License 1.1. The lettering was optically spaced and converted to paths; the letterforms themselves remain Cormorant Garamond. No separate font software is included.\n\nSmall-size recommendation: symbol height at least 32 px. Primary logo should be at least 200 px high; below that use the symbol or horizontal lockup.\n`);
})();
