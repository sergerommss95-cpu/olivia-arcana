const fs=require('fs'),path=require('path');
const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'outputs/card-back-atelier-variants');
const olive=require('../olive-refinement/olive.cjs');
const designs=JSON.parse(fs.readFileSync(path.join(out,'designs.json')));
const P=d=>`<path d="${d}"/>`;
const fixed=n=>Number(n.toFixed(3));
function fan(opts={}){
 const c={n:12,spread:274,rim:94,rimCurve:74,neck:430,neckW:8,c1x:27,c1y:312,c2x:191,c2y:133,c2Curve:55,...opts};
 const ribs=Array.from({length:c.n+1},(_,i)=>{let u=-1+2*i/c.n;return {sx:350+c.neckW*u,sy:c.neck,x:350+c.spread*u,y:c.rim+c.rimCurve*u*u,a:350+c.c1x*u,b:c.c1y,c:350+c.c2x*u,e:c.c2y+c.c2Curve*u*u};});
 const line=r=>`M${r.sx} ${r.sy} C${r.a} ${r.b} ${r.c} ${r.e} ${r.x} ${r.y}`;
 const panels=ribs.slice(0,-1).map((r,i)=>{const s=ribs[i+1];return P(`${line(r)} L${s.x} ${s.y} C${s.c} ${s.e} ${s.a} ${s.b} ${s.sx} ${s.sy} Z`);}).join('');
 const rim=`M${350-c.spread} ${c.rim+c.rimCurve} Q350 ${c.rim-c.rimCurve} ${350+c.spread} ${c.rim+c.rimCurve}`;
 return {panels,blue:ribs.map(r=>P(line(r))).join(''),gold:ribs.filter((r,i)=>i%3===0||i===c.n).map(r=>P(line(r))).join('')+P(rim)};
}
function instance(shape,transform='',scale=1,reverse=false){return {...shape,transform,scale,reverse};}
function fit(shape,{x=350,y=430,angle=0,scale=1,anchorX=350,anchorY=430}={}){return instance(shape,`translate(${x} ${y}) rotate(${angle}) scale(${scale}) translate(${-anchorX} ${-anchorY})`,scale,Math.abs(angle)>90);}
const base=fan();
const border='<rect x="27" y="27" width="646" height="1146" rx="17"/>';
const pair=(shape)=>[instance(shape),instance(shape,'translate(700 1200) rotate(180)',1,true)];
function vault(){
 const a=Array.from({length:11},(_,i)=>{const t=i/10,l=72+137*t,r=628-137*t,top=86+194*t,bottom=1114-194*t,k=(r-l)/2;return `M350 ${top} C${l+.45*k} ${top} ${l} ${top+.45*k} ${l} ${top+k} V${bottom-k} C${l} ${bottom-.45*k} ${l+.45*k} ${bottom} 350 ${bottom} C${r-.45*k} ${bottom} ${r} ${bottom-.45*k} ${r} ${bottom-k} V${top+k} C${r} ${top+.45*k} ${r-.45*k} ${top} 350 ${top} Z`;});
 return {panels:a.slice(0,-1).map((d,i)=>`<path d="${d} ${a[i+1]}" fill-rule="evenodd"/>`).join(''),blue:a.map(P).join(''),gold:[0,5,10].map(i=>P(a[i])).join('')};
}
function aperture(){
 const n=48,points=[];
 for(let i=0;i<=n;i++){const a=-Math.PI/2+i*2*Math.PI/n;const b=a+.10*Math.sin(2*a);points.push({ix:350+135*Math.cos(a),iy:600+246*Math.sin(a),ox:350+269*Math.cos(b),oy:600+471*Math.sin(b)});}
 const line=p=>`M${p.ix} ${p.iy} C${350+(p.ix-350)*1.23} ${600+(p.iy-600)*1.3} ${350+(p.ox-350)*.94} ${600+(p.oy-600)*.94} ${p.ox} ${p.oy}`;
 return {panels:points.slice(0,-1).map((p,i)=>{const q=points[i+1];return P(`${line(p)} L${q.ox} ${q.oy} C${350+(q.ox-350)*.94} ${600+(q.oy-600)*.94} ${350+(q.ix-350)*1.23} ${600+(q.iy-600)*1.3} ${q.ix} ${q.iy} Z`);}).join(''),blue:points.slice(0,-1).map(p=>P(line(p))).join(''),gold:points.slice(0,-1).filter((p,i)=>i%6===0).map(p=>P(line(p))).join('')+'<ellipse cx="350" cy="600" rx="135" ry="246"/><ellipse cx="350" cy="600" rx="269" ry="471"/>'};
}
function current(){
 const ribs=Array.from({length:10},(_,i)=>{let dx=i*10,dy=i*2;return {x:85+dx,y:122+dy,ex:150+dx,ey:1070+dy,c1x:335+dx,c1y:322+dy,c2x:-75+dx,c2y:770+dy};});
 const line=r=>`M${r.x} ${r.y} C${r.c1x} ${r.c1y} ${r.c2x} ${r.c2y} ${r.ex} ${r.ey}`;
 return {panels:ribs.slice(0,-1).map((r,i)=>{const q=ribs[i+1];return P(`${line(r)} L${q.ex} ${q.ey} C${q.c2x} ${q.c2y} ${q.c1x} ${q.c1y} ${q.x} ${q.y} Z`);}).join(''),blue:ribs.map(r=>P(line(r))).join(''),gold:[0,3,6,9].map(i=>P(line(ribs[i]))).join('')+P('M85 122 L175 140 M150 1070 L240 1088')};
}
function leaf(){
 const n=10,ribs=Array.from({length:n+1},(_,i)=>{let u=i/n;return {d:`M350 447 C${82+428*u} ${315-45*u} ${128+345*u} ${128+15*u} 350 78`,a:82+428*u,b:315-45*u,c:128+345*u,e:128+15*u};});
 return {panels:ribs.slice(0,-1).map((r,i)=>{const q=ribs[i+1];return P(`${r.d} C${q.c} ${q.e} ${q.a} ${q.b} 350 447 Z`);}).join(''),blue:ribs.map(r=>P(r.d)).join(''),gold:[0,5,10].map(i=>P(ribs[i].d)).join('')};
}
const variants={
 '01':{parts:pair(base)},
 '02':{parts:[instance(base,'translate(245 600) rotate(-90) scale(.95 .50) translate(-350 -430)',.69),instance(base,'translate(455 600) rotate(90) scale(.95 .50) translate(-350 -430)',.69)]},
 '03':{parts:[fit(base,{x:210,y:327,angle:-15,scale:.48}),fit(base,{x:490,y:327,angle:15,scale:.48}),fit(base,{x:490,y:873,angle:165,scale:.48}),fit(base,{x:210,y:873,angle:195,scale:.48})]},
 '04':{parts:[fit(fan({spread:267,rimCurve:36}),{x:300,y:440,angle:-25,scale:.65}),fit(fan({spread:267,rimCurve:36}),{x:400,y:760,angle:155,scale:.65})]},
 '05':{parts:[instance(vault())]},
 '06':{parts:[instance(aperture())]},
 '07':{parts:pair(current())},
 '08':{parts:[fit(leaf(),{x:300,y:470,angle:-12,scale:.87,anchorY:447}),fit(leaf(),{x:400,y:730,angle:168,scale:.87,anchorY:447})]},
 '09':{repeat:true,parts:[],extras:'<ellipse cx="350" cy="600" rx="131" ry="222"/>'},
 '10':{parts:[fit(fan({spread:264,rimCurve:26,neck:440,c1y:296}),{x:350,y:464,scale:1})],markY:790,extras:P('M220 1094 H480')}
};
if(variants['09'].repeat){
 for(let row=0;row<6;row++)for(let col=0;col<3;col++)variants['09'].parts.push(fit(fan({n:6}),{x:139+211*col,y:237+172*row,scale:.32}));
 variants['09'].maskCentre=true;
}
function renderPart(part,key){return `<g transform="${part.transform}" stroke-width="${1.65/part.scale}">${part[key]}</g>`;}
function make(d){
 const v=variants[d.id];
 const markScale=160/207,markY=v.markY||600;
 const emblem=`<g fill="currentColor" stroke="none" transform="translate(${350-50.5*markScale} ${markY-114.5*markScale}) scale(${markScale})">${olive.silhouette}</g>`;
 const blue=v.parts.map(p=>renderPart(p,'blue')).join('');
 const patternGold=v.parts.map(p=>renderPart(p,'gold')).join('');
 const outer=`<g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${border}${v.extras||''}</g>${emblem}`;
 const pattern=`<g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"${v.maskCentre?' mask="url(#centre-clear)"':''}>${patternGold}</g>`;
 const panels=v.parts.map(p=>`<g fill="url(#${p.reverse?'fold-reverse':'fold'})" transform="${p.transform}">${p.panels}</g>`).join('');
 const defs=`<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17354b"/><stop offset=".46" stop-color="#102c43"/><stop offset="1" stop-color="#0b2438"/></linearGradient>
<linearGradient id="fold" x1="0" y1="0" x2="1" y2=".1"><stop stop-color="#071d30" stop-opacity=".46"/><stop offset=".22" stop-color="#24475e" stop-opacity=".22"/><stop offset=".68" stop-color="#426175" stop-opacity=".37"/><stop offset=".84" stop-color="#71909b" stop-opacity=".32"/><stop offset="1" stop-color="#091f31" stop-opacity=".48"/></linearGradient>
<linearGradient id="fold-reverse" href="#fold" x1="1" y1="1" x2="0" y2=".9"/>
<linearGradient id="foil" gradientUnits="userSpaceOnUse" x1="70" y1="65" x2="608" y2="1110"><stop stop-color="#b8a577"/><stop offset=".32" stop-color="#e0cda0"/><stop offset=".55" stop-color="#a08c60"/><stop offset=".78" stop-color="#d0bc89"/><stop offset="1" stop-color="#ac986b"/></linearGradient>
<clipPath id="trim"><rect width="700" height="1200" rx="27"/></clipPath><clipPath id="inner-trim"><rect x="46" y="46" width="608" height="1108" rx="8"/></clipPath>
<mask id="centre-clear" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="1200"><rect width="700" height="1200" fill="white"/><ellipse cx="350" cy="600" rx="${d.id==='09'?131:98}" ry="${d.id==='09'?222:161}" fill="black"/></mask>
<mask id="foil-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="1200"><g style="color:white"><g clip-path="url(#inner-trim)">${pattern}</g>${outer}</g></mask>`;
 const svgHead=`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1200" viewBox="0 0 700 1200"><title>${d.id} — ${d.name}</title><desc>${d.description} Entirely vector artwork with a refined olive and consistent fine gold finish.</desc>`;
 const finished=svgHead+`<defs>${defs}</defs><g clip-path="url(#trim)"><rect width="700" height="1200" fill="url(#paper)"/><g clip-path="url(#inner-trim)"${v.maskCentre?' mask="url(#centre-clear)"':''}>${panels}<g fill="none" stroke="#7893a0" stroke-opacity=".17">${blue}</g></g><g style="color:#081a29" opacity=".65" transform="translate(.45 .65)"><g clip-path="url(#inner-trim)">${pattern}</g>${outer}</g><rect width="700" height="1200" fill="url(#foil)" mask="url(#foil-mask)"/></g></svg>`;
 const flat=svgHead+`<defs>${defs}</defs><rect width="700" height="1200" rx="27" fill="#102c43"/><g fill="none" stroke="#2d4859" clip-path="url(#inner-trim)"${v.maskCentre?' mask="url(#centre-clear)"':''}>${blue}</g><rect width="700" height="1200" fill="#c4ad79" mask="url(#foil-mask)"/></svg>`;
 const foil=svgHead+`<defs>${defs}</defs><rect width="700" height="1200" fill="#000" mask="url(#foil-mask)"/></svg>`;
 return {finished,flat,foil};
}
async function main(){
 for(const d of designs){
  const art=make(d);
  fs.writeFileSync(path.join(out,d.id+'.svg'),art.finished);
  fs.writeFileSync(path.join(out,d.id+'-flat.svg'),art.flat);
  fs.writeFileSync(path.join(out,d.id+'-foil.svg'),art.foil);
  await sharp(Buffer.from(art.finished),{density:144}).png().toFile(path.join(out,d.id+'.png'));
  await sharp(Buffer.from(art.finished),{density:96}).webp({quality:94}).toFile(path.join(out,d.id+'.webp'));
  console.log(d.id+' '+d.name);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
