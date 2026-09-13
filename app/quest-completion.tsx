'use client';
import {useState} from 'react';
import {BadgeCheck,ChevronRight} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {Story} from '@/lib/stories';
import {StoryReader} from './story-scenes';
import {useStoryAdvance} from './use-story-advance';

export function QuestCompletion({story,questName,ready,onRead,onClose}:{story:Story;questName:string;ready:boolean;onRead:()=>boolean;onClose:()=>void}){
 const [reading,setReading]=useState(false);
 const {readerRef,onPointerDownOutside}=useStoryAdvance();
 return <Dialog open onOpenChange={()=>{}}>
  <DialogContent className={'phone-dialog '+(reading?'story-dialog':'quest-completion')} showCloseButton={false} onPointerDownOutside={reading?onPointerDownOutside:undefined} onInteractOutside={event=> { event.preventDefault(); }} onEscapeKeyDown={event=> { event.preventDefault(); }}>
   <DialogHeader className={reading?undefined:'sr-only'}><DialogTitle>{reading?story.title:'クエストクリア'}</DialogTitle><DialogDescription>{reading?story.place:questName}</DialogDescription></DialogHeader>
   {reading?<StoryReader story={story} ready={ready} onRead={onRead} onClose={onClose} advanceRef={readerRef}/>:<button className="quest-clear-card" disabled={!ready} onClick={()=> { setReading(true); }}>
    <BadgeCheck size={64} strokeWidth={1.3}/><strong>クエストクリア</strong><span>{questName}</span><small>次へ<ChevronRight size={18}/></small>
   </button>}
  </DialogContent>
 </Dialog>;
}
