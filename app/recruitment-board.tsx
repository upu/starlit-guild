'use client';
import {useState} from 'react';
import {BookOpen,Check,ChevronRight,Gem} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {heroes,quests,allQuests,power,estimate,type State,type Squad,type Action} from '@/lib/game';
import {recruitments,met,prepared,rareProgress,canPrepare,recruitmentNeeds,recruitmentRun,recruitmentHint} from '@/lib/recruitment';
import {availableStories,type Story} from '@/lib/stories';
import {Sprite} from './sprite';

export function RareInventory({state:s}:{state:State}){
 return <section className="rare-inventory"><h3><Gem size={18}/>出会いをつなぐ希少素材</h3><p>対象の依頼を最後まで達成すると探索が進みます。留守中の冒険も数えます。</p>{recruitments.filter(r=>met(s,r)||rareProgress(s,r).found>0).map(r=>{const p=rareProgress(s,r);return <article key={r.hero}><b>{r.rare.name}<span>{s.owned.includes(r.hero)?'仲間に加入済み':p.spent?'支度に使用済み':`${String(p.held)} / ${String(r.rare.count)}`}</span></b><p>{r.rare.description}</p><small>{r.rare.sources.map(id=>quests.find(q=>q.id===id)?.name??'不明な依頼').join('・')}：合計 {r.rare.every} 回で1個</small>{!p.spent&&p.next>0&&<small>次の1個まで、あと {p.next} 回</small>}</article>;})}</section>;
}
function recruitmentDetails(selected:string){
 const r=recruitments.find(r=>r.hero===selected)??recruitments.at(0);if(!r)throw Error('加入情報が見つかりません。');
 const h=heroes.find(h=>h.id===r.hero);if(!h)throw Error(`仲間「${r.hero}」が見つかりません。`);
 const quest=allQuests.find(q=>q.companion===r.hero);if(!quest)throw Error(`仲間「${r.hero}」の専用クエストが見つかりません。`);
 return {r,h,quest};
}
type Recruitment=(typeof recruitments)[number];
type RecruitmentProps={state:State;recruitment:Recruitment;ready:boolean;onAction:(a:Action)=>boolean;onGather:(id:string)=>void;onWatch:(id:string)=>void;squad:Squad};
function RareSearch({state:s,recruitment:r,onGather}:{state:State;recruitment:Recruitment;onGather:(id:string)=>void}){
 const rare=rareProgress(s,r);
 return <article className="rare-search"><h4>{r.rare.name}を探す</h4><p>{r.rare.description}</p><Progress value={Math.min(100,rare.visits/(r.rare.every*r.rare.count)*100)} aria-label={`${r.rare.name}の探索 ${String(Math.min(rare.visits,r.rare.every*r.rare.count))} / ${String(r.rare.every*r.rare.count)} 回`}/><p>対象の依頼を合計 {r.rare.every} 回達成するごとに、必ず1個。{rare.remaining?`必要な分まで、あと ${String(rare.remaining)} 回。`:'必要な分が集まりました。'}</p>{rare.next>0&&<small>次の1個まで、あと {rare.next} 回</small>}<div>{r.rare.sources.map(id=>{const q=quests.find(q=>q.id===id);if(!q)return null;return <button className="outline" key={id} disabled={s.clears<q.unlock} onClick={()=> { onGather(id); }}>{q.name}<ChevronRight size={14}/>{s.clears<q.unlock&&<small>あと {q.unlock-s.clears} 件で解放</small>}</button>;})}</div></article>;
}
function Preparation({state:s,recruitment:r,ready,onAction,onGather}:Omit<RecruitmentProps,'onWatch'|'squad'>){
 const needs=recruitmentNeeds(s,r);
 return <><div className="recruitment-materials">{needs.map(i=><div key={i.key}><span>{i.label}</span><b>{Math.floor(i.have)} / {i.need}</b>{i.have>=i.need&&<Check size={16} aria-label="必要数がそろいました"/>}</div>)}</div><RareSearch state={s} recruitment={r} onGather={onGather}/><button className="full" disabled={!ready||!canPrepare(s,r)} onClick={()=>onAction({type:'prepareRecruitment',id:r.hero})}>資材と希少素材を使って、専用クエストを開く</button><small>支度の費用は一度だけ。途中で帰還しても、再挑戦に追加の材料はいりません。</small></>;
}
function RecruitmentMission({state:s,recruitment:r,ready,onAction,onWatch,squad}:Omit<RecruitmentProps,'onGather'>){
 const {quest}=recruitmentDetails(r.hero),running=recruitmentRun(s,r.hero),idle=s.squads.filter(sq=>!sq.run),chosen=idle.find(sq=>sq.id===squad.id)??idle.at(0);
 return <article className="recruitment-mission"><small>仲間になるための専用クエスト</small><h3>{quest.name}</h3><p>{quest.desc}</p><p>全15地点 · {quest.kind}の力の目安 {quest.need} · 達成すると{r.name}が加入</p>{running?<button className="full" onClick={()=> { onWatch(running.id); }}>{running.name}の冒険を見守る</button>:chosen?<><p>{chosen.name}：{quest.kind}の力 {power(s,chosen,quest)} · 約{Math.max(1,Math.round(estimate(s,chosen,quest)/60))}分</p>{power(s,chosen,quest)<quest.need&&<p>少し苦戦するかもしれません。装備や編成を整えるか、手助け・回復で支えましょう。</p>}<button className="full" disabled={!ready} onClick={()=>onAction({type:'start',id:quest.id,squad:chosen.id})}>{chosen.name}で出発</button></>:<p>いまはすべての隊が冒険中です。隊を帰還させるか、自動周回をオフにして帰りを待ちましょう。</p>}<small>達成後は自動で帰還します。仲間の編成は「仲間」から。</small></article>;
}
export function RecruitmentBoard({state:s,squad,ready,onAction,onStory,onGather,onWatch}:{state:State;squad:Squad;ready:boolean;onAction:(a:Action)=>boolean;onStory:(st:Story)=>void;onGather:(id:string)=>void;onWatch:(id:string)=>void}){
 const [selected,setSelected]=useState(()=>recruitments.find(r=>!s.owned.includes(r.hero))?.hero||'mira');
 const {r,h}=recruitmentDetails(selected);
 const known=met(s,r),joined=s.owned.includes(r.hero),unlocked=prepared(s,r.hero),chapters=availableStories(s).filter(st=>st.companion===r.hero);
 return <div className="recruitment-board"><p>出会いを重ね、支度を整え、一緒にひとつの冒険を終える。その人が仲間になるまでの道のりです。</p><div className="recruitment-picker" aria-label="出会う仲間を選ぶ">{recruitments.map(r=><button key={r.hero} aria-pressed={selected===r.hero} onClick={()=> { setSelected(r.hero); }}><span>{r.name}</span><small>{s.owned.includes(r.hero)?'仲間':met(s,r)?'出会い':'これから'}</small></button>)}</div><div className="recruitment-title"><Sprite index={h.sprite} size={88}/><div><small>{h.job}</small><h3>{r.name}</h3><p>{r.request}</p></div></div><ol className="recruitment-steps"><li className={known?'reached':''}>出会い</li><li className={unlocked?'reached':''}>支度</li><li className={joined?'reached':''}>冒険と加入</li></ol><p className="recruitment-status" role="status">{recruitmentHint(s,r)}</p>
 {!known?<p>依頼を重ねると、この人の困りごとを知ることができます。必要な素材は、出会う前から集められます。</p>:<><div className="recruitment-chapters">{chapters.map(st=><button className="outline" key={st.id} onClick={()=> { onStory(st); }}><BookOpen size={16}/>{st.place}：{st.title}</button>)}</div>{!joined&&<><p>{r.purpose}</p>{unlocked?<RecruitmentMission state={s} recruitment={r} ready={ready} onAction={onAction} onWatch={onWatch} squad={squad}/>:<Preparation state={s} recruitment={r} ready={ready} onAction={onAction} onGather={onGather}/>}</>}{joined&&<p>ここまでの物語は、いつでも読み返せます。編成に加えて、新しい旅へ出かけましょう。</p>}</>}
 </div>;
}
