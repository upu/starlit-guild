import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {storyArt,storyArtAt} from '../lib/story-art.ts';
import {stories,availableStories} from '../lib/stories.ts';
import {initialState,act} from '../lib/game.ts';

test('every story illustration exists with its declared dimensions and a valid reveal point',async()=>{
 for(const [id,art] of Object.entries(storyArt)){
  const scene=stories.find(st=>st.id===id);
  assert.ok(scene,id);
  assert.ok(art.revealAtLine>=0&&art.revealAtLine<scene.lines.length,id);
  for(let line=0;line<scene.lines.length;line++){
   assert.equal(storyArtAt(id,line),line>=art.revealAtLine?art:undefined,`${id}: line ${line}`);
  }
  assert.equal(storyArtAt(id,Infinity),art,`${id}: available for the read-story gallery`);
  assert.ok(art.alt.trim().length>0,id);
  assert.match(art.src,/^\/stories\/[a-z-]+\.png$/);
  const bytes=await readFile(new URL('../public'+art.src,import.meta.url));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',id);
  assert.equal(bytes.readUInt32BE(16),art.width,id);
  assert.equal(bytes.readUInt32BE(20),art.height,id);
 }
});

test('the moss illustration waits until the caretaker has allowed the sample and the container glows',()=>{
 const scene=stories.find(st=>st.id==='tower-road-return'),art=storyArt[scene.id];
 const permission=scene.lines.findIndex(line=>line.text.includes('ひとつまみで足りる'));
 const glow=scene.lines.findIndex(line=>line.text.includes('入れ物の中で柔らかく光った'));
 assert.ok(permission>=0&&permission<glow);assert.equal(art.revealAtLine,glow);
 assert.equal(storyArtAt(scene.id,glow-1),undefined);assert.equal(storyArtAt(scene.id,glow),art);
});

test('forest comparison art waits for Aria to lift both samples toward her face',()=>{
 const scene=stories.find(st=>st.id==='forest-wetland-return'),art=storyArt[scene.id];
 const comparison=scene.lines.findIndex(line=>line.text.includes('顔の近くまで持ち上げた'));
 assert.equal(art.revealAtLine,comparison);assert.equal(storyArtAt(scene.id,comparison-1),undefined);
 assert.equal(storyArtAt(scene.id,comparison),art);
});

test('restoration art waits until the pair watches the flowing water and the tower begins to glow',()=>{
 const scene=stories.find(st=>st.id==='tower-restoration-return'),art=storyArt[scene.id];
 const flowing=scene.lines.findIndex(line=>line.text.includes('アリアが流れ始めた水を指さし'));
 assert.equal(art.revealAtLine,flowing);assert.equal(storyArtAt(scene.id,flowing-1),undefined);
 assert.equal(storyArtAt(scene.id,flowing),art);
});

test('first departure has its illustration, while the fireside waits until they sit together',()=>{
 const state=act(initialState(1000),{type:'start',id:'herbs'},1000);
 assert.ok(availableStories(state).some(st=>st.id==='herbs-departure'));
 assert.ok(storyArtAt('herbs-departure',0));
 assert.equal(storyArtAt('pilgrim-return',0),undefined);
 assert.equal(storyArtAt('pilgrim-return',3),undefined);
 assert.ok(storyArtAt('pilgrim-return',6));
 assert.ok(storyArtAt('pilgrim-return',9));
 assert.equal(storyArtAt('pilgrim-return',3),undefined);
 assert.equal(storyArtAt('camp-seat',0),undefined);
 assert.equal(storyArtAt('unknown-story',0),undefined);
});
