'use client';
import {useRef} from 'react';
import {Check} from 'lucide-react';
import {availableQuests,heroes,type State,type Squad} from '@/lib/game';
import {inPrologue,prologueStages} from '@/lib/prologue';

import {originalCharacters} from '@/lib/original-characters';
import {Sprite} from './sprite';
import {questScenery} from '@/lib/scenery';

export function QuestPicker({state:s,squad:sq,selected,onSelect,onConfirm,ready}:{state:State;squad:Squad;selected:string;onSelect:(id:string)=>void;onConfirm:()=>void;ready:boolean}){
 const unlocked=availableQuests(s),q=unlocked.find(q=>q.id===selected)||unlocked[0];
 const opponent=originalCharacters.find(c=>c.sprite===q.enemy);
 const summary=useRef<HTMLElement>(null);
 return <div className="quest-picker">
  <p className="departure-party">{!inPrologue(s)&&<b>{sq.name}</b>}<span>{sq.members.map(id=>heroes.find(h=>h.id===id)!.name).join('・')}</span></p>
  <div className="quest-options" aria-label="クエストの一覧">{unlocked.map(item=><button className="quest-option" key={item.id} aria-pressed={q.id===item.id} onClick={()=>{onSelect(item.id);summary.current?.scrollIntoView({block:'start'});}}>
   <img src={questScenery(item)} alt="" width={1672} height={941} loading="lazy"/>
   <span><small>{prologueStages.find(stage=>stage.quest===item.id)?.label||item.region}{item.availability==='once'?' · 一度きり':''}</small><b>{item.name}</b></span>{q.id===item.id&&<Check size={19}/>}
  </button>)}</div>
  <article ref={summary} className="quest-summary">
   <div className="quest-landscape"><img key={q.id} src={questScenery(q)} alt={q.region} width={1672} height={941}/><span>{q.region}</span></div>
   <h3>{q.name}</h3>{opponent&&<div className="quest-opponent"><Sprite index={opponent.sprite} size={112}/><div><small>{opponent.faction}</small><b>{opponent.name}</b><p>{opponent.bio}</p></div></div>}
   <p>{q.desc}</p>
  </article>
  <div className="quest-confirm"><button className="full" disabled={!ready} onClick={onConfirm}>{sq.run&&sq.run.quest!==q.id?'帰還して行き先を変える':sq.run?'このクエストを見守る':'出発'}</button>{sq.run&&sq.run.quest!==q.id&&<small>次の画面で帰還を確認します。出発は自分で選べます。</small>}</div>
 </div>;
}
