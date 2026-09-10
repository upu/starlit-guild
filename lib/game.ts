import {recruitments,recruitmentByHero,canPrepare,prepared,type RecruitmentProgress} from './recruitment.ts';
import {chachaHero} from './original-characters.ts';
import {migrate as migrateV3,type State as V3State} from './game-v3.ts';
import {availableStories,coupleCombo,storyProgress,together,type StoryProgress} from './stories.ts';
import {type State as V2State} from './game-v2.ts';
import {heroes as baseHeroes,quests as baseQuests,bonds,level,type State as LegacyState} from './game-v1.ts';
export {bonds,level};
export type Kind='採取'|'護衛'|'討伐';
// price remains legacy profile metadata; recruitment recipes are defined in recruitment.ts.
export const heroes=[...baseHeroes.map((h,i)=>({...h,sprite:i,unlock:i<2?0:recruitments.find(r=>r.hero===h.id)!.unlock,price:[0,0,100,220,450,700,950,1300][i]})),chachaHero];
export type Quest=typeof baseQuests[number]&{unlock:number;enemy:number;enemyName?:string;companion?:string;background?:string;gatherTarget?:string;escortTarget?:string};
export const quests:Quest[]=([...baseQuests.map((q,i)=>({...q,gold:q.gold*5,xp:q.xp*5,herbs:q.herbs*5,ore:q.ore*5,unlock:[0,2,4,10,15,20,35,45,60][i],enemy:i===8?10:i>=3?9:8})),
 {id:'midnight-snack',name:'その耳はおやつじゃない',kind:'討伐',region:'かぼちゃ灯りの森',desc:'マッドハロウィンのメリルが、森じゅうを試食中。魔物を食べるのはともかく、旅人や小動物まで献立に入れるのは止めなくては。腕の琴の音が近づいてくる。',tier:1,need:48,seconds:180,gold:420,xp:140,herbs:15,ore:15,unlock:5,enemy:12,enemyName:'メリルのつまみ食い行進',background:'/forest.png'},
 {id:'puppet-midnight',name:'消灯、人形たちの時間',kind:'討伐',region:'マッドハロウィンの古い舞台',desc:'夜目のきくプティが灯りを消し、人形で道標をすり替えた。八重歯の笑顔に釣られず、ドールマスターの糸を追っていたずらを止めよう。',tier:2,need:82,seconds:240,gold:850,xp:280,herbs:10,ore:45,unlock:12,enemy:13,enemyName:'プティといたずら人形',background:'/ruins.png'},
] satisfies Quest[]).sort((a,b)=>a.unlock-b.unlock);
export const recruitmentQuests:Quest[]=recruitments.map(r=>({...r.mission,id:'join-'+r.hero,companion:r.hero,unlock:r.unlock,seconds:600,gold:100*r.mission.tier,xp:100*r.mission.tier,herbs:0,ore:0}));
export const allQuests:Quest[]=[...quests,...recruitmentQuests];
export type Encounter='battle'|'gather'|'escort';
export type GameEvent={id:string;at:number;kind:'hit'|'gather'|'hurt'|'heal'|'clear'|'move'|'rest'|'assist'|'skill'|'combo'|'burst'|'discovery';text:string;amount?:number;hero?:string};
export type Actor={actions:number;hero:string;arrivesAt:number;nextAt:number;period:number};
export type Detour={node:number;kind:'chest'|'herb'|'spirit';hero:string;at:number;finishAt:number;claimed:boolean};
export type Scene={title:string;lines:string[];at:number;kind:'combo'|'burst'};
export type Run={serial:number;nodes:number;cheer:number;ward:number;comboAt:number;detour:Detour|null;scene:Scene|null;actors:Actor[];enemyAt:number;quest:string;round:number;node:number;phase:'move'|'work'|'rest';phaseAt:number;nextAt:number;started:number;hp:number;maxHp:number;target:number;targetMax:number;hits:number;energy:number;energyAt:number;events:GameEvent[]};
export type Squad={id:string;name:string;members:string[];repeat:boolean;run:Run|null};
export type State={version:4;recruitment?:RecruitmentProgress;story?:StoryProgress;wood:number;town:number;friendship:Record<string,number>;discoveries:number;gold:number;herbs:number;ore:number;owned:string[];xp:Record<string,number>;gear:number;camp:number;clears:number;done:Record<string,number>;claimed:string[];lastDaily:string;updatedAt:number;squads:Squad[];log:{text:string;at:number}[];receipts:string[]};
export type Rewards={count:number;gold:number;xp:number;herbs:number;ore:number;wood:number;offline:boolean;capped:boolean};
export function initialState(now:number):State{return {version:4,recruitment:{prepared:[]},story:{departed:[],completed:[],read:[]},wood:0,town:0,friendship:{},discoveries:0,gold:60,herbs:0,ore:0,owned:['aria','leon'],xp:{},gear:0,camp:0,clears:0,done:{},claimed:[],lastDaily:'',updatedAt:now,squads:[{id:'party-1',name:'はじまりの隊',members:['aria','leon'],repeat:true,run:null}],log:[{at:now,text:'アリアとレオン、ふたりの旅が始まった。'}],receipts:[]};}
export const activeBonds=(members:string[])=>bonds.filter(b=>b.ids.every(id=>members.includes(id)));
export function memberStats(s:State,id:string){const h=heroes.find(h=>h.id===id)!;return h.stats.map(v=>Math.round(v*(1+.1*(level(s.xp[id]||0)-1))*(1+.08*s.gear+(s.town>=2?.08:0))));}
export function stats(s:State,sq:Squad){return [0,1,2].map(i=>sq.members.reduce((v,id)=>v+memberStats(s,id)[i],0)+activeBonds(sq.members).reduce((v,b)=>v+b.bonus,0));}
export const power=(s:State,sq:Squad,q:Quest)=>stats(s,sq)[['採取','護衛','討伐'].indexOf(q.kind)];
export const memberLimit=(s:State)=>s.clears>=10?3:2;
export const squadLimit=(s:State)=>s.owned.length>=6?3:s.owned.length>=4?2:1;
export function encounter(q:Quest,node:number):Encounter{return q.kind==='採取'?(node%3===1?'battle':'gather'):q.kind==='護衛'?((q.companion?node%3:node)===1?'escort':'battle'):'battle';}
export function targetName(q:Quest,node:number){const k=encounter(q,node);return k==='gather'?(q.gatherTarget||(q.id==='crystal'?'青晶石':q.id==='blossom'?'千年樹の花':'月しずく草')):k==='escort'?(q.escortTarget||'旅人を目的地へ'):q.enemyName||(q.enemy===10?'星喰い竜':q.enemy===9?'霧狼':'スライム');}
export const stepMs=(s:State)=>Math.round(1050*(1-.035*s.camp));
export function estimate(s:State,sq:Squad,q:Quest){const relevant=Math.max(5,power(s,sq,q));return Math.round(5*(12+q.need*6.9/Math.max(3,2+relevant/Math.max(1,sq.members.length)*.23)*stepMs(s)/1000/Math.max(1,sq.members.length)));}
function addLog(s:State,text:string,at:number){s.log=[{text,at},...s.log].slice(0,40);}
function event(r:Run,at:number,kind:GameEvent['kind'],text:string,amount?:number,hero?:string){r.events=[...r.events,{id:`${r.round}-${r.node}-${at}-${kind}-${r.hits}-${hero||"leader"}-${++r.serial}`,at,kind,text,amount,hero}].slice(-12);}
function configureTarget(r:Run,q:Quest){r.targetMax=Math.round(q.need*1.12*(encounter(q,r.node)==='escort'?1.8:2.3));r.target=r.targetMax;r.hits=0;}
export function travelMs(id:string){return 2200+(heroes.findIndex(h=>h.id===id)%4)*310;}
function schedule(s:State,sq:Squad,r:Run,at:number){
 r.actors=sq.members.map(hero=>({hero,actions:0,arrivesAt:at+travelMs(hero),nextAt:at+travelMs(hero),period:Math.round(stepMs(s)*(0.8+(heroes.findIndex(h=>h.id===hero)%4)*.13))}));
 r.enemyAt=at+3700;if(r.comboAt<=at)r.comboAt=at+14500;
 const prior=r.detour;r.detour=prior?.node===r.node&&prior.claimed?prior:null;if(r.node%3===0&&!r.detour){const explorer=['finn','aria','poppy'].find(id=>sq.members.includes(id))||sq.members[0];const kind=(['chest','herb','spirit'] as const)[(r.round+Math.floor(r.node/3)+allQuests.findIndex(q=>q.id===r.quest))%3];r.detour={node:r.node,kind,hero:explorer,at:at+900,finishAt:at+(['finn','aria','poppy'].includes(explorer)?6200:8500),claimed:false};const actor=r.actors.find(a=>a.hero===explorer)!;actor.nextAt=r.detour.finishAt+200;}
 r.nextAt=nextEvent(r);
}
function makeRun(s:State,sq:Squad,q:Quest,at:number,round=1):Run{const maxHp=Math.round((80+stats(s,sq)[1]*2)*(s.town>=1?1.1:1));const r:Run={serial:0,nodes:15,cheer:0,ward:0,comboAt:at+14500,detour:null,scene:null,actors:[],enemyAt:at+3700,quest:q.id,round,node:0,phase:'move',phaseAt:at,nextAt:at+2200,started:at,hp:maxHp,maxHp,target:0,targetMax:0,hits:0,energy:3,energyAt:at,events:[]};configureTarget(r,q);schedule(s,sq,r,at);return r;}
function nextEvent(r:Run){return Math.min(...r.actors.map(a=>a.nextAt),r.enemyAt,r.comboAt,r.detour&&!r.detour.claimed?r.detour.finishAt:Infinity);}
export const heroSkills:Record<string,{style:string;name:string;description:string}>={
 aria:{style:'ranged',name:'風の二連矢',description:'離れて矢を放ち、3回ごとに二連射。寄り道も得意。'},
 leon:{style:'melee',name:'暁の踏み込み',description:'前線へ飛び込み、4回ごとに強力な斬撃。'},
 mira:{style:'healer',name:'月明かりの癒やし',description:'後方から支援し、仲間の体力を回復。'},
 finn:{style:'rogue',name:'影縫い',description:'素早く斬り込み、5回ごとに強撃。宝探しが得意。'},
 garr:{style:'tank',name:'守護の盾',description:'前線を支え、4回ごとに味方を守る障壁。'},
 luna:{style:'mage',name:'流星の一撃',description:'遠くから魔法を放ち、4回ごとに流星を落とす。'},
 poppy:{style:'gatherer',name:'豊穣の調合',description:'3回ごとの採取量が増え、薬で仲間も回復。'},
 noel:{style:'bard',name:'旅路の歌',description:'後方で歌い、3回ごとに障壁でみんなを支える。'},
 chacha:{style:'melee',name:'蒸らし三分、全力一振り',description:'前線で大剣を振り、4回ごとの攻撃は威力2倍。回復魔法より、鍛えた筋肉で押し通す。'}
};
export const bondKey=(ids:string[])=>[...ids].sort().join('-');
export const bondLevel=(s:State,ids:string[])=>Math.min(3,1+Math.floor((s.friendship[bondKey(ids)]||0)/12));
function discover(s:State,sq:Squad,at:number){const r=sq.run!,d=r.detour;if(!d||d.claimed)return;d.claimed=true;s.discoveries++;const q=allQuests.find(q=>q.id===r.quest)!;const wood=q.tier+1;s.wood+=wood;
 let amount=wood;let text='';if(d.kind==='chest'){amount=Math.ceil(q.gold*.035);s.gold+=amount;text='隠し宝箱！ +'+amount+' G';}else if(d.kind==='herb'){amount=2*q.tier;s.herbs+=amount;text='光る薬草を発見！ 薬草 +'+amount;}else{amount=Math.ceil(r.maxHp*.12);r.hp=Math.min(r.maxHp,r.hp+amount);r.ward+=Math.ceil(r.maxHp*.08);text='迷子の精霊がお礼に回復と加護をくれた。';}
 event(r,at,'discovery',text+' · 木材 +'+wood,undefined,d.hero);addLog(s,heroes.find(h=>h.id===d.hero)!.name+'：'+text,at);
}
function reward(s:State,sq:Squad,q:Quest,at:number,finished:boolean){const gold=Math.floor(q.gold/5*(sq.members.includes('finn')?1.1:1)*(sq.members.includes('noel')?1.1:1));const herbs=q.herbs/5+(s.town>=2?2:0),ore=q.ore/5,xp=q.xp/5,wood=q.tier+2;s.gold+=gold;s.herbs+=herbs;s.ore+=ore;s.wood+=wood;if(finished){s.story??=storyProgress(s);if(!q.companion&&together(sq.members)&&!s.story.completed.includes(q.id)){if(!s.story.departed.includes(q.id))s.story.departed.push(q.id);s.story.completed.push(q.id);}s.clears++;s.done[q.id]=(s.done[q.id]||0)+1;if(q.companion&&!s.owned.includes(q.companion)){s.owned.push(q.companion);s.xp[q.companion]??=0;addLog(s,heroes.find(h=>h.id===q.companion)!.name+'が、自分の意志で旅団の仲間になった。',at);}}for(const id of sq.members)s.xp[id]=(s.xp[id]||0)+xp;
 for(const bond of activeBonds(sq.members)){const key=bondKey(bond.ids);s.friendship[key]=(s.friendship[key]||0)+(s.town>=1?2:1);}
 return {gold,xp,herbs,ore,wood,at,finished};}
function completeNode(s:State,sq:Squad,q:Quest,at:number){const r=sq.run!;discover(s,sq,at);event(r,at,'clear',targetName(q,r.node)+'をクリア！');const finished=r.node===r.nodes-1;
 const gain=(r.node+1)%3===0||finished?reward(s,sq,q,at,finished):null;
 if(gain)event(r,at,'clear','区間の報酬を確保！ +'+gain.gold+' G · 木材 +'+gain.wood);
 if(!finished){r.node++;r.phase='move';r.phaseAt=at;r.hp=Math.min(r.maxHp,r.hp+r.maxHp*(s.town>=2?.2:.15));configureTarget(r,q);schedule(s,sq,r,at);return gain;}
 if(sq.repeat&&!q.companion){const {events,cheer,scene}=r;sq.run=makeRun(s,sq,q,at,r.round+1);sq.run.events=events;sq.run.cheer=cheer;sq.run.scene=scene;}else sq.run=null;return gain;
}
function combination(s:State,sq:Squad,at:number){const r=sq.run!,bs=activeBonds(sq.members);r.comboAt=at+14500;if(!bs.length)return;const b=bs[(r.node+r.round)%bs.length],lv=bondLevel(s,b.ids),q=allQuests.find(q=>q.id===r.quest)!,k=encounter(q,r.node);
 const lines=lv===1?b.lines:lv===2?[heroes.find(h=>h.id===b.ids[0])!.name+'「いつもの合図で、いくよ！」',heroes.find(h=>h.id===b.ids[1])!.name+'「息はぴったりだ！」']:[heroes.find(h=>h.id===b.ids[0])!.name+'「この先も、一緒に！」',heroes.find(h=>h.id===b.ids[1])!.name+'「どんな冒険だって！」'];
 r.scene={title:b.name+' · 連携 Lv.'+lv,lines:together(b.ids)?coupleCombo(s,r.node+r.round):lines,at,kind:'combo'};
 const damage=Math.round(r.targetMax*(.12+.035*lv));r.target=Math.max(0,r.target-damage);
 if(b.ids.includes('mira')){r.hp=Math.min(r.maxHp,r.hp+r.maxHp*.15);r.ward+=Math.ceil(r.maxHp*.08);}
 event(r,at,'combo',b.name+'！ '+(k==='battle'?'連携攻撃':'息の合った作業'),damage,b.ids[0]);
}
function cheer(s:State,sq:Squad,at:number){const r=sq.run!;r.cheer+=5;if(r.cheer<100)return;r.cheer-=100;const q=allQuests.find(q=>q.id===r.quest)!,k=encounter(q,r.node);r.scene={title:'全員必殺！ 星灯りの大応援',lines:['団長「みんな、今だ！」','仲間たち「任せて！」'],at,kind:'burst'};r.hp=Math.min(r.maxHp,r.hp+r.maxHp*.15);
 for(const hero of sq.members){const amount=Math.ceil(r.targetMax*.24+memberStats(s,hero)[k==='battle'?2:k==='gather'?0:1]*.4);r.target=Math.max(0,r.target-amount);event(r,at,'burst',heroes.find(h=>h.id===hero)!.name+'の必殺技！',amount,hero);}
}
function step(s:State,sq:Squad){
 const r=sq.run!,q=allQuests.find(q=>q.id===r.quest)!,at=r.nextAt;
 if(r.phase==='rest'){r.hp=r.maxHp;configureTarget(r,q);r.phase='move';r.phaseAt=at;schedule(s,sq,r,at);event(r,at,'heal','ひと休みして、もう一度。');return null;}
 const k=encounter(q,r.node);
 if(r.detour&&!r.detour.claimed&&r.detour.finishAt===at)discover(s,sq,at);
 if(r.comboAt===at){combination(s,sq,at);if(r.target<=0)return completeNode(s,sq,q,at);}
 if(r.phase==='move'){r.phase='work';event(r,at,'move',targetName(q,r.node)+'を発見！');}
 // Each companion and the enemy have independent clocks. A slow companion never blocks another.
 for(const actor of r.actors){if(actor.nextAt!==at)continue;
  const hero=actor.hero,ms=memberStats(s,hero),ix=k==='battle'?2:k==='gather'?0:1;
  const bond=activeBonds(sq.members).reduce((v,b)=>v+b.bonus,0);
  actor.actions++;const special=actor.actions%(hero==='aria'||hero==='poppy'||hero==='noel'?3:hero==='finn'?5:4)===0;
  const multiplier=special?(hero==='luna'?2.2:hero==='chacha'&&k==='battle'?2:hero==='leon'?1.7:hero==='aria'||hero==='finn'?1.65:hero==='poppy'&&k==='gather'?1.75:1):1;
  const damage=Math.max(1,Math.round((2+ms[ix]*.23+bond*.1)*multiplier));
  r.target=Math.max(0,r.target-damage);r.hits++;actor.nextAt+=actor.period;
  event(r,at,special?'skill':k==='battle'?'hit':'gather',heroes.find(h=>h.id===hero)!.name+'：'+(special?heroSkills[hero].name:k==='battle'?'攻撃':'採取・護衛'),damage,hero);
  if(special&&(hero==='garr'||hero==='noel')){r.ward+=Math.ceil(r.maxHp*(hero==='garr'?.12:.06));event(r,at,'skill',heroSkills[hero].name+'！ 障壁を展開',undefined,hero);}
  if((hero==='mira'||hero==='poppy'&&special)&&r.hp<r.maxHp){const heal=5+level(s.xp[hero]||0);r.hp=Math.min(r.maxHp,r.hp+heal);event(r,at,'heal',heroSkills[hero].name,heal,hero);}
  if(r.target<=0)return completeNode(s,sq,q,at);
 }
 if(r.enemyAt===at){r.enemyAt+=1450;if(k==='battle'){const hurt=Math.max(1,Math.round(q.need*.24-stats(s,sq)[1]*.05));const blocked=Math.min(r.ward,hurt);r.ward-=blocked;r.hp=Math.max(0,r.hp-hurt+blocked);event(r,at,'hurt',blocked?'障壁で攻撃を軽減':q.enemy===12?'メリルが踊りながらかじりつく！':q.enemy===13?'プティの人形が糸を引いて飛びかかる！':'魔物の攻撃',hurt-blocked);}}
 if(r.hp<=0){r.phase='rest';r.phaseAt=at;r.nextAt=at+15000;event(r,at,'rest','いったん退いて回復中。応援で立て直そう。');}
 else r.nextAt=nextEvent(r);
 return null;
}
export function settle(input:State,now:number){const s=structuredClone(input);const elapsed=Math.max(0,now-s.updatedAt);const end=s.updatedAt+Math.min(elapsed,43200000);const rewards:Rewards={count:0,gold:0,xp:0,herbs:0,ore:0,wood:0,offline:elapsed>90000,capped:elapsed>43200000};
 for(const sq of s.squads){let count=0;while(sq.run&&sq.run.nextAt<=end){const gain=step(s,sq);if(gain){if(gain.finished){count++;rewards.count++;}rewards.gold+=gain.gold;rewards.xp+=gain.xp;rewards.herbs+=gain.herbs;rewards.ore+=gain.ore;rewards.wood+=gain.wood;}}if(count)addLog(s,`${sq.name}が ${count} 件の依頼を達成。報酬を受け取りました。`,end);
 if(sq.run){if(rewards.capped){const shift=elapsed-43200000;sq.run.nextAt+=shift;sq.run.phaseAt+=shift;sq.run.started+=shift;sq.run.energyAt+=shift;sq.run.enemyAt+=shift;sq.run.comboAt+=shift;if(sq.run.detour){sq.run.detour.at+=shift;sq.run.detour.finishAt+=shift;}sq.run.scene=null;for(const a of sq.run.actors){a.nextAt+=shift;a.arrivesAt+=shift;}sq.run.events=[];}}}
 s.updatedAt=Math.max(now,s.updatedAt);rewards.gold=s.gold-input.gold;rewards.herbs=s.herbs-input.herbs;rewards.ore=s.ore-input.ore;rewards.wood=s.wood-input.wood;return {state:s,rewards};}
export function migrate(raw:State|V3State|V2State|LegacyState,now:number):State{
 if(raw.version===4)return raw;
 const old=migrateV3(raw,now);const s:State={...structuredClone(old),version:4,wood:0,town:0,friendship:{},discoveries:0,squads:old.squads.map(sq=>({...sq,run:sq.run?{...structuredClone(sq.run),serial:0,nodes:3,cheer:0,ward:0,comboAt:Math.max(old.updatedAt,sq.run.nextAt)+14500,detour:null,scene:null,actors:sq.run.actors.map(a=>({...a,actions:0}))}:null}))};
 addLog(s,'寄り道と連携技が登場！ 次の周回から15地点の長い冒険になります。',now);return s;
}
export function testState(now:number,clears:number,lv:number,gold:number):State{
 const s=initialState(now);s.clears=Math.min(1000,Math.max(0,Math.floor(clears)));s.gold=Math.min(10000000,Math.max(0,Math.floor(gold)));s.herbs=s.ore=s.clears*15;s.wood=s.clears*15;s.town=s.clears>=20?2:s.clears>=3?1:0;
 s.owned=heroes.filter(h=>h.unlock<=s.clears).map(h=>h.id);for(const id of s.owned)s.xp[id]=30*(Math.min(50,Math.max(1,Math.floor(lv)))-1)**2;
 s.log=[{at:now,text:'テスト用の冒険。普段の記録には影響しません。'}];return s;
}
export type Action={type:'start'|'stop'|'party'|'recruit'|'gear'|'camp'|'daily'|'repeat'|'assist'|'newSquad'|'sync'|'detour'|'build'|'readStory'|'prepareRecruitment';squad?:string;id?:string;members?:string[];value?:boolean;mode?:'strike'|'heal';readDeparture?:boolean};
export function act(input:State,a:Action,now:number){const s=structuredClone(input);const sq=s.squads.find(p=>p.id===a.squad)||s.squads[0];if(a.squad&&!s.squads.some(p=>p.id===a.squad))throw Error('パーティが見つかりません。');
 switch(a.type){case 'sync':break;
 case 'start':{if(sq.run)throw Error('この隊は冒険中です。');const q=allQuests.find(q=>q.id===a.id);if(!q||s.clears<q.unlock)throw Error('この依頼はまだ見つかっていません。');if(sq.members.length<1)throw Error('仲間を1人以上編成してください。');if(q.companion){if(s.owned.includes(q.companion)||!prepared(s,q.companion))throw Error('出会いの画面で、専用クエストの支度をしてください。');if(s.squads.some(p=>p.run?.quest===q.id))throw Error('この専用クエストは、別の隊が冒険中です。');}s.story??=storyProgress(s);if(!q.companion&&together(sq.members)&&!s.story.departed.includes(q.id))s.story.departed.push(q.id);if(typeof a.value==='boolean')sq.repeat=a.value;sq.run=makeRun(s,sq,q,now);if(a.readDeparture){const st=availableStories(s).find(st=>st.quest===q.id&&st.chapter==='departure');if(st&&!s.story.read.includes(st.id))s.story.read.push(st.id);}addLog(s,`${sq.name}が「${q.name}」に出発。`,now);break;}
 case 'readStory':{if(!availableStories(s).some(st=>st.id===a.id))throw Error('この思い出は、まだ開かれていません。');s.story??=storyProgress(s);if(!s.story.read.includes(a.id!))s.story.read.push(a.id!);break;}
 case 'stop':sq.run=null;addLog(s,`${sq.name}が帰還。達成済みの報酬は持ち帰りました。`,now);break;
 case 'party':{if(sq.run)throw Error('帰還してから編成を変更できます。');const ids=a.members;if(!Array.isArray(ids)||ids.length<1||ids.length>Math.max(memberLimit(s),sq.members.length)||new Set(ids).size!==ids.length||!ids.every(id=>s.owned.includes(id)))throw Error('編成する仲間を確認してください。');if(s.squads.some(p=>p.id!==sq.id&&p.members.some(id=>ids.includes(id))))throw Error('他の隊の仲間は、その隊の編成から外してください。');sq.members=ids;break;}
 case 'repeat':if(typeof a.value!=='boolean')throw Error('設定を確認してください。');sq.repeat=a.value;break;
 case 'newSquad':{if(s.squads.length>=squadLimit(s))throw Error('仲間が4人で2隊、6人で3隊を編成できます。');const id=s.owned.find(id=>s.squads.every(p=>!p.members.includes(id)));if(!id)throw Error('待機中の仲間を1人用意してください。');const n=s.squads.length+1;s.squads.push({id:`party-${n}`,name:n===2?'木漏れ日の隊':'星渡りの隊',members:[id],repeat:true,run:null});break;}
 case 'assist':{const r=sq.run;if(!r)throw Error('冒険中に応援できます。');r.hits++;
 if(a.mode==='heal'){const heal=Math.max(3,Math.ceil(r.maxHp*.025));r.hp=Math.min(r.maxHp,r.hp+heal);if(r.phase==='rest'){r.phase='move';r.phaseAt=now;configureTarget(r,allQuests.find(q=>q.id===r.quest)!);schedule(s,sq,r,now);}event(r,now,'heal','団長の応援で回復！',heal);}
 else {if(r.phase==='rest')throw Error('回復で立て直しましょう。');const q=allQuests.find(q=>q.id===r.quest)!;const hit=Math.max(2,Math.round(2+s.gear+stats(s,sq)[q.kind==='採取'?0:q.kind==='護衛'?1:2]*.035));r.target=Math.max(0,r.target-hit);event(r,now,'assist','団長の手助け！',hit);}
 cheer(s,sq,now);if(r.target<=0){const q=allQuests.find(q=>q.id===r.quest)!;const gain=completeNode(s,sq,q,now);if(gain)addLog(s,sq.name+'が区間の報酬を確保！ +'+gain.gold+' G',now);}break;}
 case 'detour':{const r=sq.run,d=r?.detour;if(!r||!d||d.claimed||now<d.at||r.phase==='rest')throw Error('寄り道を見つけたら指示できます。');d.finishAt=Math.min(d.finishAt,now+700);const helper=r.actors.find(a=>a.hero===d.hero)!;helper.nextAt=Math.min(helper.nextAt,d.finishAt+500);r.nextAt=nextEvent(r);break;}
 case 'build':{const cost=s.town===0?{gold:120,wood:12,ore:0,herbs:0,clears:1}:{gold:600,wood:60,ore:12,herbs:20,clears:3};if(s.town>=2||s.clears<cost.clears||s.gold<cost.gold||s.wood<cost.wood||s.ore<cost.ore||s.herbs<cost.herbs)throw Error('建設に必要な材料か達成数が足りません。');s.gold-=cost.gold;s.wood-=cost.wood;s.ore-=cost.ore;s.herbs-=cost.herbs;s.town++;addLog(s,s.town===1?'酒場が完成！ 仲間たちの帰る場所ができた。':'鍛冶場と薬草園が完成！ 拠点に暮らしが広がった。',now);break;}
 case 'recruit':throw Error('仲間は専用クエストの達成で加入します。「新しい出会い」から支度しましょう。');
 case 'prepareRecruitment':{const r=recruitmentByHero(a.id||'');if(!r||!canPrepare(s,r))throw Error('出会いの条件と必要な資材を確認してください。');for(const key of ['gold','wood','herbs','ore'] as const)s[key]-=r.cost[key];(s.recruitment??={prepared:[]}).prepared.push(r.hero);addLog(s,r.name+'との専用クエスト「'+r.mission.name+'」の支度が整った。',now);break;}
 case 'gear':{const cost=100*(s.gear+1),ore=5*(s.gear+1);if(s.clears<3||s.gear>=15||s.gold<cost||s.ore<ore)throw Error('お金か鉱石が足りません。');s.gold-=cost;s.ore-=ore;s.gear++;break;}
 case 'camp':{const cost=150*(s.camp+1),herbs=12*(s.camp+1);if(s.clears<10||s.camp>=10||s.gold<cost||s.herbs<herbs)throw Error('お金か薬草が足りません。');s.gold-=cost;s.herbs-=herbs;s.camp++;break;}
 case 'daily':{const day=new Date(now).toISOString().slice(0,10);if(s.clears<3||s.lastDaily===day)throw Error('今日の差し入れは受取済みです。');s.lastDaily=day;s.gold+=80;s.herbs+=5;break;}
 default:throw Error('操作を確認してください。');}return s;}
