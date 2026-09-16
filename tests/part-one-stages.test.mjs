import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {initialPrologueState,initialState,act,settle,availableQuests,allQuests,encounter} from '../lib/game.ts';
import {TRADE_QUEST,RETURN_QUEST,TOWN_QUEST,TOWER_QUEST,NIGHT_QUEST,WETLAND_QUEST,WATERWAY_QUEST,RESTORATION_QUEST,MOSS_QUEST,prologueStages,stageEndingPending,restingQuest} from '../lib/prologue.ts';
import {availableStories,journeyBanter} from '../lib/stories.ts';
import {parseBundle} from '../lib/save-format.ts';
import {adventureFrame} from '../lib/adventure-presentation.ts';
import {heroAnimation} from '../lib/hero-animation.ts';
import {nextGoal,journeyNotice} from '../lib/journey.ts';

// These tests cover story gates and scenery. Late battles use a trained fixture;
// untrained progression and actual farming are covered in combat.test.mjs.
function start(s,id){
 const prepared=structuredClone(s);if(prologueStages.findIndex(stage=>stage.quest===id)>=6)for(const hero of prepared.owned)prepared.xp[hero]=Math.max(prepared.xp[hero]||0,30*19**2);
 return act(prepared,{type:'start',id,readDeparture:true,value:false},prepared.updatedAt);
}
const finish=s=>settle(s,s.updatedAt+13*3600000).state;
const read=(s,id)=>act(s,{type:'readStory',id:id+'-return'},s.updatedAt);
function roundtrip(state){const id=crypto.randomUUID();return parseBundle(JSON.parse(JSON.stringify({format:4,deviceId:id,active:id,profiles:[{id,name:'段階確認',test:true,state}],serial:1,sound:false,cloudAt:0,legacyImported:true}))).profiles[0].state;}

test('1-1 through 1-9 requires each ending, stops offline and roundtrips without extra rewards',()=>{
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
 assert.equal(availableStories(s).length,18);
 assert.equal(nextGoal(s).questId,'hilltop-picnic');assert.match(nextGoal(s).title,/2-1/);
 assert.throws(()=>start(s,'herbs'));assert.throws(()=>act(s,{type:'build'},s.updatedAt));
 const replay=finish(start(s,RETURN_QUEST));assert.equal(replay.done[RETURN_QUEST],2);
 assert.equal(stageEndingPending(replay),undefined);assert.deepEqual(replay.story,s.story);
});

test('interruption and reload preserve progress without unlocking later stages',()=>{
 for(const {quest:id} of prologueStages.slice(1)){
  let s=initialPrologueState(1000);
  for(const stage of prologueStages.slice(0,prologueStages.findIndex(stage=>stage.quest===id)))s=read(finish(start(s,stage.quest)),stage.quest);
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

test('a saved 1-3 ending unlocks 1-4 only after reading, without changing old resources or history',()=>{
 let s=initialPrologueState(1000);
 for(const id of [TRADE_QUEST,RETURN_QUEST])s=read(finish(start(s,id)),id);
 s=roundtrip(finish(start(s,TOWN_QUEST)));
 assert.ok(!availableQuests(s).some(q=>q.id===TOWER_QUEST));
 assert.throws(()=>start(s,TOWER_QUEST),/まだ/);
 const snapshot=structuredClone(s);s=roundtrip(read(s,TOWN_QUEST));
 for(const key of ['gold','xp','done','herbs','ore','wood','owned','clears'])assert.deepEqual(s[key],snapshot[key]);
 assert.equal(nextGoal(s).questId,TOWER_QUEST);
 assert.ok(!availableQuests(s).some(q=>q.id===NIGHT_QUEST));
 assert.equal(start(s,TOWER_QUEST).squads[0].run.quest,TOWER_QUEST);
});

test('a saved 1-5 ending opens the wetland only after reading and preserves resources',()=>{
 let s=initialPrologueState(1000);
 for(const stage of prologueStages.slice(0,4))s=read(finish(start(s,stage.quest)),stage.quest);
 s=roundtrip(finish(start(s,NIGHT_QUEST)));
 assert.throws(()=>start(s,WETLAND_QUEST),/まだ/);
 assert.ok(!availableQuests(s).some(q=>q.id===WETLAND_QUEST));
 const before=structuredClone(s);s=roundtrip(read(s,NIGHT_QUEST));
 for(const key of ['gold','xp','done','herbs','ore','wood','owned','clears'])assert.deepEqual(s[key],before[key]);
 assert.equal(nextGoal(s).questId,WETLAND_QUEST);
 assert.equal(restingQuest(s,s.squads[0]),NIGHT_QUEST);
 assert.equal(start(s,WETLAND_QUEST).squads[0].run.quest,WETLAND_QUEST);
});

test('wetland observation causes no damage, weapon work or moss harvest rewards',()=>{
 let s=initialPrologueState(1000);
 for(const stage of prologueStages.slice(0,5))s=read(finish(start(s,stage.quest)),stage.quest);
 const herbs=s.herbs,q=allQuests.find(q=>q.id===WETLAND_QUEST);
 s=start(s,WETLAND_QUEST);let worked=false;const nodes=new Set();
 while(s.squads[0].run){
  const run=s.squads[0].run,frame=adventureFrame({squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:WETLAND_QUEST});
  nodes.add(run.node);assert.equal(run.detour,null);
  assert.equal(frame.background,q.background);assert.ok(existsSync(new URL('../public'+frame.background,import.meta.url)));
  assert.equal(frame.target.kind,'gather');assert.match(frame.target.name,/木陰|葉|群落/);
  assert.ok(Object.values(run.health).every(health=>health.hp===health.maxHp));
  assert.ok(run.events.every(event=>event.kind!=='hurt'&&!/二連矢|斬撃|攻撃/.test(event.text)));
  assert.ok(journeyBanter(s,s.squads[0],s.updatedAt).every(line=>['aria','leon'].includes(line.speaker)));
  for(const member of frame.members){
   if(member.hit){worked=true;assert.equal(member.hit.kind,'gather');}
   assert.ok(![4,5,6,7].includes(Number(heroAnimation(member,frame,s.updatedAt).frame)));
  }
  s=settle(s,run.nextAt).state;
 }
 assert.equal(nodes.size,15);assert.ok(worked);assert.equal(s.herbs,herbs);
 s=roundtrip(read(s,WETLAND_QUEST));const before=structuredClone(s);
 assert.deepEqual(read(s,WETLAND_QUEST),before);
 s=finish(start(s,WETLAND_QUEST));assert.equal(s.done[WETLAND_QUEST],2);
 assert.equal(stageEndingPending(s),undefined);assert.equal(s.prologue,true);
 assert.deepEqual(s.owned,['aria','leon']);assert.equal(s.town,0);
});

test('saved 1-6 through 1-8 endings gate the next stage without changing resources or old history',()=>{
 let s=initialPrologueState(1000);
 for(const stage of prologueStages.slice(0,5))s=read(finish(start(s,stage.quest)),stage.quest);
 for(const [previous,next] of [[WETLAND_QUEST,WATERWAY_QUEST],[WATERWAY_QUEST,RESTORATION_QUEST],[RESTORATION_QUEST,MOSS_QUEST]]){
  s=roundtrip(finish(start(s,previous)));assert.throws(()=>start(s,next),/まだ/);
  assert.ok(!availableQuests(s).some(q=>q.id===next));
  const before=structuredClone(s);s=roundtrip(read(s,previous));
  for(const key of ['gold','xp','done','herbs','ore','wood','owned','clears','claimed','receipts'])assert.deepEqual(s[key],before[key]);
  assert.equal(nextGoal(s).questId,next);assert.equal(restingQuest(s,s.squads[0]),previous);
  assert.equal(start(s,next).squads[0].run.quest,next);
 }
});

test('waterway exploration and restoration follow fieldwork order with small battles and matching scenery',()=>{
 let s=initialPrologueState(1000);
 for(const stage of prologueStages.slice(0,6))s=read(finish(start(s,stage.quest)),stage.quest);
 for(const id of [WATERWAY_QUEST,RESTORATION_QUEST,MOSS_QUEST]){
  const q=allQuests.find(q=>q.id===id),herbs=s.herbs,nodes=new Map();let worked=false,battled=false;
  s=start(s,id);
  while(s.squads[0].run){
   const run=s.squads[0].run,frame=adventureFrame({squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:id});
   nodes.set(run.node,frame.target);assert.equal(run.detour,null);
   assert.deepEqual(frame.members.map(m=>m.id),['aria','leon']);assert.equal(q.enemy,8);
   assert.ok(existsSync(new URL('../public'+frame.background,import.meta.url)));
   const drained=id===RESTORATION_QUEST&&run.node>=9;
   assert.equal(frame.background,drained?'/scenery/tower-drainage-open-background.webp':q.background);
   assert.ok(journeyBanter(s,s.squads[0],s.updatedAt).every(line=>['aria','leon'].includes(line.speaker)));
   if(frame.target.kind==='battle')battled=true;
   else{
    for(const member of frame.members){
     if(member.hit){worked=true;assert.equal(member.hit.kind,'gather');}
     assert.ok(![4,5,6,7].includes(Number(heroAnimation(member,frame,s.updatedAt).frame)));
    }
   }
   s=settle(s,run.nextAt).state;
  }
  assert.equal(nodes.size,15);assert.ok(worked);assert.ok(battled);assert.equal(s.herbs,herbs);
  assert.equal([...nodes.values()].filter(n=>n.kind==='battle').length,id===WATERWAY_QUEST?5:id===RESTORATION_QUEST?3:2);
  if(id===RESTORATION_QUEST){
   assert.match(nodes.get(5).name,/水の行き先/);assert.match(nodes.get(8).name,/排水の合図/);
   assert.match(nodes.get(9).name,/流れ出した水/);assert.match(nodes.get(11).name,/補修用の石/);
   assert.ok([...nodes.values()].every(n=>!n.name.includes('苔')));
   assert.equal(nodes.get(14).kind,'escort');assert.match(nodes.get(14).name,/下流まで水/);
   const input={squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:id,restorationComplete:!!s.done[id]};
   assert.equal(adventureFrame(input).background,'/scenery/tower-drainage-open-background.webp');
   const replay=start(read(s,id),id);
   assert.equal(adventureFrame({...input,squad:replay.squads[0]}).background,q.background,'replay begins before drainage');
  }
  if(id===MOSS_QUEST){
   assert.match(nodes.get(7).name,/奥の苔/);assert.match(nodes.get(10).name,/最後の石/);
   assert.equal(nodes.get(14).kind,'escort');assert.match(nodes.get(14).name,/点検口を閉じる/);
   assert.ok([...nodes.values()].slice(7).every(n=>n.kind!=='battle'));
  }
  s=roundtrip(read(s,id));const snapshot=structuredClone(s);assert.deepEqual(read(s,id),snapshot);
 }
 assert.equal(s.prologue,true);assert.deepEqual(s.owned,['aria','leon']);assert.equal(s.town,0);
});

test('tower gathering and night lamp work keep small battles, appropriate assets and noncombat poses',()=>{
 let s=initialPrologueState(1000);
 for(const id of [TRADE_QUEST,RETURN_QUEST,TOWN_QUEST])s=read(finish(start(s,id)),id);
 for(const id of [TOWER_QUEST,NIGHT_QUEST]){
  const q=allQuests.find(q=>q.id===id),kinds=Array.from({length:15},(_,node)=>encounter(q,node));
  assert.equal(kinds.filter(k=>k==='battle').length,5);assert.equal(q.enemy,8);
  assert.equal(kinds.filter(k=>k===(id===TOWER_QUEST?'gather':'escort')).length,10);
  s=start(s,id);let damaged=false,worked=false;
  while(s.squads[0].run){
   const run=s.squads[0].run,frame=adventureFrame({squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:id});
   assert.equal(frame.background,q.background);assert.ok(existsSync(new URL('../public'+frame.background,import.meta.url)));
   assert.deepEqual(frame.members.map(m=>m.id),['aria','leon']);assert.equal(run.detour,null);
   assert.ok(journeyBanter(s,s.squads[0],s.updatedAt).every(line=>['aria','leon'].includes(line.speaker)));
   if(Object.values(run.health).some(health=>health.hp<health.maxHp))damaged=true;
   if(frame.target.kind!=='battle'){
    if(id===NIGHT_QUEST){assert.equal(frame.target.asset,'/items/moss-lamp.png');assert.ok(existsSync(new URL('../public'+frame.target.asset,import.meta.url)));}
    for(const member of frame.members){
     if(member.hit){worked=true;assert.equal(member.hit.kind,'gather');}
     assert.ok(![4,5,6,7].includes(Number(heroAnimation(member,frame,s.updatedAt).frame)));
    }
   }
   s=settle(s,run.nextAt).state;
  }
  assert.ok(worked);assert.ok(damaged,'the moss lamp does not ward off monsters');
  s=read(s,id);
 }
});

test('idle scenery follows the last actual departure across completion, replay, interruption and reload',()=>{
 let s=initialPrologueState(1000);
 assert.equal(restingQuest(s,s.squads[0]),TRADE_QUEST);
 for(const id of [...prologueStages.map(stage=>stage.quest),TRADE_QUEST]){
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
    assert.ok(Object.values(run.health).every(health=>health.hp===health.maxHp));assert.ok(run.events.every(event=>event.kind!=='hurt'&&!/二連矢|斬撃|攻撃/.test(event.text)));
    const current=adventureFrame({squad:s.squads[0],now:s.updatedAt,ready:true,paused:false,startQuest:id});
    for(const member of current.members)assert.ok(![4,5,6,7].includes(Number(heroAnimation(member,current,s.updatedAt).frame)),'delivery work never uses weapon attack poses');
   }
   s=settle(s,run.nextAt).state;
  }
  s=read(s,id);
 }
});
