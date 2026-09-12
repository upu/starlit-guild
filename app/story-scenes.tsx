'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,ChevronRight,Images} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Portrait} from './portrait';
import {heroes,allQuests,type State} from '@/lib/game';
import {originalCharacters} from '@/lib/original-characters';
import {prologueStages} from '@/lib/prologue';
import {availableStories,stories,storyProgress,type Story,type StoryLine} from '@/lib/stories';
import {storyArtAt,type StoryArt} from '@/lib/story-art';
const characters=[...heroes,...originalCharacters.filter(c=>!heroes.some(h=>h.id===c.id))];

export function ArtViewer({art,title,onClose}:{art:StoryArt|null;title:string;onClose:()=>void}){
 return <Dialog open={!!art} onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className="art-viewer" showCloseButton={false}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="sr-only">画像や余白をタップすると元の画面に戻ります。</DialogDescription></DialogHeader><button type="button" className="art-canvas" onClick={onClose} aria-label="鑑賞を終えて戻る">{art&&<img src={art.src} alt={art.alt} width={art.width} height={art.height}/>}</button><button type="button" className="art-return" onClick={onClose}>戻る</button></DialogContent></Dialog>;
}

export function StoryLines({lines}:{lines:StoryLine[]}){
 return <div className="story-lines">{lines.map((line,i)=>{const hero=characters.find(h=>h.id===line.speaker);return hero?<div className={`story-line story-${hero.id}`} key={i}><Portrait index={hero.sprite} size={72}/><div><b>{hero.name}</b><p>{line.text}</p></div></div>:<p className="story-narration" key={i}>{line.text}</p>;})}</div>;
}

export function StoryReader({story,ready,onRead,onClose,departure=false}:{story:Story;ready:boolean;onRead:()=>boolean;onClose:()=>void;departure?:boolean}){
 const [page,setPage]=useState(0),[viewArt,setViewArt]=useState(false);
 const pages=story.lines.length,art=storyArtAt(story.id,page);
 return <div className="story-reader">
  {art&&<figure className="story-still"><button className="still-expand" onClick={()=> { setViewArt(true); }} aria-label={'絵を大きく見る：'+story.title}><img src={art.src} alt={art.alt} width={art.width} height={art.height} decoding="async"/></button></figure>}
  <div key={page} className="dialogue-page"><StoryLines lines={story.lines.slice(page,page+1)}/></div>
  <div className="story-controls"><button className="outline" disabled={page===0} onClick={()=> { setPage(page-1); }}>前へ</button><span>{page+1} / {pages}</span>{page+1<pages?<button onClick={()=> { setPage(page+1); }}>次へ<ChevronRight size={16}/></button>:<button disabled={!ready} onClick={()=>{if(onRead())onClose();}}>{departure?'冒険を始める':'閉じる'}</button>}</div>
  <ArtViewer art={viewArt&&art?art:null} title={story.title} onClose={()=> { setViewArt(false); }}/>
 </div>;
}

export function ConversationReader({lines,onClose}:{lines:StoryLine[];onClose:()=>void}){
 return <StoryReader story={{id:'journey-conversation',title:'道中の会話',place:'道中',chapter:'departure',lines}} ready onRead={()=>true} onClose={onClose}/>;
}

export function memoryGroups(items:Story[]){
 const questIds=[...prologueStages.map(stage=>stage.quest),...new Set(items.filter(st=>st.chapter==='departure'||st.chapter==='return').flatMap(st=>st.quest?[st.quest]:[]))];
 const journey=[...new Set(questIds)].flatMap(id=>{
  const entries=items.filter(st=>st.quest===id&&(st.chapter==='departure'||st.chapter==='return')).sort((a,b)=>Number(a.chapter==='return')-Number(b.chapter==='return'));
  const stage=prologueStages.find(stage=>stage.quest===id),quest=allQuests.find(q=>q.id===id);
  return entries.length?[{id,title:(stage?stage.label.split(' ')[0]+' · ':'')+(quest?.name||entries[0].title),items:entries}]:[];
 });
 const other=(['camp','encounter','recruitment'] as const).flatMap(chapter=>{
  const entries=items.filter(st=>st.chapter===chapter);
  return entries.length?[{id:chapter,title:chapter==='camp'?'拠点の日常':chapter==='encounter'?'仲間と来客':'仲間になるまで',items:entries}]:[];
 });
 return [...journey,...other];
}

export function StoryAlbum({state:s,onBack}:{state:State;onBack:()=>void}){
 const [viewing,setViewing]=useState<Story|null>(null),read=storyProgress(s).read;
 // Preserve reveal rules; only mount gallery images inside the album.
 const gallery=availableStories(s).flatMap(st=>{const art=storyArtAt(st.id,read.includes(st.id)?Infinity:0);return art?[{story:st,art}]:[];});
 return <section className="story-album"><button className="outline" onClick={onBack}>思い出へ戻る</button><h3>アルバム</h3>
  {gallery.length?<div className="still-gallery">{gallery.map(({story:st,art})=><button key={st.id} onClick={()=> { setViewing(st); }} aria-label={st.title+'の絵を大きく見る'}><img src={art.src} alt={art.alt} width={art.width} height={art.height} loading="lazy"/><span>{st.title}</span></button>)}</div>:<p>物語で出会った絵が、ここに残ります。</p>}
  <ArtViewer art={viewing?storyArtAt(viewing.id,Infinity)||null:null} title={viewing?.title||'アルバム'} onClose={()=> { setViewing(null); }}/>
 </section>;
}

export function StoryLibrary({state:s,onOpen}:{state:State;onOpen:(story:Story)=>void}){
 const available=availableStories(s),read=storyProgress(s).read;
 const [album,setAlbum]=useState(false),[onlyUnread,setOnlyUnread]=useState(false);
 const itemsToShow=available.filter(st=>!onlyUnread||!read.includes(st.id));
 if(album)return <StoryAlbum state={s} onBack={()=> { setAlbum(false); }}/>;
 return <div className="story-library">
  <button className="story-entry album-entry" onClick={()=> { setAlbum(true); }}><Images size={22}/><span><b>アルバム</b><small>旅で出会った景色を眺める</small></span><ChevronRight size={18}/></button>
  <div className="memory-filters" aria-label="物語の表示"><button aria-pressed={!onlyUnread} onClick={()=> { setOnlyUnread(false); }}>すべて</button><button aria-pressed={onlyUnread} onClick={()=> { setOnlyUnread(true); }}>未読 {available.filter(st=>!read.includes(st.id)).length}</button></div>
  {available.length===0?<div className="story-empty"><BookOpen/><p>最初の思い出は、ふたりで「街への交易」へ出発すると開きます。</p></div>:itemsToShow.length===0&&<p>すべての思い出を読み終えました。</p>}
  {memoryGroups(itemsToShow).map(group=><section key={group.id}><h3>{group.title}</h3>{group.items.map(st=><button key={st.id} className="story-entry" onClick={()=> { onOpen(st); }}><span><small>{st.chapter==='departure'?'出発前':st.chapter==='return'?'達成後':st.place}{!read.includes(st.id)&&' · 未読'}</small><b>{st.title}</b></span><ChevronRight size={18}/></button>)}</section>)}
  <small>{available.length} / {stories.length} の思い出。留守中に開いた話も、ここに残ります。</small>
 </div>;
}

export function Banter({lines,onRead,paused=false}:{lines:StoryLine[];onRead:(lines:StoryLine[])=>void;paused?:boolean}){
 const [exchange,setExchange]=useState({lines,index:0});
 const latest=useRef(lines);
 useEffect(()=>{latest.current=lines;},[lines]);
 const line=exchange.lines.at(exchange.index);
 useEffect(()=>{
  if(paused||!line)return;
  let timer:ReturnType<typeof setTimeout>;
  const schedule=()=>{
   clearTimeout(timer);
   if(document.hidden)return;
   timer=setTimeout(()=>{
    setExchange(current=>current.index+1<current.lines.length?{...current,index:current.index+1}:{lines:latest.current,index:0});
   },Math.max(3500,line.text.length*100));
  };
  schedule();document.addEventListener('visibilitychange',schedule);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
 },[exchange,paused,line]);
 if(!line)return null;
 const speaker=characters.find(h=>h.id===line.speaker);
 return <button className="journey-banter" onClick={()=> { onRead(exchange.lines); }} aria-label="道中の掛け合いを読む">
  {speaker&&<span className="banter-portrait"><Portrait index={speaker.sprite} size={72}/></span>}
  <span className="banter-copy" key={exchange.index.toString()+':'+line.text}><span className="banter-line"><b>{speaker?.name}</b><span>{line.text}</span></span></span><ChevronRight className="banter-chevron" size={18}/>
 </button>;
}
