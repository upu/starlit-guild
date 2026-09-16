import {initialPrologueState,act,settle,allQuests} from '../lib/game.ts';
import {storyStages} from '../lib/prologue.ts';
const quests=['spinning-signpost','begging-golem','sweet-blockade'];
const rows=[];
for(const level of [20,25,30])for(const quest of quests){
 let s=initialPrologueState(1000);s.owned.push('mira');s.xp={aria:30*(level-1)**2,leon:30*(level-1)**2,mira:30*(level-1)**2};
 for(const stage of storyStages.slice(0,storyStages.findIndex(stage=>stage.quest===quest))){s.done[stage.quest]=1;s.story.departed.push(stage.quest);s.story.completed.push(stage.quest);s.story.read.push(stage.quest+'-departure',stage.quest+'-return');}
 s=act(s,{type:'start',id:quest,readDeparture:true,value:false},1000);
 let rest=0,maxEnemies=0,minHealth=1,commands=new Set();
 while(s.squads[0].run&&s.updatedAt<601000){
  const r=s.squads[0].run;maxEnemies=Math.max(maxEnemies,r.enemies.length);if(r.phase==='rest')rest++;
  for(const event of r.events)if(event.text.includes('もう一回なのよ'))commands.add(event.id);
  minHealth=Math.min(minHealth,...Object.values(r.health).map(h=>h.hp/h.maxHp));
  s=settle(s,r.nextAt).state;
 }
 rows.push({level,quest:allQuests.find(q=>q.id===quest).name,seconds:Math.round((s.updatedAt-1000)/1000),completed:!s.squads[0].run,rest,maxEnemies,minHealth:Math.round(minHealth*100)+'%',commands:commands.size});
}
console.table(rows);
