import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {initialPrologueState,initialState,act,settle,availableQuests,allQuests,encounter} from '../lib/game.ts';
import {TRADE_QUEST,RETURN_QUEST,TOWN_QUEST,prologueStages,stageEndingPending,restingQuest} from '../lib/prologue.ts';
import {availableStories,journeyBanter} from '../lib/stories.ts';
import {parseBundle} from '../lib/save-format.ts';
import {adventureFrame} from '../lib/adventure-presentation.ts';
import {heroAnimation} from '../lib/hero-animation.ts';
import {nextGoal,journeyNotice} from '../lib/journey.ts';

const start=(s,id)=>act(s,{type:'start',id,readDeparture:true,value:true},s.updatedAt);
const finish=s=>settle(s,s.updatedAt+13*3600000).state;
const read=(s,id)=>act(s,{type:'readStory',id:id+'-return'},s.updatedAt);
function roundtrip(state){const id=crypto.randomUUID();return parseBundle(JSON.parse(JSON.stringify({format:4,deviceId:id,active:id,profiles:[{id,name:'段階確認',test:true,state}],serial:1,sound:false,cloudAt:0,legacyImported:true}))).profiles[0].state;}

test('1-1 → 1-2 → 1-3 requires each ending, stops offline and roundtrips without extra rewards',()=>{
 let s=initialPrologueState(1000);
 for(const [i,stage] of prologueStages.entries()){
  assert.equal(nextGoal(s).questId,stage.quest);
  assert.deepEqual(availableQuests(s).map(q=>q.id),prologueStages.slice(0,i+1).map(st=>st.quest));
  for(const locked of prologueStages.slice(i+1))assert.throws(()=>start(s,locked.quest),/まだ/);
  const before=start(s,stage.quest);s=roundtrip(finish(roundtrip(before)));
  assert.equal(s.done[stage.quest],1);assert.equal(s.squads[0].run,null);
  assert.equal(stageEndingPending(s),stage.quest);assert.equal(journeyNotice(before,s).title,stage.arrival);
  assert.throws(()=>start(s,stage.quest),/物語/);
  assert.ok(availableStories(s).some(st=>st.id===stage.quest+'-return'));
  assert.deepEqual(settle(s,s.updatedAt).state,s);
  const snapshot=structuredClone(s);s=roundtrip(read(s,stage.quest));
  assert.equal(s.gold,snapshot.gold);assert.equal(s.clears,snapshot.clears);
  assert.deepEqual(read(s,stage.quest),s);assert.equal(stageEndingPending(s),undefined);
 }
 assert.deepEqual(s.owned,['aria','leon']);assert.equal(s.town,0);assert.equal(s.prologue,true);
 assert.equal(availableStories(s).length,6);
 assert.throws(()=>start(s,'herbs'));assert.throws(()=>act(s,{type:'build'},s.updatedAt));
 const replay=finish(start(s,RETURN_QUEST));assert.equal(replay.done[RETURN_QUEST],2);
 assert.equal(stageEndingPending(replay),undefined);assert.deepEqual(replay.story,s.story);
});

test('interruption and reload preserve progress without unlocking later stages',()=>{
 for(const id of [RETURN_QUEST,TOWN_QUEST]){
  let s=read(finish(start(initialPrologueState(1000),TRADE_QUEST)),TRADE_QUEST);
  if(id===TOWN_QUEST)s=read(finish(start(s,RETURN_QUEST)),RETURN_QUEST);
  s=start(s,id);while(s.squads[0].run.node<3)s=settle(s,s.squads[0].run.nextAt).state;
  const saved=roundtrip(s),resumed=finish(saved);assert.equal(resumed.done[id],1);
  const stopped=roundtrip(act(saved,{type:'stop'},saved.updatedAt));
  assert.equal(stopped.gold,saved.gold);assert.equal(stopped.done[id],undefined);
  assert.equal(stageEndingPending(stopped),undefined);assert.throws(()=>read(stopped,id));
  assert.ok(start(stopped,id).squads[0].run);
 }
});

test('existing prologue trades unlock the return route; established saves retain their features',()=>{
 const old=read(finish(start(initialPrologueState(1000),TRADE_QUEST)),TRADE_QUEST);
 old.done[TRADE_QUEST]=30;old.clears=30;old.gold=9876;
 const saved=roundtrip(old);assert.deepEqual(saved,old);
 assert.equal(nextGoal(saved).questId,RETURN_QUEST);assert.equal(start(saved,RETURN_QUEST).gold,9876);
 const legacy=initialState(1000);legacy.clears=60;legacy.done.herbs=60;
 const restored=roundtrip(legacy);assert.deepEqual(restored,legacy);
 assert.ok(availableQuests(restored).some(q=>q.id==='dragon'));
 assert.ok(!availableQuests(restored).some(q=>q.id===TOWN_QUEST));
 assert.ok(act(restored,{type:'party',members:['aria']},1000));
});

test('idle scenery follows the last actual departure across completion, replay, interruption and reload',()=>{
 let s=initialPrologueState(1000);
 assert.equal(restingQuest(s,s.squads[0]),TRADE_QUEST);
 for(const id of [TRADE_QUEST,RETURN_QUEST,TOWN_QUEST,TRADE_QUEST]){
  s=roundtrip(start(s,id));assert.equal(s.squads[0].lastQuest,id);
  s=roundtrip(read(finish(s),id));assert.equal(restingQuest(s,s.squads[0]),id);
 }
 s=start(s,RETURN_QUEST);s=roundtrip(act(s,{type:'stop'},s.updatedAt));
 assert.equal(restingQuest(s,s.squads[0]),RETURN_QUEST);
 const old=read(finish(start(initialPrologueState(1000),TRADE_QUEST)),TRADE_QUEST);
 delete old.squads[0].lastQuest;
 const restored=roundtrip(old);assert.deepEqual(restored,old);
 assert.equal(restingQuest(restored,restored.squads[0]),TRADE_QUEST);
 const invalid=structuredClone(s);invalid.squads[0].lastQuest='unknown-quest';assert.throws(()=>roundtrip(invalid));
 const oldReplay=start(s,TRADE_QUEST);delete oldReplay.squads[0].lastQuest;
 for(const resumed of [finish(roundtrip(oldReplay)),act(roundtrip(oldReplay),{type:'stop'},oldReplay.updatedAt)]){
  assert.equal(restingQuest(resumed,resumed.squads[0]),TRADE_QUEST);
  assert.equal(roundtrip(resumed).squads[0].lastQuest,TRADE_QUEST);
 }
});

test('evening has more small encounters; town work has cargo, no battles or damage, and suitable scenery',()=>{
 const quest=id=>allQuests.find(q=>q.id===id);
 const battles=id=>Array.from({length:15},(_,n)=>encounter(quest(id),n)).filter(k=>k==='battle').length;
 assert.ok(battles(RETURN_QUEST)>battles(TRADE_QUEST));assert.equal(battles(TOWN_QUEST),0);
 let s=read(finish(start(initialPrologueState(1000),TRADE_QUEST)),TRADE_QUEST);
 for(const id of [RETURN_QUEST,TOWN_QUEST]){
  s=start(s,id);const frame=adventureFrame({squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:id});
  assert.equal(frame.target.asset,'/items/chest.png');assert.equal(frame.background,quest(id).background);
  assert.ok(existsSync(new URL('../public'+frame.background,import.meta.url)));
  while(s.squads[0].run){
   const run=s.squads[0].run;
   assert.ok(journeyBanter(s,s.squads[0],s.updatedAt).every(line=>['aria','leon'].includes(line.speaker)));
   assert.equal(run.detour,null);
   if(id===TOWN_QUEST){
    assert.equal(run.hp,run.maxHp);assert.ok(run.events.every(event=>event.kind!=='hurt'&&!/二連矢|斬撃|攻撃/.test(event.text)));
    const current=adventureFrame({squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:id});
    for(const member of current.members)assert.ok(![4,5,6,7].includes(Number(heroAnimation(member,current,s.updatedAt).frame)),'delivery work never uses weapon attack poses');
   }
   s=settle(s,run.nextAt).state;
  }
  s=read(s,id);
 }
});
