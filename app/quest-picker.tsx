'use client';
import Image from 'next/image';
import {Check} from 'lucide-react';
import {availableQuests,heroes,squadName,type State,type Squad} from '@/lib/game';
import {inPrologue,prologueStages} from '@/lib/prologue';

import {originalCharacters} from '@/lib/original-characters';
import {Sprite} from './sprite';
import {questScenery} from '@/lib/scenery';

export function QuestPicker({state:s,squad:sq,selected,onSelect,onConfirm,ready}:{state:State;squad:Squad;selected:string;onSelect:(id:string)=>void;onConfirm:(id:string)=>void;ready:boolean}){
 const unlocked=availableQuests(s),q=unlocked.find(q=>q.id===selected)||unlocked[0];
 const opponent=originalCharacters.find(c=>c.sprite===q.enemy);
 return <div className="quest-picker">
  <p className="departure-party">{!inPrologue(s)&&<b>{squadName(sq)}</b>}<span>{sq.members.map(id=>heroes.find(h=>h.id===id)?.name??'不明な仲間').join('・')}</span></p>
  <div className="quest-options" aria-label="クエストの一覧">{unlocked.map(item=><button className="quest-option" key={item.id} disabled={!ready} aria-pressed={q.id===item.id} onClick={()=>{if(!ready)return;if(q.id===item.id)onConfirm(item.id);else onSelect(item.id);}}>
   <Image src={questScenery(item)} alt="" width={1672} height={941} loading="lazy" unoptimized/>
   <span><small>{prologueStages.find(stage=>stage.quest===item.id)?.label||item.region}{item.availability==='once'?' · 一度きり':''}</small><b>{item.name}</b></span>{q.id===item.id&&<Check size={19}/>}
  </button>)}</div>
  <article className="quest-summary">
   <div className="quest-landscape"><Image key={q.id} src={questScenery(q)} alt={q.region} width={1672} height={941} loading="eager" unoptimized/><span>{q.region}</span></div>
   <h3>{q.name}</h3>{opponent&&<div className="quest-opponent"><Sprite index={opponent.sprite} size={112}/><div><small>{opponent.faction}</small><b>{opponent.name}</b><p>{opponent.bio}</p></div></div>}
   <p>{q.desc}</p>
  </article>
 </div>;
}
