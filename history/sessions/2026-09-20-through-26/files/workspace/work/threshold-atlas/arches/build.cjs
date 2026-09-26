const fs=require('fs');const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const out='outputs/olivia-threshold-atlas/logos/';
const ink='#132c38',paper='#f2ede3';
const designs=[
{id:'L01',name:'The Parted Arch',description:'A rounded threshold with two suspended, tapering veils and an open base.',paths:[
'M180 466 L180 268 C180 190 230 130 300 130 C370 130 420 190 420 268 L420 466 L414 456 L414 268 C414 194 367 137 300 137 C233 137 186 194 186 268 L186 456 Z',
'M279 155 C261 203 269 255 245 290 C232 309 212 323 188 326 C204 342 207 390 196 439 C214 399 218 359 202 330 C237 325 260 296 272 257 C286 211 286 173 279 155 Z',
'M321 155 C339 203 331 255 355 290 C368 309 388 323 412 326 C396 342 393 390 404 439 C386 399 382 359 398 330 C363 325 340 296 328 257 C314 211 314 173 321 155 Z'
]},
{id:'L02',name:'The Lifted Veil',description:'A single diagonal sweep opens an otherwise quiet architectural frame.',paths:[
'M178 466 L178 264 C178 188 228 132 300 132 C372 132 422 188 422 264 L422 453 L416 453 L416 264 C416 192 369 139 300 139 C231 139 184 192 184 264 L184 454 Z',
'M350 155 C334 195 334 230 316 268 C297 308 254 330 223 358 C207 373 204 396 214 418 C196 407 193 384 207 365 C232 331 283 301 304 261 C325 220 328 180 350 155 Z',
'M235 407 C227 391 234 377 249 365 C271 348 292 335 309 315 C293 341 275 356 256 371 C243 382 237 393 235 407 Z'
]},
];
designs.push(...JSON.parse(fs.readFileSync('work/threshold-atlas/arches/more.json','utf8')));
function body(d){return `<g fill="${ink}" fill-rule="evenodd">${d.paths.map(p=>`<path d="${p}"/>`).join('')}</g>`}
function svg(d,bg=''){return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-label="Olivia Arcana ${d.name}"><title>${d.id} — ${d.name}</title><desc>${d.description}</desc>${bg?`<path fill="${bg}" d="M0 0H600V600H0Z"/>`:''}${body(d)}</svg>`}
async function exportAll(){
 const word=fs.readFileSync('outputs/olivia-threshold/wordmark-dark.svg','utf8').match(/<g fill=[\s\S]*?<\/g>/)[0];
 for(const d of designs){
 fs.writeFileSync(out+d.id+'.svg',svg(d));
 await sharp(Buffer.from(svg(d,paper))).resize(800,800).png().toFile(out+d.id+'.png');
 const lock=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="Olivia Arcana ${d.name}"><title>OLIVIA ARCANA — ${d.name}</title><g transform="translate(100 -15)">${body(d)}</g><g transform="translate(50 455)">${word}</g></svg>`;
 fs.writeFileSync(out+d.id+'-lockup.svg',lock);
 }
 fs.writeFileSync(out+'arches.json',JSON.stringify(designs.map(d=>({id:d.id,name:d.name,family:'Architecture',description:d.description,svg:'logos/'+d.id+'.svg',image:'logos/'+d.id+'.png',lockup:'logos/'+d.id+'-lockup.svg'})),null,2));
}
module.exports={designs,body,svg,exportAll};
if(require.main===module)exportAll();
