'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {act,initialState,migrate,settle,testState,type Action,type Rewards,type State} from '@/lib/game';
import {parseBundle,type SaveBundle,type Profile} from '@/lib/save-format';
import {journeyNotice} from '@/lib/journey';
import {setSound,sound,soundEvents,unlockSound} from '@/lib/sound';
export const SAVE_KEY='starlit-guild-v4';
const LEASE=SAVE_KEY+'-tab',FIVE_MINUTES=300000;
type CloudCopy={bundle:SaveBundle;at:number};
function newProfile(test=false):Profile{return {id:crypto.randomUUID(),name:test?'テスト用の冒険':'新しい冒険',test,state:initialState(Date.now())};}
function celebrate(before:Parameters<typeof journeyNotice>[0],after:Parameters<typeof journeyNotice>[1]){if(document.visibilityState!=='visible')return;const notice=journeyNotice(before,after);if(notice)toast.success(notice.title,{description:notice.description,duration:4500,id:'journey-moment'});}
function fresh():SaveBundle{const p=newProfile();return {format:4,deviceId:crypto.randomUUID(),active:p.id,profiles:[p],serial:0,sound:true,cloudAt:0,legacyImported:false};}
export function useLocalGame(){
 const [bundle,setBundle]=useState<SaveBundle|null>(null),[clock,setClock]=useState(0),[error,setError]=useState(''),[cloudError,setCloudError]=useState(''),[cloudBusy,setCloudBusy]=useState(false),[copies,setCopies]=useState<CloudCopy[]>([]),[otherTab,setOtherTab]=useState(false),[saved,setSaved]=useState(0),[report,setReport]=useState<Rewards|null>(null);
 const current=useRef<SaveBundle|null>(null),tabId=useRef(''),owner=useRef(false),busy=useRef(false),lastAttempt=useRef(0),mounted=useRef(false);
 const publish=useCallback((b:SaveBundle)=>{current.current=b;setBundle({...b});},[]);
 const persist=useCallback(()=>{const b=current.current;if(!b||!owner.current)return;try{b.serial++;localStorage.setItem(SAVE_KEY,JSON.stringify(b));setSaved(Date.now());setError('');}catch{setError('端末に保存できません。空き容量を確認し、セーブ画面からファイルを保管してください。');}},[]);
 const advance=useCallback((now:number)=>{const b=current.current;if(!b||!owner.current)return;const p=b.profiles.find(p=>p.id===b.active)!;const before=p.state,previous=before.updatedAt;const result=settle(before,now);p.state=result.state;if(!result.rewards.offline)celebrate(before,p.state);
  if(result.rewards.offline&&(result.rewards.count||result.rewards.gold||result.rewards.wood||result.rewards.herbs||result.rewards.ore||result.rewards.xp))setReport(result.rewards);
  if(document.visibilityState==='visible'){const recent=p.state.squads.flatMap(s=>s.run?.events||[]).filter(e=>e.at>previous&&now-e.at<350&&!['assist','move','rest'].includes(e.kind));soundEvents(recent);if(result.rewards.count&&!result.rewards.offline)sound('clear');}
  setClock(now);publish(b);
 },[publish]);
 const backup=useCallback(async()=>{if(!current.current||!owner.current||busy.current)return;persist();busy.current=true;setCloudBusy(true);lastAttempt.current=Date.now();
  try{const res=await fetch('/api/backup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(current.current),signal:AbortSignal.timeout(15000)});const data=await res.json() as {at:number;error?:string};if(!res.ok)throw Error(data.error||'バックアップを作れませんでした。');if(mounted.current&&current.current){current.current.cloudAt=data.at;publish(current.current);persist();setCloudError('');}}
  catch(e){if(mounted.current)setCloudError((e as Error).message);}
  finally{busy.current=false;if(mounted.current)setCloudBusy(false);}
 },[persist,publish]);
 const refreshCopies=useCallback(async()=>{
  try{const res=await fetch('/api/backup',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!res.ok)throw Error('クラウドに接続できません。端末の記録でそのまま遊べます。');const data=await res.json() as {backups:{bundle:unknown;at:number}[];legacy:Parameters<typeof migrate>[0]|null};if(!mounted.current)return;
   const list:CloudCopy[]=[];for(const copy of data.backups||[]){try{list.push({bundle:parseBundle(copy.bundle),at:copy.at});}catch{/* An incompatible backup stays on the server. */}}setCopies(list);setCloudError('');
   const b=current.current;if(b&&owner.current&&!b.legacyImported){if(data.legacy&&b.profiles.length<12){try{b.profiles.push({id:crypto.randomUUID(),name:'以前の冒険',test:false,state:migrate(data.legacy,Date.now())});toast.info('以前の冒険は「セーブ」に残しました。今は最初から遊べます。');}catch{setCloudError('以前の記録はクラウドに残っていますが、この版では読み込めませんでした。');return;}}
    b.legacyImported=true;publish(b);persist();}
  }catch(e){if(mounted.current)setCloudError((e as Error).message);}
 },[persist,publish]);
 useEffect(()=>{
  mounted.current=true;tabId.current=crypto.randomUUID();lastAttempt.current=Date.now();
  const lease=()=>{try{return JSON.parse(localStorage.getItem(LEASE)||'null') as {id:string;until:number}|null;}catch{return null;}};
  const acquire=()=>{const l=lease(),allowed=!l||l.id===tabId.current||l.until<Date.now();if(allowed&&(!owner.current||l?.id!==tabId.current)&&current.current){const raw=localStorage.getItem(SAVE_KEY);if(raw){const latest=parseBundle(JSON.parse(raw));if(latest.serial>=current.current.serial)publish(latest);}}owner.current=allowed;if(owner.current)localStorage.setItem(LEASE,JSON.stringify({id:tabId.current,until:Date.now()+6000}));setOtherTab(!owner.current);};
  const load=()=>{try{const raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem('starlit-guild-v3');const b=raw?parseBundle(JSON.parse(raw)):fresh();publish(b);setSound(b.sound);acquire();advance(Date.now());persist();}catch{setError('端末の記録を読み込めませんでした。保存ファイルから復元してください。元の記録は上書きしていません。');}};
  const init=setTimeout(()=>{load();void refreshCopies();},0);
  const tick=setInterval(()=>{if(document.visibilityState==='visible')advance(Date.now());},200);
  const disk=setInterval(()=>{if(document.visibilityState==='visible')persist();},1000);
  const heartbeat=setInterval(()=>{try{if(document.visibilityState==='visible')acquire();}catch{owner.current=false;setOtherTab(true);}},2000);
  const cloud=setInterval(()=>{if(document.visibilityState==='visible'&&Date.now()-lastAttempt.current>=FIVE_MINUTES)void backup();},10000);
  const visible=()=>{if(document.visibilityState==='visible'){try{acquire();advance(Date.now());if(Date.now()-lastAttempt.current>=FIVE_MINUTES)void backup();}catch{owner.current=false;setOtherTab(true);}}else advance(Date.now());persist();};
  const changed=(e:StorageEvent)=>{if(e.key===LEASE){const l=lease();if(l&&l.id!==tabId.current){owner.current=false;setOtherTab(true);}}if(e.key===SAVE_KEY&&e.newValue&&!owner.current){try{publish(parseBundle(JSON.parse(e.newValue)));}catch{/* Keep the last readable record. */}}};
  const closing=()=>{const l=lease();if(l?.id!==tabId.current)owner.current=false;advance(Date.now());persist();};
  document.addEventListener('visibilitychange',visible);window.addEventListener('pagehide',closing);window.addEventListener('storage',changed);
  return()=>{closing();mounted.current=false;clearTimeout(init);clearInterval(tick);clearInterval(disk);clearInterval(heartbeat);clearInterval(cloud);document.removeEventListener('visibilitychange',visible);window.removeEventListener('pagehide',closing);window.removeEventListener('storage',changed);try{if(lease()?.id===tabId.current)localStorage.removeItem(LEASE);}catch{}}
 },[advance,backup,persist,publish,refreshCopies]);
 const dispatch=useCallback((a:Action,onSuccess?:(state:State)=>void)=>{const b=current.current;if(!b||!owner.current)return false;unlockSound();try{advance(Date.now());const p=b.profiles.find(p=>p.id===b.active)!;const before=p.state;p.state=act(before,a,Date.now());publish(b);persist();celebrate(before,p.state);const known=new Set(before.squads.flatMap(s=>s.run?.events.map(e=>e.id)||[]));const added=p.state.squads.flatMap(s=>s.run?.events||[]).filter(e=>!known.has(e.id)&&e.kind!=='assist');if(added.length)soundEvents(added);if(a.type==='assist')sound(a.mode==='heal'?'heal':'assist',true);else if(['start','build','prepareRecruitment','gear'].includes(a.type))sound('clear',true);if(a.type==='party')toast.success('編成を保存しました。',{id:'party-saved'});onSuccess?.(p.state);return true;}catch(e){toast.error((e as Error).message);return false;}},[advance,persist,publish]);
 const switchProfile=useCallback((id:string)=>{const b=current.current;if(!b||!owner.current||!b.profiles.some(p=>p.id===id))return;advance(Date.now());b.active=id;setReport(null);advance(Date.now());persist();},[advance,persist]);
 const createProfile=useCallback((test=false)=>{const b=current.current;if(!b||!owner.current)return;if(b.profiles.length>=12){toast.error('記録は12個までです。既存のテスト記録を選んで調整できます。');return;}advance(Date.now());const p=newProfile(test);p.name+=` ${b.profiles.filter(p=>p.test===test).length+1}`;b.profiles.push(p);b.active=p.id;publish(b);setReport(null);persist();toast.success(test?'テスト用の冒険を作りました。':'以前の記録を残して、最初から始めます。');},[advance,persist,publish]);
 const adjust=useCallback((clears:number,lv:number,gold:number)=>{const b=current.current,p=b?.profiles.find(p=>p.id===b.active);if(!b||!p?.test||!owner.current)return;p.state=testState(Date.now(),clears,lv,gold);publish(b);persist();setReport(null);toast.success('テスト用の進行度を変更しました。');},[persist,publish]);
 const restoreCopy=useCallback((profile:Profile)=>{const b=current.current;if(!b||!owner.current)return;if(b.profiles.length>=12)throw Error('記録は12個までです。');const p=structuredClone(profile);p.id=crypto.randomUUID();p.name=(p.name+'（復元）').slice(0,50);b.profiles.push(p);b.active=p.id;publish(b);advance(Date.now());persist();toast.success('元の記録を残し、別の記録として復元しました。');},[advance,persist,publish]);
 const importFile=useCallback(async(file:File)=>{if(file.size>524288)throw Error('セーブファイルが大きすぎます。');const b=parseBundle(JSON.parse(await file.text()));const p=b.profiles.find(p=>p.id===b.active)!;
  if(!current.current){const recovered=fresh();recovered.profiles=[{...p,id:crypto.randomUUID()}];recovered.active=recovered.profiles[0].id;localStorage.setItem(SAVE_KEY+'-unreadable',localStorage.getItem(SAVE_KEY)||'');owner.current=true;publish(recovered);persist();}else restoreCopy(p);
 },[persist,publish,restoreCopy]);
 const download=useCallback(()=>{advance(Date.now());persist();if(!current.current)return;const blob=new Blob([JSON.stringify({...current.current,profiles:current.current.profiles.filter(p=>p.id===current.current!.active)},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`starlit-guild-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},[advance,persist]);
 const toggleSound=useCallback((value:boolean)=>{const b=current.current;if(!b||!owner.current)return;b.sound=value;setSound(value);if(value){unlockSound();sound('gather',true);}publish(b);persist();},[persist,publish]);
 const takeOver=useCallback(()=>{try{const raw=localStorage.getItem(SAVE_KEY);if(raw)publish(parseBundle(JSON.parse(raw)));localStorage.setItem(LEASE,JSON.stringify({id:tabId.current,until:Date.now()+6000}));owner.current=true;setOtherTab(false);advance(Date.now());persist();}catch{setError('端末の記録を確認してください。');}},[advance,persist,publish]);
 const profile=bundle?.profiles.find(p=>p.id===bundle.active);
 return {s:profile?.state||initialState(0),profile,bundle,clock,ready:!!bundle,otherTab,takeOver,error,cloudError,cloudBusy,copies,refreshCopies,backup,saved,report,setReport,dispatch,switchProfile,createProfile,adjust,restoreCopy,importFile,download,toggleSound};
}
