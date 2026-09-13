import type {State} from './game.ts';
import {inPrologue,TRADE_QUEST,RETURN_QUEST,TOWER_QUEST,NIGHT_QUEST,WETLAND_QUEST} from './prologue.ts';

export type StoryItem={id:string;name:string;description:string;image?:string};
// Derive unique story objects from first readings. Replays and repeat quests never mint copies.
export function storyItems(s:State):StoryItem[]{
 if(!inPrologue(s))return [];
 const read=(quest:string)=>s.story?.read.includes(quest+'-return')??!!s.done[quest];
 const items:StoryItem[]=[];
 if(!read(TRADE_QUEST))items.push(
  {id:'aria-trade',name:'アリアの村の交易品',description:'村から預かった品。街の取引先へ届ける。'},
  {id:'leon-trade',name:'レオンの村の交易品',description:'村から預かった品。街の取引先へ届ける。'},
 );
 else if(!read(RETURN_QUEST))items.push({id:'village-purchases',name:'村へ持ち帰る品',description:'街で買いそろえた頼まれもの。それぞれの村へ届ける。'});
 if(read(TOWER_QUEST))items.push({id:'moss-lamp',name:'苔灯',image:'/items/moss-lamp.png',description:read(NIGHT_QUEST)?'塔から持ち帰った小さな灯り。帰り道で光が弱まり、苔の葉の形が見えるようになった。':'塔のそばで分けてもらった光る苔。木の入れ物に寄せると、手元を照らす灯りになった。'});
 if(read(WETLAND_QUEST))items.push({id:'forest-moss',name:'森の苔の標本',description:'森の湿地で少しだけ採った苔。塔の苔と葉の形が似ているが、手元を照らすほどには光らない。'});
 return items;
}
