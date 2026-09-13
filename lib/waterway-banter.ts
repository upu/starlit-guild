import type {Squad} from './game.ts';
import type {StoryLine} from './stories.ts';
import {WATERWAY_QUEST,RESTORATION_QUEST} from './prologue.ts';
const a=(text:string):StoryLine=>({speaker:'aria',text});
const l=(text:string):StoryLine=>({speaker:'leon',text});
type Run=NonNullable<Squad['run']>;
function searchBanter(run:Run):StoryLine[]{
 if(run.node<5)return [l('図の線は、この斜面の下を通ってる。'),a('じゃあ、私は湿ってる場所を見ていくね。')];
 if(run.node<10)return [a('この辺も苔が多い。草の下まで続いてる。'),l('紙に印をつけよう。さっきの場所とも近いな。')];
 return [l('出口はこの先のはずだ。足場が崩れてるところは避けよう。'),a('うん。草を分けてみる。石が見えたら教えるね。')];
}
function repairBanter(run:Run):StoryLine[]{
 if(run.node<5)return [a('ここを確かめたい。作業の人が通る前に。'),l('分かった。アリアは苔の続き、俺は足場を見る。')];
 if(run.node<10)return [l('水路の中へは、合図があるまで入らないでおこう。'),a('うん。集めた枝も脇へ置くね。水に戻らないところへ。')];
 return [a('ここの隙間、まだ葉が重なってる。手前から取るね。'),l('籠を寄せる。奥が見えなければ、管理人さんに声をかけよう。')];
}
export function waterwayBanter(run:Run):StoryLine[]|null{
 if(![WATERWAY_QUEST,RESTORATION_QUEST].includes(run.quest))return null;
 if(run.phase==='rest')return [l('乾いたところへ戻ろう。少し休みたい。'),a('うん。道具を置いて、私も一緒に座る。')];
 return run.quest===WATERWAY_QUEST?searchBanter(run):repairBanter(run);
}
