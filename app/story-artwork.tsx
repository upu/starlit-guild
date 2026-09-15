'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import Image from 'next/image';
import type {StoryArt} from '@/lib/story-art';

function subscribeMotion(callback:()=>void){
 const query=window.matchMedia('(prefers-reduced-motion: reduce)');
 query.addEventListener('change',callback);
 document.addEventListener('visibilitychange',callback);
 return ()=>{query.removeEventListener('change',callback);document.removeEventListener('visibilitychange',callback);};
}
const canMove=()=>!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverMotion=()=>false;

export function StoryArtwork({art,active=true,onClick,label,buttonClass}:{art:StoryArt;active?:boolean;onClick:()=>void;label:string;buttonClass:string}){
 const motion=useSyncExternalStore(subscribeMotion,canMove,serverMotion);
 const [paused,setPaused]=useState(false),[failed,setFailed]=useState(false);
 const video=useRef<HTMLVideoElement>(null);
 const animate=!!art.videoSrc&&motion&&active&&!failed;
 useEffect(()=>{
  const element=video.current;
  if(!element||!animate)return;
  let cancelled=false;
  if(paused)element.pause();
  else void element.play().catch(()=>{if(!cancelled)setFailed(true);});
  return ()=>{cancelled=true;element.pause();};
 },[animate,paused]);
 return <div className="story-artwork">
  <button type="button" className={buttonClass} onClick={onClick} aria-label={label}>
   {animate?<video ref={video} src={art.videoSrc} poster={art.src} width={art.width} height={art.height} muted autoPlay={!paused} loop playsInline preload="none" tabIndex={-1} aria-label={art.alt} onError={()=>{setFailed(true);}}/>
    :<Image src={art.src} alt={art.alt} width={art.width} height={art.height} loading="eager" unoptimized/>}
  </button>
  {animate&&<button type="button" className="story-video-toggle" onClick={()=>{setPaused(value=>!value);}} aria-pressed={paused}>{paused?'動画を再生':'動画を一時停止'}</button>}
 </div>;
}
