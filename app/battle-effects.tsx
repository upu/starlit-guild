import {useState,type CSSProperties} from 'react';
import {heroes,heroSkills,activeBonds,type GameEvent,type Run,type Scene} from '@/lib/game';
import {Sprite} from './sprite';

export function BattleEffects({run,now,point,location,battle}:{run:Run;now:number;point:number[];location:number[];battle:boolean}){
 const recent=run.events.filter(e=>e.id.startsWith(`${run.round}-${run.node}-`)&&now>=e.at&&now-e.at<1000&&['hit','skill','heal','hurt','burst','assist','gather'].includes(e.kind)).slice(-8);
 return <div className="battle-effects" aria-hidden="true">{recent.map(e=><Impact key={e.id} event={e} now={now} point={point} location={location} battle={battle}/>)}</div>;
}
function Impact({event:e,now,point,location,battle}:{event:GameEvent;now:number;point:number[];location:number[];battle:boolean}){
  const [age]=useState(Math.max(0,now-e.at));
  const role=e.hero?heroSkills[e.hero]?.style:'melee';
  const support=e.kind==='heal'||e.kind==='hurt'||e.kind==='skill'&&!e.amount;
  const style=e.kind==='hurt'?'hurt':e.kind==='heal'?'healer':!battle&&!support?'gatherer':role;
  const pos=support?location:point;
  return <div className={`battle-impact fx-${style} ${e.kind==='skill'||e.kind==='burst'?'empowered':''}`} style={{left:`${pos[0]}%`,top:`${pos[1]}%`,'--age':`${-age}ms`} as CSSProperties}>
   <i className="impact-ring"/><i className="impact-cut"/><i className="impact-cut second"/>
   {Array.from({length:6},(_,i)=><i key={i} className="impact-mote" style={{'--angle':`${i*60}deg`} as CSSProperties}/>)}
  </div>;
}

export function BurstScene({run,members,now}:{run:Run;members:string[];now:number}){
 const scene=run.scene;
 if(!scene||now<scene.at||now-scene.at>=(scene.kind==='burst'?1900:2600))return null;
 const participants=scene.kind==='combo'?activeBonds(members).find(b=>scene.title.startsWith(b.name))?.ids||members:members;
 return <Finisher key={`${scene.at}-${scene.kind}`} scene={scene} members={participants} now={now}/>;
}
function Finisher({scene,members,now}:{scene:Scene;members:string[];now:number}){
 const [age]=useState(Math.max(0,now-scene.at));
 return <div className={`finisher-scene ${scene.kind}`} style={{'--scene-age':`${-age}ms`} as CSSProperties}>
  {scene.kind==='burst'&&<div className="starlight-wave" aria-hidden="true"><i/><i/><i/></div>}
  <div className="finisher-banner" role="status">
   <div className="finisher-portraits" aria-hidden="true">{members.map((id,i)=><div key={id} style={{'--entry':`${i*90}ms`} as CSSProperties}><Sprite index={heroes.find(h=>h.id===id)!.sprite} size={78}/></div>)}</div>
   <strong>{scene.title}</strong><div className="finisher-lines">{scene.lines.map((line,i)=><span key={i}>{line}</span>)}</div>
  </div>
 </div>;
}

export function AttackTrail({event,now,style,from,to}:{event:GameEvent;now:number;style:string;from:number[];to:number[]}){
 const [initialAge]=useState(Math.max(0,now-event.at));
 const age=now-event.at;
 if(age<0||age>=650)return null;
 return <svg className={`attack-trail trail-${style} ${event.kind==='skill'?'empowered':''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{'--age':`${-initialAge}ms`} as CSSProperties}>
  <path d={`M ${from[0]} ${from[1]-5} Q ${(from[0]+to[0])/2} ${Math.min(from[1],to[1])-10} ${to[0]} ${to[1]-5}`} pathLength="1"/>
  {event.kind==='skill'&&style==='ranged'&&<path className="second-arrow" d={`M ${from[0]} ${from[1]-2} Q ${(from[0]+to[0])/2} ${Math.min(from[1],to[1])-4} ${to[0]} ${to[1]-3}`} pathLength="1"/>}
 </svg>;
}

export function DiscoveryArt({kind,claimed,now,finishAt}:{kind:string;claimed:boolean;now:number;finishAt:number}){
 const [age]=useState(claimed?Math.max(0,now-finishAt):0);
 return <img className="detour-art" src={`/items/${kind}.png`} width={76} height={76} alt="" draggable={false} style={{'--claim-age':`${-age}ms`} as CSSProperties}/>;
}
