import type {Quest,Run} from './game.ts';

export const PICNIC_QUEST='hilltop-picnic';
export const MOON_HERB_QUEST='moonlit-herbs';
export const DELIVERY_PREP_QUEST='medicine-packing';
export const MOUNTAIN_QUEST='mountain-entrance';
export const SIGNPOST_QUEST='spinning-signpost';
export const GOLEM_QUEST='begging-golem';
export const BLOCKADE_QUEST='sweet-blockade';
export const HOUSE_CALLS_QUEST='waiting-households';
export const MEDICINE_RETURN_QUEST='medicine-road-home';
export const trioQuest=(id:string)=>[MOUNTAIN_QUEST,SIGNPOST_QUEST,GOLEM_QUEST,BLOCKADE_QUEST,HOUSE_CALLS_QUEST,MEDICINE_RETURN_QUEST].includes(id);
export const chapterTwoGolem=(id:string,node:number)=>id===GOLEM_QUEST&&node%3!==1||id===BLOCKADE_QUEST&&node>=9;
export function chapterTwoEnemyAsset(id:string,node:number){
 if(chapterTwoGolem(id,node))return '/enemies/cargo-golem.png';
 return [SIGNPOST_QUEST,GOLEM_QUEST,BLOCKADE_QUEST].includes(id)?'/enemies/mountain-puppet.png':null;
}
export const chapterTwoStages=[
 {quest:PICNIC_QUEST,label:'2-1 お昼を持って、あの坂へ',title:'約束の休日',arrival:'お昼を食べる場所が見つかりました',detail:'包みを開いて、ふたりでお昼にしましょう。'},
 {quest:MOON_HERB_QUEST,label:'2-2 月をためる草',title:'葉の裏の月明かり',arrival:'薬草を採り終えました',detail:'場所ごとに分けた包みを、ミラへ届けましょう。'},
 {quest:DELIVERY_PREP_QUEST,label:'2-3 配達の支度',title:'瓶ごとに、ひと包み',arrival:'配達の支度を終えました',detail:'荷物を確かめ、休養を取ったミラと配達の相談をしましょう。'},
 {quest:MOUNTAIN_QUEST,label:'2-4 山道の入口',title:'大小の山賊',arrival:'山道の休憩場所に着きました',detail:'荷を下ろして、三人でお茶にしましょう。'},
 {quest:SIGNPOST_QUEST,label:'2-5 くるくる道標',title:'これはご挨拶なのよ',arrival:'道標を取り戻しました',detail:'道標を戻し、荷物の包みも確かめましょう。'},
 {quest:GOLEM_QUEST,label:'2-6 もう一人の山賊',title:'まだもらってない子',arrival:'薬箱を守りきりました',detail:'逃げていく人形と、残った荷物を確かめましょう。'},
 {quest:BLOCKADE_QUEST,label:'2-7 お菓子の通せんぼ',title:'荷物の向こうの役者',arrival:'人形たちを止めました',detail:'蜜と残りの荷物を取り戻し、街道を通れるようにしましょう。'},
 {quest:HOUSE_CALLS_QUEST,label:'2-8 薬を待つ家々',title:'待っていた声',arrival:'往診の手伝いを終えました',detail:'薬と蜜を渡し、家の人へ看病を引き継ぎましょう。'},
 {quest:MEDICINE_RETURN_QUEST,label:'2-9 帰りの薬箱',title:'軽くなった荷物',arrival:'街へ戻りました',detail:'空き瓶と控えを返し、三人でお茶にしましょう。'},
];
export const chapterTwoQuests:Quest[]=[
 {id:PICNIC_QUEST,name:'お昼を持って、あの坂へ',kind:'討伐',region:'昼の丘へ続く坂道',desc:'約束していた休日。パンを持って坂を上ろう。道に出てきたスライムを追い払い、景色のよい場所でお昼にしよう。',tier:1,need:12,seconds:120,gold:160,xp:90,herbs:0,ore:0,unlock:0,enemy:8,enemyName:'丘のスライム',background:'/stages/tower-road.png',availability:'repeatable'},
 {id:MOON_HERB_QUEST,name:'月をためる草',kind:'採取',region:'月光の差し込む林',desc:'治癒師ミラから頼まれた薬草を探そう。葉の裏を見比べ、月の光を蓄えたものを場所ごとに包んで持ち帰る。',tier:1,need:28,seconds:180,gold:180,xp:100,herbs:15,ore:0,unlock:0,enemy:8,enemyName:'林のスライム',background:'/forest.png',gatherTarget:'月の光を蓄えた薬草',availability:'repeatable'},
 {id:DELIVERY_PREP_QUEST,name:'配達の支度',kind:'護衛',region:'街の店先と仕事場',desc:'注文済みの薬瓶・包み布・蜜を受け取り、配達先ごとに荷造りしよう。ミラが休んでいる間の支度を二人で引き受ける。',tier:1,need:28,seconds:180,gold:180,xp:110,herbs:0,ore:0,unlock:0,enemy:7,enemyName:'配達の包み',escortTarget:'配達の包み',background:'/stages/town-deliveries.png',availability:'repeatable'},
 {id:MOUNTAIN_QUEST,name:'山道の入口',kind:'討伐',region:'山向こうへ続く道',desc:'大小の山賊の目撃場所を確かめ、三人で山道へ。アリアが先を見て、レオンが荷物を守り、ミラが手当てを支える。',tier:1,need:32,seconds:200,gold:200,xp:140,herbs:0,ore:0,unlock:0,enemy:9,enemyName:'山道の霧狼',background:'/stages/mountain-road.png',availability:'repeatable'},
 {id:SIGNPOST_QUEST,name:'くるくる道標',kind:'護衛',region:'道標のある分かれ道',desc:'地図と違う方角を向いた道標を確かめよう。小さな人形を追い払い、草の踏み跡と景色から本来の道へ戻る。',tier:1,need:32,seconds:200,gold:220,xp:150,herbs:0,ore:0,unlock:0,enemy:10,enemyName:'道標をさらう人形',escortTarget:'道標',background:'/forest.png',availability:'repeatable'},
 {id:GOLEM_QUEST,name:'もう一人の山賊',kind:'討伐',region:'古い作業場の手前',desc:'巨大な人形も両手を差し出してお菓子を要求してきた。大きな手と足元の人形を押し戻し、配達の荷物を守ろう。',tier:1,need:35,seconds:220,gold:240,xp:170,herbs:0,ore:0,unlock:0,enemy:10,enemyName:'おねだりする運搬用ゴーレム',background:'/stages/mountain-road.png',availability:'repeatable'},
 {id:BLOCKADE_QUEST,name:'お菓子の通せんぼ',kind:'討伐',region:'街道脇の古い作業場',desc:'奪われた蜜と荷物が作業場にある。小さな人形の妨害を止め、ゴーレムを押し戻して、配達の道を取り戻そう。',tier:1,need:38,seconds:240,gold:280,xp:200,herbs:0,ore:0,unlock:0,enemy:10,enemyName:'通せんぼする人形',background:'/stages/mountain-road.png',availability:'repeatable'},
 {id:HOUSE_CALLS_QUEST,name:'薬を待つ家々',kind:'護衛',region:'山向こうの集落',desc:'待っている家々へ薬を届けよう。ミラの往診に合わせ、湯や水の用意、包みの仕分け、空き瓶の回収を手伝う。',tier:1,need:28,seconds:180,gold:240,xp:170,herbs:0,ore:0,unlock:0,enemy:8,escortTarget:'往診の手伝い',background:'/stages/town-deliveries.png',availability:'repeatable'},
 {id:MEDICINE_RETURN_QUEST,name:'帰りの薬箱',kind:'護衛',region:'通行の戻った山道',desc:'一晩休んだら、空き瓶と控えを持って街へ戻ろう。道標と荷車の往来を確かめ、小さな魔物を追い払いながら帰る。',tier:1,need:30,seconds:180,gold:220,xp:160,herbs:0,ore:0,unlock:0,enemy:8,enemyName:'山道のスライム',escortTarget:'空き瓶と控え',background:'/stages/mountain-road.png',availability:'repeatable'},
];
type ChapterWork={kind:'battle'|'escort'|'gather';name:string};
const workPatterns:Partial<Record<string,ChapterWork[]>>={
 [DELIVERY_PREP_QUEST]:['注文済みの瓶と布を受け取る','薬瓶と蜜を別々に包む','配達先ごとに荷札を確かめる'].map(name=>({kind:'escort',name})),
 [MOUNTAIN_QUEST]:[{kind:'battle',name:'山道の霧狼'}],
 [SIGNPOST_QUEST]:[{kind:'escort',name:'踏み跡と道標を照らし合わせる'},{kind:'battle',name:'道標をさらう人形'},{kind:'escort',name:'元の道へ道標を運ぶ'}],
 [GOLEM_QUEST]:[{kind:'battle',name:'おねだりする運搬用ゴーレム'},{kind:'battle',name:'荷物へ忍び寄る人形'},{kind:'battle',name:'おねだりする運搬用ゴーレム'}],
 [HOUSE_CALLS_QUEST]:['配達先へ包みを運ぶ','往診に使う湯と水を用意する','ミラの指示で包みを仕分ける','家の人から空き瓶を受け取る','次の家への控えを確かめる'].map(name=>({kind:'escort',name})),
 [MEDICINE_RETURN_QUEST]:[{kind:'escort',name:'戻った道標の向きを確かめる'},{kind:'escort',name:'行き交う荷車に道を譲る'},{kind:'battle',name:'山道のスライム'},{kind:'escort',name:'静かな作業場の前を通る'},{kind:'escort',name:'空き瓶を揺らさず運ぶ'}],
 [PICNIC_QUEST]:[{kind:'battle',name:'丘のスライム'}],
 [MOON_HERB_QUEST]:[{kind:'gather',name:'林の切れ目で葉の裏を見比べる'},{kind:'gather',name:'光を蓄えた葉を包みに分ける'},{kind:'battle',name:'林のスライム'}],
};
export function chapterTwoWork(id:string,node:number){
 if(id===BLOCKADE_QUEST)return {kind:'battle' as const,name:node<9?'荷物を囲む小さな人形':'通せんぼする運搬用ゴーレム'};
 const pattern=workPatterns[id];return pattern?pattern[node%pattern.length]:null;
}
function packingBanter(run:Run){
 if(run.quest===DELIVERY_PREP_QUEST)return [
  {speaker:'aria',text:'瓶と蜜は別々。荷札も合ってるよ。'},
  {speaker:'leon',text:'布を間に挟もう。隣の瓶とぶつからないように。'},
 ];
 return null;
}
function trioBanter(run:Run){
 return run.phase==='rest'?[
  {speaker:'mira',text:'痛いのは、我慢しなくていいのよ。手を見せてね。'},
  {speaker:'aria',text:'ミラも座って。水、三人分あるから。'},
 ]:run.quest===MOUNTAIN_QUEST?[
  {speaker:'aria',text:'この先、段差があるよ。右側なら歩きやすそう。'},
  {speaker:'leon',text:'荷物は内側へ。俺が外を見る。'},
  {speaker:'mira',text:'私は治療を、二人は前を。'},
 ]:run.quest===SIGNPOST_QUEST?[
  {speaker:'aria',text:'草が踏まれてる。元の道は、こっちだね。'},
  {speaker:'mira',text:'あの木の向こうを、前の往診でも通ったわ。'},
  {speaker:'leon',text:'道標を戻そう。荷物からは離れないで。'},
 ]:[
  {speaker:'leon',text:'大きい手は俺が止める。袋の紐を見てくれ。'},
  {speaker:'aria',text:'小さいのも来てる！　そっちへは行かせないよ。'},
  {speaker:'mira',text:'薬箱はここに。傷は、そのままにしないでね。'},
 ];
}
export function chapterTwoBanter(run:Run){
 const finale=finaleBanter(run);if(finale)return finale;
 if(trioQuest(run.quest))return trioBanter(run);
 if(run.quest===DELIVERY_PREP_QUEST)return packingBanter(run);
 if(run.quest===PICNIC_QUEST)return [
  [{speaker:'aria',text:'今日は荷札も控えもないね。'},{speaker:'leon',text:'パンの包みなら、二つある。'}],
  [{speaker:'aria',text:'ね、あの木陰は？　街も見えるよ。'},{speaker:'leon',text:'座るところが乾いてるか、見てみよう。'}],
  [{speaker:'leon',text:'ここなら布を広げられそうだ。'},{speaker:'aria',text:'うん。隣に座らせてね。'}],
 ][Math.min(2,Math.floor(run.node/5))];
 if(run.quest!==MOON_HERB_QUEST)return null;
 return [
  [{speaker:'aria',text:'ここ、枝が途切れてる。夜なら月が差すね。'},{speaker:'leon',text:'場所を覚えておこう。最初の包みは、ここの分だ。'}],
  [{speaker:'aria',text:'同じ草でも、裏の光り方が違う。こっちだけ採るね。'},{speaker:'leon',text:'さっきの場所とは別に包むぞ。帰って説明できるように。'}],
  [{speaker:'leon',text:'草むらが動いた。包みを踏まれないように寄せよう。'},{speaker:'aria',text:'うん。追い払ったら、葉が潰れてないか確かめよう。'}],
 ][run.node%3];
}
function finaleBanter(run:Run){
 if(run.quest===HOUSE_CALLS_QUEST)return [
  {speaker:'aria',text:'次の包み、ここへ置くね。水も替えてきたよ。'},
  {speaker:'mira',text:'ありがとう。診察が済んだら、お薬を確かめるわ。'},
  {speaker:'leon',text:'空き瓶は別の袋だ。控えと合わせておこう。'},
 ];
 if(run.quest===MEDICINE_RETURN_QUEST)return [
  {speaker:'aria',text:'荷車が来たよ。通れるようになって、よかったね。'},
  {speaker:'leon',text:'ああ。草むらも見ておこう。小さい魔物はまだいる。'},
  {speaker:'mira',text:'空き瓶を返したら、お茶にしましょう。'},
 ];
 if(run.quest===BLOCKADE_QUEST)return run.node<9?[
  {speaker:'aria',text:'荷物の前から、順番に止めるね。'},
  {speaker:'leon',text:'大きい手は俺が見る。ミラ、後ろを頼む。'},
  {speaker:'mira',text:'ええ。二人とも、傷はそのままにしないでね。'},
 ]:[
  {speaker:'leon',text:'小さいほうは止まった。大きいのを押し戻すぞ。'},
  {speaker:'aria',text:'任せて！　荷物から離れたほうを狙うね。'},
  {speaker:'mira',text:'私は治療を、二人は前を。'},
 ];
 return null;
}
