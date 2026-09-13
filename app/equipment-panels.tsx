'use client';
import {useState} from 'react';
import Image from 'next/image';
import {Coins,Leaf,Gem,Logs,Shield,Swords,Package} from 'lucide-react';
import {heroes,memberStats,memberMaxHp,heroSkills,level,type State,type Action} from '@/lib/game';
import {equipment,equipmentById,inventoryOf,equippedBy,availableCopies,canEquip,shopItems,shopTier,type Equipment,type EquipmentSlot} from '@/lib/equipment';
import {storyItems} from '@/lib/story-items';
import {Portrait} from './portrait';

type Props={state:State;ready:boolean;onAction:(action:Action)=>boolean};
const amount=(value:number)=>Math.floor(value).toLocaleString('ja-JP');
const heroName=(id:string)=>heroes.find(hero=>hero.id===id)?.name??id;
const statLabels=['採取','護衛','討伐'];
function Bonuses({item}:{item:Equipment}){return <span className="equipment-bonuses">{item.bonus.map((value,index)=>value>0?<span key={index}>{statLabels[index]} +{value}</span>:null)}</span>;}
function EquipmentIcon({item}:{item:Equipment}){return item.slot==='weapon'?<Swords aria-hidden="true"/>:<Shield aria-hidden="true"/>;}
export function ResourcesGrid({state:s}:{state:State}){
 return <div className="inventory-grid">{[[Coins,s.gold,'お金'],[Leaf,s.herbs,'薬草'],[Gem,s.ore,'鉱石'],[Logs,s.wood,'木材']].map(([Icon,value,label])=>{const I=Icon as typeof Coins;return <div key={String(label)}><I/><span>{String(label)}</span><b>{amount(value as number)}</b></div>;})}</div>;
}
function EquipmentBag({state:s}:{state:State}){
 const inventory=inventoryOf(s);
 return <section className="bag-section"><h3>装備品</h3><div className="bag-items">{equipment.filter(item=>(inventory.items[item.id]??0)>0).map(item=><article key={item.id}><EquipmentIcon item={item}/><div><h4>{item.name}<span>×{inventory.items[item.id]}</span></h4><p>{item.description}</p><Bonuses item={item}/><small>バッグ内 {availableCopies(s,item.id)}{equippedBy(s,item.id).length>0&&` · ${equippedBy(s,item.id).map(heroName).join('・')}が装備中`}</small></div></article>)}</div></section>;
}
export function InventoryPanel({state:s}:{state:State}){
 const important=storyItems(s);
 return <div className="bag-content"><ResourcesGrid state={s}/><EquipmentBag state={s}/><section className="bag-section"><h3>大事なもの・預かり品</h3>{important.length===0?<p>今は預かっている品はありません。</p>:<div className="bag-items">{important.map(item=><article key={item.id}>{item.image?<Image src={item.image} width={56} height={56} alt="" unoptimized/>:<Package aria-hidden="true"/>}<div><h4>{item.name}</h4><p>{item.description}</p></div></article>)}</div>}</section></div>;
}
function ShopCard({item,state,ready,onAction,onBought}:Props&{item:Equipment;onBought:(name:string)=>void}){
 const enough=state.gold>=item.price;
 return <article className="shop-item"><div className="shop-item-heading"><EquipmentIcon item={item}/><h3>{item.name}</h3></div><p>{item.description}</p><span className="equipment-wearers">{item.heroes?item.heroes.map(heroName).join('・')+'用':'だれでも装備できます'}</span><Bonuses item={item}/><div className="shop-purchase"><small>所持 {inventoryOf(state).items[item.id]??0}</small><button disabled={!ready||!enough||(inventoryOf(state).items[item.id]??0)>=9999} onClick={()=>{if(onAction({type:'buy',id:item.id}))onBought(item.name);}} aria-label={`${item.name}を${String(item.price)} Gで購入`}>{amount(item.price)} Gで購入</button></div>{!enough&&<small>あと {amount(item.price-state.gold)} G</small>}</article>;
}
export function ShopPanel(props:Props){
 const [bought,setBought]=useState('');
 return <div className="shop-panel"><div className="shop-wallet"><Coins aria-hidden="true"/><span>所持金</span><b>{amount(props.state.gold)} G</b></div><p className="purchase-notice" role="status">{bought?`${bought}をバッグに入れました。`:'購入した装備は、キャラクター画面で付け替えられます。'}</p>{shopTier(props.state)===0?<p>街の配達仕事を終えると、お店を利用できます。</p>:<div className="shop-items">{shopItems(props.state).map(item=><ShopCard key={item.id} {...props} item={item} onBought={setBought}/>)}</div>}</div>;
}
function StatRow({values}:{values:number[]}){return <div className="character-stats">{values.map((value,index)=><span key={index}>{statLabels[index]}<b>{value}</b></span>)}</div>;}
function EquipmentChoice({item,hero,slot,...props}:Props&{item:Equipment;hero:string;slot:EquipmentSlot}){
 const current=equipmentById(inventoryOf(props.state).equipped[hero]?.[slot]??'');
 const worn=current?.id===item.id,available=availableCopies(props.state,item.id);
 return <button className="equipment-choice" disabled={!props.ready||worn||available<1} onClick={()=>props.onAction({type:'equip',hero,slot,id:item.id})}><span><b>{item.name}</b><span className="equipment-comparison">{item.bonus.map((value,index)=>{const delta=value-(current?.bonus[index]??0);return <span key={index}>{statLabels[index]} {delta>0?'+':''}{delta}</span>;})}</span></span><small>{worn?'装備中':available>0?'装備する':equippedBy(props.state,item.id).map(heroName).join('・')+'が装備中'}</small></button>;
}
function EquipmentSlotPanel({hero,slot,...props}:Props&{hero:string;slot:EquipmentSlot}){
 const inventory=inventoryOf(props.state),current=equipmentById(inventory.equipped[hero]?.[slot]??''),choices=equipment.filter(item=>item.slot===slot&&canEquip(item,hero)&&(inventory.items[item.id]??0)>0);
 return <section className="character-equipment"><h3>{slot==='weapon'?'武器':'防具'}<span>{current?.name??'装備なし'}</span></h3><details><summary>付け替える</summary><div className="equipment-choices">{choices.map(item=><EquipmentChoice key={item.id} {...props} item={item} hero={hero} slot={slot}/>)}{choices.length===0&&<p>装備できる品はまだありません。</p>}{current&&<button className="outline" disabled={!props.ready} onClick={()=>props.onAction({type:'equip',hero,slot})}>外してバッグへ戻す</button>}</div></details></section>;
}
export function CharacterPanel(props:Props){
 const [selected,setSelected]=useState('aria'),roster=heroes.filter(hero=>props.state.owned.includes(hero.id)),hero=roster.find(hero=>hero.id===selected)??roster[0];
 const hp=props.state.squads.find(squad=>squad.members.includes(hero.id))?.run?.health[hero.id];
 return <div className="character-panel"><div className="character-picker" aria-label="キャラクターを選ぶ">{roster.map(member=><button key={member.id} aria-pressed={hero.id===member.id} onClick={()=>{setSelected(member.id);}}><Portrait index={member.sprite} size={64}/><span>{member.name}</span></button>)}</div><div className="character-heading"><Portrait index={hero.sprite} size={144}/><div><h2>{hero.name}</h2><p>{hero.job}</p><span>Lv. {level(props.state.xp[hero.id]??0)}</span><p>{hp?`HP ${String(Math.ceil(hp.hp))} / ${String(hp.maxHp)}`:`最大HP ${String(memberMaxHp(props.state,hero.id))}`}</p></div></div><p>{hero.bio}</p><StatRow values={memberStats(props.state,hero.id)}/><section className="character-skill"><h3>{heroSkills[hero.id].name}</h3><p>{heroSkills[hero.id].description}</p></section><EquipmentSlotPanel {...props} hero={hero.id} slot="weapon"/><EquipmentSlotPanel {...props} hero={hero.id} slot="armor"/></div>;
}
