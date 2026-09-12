import {useState,type CSSProperties} from 'react';
import {heroes,heroSkills,activeBonds,type GameEvent,type Run,type Scene} from '@/lib/game';
import {Sprite} from './sprite';

export function BattleEffects({run,now,point,location,battle}:{run:Run;now:number;point:number[];location:number[];battle:boolean}){
 const recent=run.events.filter(e=>e.id.startsWith(`${String(run.round)}-${String(run.node)}-`)&&now>=e.at&&now-e.at<1000&&['hit','skill','heal','hurt','burst','assist','gather'].includes(e.kind)).slice(-8);
 return <div className="battle-effects" aria-hidden="true">{recent.map(e=><Impact key={e.id} event={e} now={now} point={point} location={location} battle={battle}/>)}</div>;
}
function Impact({event:e,now,point,location,battle}:{event:GameEvent;now:number;point:number[];location:number[];battle:boolean}){
  const [age]=useState(Math.max(0,now-e.at));
  const role=e.hero?heroSkills[e.hero].style:'melee';
  const support=e.kind==='heal'||e.kind==='hurt'||e.kind==='skill'&&!e.amount;
  const style=impactStyle(e.kind,battle,support,role);
  const pos=support?location:point;
  return <div className={`battle-impact fx-${style} ${e.kind==='skill'||e.kind==='burst'?'empowered':''}`} style={{left:`${String(pos[0])}%`,top:`${String(pos[1])}%`,'--age':`${String(-age)}ms`} as CSSProperties}>
   <i className="impact-ring"/><i className="impact-cut"/><i className="impact-cut second"/>
   {Array.from({length:6},(_,i)=><i key={i} className="impact-mote" style={{'--angle':`${String(i*60)}deg`} as CSSProperties}/>)}
  </div>;
}

export function BurstScene({run,members,now}:{run:Run;members:string[];now:number}){
 const scene=run.scene;
 if(!scene||now<scene.at||now-scene.at>=(scene.kind==='burst'?1900:2600))return null;
 const participants=scene.kind==='combo'?activeBonds(members).find(b=>scene.title.startsWith(b.name))?.ids||members:members;
 return <Finisher key={`${String(scene.at)}-${scene.kind}`} scene={scene} members={participants} now={now}/>;
}
function Finisher({scene,members,now}:{scene:Scene;members:string[];now:number}){
 const [age]=useState(Math.max(0,now-scene.at));
 return <div className={`finisher-scene ${scene.kind}`} style={{'--scene-age':`${String(-age)}ms`} as CSSProperties}>
  {scene.kind==='burst'&&<div className="starlight-wave" aria-hidden="true"><i/><i/><i/></div>}
  <div className="finisher-banner" role="status">
   <div className="finisher-portraits" aria-hidden="true">{members.map((id,i)=><FinisherPortrait key={id} id={id} index={i}/>)}</div>
   <strong>{scene.title}</strong><div className="finisher-lines">{scene.lines.map((line,i)=><span key={i}>{line}</span>)}</div>
  </div>
 </div>;
}
function impactStyle(kind:GameEvent['kind'],battle:boolean,support:boolean,role:string){
 if(kind==='hurt')return 'hurt';
 if(kind==='heal')return 'healer';
 if(!battle&&!support)return 'gatherer';
 return role;
}
function FinisherPortrait({id,index}:{id:string;index:number}){
 const hero=heroes.find(h=>h.id===id);if(!hero)return null;
 return <div style={{'--entry':`${String(index*90)}ms`} as CSSProperties}><Sprite index={hero.sprite} size={78}/></div>;
}

export function AttackTrail({event,now,style,from,to}:{event:GameEvent;now:number;style:string;from:number[];to:number[]}){
 const [initialAge]=useState(Math.max(0,now-event.at));
 const age=now-event.at;
 if(age<0||age>=650)return null;
 return <svg className={`attack-trail trail-${style} ${event.kind==='skill'?'empowered':''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{'--age':`${String(-initialAge)}ms`} as CSSProperties}>
  <path d={`M ${String(from[0])} ${String(from[1]-5)} Q ${String((from[0]+to[0])/2)} ${String(Math.min(from[1],to[1])-10)} ${String(to[0])} ${String(to[1]-5)}`} pathLength="1"/>
  {event.kind==='skill'&&style==='ranged'&&<path className="second-arrow" d={`M ${String(from[0])} ${String(from[1]-2)} Q ${String((from[0]+to[0])/2)} ${String(Math.min(from[1],to[1])-4)} ${String(to[0])} ${String(to[1]-3)}`} pathLength="1"/>}
 </svg>;
}

export function DiscoveryArt({kind,claimed,now,finishAt}:{kind:string;claimed:boolean;now:number;finishAt:number}){
 const [age]=useState(claimed?Math.max(0,now-finishAt):0);
 return <img className="detour-art" src={`/items/${kind}.png`} width={76} height={76} alt="" draggable={false} style={{'--claim-age':`${String(-age)}ms`} as CSSProperties}/>;
}
