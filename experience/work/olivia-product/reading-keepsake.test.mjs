import test from 'node:test';
import assert from 'node:assert/strict';
import {KEEPSAKE_STORAGE_KEY,KEEPSAKE_LIMIT,normalizeKeepsakeText,readingSentenceChoices,loadReadingKeepsakes,saveReadingKeepsake,removeReadingKeepsake,restoreReadingKeepsakes,validateReadingKeepsakes,wrapKeepsakeText} from './reading-keepsake.js';
const storage=()=>{const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),map};};
const record={id:'reading-1',deckId:'space-between',cardId:37,cardName:'Two of Cups',question:'How can I make room for a difficult conversation?',guidance:{synthesis:'Listen before deciding what to say.'}};
const first=new Date('2026-09-28T12:00:00.000Z'),later=new Date('2026-09-28T13:00:00.000Z');
test('a kept sentence reloads with its actual reading, question, deck and card without saving the reading',()=>{
 const s=storage(),before=structuredClone(record),entry=saveReadingKeepsake(s,{record,text:'  Listen\n before deciding what to say. ',now:first});
 assert.deepEqual(loadReadingKeepsakes(s),[entry]);assert.equal(entry.readingId,record.id);assert.equal(entry.question,record.question);assert.equal(entry.deckId,'space-between');assert.equal(entry.cardId,37);assert.equal(entry.text,'Listen before deciding what to say.');assert.deepEqual(record,before);assert.deepEqual([...s.map.keys()],[KEEPSAKE_STORAGE_KEY]);assert.equal(entry.guidance,undefined);
});
test('edits replace only the same reading and preserve its first-kept date',()=>{
 const s=storage();saveReadingKeepsake(s,{record,text:'Make a little room.',now:first});saveReadingKeepsake(s,{record:{...record,id:'reading-2'},text:'A second reading.',now:first});
 const edited=saveReadingKeepsake(s,{record,text:'Залиште трохи простору.',locale:'uk',now:later});assert.equal(loadReadingKeepsakes(s).length,2);assert.equal(edited.createdAt,first.toISOString());assert.equal(edited.updatedAt,later.toISOString());assert.equal(edited.locale,'uk');
 removeReadingKeepsake(s,record);assert.deepEqual(loadReadingKeepsakes(s).map(entry=>entry.readingId),['reading-2']);
});
test('identical reading IDs do not cross card or deck identities',()=>{
 const s=storage();for(const r of [record,{...record,deckId:'olivia'},{...record,cardId:6}])saveReadingKeepsake(s,{record:r,text:'The words you chose.',now:first});
 assert.equal(loadReadingKeepsakes(s).length,3);removeReadingKeepsake(s,record);assert.equal(loadReadingKeepsakes(s).length,2);
});
test('full storage is explicit and never silently discards older words; edits and removal still work',()=>{
 const s=storage();for(let i=0;i<KEEPSAKE_LIMIT;i++)saveReadingKeepsake(s,{record:{...record,id:String(i)},text:'The words you chose.',now:first});
 const before=s.map.get(KEEPSAKE_STORAGE_KEY);assert.throws(()=>saveReadingKeepsake(s,{record,text:'One more thought.',now:first}),{code:'STORAGE_LIMIT'});assert.equal(s.map.get(KEEPSAKE_STORAGE_KEY),before);
 saveReadingKeepsake(s,{record:{...record,id:'0'},text:'An edited thought.',now:later});assert.equal(loadReadingKeepsakes(s).length,KEEPSAKE_LIMIT);removeReadingKeepsake(s,{...record,id:'0'});saveReadingKeepsake(s,{record,text:'One more thought.',now:first});assert.equal(loadReadingKeepsakes(s).length,KEEPSAKE_LIMIT);
});
test('malformed or inaccessible storage is reported without destructive writes',()=>{
 const s=storage();for(const raw of ['{broken',JSON.stringify({version:2,entries:[]}),JSON.stringify({version:1,entries:[{}]})]){s.setItem(KEEPSAKE_STORAGE_KEY,raw);assert.throws(()=>saveReadingKeepsake(s,{record,text:'Keep a thought.',now:first}),{code:'STORAGE_CORRUPT'});assert.equal(s.map.get(KEEPSAKE_STORAGE_KEY),raw);}
 assert.throws(()=>loadReadingKeepsakes({getItem(){throw Error('blocked');}}),{code:'STORAGE'});assert.throws(()=>saveReadingKeepsake({getItem(){return null;},setItem(){throw Error('quota');}},{record,text:'Keep a thought.',now:first}),{code:'STORAGE'});
});
test('invalid text cannot replace a saved sentence and text remains safe as plain text',()=>{
 const s=storage();saveReadingKeepsake(s,{record,text:'Keep a thought.',now:first});const before=s.map.get(KEEPSAKE_STORAGE_KEY);
 for(const text of ['', '   ', 'x'.repeat(241),null])assert.throws(()=>saveReadingKeepsake(s,{record,text,now:first}),{code:'TEXT'});
 assert.equal(s.map.get(KEEPSAKE_STORAGE_KEY),before);assert.equal(normalizeKeepsakeText('  Your\u0000 words\n<are yours>.  '),'Your words <are yours>.');
});
test('suggested words are drawn from the supplied English or Ukrainian reading, never invented',()=>{
 const en='Make space for the conversation. You can listen without deciding immediately.';assert.deepEqual(readingSentenceChoices(en),['Make space for the conversation.','You can listen without deciding immediately.']);
 const uk='Дайте собі час. Ви можете спочатку послухати.';assert.deepEqual(readingSentenceChoices(uk,'uk'),['Дайте собі час.','Ви можете спочатку послухати.']);assert.deepEqual(readingSentenceChoices(null),[]);assert.deepEqual(readingSentenceChoices('# The situation\n**What you can try**\nMake room for an answer.'),['Make room for an answer.']);
 const long='A very long sentence '.repeat(30);const [excerpt]=readingSentenceChoices(long);assert.ok(excerpt.length<=240);assert.ok(long.startsWith(excerpt));
});
test('wallpaper wrapping respects the available width, including unbroken text',()=>{
 const context={measureText:text=>({width:[...text].length*10})};for(const text of ['Make room for a slower answer.','Нехай буде трохи простору.','x'.repeat(240)]){const lines=wrapKeepsakeText(context,text,90);assert.ok(lines.every(line=>context.measureText(line).width<=90));assert.equal(lines.join('').replaceAll(' ',''),text.replaceAll(' ',''));}
});

test('deleting a reading removes every associated private question and undo restores those words',()=>{
 const s=storage();for(const r of [record,{...record,deckId:'olivia'},{...record,id:'other-reading'}])saveReadingKeepsake(s,{record:r,text:'The words you chose.',now:first});
 const snapshot=loadReadingKeepsakes(s).filter(entry=>entry.readingId===record.id);
 removeReadingKeepsake(s,record.id);assert.deepEqual(loadReadingKeepsakes(s).map(entry=>entry.readingId),['other-reading']);
 restoreReadingKeepsakes(s,snapshot);assert.equal(loadReadingKeepsakes(s).length,3);
 saveReadingKeepsake(s,{record,text:'My newer words.',now:later});restoreReadingKeepsakes(s,snapshot);assert.equal(loadReadingKeepsakes(s).find(entry=>entry.deckId==='space-between'&&entry.readingId===record.id).text,'My newer words.');
});
test('backup validation and restore reject duplicates or invalid dates before any write',()=>{
 const s=storage(),entry=saveReadingKeepsake(s,{record,text:'Keep this thought.',now:first}),before=s.map.get(KEEPSAKE_STORAGE_KEY);
 assert.deepEqual(validateReadingKeepsakes([entry]),[entry]);assert.throws(()=>restoreReadingKeepsakes(s,[entry,entry]),{code:'STORAGE_CORRUPT'});assert.throws(()=>restoreReadingKeepsakes(s,[{...entry,updatedAt:'yesterday'}]),{code:'STORAGE_CORRUPT'});assert.equal(s.map.get(KEEPSAKE_STORAGE_KEY),before);
});
