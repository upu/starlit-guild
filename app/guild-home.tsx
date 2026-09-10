'use client';
import {Flame,Hammer,Leaf,Logs,House,Heart} from 'lucide-react';
import {Sprite} from './sprite';
import {heroes,type State,type Action} from '@/lib/game';
const activities:Record<string,string>={aria:'薬草を選り分け中',leon:'剣の素振り中',mira:'お茶を淹れています',finn:'宝物をこっそり鑑定',garr:'みんなの服をお直し',luna:'星図を研究中',poppy:'薬の調合に夢中',noel:'新しい歌を練習中'};
export function GuildHome({state:s,now,ready,onAction}:{state:State;now:number;ready:boolean;onAction:(a:Action)=>void}){
 const home=heroes.filter(h=>s.owned.includes(h.id)&&!s.squads.some(sq=>sq.run&&sq.members.includes(h.id)));
 const cost=s.town===0?{gold:120,wood:12,ore:0,herbs:0,clears:1}:{gold:600,wood:60,ore:12,herbs:20,clears:3};
 const canBuild=ready&&s.clears>=cost.clears&&s.gold>=cost.gold&&s.wood>=cost.wood&&s.ore>=cost.ore&&s.herbs>=cost.herbs;
 return <section className="guild-home"><div className="home-map" style={{backgroundImage:`url(/camp-${s.town}.png)`}} aria-label={['ふたりの野営地','酒場のある拠点','鍛冶場と薬草園のある拠点'][s.town]}><div className="home-title"><span className="eyebrow">OUR LITTLE HOME</span><h2>{['旅のはじまりの焚き火','星灯りの酒場','星灯りの小さな村'][s.town]}</h2></div>
 {home.map(h=>{const i=heroes.findIndex(a=>a.id===h.id),t=((now/1000+i*1.7)%16),moving=t<4||t>=8&&t<12;const progress=t<4?t/4:t<8?1:t<12?1-(t-8)/4:0;const ax=20+i%4*16,ay=49+Math.floor(i/4)*19,bx=ax+(i%2?-9:9),by=ay-10;return <div className={`home-hero ${moving?'walking':'at-home'}`} style={{left:`${ax+(bx-ax)*progress}%`,top:`${ay+(by-ay)*progress}%`}} key={h.id}><Sprite index={h.sprite} size={76}/><span>{h.name}</span>{!moving&&<small className="home-bubble">{activities[h.id]}</small>}</div>})}
 <div className="home-caption">{home.length?`${home.length}人が拠点で過ごしています`:'仲間は冒険中。帰ってきたら、ここでひと休み。'}</div></div>
 <div className="town-bonuses"><span><Logs size={16}/>木材 {s.wood}</span>{s.town>=1&&<span><Heart size={16}/>出発時HP +10% · 絆の成長2倍</span>}{s.town>=2&&<><span><Hammer size={16}/>全能力 +8%</span><span><Leaf size={16}/>区間報酬に薬草 +2 · 回復量アップ</span></>}</div>
 {s.town<2?<article className="town-build"><div>{s.town===0?<House size={26}/>:<Hammer size={26}/>}<span><h3>{s.town===0?'みんなが帰れる酒場を建てよう':'鍛冶場と薬草園を作ろう'}</h3><p>{s.town===0?'焚き火を囲む旅から、あたたかな帰る場所へ。仲間の体力と絆を育てます。':'装備を整え、薬草を育てる暮らしへ。冒険の力と区間ごとの回復・収穫が増えます。'}</p></span></div>{s.clears<cost.clears?<p className="hint">あと {cost.clears-s.clears} 件の依頼で建設できます。木材は冒険の区間報酬や寄り道で集まります。</p>:<><p className="build-cost">{cost.gold} G · 木材 {cost.wood}{cost.ore>0&&` · 鉱石 ${cost.ore} · 薬草 ${cost.herbs}`}</p><button disabled={!canBuild} onClick={()=>onAction({type:'build'})}>{s.town===0?'酒場を建てる':'鍛冶場と薬草園を作る'}</button></>}</article>:<div className="home-complete"><Flame size={18}/><span>冒険の合間に、仲間たちの暮らしをのぞいてみよう。</span></div>}
 </section>
}
