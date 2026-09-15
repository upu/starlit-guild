'use client';
import {useEffect,useImperativeHandle,useRef,useState,type Ref} from 'react';
import Image from 'next/image';
import {BookOpen,ChevronRight} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Portrait} from './portrait';
import {StoryArtwork} from './story-artwork';
import {heroes,allQuests,type State} from '@/lib/game';
import {originalCharacters} from '@/lib/original-characters';
import {storyStages} from '@/lib/prologue';
import {availableStories,stories,storyProgress,type Story,type StoryLine} from '@/lib/stories';
import {storyArtAt,type StoryArt} from '@/lib/story-art';
import type {StoryAdvance} from './use-story-advance';
const characters=[...heroes,...originalCharacters.filter(c=>!heroes.some(h=>h.id===c.id))];

export function ArtViewer({art,title,onClose}:{art:StoryArt|null;title:string;onClose:()=>void}){
 return <Dialog open={!!art} onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className="art-viewer" showCloseButton={false}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="sr-only">画像や余白をタップすると元の画面に戻ります。</DialogDescription></DialogHeader>{art&&<StoryArtwork key={art.src} art={art} onClick={onClose} label="鑑賞を終えて戻る" buttonClass="art-canvas"/>}<button type="button" className="art-return" onClick={onClose}>戻る</button></DialogContent></Dialog>;
}

export function StoryLines({lines,startIndex=0}:{lines:StoryLine[];startIndex?:number}){
 return <div className="story-lines">{lines.map((line,i)=>{const hero=characters.find(h=>h.id===line.speaker);return hero?<div className={`story-line story-${hero.id}`} key={startIndex+i}><Portrait index={hero.sprite} size={72} expression={line.expression}/><div><b>{hero.name}</b><p>{line.text}</p></div></div>:<p className="story-narration" key={startIndex+i}>{line.text}</p>;})}</div>;
}

export function StoryReader({story,ready,onRead,onClose,departure=false,advanceRef}:{story:Story;ready:boolean;onRead:()=>boolean;onClose:()=>void;departure?:boolean;advanceRef?:Ref<StoryAdvance>}){
 const [page,setPage]=useState(0),[viewArt,setViewArt]=useState(false);
 const dialogue=useRef<HTMLDivElement>(null);
 const gesture=useRef<{x:number;y:number;scrollTop:number;moved:boolean}|null>(null),finishing=useRef(false);
 useEffect(()=>{if(dialogue.current)dialogue.current.scrollTop=dialogue.current.scrollHeight;},[page]);
 const pages=story.lines.length,art=storyArtAt(story.id,page);
 const last=page+1>=pages,advanceLabel=last?(departure?'冒険を始める':'閉じる'):'会話を進める';
 function advance(){
  if(viewArt||finishing.current)return;
  if(!last){setPage(page+1);return;}
  if(!ready)return;
  finishing.current=true;
  if(onRead())onClose();else finishing.current=false;
 }
 useImperativeHandle(advanceRef,()=>({advance}));
 return <div className={'story-reader'+(art?' story-reader-art':'')}>
  <div className="story-art-space">{art&&<figure className="story-still"><StoryArtwork key={art.src} art={art} active={!viewArt} onClick={()=> { setViewArt(true); }} label={'絵を大きく見る：'+story.title} buttonClass="still-expand"/></figure>}</div>
  <div className="story-conversation" role="button" tabIndex={0} aria-label={advanceLabel} aria-disabled={last&&!ready}
   onPointerDown={event=>{gesture.current={x:event.clientX,y:event.clientY,scrollTop:dialogue.current?.scrollTop||0,moved:false};}}
   onPointerMove={event=>{const start=gesture.current;if(start&&(Math.abs(event.clientX-start.x)>8||Math.abs(event.clientY-start.y)>8))start.moved=true;}}
   onPointerCancel={()=>{if(gesture.current)gesture.current.moved=true;}}
   onClick={()=>{const start=gesture.current;gesture.current=null;if(start&&(start.moved||Math.abs((dialogue.current?.scrollTop||0)-start.scrollTop)>4))return;advance();}}
   onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&!event.repeat){event.preventDefault();advance();}}}>
   <div ref={dialogue} className="dialogue-page dialogue-history"><StoryLines lines={story.lines.slice(0,page+1)}/></div>
   <div className="story-tap-hint" aria-hidden="true"><span>{page+1} / {pages}</span><span className={last?"story-end-action":"story-continue"}>{last?advanceLabel:"▼"}</span></div>
  </div>
  <ArtViewer art={viewArt&&art?art:null} title={story.title} onClose={()=> { setViewArt(false); }}/>
 </div>;
}

export function ConversationReader({lines,onClose,advanceRef}:{lines:StoryLine[];onClose:()=>void;advanceRef?:Ref<StoryAdvance>}){
 return <StoryReader story={{id:'journey-conversation',title:'道中の会話',place:'道中',chapter:'departure',lines}} ready onRead={()=>true} onClose={onClose} advanceRef={advanceRef}/>;
}

export function memoryGroups(items:Story[]){
 const questIds=[...storyStages.map(stage=>stage.quest),...new Set(items.filter(st=>st.chapter==='departure'||st.chapter==='return').flatMap(st=>st.quest?[st.quest]:[]))];
 const journey=[...new Set(questIds)].flatMap(id=>{
  const entries=items.filter(st=>st.quest===id&&(st.chapter==='departure'||st.chapter==='return')).sort((a,b)=>Number(a.chapter==='return')-Number(b.chapter==='return'));
  const stage=storyStages.find(stage=>stage.quest===id),quest=allQuests.find(q=>q.id===id);
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
 return <section className="story-album"><button className="outline" onClick={onBack}>旅の手帳へ戻る</button>
  {gallery.length?<div className="still-gallery">{gallery.map(({story:st,art})=><button key={st.id} onClick={()=> { setViewing(st); }} aria-label={st.title+'の絵を大きく見る'}><Image src={art.src} alt={art.alt} width={art.width} height={art.height} loading="lazy" unoptimized/><span>{st.title}</span></button>)}</div>:<p>物語で出会った絵が、ここに残ります。</p>}
  <ArtViewer art={viewing?storyArtAt(viewing.id,Infinity)||null:null} title={viewing?.title||'アルバム'} onClose={()=> { setViewing(null); }}/>
 </section>;
}

export function StoryLibrary({state:s,onOpen}:{state:State;onOpen:(story:Story)=>void}){
 const available=availableStories(s),read=storyProgress(s).read;
 const [onlyUnread,setOnlyUnread]=useState(false);
 const itemsToShow=available.filter(st=>!onlyUnread||!read.includes(st.id));
 return <div className="story-library">
  <div className="memory-filters" aria-label="物語の表示"><button aria-pressed={!onlyUnread} onClick={()=> { setOnlyUnread(false); }}>すべて</button><button aria-pressed={onlyUnread} onClick={()=> { setOnlyUnread(true); }}>未読 {available.filter(st=>!read.includes(st.id)).length}</button></div>
  {available.length===0?<div className="story-empty"><BookOpen/><p>最初の思い出は、ふたりで「街への交易」へ出発すると開きます。</p></div>:itemsToShow.length===0&&<p>すべての思い出を読み終えました。</p>}
  {memoryGroups(itemsToShow).map(group=><section key={group.id}><h3>{group.title}</h3>{group.items.map(st=><button key={st.id} className="story-entry" onClick={()=> { onOpen(st); }}><span><small>{st.chapter==='departure'?'出発前':st.chapter==='return'?'達成後':st.place}{!read.includes(st.id)&&' · 未読'}</small><b>{st.title}</b></span><ChevronRight size={18}/></button>)}</section>)}
  <small>{available.length} / {stories.length} の思い出。留守中に開いた話も、ここに残ります。</small>
 </div>;
}

function sameBanter(left:StoryLine[],right:StoryLine[]){
 return left.length===right.length&&left.every((entry,i)=>entry.speaker===right[i].speaker&&entry.text===right[i].text&&entry.expression===right[i].expression);
}

export function Banter({lines,onRead,paused=false}:{lines:StoryLine[];onRead:(lines:StoryLine[])=>void;paused?:boolean}){
 const [exchange,setExchange]=useState({lines,index:0,history:lines.slice(0,1),turn:0});
 const dialogue=useRef<HTMLButtonElement>(null);
 const followLatest=useRef(true);
 useEffect(()=>{if(dialogue.current&&followLatest.current)dialogue.current.scrollTop=dialogue.current.scrollHeight;},[exchange]);
 const latest=useRef(lines);
 useEffect(()=>{latest.current=lines;},[lines]);
 const line=exchange.lines.at(exchange.index);
 // Compare content, not the new array journeyBanter returns on every clock tick.
 const hasNext=exchange.index+1<exchange.lines.length||(lines.length>0&&!sameBanter(exchange.lines,lines));
 useEffect(()=>{
  if(paused||!hasNext)return;
  let timer:ReturnType<typeof setTimeout>;
  const schedule=()=>{
   clearTimeout(timer);
   if(document.hidden)return;
   timer=setTimeout(()=>{
    setExchange(current=>{
     const continuing=current.index+1<current.lines.length,index=continuing?current.index+1:0,nextLines=continuing?current.lines:latest.current,nextLine=nextLines.at(index);
     if(!nextLine||(!continuing&&sameBanter(current.lines,nextLines)))return current;
     // Keep completed exchanges visible, but only append when there is new dialogue.
     return {lines:nextLines,index,history:[...current.history,nextLine].slice(-100),turn:current.turn+1};
    });
   },Math.max(3500,(line?.text.length||0)*100));
  };
  schedule();document.addEventListener('visibilitychange',schedule);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
 },[exchange,paused,line,hasNext]);
 if(!line)return null;
 return <button ref={dialogue} className="journey-banter journey-banter-history" onScroll={event=>{const el=event.currentTarget;followLatest.current=el.scrollHeight-el.scrollTop-el.clientHeight<8;}} onClick={()=> { onRead(exchange.lines); }} aria-label="道中の掛け合いを読む">
  <span className="banter-copy">{exchange.history.map((entry,i)=>{
   const speaker=characters.find(h=>h.id===entry.speaker);
   return <span className="banter-line" key={exchange.turn-exchange.history.length+1+i}>
    {speaker&&<Portrait index={speaker.sprite} size={64} expression={entry.expression}/>}
    <span className="banter-message">{speaker&&<b>{speaker.name}</b>}{entry.text}</span>
   </span>;
  })}</span>
 </button>;
}
