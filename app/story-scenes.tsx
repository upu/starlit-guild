'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,ChevronRight} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Sprite} from './sprite';
import {heroes,type State} from '@/lib/game';
import {availableStories,stories,storyProgress,type Story,type StoryLine} from '@/lib/stories';
import {storyArt,storyArtAt,type StoryArt} from '@/lib/story-art';

export function ArtViewer({art,title,onClose}:{art:StoryArt|null;title:string;onClose:()=>void}){
 return <Dialog open={!!art} onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className="art-viewer" closeLabel="鑑賞を終えて戻る"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="sr-only">スチル鑑賞。右上のボタンで元の画面に戻れます。</DialogDescription></DialogHeader><div className="art-canvas">{art&&<img src={art.src} alt={art.alt} width={art.width} height={art.height}/>}</div></DialogContent></Dialog>;
}

export function StoryLines({lines}:{lines:StoryLine[]}){
 return <div className="story-lines">{lines.map((line,i)=>{const hero=heroes.find(h=>h.id===line.speaker);return hero?<div className={`story-line story-${hero.id}`} key={i}><Sprite index={hero.sprite} size={48}/><div><b>{hero.name}</b><p>{line.text}</p></div></div>:<p className="story-narration" key={i}>{line.text}</p>;})}</div>;
}

export function StoryReader({story,ready,onRead,onClose,departure=false}:{story:Story;ready:boolean;onRead:()=>boolean;onClose:()=>void;departure?:boolean}){
 const [page,setPage]=useState(0),[viewArt,setViewArt]=useState(false);
 const pageSize=3,pages=Math.ceil(story.lines.length/pageSize);
 const art=storyArtAt(story.id,page*pageSize);
 const illustration=useRef<HTMLElement>(null);
 useEffect(()=>{if(page>0&&art)illustration.current?.scrollIntoView({block:'start'});},[page,art]);
 const cast=[...new Set(story.lines.flatMap(line=>line.speaker?[line.speaker]:[]))];
 return <div className="story-reader">{art?<figure ref={illustration} className="story-still"><button className="still-expand" onClick={()=>setViewArt(true)} aria-label={'スチルを鑑賞：'+story.title}><img src={art.src} alt={art.alt} width={art.width} height={art.height} decoding="async"/></button></figure>:<div className="story-portraits">{cast.map(id=><Sprite key={id} index={heroes.find(h=>h.id===id)!.sprite} size={68}/>)}</div>}<div key={page}><StoryLines lines={story.lines.slice(page*pageSize,(page+1)*pageSize)}/></div><div className="story-controls"><button className="outline" disabled={page===0} onClick={()=>setPage(page-1)}>前へ</button><span>{page+1} / {pages}</span>{page+1<pages?<button onClick={()=>setPage(page+1)}>つづきを読む<ChevronRight size={16}/></button>:<button disabled={!ready} onClick={()=>{if(onRead())onClose();}}>{departure?'冒険を始める':'思い出にしまう'}</button>}</div>{departure&&<small className="story-hint">読み終えたら出発します。まだ冒険は始まっていません。</small>}<ArtViewer art={viewArt&&art?art:null} title={story.title} onClose={()=>setViewArt(false)}/></div>;
}

export function StoryLibrary({state:s,onOpen}:{state:State;onOpen:(story:Story)=>void}){
 const available=availableStories(s),read=storyProgress(s).read;
 const [viewing,setViewing]=useState<Story|null>(null),[onlyUnread,setOnlyUnread]=useState(false);
 // Later illustrations stay hidden until the story is read, preserving its reveal.
 const gallery=available.filter(st=>storyArtAt(st.id,read.includes(st.id)?Infinity:0));
 const itemsToShow=available.filter(st=>!onlyUnread||!read.includes(st.id));
 return <div className="story-library"><p>出会いも、冒険も、帰ってきた日のことも。</p>{gallery.length>0&&<section><h3>スチルを眺める</h3><div className="still-gallery">{gallery.map(st=><button key={st.id} onClick={()=>setViewing(st)} aria-label={st.title+'のスチルを鑑賞'}><img src={storyArt[st.id].src} alt={storyArt[st.id].alt} width={storyArt[st.id].width} height={storyArt[st.id].height} loading="lazy"/><span>{st.title}</span></button>)}</div></section>}<div className="memory-filters" aria-label="物語の表示"><button aria-pressed={!onlyUnread} onClick={()=>setOnlyUnread(false)}>すべて</button><button aria-pressed={onlyUnread} onClick={()=>setOnlyUnread(true)}>未読 {available.filter(st=>!read.includes(st.id)).length}</button></div>{available.length===0?<div className="story-empty"><BookOpen/><p>最初の思い出は、ふたりで「月しずく草の採取」へ出発すると開きます。</p></div>:itemsToShow.length===0&&<p>すべての思い出を読み終えました。</p>}{(['departure','return','camp','recruitment'] as const).map(chapter=>{const items=itemsToShow.filter(st=>st.chapter===chapter);return items.length>0&&<section key={chapter}><h3>{chapter==='recruitment'?'仲間になるまで':chapter==='departure'?'旅立ちのひと幕':chapter==='return'?'冒険のあとで':'ふたりの日常'}</h3>{items.map(st=><button key={st.id} className="story-entry" onClick={()=>onOpen(st)}><span><small>{st.place}{!read.includes(st.id)&&' · 未読'}</small><b>{st.title}</b></span><ChevronRight size={18}/></button>)}</section>;})}<small>{available.length} / {stories.length} の思い出。留守中に開いた話も、ここに残ります。</small><ArtViewer art={viewing?storyArt[viewing.id]:null} title={viewing?.title||'スチル鑑賞'} onClose={()=>setViewing(null)}/></div>;
}

export function Banter({lines,onRead}:{lines:StoryLine[];onRead:()=>void}){
 return <button className="journey-banter" onClick={onRead} aria-label="道中の掛け合いを読む">{lines.map((line,i)=><span className="banter-line" key={i}><b>{heroes.find(h=>h.id===line.speaker)?.name}</b><span>{line.text}</span></span>)}</button>;
}
