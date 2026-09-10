import {migrate as migrateV2,settle as settleV2,type State as V2State} from './game-v2.ts';
import {heroes as baseHeroes,quests as baseQuests,bonds,level,type State as LegacyState} from './game-v1.ts';
export {bonds,level};
export type Kind='採取'|'護衛'|'討伐';
export const heroes=baseHeroes.map((h,i)=>({...h,sprite:i,unlock:[0,0,3,8,16,24,35,50][i],price:[0,0,100,220,450,700,950,1300][i]}));
export const quests=baseQuests.map((q,i)=>({...q,unlock:[0,2,4,10,15,20,35,45,60][i],enemy:i===8?10:i>=3?9:8}));
export type Quest=typeof quests[number];
export type Encounter='battle'|'gather'|'escort';
export type GameEvent={id:string;at:number;kind:'hit'|'gather'|'hurt'|'heal'|'clear'|'move'|'rest'|'assist';text:string;amount?:number;hero?:string};
export type Actor={hero:string;arrivesAt:number;nextAt:number;period:number};
export type Run={actors:Actor[];enemyAt:number;quest:string;round:number;node:number;phase:'move'|'work'|'rest';phaseAt:number;nextAt:number;started:number;hp:number;maxHp:number;target:number;targetMax:number;hits:number;energy:number;energyAt:number;events:GameEvent[]};
export type Squad={id:string;name:string;members:string[];repeat:boolean;run:Run|null};
export type State={version:3;gold:number;herbs:number;ore:number;owned:string[];xp:Record<string,number>;gear:number;camp:number;clears:number;done:Record<string,number>;claimed:string[];lastDaily:string;updatedAt:number;squads:Squad[];log:{text:string;at:number}[];receipts:string[]};
export type Rewards={count:number;gold:number;xp:number;herbs:number;ore:number;offline:boolean;capped:boolean};
export function initialState(now:number):State{return {version:3,gold:60,herbs:0,ore:0,owned:['aria','leon'],xp:{},gear:0,camp:0,clears:0,done:{},claimed:[],lastDaily:'',updatedAt:now,squads:[{id:'party-1',name:'はじまりの隊',members:['aria','leon'],repeat:true,run:null}],log:[{at:now,text:'アリアとレオン、ふたりの旅が始まった。'}],receipts:[]};}
export const activeBonds=(members:string[])=>bonds.filter(b=>b.ids.every(id=>members.includes(id)));
export function memberStats(s:State,id:string){const h=heroes.find(h=>h.id===id)!;return h.stats.map(v=>Math.round(v*(1+.1*(level(s.xp[id]||0)-1))*(1+.08*s.gear)));}
export function stats(s:State,sq:Squad){return [0,1,2].map(i=>sq.members.reduce((v,id)=>v+memberStats(s,id)[i],0)+activeBonds(sq.members).reduce((v,b)=>v+b.bonus,0));}
export const power=(s:State,sq:Squad,q:Quest)=>stats(s,sq)[['採取','護衛','討伐'].indexOf(q.kind)];
export const memberLimit=(s:State)=>s.clears>=10?3:2;
export const squadLimit=(s:State)=>s.owned.length>=6?3:s.owned.length>=4?2:1;
export function encounter(q:Quest,node:number):Encounter{return q.kind==='採取'?(node===1?'battle':'gather'):q.kind==='護衛'?(node===1?'escort':'battle'):'battle';}
export function targetName(q:Quest,node:number){const k=encounter(q,node);return k==='gather'?(q.id==='crystal'?'青晶石':q.id==='blossom'?'千年樹の花':'月しずく草'):k==='escort'?'旅人を目的地へ':q.enemy===10?'星喰い竜':q.enemy===9?'霧狼':'スライム';}
export const stepMs=(s:State)=>Math.round(1050*(1-.035*s.camp));
export function estimate(s:State,sq:Squad,q:Quest){const relevant=Math.max(5,power(s,sq,q));return Math.round((12+q.need*6.9/Math.max(3,2+relevant/Math.max(1,sq.members.length)*.23)*stepMs(s)/1000/Math.max(1,sq.members.length)));}
function addLog(s:State,text:string,at:number){s.log=[{text,at},...s.log].slice(0,40);}
function event(r:Run,at:number,kind:GameEvent['kind'],text:string,amount?:number,hero?:string){r.events=[...r.events,{id:`${r.round}-${r.node}-${at}-${kind}-${r.hits}-${hero||"leader"}`,at,kind,text,amount,hero}].slice(-12);}
function configureTarget(r:Run,q:Quest){r.targetMax=Math.round(q.need*(encounter(q,r.node)==='escort'?1.8:2.3));r.target=r.targetMax;r.hits=0;}
export function travelMs(id:string){return 2200+(heroes.findIndex(h=>h.id===id)%4)*310;}
function schedule(s:State,sq:Squad,r:Run,at:number){
 r.actors=sq.members.map(hero=>({hero,arrivesAt:at+travelMs(hero),nextAt:at+travelMs(hero),period:Math.round(stepMs(s)*(0.8+(heroes.findIndex(h=>h.id===hero)%4)*.13))}));
 r.enemyAt=at+3700;r.nextAt=Math.min(...r.actors.map(a=>a.nextAt),r.enemyAt);
}
function makeRun(s:State,sq:Squad,q:Quest,at:number,round=1):Run{const maxHp=80+stats(s,sq)[1]*2;const r:Run={actors:[],enemyAt:at+3700,quest:q.id,round,node:0,phase:'move',phaseAt:at,nextAt:at+2200,started:at,hp:maxHp,maxHp,target:0,targetMax:0,hits:0,energy:3,energyAt:at,events:[]};configureTarget(r,q);schedule(s,sq,r,at);return r;}
function reward(s:State,sq:Squad,q:Quest,at:number){const gold=Math.floor(q.gold*(sq.members.includes('finn')?1.1:1)*(sq.members.includes('noel')?1.1:1));s.gold+=gold;s.herbs+=q.herbs;s.ore+=q.ore;s.clears++;s.done[q.id]=(s.done[q.id]||0)+1;for(const id of sq.members)s.xp[id]=(s.xp[id]||0)+q.xp;return {gold,xp:q.xp,herbs:q.herbs,ore:q.ore,at};}
function completeNode(s:State,sq:Squad,q:Quest,at:number){const r=sq.run!;event(r,at,'clear',`${targetName(q,r.node)}をクリア！`);if(r.node<2){r.node++;r.phase='move';r.phaseAt=at;r.nextAt=at+4000;r.hp=Math.min(r.maxHp,r.hp+r.maxHp*.15);configureTarget(r,q);schedule(s,sq,r,at);return null;}
 const gain=reward(s,sq,q,at);if(sq.repeat){const events=r.events;sq.run=makeRun(s,sq,q,at,r.round+1);sq.run.events=events;}else sq.run=null;return gain;
}
function step(s:State,sq:Squad){
 const r=sq.run!,q=quests.find(q=>q.id===r.quest)!,at=r.nextAt;
 if(r.phase==='rest'){r.hp=r.maxHp;configureTarget(r,q);r.phase='move';r.phaseAt=at;schedule(s,sq,r,at);event(r,at,'heal','ひと休みして、もう一度。');return null;}
 const k=encounter(q,r.node);
 if(r.phase==='move'){r.phase='work';event(r,at,'move',targetName(q,r.node)+'を発見！');}
 // Each companion and the enemy have independent clocks. A slow companion never blocks another.
 for(const actor of r.actors){if(actor.nextAt!==at)continue;
  const hero=actor.hero,ms=memberStats(s,hero),ix=k==='battle'?2:k==='gather'?0:1;
  const bond=activeBonds(sq.members).reduce((v,b)=>v+b.bonus,0);
  const damage=Math.max(1,Math.round(2+ms[ix]*.23+bond*.1));
  r.target=Math.max(0,r.target-damage);r.hits++;actor.nextAt+=actor.period;
  event(r,at,k==='battle'?'hit':'gather',heroes.find(h=>h.id===hero)!.name+(k==='battle'?'の攻撃':'が作業中'),damage,hero);
  if(hero==='mira'&&r.hp<r.maxHp){const heal=5+level(s.xp.mira||0);r.hp=Math.min(r.maxHp,r.hp+heal);event(r,at,'heal','ミラの癒やし',heal,hero);}
  if(r.target<=0)return completeNode(s,sq,q,at);
 }
 if(r.enemyAt===at){r.enemyAt+=1450;if(k==='battle'){const hurt=Math.max(1,Math.round(q.need*.24-stats(s,sq)[1]*.05));r.hp=Math.max(0,r.hp-hurt);event(r,at,'hurt','魔物の攻撃',hurt);}}
 if(r.hp<=0){r.phase='rest';r.phaseAt=at;r.nextAt=at+15000;event(r,at,'rest','いったん退いて回復中。応援で立て直そう。');}
 else r.nextAt=Math.min(...r.actors.map(a=>a.nextAt),r.enemyAt);
 return null;
}
export function settle(input:State,now:number){const s=structuredClone(input);const elapsed=Math.max(0,now-s.updatedAt);const end=s.updatedAt+Math.min(elapsed,43200000);const rewards:Rewards={count:0,gold:0,xp:0,herbs:0,ore:0,offline:elapsed>90000,capped:elapsed>43200000};
 for(const sq of s.squads){let count=0;while(sq.run&&sq.run.nextAt<=end){const gain=step(s,sq);if(gain){count++;rewards.count++;rewards.gold+=gain.gold;rewards.xp+=gain.xp;rewards.herbs+=gain.herbs;rewards.ore+=gain.ore;}}if(count)addLog(s,`${sq.name}が ${count} 件の依頼を達成。報酬を受け取りました。`,end);
 if(sq.run){if(rewards.capped){const shift=elapsed-43200000;sq.run.nextAt+=shift;sq.run.phaseAt+=shift;sq.run.started+=shift;sq.run.energyAt+=shift;sq.run.enemyAt+=shift;for(const a of sq.run.actors){a.nextAt+=shift;a.arrivesAt+=shift;}sq.run.events=[];}}}
 s.updatedAt=Math.max(now,s.updatedAt);return {state:s,rewards};}
export function migrate(raw:State|V2State|LegacyState,now:number):State{
 if(raw.version===3)return raw;
 const old=settleV2(migrateV2(raw,now),now).state;
 const s:State={...old,version:3,squads:old.squads.map(sq=>({...sq,run:null}))};
 for(let i=0;i<old.squads.length;i++){const run=old.squads[i].run;if(run){const q=quests.find(q=>q.id===run.quest)!;s.squads[i].run=makeRun(s,s.squads[i],q,now,run.round);}}
 addLog(s,'これまでの記録を引き継ぎました。',now);return s;
}
export function testState(now:number,clears:number,lv:number,gold:number):State{
 const s=initialState(now);s.clears=Math.min(1000,Math.max(0,Math.floor(clears)));s.gold=Math.min(10000000,Math.max(0,Math.floor(gold)));s.herbs=s.ore=s.clears*15;
 s.owned=heroes.filter(h=>h.unlock<=s.clears).map(h=>h.id);for(const id of s.owned)s.xp[id]=30*(Math.min(50,Math.max(1,Math.floor(lv)))-1)**2;
 s.log=[{at:now,text:'テスト用の冒険。普段の記録には影響しません。'}];return s;
}
export type Action={type:'start'|'stop'|'party'|'recruit'|'gear'|'camp'|'daily'|'repeat'|'assist'|'newSquad'|'sync';squad?:string;id?:string;members?:string[];value?:boolean;mode?:'strike'|'heal'};
export function act(input:State,a:Action,now:number){const s=structuredClone(input);const sq=s.squads.find(p=>p.id===a.squad)||s.squads[0];if(a.squad&&!s.squads.some(p=>p.id===a.squad))throw Error('パーティが見つかりません。');
 switch(a.type){case 'sync':break;
 case 'start':{if(sq.run)throw Error('この隊は冒険中です。');const q=quests.find(q=>q.id===a.id);if(!q||s.clears<q.unlock)throw Error('この依頼はまだ見つかっていません。');if(sq.members.length<1)throw Error('仲間を1人以上編成してください。');sq.run=makeRun(s,sq,q,now);addLog(s,`${sq.name}が「${q.name}」に出発。`,now);break;}
 case 'stop':sq.run=null;addLog(s,`${sq.name}が帰還。達成済みの報酬は持ち帰りました。`,now);break;
 case 'party':{if(sq.run)throw Error('帰還してから編成を変更できます。');const ids=a.members;if(!Array.isArray(ids)||ids.length<1||ids.length>Math.max(memberLimit(s),sq.members.length)||new Set(ids).size!==ids.length||!ids.every(id=>s.owned.includes(id)))throw Error('編成する仲間を確認してください。');if(s.squads.some(p=>p.id!==sq.id&&p.members.some(id=>ids.includes(id))))throw Error('他の隊の仲間は、その隊の編成から外してください。');sq.members=ids;break;}
 case 'repeat':if(typeof a.value!=='boolean')throw Error('設定を確認してください。');sq.repeat=a.value;break;
 case 'newSquad':{if(s.squads.length>=squadLimit(s))throw Error('仲間が4人で2隊、6人で3隊を編成できます。');const id=s.owned.find(id=>s.squads.every(p=>!p.members.includes(id)));if(!id)throw Error('待機中の仲間を1人用意してください。');const n=s.squads.length+1;s.squads.push({id:`party-${n}`,name:n===2?'木漏れ日の隊':'星渡りの隊',members:[id],repeat:true,run:null});break;}
 case 'assist':{const r=sq.run;if(!r)throw Error('冒険中に応援できます。');r.hits++;
 if(a.mode==='heal'){const heal=Math.max(3,Math.ceil(r.maxHp*.025));r.hp=Math.min(r.maxHp,r.hp+heal);if(r.phase==='rest'){r.phase='move';r.phaseAt=now;configureTarget(r,quests.find(q=>q.id===r.quest)!);schedule(s,sq,r,now);}event(r,now,'heal','団長の応援で回復！',heal);}
 else {if(r.phase==='rest')throw Error('回復で立て直しましょう。');const q=quests.find(q=>q.id===r.quest)!;const hit=Math.max(2,Math.round(2+s.gear+stats(s,sq)[q.kind==='採取'?0:q.kind==='護衛'?1:2]*.035));r.target=Math.max(0,r.target-hit);event(r,now,'assist','団長の手助け！',hit);if(r.target<=0){const gain=completeNode(s,sq,q,now);if(gain)addLog(s,sq.name+'が「'+q.name+'」を達成！ +'+gain.gold+' G',now);}}
 break;}
 case 'recruit':{const h=heroes.find(h=>h.id===a.id);if(!h||s.owned.includes(h.id)||s.clears<h.unlock||s.gold<h.price)throw Error('加入条件かお金を確認してください。');s.gold-=h.price;s.owned.push(h.id);addLog(s,`${h.name}が仲間になりました。`,now);break;}
 case 'gear':{const cost=100*(s.gear+1),ore=5*(s.gear+1);if(s.clears<3||s.gear>=15||s.gold<cost||s.ore<ore)throw Error('お金か鉱石が足りません。');s.gold-=cost;s.ore-=ore;s.gear++;break;}
 case 'camp':{const cost=150*(s.camp+1),herbs=12*(s.camp+1);if(s.clears<10||s.camp>=10||s.gold<cost||s.herbs<herbs)throw Error('お金か薬草が足りません。');s.gold-=cost;s.herbs-=herbs;s.camp++;break;}
 case 'daily':{const day=new Date(now).toISOString().slice(0,10);if(s.clears<3||s.lastDaily===day)throw Error('今日の差し入れは受取済みです。');s.lastDaily=day;s.gold+=80;s.herbs+=5;break;}
 default:throw Error('操作を確認してください。');}return s;}
