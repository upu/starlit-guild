import {pathToFileURL} from 'node:url';
import {act,settle,level,allQuests} from '../lib/game.ts';
import {storyStages,prologueStages} from '../lib/prologue.ts';
import {chapterTwoStages} from '../lib/chapter-two.ts';
import {chapterTwoPresetState} from '../lib/chapter-two-presets.ts';

export function measure(input,quest,limitMs=180000){
 let state=act(input,{type:'start',id:quest,value:false,readDeparture:true},input.updatedAt);
 const start=state.updatedAt,seen=new Set(),record={quest,level:level(state.xp.aria),seconds:0,cleared:false,rests:0,minHp:1,heals:0,healing:0,hurt:0,commands:0};
 while(state.squads[0].run){
  const run=state.squads[0].run;if(run.nextAt>start+limitMs)break;
  const phase=run.phase;state=settle(state,run.nextAt).state;
  const next=state.squads[0].run;
  if(next?.phase==='rest'&&phase!=='rest')record.rests++;
  if(next)record.minHp=Math.min(record.minHp,...Object.values(next.health).map(h=>h.hp/h.maxHp));
  for(const event of next?.events||[]){
   if(seen.has(event.id))continue;seen.add(event.id);
   if(event.kind==='heal'&&event.hero==='mira'){record.heals++;record.healing+=event.amount||0;}
   if(event.kind==='hurt')record.hurt+=event.amount||0;
   if(event.text.includes('もう一回なのよ'))record.commands++;
  }
 }
 record.seconds=Math.round((state.updatedAt-start)/1000);record.cleared=!state.squads[0].run;
 record.minHp=Math.round(record.minHp*100);
 return {state,record};
}
export function isolated(quest,lv){
 const s=chapterTwoPresetState('standard',1000);s.owned.push('mira');
 for(const id of s.owned)s.xp[id]=30*(lv-1)**2;
 for(const stage of storyStages.slice(prologueStages.length,storyStages.findIndex(stage=>stage.quest===quest))){
  s.done[stage.quest]=1;s.story.departed.push(stage.quest);s.story.completed.push(stage.quest);s.story.read.push(stage.quest+'-departure',stage.quest+'-return');
 }
 return s;
}
export function chapterRoute(preset='standard',input){
 let state=input?structuredClone(input):chapterTwoPresetState(preset,1000),trainingSeconds=0;const records=[],start=state.updatedAt;
 for(const stage of chapterTwoStages){
  let result=measure(state,stage.quest);
  for(let attempt=0;!result.record.cleared&&attempt<24;attempt++){
   state=act(result.state,{type:'stop'},result.state.updatedAt);
   const farm=state.done['spinning-signpost']?'spinning-signpost':state.done['mountain-entrance']?'mountain-entrance':state.done['moonlit-herbs']?'moonlit-herbs':'hilltop-picnic';
   if(!state.done[farm])break;
   state=act(state,{type:'start',id:farm,value:true},state.updatedAt);
   state=settle(state,state.updatedAt+300000).state;trainingSeconds+=300;
   state=act(state,{type:'stop'},state.updatedAt);result=measure(state,stage.quest);
  }
  records.push(result.record);state=result.state;if(!result.record.cleared)break;
  state=act(state,{type:'readStory',id:stage.quest+'-return'},state.updatedAt);
 }
 return {records,trainingSeconds,totalSeconds:Math.round((state.updatedAt-start)/1000),state};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.table([10,15,20,25,30].flatMap(lv=>['mountain-entrance','spinning-signpost','begging-golem','sweet-blockade'].map(q=>measure(isolated(q,lv),q).record)));
 for(const preset of ['standard','strong']){const {state,...result}=chapterRoute(preset);console.log(preset,JSON.stringify(result));console.log('final levels',state.owned.map(id=>[id,level(state.xp[id])]));}
 console.log('Work quests',allQuests.filter(q=>chapterTwoStages.some(s=>s.quest===q.id)&&q.kind!=='討伐').map(q=>q.id));
}
