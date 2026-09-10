import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {initialState,act,settle} from '../lib/game.ts';
await mkdir(new URL('../work/',import.meta.url),{recursive:true});
const output=new URL('../work/map-render.mjs',import.meta.url);
await build({entryPoints:['app/map-stage.tsx'],outfile:fileURLToPath(output),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const {MapStage}=await import(output.href);
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
