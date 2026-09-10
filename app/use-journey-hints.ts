'use client';
import {useCallback,useSyncExternalStore} from 'react';
import {journeyHintKey,type JourneyGoal} from '@/lib/journey';

const changed='starlit-hints-changed';
const fallback=new Map<string,string>();
function subscribe(notify:()=>void){
 window.addEventListener('storage',notify);window.addEventListener(changed,notify);
 return ()=>{window.removeEventListener('storage',notify);window.removeEventListener(changed,notify);};
}
function read(key:string){if(fallback.has(key))return fallback.get(key)!;try{return localStorage.getItem(key)||'[]';}catch{return '[]';}}
function entries(raw:string):string[]{try{const value=JSON.parse(raw);return Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'):[];}catch{return [];}}
const serverSnapshot=()=>'[]';

// Hint acknowledgements belong to this device and adventure, separate from game saves.
export function useJourneyHints(profileId:string|undefined,goal:JourneyGoal){
 const key='starlit-journey-hints-v1:'+profileId;
 const snapshot=useCallback(()=>read(key),[key]);
 const raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const hint=journeyHintKey(goal);
 function markRead(){
  if(!profileId)return;
  const seen=entries(read(key));if(seen.includes(hint))return;
  const value=JSON.stringify([...seen,hint]);
  try{localStorage.setItem(key,value);fallback.delete(key);}catch{fallback.set(key,value);}
  window.dispatchEvent(new Event(changed));
 }
 return {unread:!!profileId&&!entries(raw).includes(hint),markRead};
}
