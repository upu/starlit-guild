import type {State,Squad} from './game.ts';

export const TRADE_QUEST='village-trade';
export const RETURN_QUEST='evening-trade-road';
export const TOWN_QUEST='town-deliveries';
export const TOWER_QUEST='tower-road';
export const NIGHT_QUEST='moss-night-road';
export const WETLAND_QUEST='forest-wetland';
export const WATERWAY_QUEST='old-waterway';
export const RESTORATION_QUEST='tower-restoration';
export const MOSS_QUEST='tower-moss-removal';
export const prologueStages=[
 {quest:TRADE_QUEST,label:'1-1 交易路（昼）',title:'いつもの待ち合わせ',arrival:'街に到着しました',detail:'預かった荷物を、取引先へ届けましょう。'},
 {quest:RETURN_QUEST,label:'1-2 交易路（夕）',title:'いつもより少し騒がしい道',arrival:'分かれ道に到着しました',detail:'帰り道で気づいたことを、ふたりで話しましょう。'},
 {quest:TOWN_QUEST,label:'1-3 街の仕事',title:'不便の理由',arrival:'街の配達を終えました',detail:'受け取りの控えを持って、取引先へ戻りましょう。'},
 {quest:TOWER_QUEST,label:'1-4 塔への道',title:'少し見に行こう',arrival:'丘の塔に到着しました',detail:'管理人に声をかけ、塔のそばを見せてもらいましょう。'},
 {quest:NIGHT_QUEST,label:'1-5 帰り道（夜）',title:'分かれ道までの灯り',arrival:'村々への分かれ道に到着しました',detail:'持ち帰った小さな灯りを、ふたりで覗いてみましょう。'},
 {quest:WETLAND_QUEST,label:'1-6 森の湿地',title:'同じかもしれない',arrival:'森の苔を見つけました',detail:'持ち帰った苔と並べて、形と湿り気を確かめましょう。'},
 {quest:WATERWAY_QUEST,label:'1-7 古い水路',title:'地図の端に残る線',arrival:'古い水路の出口を見つけました',detail:'水の行き先と、石の隙間に続く苔を確かめましょう。'},
 {quest:RESTORATION_QUEST,label:'1-8 水路の修理',title:'水の通り道を戻す仕事',arrival:'水路の修理を終えました',detail:'水の流れと、石組みに残る苔を確かめましょう。'},
 {quest:MOSS_QUEST,label:'1-9 増えすぎた苔',title:'もう一度、あの灯りを',arrival:'苔の撤去を終えました',detail:'道具を置いて、ふたりで塔を見上げましょう。'},
];
export const isPrologueQuest=(id:string)=>prologueStages.some(stage=>stage.quest===id);
// Absent in existing saves: those adventures keep their unlocked features.
export const inPrologue=(s:State)=>s.prologue===true;
// Old saves lack lastQuest. Use their last recorded stage without jumping to an unlocked one.
export function restingQuest(s:State,sq:Squad){
 return sq.run?.quest||sq.lastQuest||[...(s.story?.completed||Object.keys(s.done))].reverse().find(isPrologueQuest)||TRADE_QUEST;
}
export const stageEndingPending=(s:State)=>prologueStages.find(({quest})=>!!s.done[quest]&&!!s.story?.completed.includes(quest)&&!s.story.read.includes(quest+'-return'))?.quest;
export const tradeEndingPending=(s:State)=>stageEndingPending(s)===TRADE_QUEST;
// Use recorded completions and readings; do not migrate or reset existing saves.
export function stageUnlocked(s:State,id:string){
 const index=prologueStages.findIndex(stage=>stage.quest===id);
 return index<=0||prologueStages.slice(0,index).every(({quest})=>s.done[quest]>0&&s.story?.read.includes(quest+'-return'));
}
export function nextStage(s:State){
 const unlocked=prologueStages.filter(({quest})=>stageUnlocked(s,quest));
 const stage=unlocked.find(({quest})=>!s.done[quest])||unlocked.at(-1);
 if(!stage)throw Error('プロローグの進行状態を読み込めません。');
 return stage;
}
