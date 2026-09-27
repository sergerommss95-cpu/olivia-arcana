const fs = require('fs');
const path = require('path');
const sharp = require('/Users/macbookpro/olivia-arcana/website/node_modules/sharp');
const opentype = require('/Users/macbookpro/olivia-arcana/website/node_modules/opentype.js');

const OUT = 'outputs/olivia-threshold-atlas/logos';
const WORK = 'work/threshold-atlas/veils';
const INK = '#112d3c';
const PAPER = '#f2ede3';
const fontBuffer = fs.readFileSync('work/olivia-identity/CormorantGaramond-Medium.ttf');
const font = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.length));

// Each study is drawn as closed, tapered contours. No strokes, filters, masks,
// textures, icon-library primitives, or live lettering enter the logo masters.
const studies = [
  {
    id: 'L09', name: 'The Parting',
    description: 'Two tapering veil edges describe a threshold without an architectural frame.',
    paths: [
      'M 280 103 C 265 171 245 233 222 291 C 192 367 166 424 130 474 C 199 424 237 344 254 269 C 269 203 274 151 280 103 Z',
      'M 320 103 C 326 166 348 234 374 294 C 406 369 438 432 472 474 C 405 433 365 361 346 287 C 329 220 324 160 320 103 Z',
      'M 261 178 C 239 236 213 291 188 327 C 219 306 244 252 261 178 Z',
      'M 339 178 C 359 235 390 291 414 327 C 385 308 356 252 339 178 Z'
    ]
  },
  {
    id: 'L10', name: 'Counterturn',
    description: 'Opposed curved ribbons hold a diagonal opening in a reversible, continuous movement.',
    paths: [
      'M 376 116 C 242 142 169 254 184 363 C 190 397 201 422 224 444 C 202 387 208 329 236 265 C 266 200 315 153 376 116 Z',
      'M 224 484 C 358 458 431 346 416 237 C 410 203 399 178 376 156 C 398 213 392 271 364 335 C 334 400 285 447 224 484 Z'
    ]
  },
  {
    id: 'L11', name: 'Silk A',
    description: 'A tapered Arcana initial with a suspended, softly turning silk crossbar.',
    paths: [
      'M 301 104 C 282 191 236 354 156 484 C 183 478 204 458 220 430 C 260 358 294 253 313 163 Z',
      'M 301 104 C 321 196 361 344 437 484 C 412 480 393 465 380 439 C 346 360 317 252 293 163 Z',
      'M 230 355 C 268 376 320 365 364 332 C 340 368 289 397 217 383 C 225 375 229 365 230 355 Z'
    ]
  },
  {
    id: 'L12', name: 'Enfolded',
    description: 'An open Olivia oval, drawn as an outer veil and a quieter inner return.',
    paths: [
      'M 352 111 C 247 77 158 176 151 298 C 143 428 224 514 328 487 C 413 465 458 356 438 249 C 459 360 396 449 324 463 C 240 480 184 405 186 305 C 188 206 253 124 352 111 Z',
      'M 370 119 C 429 184 420 262 383 328 C 348 391 328 431 338 454 C 309 425 323 376 357 313 C 398 237 406 179 370 119 Z'
    ]
  },
  {
    id: 'L13', name: 'Threefold',
    description: 'Three independent silk folds open at different rhythms around a vertical passage.',
    paths: [
      'M 240 116 C 165 212 157 361 229 479 C 191 363 203 226 240 116 Z',
      'M 293 104 C 270 182 286 224 310 281 C 345 364 315 436 254 491 C 329 450 366 375 338 295 C 315 230 280 174 293 104 Z',
      'M 345 123 C 384 233 390 350 351 479 C 423 360 425 219 345 123 Z'
    ]
  },
  {
    id: 'L14', name: 'The Unfolding',
    description: 'A diagonal fold between two quiet upright contours opens an asymmetric passage.',
    paths: [
      'M 235 119 C 181 209 170 360 196 475 C 222 379 210 239 235 119 Z',
      'M 365 125 C 396 245 373 370 404 479 C 430 359 422 218 365 125 Z',
      'M 248 124 C 231 223 266 290 313 351 C 352 401 383 435 404 479 C 390 411 361 367 326 323 C 272 257 247 206 248 124 Z'
    ]
  },
  {
    id: 'L15', name: 'Held Open',
    description: 'A wide Olivia oval gathered at one edge, with a fine suspended return inside the opening.',
    paths: [
      'M 431 191 C 337 136 185 160 136 267 C 94 359 181 441 304 443 C 385 444 454 398 476 341 C 421 404 359 422 298 414 C 219 405 165 354 168 281 C 172 207 242 173 314 174 C 360 175 398 182 431 191 Z',
      'M 434 193 C 424 249 391 277 337 286 C 393 285 433 264 452 232 C 439 296 432 354 444 382 C 455 324 475 251 434 193 Z'
    ]
  },
  {
    id: 'L16', name: 'The Inner Room',
    description: 'Four folded contours gather around a slender central aperture; a threshold seen from within.',
    paths: [0, 90, 180, 270].map(angle => ({
      d: 'M 284 128 C 355 131 424 195 444 280 C 425 245 397 225 363 218 C 347 180 320 148 284 128 Z',
      transform: `translate(300 300) scale(.86 1.1) rotate(${angle}) translate(-300 -300)`
    }))
  }
];

function lettering(text, size, tracking) {
  const glyphs = font.stringToGlyphs(text), s = size / font.unitsPerEm;
  let x = 0, paths = [];
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    paths.push(g.getPath(x, 0, size).toPathData(3));
    x += g.advanceWidth * s;
    if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * s + tracking;
  }
  return { d: paths.join(' '), width: x };
}
const olivia = lettering('OLIVIA', 107, 8.7);
const arcana = lettering('ARCANA', 32, 15.8);
const paths = study => study.paths.map(p => typeof p === 'string' ? `<path d="${p}"/>` : `<path transform="${p.transform}" d="${p.d}"/>`).join('');
function svg(study, bg = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-labelledby="title desc"><title id="title">${study.id} — ${study.name}</title><desc id="desc">${study.description} Original filled Bézier logo study.</desc>${bg ? `<rect width="600" height="600" fill="${bg}"/>` : ''}<g fill="${INK}">${paths(study)}</g></svg>`;
}
function lockup(study) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-labelledby="title desc"><title id="title">Olivia Arcana — ${study.name}</title><desc id="desc">${study.description} Native vector mark and outlined Cormorant Garamond lettering.</desc><g fill="${INK}"><g transform="translate(130 2) scale(.9)">${paths(study)}</g><path aria-label="OLIVIA" transform="translate(${(400 - olivia.width / 2).toFixed(3)} 611)" d="${olivia.d}"/><path aria-label="ARCANA" transform="translate(${(400 - arcana.width / 2).toFixed(3)} 675)" d="${arcana.d}"/></g></svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(WORK, { recursive: true });
  const metadata = [], qa = [];
  for (const study of studies) {
    const master = svg(study), preview = svg(study, PAPER), type = lockup(study);
    fs.writeFileSync(path.join(OUT, `${study.id}.svg`), master);
    fs.writeFileSync(path.join(OUT, `${study.id}-lockup.svg`), type);
    fs.writeFileSync(path.join(WORK, `${study.id}-paths.json`), JSON.stringify(study, null, 2));
    await sharp(Buffer.from(preview)).resize(800, 800).png().toFile(path.join(OUT, `${study.id}.png`));
    const lp = type.replace('<g fill=', `<rect width="800" height="800" fill="${PAPER}"/><g fill=`);
    await sharp(Buffer.from(lp)).png().toFile(path.join(WORK, `${study.id}-lockup.png`));
    const { data, info } = await sharp(Buffer.from(master)).resize(600, 600).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let minX = 600, minY = 600, maxX = -1, maxY = -1, ink = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 24) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); ink++;
      }
    }
    qa.push({ id: study.id, bounds: [minX, minY, maxX, maxY], fillFraction: +(ink / 360000).toFixed(4), clipping: minX < 12 || minY < 12 || maxX > 588 || maxY > 588, paths: study.paths.length });
    metadata.push({ id: study.id, name: study.name, family: 'Veils & folds', description: study.description, svg: `${study.id}.svg`, image: `${study.id}.png`, lockup: `${study.id}-lockup.svg` });
  }
  fs.writeFileSync(path.join(OUT, 'veils.json'), JSON.stringify(metadata, null, 2));
  fs.writeFileSync(path.join(WORK, 'qa.json'), JSON.stringify(qa, null, 2));
  const tileW = 360, tileH = 390;
  const composite = [];
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const tile = await sharp(path.join(OUT, `${study.id}.png`)).resize(tileW, tileW).png().toBuffer();
    composite.push({ input: tile, left: (i % 4) * tileW, top: Math.floor(i / 4) * tileH });
    const label = `<svg width="360" height="30"><rect width="360" height="30" fill="${PAPER}"/><text x="180" y="20" text-anchor="middle" font-family="Georgia" font-size="17" fill="${INK}">${study.id} · ${study.name}</text></svg>`;
    composite.push({ input: Buffer.from(label), left: (i % 4) * tileW, top: Math.floor(i / 4) * tileH + tileW });
  }
  await sharp({ create: { width: tileW * 4, height: tileH * 2, channels: 4, background: PAPER } }).composite(composite).png().toFile(path.join(WORK, 'contact-sheet.png'));
  console.log(JSON.stringify({ written: studies.length, qa }, null, 2));
})();
