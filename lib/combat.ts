import type {Quest,Run,State} from './game.ts';
import {level} from './game-v1.ts';
import {equippedItems} from './equipment.ts';
import {PICNIC_QUEST,MOON_HERB_QUEST,MOUNTAIN_QUEST,SIGNPOST_QUEST,GOLEM_QUEST} from './chapter-two.ts';
import {prologueStages} from './prologue.ts';

export type Enemy={id:string;hp:number;maxHp:number;resistance:number;attack:number;period:number;nextAt:number};
export const RESISTANCE_RATE=1.15;
const firstChapterRanks=[0,1,2,6,10,12,17,21,25];

// Difficulty belongs to a quest, never its repeat count or the save's total clears.
export function combatRank(q:Quest){
 if(q.id===PICNIC_QUEST)return 0;
 if([MOON_HERB_QUEST,MOUNTAIN_QUEST,SIGNPOST_QUEST].includes(q.id))return 25;
 if(q.id===GOLEM_QUEST)return 27;
 const stage=prologueStages.findIndex(stage=>stage.quest===q.id);
 return stage>=0?firstChapterRanks[stage]:Math.max(4,4+Math.round((q.need-30)/5));
}
export function penetration(s:State,hero:string){
 const weapon=equippedItems(s,hero).find(item=>item.slot==='weapon');
 return level(s.xp[hero]||0)-1+s.gear*2+(weapon?.tier||0)*3;
}
export function reducedDamage(base:number,resistance:number,power:number){
 return Math.max(1,Math.round(base/RESISTANCE_RATE**Math.min(300,Math.max(0,resistance-power))));
}
export function enemyCount(q:Quest,node:number){
 if(q.enemy>=10)return 1;
 const maximum=Math.min(3,combatRank(q)+1);
 return 1+Math.floor(node/3)%maximum;
}
export function createEnemies(q:Quest,node:number,at:number):Enemy[]{
 const rank=combatRank(q),count=enemyCount(q,node),hp=Math.round((36+rank*3)*(1+.12*(count-1))/count);
 return Array.from({length:count},(_,index)=>({id:`enemy-${String(index+1)}`,hp,maxHp:hp,resistance:rank,attack:(4+rank*.45)/count,period:1450+index*250,nextAt:at+3700+index*450}));
}
export function focusedEnemy(r:Run){return r.enemies?.find(enemy=>enemy.hp>0);}
export function syncEnemyTotals(r:Run){
 if(!r.enemies?.length)return;
 r.target=r.enemies.reduce((sum,enemy)=>sum+enemy.hp,0);
 r.targetMax=r.enemies.reduce((sum,enemy)=>sum+enemy.maxHp,0);
 // Keep the legacy clock as a finite, serializable projection.
 const living=r.enemies.filter(enemy=>enemy.hp>0);if(living.length)r.enemyAt=Math.min(...living.map(enemy=>enemy.nextAt));
}
export function damageEnemy(r:Run,base:number,power:number){
 const enemy=focusedEnemy(r);
 if(!enemy){const amount=Math.max(1,Math.round(base));r.target=Math.max(0,r.target-amount);return {amount,enemy:undefined};}
 const amount=Math.min(enemy.hp,reducedDamage(base,enemy.resistance,power));enemy.hp-=amount;syncEnemyTotals(r);
 return {amount,enemy:enemy.id};
}
