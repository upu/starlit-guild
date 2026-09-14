import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {initialPrologueState,initialState,act,settle,availableQuests,allQuests,encounter,targetName} from '../lib/game.ts';
import {prologueStages,stageEndingPending} from '../lib/prologue.ts';
import {PICNIC_QUEST,MOON_HERB_QUEST} from '../lib/chapter-two.ts';
import {chapterTwoStories} from '../lib/chapter-two-stories.ts';
import {techniquesUnlocked,equippedTechnique,knowsTechnique,techniqueMultiplier,techniqueDamage} from '../lib/techniques.ts';
import {parseBundle} from '../lib/save-format.ts';
import {nextGoal,journeyNotice} from '../lib/journey.ts';
import {storyArtAt} from '../lib/story-art.ts';
import {journeyBanter,availableStories} from '../lib/stories.ts';
import {adventureFrame} from '../lib/adventure-presentation.ts';
import {heroAnimation} from '../lib/hero-animation.ts';

function firstChapter(){
 const s=initialPrologueState(1000);s.gold=0;s.clears=9;s.xp={aria:30*24**2,leon:30*24**2};
 for(const {quest} of prologueStages){s.done[quest]=1;s.story.departed.push(quest);s.story.completed.push(quest);s.story.read.push(quest+'-departure',quest+'-return');}
 return s;
}
const start=(s,id)=>act(s,{type:'start',id,readDeparture:true,value:true},s.updatedAt);
const finish=s=>settle(s,s.updatedAt+13*3600000).state;
const read=(s,id)=>act(s,{type:'readStory',id:id+'-return'},s.updatedAt);
function unlocked(){return read(finish(start(firstChapter(),PICNIC_QUEST)),PICNIC_QUEST);}
function roundtrip(state){const id=crypto.randomUUID();return parseBundle(JSON.parse(JSON.stringify({format:4,deviceId:id,active:id,profiles:[{id,name:'第二章確認',test:true,state}],serial:1,sound:false,cloudAt:0,legacyImported:true}))).profiles[0].state;}

test('old first-chapter save opens 2-1 without replacement; endings gate 2-2 and stop offline',()=>{
 const old=firstChapter();assert.deepEqual(roundtrip(old),old);assert.equal(nextGoal(old).questId,PICNIC_QUEST);
 assert.throws(()=>start(old,MOON_HERB_QUEST),/まだ/);
 const pending=structuredClone(old);pending.story.read=pending.story.read.filter(id=>id!=='tower-moss-removal-return');assert.throws(()=>start(pending,PICNIC_QUEST),/まだ/);
 const arrived=roundtrip(finish(roundtrip(start(old,PICNIC_QUEST))));assert.equal(arrived.done[PICNIC_QUEST],1);assert.equal(arrived.squads[0].run,null);
 assert.equal(techniquesUnlocked(arrived),false);assert.equal(stageEndingPending(arrived),PICNIC_QUEST);assert.throws(()=>start(arrived,MOON_HERB_QUEST),/まだ|物語/);
 const opened=roundtrip(read(arrived,PICNIC_QUEST));assert.equal(techniquesUnlocked(opened),true);assert.equal(opened.gold,160);
 assert.match(journeyNotice(arrived,opened).title,/技の習得/);assert.equal(nextGoal(opened).questId,MOON_HERB_QUEST);
 const end=roundtrip(finish(roundtrip(start(opened,MOON_HERB_QUEST))));assert.equal(end.done[MOON_HERB_QUEST],1);assert.equal(end.squads[0].run,null);
 assert.deepEqual(end.owned,['aria','leon']);assert.equal(end.town,0);assert.equal(end.prologue,true);assert.equal(end.techniques,undefined);
 const done=read(end,MOON_HERB_QUEST);assert.match(nextGoal(done).title,/2-2まで/);assert.match(nextGoal(done).detail,/準備中/);
 assert.deepEqual(availableQuests(done).slice(-2).map(q=>q.id),[PICNIC_QUEST,MOON_HERB_QUEST]);
 assert.equal(availableStories(done).filter(s=>s.quest===MOON_HERB_QUEST).length,2);
 assert.throws(()=>act(done,{type:'prepareRecruitment',id:'mira'},done.updatedAt));
 const replay=settle(start(done,PICNIC_QUEST),done.updatedAt+600000).state;assert.ok(replay.done[PICNIC_QUEST]>1);assert.ok(replay.squads[0].run);
});

test('picnic has only quiet scenery work, no damage, weapon poses, or herb rewards',()=>{
 const q=allQuests.find(q=>q.id===PICNIC_QUEST);assert.ok(Array.from({length:15},(_,i)=>encounter(q,i)).every(k=>k==='gather'));
 let s=start(firstChapter(),PICNIC_QUEST);const before=s.herbs;
 while(s.squads[0].run){
  s=settle(s,s.squads[0].run.nextAt).state;const run=s.squads[0].run;if(!run)break;
  assert.ok(run.events.every(e=>!['hit','hurt','skill','burst'].includes(e.kind)));
  assert.ok(Object.values(run.health).every(h=>h.hp===h.maxHp));
  const frame=adventureFrame({squad:s.squads[0],startQuest:PICNIC_QUEST,now:s.updatedAt,ready:true,paused:false,detours:false});
  assert.match(frame.target.name,/景色|木陰|腰/);
  for(const member of frame.members)assert.ok(![4,5,6,7].includes(Number(heroAnimation(member,frame,s.updatedAt)?.frame)));
 }
 assert.equal(s.herbs,before);
 assert.equal(storyArtAt(PICNIC_QUEST+'-return',Infinity),undefined);
});

test('herb quest combines observation and combat; Mira does not walk with the pair; art begins at collapse',()=>{
 const q=allQuests.find(q=>q.id===MOON_HERB_QUEST);assert.deepEqual([0,1,2].map(i=>encounter(q,i)),['gather','gather','battle']);
 assert.match(targetName(q,0),/葉の裏/);assert.match(targetName(q,1),/包み/);
 const s=start(unlocked(),MOON_HERB_QUEST);assert.ok(journeyBanter(s,s.squads[0],s.updatedAt).every(line=>line.speaker!=='mira'));
 const st=chapterTwoStories.find(st=>st.id===MOON_HERB_QUEST+'-return');
 const index=st.lines.findIndex(line=>line.text.includes('膝が折れた'));assert.equal(storyArtAt(st.id,index-1),undefined);
 const art=storyArtAt(st.id,index);assert.ok(art);assert.ok(existsSync('public'+art.src));assert.equal(index,6);
});

test('coins, levels, hero and slot are checked; learning is distinct from free equipment changes',()=>{
 const locked=firstChapter();assert.throws(()=>act(locked,{type:'learnTechnique',id:'aria-gather'},locked.updatedAt));
 let s=unlocked();assert.equal(knowsTechnique(s,'aria-double'),true);assert.equal(equippedTechnique(s,'aria','active'),'aria-double');
 const before=s.gold;s=act(s,{type:'learnTechnique',id:'aria-gather'},s.updatedAt);assert.equal(s.gold,before-80);assert.equal(equippedTechnique(s,'aria','active'),'aria-double');
 assert.throws(()=>act(s,{type:'learnTechnique',id:'aria-gather'},s.updatedAt),/習得済み/);
 assert.throws(()=>act(s,{type:'setTechnique',hero:'leon',techniqueSlot:'active',id:'aria-gather'},s.updatedAt));
 assert.throws(()=>act(s,{type:'setTechnique',hero:'aria',techniqueSlot:'passive',id:'aria-gather'},s.updatedAt));
 assert.throws(()=>act(s,{type:'setTechnique',hero:'aria',techniqueSlot:'passive',id:'aria-herbs'},s.updatedAt));
 s=act(s,{type:'setTechnique',hero:'aria',techniqueSlot:'active',id:'aria-gather'},s.updatedAt);assert.equal(s.gold,before-80);
 s=roundtrip(s);assert.equal(equippedTechnique(s,'aria','active'),'aria-gather');
 s=act(s,{type:'setTechnique',hero:'aria',techniqueSlot:'active'},s.updatedAt);assert.equal(equippedTechnique(s,'aria','active'),null);assert.equal(knowsTechnique(s,'aria-gather'),true);
 s=act(s,{type:'setTechnique',hero:'aria',techniqueSlot:'active',id:'aria-double'},s.updatedAt);assert.equal(s.gold,before-80);
 const away=start(s,MOON_HERB_QUEST);assert.throws(()=>act(away,{type:'setTechnique',hero:'aria',techniqueSlot:'active',id:'aria-gather'},away.updatedAt),/帰還/);
 const poor={...s,gold:0};assert.throws(()=>act(poor,{type:'learnTechnique',id:'aria-herbs'},poor.updatedAt),/足りません/);
 const low={...s,xp:{aria:0,leon:0},gold:1000};assert.throws(()=>act(low,{type:'learnTechnique',id:'aria-aim'},low.updatedAt),/足りません/);
 const grown={...low,xp:{aria:30*19**2,leon:0}};assert.match(journeyNotice(low,grown).title,/習得できる技/);
});

test('only equipped techniques affect actions and rewards; offline and live simulation agree',()=>{
 let learned=unlocked();learned.gold=1000;
 for(const id of ['aria-gather','aria-herbs','leon-guard','leon-ready','leon-sword'])learned=act(learned,{type:'learnTechnique',id},learned.updatedAt);
 const noSet=finish(start(learned,MOON_HERB_QUEST));let equipped=learned;
 for(const [hero,techniqueSlot,id] of [['aria','active','aria-gather'],['aria','passive','aria-herbs'],['leon','active','leon-guard'],['leon','passive','leon-ready']])equipped=act(equipped,{type:'setTechnique',hero,techniqueSlot,id},equipped.updatedAt);
 assert.equal(techniqueMultiplier(equipped,'aria','gather',true,1.65),2.2);assert.equal(techniqueMultiplier(equipped,'aria','battle',true,1.65),1);
 assert.equal(techniqueDamage(equipped,'leon',20),17);assert.equal(techniqueMultiplier(equipped,'leon','battle',true,1.7),1);
 const run=start(equipped,MOON_HERB_QUEST),end=run.updatedAt+600000,offline=settle(roundtrip(run),end).state;let live=run;let sawGather=false,sawGuard=false;
 while(live.squads[0].run){live=settle(live,live.squads[0].run.nextAt).state;for(const e of live.squads[0].run?.events??[]){sawGather||=e.text.includes('丁寧な採取');sawGuard||=e.text.includes('かばう');}}
 live=settle(live,end).state;assert.deepEqual({...roundtrip(live),log:[]},{...roundtrip(offline),log:[]});assert.equal(sawGather,true);assert.equal(sawGuard,true);
 assert.equal(offline.herbs-equipped.herbs,(noSet.herbs-learned.herbs)*1.25);
 const invalid=structuredClone(equipped);invalid.techniques.equipped.aria.passive='leon-ready';assert.throws(()=>roundtrip(invalid));
 invalid.techniques.equipped.aria.passive='aria-herbs';invalid.techniques.learned.push('aria-herbs');assert.throws(()=>roundtrip(invalid));
 assert.deepEqual(roundtrip(initialState(1000)),initialState(1000));
});
