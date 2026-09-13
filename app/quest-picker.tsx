'use client';
import {useRef} from 'react';
import Image from 'next/image';
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
  <p className="departure-party">{!inPrologue(s)&&<b>{sq.name}</b>}<span>{sq.members.map(id=>heroes.find(h=>h.id===id)?.name??'不明な仲間').join('・')}</span></p>
  <div className="quest-options" aria-label="クエストの一覧">{unlocked.map(item=><button className="quest-option" key={item.id} aria-pressed={q.id===item.id} onClick={()=>{onSelect(item.id);summary.current?.scrollIntoView({block:'start'});}}>
   <Image src={questScenery(item)} alt="" width={1672} height={941} loading="lazy" unoptimized/>
   <span><small>{prologueStages.find(stage=>stage.quest===item.id)?.label||item.region}{item.availability==='once'?' · 一度きり':''}</small><b>{item.name}</b></span>{q.id===item.id&&<Check size={19}/>}
  </button>)}</div>
  <article ref={summary} className="quest-summary">
   <div className="quest-landscape"><Image key={q.id} src={questScenery(q)} alt={q.region} width={1672} height={941} loading="eager" unoptimized/><span>{q.region}</span></div>
   <h3>{q.name}</h3>{opponent&&<div className="quest-opponent"><Sprite index={opponent.sprite} size={112}/><div><small>{opponent.faction}</small><b>{opponent.name}</b><p>{opponent.bio}</p></div></div>}
   <p>{q.desc}</p>
  </article>
  <div className="quest-confirm"><button className="full" disabled={!ready} onClick={onConfirm}>{sq.run&&sq.run.quest!==q.id?'帰還して行き先を変える':sq.run?'このクエストを見守る':'この行先にする'}</button>{sq.run&&sq.run.quest!==q.id&&<small>次の画面で帰還を確認します。</small>}{!sq.run&&<small>待機画面で支度を整えてから出発できます。</small>}</div>
 </div>;
}
