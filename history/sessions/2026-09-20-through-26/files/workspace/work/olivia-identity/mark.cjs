const fs=require('fs');const sharp=require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
// Native Bezier contours: a single bough turning through an open oval.
const stem='M116 329 C70 315 47 270 53 219 C61 158 111 115 165 101 C207 90 237 66 227 43 C255 65 263 102 252 138 C239 181 197 212 192 251 C188 282 207 305 232 311 C197 309 179 285 182 253 C187 208 232 175 243 135 C253 98 241 72 230 62 C227 84 202 98 167 108 C112 124 71 163 63 219 C56 266 78 309 116 329 Z';
const leaves=[
'M110 132 C92 115 80 84 82 58 C101 75 115 106 110 132 Z',
'M158 108 C151 87 159 58 178 38 C180 63 173 91 158 108 Z',
'M243 143 C252 119 275 103 297 100 C285 120 265 138 243 143 Z',
'M195 222 C208 206 233 197 256 200 C241 216 216 225 195 222 Z',
'M187 274 C165 269 146 248 137 225 C162 233 183 250 187 274 Z'
];
const twigs=['M131 118 C122 110 120 98 122 87 L123 87 C123 100 126 109 133 117 Z','M208 304 C227 304 238 295 244 284 L245 284 C239 299 225 307 211 307 Z'];
const olives=['M119 63 C126 59 131 69 129 78 C127 88 122 95 117 92 C111 88 111 72 119 63 Z','M251 262 C257 263 258 274 253 283 C249 291 243 296 239 291 C235 286 242 261 251 262 Z'];
function paths(color='#122936',fruit=color){return `<g fill="${color}"><path d="${stem}"/>${leaves.map(d=>`<path d="${d}"/>`).join('')}${twigs.map(d=>`<path d="${d}"/>`).join('')}</g><g fill="${fruit}">${olives.map(d=>`<path d="${d}"/>`).join('')}</g>`;}
function svg(color='#122936',bg='',fruit=color){return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="400" viewBox="0 0 360 400" role="img" aria-label="Olivia Arcana olive seal"><title>Olivia Arcana — The Open Olive</title>${bg?`<rect width="360" height="400" fill="${bg}"/>`:''}<g transform="translate(2 16)">${paths(color,fruit)}</g></svg>`}
module.exports={stem,leaves,twigs,olives,paths,svg};
if(require.main===module){(async()=>{const base='outputs/olivia-identity/';fs.writeFileSync(base+'symbol-dark.svg',svg());fs.writeFileSync(base+'symbol-light.svg',svg('#eee7d7'));fs.writeFileSync(base+'symbol-color.svg',svg('#15323f','','#af8d54'));fs.writeFileSync(base+'symbol-guide.svg',svg('#112d3c','#ffffff'));await sharp(Buffer.from(svg('#112d3c','#ffffff'))).resize(1080,1200).png().toFile(base+'symbol-guide.png');await sharp(Buffer.from(svg('#112d3c','#f4f0e7'))).resize(540,600).png().toFile('work/olivia-identity/mark-preview.png')})();}
