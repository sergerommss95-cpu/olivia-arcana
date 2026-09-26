const fs=require('fs');
const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const {silhouette}=require('../olive-refinement/olive.cjs');
const stroke='#7790a0',gold='#b6a071',ivory='#d4cfba';
const olive=(x,y,s,rot=0,color=stroke)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-50 -115)" fill="${color}">${silhouette}</g>`;
const turn=s=>`<g>${s}</g><g transform="rotate(180 350 600)">${s}</g>`;
const rect=(x,y,w,h,r,c=stroke,sw=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
const line=(d,c=stroke,w=1)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const leaf=(x,y,a,s=1)=>`<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0 Q-12 -23 0 -58 Q10 -20 0 0Z" fill="${stroke}"/><path d="M0 -3L0 -54" stroke="#0b2034" stroke-width="1"/></g>`;
let field='';for(let row=0;row<12;row++){for(let col=0;col<6;col++){let x=98+col*101+(row%2?50:0);let y=93+row*92;if(x<620)field+=olive(x,y,.20,(row+col)%2?180:0,'#304c61');}}
const frame=rect(25,25,650,1150,24,gold,.9)+rect(34,34,632,1132,20,stroke,.8)+rect(53,53,594,1094,30,gold,.7);
let corners='';for(let i=0;i<5;i++){corners+=leaf(90+i*30,160-i*18,-45,.42);}corners=turn(corners+`<g transform="translate(700 0) scale(-1 1)">${corners}</g>`);
const seed=(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="49" ry="79" fill="#0b2034" stroke="${gold}" stroke-width="1"/>`+olive(x,y,.50,0,ivory);
const a=field+turn(seed(350,365))+turn(line('M350 444C510 455 510 548 350 600C190 548 190 455 350 444',gold,.9))+corners;
let b=field+turn(line('M350 595C160 510 185 205 350 175C515 205 540 510 350 595',gold,1));
for(let i=0;i<8;i++){const y=242+i*42,x=255-25*Math.sin(i*.7);b+=turn(leaf(x,y,-40+i*5,.9)+leaf(700-x,y,40-i*5,.9));}
b+=turn(olive(350,340,.46,0,ivory))+corners;
let c='';for(let row=0;row<10;row++){for(let col=0;col<6;col++){const x=65+col*110,y=92+row*113;c+=line(`M${x} ${y-50}C${x+60} ${y-10} ${x-60} ${y+52} ${x} ${y+113}`,'#6c8390',1.2)+leaf(x+7,y,-48,.59)+leaf(x-7,y+30,135,.59);if((row+col)%3===0)c+=`<ellipse cx="${x+22}" cy="${y+43}" rx="3.5" ry="7" fill="${gold}"/>`;}}
let d=field;for(let i=0;i<9;i++){d+=turn(line(`M70 ${100+i*52}C170 ${190+i*47} 250 ${280+i*40} 350 ${365+i*32}C450 ${280+i*40} 530 ${190+i*47} 630 ${100+i*52}`,'#405d73',.8));}
d+=turn(`<ellipse cx="350" cy="366" rx="54" ry="89" fill="${ivory}"/><ellipse cx="350" cy="366" rx="48" ry="82" fill="none" stroke="${gold}" stroke-width=".8"/>`+olive(350,366,.55,0,'#365165'))+corners;
let e='';for(let col=0;col<5;col++){const x=115+col*118;for(let row=0;row<8;row++){const y=118+row*138;e+=line(`M${x} ${y-80}C${x+95} ${y} ${x-95} ${y+75} ${x} ${y+138}`,stroke,.8)+olive(x,y,.30,(col+row)%2?180:0,'#718491');}}
e+=`<ellipse cx="350" cy="600" rx="48" ry="95" fill="#0b2034" stroke="${gold}" stroke-width=".7"/>`+turn(olive(350,559,.24,0,ivory))+corners;
(async()=>{for(const [i,body] of [a,b,c,d,e].entries()){const n=String(i+6).padStart(2,'0');const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1200" viewBox="0 0 700 1200"><defs><clipPath id="inside"><rect x="62" y="62" width="576" height="1076" rx="22"/></clipPath></defs><rect width="700" height="1200" rx="24" fill="#0b2034"/>${frame}<g clip-path="url(#inside)">${body}</g></svg>`;fs.writeFileSync('work/card-backs-ornamental/'+n+'-layout.svg',svg);await sharp(Buffer.from(svg)).png().toFile('work/card-backs-ornamental/'+n+'-layout.png');}console.log('Five composition guides rendered.');})();
