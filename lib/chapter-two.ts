import type {Quest,Run} from './game.ts';

export const PICNIC_QUEST='hilltop-picnic';
export const MOON_HERB_QUEST='moonlit-herbs';
export const chapterTwoStages=[
 {quest:PICNIC_QUEST,label:'2-1 お昼を持って、あの坂へ',title:'約束の休日',arrival:'お昼を食べる場所が見つかりました',detail:'包みを開いて、ふたりでお昼にしましょう。'},
 {quest:MOON_HERB_QUEST,label:'2-2 月をためる草',title:'葉の裏の月明かり',arrival:'薬草を採り終えました',detail:'場所ごとに分けた包みを、ミラへ届けましょう。'},
];
export const chapterTwoQuests:Quest[]=[
 {id:PICNIC_QUEST,name:'お昼を持って、あの坂へ',kind:'採取',region:'昼の丘へ続く坂道',desc:'約束していた休日。パンを持って坂を上り、景色のよい場所でお昼にしよう。',tier:1,need:12,seconds:120,gold:160,xp:90,herbs:0,ore:0,unlock:0,enemy:8,background:'/stages/tower-road.png',gatherTarget:'お昼に向いた場所',gatherAsset:'/ui/adventure-compass.png',availability:'repeatable'},
 {id:MOON_HERB_QUEST,name:'月をためる草',kind:'採取',region:'月光の差し込む林',desc:'治癒師ミラから頼まれた薬草を探そう。葉の裏を見比べ、月の光を蓄えたものを場所ごとに包んで持ち帰る。',tier:1,need:28,seconds:180,gold:180,xp:100,herbs:15,ore:0,unlock:0,enemy:8,enemyName:'林のスライム',background:'/forest.png',gatherTarget:'月の光を蓄えた薬草',availability:'repeatable'},
];
export function chapterTwoWork(id:string,node:number){
 if(id===PICNIC_QUEST)return {kind:'gather' as const,name:['坂から景色を眺める','風の通る木陰を探す','腰を下ろせる場所を確かめる'][node%3]};
 if(id===MOON_HERB_QUEST)return node%3===2?{kind:'battle' as const,name:'林のスライム'}:{kind:'gather' as const,name:node%3===0?'林の切れ目で葉の裏を見比べる':'光を蓄えた葉を包みに分ける'};
 return null;
}
export function chapterTwoBanter(run:Run){
 if(run.quest===PICNIC_QUEST)return [
  [{speaker:'aria',text:'今日は荷札も控えもないね。'},{speaker:'leon',text:'パンの包みなら、二つある。'}],
  [{speaker:'aria',text:'ね、あの木陰は？　街も見えるよ。'},{speaker:'leon',text:'座るところが乾いてるか、見てみよう。'}],
  [{speaker:'leon',text:'ここなら布を広げられそうだ。'},{speaker:'aria',text:'うん。レオンも隣に座ってね。'}],
 ][Math.min(2,Math.floor(run.node/5))];
 if(run.quest!==MOON_HERB_QUEST)return null;
 return [
  [{speaker:'aria',text:'ここ、枝が途切れてる。夜なら月が差すね。'},{speaker:'leon',text:'場所を覚えておこう。最初の包みは、ここの分だ。'}],
  [{speaker:'aria',text:'同じ草でも、裏の光り方が違う。こっちだけ採るね。'},{speaker:'leon',text:'さっきの場所とは別に包むぞ。帰って説明できるように。'}],
  [{speaker:'leon',text:'草むらが動いた。包みを踏まれないように寄せよう。'},{speaker:'aria',text:'うん。追い払ったら、葉が潰れてないか確かめよう。'}],
 ][run.node%3];
}
