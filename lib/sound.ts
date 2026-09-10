let context:AudioContext|null=null;
let enabled=true,last=0;
export function setSound(value:boolean){enabled=value;}
export function unlockSound(){if(!enabled)return;try{context??=new AudioContext();void context.resume().catch(()=>{});}catch{/* Sound is optional on devices without Web Audio. */}}
export function sound(kind:string,manual=false){
 if(!enabled||!context||context.state!=='running')return;
 const now=context.currentTime;if(!manual&&now-last<.09)return;last=now;
 const notes=kind==='clear'?[523,659,784]:kind==='heal'?[660,880]:kind==='gather'?[880]:kind==='hurt'?[120]:kind==='assist'?[420]:[220];
 notes.forEach((frequency,i)=>{const oscillator=context!.createOscillator(),gain=context!.createGain(),at=now+i*.075;oscillator.type=kind==='hurt'?'sawtooth':kind==='hit'?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,at);oscillator.frequency.exponentialRampToValueAtTime(frequency*(kind==='hit'?.5:1.1),at+.09);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(manual?.1:.04,at+.008);gain.gain.exponentialRampToValueAtTime(.001,at+.13);oscillator.connect(gain);gain.connect(context!.destination);oscillator.start(at);oscillator.stop(at+.15);});
}
