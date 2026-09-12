import type {AdventureFrame} from './adventure-presentation.ts';

// Each sheet: walk 0–3, attack 4–7, idle 8–9, hurt 10–11.
export const heroSheets:Partial<Record<string,{asset:string;columns:number;rows:number;ready:boolean}>>={
 aria:{asset:'/animations/aria-v1.png',columns:4,rows:3,ready:true},
 leon:{asset:'/animations/leon-v1.png',columns:4,rows:3,ready:true},
};

export function heroAnimation(member:AdventureFrame['members'][number],frame:AdventureFrame,now:number,reduced=false){
 const sheet=heroSheets[member.id];
 if(!sheet)return null;
 const pose=(index:number)=>({asset:sheet.asset,frame:String(index)});
 if(reduced||frame.phase==='rest')return pose(8);
 const hurt=frame.events.filter(e=>e.kind==='hurt'&&(!e.hero||e.hero===member.id)&&now>=e.at&&now-e.at<320).at(-1);
 if(hurt)return pose(10+Math.min(1,Math.floor((now-hurt.at)/160)));
 const hit=member.hit,age=hit?now-hit.at:Infinity;
 if(!member.exploring&&hit&&hit.kind!=='gather'&&age>=0&&age<650)return pose(4+Math.min(3,Math.floor(age/162.5)));
 if(member.walking||member.exploring)return pose(Math.floor(now/150)%4);
 // The second idle drawing closes the eyes; keep it a brief blink, not a long nap.
 return pose(now%3600>=3450?9:8);
}
