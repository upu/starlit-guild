import {allQuests,heroes,heroSkills,travelMs,encounter,targetName,type Squad,type Action,type GameEvent} from './game.ts';
import {originalArt} from './original-characters.ts';
import {questScenery} from './scenery.ts';
import {heroSheets} from './hero-animation.ts';
import {isPrologueQuest} from './prologue.ts';

export type AdventureInput={squad:Squad;startQuest:string;now:number;ready:boolean;paused:boolean;detours?:boolean};
export type Point={x:number;y:number};
export type AdventureIntent='help'|'heal'|'detour';
const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));
export const spriteAsset=(index:number)=>originalArt(index)||'/sprites.png';

// Presentation is a read-only projection. Only lib/game advances time or awards loot.
export function adventureFrame(input:AdventureInput,now=input.now){
 const {squad}=input,run=squad.run;
 const quest=allQuests.find(q=>q.id===(run?.quest||input.startQuest))||allQuests[0];
 const kind=run?encounter(quest,run.node):null;
 const key=run?`${squad.id}:${String(run.started)}:${quest.id}:${String(run.round)}:${String(run.node)}`:`${squad.id}:idle:${quest.id}`;
 const events=run?run.events.filter(e=>e.id.startsWith(`${String(run.round)}-${String(run.node)}-`)&&now>=e.at&&now-e.at<1000).slice(-8):[];
 const members=squad.members.map((id,i)=>{
  const hero=heroes.find(h=>h.id===id),skill=heroSkills[id];
  if(!hero)throw Error(`仲間「${id}」の冒険表示を読み込めません。`);
  const role=skill.style;
  const actor=run?.actors.find(a=>a.hero===id);
  const lastHit=events.filter(e=>e.hero===id&&['hit','gather','skill','burst'].includes(e.kind)).at(-1);
  const age=lastHit?now-lastHit.at:Infinity;
  const attack=age<650?Math.sin(age/650*Math.PI):0;
  const front=['melee','tank','rogue'].includes(role);
  const target={x:Math.min(.57,.20+i*.09+(front?.18:0)),y:.61+(i%2)*.09};
  const walking=!!run&&run.phase!=='rest'&&now<(actor?.arrivesAt||0);
  const progress=run?clamp((now-run.phaseAt)/travelMs(id)):1;
  let x=run?target.x-.17*(1-progress):squad.members.length===1?.5:.30+i*.40/Math.max(1,squad.members.length-1);
  let y=run?target.y+.08*(1-progress):.65+(i%2)*.03;
  const detour=input.detours===false?null:run?.detour;
  let exploring=false;
  if(run&&detour&&detour.hero===id&&detour.node===run.node&&!detour.claimed&&now>=detour.at&&run.phase!=='rest'){exploring=true;const t=clamp((now-detour.at)/1400);x+=(.54-x)*t;y+=(.82-y)*t;}
  return {id,name:hero.name,sprite:hero.sprite,role,x,y,walking,exploring,attack:exploring?0:attack,hit:lastHit};
 });
 const detour=input.detours===false?null:run?.detour;
 const discovery=detour&&detour.node===run?.node&&now>=detour.at&&(!detour.claimed||now-detour.finishAt<1000)?{...detour,x:.72,y:.84}:null;
 const cutin=run?.scene&&now>=run.scene.at&&now-run.scene.at<(run.scene.kind==='burst'?1900:2600)?run.scene:null;
 const targetSprite=kind==='gather'?11:kind==='escort'?7:quest.enemy;
 const target=run?{x:.80,y:.61,sprite:targetSprite,asset:isPrologueQuest(quest.id)&&kind==='escort'?'/items/chest.png':spriteAsset(targetSprite),name:targetName(quest,run.node),value:clamp((kind==='battle'?run.target:run.targetMax-run.target)/run.targetMax),battle:kind==='battle',kind}:null;
 return {key,quest,background:questScenery(quest),phase:run?.phase||'idle',members,target,discovery,events,cutin,hp:run?clamp(run.hp/run.maxHp):1,ward:run?.ward||0};
}
export type AdventureFrame=ReturnType<typeof adventureFrame>;

export function adventureAction(input:AdventureInput,intent:AdventureIntent,now=input.now):Action|null{
 const run=input.squad.run;
 if(!input.ready||input.paused||!run)return null;
 if(intent==='detour'){
  if(input.detours===false)return null;
  const d=run.detour;
  return d&&d.node===run.node&&!d.claimed&&now>=d.at&&run.phase!=='rest'?{type:'detour',squad:input.squad.id}:null;
 }
 const mode=intent==='heal'||run.phase==='rest'?'heal':'strike';
 if(mode==='heal'&&run.hp>=run.maxHp&&run.phase!=='rest')return null;
 return {type:'assist',squad:input.squad.id,mode};
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
 for(const member of [...frame.members].reverse())if(contains(member.x,member.y,size*.8,size))return 'heal';
 return 'help';
}

export function eventColor(event:GameEvent){
 if(event.kind==='heal')return 0x9ff0c2;
 if(event.kind==='hurt')return 0xf1a18c;
 if(event.kind==='burst'||event.kind==='combo')return 0xffdf83;
 const role=event.hero?heroSkills[event.hero].style:'';
 return role==='mage'?0xc4b1ff:role==='ranged'?0xc9f9ac:role==='bard'?0xf1b6db:0xffe9b3;
}
