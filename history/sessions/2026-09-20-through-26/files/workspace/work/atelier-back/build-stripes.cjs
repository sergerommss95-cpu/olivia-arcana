const fs=require('fs');
const path=require('path');
const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'outputs/card-back-atelier');
const olive=require('../olive-refinement/olive.cjs');
const W=700,H=1200;
const ribs=[];
// Ordered contours. The inner curve sets the opening; subsequent curves widen
// along a single continuous family, without crossing or added ornament.
const spacing=[0,.085,.172,.263,.357,.455,.557,.663,.773,.887,1];
for(const t of spacing){
 const sx=328-271*t, sy=59+4*t;
 const mx=226-168*t;
 const c1x=326-292*t,c1y=249+66*t;
 const c2x=226-168*t,c2y=326+91*t;
 ribs.push({t,d:`M${sx} ${sy} C${c1x} ${c1y} ${c2x} ${c2y} ${mx} 600 C${c2x} ${1200-c2y} ${c1x} ${1200-c1y} ${sx} ${1200-sy}`});
}
const curve=i=>ribs[i].d;
const reverse=i=>{
 const t=ribs[i].t,sx=328-271*t,sy=59+4*t,mx=226-168*t,c1x=326-292*t,c1y=249+66*t,c2x=226-168*t,c2y=326+91*t;
 return `L${sx} ${1200-sy} C${c1x} ${1200-c1y} ${c2x} ${1200-c2y} ${mx} 600 C${c2x} ${c2y} ${c1x} ${c1y} ${sx} ${sy} Z`;
};
const defs=`<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17354b"/><stop offset=".46" stop-color="#102c43"/><stop offset="1" stop-color="#0b2438"/></linearGradient>
<linearGradient id="fold" x1="0" y1="0" x2="1" y2=".10"><stop stop-color="#071d30" stop-opacity=".38"/><stop offset=".22" stop-color="#24475e" stop-opacity=".22"/><stop offset=".68" stop-color="#426175" stop-opacity=".25"/><stop offset=".84" stop-color="#71909b" stop-opacity=".21"/><stop offset="1" stop-color="#091f31" stop-opacity=".48"/></linearGradient>
<linearGradient id="foil" gradientUnits="userSpaceOnUse" x1="70" y1="65" x2="608" y2="1110"><stop stop-color="#b8a577"/><stop offset=".32" stop-color="#e0cda0"/><stop offset=".55" stop-color="#a08c60"/><stop offset=".78" stop-color="#d0bc89"/><stop offset="1" stop-color="#ac986b"/></linearGradient>
<filter id="paper-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="31" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".12"/></feComponentTransfer><feBlend in2="SourceGraphic" mode="soft-light"/></filter>
<clipPath id="trim"><rect width="700" height="1200" rx="27"/></clipPath>`;
const flutePanels=Array.from({length:ribs.length-1},(_,i)=>`<path d="${curve(i)} ${reverse(i+1)}" fill="url(#fold)"/>`).join('');
const blueRibs=ribs.map(r=>`<path d="${r.d}"/>`).join('');
const goldRibs=[0,3,6,10].map(i=>`<path d="${curve(i)}"/>`).join('');
const border='<rect x="27" y="27" width="646" height="1146" rx="17"/>';
const oliveScale=160/207;
const oliveTransform=`translate(${350-50.5*oliveScale} ${600-114.5*oliveScale}) scale(${oliveScale})`;
// The emblem and selected fan crests are one gold separation, sharing finish.
const foilPaths=`<g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${border}<g>${goldRibs}</g><g transform="translate(700 0) scale(-1 1)">${goldRibs}</g></g><g fill="currentColor" stroke="none" transform="${oliveTransform}">${olive.silhouette}</g>`;
const finished=`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1200" viewBox="0 0 700 1200"><title>Olivia Arcana — The Fold</title><desc>Vector card-back artwork. Two ordered fan families, shallow blue flutes and one fine olive emblem in muted gold.</desc><defs>${defs}</defs><g clip-path="url(#trim)"><rect width="700" height="1200" fill="url(#paper)"/><g>${flutePanels}<g transform="translate(700 0) scale(-1 1)">${flutePanels}</g></g><g fill="none" stroke="#7893a0" stroke-opacity=".17" stroke-width="1.1">${blueRibs}<g transform="translate(700 0) scale(-1 1)">${blueRibs}</g></g><g style="color:#081a29" opacity=".65" transform="translate(.45 .65)">${foilPaths}</g><g style="color:#d1bc88">${foilPaths}</g><rect width="700" height="1200" fill="transparent" filter="url(#paper-grain)" opacity=".20"/></g></svg>`;
const flat=`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1200" viewBox="0 0 700 1200"><title>Olivia Arcana — flat artwork</title><rect width="700" height="1200" rx="27" fill="#102c43"/><g fill="none" stroke="#2d4859" stroke-width="1.25">${blueRibs}<g transform="translate(700 0) scale(-1 1)">${blueRibs}</g></g><g style="color:#c4ad79">${foilPaths}</g></svg>`;
const separation=`<svg xmlns="http://www.w3.org/2000/svg" width="70mm" height="120mm" viewBox="0 0 700 1200"><title>Olivia Arcana — gold foil artwork separation, proof required</title><g style="color:#000">${foilPaths}</g></svg>`;
async function main(){
 fs.writeFileSync(path.join(out,'olivia-the-fold.svg'),finished);
 fs.writeFileSync(path.join(out,'olivia-the-fold-flat.svg'),flat);
 fs.writeFileSync(path.join(out,'olivia-the-fold-foil.svg'),separation);
 for(const [name,svg] of [['olivia-the-fold',finished],['olivia-the-fold-flat',flat]]){
  await sharp(Buffer.from(svg),{density:192}).png().toFile(path.join(out,name+'.png'));
  await sharp(Buffer.from(svg),{density:144}).webp({quality:94}).toFile(path.join(out,name+'.webp'));
 }
 console.log('Vector master, previews and foil separation built');
}
main().catch(e=>{console.error(e);process.exitCode=1});
