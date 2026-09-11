'use client';
import {Sparkles,ScrollText,Heart} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {PhaserAdventure} from './phaser-adventure';
import {BurstScene} from './battle-effects';
import {adventureAction,adventureFrame,type AdventureIntent} from '@/lib/adventure-presentation';
import {inPrologue} from '@/lib/prologue';
import {heroes,type State,type Squad,type Action} from '@/lib/game';

export function MapStage({state,squad,now,onAction,ready,startQuest,onQuests,paused=false}:{state:State;squad:Squad;now:number;onAction:(a:Action)=>void;ready:boolean;startQuest:string;onQuests:()=>void;paused?:boolean}){
 const input={squad,now,ready,startQuest,paused},frame=adventureFrame(input),run=squad.run,q=frame.quest;
 const help=()=>perform('help'),heal=()=>perform('heal');
 function perform(intent:AdventureIntent){const action=adventureAction(input,intent);if(action)onAction(action);}
 const activity=frame.phase==='move'?'次の地点へ移動中':frame.phase==='rest'?'木陰で休憩中':frame.target?.battle?(q.enemyName?'いたずらを阻止中':'魔物と戦闘中'):frame.target?.kind==='gather'?'素材を採取中':q.escortTarget?'荷物を運搬中':'旅人を護衛中';
 return <div className="map-shell">
  <div className="adventure-map phaser-map" data-phase={frame.phase} style={{backgroundImage:`url(${frame.background})`}} aria-label={run?`${q.name}の探索マップ`:`${q.region}のキャンプ`}>
   <PhaserAdventure input={input} onAction={onAction}/>
   <div className="map-heading"><span className="eyebrow">{run?'EXPLORING':'A NEW ADVENTURE'}</span><h2>{q.region}</h2><span>{run?`${run.round} 周目 · 地点 ${run.node+1}/${run.nodes} · ${activity}`:state.clears===0?'ふたりの小さな冒険が、ここから始まる。':'支度ができたら、次の冒険へ。'}</span></div>
   {run&&<>
    <BurstScene run={run} members={squad.members} now={now}/>
    <div className="map-journey" aria-hidden="true"><span>旅の道のり</span><div>{Array.from({length:run.nodes},(_,i)=><i key={i} className={i<run.node?'complete':i===run.node?'current':''}/>)}</div></div>
    <div className="sr-only"><span>{frame.members.map(m=>m.name).join('、')}が冒険中。</span>{frame.quest.companion&&<span>{heroes.find(h=>h.id===frame.quest.companion)?.name}が同行中。</span>}<span>{frame.target?.name}</span></div>
   </>}
   {!run&&<div className="idle-map-note"><ScrollText size={20}/><span>{inPrologue(state)?'街へ出かける支度をしよう':q.name}</span><button disabled={!ready||paused} onClick={onQuests}>クエストを選ぶ</button></div>}
  </div>
  {run&&<div className="phaser-assist-controls" aria-label="冒険の手助け">
   <button onClick={help} disabled={!adventureAction(input,'help')}><Sparkles size={16}/>{run.phase==='rest'?'回復を手伝う':'手助けする'}</button>
   <button className="outline" onClick={heal} disabled={!adventureAction(input,'heal')} aria-label={`パーティを回復。HP ${Math.ceil(run.hp)} / ${run.maxHp}`}><Heart size={16}/><span>回復 <small>{Math.ceil(run.hp)} / {run.maxHp}</small></span></button>
   {frame.discovery&&<button className="outline" disabled={!adventureAction(input,'detour')} onClick={()=>perform('detour')}>{frame.discovery.claimed?'発見済み':'寄り道'}</button>}
  </div>}
  {!inPrologue(state)&&<div className={`cheer-gauge ${(run?.cheer||0)>=80?'charged':''}`}><div><Sparkles size={17}/><span>団長の応援</span><b>{run?.cheer||0} / 100</b></div><Progress value={run?.cheer||0} aria-label="団長の応援ゲージ"/><small>タップで +5。満タンになると全員で必殺技！</small></div>}
 </div>;
}
