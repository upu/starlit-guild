'use client';
import {useRef} from 'react';
import {Coins,Leaf,Gem,Check} from 'lucide-react';
import {quests,heroes,power,estimate,type State,type Squad} from '@/lib/game';
import {questAdvice} from '@/lib/journey';
import {originalCharacters} from '@/lib/original-characters';
import {Sprite} from './sprite';

export function QuestPicker({state:s,squad:sq,selected,onSelect,onConfirm,ready}:{state:State;squad:Squad;selected:string;onSelect:(id:string)=>void;onConfirm:()=>void;ready:boolean}){
 const unlocked=quests.filter(q=>q.unlock<=s.clears),q=unlocked.find(q=>q.id===selected)||unlocked[0];
 const opponent=originalCharacters.find(c=>c.sprite===q.enemy);
 const summary=useRef<HTMLElement>(null);
 return <div className="quest-picker"><p className="departure-party"><b>{sq.name}</b><span>{sq.members.map(id=>heroes.find(h=>h.id===id)!.name).join('・')}</span></p><div className="quest-options" aria-label="行き先の一覧">{unlocked.map(item=><button className="quest-option" key={item.id} aria-pressed={q.id===item.id} onClick={()=>{onSelect(item.id);summary.current?.scrollIntoView({block:'start'});}}><span><small>{item.region} · {item.kind}</small><b>{item.name}</b><small>{Math.max(1,Math.round(estimate(s,sq,item)/60))}分ほど · {item.gold} G</small></span>{q.id===item.id&&<Check size={19}/>}</button>)}</div><article ref={summary} className="quest-summary"><h3>{q.name}</h3>{opponent&&<div className="quest-opponent"><Sprite index={opponent.sprite} size={112}/><div><small>{opponent.faction}</small><b>{opponent.name}</b><p>{opponent.bio}</p></div></div>}<p>{q.desc}</p><div className="quest-rewards"><span><Coins size={16}/>{q.gold} G</span><span>EXP {q.xp}</span><span><Leaf size={16}/>{q.herbs}</span><span><Gem size={16}/>{q.ore}</span></div><p>{q.kind}の力 {power(s,sq,q)} / 目安 {q.need}</p><small>{questAdvice(s,sq,q)}</small><small>全15地点。3地点ごとに報酬を確保します。</small></article><div className="quest-confirm"><button className="full" disabled={!ready} onClick={onConfirm}>{sq.run&&sq.run.quest!==q.id?'帰還して行き先を変える':'この行き先にする'}</button>{sq.run&&sq.run.quest!==q.id&&<small>次の画面で帰還を確認します。出発は自分で選べます。</small>}</div></div>;
}
