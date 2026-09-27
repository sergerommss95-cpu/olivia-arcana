const fs=require('fs');
const path=require('path');
const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'outputs/card-back-options-material');
const raw=fs.readFileSync('/Users/macbookpro/olivia-arcana/website/public/olive-mark.svg','utf8');
const paths=[...raw.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);
const designs=JSON.parse(fs.readFileSync(path.join(out,'designs.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(__dirname,'sources-all.json'),'utf8'));

// Native identity composition. ImageGen authors the material plates; the original
// four brand paths remain independent geometry in each editable SVG master.
async function main(){
 for(const s of sources){
  if(process.argv.length>2&&!process.argv.slice(2).includes(s.id))continue;
  const d=designs.find(d=>d.id===s.id),meta=await sharp(s.source).metadata();
  const W=meta.width,H=meta.height,scale=H*.135/27.7;
  const x=W/2+.5*scale,y=H/2+1.85*scale;
  const plate=fs.readFileSync(s.source).toString('base64');
  const symbol=`<g id="olive"><path d="${paths[0]}" fill="none" stroke="inherit" stroke-width="1.3" stroke-linecap="round"/><g fill="inherit">${paths.slice(1).map(d=>`<path d="${d}"/>`).join('')}<ellipse cx="0" cy="-13.5" rx="1.7" ry="2.2"/></g></g>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${s.id} — ${d.name}</title><desc>Olivia Arcana card-back design. Original olive vector geometry composed over an authored lapis material plate.</desc>
<defs>
<clipPath id="trim"><rect width="${W}" height="${H}" rx="${W*.029}"/></clipPath>
<linearGradient id="foil" gradientUnits="userSpaceOnUse" x1="-9" y1="-15" x2="8" y2="12"><stop stop-color="#ddcea5"/><stop offset=".26" stop-color="#b09a67"/><stop offset=".45" stop-color="#e1d4ad"/><stop offset=".66" stop-color="#b7a06c"/><stop offset="1" stop-color="#8e764b"/></linearGradient>
<filter id="foil-grain" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="4.5" numOctaves="2" seed="7" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 .30 0 0 0 0 .24 0 0 0 0 .12 0 0 0 .25 0" result="grain"/><feComposite in="grain" in2="SourceGraphic" operator="in" result="clipped"/><feBlend in="SourceGraphic" in2="clipped" mode="multiply" result="metal"/><feGaussianBlur in="SourceAlpha" stdDeviation=".12" result="bevel"/><feSpecularLighting in="bevel" surfaceScale=".18" specularConstant=".42" specularExponent="18" lighting-color="#f0e1ba" result="edge"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting><feComposite in="edge" in2="SourceAlpha" operator="in" result="shine"/><feBlend in="metal" in2="shine" mode="screen"/></filter>
${symbol}
</defs>
<g clip-path="url(#trim)"><image href="data:image/png;base64,${plate}" width="${W}" height="${H}"/>
<g transform="translate(${x} ${y}) scale(${scale})">
<use href="#olive" transform="translate(.07 .10)" fill="#061627" stroke="#061627" opacity=".8"/>
<use href="#olive" transform="translate(-.035 -.045)" fill="#eadaba" stroke="#eadaba" opacity=".48"/>
<use href="#olive" fill="url(#foil)" stroke="url(#foil)" filter="url(#foil-grain)"/>
<path d="M.9 6.9Q4.1 5.8 7.8 5.2 M-.9 .8Q-4.8-.6-8.7-1.4 M.9-5.2Q4.1-6.2 7.8-6.8" fill="none" stroke="#665336" stroke-width=".085" opacity=".36" stroke-linecap="round"/>
</g></g></svg>`;
  const file=path.join(out,s.id);fs.writeFileSync(file+'.svg',svg);
  await sharp(Buffer.from(svg)).png().toFile(file+'.png');
  await sharp(Buffer.from(svg)).webp({quality:96,effort:6}).toFile(file+'.webp');
  console.log(`${s.id} ${W}x${H}`);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
