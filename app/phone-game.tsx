'use client';
import {useState,type Dispatch,type MouseEvent,type ReactNode,type Ref,type SetStateAction} from 'react';
import Image from 'next/image';
import {Coins,Leaf,Gem,Logs,Compass,Users,Flame,BookOpen,ChevronRight,Heart,Hammer,Gift,House,Lightbulb,Images} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {PartyPanel} from './party-panel';
import {QuestPicker} from './quest-picker';
import {QuestCompletion} from './quest-completion';
import {Toaster} from '@/components/ui/sonner';
import {SavePanel} from './save-panel';
import {useGameMusic} from './use-game-music';
import {useJourneyHints} from './use-journey-hints';
import {MapStage} from './map-stage';
import {GuildHome} from './guild-home';
import {RecruitmentBoard} from './recruitment-board';
import {Banter,StoryLibrary,StoryAlbum,ConversationReader,StoryReader} from './story-scenes';
import {useStoryAdvance,type StoryAdvance} from './use-story-advance';
import {StoryHeading} from './story-heading';
import {availableStories,characterNotes,journeyBanter,stories,storyProgress,together,type Story,type StoryLine} from '@/lib/stories';
import {Sprite} from './sprite';
import {InstallGuide,useInstallPrompt} from './install-guide';
import {nextGoal,partyPreview,questAdvice,type JourneyGoal} from '@/lib/journey';
import type {Action,State,Squad} from '@/lib/game';
import type {useLocalGame} from './use-local-game';
import {inPrologue,TRADE_QUEST,isPrologueQuest,stageEndingPending,restingQuest} from '@/lib/prologue';
import {heroes,availableQuests,allQuests,heroSkills,memberStats,activeBonds,bondLevel,squadName} from '@/lib/game';
type Game=ReturnType<typeof useLocalGame>;
type Sheet='book'|'quests'|'party'|'bag'|'journal'|'build'|'upgrade'|'gift'|'recruit'|'help'|'goal'|'preview'|'advice'|'install'|'stories'|'album'|'story'|'banter'|'personality'|null;
type ReturnIntent={squad:string;destination:'adventure'|'companions';quest?:string};
type SheetView={title:string;description:string;content:ReactNode};
const fmt=(n:number)=>Math.floor(n).toLocaleString('ja-JP');
const compact=(n:number)=>n<10000?fmt(n):(n/10000).toFixed(n<100000?1:0)+'万';
function startAction(action:Action){return action.type==='start'?{...action,value:!isPrologueQuest(action.id||'')}:action;}
function departureStory(state:State,action:Action){
 const actionId=action.id;if(action.type!=='start'||!actionId)return null;
 const target=state.squads.find(p=>p.id===action.squad)||state.squads[0];
 if(target.run||!together(target.members)||storyProgress(state).departed.includes(actionId))return null;
 return stories.find(st=>st.id===actionId+'-departure')??null;
}
function hasDestination(state:State,squad:Squad,choice?:string){
 return !!choice||!!squad.lastQuest||!inPrologue(state)||!!state.done[restingQuest(state,squad)];
}
type SheetModel={
 sheet:Sheet;reading:Story|null;ready:boolean;pendingDeparture:Action|null;activeQuest:(typeof allQuests)[number]|undefined;
 banterSnapshot:StoryLine[];hero:(typeof heroes)[number];state:State;goal:ReturnType<typeof nextGoal>;prologue:boolean;
 installStatus:ReturnType<typeof useInstallPrompt>;game:Game;music:ReturnType<typeof useGameMusic>;unread:number;hints:ReturnType<typeof useJourneyHints>;
 setSheet:(sheet:Sheet)=>void;openStory:(story:Story)=>void;finishStory:()=>boolean;closeStory:()=>void;navigate:(view:string)=>void;followGoal:(goal:JourneyGoal)=>void;
 quest:(typeof allQuests)[number];squad:Squad;run:Squad['run'];preview:ReturnType<typeof partyPreview>;draft:string[];act:(action:Action,onSuccess?:(state:State)=>void)=>boolean;
 chooseSquad:(id:string)=>void;candidateQuest:string;setCandidateQuest:(id:string)=>void;selectQuest:(id?:string)=>void;clock:number;openQuests:(id?:string)=>void;
 setSquad:(id:string)=>void;setView:(view:string)=>void;
};
type PhoneFrameModel=SheetModel&{
 view:string;returnIntent:ReturnIntent|null;leaveAction:((state:State)=>void)|null;ending:Story|null;banter:StoryLine[];quote:string;destinationChosen:boolean;
 roster:(typeof heroes)[number][];setBanterSnapshot:Dispatch<SetStateAction<StoryLine[]>>;setHeroIndex:Dispatch<SetStateAction<number>>;
 createSquad:()=>void;requestReturn:(destination:'adventure'|'companions',quest?:string)=>void;confirmReturn:()=>void;
 openRecruit:()=>void;
 setReturnIntent:Dispatch<SetStateAction<ReturnIntent|null>>;setLeaveAction:Dispatch<SetStateAction<((state:State)=>void)|null>>;setDraft:Dispatch<SetStateAction<string[]>>;
};
function storySheet(m:SheetModel,advanceRef:Ref<StoryAdvance>):SheetView|null{
 if(m.sheet==='book')return {title:'旅の手帳',description:'旅の記録と、手助けのヒント。',content:<div className="handbook-menu"><button className="outline" onClick={()=>{m.hints.markRead();m.setSheet('goal');}}><Lightbulb size={20}/><span>ヒント</span><ChevronRight size={16}/></button><button className="outline" onClick={()=> { m.setSheet('stories'); }}><BookOpen size={20}/><span>思い出{m.unread>0&&` · 未読 ${String(m.unread)}`}</span><ChevronRight size={16}/></button><button className="outline" onClick={()=> { m.setSheet('album'); }}><Images size={20}/><span>アルバム</span><ChevronRight size={16}/></button><SavePanel game={m.game} music={m.music}/></div>};
 if(m.sheet==='album')return {title:'アルバム',description:'旅で出会った景色を眺める',content:<StoryAlbum state={m.state} onBack={()=> { m.setSheet('book'); }}/>};
 if(m.sheet==='stories')return {title:'旅の思い出',description:'出会いも、冒険も、帰ってきた日のことも。',content:<><button className="outline" onClick={()=> { m.setSheet('journal'); }}>旅の記録</button><StoryLibrary state={m.state} onOpen={m.openStory}/></>};
 if(m.sheet==='story'&&m.reading)return {title:m.reading.title,description:m.reading.place,content:<StoryReader key={m.reading.id} story={m.reading} ready={m.ready} onRead={m.finishStory} departure={!!m.pendingDeparture} onClose={m.closeStory} advanceRef={advanceRef}/>};
 if(m.sheet==='banter')return {title:m.activeQuest?.companion?'仲間になるまでの道中':'ふたりの道中',description:m.activeQuest?.name||'次の冒険を待ちながら',content:<ConversationReader advanceRef={advanceRef} lines={m.banterSnapshot} onClose={()=> { m.setSheet(null); }}/>};
 return null;
}
function heroSheet(m:SheetModel):SheetView|null{
 if(m.sheet!=='personality')return null;
 const notes=characterNotes[m.hero.id];
 return {title:m.hero.name+'のこと',description:m.hero.job,content:<><Sprite index={m.hero.sprite} size={88}/><p>{m.hero.bio}</p>{notes&&<p>{notes.habit}</p>}<div className="phone-stat-row">{['採取','護衛','討伐'].map((name,i)=><span key={name}>{name}<b>{memberStats(m.state,m.hero.id)[i]}</b></span>)}</div><h3>{heroSkills[m.hero.id].name}</h3><p>{heroSkills[m.hero.id].description}</p><button className="outline" onClick={()=> { m.navigate('memories'); }}>旅の思い出を読む</button></>};
}
function journeySheet(m:SheetModel):SheetView|null{
 if(m.sheet==='goal')return {title:m.goal.title,description:m.prologue?'ふたりの次の一歩':'旅団の次の一歩',content:<><p>{m.goal.detail}</p>{(!m.prologue||m.goal.destination!=='quests')&&<button className="full" onClick={()=> { m.followGoal(m.goal); }}>{m.goal.action}</button>}{m.state.clears===0&&!m.prologue&&<ol className="journey-steps"><li>ふたりの隊を出発させる</li><li>タップで応援。見守るだけでも大丈夫</li><li>3地点ごとに報酬、15地点で依頼達成</li><li>木材とお金で、帰る場所を作る</li></ol>}<button className="outline full" onClick={()=> { m.setSheet('help'); }}>旅の手引き・操作方法</button></>};
 if(m.sheet==='install')return {title:'ホーム画面に追加',description:'ランタンから、いつもの冒険へ。',content:<InstallGuide onDownload={m.game.download} status={m.installStatus}/>};
 if(m.sheet==='advice')return {title:'この依頼の支度',description:m.quest.name,content:<><p>{questAdvice(m.state,m.squad,m.quest)}</p><p>休憩が多いときは回復役や障壁を持つ仲間も頼りになります。編成の変更は帰還後に行えます。</p><button onClick={()=>{m.navigate('companions');m.setSheet(null);}}>仲間の編成へ</button>{m.run&&<button className="outline" onClick={()=> { m.setSheet('party'); }}>隊を選ぶ</button>}</>};
 return null;
}
function previewSheet(m:SheetModel):SheetView|null{
 if(m.sheet!=='preview')return null;
 const p=m.preview;
 return {title:'編成の効果を比べる',description:'現在の編成 → 選んでいる編成',content:<><div className="party-comparison">{['採取','護衛','討伐'].map((name,i)=><div key={name}><span>{name}</span><b>{p.before[i]} → {p.after[i]}</b><small>{p.after[i]-p.before[i]>0?'+':''}{p.after[i]-p.before[i]}</small></div>)}</div>{m.draft.length?<><p>「{m.quest.name}」の所要時間の目安<br/>{Math.max(1,Math.round(p.secondsBefore/60))}分 → {Math.max(1,Math.round(p.secondsAfter/60))}分</p><small>手助け・休憩・特技によって実際の時間は変わります。</small><p>{p.healing?'回復役が仲間を支えます。':'回復は団長の手助けでも支えられます。'}{p.guarding&&'障壁で仲間を守れます。'}{p.exploring&&'寄り道が得意な仲間がいます。'}</p>{p.bonds.length?p.bonds.map(b=><p className="phone-bond" key={b.name}><Heart size={14}/>{b.name} · 連携 Lv.{bondLevel(m.state,b.ids)}</p>):<p>この編成にはペアの連携がありません。仲間の得意分野で力を合わせます。</p>}<p>{questAdvice(m.state,{...m.squad,members:m.draft},m.quest)}</p></>:<p>仲間を1人以上選んでください。</p>}<button disabled={!m.ready||!!m.run||!m.draft.length} onClick={()=>{m.act({type:'party',squad:m.squad.id,members:m.draft});m.setSheet(null);}}>この編成を保存</button>{m.run&&<p>冒険中の隊は帰還してから編成できます。</p>}</>};
}
function collectionSheet(m:SheetModel):SheetView|null{
 const s=m.state;
 if(m.sheet==='party')return {title:'冒険を見守る隊',description:'隊を選ぶと、その隊の冒険と行き先を表示します。',content:<><div className="phone-squads">{s.squads.map(p=><button aria-pressed={p.id===m.squad.id} className={p.id===m.squad.id?'selected':''} onClick={()=> { m.chooseSquad(p.id); }} key={p.id}><span>{squadName(p)}<small>{p.run?allQuests.find(q=>q.id===p.run?.quest)?.name:'拠点で待機中'}</small></span><span>{p.members.flatMap(id=>{const hero=heroes.find(h=>h.id===id);return hero?[<Sprite key={id} index={hero.sprite} size={38}/>]:[];})}</span></button>)}</div><button className="outline" onClick={()=> { m.navigate('companions'); }}>隊を作る・編成する</button></>};
 if(m.sheet==='quests')return {title:'クエスト',description:'行き先を選び、もう一度タップで決定。',content:<QuestPicker state={s} squad={m.squad} selected={m.candidateQuest} onSelect={m.setCandidateQuest} onConfirm={m.selectQuest} ready={m.ready}/>};
 if(m.sheet==='bag')return {title:'持ちもの',description:'区間報酬と寄り道で集めた、旅の蓄えです。',content:<div className="inventory-grid">{[[Coins,s.gold,'お金'],[Leaf,s.herbs,'薬草'],[Gem,s.ore,'鉱石'],[Logs,s.wood,'木材']].map(([Icon,value,label])=>{const I=Icon as typeof Coins;return <div key={String(label)}><I/><span>{String(label)}</span><b>{fmt(value as number)}</b></div>})}</div>};
 if(m.sheet==='journal')return {title:'旅団の足あと',description:`${String(s.clears)}件達成 · 寄り道で${String(s.discoveries)}回の発見`,content:<><button className="memory-link" onClick={()=> { m.setSheet('stories'); }}><Heart size={18}/>旅の思い出{m.unread>0&&<span>未読 {m.unread}</span>}</button><div className="phone-journal">{s.log.map((entry,i)=><article key={`${String(entry.at)}-${String(i)}`}><time>{new Date(entry.at).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</time><p>{entry.text}</p></article>)}</div></>};
 return null;
}
function guildSheet(m:SheetModel):SheetView|null{
 const s=m.state;
 if(m.sheet==='build')return {title:'拠点を育てる',description:'木材を使って、仲間たちの帰る場所を作ります。',content:<div className="building-details"><GuildHome state={s} now={m.clock} ready={m.ready} onAction={m.act} onStory={m.openStory}/></div>};
 if(m.sheet==='gift'){const claimed=s.lastDaily===new Date(m.clock||0).toISOString().slice(0,10);return {title:'ギルドの差し入れ',description:'毎朝9時に届く、旅の応援です。',content:<><Gift className="gift-art"/><p>80 G と薬草 5 個</p><button disabled={!m.ready||claimed||s.clears<3} onClick={()=>m.act({type:'daily'})}>{claimed?'受取済み':s.clears<3?'3件達成で解放':'受け取る'}</button></>};}
 if(m.sheet==='recruit')return {title:'仲間になるまで',description:'旅を重ねてつながる、新しい出会い。',content:<RecruitmentBoard state={s} squad={m.squad} ready={m.ready} onAction={m.act} onStory={m.openStory} onGather={id=> { m.openQuests(id); }} onWatch={id=>{m.setSquad(id);m.setView('adventure');m.setSheet(null);}}/>};
 return null;
}
function upgradeSheet(m:SheetModel):SheetView|null{
 const s=m.state;if(m.sheet!=='upgrade')return null;
 const content=s.clears<3?<p>3件の依頼を達成すると、装備を強化できます。</p>:<div className="phone-upgrades"><article><Hammer/><h3>みんなの装備 Lv.{s.gear}</h3><p>1段階ごとに全能力 +8%</p><button disabled={!m.ready||s.gear>=15||s.gold<100*(s.gear+1)||s.ore<5*(s.gear+1)} onClick={()=>m.act({type:'gear'})}>{s.gear>=15?'最大レベル':`${String(100*(s.gear+1))} G · 鉱石 ${String(5*(s.gear+1))} で強化`}</button></article>{s.clears>=10&&<article><Flame/><h3>野営地 Lv.{s.camp}</h3><p>1段階ごとに行動間隔 −3.5%</p><button disabled={!m.ready||s.camp>=10||s.gold<150*(s.camp+1)||s.herbs<12*(s.camp+1)} onClick={()=>m.act({type:'camp'})}>{s.camp>=10?'最大レベル':`${String(150*(s.camp+1))} G · 薬草 ${String(12*(s.camp+1))} で改築`}</button></article>}</div>;
 return {title:'冒険の支度',description:'全員に効果があります。',content};
}
function helpSheet(m:SheetModel):SheetView|null{
 if(m.sheet!=='help')return null;
 return {title:'旅の手引き',description:'見守るだけでも、手助けしても。',content:<><p>マップの空いているところや敵・素材をタップすると手助け、仲間やHP表示をタップするとパーティを回復できます。HPは隊全体で共有し、先頭の仲間の足元に表示します。休憩中はマップのどこでも回復できます。{!m.prologue&&'応援が100になると、全員の必殺技が発動！ '}タップでの手助けに回数制限はありません。</p>{!m.prologue&&<p>光る寄り道をタップすると、仲間が優先して調べます。放置でも自動で回収します。</p>}<p>1周は15地点。3地点ごとに報酬を確保します。行き先は巻物の「クエスト」から選べます。{!m.prologue&&'帰還は隊の名前の横、編成は「パーティ」から操作できます。'}</p><p>進行は端末に保存し、開いている間は約5分ごとにクラウドへバックアップします。画面を閉じた後は、次に開いたときに最大12時間分を集計します。</p><button className="outline full" onClick={()=> { m.setSheet('install'); }}>ホーム画面に追加</button></>};
}
function resolveSheet(m:SheetModel,advanceRef:Ref<StoryAdvance>){return storySheet(m,advanceRef)??heroSheet(m)??journeySheet(m)??previewSheet(m)??collectionSheet(m)??guildSheet(m)??upgradeSheet(m)??helpSheet(m)??{title:'',description:'',content:null};}
export function PhoneGame({game}:{game:Game}){
 const installStatus=useInstallPrompt();
 const {s,clock,dispatch}=game;
 const prologue=inPrologue(s),pendingEnding=stageEndingPending(s),ending=pendingEnding?stories.find(st=>st.id===pendingEnding+'-return')??null:null;
 const [pendingDeparture,setPendingDeparture]=useState<Action|null>(null);
 const [reading,setReading]=useState<Story|null>(null),[banterSnapshot,setBanterSnapshot]=useState<StoryLine[]>([]);
 const [view,setView]=useState('adventure'),[sheet,setSheet]=useState<Sheet>(null),[selectedSquad,setSquad]=useState('party-1'),[questChoices,setQuestChoices]=useState<Record<string,string>>({}),[heroIndex,setHeroIndex]=useState(0),[draft,setDraft]=useState<string[]>(s.squads[0].members);
 const sq=s.squads.find(p=>p.id===selectedSquad)||s.squads[0],run=sq.run,ready=game.ready&&!game.otherTab;
 const questId=run?.quest||questChoices[sq.id]||(prologue?restingQuest(s,sq):'herbs');
 function setQuest(id:string){setQuestChoices(current=>({...current,[sq.id]:id}));}
 const music=useGameMusic(view==='camp'||!run?'camp':'journey',ready);
 const unlocked=availableQuests(s),q=unlocked.find(q=>q.id===questId)||unlocked[0];
 const roster=heroes.filter(h=>s.owned.includes(h.id)),hi=Math.min(heroIndex,roster.length-1),hero=roster[hi];
 const synergy=activeBonds(sq.members);
 const [candidateQuest,setCandidateQuest]=useState(prologue?TRADE_QUEST:'herbs');
 const [returnIntent,setReturnIntent]=useState<{squad:string;destination:'adventure'|'companions';quest?:string}|null>(null);
 const [leaveAction,setLeaveAction]=useState<((state:State)=>void)|null>(null);
 const dirty=draft.join(',')!==sq.members.join(',');
 const activeQuest=allQuests.find(q=>q.id===run?.quest);
 const lines=synergy.length?synergy.flatMap(b=>b.lines):sq.members.map(id=>`${heroes.find(h=>h.id===id)?.name??'仲間'}「さあ、次の冒険へ！」`),quote=lines[Math.floor(clock/8000)%lines.length];
 const goal=nextGoal(s,sq),preview=partyPreview(s,sq,draft,q);
 const hints=useJourneyHints(game.profile?.id,goal);
 const banter=journeyBanter(s,sq,clock),memories=availableStories(s),unread=memories.filter(st=>!storyProgress(s).read.includes(st.id)).length;
 function openStory(st:Story){setReading(st);setSheet('story');}
 function act(input:Action,onSuccess?:(state:State)=>void,current:State=s){
  const action=startAction(input),departure=departureStory(current,action);
  if(departure){setPendingDeparture(action);openStory(departure);return true;}
  const ok=dispatch(action,onSuccess);if(!ok)return false;
  if(action.type==='build'){setSheet(null);setView('camp');}
  if(action.type==='prepareRecruitment'&&action.id){const storyId=action.id;const story=stories.find(st=>st.id==='recruit-'+storyId+'-prepared');if(story)openStory(story);}
  if(action.type==='start'&&action.id?.startsWith('join-')){setSquad(action.squad||sq.id);setView('adventure');setSheet(null);}
  return true;
 }
 function openQuests(id=q.id){leaveEditor(()=>{setCandidateQuest(id);setView('adventure');setSheet('quests');});}
 function followGoal(g:JourneyGoal){if(g.destination==='quests'){game.setReport(null);openQuests(g.questId||q.id);return;}leaveEditor(current=>{game.setReport(null);setSheet(null);if(g.questId)setQuest(g.questId);if(g.destination==='build'){setView('camp');setSheet('build');}else if(g.destination==='recruit'){setSheet('recruit');}else if(g.destination==='party'||g.destination==='companions'){const selected=current.squads.find(p=>p.id===sq.id);if(!selected)return;setDraft(selected.members);setView('companions');}else setView(g.destination);});}
 function leaveEditor(next:(state:State)=>void){if(view==='companions'&&dirty)setLeaveAction(()=>next);else next(s);}
 function navigate(value:string){if(value===view){setSheet(null);return;}leaveEditor(current=>{if(value==='companions'){const selected=current.squads.find(p=>p.id===sq.id);if(!selected)return;setDraft(selected.members);}setSheet(null);setView(value);});}
 function chooseSquad(id:string){if(id===sq.id){setSheet(null);return;}leaveEditor(current=>{const p=current.squads.find(p=>p.id===id);if(!p)return;setSquad(id);setDraft(p.members);setSheet(null);});}
 function createSquad(){leaveEditor(()=>{act({type:'newSquad'},current=>{const created=current.squads[current.squads.length-1];setSquad(created.id);setDraft(created.members);setView('companions');setSheet(null);});});}
 function requestReturn(destination:'adventure'|'companions',quest?:string){setReturnIntent({squad:sq.id,destination,quest});}
 function confirmReturn(){if(!returnIntent)return;const target=s.squads.find(p=>p.id===returnIntent.squad);if(!target)return;if(act({type:'stop',squad:target.id})){setSquad(target.id);setDraft(target.members);if(returnIntent.quest)setQuest(returnIntent.quest);setView(returnIntent.destination);setSheet(null);setReturnIntent(null);}}
 function selectQuest(candidate=candidateQuest){
  if(!ready)return;const id=unlocked.find(item=>item.id===candidate)?.id;if(!id)return;
  const choose=()=>{setQuest(id);setSheet(null);setView('adventure');};
  if(run&&run.quest!==id){
   dispatch({type:'stop',squad:sq.id},current=>{choose();act({type:'start',squad:sq.id,id},undefined,current);});
   return;
  }
  choose();
 }
 function finishStory(){if(!reading)return false;const ok=pendingDeparture?dispatch({...pendingDeparture,readDeparture:true}):dispatch({type:'readStory',id:reading.id});if(ok)setPendingDeparture(null);return ok;}
 function closeStory(){setPendingDeparture(null);setSheet(reading?.chapter==='recruitment'?'recruit':null);}
 const sheetModel:SheetModel={sheet,reading,ready,pendingDeparture,activeQuest,banterSnapshot,hero,state:s,goal,prologue,installStatus,game,music,unread,hints,setSheet,openStory,finishStory,closeStory,navigate,followGoal,quest:q,squad:sq,run,preview,draft,act,chooseSquad,candidateQuest,setCandidateQuest,selectQuest,clock,openQuests,setSquad,setView};
 const frame:PhoneFrameModel={...sheetModel,view,returnIntent,leaveAction,ending,banter,quote,destinationChosen:hasDestination(s,sq,questChoices[sq.id]),roster,setBanterSnapshot,setHeroIndex,createSquad,requestReturn,confirmReturn,openRecruit:()=> { leaveEditor(()=> { setSheet('recruit'); }); },setReturnIntent,setLeaveAction,setDraft};
 return <PhoneFrame model={frame}/>;
}
function PhoneHeader({model:m}:{model:PhoneFrameModel}){
 const s=m.state;
 return <><header className="phone-header"><button className="phone-wallet" onClick={()=> { m.setSheet('bag'); }} aria-label="持ちものを開く"><span><Coins/>{compact(s.gold)}</span><span><Leaf/>{compact(s.herbs)}</span><span><Gem/>{compact(s.ore)}</span><span><Logs/>{compact(s.wood)}</span></button><button className="handbook-button" onClick={()=> { m.setSheet('book'); }} aria-label="旅の手帳：ヒント・思い出・アルバム・設定"><BookOpen size={23}/>{(m.game.error||m.hints.unread||(!m.prologue&&m.unread>0))&&<i className="unread-dot" aria-hidden="true"/>}</button></header><GameNotice game={m.game}/></>;
}
function GameNotice({game}:{game:Game}){
 if(!game.error&&!game.otherTab)return null;
 return <div className="phone-notice" role="status"><span>{game.otherTab?'別のタブで冒険中です':game.error}</span>{game.otherTab&&<button onClick={game.takeOver}>ここで続ける</button>}</div>;
}
function AdventureToolbar({model:m}:{model:PhoneFrameModel}){
 if(m.prologue)return null;
 return <div className="adventure-toolbar"><button className="squad-selector" onClick={()=> { m.setSheet('party'); }} aria-label={'冒険する隊を選ぶ：'+squadName(m.squad)}><Users size={16}/><span>{squadName(m.squad)}</span><ChevronRight size={14}/></button>{m.run&&<button className="outline return-button" disabled={!m.ready} onClick={()=> { m.requestReturn('adventure'); }}><House size={15}/>帰還</button>}<button className="outline edit-party" onClick={()=> { m.navigate('companions'); }}>編成</button></div>;
}
function AdventureDestination({model:m}:{model:PhoneFrameModel}){
 const guided=m.prologue&&!m.run&&!m.destinationChosen;
 return <div className="adventure-destination"><div>{(m.destinationChosen||m.run)&&<b>{m.activeQuest?.name||m.quest.name}</b>}</div><div className="quest-control">{!m.run&&m.destinationChosen&&<button className="departure-button" disabled={!m.ready||!!m.ending||!!m.sheet} onClick={()=>{m.act({type:'start',id:m.quest.id,squad:m.squad.id});}}>出発</button>}<button className={'outline quest-entry'+(guided?' quest-entry-guided':'')} aria-label="クエストを開く" aria-describedby={guided?'quest-tutorial':undefined} onClick={()=> { m.openQuests(); }}><Image src="/ui/quest-scroll.png" width={52} height={52} alt="" loading="eager" unoptimized/></button>{guided&&<div className="quest-tutorial" id="quest-tutorial" role="status">ここから<br/><b>クエストを選ぼう</b></div>}</div></div>;
}
function AdventureBanter({model:m}:{model:PhoneFrameModel}){
 if(!m.banter.length)return <div className="phone-banter"><p>{m.quote}</p></div>;
 return <Banter key={(m.game.profile?.id||'')+':'+m.squad.id+':'+(m.run?.quest||'idle')} lines={m.banter} paused={!!m.sheet||!!m.ending||!!m.game.report||!m.ready} onRead={lines=>{m.setBanterSnapshot(lines);m.setSheet('banter');}}/>;
}
function AdventureTab({model:m}:{model:PhoneFrameModel}){
 return <TabsContent value="adventure" className="phone-adventure"><AdventureToolbar model={m}/><AdventureDestination model={m}/><MapStage state={m.state} squad={m.squad} now={m.clock} ready={m.ready} onAction={m.act} startQuest={m.quest.id} paused={!!m.sheet||!!m.returnIntent||!!m.leaveAction||!!m.game.report||!!m.ending}/><AdventureBanter model={m}/></TabsContent>;
}
function CompanionsTab({model:m}:{model:PhoneFrameModel}){
 const toggle=(id:string)=> { m.setDraft(d=>d.includes(id)?d.filter(member=>member!==id):[...d,id]); };
 const inspect=(id:string)=>{m.setHeroIndex(m.roster.findIndex(h=>h.id===id));m.setSheet('personality');};
 return <TabsContent value="companions" className="phone-party"><PartyPanel key={m.squad.id} state={m.state} squad={m.squad} draft={m.draft} ready={m.ready} onChoose={m.chooseSquad} onCreate={m.createSquad} onToggle={toggle} onInspect={inspect} onSave={()=>m.act({type:'party',squad:m.squad.id,members:m.draft})} onDiscard={()=> { m.setDraft(m.squad.members); }} onRename={name=>m.act({type:'nameSquad',squad:m.squad.id,name})} onReturn={()=> { m.requestReturn('companions'); }} onRecruit={m.openRecruit} onPreview={()=> { m.setSheet('preview'); }} onAdventure={()=> { m.navigate('adventure'); }}/></TabsContent>;
}
function CampTab({model:m}:{model:PhoneFrameModel}){
 const s=m.state;
 return <TabsContent value="camp" className="phone-home"><div className="screen-heading"><h2>帰る場所</h2><span className="home-level">{['野営地','酒場','小さな村'][s.town]}</span></div><GuildHome state={s} now={m.clock} ready={m.ready} onAction={m.act} onStory={m.openStory}/><div className="home-menu"><button onClick={()=> { m.setSheet('build'); }}><House/><span>建設</span></button><button onClick={()=> { m.setSheet('upgrade'); }}><Hammer/><span>強化</span></button><button onClick={()=> { m.setSheet('gift'); }}><Gift/><span>差し入れ</span></button></div></TabsContent>;
}
function GameTabs({model:m}:{model:PhoneFrameModel}){
 return <Tabs className="phone-tabs" value={m.view} onValueChange={m.navigate}><div className="phone-screen"><AdventureTab model={m}/><CompanionsTab model={m}/><CampTab model={m}/><TabsContent value="memories" className="phone-memories"><div className="screen-heading"><h2>旅の思い出</h2><button className="outline" onClick={()=> { m.setSheet('journal'); }}>旅の記録</button></div><StoryLibrary state={m.state} onOpen={m.openStory}/></TabsContent></div><TabsList className="phone-navigation"><TabsTrigger value="adventure"><Compass/><span>冒険</span></TabsTrigger>{!m.prologue&&<><TabsTrigger value="companions"><Users/><span>パーティ</span></TabsTrigger><TabsTrigger value="camp"><Flame/><span>拠点</span></TabsTrigger></>}</TabsList></Tabs>;
}
function SheetDialog({model:m}:{model:PhoneFrameModel}){
 const {readerRef,onPointerDownOutside}=useStoryAdvance(),conversation=m.sheet==='story'||m.sheet==='banter';
 const {title,description,content}=resolveSheet(m,readerRef);
 return <Dialog open={!!m.sheet&&!m.ending} onOpenChange={open=>{if(!open&&m.sheet!=='story')m.setSheet(null);}}><DialogContent showCloseButton={m.sheet!=='story'} onPointerDownOutside={conversation?onPointerDownOutside:undefined} onInteractOutside={event=>{if(conversation)event.preventDefault();}} onEscapeKeyDown={event=>{if(m.sheet==='story')event.preventDefault();}} className={'phone-dialog'+(conversation?' story-dialog':'')+(m.sheet==='quests'?' quest-dialog':'')}>{conversation?<StoryHeading title={title} description={description} readerRef={readerRef}/>:<DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>}{content}</DialogContent></Dialog>;
}
function EndingDialog({model:m}:{model:PhoneFrameModel}){
 if(!m.ending)return null;
 const ending=m.ending;
 return <QuestCompletion key={(m.game.profile?.id??'unassigned')+':'+ending.id} story={ending} questName={allQuests.find(q=>q.id===ending.quest)?.name??'不明な依頼'} ready={m.ready} onRead={()=>m.game.dispatch({type:'readStory',id:ending.id})} onClose={()=>{m.game.setReport(null);m.setSheet(null);}}/>;
}
function ReturnDialog({model:m}:{model:PhoneFrameModel}){
 const intent=m.returnIntent;
 const title=intent?.destination==='companions'?'帰還して編成しますか？':intent?.quest?'帰還して行き先を変えますか？':'帰還しますか？';
 const target=m.state.squads.find(p=>p.id===intent?.squad);
 return <AlertDialog open={!!intent} onOpenChange={open=>{if(!open)m.setReturnIntent(null);}}><AlertDialogContent className="game-confirm"><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{target&&squadName(target)}の確保済みの区間報酬は残ります。途中の依頼は最初からになります。{intent?.quest&&'帰還後に行き先を選び直します。自動では出発しません。'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>冒険を続ける</AlertDialogCancel><AlertDialogAction disabled={!m.ready} onClick={e=>{e.preventDefault();m.confirmReturn();}}>{intent?.destination==='companions'?'帰還して編成する':'帰還する'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
function LeaveDialog({model:m}:{model:PhoneFrameModel}){
 const discard=()=>{const next=m.leaveAction;m.setDraft(m.squad.members);m.setLeaveAction(null);next?.(m.state);};
 const save=(event:MouseEvent)=>{event.preventDefault();m.act({type:'party',squad:m.squad.id,members:m.draft},current=>{const next=m.leaveAction;m.setLeaveAction(null);next?.(current);});};
 return <AlertDialog open={!!m.leaveAction} onOpenChange={open=>{if(!open)m.setLeaveAction(null);}}><AlertDialogContent className="game-confirm"><AlertDialogHeader><AlertDialogTitle>編成の変更を保存しますか？</AlertDialogTitle><AlertDialogDescription>選んだ仲間の変更がまだ保存されていません。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>編成に戻る</AlertDialogCancel><button className="outline" onClick={discard}>変更を破棄して続ける</button><AlertDialogAction disabled={!m.ready||!m.draft.length||!!m.run} onClick={save}>保存して続ける</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
function ReportDialog({model:m}:{model:PhoneFrameModel}){
 const report=m.game.report;
 return <Dialog open={!!report&&!m.sheet&&!m.ending} onOpenChange={open=>{if(!open)m.game.setReport(null);}}><DialogContent className="phone-dialog"><DialogHeader><DialogTitle>{m.prologue?'留守の間の交易':'おかえりなさい、団長。'}</DialogTitle><DialogDescription>留守の間の冒険で集めたものです。</DialogDescription></DialogHeader>{report&&<><p>{report.count}件の依頼を達成</p><div className="offline-loot"><span>{fmt(report.gold)} G</span><span>薬草 {report.herbs}</span><span>鉱石 {report.ore}</span><span>木材 {report.wood}</span></div><span>仲間の経験値 +{report.xp}</span>{report.capped&&<small>最大12時間分を集計しました。</small>}{!m.prologue&&<div className="return-goal"><small>次の楽しみ</small><h3>{m.goal.title}</h3><p>{m.goal.detail}</p><button className="full" onClick={()=> { m.followGoal(m.goal); }}>{m.goal.action}</button></div>}<button className="outline full" onClick={()=> { m.game.setReport(null); }}>冒険を見守る</button></>}</DialogContent></Dialog>;
}
function PhoneFrame({model:m}:{model:PhoneFrameModel}){
 return <main className={'phone-game'+(m.prologue?' prologue-game':'')}><Toaster theme="dark" position="top-center"/><PhoneHeader model={m}/><GameTabs model={m}/><SheetDialog model={m}/><EndingDialog model={m}/><ReturnDialog model={m}/><LeaveDialog model={m}/><ReportDialog model={m}/></main>;
}
