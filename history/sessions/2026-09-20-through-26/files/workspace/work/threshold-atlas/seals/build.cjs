const fs = require('fs');
const path = require('path');
const sharp = require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const opentype = require('/Users/macbookpro/olivia-arcana/website/node_modules/opentype.js');
const out = path.resolve('outputs/olivia-threshold-atlas/logos');
const source = path.resolve('work/threshold-atlas/seals');
fs.mkdirSync(out,{recursive:true});
fs.mkdirSync(source,{recursive:true});
const bytes = fs.readFileSync('work/olivia-identity/CormorantGaramond-Medium.ttf');
const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length));
const dark = '#142f3c', light = '#efe7d5', paper = '#f3eee4';
const P = (d,more='')=>`<path d="${d}" ${more}/>`;
const half = d=>`${P(d)}${P(d,'transform="translate(600 600) rotate(180)"')}`;
const designs = [
  {
    id:'L17',name:'The Joined Initials',description:'An elongated O shares its eastern curve with the rising diagonal of A.',
    paths:
      P('M256 128 C183 128 137 204 137 301 C137 403 184 472 256 472 C326 472 370 401 370 301 C370 203 325 128 256 128 Z M255 138 C313 138 342 205 342 301 C342 401 312 462 255 462 C198 462 165 402 165 301 C165 204 199 138 255 138 Z','fill-rule="evenodd"')+
      P('M356 137 L460 451 C463 460 470 464 482 465 L482 472 L404 472 L404 465 C421 465 426 460 422 448 L397 372 L295 372 L271 447 C266 461 270 464 287 465 L287 472 L231 472 L231 465 C249 463 254 457 260 440 L352 137 Z M346 213 L299 360 L393 360 Z','fill-rule="evenodd"')
  },
  {
    id:'L18',name:'The Inner Counter',description:'A narrow A stands within a two-ended opening, its crossbar held in the oval.',
    paths:
      P('M300 128 C381 128 431 197 431 300 C431 403 381 472 300 472 C219 472 169 403 169 300 C169 197 219 128 300 128 Z M300 138 C233 138 190 199 190 300 C190 401 233 462 300 462 C367 462 410 401 410 300 C410 199 367 138 300 138 Z','fill-rule="evenodd"')+
      P('M297 172 L380 415 L385 421 L350 421 L357 414 L338 354 L258 354 L238 414 L246 421 L217 421 L225 413 L294 172 Z M292 237 L262 342 L334 342 Z','fill-rule="evenodd"')+
      P('M254 347 C282 337 315 337 342 347 L342 351 C311 345 284 345 254 351 Z')
  },
  {
    id:'L19',name:'The Opposed A',description:'Two architectural A forms meet at their feet, enclosing one shared opening.',
    paths:half('M300 126 L413 300 L386 300 L300 164 L214 300 L187 300 Z M256 256 L344 256 L351 267 L249 267 Z')
  },
  {
    id:'L20',name:'The Narrow Cartouche',description:'A slender enclosure with straight jambs and paired veils gathered at its waist.',
    paths:
      P('M218 209 C218 152 248 120 300 120 C352 120 382 152 382 209 L382 391 C382 448 352 480 300 480 C248 480 218 448 218 391 Z M227 209 L227 391 C227 443 253 471 300 471 C347 471 373 443 373 391 L373 209 C373 157 347 129 300 129 C253 129 227 157 227 209 Z','fill-rule="evenodd"')+
      half('M277 149 C263 193 272 250 239 284 C236 289 233 294 232 300 C243 307 249 327 247 355 C243 339 237 323 230 317 L230 278 C250 245 246 190 263 161 Z')+
      P('M210 294 L236 294 L236 306 L210 306 Z M364 294 L390 294 L390 306 L364 306 Z')
  },
  {
    id:'L21',name:'The Open Medallion',description:'Two open arcs turn into tapered veil ribbons around an empty centre.',
    paths:half('M457 240 C433 165 375 124 301 124 C212 124 143 189 136 277 L148 274 C157 194 219 136 301 136 C369 136 419 173 443 240 C449 258 444 273 431 285 L330 373 C314 388 290 408 254 428 C294 417 321 399 346 378 L442 297 C462 280 466 263 457 240 Z')
  },
  {
    id:'L22',name:'The Incised O',description:'A calligraphic O is cut at two places, like a seal lightly opened by a veil.',
    paths:half('M301 123 C214 125 158 197 158 291 C158 383 202 450 270 470 L274 458 C228 435 198 373 198 292 C198 204 233 145 301 135 Z')
  },
  {
    id:'L23',name:'The Relief Seal',description:'A compact architectural stamp carries two carved openings in its counterform.',
    paths:
      P('M212 137 L388 137 L424 177 L424 423 L388 463 L212 463 L176 423 L176 177 Z M222 151 L190 183 L190 417 L222 449 L378 449 L410 417 L410 183 L378 151 Z','fill-rule="evenodd"')+
      half('M210 280 L210 222 C210 170 248 158 300 158 C352 158 390 170 390 222 L390 280 L371 280 L371 226 C371 191 346 175 300 175 C254 175 229 191 229 226 L229 280 Z')+
      half('M274 193 C269 239 256 270 238 293 C232 300 228 307 231 319 C218 308 219 296 228 282 C246 257 253 221 258 200 Z')
  },
  {
    id:'L24',name:'The Threshold Knot',description:'A single over-and-under movement links two vaulted openings into a continuous knot.',
    paths:
      half('M300 123 C221 151 177 210 177 264 C177 307 210 333 250 347 L269 332 C221 317 191 295 191 264 C191 216 231 163 300 136 C369 163 409 216 409 264 C409 295 379 317 331 332 L350 347 C390 333 423 307 423 264 C423 210 379 151 300 123 Z')+
      half('M250 269 C272 280 286 291 300 306 L312 295 C294 280 278 269 259 260 Z')
  }
];
function lettering(text,size,tracking){
  const glyphs=font.stringToGlyphs(text),scale=size/font.unitsPerEm;let x=0,paths=[];
  glyphs.forEach((glyph,i)=>{paths.push(glyph.getPath(x,0,size).toPathData(3));x+=glyph.advanceWidth*scale;if(i<glyphs.length-1)x+=font.getKerningValue(glyph,glyphs[i+1])*scale+tracking});
  return {d:paths.join(' '),width:x};
}
const olivia=lettering('OLIVIA',107,8.7),arcana=lettering('ARCANA',32,15.8);
const wordmark=color=>`<g fill="${color}"><path aria-label="OLIVIA" transform="translate(${(400-olivia.width/2).toFixed(3)} 620)" d="${olivia.d}"/><path aria-label="ARCANA" transform="translate(${(400-arcana.width/2).toFixed(3)} 684)" d="${arcana.d}"/></g>`;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function symbol(d,color=dark){return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-label="OLIVIA ARCANA — ${d.name}"><title>${d.id} — ${d.name}</title><desc>${escape(d.description)}</desc><g fill="${color}">${d.paths}</g></svg>`;}
function lockup(d,color=dark){return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="OLIVIA ARCANA — ${d.name}"><title>OLIVIA ARCANA — ${d.name}</title><desc>${escape(d.description)} Outlined Cormorant Garamond lettering.</desc><g fill="${color}" transform="translate(70 -25) scale(1.1)">${d.paths}</g>${wordmark(color)}</svg>`;}
(async()=>{
  let entries=[];
  for(const d of designs){
    const svg=symbol(d),ivory=symbol(d,light),logo=lockup(d);
    fs.writeFileSync(path.join(out,d.id+'.svg'),svg);
    fs.writeFileSync(path.join(out,d.id+'-light.svg'),ivory);
    fs.writeFileSync(path.join(out,d.id+'-lockup.svg'),logo);
    fs.writeFileSync(path.join(out,d.id+'-lockup-light.svg'),lockup(d,light));
    await sharp(Buffer.from(svg)).resize(800,800).flatten({background:paper}).png().toFile(path.join(out,d.id+'.png'));
    await sharp(Buffer.from(logo)).flatten({background:paper}).png().toFile(path.join(out,d.id+'-lockup.png'));
    await sharp(Buffer.from(svg)).resize(32,32).png().toFile(path.join(source,d.id+'-32.png'));
    entries.push({id:d.id,name:d.name,family:'Monograms & seals',description:d.description,svg:d.id+'.svg',image:d.id+'.png',lockup:d.id+'-lockup.svg'});
  }
  fs.writeFileSync(path.join(out,'seals.json'),JSON.stringify(entries,null,2)+'\n');
  const contact=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1280" viewBox="0 0 2400 1280"><path fill="${paper}" d="M0 0H2400V1280H0Z"/>${designs.map((d,i)=>`<g transform="translate(${(i%4)*600} ${Math.floor(i/4)*640})"><g fill="${dark}">${d.paths}</g><text x="300" y="580" text-anchor="middle" fill="${dark}" font-family="Georgia" font-size="21">${d.id} · ${d.name}</text></g>`).join('')}</svg>`;
  await sharp(Buffer.from(contact)).png().toFile(path.join(source,'contact-sheet.png'));
  const contactLogo=await Promise.all(designs.map(async(d,i)=>({input:await sharp(path.join(out,d.id+'-lockup.png')).resize(400,400).toBuffer(),left:(i%4)*400,top:Math.floor(i/4)*400})));
  await sharp({create:{width:1600,height:800,channels:4,background:paper}}).composite(contactLogo).png().toFile(path.join(source,'lockup-contact.png'));
  fs.writeFileSync(path.join(source,'DESIGN-NOTES.md'),'# Monograms & seals — L17–L24\n\nEight independently constructed native-vector silhouettes. All master symbols use filled paths on transparent 600 × 600 artboards. Dark lapis and warm ivory alternates supplied. PNG previews use a plain warm-ivory background. No raster content, fonts, filters, procedural textures, or decorative stars are embedded in the SVG masters.\n\nLockups use outlined Cormorant Garamond Medium, from the existing licensed project font, with the same OLIVIA / ARCANA spacing as the earlier identity. These are logo proposals, not selected or applied brand changes.\n\nEach contour was authored for a different silhouette: joined OA, enclosed A, opposed A, narrow cartouche, open woven medallion, incised O, relief seal and interlaced threshold knot.\n');
  console.log(JSON.stringify({count:entries.length,out,preview:path.join(source,'contact-sheet.png')},null,2));
})();
