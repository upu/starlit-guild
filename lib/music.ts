import {isRecord,parseJson} from './external-input.ts';

export type MusicScene='camp'|'journey';
export const musicTitles:Record<MusicScene,string>={camp:'星灯りの焚き火',journey:'木漏れ日の小径'};
export type MusicPreferences={enabled:boolean;volume:number};
export const MUSIC_KEY='starlit-guild-music-v1';
export const defaultMusic:MusicPreferences={enabled:true,volume:25};
export function parseMusic(value:string|null):MusicPreferences{
 try{const parsed=parseJson(value||'null'),p=isRecord(parsed)?parsed:{};return {enabled:typeof p.enabled==='boolean'?p.enabled:true,volume:typeof p.volume==='number'&&Number.isFinite(p.volume)?Math.max(0,Math.min(100,p.volume)):25};}catch{return {...defaultMusic};}
}
type Voice={source:AudioBufferSourceNode;gain:GainNode;scene:MusicScene};

/** Two cached loops, one current voice and at most one fading voice. */
export class GameMusic{
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private voice:Voice|null=null;
 private fading:Voice|null=null;
 private buffers=new Map<MusicScene,Promise<AudioBuffer>>();
 private active=false;
 private unlocked=false;
 private disposed=false;
 private revision=0;
 private scene:MusicScene='camp';
 private preferences:MusicPreferences={...defaultMusic};
 private report:(message:string)=>void;
 constructor(report:(message:string)=>void=()=>{}){this.report=report;}
 private currentRevision(revision:number){return revision===this.revision&&!this.disposed;}
 private canFinish(revision:number){return this.currentRevision(revision)&&this.active;}

 configure(scene:MusicScene,active:boolean,preferences:MusicPreferences){
  this.scene=scene;this.active=active;this.preferences=preferences;
  if(this.master&&this.context){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(preferences.volume/100*.65,this.context.currentTime,.08);}
  if(!active||!preferences.enabled||preferences.volume===0){
   this.revision++;this.stop(this.voice);this.stop(this.fading);this.voice=this.fading=null;
   if(this.context)void this.context.suspend().catch(()=>{});
  }else if(this.unlocked)void this.play();
 }
 unlock(){if(this.disposed||!this.active||!this.preferences.enabled||this.preferences.volume===0)return;this.unlocked=true;void this.play();}
 private stop(voice:Voice|null){if(!voice)return;try{voice.source.stop();}catch{/* Already ended. */}voice.source.disconnect();voice.gain.disconnect();}
 private async play(){
  if(this.disposed||!this.active||!this.preferences.enabled)return;
  const revision=++this.revision,scene=this.scene;
  try{
   if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.preferences.volume/100*.65;this.master.connect(this.context.destination);}
   const context=this.context;
   // Resume synchronously from the user's gesture, before requesting the audio file.
   await context.resume();
   if(!this.currentRevision(revision))return;
   if(this.voice?.scene===scene)return;
   let pending=this.buffers.get(scene);
   if(!pending){
    pending=fetch(`/music/${scene}.wav`).then(response=>{if(!response.ok)throw Error('audio');return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes));
    this.buffers.set(scene,pending);
    void pending.catch(()=>{if(this.buffers.get(scene)===pending)this.buffers.delete(scene);});
   }
   const buffer=await pending;
   if(!this.canFinish(revision))return;
   const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
   source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.master!);
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+.65);
   const voice={source,gain,scene};
   source.onended=()=>{source.disconnect();gain.disconnect();if(this.fading===voice)this.fading=null;};
   source.start();
   this.stop(this.fading);this.fading=this.voice;
   if(this.fading){this.fading.gain.gain.cancelScheduledValues(now);this.fading.gain.gain.setTargetAtTime(0,now,.12);this.fading.source.stop(now+.65);}
   this.voice=voice;this.report('');
  }catch{
   if(this.currentRevision(revision))this.report('BGMを再生できませんでした。画面をタップすると再試行します。');
  }
 }
 dispose(){this.disposed=true;this.revision++;this.stop(this.voice);this.stop(this.fading);this.voice=this.fading=null;this.buffers.clear();if(this.context)void this.context.close().catch(()=>{});}
}
