'use client';
import {ArrowRight} from 'lucide-react';

export function StartScreen({ready,error,onStart}:{ready:boolean;error:string;onStart:()=>void}){
 return <main className="start-screen">
  <div className="start-title"><p>STARLIT GUILD</p><h1>星灯りの旅団</h1><span>小さな旅を、ふたりから。</span></div>
  <div className="start-entry"><button disabled={!ready&&!error} onClick={onStart}>{error?'記録を確認する':ready?'冒険へ':'旅の支度中…'}<ArrowRight size={18}/></button>{error?<p role="alert">{error}</p>:<p>あなたの旅の続きが、ここに。</p>}</div>
 </main>;
}
