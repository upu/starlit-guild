'use client';
import {Sparkles} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {PhaserAdventure} from './phaser-adventure';
import {BurstScene} from './battle-effects';
import {adventureAction,adventureFrame,type AdventureIntent} from '@/lib/adventure-presentation';
import {inPrologue} from '@/lib/prologue';
import {heroes,type State,type Squad,type Action} from '@/lib/game';

export function MapStage({state,squad,now,onAction,ready,startQuest,paused=false}:{state:State;squad:Squad;now:number;onAction:(a:Action)=>void;ready:boolean;startQuest:string;paused?:boolean}){
 const input={squad,now,ready,startQuest,paused,detours:!inPrologue(state)},frame=adventureFrame(input),run=squad.run,q=frame.quest;
 function perform(intent:AdventureIntent){const action=adventureAction(input,intent);if(action)onAction(action);}
 const activity=frame.phase==='move'?'次の地点へ移動中':frame.phase==='rest'?'木陰で休憩中':frame.target?.battle?(q.enemyName?'いたずらを阻止中':'魔物と戦闘中'):frame.target?.kind==='gather'?'素材を採取中':q.escortTarget?'荷物を運搬中':'旅人を護衛中';
 return <div className="map-shell">
  <div className="adventure-map phaser-map" data-phase={frame.phase} style={{backgroundImage:`url(${frame.background})`}} role={run?'group':undefined} tabIndex={run&&ready&&!paused?0:undefined} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();perform('help');}else if(e.key.toLowerCase()==='h'){e.preventDefault();perform('heal');}}} aria-label={run?`${q.name}の探索マップ。タップで手助け、仲間をタップで回復。キーボードでは Enter で手助け、H で回復。`:`${q.region}のキャンプ`}>
   <PhaserAdventure input={input} onAction={onAction}/>
   <div className="map-heading"><span className="eyebrow">{run?'EXPLORING':'A NEW ADVENTURE'}</span><h2>{q.region}</h2><span>{run?`${String(run.round)} 周目 · 地点 ${String(run.node+1)}/${String(run.nodes)} · ${activity}`:state.clears===0?'ふたりの小さな冒険が、ここから始まる。':'支度ができたら、次の冒険へ。'}</span></div>
   {run&&<>
    <BurstScene run={run} members={squad.members} now={now}/>
    <div className="map-journey" aria-hidden="true"><span>旅の道のり</span><div>{Array.from({length:run.nodes},(_,i)=><i key={i} className={i<run.node?'complete':i===run.node?'current':''}/>)}</div></div>
    <div className="sr-only"><span>{frame.members.map(m=>m.name).join('、')}が冒険中。</span>{frame.quest.companion&&<span>{heroes.find(h=>h.id===frame.quest.companion)?.name}が同行中。</span>}<span>{frame.target?.name}</span></div>
   </>}
  </div>
  {!inPrologue(state)&&<div className={`cheer-gauge ${(run?.cheer||0)>=80?'charged':''}`}><div><Sparkles size={17}/><span>団長の応援</span><b>{run?.cheer||0} / 100</b></div><Progress value={run?.cheer||0} aria-label="団長の応援ゲージ"/><small>タップで +5。満タンになると全員で必殺技！</small></div>}
 </div>;
}
