import {test} from 'node:test';
import assert from 'node:assert/strict';
import {act,settle,initialState,heroes,quests,heroSkills} from '../lib/game.ts';
import {stories,availableStories,campStories,journeyBanter} from '../lib/stories.ts';
import {originalCharacters} from '../lib/original-characters.ts';
import {characterEncounters} from '../lib/character-encounters.ts';
import {recruitments} from '../lib/recruitment.ts';
import {parseBundle} from '../lib/save-format.ts';
const restore=state=>{const id=crypto.randomUUID();return parseBundle({format:4,deviceId:crypto.randomUUID(),active:id,profiles:[{id,name:'三人との出会い',test:false,state}],serial:1,sound:false,cloudAt:0,legacyImported:true}).profiles[0].state;};

test('each guest scene waits for its real companions, facilities and prior quest; reads survive reload',()=>{
 for(const scene of characterEncounters){
  const s=initialState(1000);s.owned=[...new Set([...s.owned,...scene.requiresHeroes])];s.town=scene.town;
  for(const id of scene.requiresQuests||[])s.done[id]=1;
  const visible=state=>availableStories(state).some(st=>st.id===scene.id);
  assert.ok(visible(s),scene.id);
  for(const id of scene.requiresHeroes){const missing=structuredClone(s);missing.owned=missing.owned.filter(h=>h!==id);assert.ok(!visible(missing),scene.id+': '+id);}
  for(const id of scene.requiresQuests||[]){const missing=structuredClone(s);delete missing.done[id];assert.ok(!visible(missing),scene.id+': '+id);}
  assert.ok(!visible({...s,town:scene.town-1}));
  const read=restore(act(s,{type:'readStory',id:scene.id},1000));assert.ok(read.story.read.includes(scene.id));assert.equal(read.gold,s.gold);
  assert.ok(!read.owned.includes('merrill'));assert.ok(!read.owned.includes('pumpety'));
 }
});

test('guest conversations use their own present cast; memories remain when that cast departs',()=>{
 let s=initialState(1000);s.owned.push('chacha','mira');s.town=1;s.squads[0].members=['aria','leon'];
 s=act(s,{type:'start',id:'herbs'},1000);
 assert.ok(campStories(s).some(st=>st.id==='camp-chacha-mira'),'tea does not require the childhood friends at home');
 s.squads.push({id:'party-2',name:'お茶の隊',members:['chacha','mira'],repeat:true,run:null});
 s=act(s,{type:'start',id:'herbs',squad:'party-2'},1000);
 assert.ok(!campStories(s).some(st=>st.id==='camp-chacha-mira'));
 assert.ok(availableStories(s).some(st=>st.id==='camp-chacha-mira'));
 assert.deepEqual(journeyBanter(s,s.squads[1],1000).map(l=>l.speaker),['chacha','mira']);
});

test('NPC speakers resolve without becoming recruitable heroes; all named speakers exist',()=>{
 const cast=new Set([...heroes,...originalCharacters].map(c=>c.id));
 for(const st of stories)for(const line of st.lines)if(line.speaker)assert.ok(cast.has(line.speaker),st.id+': '+line.speaker);
 for(const id of ['merrill','pumpety']){assert.ok(!heroes.some(h=>h.id===id));assert.ok(!recruitments.some(r=>r.hero===id));}
});

test('Halloween quests gate entry, save active runs and complete without recruiting the opponents',()=>{
 for(const id of ['midnight-snack','puppet-midnight']){
  const q=quests.find(q=>q.id===id);let s=initialState(1000);s.clears=q.unlock-1;
  assert.throws(()=>act(s,{type:'start',id},1000));s.clears=q.unlock;s.gear=15;s.xp={aria:72000,leon:72000};s.squads[0].repeat=false;
  s=act(s,{type:'start',id},1000);s=restore(s);
  assert.ok(availableStories(s).some(st=>st.id===id+'-departure'));
  assert.ok(!availableStories(s).some(st=>st.id===id+'-return'));
  assert.ok(journeyBanter(s,s.squads[0],1000).some(l=>['merrill','pumpety'].includes(l.speaker)));
  s=settle(s,3601000).state;assert.equal(s.done[id],1);assert.deepEqual(s.owned,['aria','leon']);assert.equal(s.squads[0].run,null);
  assert.ok(availableStories(restore(s)).some(st=>st.id===id+'-return'));
 }
});

test('Halloween pair banter stays ahead of Chacha generic expedition banter',()=>{
 const s=initialState(1000);s.owned.push('chacha');s.clears=10;s.squads[0].members=['aria','leon','chacha'];
 const started=act(s,{type:'start',id:'midnight-snack'},1000),speakers=journeyBanter(started,started.squads[0],1000).map(line=>line.speaker);
 assert.ok(speakers.includes('merrill'));assert.ok(!speakers.includes('chacha'));
});

test('nine heroes and all seven prepared arcs roundtrip, while old rosters stay unchanged',()=>{
 const old=initialState(1000);assert.deepEqual(restore(old).owned,['aria','leon']);
 const full=initialState(1000);full.owned=heroes.map(h=>h.id);full.recruitment.prepared=recruitments.map(r=>r.hero);
 assert.equal(restore(full).owned.length,9);assert.equal(restore(full).recruitment.prepared.length,7);
 full.owned.push('merrill');assert.throws(()=>restore(full));
});

test('Chacha has real heavy melee strikes and her tea scene only plays when she is home',()=>{
 let s=initialState(1000);s.owned.push('chacha');s.clears=6;s.squads[0].members=['chacha'];s=act(s,{type:'start',id:'slime'},1000);
 let normal,special;for(let i=0;i<1000&&!special;i++){s=settle(s,s.squads[0].run.nextAt).state;const events=s.squads[0].run.events;normal??=events.find(e=>e.hero==='chacha'&&e.kind==='hit');special=events.find(e=>e.hero==='chacha'&&e.kind==='skill');}
 assert.equal(heroSkills.chacha.style,'melee');assert.ok(Math.abs(special.amount-normal.amount*2)<=1,'double power before integer rounding');assert.doesNotThrow(()=>restore(s));
 s.town=1;s.story={departed:['herbs'],completed:['herbs'],read:[]};assert.ok(!campStories(s).some(st=>st.id==='camp-chacha-tea'));
 s=act(s,{type:'stop'},s.updatedAt);assert.ok(campStories(s).some(st=>st.id==='camp-chacha-tea'));
 s.owned=s.owned.filter(id=>id!=='chacha');assert.ok(!availableStories(s).some(st=>st.id==='camp-chacha-tea'));
});
