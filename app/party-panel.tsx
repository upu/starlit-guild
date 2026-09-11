'use client';
import {Check,Info,Plus,UserPlus} from 'lucide-react';
import {heroes,allQuests,level,memberStats,memberLimit,squadLimit,type State,type Squad} from '@/lib/game';
import {Sprite} from './sprite';

export function PartyPanel({state:s,squad:sq,draft,ready,onChoose,onCreate,onToggle,onInspect,onSave,onDiscard,onReturn,onRecruit,onPreview,onAdventure}:{
 state:State;squad:Squad;draft:string[];ready:boolean;
 onChoose:(id:string)=>void;onCreate:()=>void;onToggle:(id:string)=>void;onInspect:(id:string)=>void;
 onSave:()=>void;onDiscard:()=>void;onReturn:()=>void;onRecruit:()=>void;onPreview:()=>void;onAdventure:()=>void;
}){
 const dirty=draft.join(',')!==sq.members.join(',');
 const limit=Math.max(memberLimit(s),sq.members.length);
 const free=s.owned.some(id=>s.squads.every(p=>!p.members.includes(id)));
 return <>
  <div className="screen-heading"><h2>パーティ</h2><button className="outline recruit-link" onClick={onRecruit}><UserPlus size={17}/>新しい出会い</button></div>
  <div className="squad-list" aria-label="隊の一覧">{s.squads.map(p=><button key={p.id} className="squad-card" aria-pressed={p.id===sq.id} onClick={()=>onChoose(p.id)}><span><b>{p.name}</b><small>{p.run?`${allQuests.find(q=>q.id===p.run?.quest)?.name} · ${p.run.node+1}/15`:'拠点で待機中'}</small></span><span className="squad-faces">{p.members.map(id=><Sprite key={id} index={heroes.find(h=>h.id===id)!.sprite} size={36}/>)}</span></button>)}</div>
  {s.squads.length<squadLimit(s)?<><button className="outline full" disabled={!ready||!free} onClick={onCreate}><Plus size={17}/>新しい隊を作る</button>{!free&&<small>新しい隊には、待機中の仲間が1人必要です。</small>}</>:<small>{s.squads.length}隊 / 最大{squadLimit(s)}隊。仲間4人で2隊、6人で3隊を編成できます。</small>}
  <section className="party-editor" aria-label={sq.name+'の編成'}>
   <div className="screen-heading"><h3>{sq.name}</h3><span>{draft.length} / {limit}人</span></div>
   {sq.run?<div className="party-running"><p>冒険中です。編成の変更は帰還してから行えます。</p><button disabled={!ready} onClick={onReturn}>帰還して編成する</button><button className="outline" onClick={onAdventure}>この隊の冒険を見る</button></div>:<p>仲間を選んで編成します。人物紹介は「詳しく」から。</p>}
   <div className="roster-grid">{heroes.filter(h=>s.owned.includes(h.id)).map(h=>{
    const other=s.squads.find(p=>p.id!==sq.id&&p.members.includes(h.id)),selected=draft.includes(h.id),full=!selected&&draft.length>=limit;
    return <article key={h.id} className={selected?'roster-card picked':'roster-card'}>
     <button className="roster-pick" aria-label={h.name+(selected?'を編成から外す':'を編成に加える')} aria-pressed={selected} disabled={!ready||!!sq.run||!!other||full} onClick={()=>onToggle(h.id)}>
      <span className="roster-art"><Sprite index={h.sprite} size={168}/><span className="roster-level">Lv.{level(s.xp[h.id]||0)}</span></span>
      <span className="roster-job">{h.job}</span><b>{h.name}{selected&&<Check size={15}/>}</b>
      <small>{other?other.name:selected?'編成中':full?'定員です':'待機中'}</small><span className="roster-stats">採 {memberStats(s,h.id)[0]} · 護 {memberStats(s,h.id)[1]} · 討 {memberStats(s,h.id)[2]}</span>
     </button><button className="quiet roster-info" aria-label={h.name+'の詳しい紹介'} onClick={()=>onInspect(h.id)}><Info size={14}/>詳しく</button>
    </article>;
   })}</div>
   {!sq.run&&<div className="party-save"><span role="status">{dirty?'編成はまだ保存されていません':'保存済みの編成'}{draft.length===0&&' · 1人以上選んでください'}</span><button disabled={!ready||!dirty||!draft.length} onClick={onSave}>編成を保存</button>{dirty&&<button className="outline" onClick={onDiscard}>元に戻す</button>}</div>}
   <button className="quiet full" onClick={onPreview}>選んだ編成の効果を見る</button>

  </section>
 </>;
}
