import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialState,initialPrologueState,act,settle,testState} from '../lib/game.ts';
import {stories} from '../lib/stories.ts';
import {prologueStages} from '../lib/prologue.ts';
import {madHalloweenStories} from '../lib/mad-halloween-stories.ts';
import {characterEncounters} from '../lib/character-encounters.ts';
import {storyArt,storyArtAt} from '../lib/story-art.ts';
import {recruitments} from '../lib/recruitment.ts';
import {adventureFrame,adventureAssets,adventureAction} from '../lib/adventure-presentation.ts';
const frameFor=(state,now=state.updatedAt)=>adventureFrame({squad:state.squads[0],now,ready:true,paused:false,startQuest:'herbs'});
await mkdir(new URL('../work/',import.meta.url),{recursive:true});
const output=new URL('../work/map-render.mjs',import.meta.url);
await build({entryPoints:['app/map-stage.tsx'],outfile:fileURLToPath(output),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {MapStage}=await import(output.href);
const storyOutput=new URL('../work/story-render.mjs',import.meta.url);
await build({entryPoints:['app/story-scenes.tsx'],outfile:fileURLToPath(storyOutput),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {StoryReader,StoryLines,StoryLibrary,Banter}=await import(storyOutput.href);
const phoneOutput=new URL('../work/phone-render.mjs',import.meta.url);
await build({entryPoints:['app/phone-game.tsx'],outfile:fileURLToPath(phoneOutput),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {PhoneGame}=await import(phoneOutput.href);

test('dialogue and banter show close-up portraits and the trade still appears from the first page',()=>{
 const story=stories.find(st=>st.id==='village-trade-return');
 const first=renderToStaticMarkup(createElement(StoryReader,{story,ready:true,onRead:()=>true,onClose:()=>{}}));
 for(const id of ['aria','leon'])assert.ok(first.includes('/portraits/'+id+'.png'));
 const lines=[{speaker:'aria',text:'お疲れさま。'},{speaker:'leon',text:'無事に着いたな。'},{text:'ふたりは顔を見合わせた。'}],before=structuredClone(lines);
 const chat=renderToStaticMarkup(createElement(Banter,{lines,onRead:()=>{}}));
 assert.match(chat,/face-portrait/);assert.ok(chat.includes('/portraits/leon.png'));assert.ok(!chat.includes('/portraits/aria.png'));assert.doesNotMatch(chat,/class="sprite/);assert.deepEqual(lines,before);
 for(let line=0;line<story.lines.length;line+=3)assert.equal(storyArtAt(story.id,line)?.src,'/stories/village-trade-handover.png');
 assert.ok(first.includes('/stories/village-trade-handover.png'));
});

test('prologue screen guides to quests, hides advanced navigation and uses one book entrance',()=>{
 const render=s=>renderToStaticMarkup(createElement(PhoneGame,{game:{s,clock:1000,ready:true,otherTab:false,profile:{id:'test'},dispatch:()=>true}}));
 const fresh=initialPrologueState(1000),html=render(fresh);
 assert.match(html,/ここから/);
 assert.equal((html.match(/aria-label="クエストを開く"/g)||[]).length,1);assert.match(html,/quest-scroll.png/);assert.doesNotMatch(html,/idle-map-note|>クエスト<|>クエストを選ぶ<|何度でも/);
 assert.match(html,/aria-label="旅の手帳：思い出・ヒント・設定"/);
 assert.doesNotMatch(html,/はじまりの隊|団長の応援|>編成<|>帰還<|>パーティ<|>拠点<|>思い出<|>出発する</);
 const running=render(act(fresh,{type:'start',id:'village-trade',readDeparture:true},1000));
 assert.match(running,/探索マップ/);assert.doesNotMatch(running,/phaser-assist-controls|>手助けする<|>回復<|>寄り道</);assert.doesNotMatch(running,/団長の応援|>編成<|>帰還<|>パーティ<|>拠点</);
 const cleared=settle(act(fresh,{type:'start',id:'village-trade',readDeparture:true},1000),3601000).state;
 const after=render(act(cleared,{type:'readStory',id:'village-trade-return'},3601000));assert.doesNotMatch(after,/quest-tutorial|何度でも|>クエストを選ぶ<|idle-map-note/);
 const legacy=render(initialState(1000));assert.match(legacy,/>パーティ</);assert.match(legacy,/>拠点</);
 assert.doesNotMatch(legacy,/>思い出<|行き先を選ぶ|行き先を変える/);
});

test('stage progress selects the next scenery and new stages keep the two-person adventure screen',()=>{
 const render=s=>renderToStaticMarkup(createElement(PhoneGame,{game:{s,clock:s.updatedAt,ready:true,otherTab:false,profile:{id:'test'},dispatch:()=>true}}));
 let state=initialPrologueState(1000);
 for(const stage of prologueStages){
  const idle=render(state);assert.ok(idle.includes(stage.label));assert.doesNotMatch(idle,/undefined|>パーティ<|>拠点</);
  state=act(state,{type:'start',id:stage.quest,readDeparture:true},state.updatedAt);
  const running=render(state);assert.ok(running.includes(stage.label));
  if(stage.quest!=='village-trade')assert.ok(running.includes('/stages/'+stage.quest+'.png'));
  if(stage.quest==='evening-trade-road'){
   const battle=structuredClone(state);battle.squads[0].run.node=1;battle.squads[0].run.phase='work';
   assert.match(render(battle),/魔物と戦闘中/);assert.doesNotMatch(render(battle),/いたずらを阻止中/);
  }
  state=settle(state,state.updatedAt+3600000).state;
  state=act(state,{type:'readStory',id:stage.quest+'-return'},state.updatedAt);
 }
});

test('guest stills reveal during their scene and enter the gallery only after reading',()=>{
 for(const scene of characterEncounters.filter(st=>storyArt[st.id])){
  const state=testState(1000,60,20,100000);state.town=2;
  for(const quest of scene.requiresQuests||[])state.done[quest]=1;
  state.story={departed:[],completed:[],read:[]};
  const library=()=>renderToStaticMarkup(createElement(StoryLibrary,{state,onOpen:()=>{}}));
  const before=library();assert.ok(before.includes(scene.title));assert.ok(before.includes('仲間と来客'));
  assert.ok(!before.includes(storyArt[scene.id].src),'later action is not a gallery spoiler');
  const firstPage=renderToStaticMarkup(createElement(StoryReader,{story:scene,ready:true,onRead:()=>true,onClose:()=>{}}));
  assert.ok(!firstPage.includes(storyArt[scene.id].src));
  state.story.read.push(scene.id);assert.ok(library().includes(storyArt[scene.id].src));
 }
});

test('original characters render as named speakers, portraits and battle targets',()=>{
 for(const story of [...madHalloweenStories,...characterEncounters,...stories.filter(st=>st.companion==='chacha')]){
  const html=renderToStaticMarkup(createElement(StoryReader,{story,ready:true,onRead:()=>true,onClose:()=>{}}));
  assert.doesNotMatch(html,/undefined|NaN/);
  const lines=renderToStaticMarkup(createElement(StoryLines,{lines:story.lines}));
  for(const [id,name] of [['merrill','メリル'],['pumpety','パンプティ'],['chacha','チャチャ']])if(story.lines.some(l=>l.speaker===id)){
   assert.ok(lines.includes(name));assert.ok(lines.includes('/characters/'+id+'.png'));
  }
 }
 for(const [id,asset] of [['midnight-snack','merrill'],['puppet-midnight','pumpety']]){
  let state=testState(1000,60,20,100000);state=act(state,{type:'start',id},1000);
  const html=renderToStaticMarkup(createElement(MapStage,{state,squad:state.squads[0],now:1000,onAction:()=>{},ready:true,startQuest:id}));
  assert.ok(adventureAssets(frameFor(state)).includes('/characters/'+asset+'.png'));assert.doesNotMatch(html,/undefined|NaN/);
 }
});
test('every restored expedition location renders with finite character coordinates',()=>{
 let state=act(initialState(1000),{type:'start',id:'herbs'},1000);
 const visited=new Set();
 for(let i=0;i<10000&&visited.size<15;i++){
  const squad=state.squads[0],node=squad.run.node;
  if(!visited.has(node)){
   const html=renderToStaticMarkup(createElement(MapStage,{state,squad,now:state.updatedAt,onAction:()=>{},ready:true,startQuest:'herbs'}));
   assert.match(html,new RegExp(`地点 ${node+1}/15`));
   assert.doesNotMatch(html,/NaN|undefined%/);
   for(const member of frameFor(state).members){assert.ok(Number.isFinite(member.x)&&Number.isFinite(member.y));assert.ok(member.x>=0&&member.x<=1&&member.y>=0&&member.y<=1);}
   visited.add(node);
  }
  state=settle(state,state.squads[0].run.nextAt).state;
 }
 assert.equal(visited.size,15);
});

test('all recruitment maps render every location with the accompanying candidate',()=>{
 for(const r of recruitments){
  let state=testState(1000,60,20,10000000);state.owned=state.owned.filter(id=>id!==r.hero);state.wood=state.herbs=state.ore=100000;state.gear=10;
  state.done[r.rare.sources[0]]=r.rare.every*r.rare.count;
  state=act(state,{type:'prepareRecruitment',id:r.hero},1000);state=act(state,{type:'start',id:'join-'+r.hero},1000);
  const visited=new Set();
  for(let i=0;state.squads[0].run&&i<20000;i++){
   const squad=state.squads[0],node=squad.run.node;
   if(!visited.has(node)){const html=renderToStaticMarkup(createElement(MapStage,{state,squad,now:state.updatedAt,onAction:()=>{},ready:true,startQuest:'herbs'}));assert.match(html,/が同行中/);assert.ok(html.includes(r.mission.region));assert.ok(html.includes(r.name));assert.doesNotMatch(html,/NaN|undefined%/);visited.add(node);}
   state=settle(state,state.squads[0].run.nextAt).state;
  }
  assert.equal(visited.size,15,r.hero);assert.ok(state.owned.includes(r.hero));
 }
});

test('effects follow current events, expire on resume, and do not alter the save',()=>{
 const state=act(initialState(1000),{type:'start',id:'herbs'},1000),squad=state.squads[0],run=squad.run;
 run.node=1;run.events=[{id:'1-1-2000-hit-1-leon-1',at:2000,kind:'hit',hero:'leon',amount:10,text:'攻撃'}, {id:'1-0-2100-hit-1-aria-2',at:2100,kind:'hit',hero:'aria',amount:4,text:'前の地点'}];
 run.scene={at:2000,kind:'burst',title:'全員必殺！ 星灯りの大応援',lines:['任せて！']};
 const before=structuredClone(state);
 const render=now=>renderToStaticMarkup(createElement(MapStage,{state,squad,now,onAction:()=>{},ready:true,startQuest:'herbs'}));
 const current=render(2200);
 assert.equal(frameFor(state,2200).events.length,1);
 assert.match(current,/finisher-scene burst/);
 assert.match(current,/--scene-age:-200ms/);
 assert.doesNotMatch(render(7000),/finisher-scene burst/);assert.equal(frameFor(state,7000).events.length,0);
 assert.doesNotMatch(render(1500),/finisher-scene burst/);assert.equal(frameFor(state,1500).events.length,0);
 assert.deepEqual(state,before);
});

test('all discovery kinds render their artwork before and after automatic collection',()=>{
 const state=act(initialState(1000),{type:'start',id:'herbs'},1000),squad=state.squads[0];
 for(const kind of ['chest','herb','spirit'])for(const claimed of [false,true]){
  squad.run.detour={kind,claimed,node:0,hero:'aria',at:1500,finishAt:2000};
  const html=renderToStaticMarkup(createElement(MapStage,{state,squad,now:2100,onAction:()=>{},ready:true,startQuest:'herbs'}));
  assert.ok(adventureAssets(frameFor(state,2100)).includes(`/items/${kind}.png`));
  assert.equal(frameFor(state,2100).discovery.kind,kind);
  assert.doesNotMatch(html,/phaser-assist-controls|>寄り道<|>発見済み</);
 }
});

function mapKey(state,key,ready=true,paused=false){
 const tree=MapStage({state,squad:state.squads[0],now:state.updatedAt,onAction:action=>{state=act(state,action,state.updatedAt);},ready,paused,startQuest:'herbs'});
 const map=tree.props.children.flat().find(node=>node?.props?.className==='adventure-map phaser-map');
 return {map,press(){map.props.onKeyDown({key,target:map,currentTarget:map,preventDefault(){}});return state;}};
}
test('keyboard map assistance works without separate buttons and respects input guards',()=>{
 const idle=initialState(1000);assert.equal(mapKey(idle,'Enter').map.props.tabIndex,undefined);assert.deepEqual(mapKey(idle,'Enter').press(),idle);
 const state=act(idle,{type:'start',id:'herbs'},1000);
 const after=mapKey(state,'Enter').press();assert.equal(after.squads[0].run.cheer,5);assert.equal(after.squads[0].run.hits,1);
 for(const [ready,paused] of [[false,false],[true,true]]){assert.equal(mapKey(state,'Enter',ready,paused).map.props.tabIndex,undefined);assert.deepEqual(mapKey(state,'Enter',ready,paused).press(),state);}
 assert.equal(adventureAction({squad:state.squads[0],ready:false,paused:false,now:1000,startQuest:'herbs'},'help'),null);
});
test('resting keyboard assistance heals and H heals without striking',()=>{
 const state=act(initialState(1000),{type:'start',id:'herbs'},1000);
 state.squads[0].run.hp=0;state.squads[0].run.phase='rest';
 for(const key of ['Enter',' ','h']){const after=mapKey(state,key).press().squads[0].run;assert.ok(after.hp>0);assert.equal(after.phase,'move');assert.equal(after.cheer,5);}
 state.squads[0].run.phase='work';state.squads[0].run.hp=10;
 const before=state.squads[0].run;const after=mapKey(state,'H').press().squads[0].run;assert.ok(after.hp>before.hp);assert.equal(after.target,before.target);
});
