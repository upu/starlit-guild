'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,ChevronRight} from 'lucide-react';
import {Sprite} from './sprite';
import {heroes,type State} from '@/lib/game';
import {availableStories,stories,storyProgress,type Story,type StoryLine} from '@/lib/stories';
import {storyArtAt} from '@/lib/story-art';

export function StoryLines({lines}:{lines:StoryLine[]}){
 return <div className="story-lines">{lines.map((line,i)=>{const hero=heroes.find(h=>h.id===line.speaker);return hero?<div className={`story-line story-${hero.id}`} key={i}><Sprite index={hero.sprite} size={48}/><div><b>{hero.name}</b><p>{line.text}</p></div></div>:<p className="story-narration" key={i}>{line.text}</p>;})}</div>;
}

export function StoryReader({story,ready,onRead,onClose}:{story:Story;ready:boolean;onRead:()=>boolean;onClose:()=>void}){
 const [page,setPage]=useState(0);
 const pageSize=3,pages=Math.ceil(story.lines.length/pageSize);
 const art=storyArtAt(story.id,page*pageSize);
 const illustration=useRef<HTMLElement>(null);
 useEffect(()=>{if(page>0&&art)illustration.current?.scrollIntoView({block:'start'});},[page,art]);
 const cast=[...new Set(story.lines.flatMap(line=>line.speaker?[line.speaker]:[]))];
 return <div className="story-reader">{art?<figure ref={illustration} className="story-still"><img src={art.src} alt={art.alt} width={art.width} height={art.height} decoding="async"/></figure>:<div className="story-portraits">{cast.map(id=><Sprite key={id} index={heroes.find(h=>h.id===id)!.sprite} size={68}/>)}</div>}<div key={page}><StoryLines lines={story.lines.slice(page*pageSize,(page+1)*pageSize)}/></div><div className="story-controls"><button className="outline" disabled={page===0} onClick={()=>setPage(page-1)}>前へ</button><span>{page+1} / {pages}</span>{page+1<pages?<button onClick={()=>setPage(page+1)}>つづきを読む<ChevronRight size={16}/></button>:<button disabled={!ready} onClick={()=>{if(onRead())onClose();}}>思い出にしまう</button>}</div><button className="quiet full" onClick={onClose}>あとで読む</button><small className="story-hint">冒険はこの間も進みます。閉じても「旅の思い出」から読み返せます。</small></div>;
}

export function StoryLibrary({state:s,onOpen}:{state:State;onOpen:(story:Story)=>void}){
 const available=availableStories(s),read=storyProgress(s).read;
 return <div className="story-library"><p>仲間との出会いや加入、アリアとレオンの旅、拠点の日常を読み返せます。新しい話は、冒険や支度が進むとここに残ります。</p>{available.length===0&&<div className="story-empty"><BookOpen/><p>最初の思い出は、ふたりで「月しずく草の採取」へ出発すると開きます。</p></div>}{(['recruitment','departure','return','camp'] as const).map(chapter=>{const items=available.filter(st=>st.chapter===chapter);return items.length>0&&<section key={chapter}><h3>{chapter==='recruitment'?'仲間になるまで':chapter==='departure'?'旅立ちのひと幕':chapter==='return'?'冒険のあとで':'ふたりの日常'}</h3>{items.map(st=><button key={st.id} className="story-entry" onClick={()=>onOpen(st)}><span><small>{st.place}{!read.includes(st.id)&&' · 未読'}</small><b>{st.title}</b></span><ChevronRight size={18}/></button>)}</section>;})}<small>{available.length} / {stories.length} の思い出。留守中に開いた話も、ここに残ります。</small></div>;
}

export function Banter({lines,onRead,label='ふたりの道中'}:{lines:StoryLine[];onRead:()=>void;label?:string}){
 return <button className="journey-banter" onClick={onRead} aria-label="道中の掛け合いを読む"><span className="banter-label">{label} <ChevronRight size={14}/></span>{lines.map((line,i)=><span className="banter-line" key={i}><b>{heroes.find(h=>h.id===line.speaker)?.name}</b><span>{line.text}</span></span>)}</button>;
}
