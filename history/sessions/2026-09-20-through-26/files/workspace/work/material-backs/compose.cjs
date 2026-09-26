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
<linearGradient id="foil" gradientUnits="userSpaceOnUse" x1="-9" y1="-15" x2="8" y2="12"><stop stop-color="#fff0c8"/><stop offset=".22" stop-color="#bd9750"/><stop offset=".40" stop-color="#f4d795"/><stop offset=".51" stop-color="#856029"/><stop offset=".66" stop-color="#d0ad69"/><stop offset="1" stop-color="#685025"/></linearGradient>
<linearGradient id="leaf-gold" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#6f552a"/><stop offset=".32" stop-color="#d3b274"/><stop offset=".48" stop-color="#f4ddb0"/><stop offset=".56" stop-color="#bd9c5c"/><stop offset="1" stop-color="#685025"/></linearGradient>
<radialGradient id="fruit-gold" cx=".32" cy=".23" r=".8"><stop stop-color="#f6dfad"/><stop offset=".34" stop-color="#d1ae69"/><stop offset=".77" stop-color="#8a682f"/><stop offset="1" stop-color="#574424"/></radialGradient>
<filter id="foil-grain" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="3.2" numOctaves="3" seed="7" result="noise"/><feColorMatrix in="noise" type="saturate" values="0" result="mono"/><feComponentTransfer in="mono" result="soft"><feFuncR type="linear" slope=".25" intercept=".73"/><feFuncG type="linear" slope=".25" intercept=".73"/><feFuncB type="linear" slope=".25" intercept=".73"/></feComponentTransfer><feComposite in="soft" in2="SourceGraphic" operator="in" result="clipped"/><feBlend in="SourceGraphic" in2="clipped" mode="multiply"/></filter>
${symbol}
</defs>
<g clip-path="url(#trim)"><image href="data:image/png;base64,${plate}" width="${W}" height="${H}"/>
<g transform="translate(${x} ${y}) scale(${scale})">
<use href="#olive" transform="translate(.14 .20)" fill="#06111b" stroke="#06111b" opacity=".9"/>
<use href="#olive" transform="translate(-.075 -.09)" fill="#f1e0b5" stroke="#f1e0b5" opacity=".78"/>
<g filter="url(#foil-grain)"><use href="#olive" fill="url(#foil)" stroke="url(#foil)"/>
<g fill="url(#leaf-gold)">${paths.slice(1).map(d=>`<path d="${d}"/>`).join('')}</g>
<ellipse cx="0" cy="-13.5" rx="1.7" ry="2.2" fill="url(#fruit-gold)"/></g>
<path d="M.9 6.9Q4.1 5.8 7.8 5.2 M-.9 .8Q-4.8-.6-8.7-1.4 M.9-5.2Q4.1-6.2 7.8-6.8" fill="none" stroke="#5d482a" stroke-width=".095" opacity=".66" stroke-linecap="round"/>
<path transform="translate(0 -.09)" d="M.9 6.9Q4.1 5.8 7.8 5.2 M-.9 .8Q-4.8-.6-8.7-1.4 M.9-5.2Q4.1-6.2 7.8-6.8" fill="none" stroke="#f5e1b8" stroke-width=".055" opacity=".66" stroke-linecap="round"/>
</g></g></svg>`;
  const file=path.join(out,s.id);fs.writeFileSync(file+'.svg',svg);
  await sharp(Buffer.from(svg)).png().toFile(file+'.png');
  await sharp(Buffer.from(svg)).webp({quality:96,effort:6}).toFile(file+'.webp');
  console.log(`${s.id} ${W}x${H}`);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
