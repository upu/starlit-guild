import {allQuests,heroes,heroSkills,travelMs,encounter,targetName,type Squad,type Action,type GameEvent} from './game.ts';
import {originalArt} from './original-characters.ts';
import {questScenery} from './scenery.ts';
import {heroSheets} from './hero-animation.ts';
import {isPrologueQuest,RESTORATION_QUEST} from './prologue.ts';
import {chapterTwoEnemyAsset,chapterTwoGolem} from './chapter-two.ts';

export type AdventureInput={squad:Squad;startQuest:string;now:number;ready:boolean;paused:boolean;detours?:boolean;restorationComplete?:boolean};
export type Point={x:number;y:number};
export type AdventureIntent='help'|'heal'|'detour'|`heal:${string}`;
const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));
// Mira's map figure follows her character reference; dialogue portraits stay independent.
export const spriteAsset=(index:number)=>index===2?'/animations/mira-v1.png':originalArt(index)||'/sprites.png';
export const spriteFrame=(index:number)=>index===2?'8':spriteAsset(index)==='/sprites.png'?String(index):undefined;
type ActiveRun=NonNullable<Squad['run']>;
function recentEvents(run:ActiveRun|null,now:number){return run?run.events.filter(e=>e.id.startsWith(`${String(run.round)}-${String(run.node)}-`)&&now>=e.at&&now-e.at<1000).slice(-8):[];}
function memberTarget(role:string,index:number){const front=['melee','tank','rogue'].includes(role);return {x:Math.min(.57,.20+index*.09+(front?.18:0)),y:.61+(index%2)*.09};}
function memberPosition(squad:Squad,run:ActiveRun|null,target:Point,id:string,index:number,now:number){
 const progress=run?clamp((now-run.phaseAt)/travelMs(id)):1;
 const x=run?target.x-.17*(1-progress):squad.members.length===1?.5:.30+index*.40/Math.max(1,squad.members.length-1);
 const y=run?target.y+.08*(1-progress):.65+(index%2)*.03;
 return {x,y};
}
function explorationPosition(input:AdventureInput,run:ActiveRun|null,id:string,now:number,position:Point){
 const detour=input.detours===false?null:run?.detour;
 if(!run||!detour||detour.hero!==id||detour.node!==run.node||detour.claimed||now<detour.at||run.phase==='rest')return {...position,exploring:false};
 const t=clamp((now-detour.at)/1400);return {x:position.x+(.54-position.x)*t,y:position.y+(.82-position.y)*t,exploring:true};
}
function memberVitals(run:ActiveRun|null,id:string){
 if(!run)return {hp:0,maxHp:1,health:1,down:false};
 const health=run.health[id];return {hp:health.hp,maxHp:health.maxHp,health:clamp(health.hp/health.maxHp),down:health.hp<=0};
}
function adventureMember(input:AdventureInput,run:ActiveRun|null,events:GameEvent[],now:number,id:string,index:number){
 const hero=heroes.find(h=>h.id===id),skill=heroSkills[id];if(!hero)throw Error(`仲間「${id}」の冒険表示を読み込めません。`);
 const actor=run?.actors.find(a=>a.hero===id),lastHit=events.filter(e=>e.hero===id&&['hit','gather','skill','burst','heal'].includes(e.kind)).at(-1);
 const age=lastHit?now-lastHit.at:Infinity,attack=age<650?Math.sin(age/650*Math.PI):0,target=memberTarget(skill.style,index);
 const position=explorationPosition(input,run,id,now,memberPosition(input.squad,run,target,id,index,now)),vitals=memberVitals(run,id);
 return {id,name:hero.name,sprite:hero.sprite,role:skill.style,x:position.x,y:position.y,walking:!!run&&run.phase!=='rest'&&!vitals.down&&now<(actor?.arrivesAt||0),exploring:position.exploring,attack:position.exploring||vitals.down?0:attack,hit:lastHit,...vitals};
}
function frameDiscovery(input:AdventureInput,run:ActiveRun|null,now:number){
 const detour=input.detours===false?null:run?.detour;
 return detour&&detour.node===run?.node&&now>=detour.at&&(!detour.claimed||now-detour.finishAt<1000)?{...detour,x:.72,y:.84}:null;
}
function frameCutin(run:ActiveRun|null,now:number){return run?.scene&&now>=run.scene.at&&now-run.scene.at<(run.scene.kind==='burst'?1900:2600)?run.scene:null;}
function targetAsset(quest:(typeof allQuests)[number],run:ActiveRun,kind:ReturnType<typeof encounter>|null,sprite:number){
 const enemyArt=kind==='battle'?chapterTwoEnemyAsset(quest.id,run.node):null;
 if(enemyArt)return enemyArt;
 if(kind==='escort')return quest.escortAsset||(isPrologueQuest(quest.id)?'/items/chest.png':spriteAsset(sprite));
 return spriteAsset(sprite);
}
function frameTarget(quest:(typeof allQuests)[number],run:ActiveRun|null,kind:ReturnType<typeof encounter>|null){
 if(!run)return null;
 const targetSprite=kind==='gather'?11:kind==='escort'?7:quest.enemy;
 return {id:'legacy-target',x:.80,y:.61,scale:chapterTwoGolem(quest.id,run.node)?1.6:1.08,down:false,hp:run.target,maxHp:run.targetMax,sprite:targetSprite,asset:targetAsset(quest,run,kind,targetSprite),name:targetName(quest,run.node),value:clamp((kind==='battle'?run.target:run.targetMax-run.target)/run.targetMax),battle:kind==='battle',kind};
}
function frameTargets(quest:(typeof allQuests)[number],run:ActiveRun|null,kind:ReturnType<typeof encounter>|null){
 const base=frameTarget(quest,run,kind);if(!base)return [];
 const enemies=run?.enemies;if(!enemies?.length)return [base];
 const positions=enemies.length===2?[{x:.77,y:.49},{x:.82,y:.76}]:[{x:.73,y:.43},{x:.86,y:.63},{x:.72,y:.83}];
 return enemies.map((enemy,index)=>{
  const multiple=enemies.length>1,name=multiple?(quest.enemy===9?'霧狼':'スライム')+' '+String.fromCharCode(65+index):base.name;
  return {...base,...(multiple?positions[index]:{}),id:enemy.id,name,scale:multiple?.65:base.scale,hp:enemy.hp,maxHp:enemy.maxHp,down:enemy.hp<=0,value:clamp(enemy.hp/enemy.maxHp)};
 });
}

// Presentation is a read-only projection. Only lib/game advances time or awards loot.
export function adventureFrame(input:AdventureInput,now=input.now){
 const {squad}=input,run=squad.run;
 const quest=allQuests.find(q=>q.id===(run?.quest||input.startQuest))||allQuests[0];
 const kind=run?encounter(quest,run.node):null;
 const key=run?`${squad.id}:${String(run.started)}:${quest.id}:${String(run.round)}:${String(run.node)}`:`${squad.id}:idle:${quest.id}`;
 const events=recentEvents(run,now),members=squad.members.map((id,index)=>adventureMember(input,run,events,now,id,index));
 const discovery=frameDiscovery(input,run,now),cutin=frameCutin(run,now),targets=frameTargets(quest,run,kind),target=targets.find(target=>!target.down)??targets.at(0)??null;
 const drained=quest.id===RESTORATION_QUEST&&(run?run.node>=9:input.restorationComplete);
 return {key,quest,background:drained?'/stages/tower-drainage-open.png':questScenery(quest),phase:run?.phase||'idle',members,target,targets,discovery,events,cutin,ward:run?.ward||0};
}
export type AdventureFrame=ReturnType<typeof adventureFrame>;
export function memberHealthLabel(member:Pick<AdventureFrame['members'][number],'name'|'down'>){return member.down?`${member.name} · 戦闘不能`:member.name;}

export function adventureAction(input:AdventureInput,intent:AdventureIntent,now=input.now):Action|null{
 const run=input.squad.run;
 if(!input.ready||input.paused||!run)return null;
 if(intent==='detour')return detourAction(input,run,now);
 const healing=intent==='heal'||intent.startsWith('heal:')||run.phase==='rest';if(!healing)return {type:'assist',squad:input.squad.id,mode:'strike'};
 const requested=intent.startsWith('heal:')?intent.slice(5):undefined,target=requested||[...input.squad.members].sort((a,b)=>run.health[a].hp/run.health[a].maxHp-run.health[b].hp/run.health[b].maxHp).find(id=>run.health[id].hp<run.health[id].maxHp);
 if(!target||!input.squad.members.includes(target)||run.health[target].hp>=run.health[target].maxHp)return null;
 return {type:'assist',squad:input.squad.id,mode:'heal',id:target};
}
function detourAction(input:AdventureInput,run:ActiveRun,now:number):Action|null{
 if(input.detours===false)return null;
 const detour=run.detour;if(!detour||detour.node!==run.node||detour.claimed||now<detour.at||run.phase==='rest')return null;
 return {type:'detour',squad:input.squad.id};
}

export function adventureAssets(frame:AdventureFrame){
 const assets=new Set(['/sprites.png',frame.background,'/items/chest.png','/items/herb.png','/items/spirit.png']);
 for(const m of frame.members){assets.add(spriteAsset(m.sprite));const sheet=heroSheets[m.id];if(sheet?.ready)assets.add(sheet.asset);}
 if(frame.target)assets.add(frame.target.asset);
 if(frame.quest.companion){const guest=heroes.find(h=>h.id===frame.quest.companion);if(guest)assets.add(spriteAsset(guest.sprite));}
 return [...assets];
}

export function spriteSize(width:number,height:number,idle=false){
 return Math.min(idle?174:142,Math.max(idle?110:82,width*(idle?.24:.20)),height*.35);
}
export function adventureHit(frame:AdventureFrame,point:Point,width:number,height:number):AdventureIntent{
 const size=spriteSize(width,height,frame.phase==='idle');
 // Match canvas visual bounds. Discoveries and companions win over the scenery.
 const contains=(x:number,y:number,w:number,h:number)=>Math.abs(point.x-x*width)<w/2&&point.y>y*height-h*.9&&point.y<y*height+h*.22;
 if(frame.discovery&&contains(frame.discovery.x,frame.discovery.y,64,64))return 'detour';
 for(const member of [...frame.members].reverse())if(contains(member.x,member.y,size*.8,size))return `heal:${member.id}`;
 return 'help';
}

export function eventColor(event:GameEvent){
 if(event.kind==='heal')return 0x9ff0c2;
 if(event.kind==='hurt')return 0xf1a18c;
 if(event.kind==='burst'||event.kind==='combo')return 0xffdf83;
 const role=event.hero?heroSkills[event.hero].style:'';
 return role==='mage'?0xc4b1ff:role==='ranged'?0xc9f9ac:role==='bard'?0xf1b6db:0xffe9b3;
}
