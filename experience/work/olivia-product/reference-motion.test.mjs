import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source=new URL('../../outputs/olivia-approved-motion-2026-09-24.html',import.meta.url);
const reference=readFileSync(source,'utf8');
const hero=readFileSync(new URL('./hero.js',import.meta.url),'utf8');
const between=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
test('card paths, camera, lighting, geometry and materials remain the selected reference',()=>{
 assert.equal(createHash('sha256').update(reference).digest('hex'),'100608f7d72a8e94f021983b47ab4d601ef1e3ee4fe6b1a697685380de0a2a12');
 assert.equal(between(hero,'function mul(','async function load('),between(reference,'function mul(','async function load('));
 assert.equal(between(hero,'function sceneFrame(','function draw('),between(reference,'function sceneFrame(','function draw('));
 assert.match(hero,/const JOURNEY_SECONDS=96;/);
 assert.equal(between(hero,' // Exact critically damped response:', 'function onScroll('),between(reference,' // Exact critically damped response:', 'function onScroll('));
});
test('the original card textures are used without substitution',()=>{
 const back=JSON.parse(reference.match(/const BACK_DATA=("[^"]+")/)[1]);
 assert.deepEqual(Buffer.from(back.split(',')[1],'base64'),readFileSync(new URL('../../outputs/olivia-card-back.webp',import.meta.url)));
 const detail=JSON.parse(reference.match(/const DETAIL_DATA=(\{[^}]+\});/)[1]);
 const dir=new URL('../hero-v12/assets/public/cards-portal/',import.meta.url);
 for(const [id,data] of Object.entries(detail)){
  const filename=readdirSync(dir).find(name=>name.startsWith(String(id).padStart(2,'0')+'_'));
  assert.deepEqual(Buffer.from(data.split(',')[1],'base64'),readFileSync(new URL(filename,dir)));
 }
});
test('homepage playback stays on the homepage',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const build=readFileSync(new URL('./build.py',import.meta.url),'utf8');
 assert.doesNotMatch(app,/location\.assign\(reference\)/);
 assert.doesNotMatch(build,/data-reference-url=/);
 assert.doesNotMatch(hero,/if\(!hash\.has\('p'\)\)freezeTime=true/);
});
