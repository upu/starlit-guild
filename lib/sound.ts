import type {GameEvent} from './game';

let context:AudioContext|null=null,master:GainNode|null=null,noise:AudioBuffer|null=null;
let enabled=true,last=-Infinity,lastAccent=-Infinity,quietUntil=0;
const roles:Record<string,string>={aria:'bow',leon:'sword',mira:'heal',finn:'rogue',garr:'shield',luna:'magic',poppy:'gather',noel:'song'};
const priorities:Record<string,number>={burst:9,combo:8,discovery:7,clear:6,skill:5,heal:4,hurt:3,gather:2,hit:1};

export function setSound(value:boolean){
 enabled=value;
 if(context&&master){master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(value?.55:0,context.currentTime);}
}
export function unlockSound(){
 if(!enabled)return;
 try{
  if(!context){
   context=new AudioContext();master=context.createGain();master.gain.value=.55;master.connect(context.destination);
   noise=context.createBuffer(1,Math.ceil(context.sampleRate*.4),context.sampleRate);
   const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  void context.resume().catch(()=>{});
 }catch{/* Audio remains optional. */}
}
function tone(frequency:number,at:number,duration:number,volume:number,type:OscillatorType='sine',end=frequency){
 if(!context||!master)return;
 const source=context.createOscillator(),gain=context.createGain();
 source.type=type;source.frequency.setValueAtTime(frequency,at);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);
 gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 source.connect(gain);gain.connect(master);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(at);source.stop(at+duration+.02);
}
function whoosh(at:number,frequency:number,duration:number,volume:number){
 if(!context||!master||!noise)return;
 const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noise;
 filter.type='bandpass';filter.frequency.setValueAtTime(frequency,at);filter.frequency.exponentialRampToValueAtTime(frequency*.3,at+duration);filter.Q.value=.7;
 gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 source.connect(filter);filter.connect(gain);gain.connect(master);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+duration);
}
/** One foreground cue per simulation batch; a burst wins over ordinary hits. */
export function soundEvents(events:GameEvent[]){
 const event=events.reduce<GameEvent|undefined>((best,e)=>(priorities[e.kind]||0)>(best?priorities[best.kind]||0:0)?e:best,undefined);
 if(event)sound(event.kind,false,event.hero);
}
export function sound(kind:string,manual=false,hero?:string){
 if(!enabled||!context||!master||context.state!=='running')return;
 const now=context.currentTime,accent=['burst','combo','discovery','clear'].includes(kind);
 if(accent){if(now-lastAccent<.5)return;lastAccent=now;quietUntil=now+(kind==='burst'?.85:.4);}
 else if(now<quietUntil||now-last<(manual?.07:.12))return;
 last=now;
 const volume=manual?.12:.085,role=hero?roles[hero]:'sword';
 if(accent){
  const notes=kind==='burst'?[262,392,523,659,784,1047]:kind==='combo'?[392,494,587,784]:kind==='discovery'?[784,988,1319]:[523,659,784,1047];
  notes.forEach((n,i)=>{tone(n,now+i*.085,.38,.085,'sine');tone(n*2,now+i*.085,.25,.022,'triangle');});
  if(kind==='burst'){whoosh(now+.24,800,.35,.16);tone(110,now+.3,.38,.12,'triangle',45);}return;
 }
 if(kind==='heal'||role==='heal'){
  [523,659,880].forEach((n,i)=> { tone(n,now+i*.065,.3,.06); });return;
 }
 if(kind==='hurt'){whoosh(now,250,.14,.12);tone(100,now,.18,.11,'triangle',38);return;}
 if(kind==='gather'||role==='gather'){tone(1175,now,.13,volume);tone(1568,now+.05,.17,volume*.45);return;}
 if(kind==='skill'&&(role==='shield'||role==='song')){
  [330,495,660].forEach((n,i)=> { tone(n,now+i*.035,.32,.06,role==='shield'?'triangle':'sine'); });return;
 }
 if(role==='magic'||role==='song'){
  tone(330,now,.2,volume,'sine',880);tone(1320,now+.12,.28,volume*.6);if(kind==='skill')tone(110,now+.15,.28,.09,'triangle',55);return;
 }
 if(role==='bow'){
  whoosh(now,2600,.16,.11);tone(700,now,.07,.07,'triangle',180);tone(180,now+.14,.09,.055,'triangle',70);
  if(kind==='skill'){whoosh(now+.13,3000,.16,.1);tone(210,now+.27,.08,.05,'triangle',70);}return;
 }
 whoosh(now,role==='rogue'?3200:1700,kind==='skill'?.23:.13,volume*1.3);
 tone(kind==='skill'?210:150,now+.025,.14,volume,'triangle',45);
 if(kind==='skill')tone(880,now+.045,.15,.04,'sine',440);
}
