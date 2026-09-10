import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialState,act,settle,testState} from '../lib/game.ts';
import {stories} from '../lib/stories.ts';
import {madHalloweenStories} from '../lib/mad-halloween-stories.ts';
import {characterEncounters} from '../lib/character-encounters.ts';
import {storyArt} from '../lib/story-art.ts';
import {recruitments} from '../lib/recruitment.ts';
await mkdir(new URL('../work/',import.meta.url),{recursive:true});
const output=new URL('../work/map-render.mjs',import.meta.url);
await build({entryPoints:['app/map-stage.tsx'],outfile:fileURLToPath(output),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {MapStage}=await import(output.href);
const storyOutput=new URL('../work/story-render.mjs',import.meta.url);
await build({entryPoints:['app/story-scenes.tsx'],outfile:fileURLToPath(storyOutput),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {StoryReader,StoryLines,StoryLibrary}=await import(storyOutput.href);

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
  assert.ok(html.includes('/characters/'+asset+'.png'));assert.doesNotMatch(html,/undefined|NaN/);
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
   if(!visited.has(node)){const html=renderToStaticMarkup(createElement(MapStage,{state,squad,now:state.updatedAt,onAction:()=>{},ready:true,startQuest:'herbs'}));assert.match(html,/class="quest-guest"/);assert.ok(html.includes(r.mission.region));assert.ok(html.includes(r.name));assert.doesNotMatch(html,/NaN|undefined%/);visited.add(node);}
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
 assert.equal((current.match(/class="battle-impact /g)||[]).length,1);
 assert.match(current,/finisher-scene burst/);
 assert.match(current,/--scene-age:-200ms/);
 assert.doesNotMatch(render(7000),/class="battle-impact |finisher-scene burst|class="attack-trail/);
 assert.doesNotMatch(render(1500),/class="battle-impact |finisher-scene burst/);
 assert.deepEqual(state,before);
});

test('all discovery kinds render their artwork before and after automatic collection',()=>{
 const state=act(initialState(1000),{type:'start',id:'herbs'},1000),squad=state.squads[0];
 for(const kind of ['chest','herb','spirit'])for(const claimed of [false,true]){
  squad.run.detour={kind,claimed,node:0,hero:'aria',at:1500,finishAt:2000};
  const html=renderToStaticMarkup(createElement(MapStage,{state,squad,now:2100,onAction:()=>{},ready:true,startQuest:'herbs'}));
  assert.match(html,new RegExp(`/items/${kind}.png`));
  assert.match(html,/寄り道を優先して調べる/);
  if(claimed)assert.match(html,/見つけた！/);
 }
});

function mapButton(state,className,ready=true){
 const tree=MapStage({state,squad:state.squads[0],now:state.updatedAt,onAction:action=>{state=act(state,action,state.updatedAt);},ready,startQuest:'herbs'});
 function find(node){if(!node||typeof node!=='object')return null;if(node.type==='button'&&node.props.className?.split(' ').includes(className))return node;return [node.props?.children].flat(Infinity).map(find).find(Boolean);}
 const button=find(tree);
 return {button,click(){assert.ok(button);assert.equal(button.props.disabled,false);button.props.onClick();return state;}};
}
test('map and target taps each dispatch a single assist while idle and unavailable maps are guarded',()=>{
 const idle=initialState(1000);assert.equal(mapButton(idle,'map-tap-surface').button,undefined);
 const state=act(idle,{type:'start',id:'herbs'},1000);
 for(const cls of ['map-tap-surface','target']){const after=mapButton(state,cls).click();assert.equal(after.squads[0].run.cheer,5);assert.equal(after.squads[0].run.hits,1);assert.equal(mapButton(state,cls,false).button.props.disabled,true);}
});
test('resting map taps recover the party and hero and HP taps heal without striking',()=>{
 const state=act(initialState(1000),{type:'start',id:'herbs'},1000);
 state.squads[0].run.hp=0;state.squads[0].run.phase='rest';
 for(const cls of ['map-tap-surface','target','hero-heal-target','party-health']){const after=mapButton(state,cls).click().squads[0].run;assert.ok(after.hp>0);assert.equal(after.phase,'move');assert.equal(after.cheer,5);}
 state.squads[0].run.phase='work';state.squads[0].run.hp=10;
 for(const cls of ['hero-heal-target','party-health']){const before=state.squads[0].run;const after=mapButton(state,cls).click().squads[0].run;assert.ok(after.hp>before.hp);assert.equal(after.target,before.target);}
});
