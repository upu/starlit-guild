'use client';
/* Fixed-size local app icons are already exported at their delivery size. */
/* eslint-disable @next/next/no-img-element */
import {useEffect,useState} from 'react';
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function useInstallPrompt(){
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  const media=window.matchMedia('(display-mode: standalone)');
  const check=()=> { setInstalled(media.matches||!!(navigator as Navigator&{standalone?:boolean}).standalone); };
  const available=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
  const done=()=>{setInstalled(true);setPrompt(null);};
  check();media.addEventListener('change',check);window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',done);
  return()=>{media.removeEventListener('change',check);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done);};
 },[]);
 async function install(){if(!prompt||busy)return;setBusy(true);try{await prompt.prompt();const choice=await prompt.userChoice;setMessage(choice.outcome==='accepted'?'追加後はホーム画面のランタンから開けます。':'追加はいつでもできます。');}catch{setMessage('ブラウザーのメニューから「ホーム画面に追加」を選んでください。');}finally{setPrompt(null);setBusy(false);}}
 return {available:!!prompt,installed,busy,message,install};
}
export function InstallGuide({onDownload,status}:{onDownload:()=>void;status:ReturnType<typeof useInstallPrompt>}){
 const {available:prompt,installed,busy,message,install}=status;
 return <section className="install-guide"><img src="/icons/icon-192.png" alt="星灯りのランタン" width="72" height="72"/><h3>ホーム画面に、旅団の灯りを</h3>{installed?<p>ホーム画面から起動しています。</p>:<><p>いつでもランタンのアイコンから冒険へ戻れます。</p><p>追加前に今の冒険をファイルに保管してください。別の起動方法では記録が分かれる場合があります。その場合は「セーブ・設定」でファイルを読み込めます。</p><button className="outline full" onClick={onDownload}>今の冒険をファイルに保管</button>{prompt?<button className="full" disabled={busy} onClick={()=>void install()}>{busy?'追加画面を開いています…':'ホーム画面に追加'}</button>:<><p><b>iPhone・iPad</b><br/>Safariの共有メニューから「ホーム画面に追加」を選びます。</p><p><b>Android</b><br/>ブラウザーのメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。</p></>}</>}<small>起動時には通信が必要です。開いた後の進行は端末に保存され、通信が戻るとバックアップを再試行します。</small>{message&&<p role="status">{message}</p>}</section>;
}
