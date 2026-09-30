import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeckController,AMIELLE_EDITION} from './deck-library.js';
import {createSession,chooseCard,createRecord,saveRecord,loadRecords,exportRecords,normalizeArtwork} from './core.js';
import {createSpreadSession,selectSpreadCard,revealAll,createSpreadRecord,saveSpreadRecord,loadSpreadRecords,exportSpreadRecords} from './spread-core.js';
import {AMIELLE_READINGS,amiellePreparedMeaning} from './amielle-content.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
const art=p=>({back:p+'/back',cards:Object.fromEntries(Array.from({length:78},(_,id)=>[id,p+'/'+id]))});
const choice={deckId:'space-between',artworkEdition:AMIELLE_EDITION,artworkVariant:'men'};
const notes={meaning:'Meaning',prompt:'Question?',practice:'Reflect'};
test('couple preference affects new draws; changing it never replaces legacy or saved artwork',()=>{
 const original=art('olivia'),legacy=art('legacy'),edition={...art('v1'),variants:{men:{6:'men/6'},women:{6:'women/6'}}},storage=memory();
 const d=createDeckController({original,collections:{'space-between':legacy,[AMIELLE_EDITION]:edition},storage});d.select('space-between');d.selectArtwork('men');const frozen=d.getChoice();assert.deepEqual(frozen,choice);assert.equal(d.assets.forRecord(frozen).cards[6],'men/6');d.selectArtwork('women');assert.equal(d.get('space-between').cards[6],'women/6');assert.equal(d.assets.forRecord(frozen).cards[6],'men/6');assert.equal(d.assets.forRecord({deckId:'space-between'}).cards[6],'legacy/6');d.use(frozen);assert.equal(d.assets.cards[6],'men/6');
 const next=createDeckController({original,collections:{'space-between':legacy,[AMIELLE_EDITION]:edition},storage});assert.equal(next.getArtworkChoice(),'women');assert.equal(next.getSelectedId(),'space-between');
});
test('single artwork edition survives draw, save, note edit, reload and export; cannot be rewritten',()=>{
 const session=chooseCard(createSession(choice,[6],()=>0),0);const record=createRecord(session,{number:6,name:'The Lovers'},notes);const storage=memory();saveRecord(storage,record);saveRecord(storage,{...record,note:'Later'});const loaded=loadRecords(storage)[0];assert.equal(loaded.artworkVariant,'men');assert.equal(JSON.parse(exportRecords([loaded])).records[0].artworkEdition,AMIELLE_EDITION);assert.throws(()=>saveRecord(storage,{...record,artworkVariant:'women'}));assert.throws(()=>normalizeArtwork({...choice,deckId:'olivia'}));assert.throws(()=>normalizeArtwork({...choice,artworkVariant:undefined}));
});
test('spread artwork edition persists across choices, reveal, journal and export',()=>{
 const definition={id:'clarity3',count:3,name:'Clarity',positions:['situation','complication','next-step'].map(id=>({id,label:id}))};let s=createSpreadSession({...choice,spreadId:definition.id,count:3},[6,9,11],()=>0);for(let i=0;i<3;i++)s=selectSpreadCard(s,i);s=revealAll(s);const r=createSpreadRecord(s,definition,{cards:s.cardIds.map((cardId,i)=>({...notes,cardId,positionId:definition.positions[i].id,label:definition.positions[i].label})),synthesis:{paragraphs:['Together'],prompt:'What now?'}});const storage=memory();saveSpreadRecord(storage,r);const loaded=loadSpreadRecords(storage)[0];assert.equal(loaded.artworkVariant,'men');assert.equal(JSON.parse(exportSpreadRecords([loaded])).records[0].artworkEdition,AMIELLE_EDITION);assert.throws(()=>saveSpreadRecord(storage,{...r,artworkVariant:'women'}));
});
test('all 78 new-edition cards have bilingual upright and reversed readings; legacy Minors retain fallback',()=>{
 assert.deepEqual(AMIELLE_READINGS.map(c=>c.id),Array.from({length:78},(_,i)=>i));
 for(const c of AMIELLE_READINGS)for(const l of ['en','uk']){const upright=amiellePreparedMeaning(c.id,false,l),reverse=amiellePreparedMeaning(c.id,true,l);assert.ok(upright.meaning.length>100);assert.ok(reverse.meaning.length>100);assert.notEqual(upright.meaning,reverse.meaning);assert.ok(upright.prompt.length>10);}
 assert.equal(amiellePreparedMeaning(22,false,'en','amielle-relationships-v1'),null);
 assert.ok(amiellePreparedMeaning(25,false,'uk','amielle-relationships-v1'));
});

test('completing the deck preserves legacy saved Minor images and selects new art only for new draws',()=>{
 const original=art('olivia'),legacy=art('original-minors'),v1=art('saved-v1'),v2=art('complete-v2');
 const d=createDeckController({original,collections:{'space-between':legacy,'amielle-relationships-v1':v1,[AMIELLE_EDITION]:v2},storage:memory()});
 d.select('space-between');
 assert.equal(d.getChoice().artworkEdition,AMIELLE_EDITION);
 assert.equal(d.assets.forRecord({deckId:'space-between',artworkEdition:'amielle-relationships-v1',artworkVariant:'original'}).cards[22],'saved-v1/22');
 assert.equal(d.assets.forRecord({...d.getChoice()}).cards[22],'complete-v2/22');
 assert.equal(d.assets.forRecord({deckId:'space-between'}).cards[22],'original-minors/22');
});
