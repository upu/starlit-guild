import type {Squad} from './game.ts';
import type {StoryLine} from './stories.ts';
import {WATERWAY_QUEST,RESTORATION_QUEST,MOSS_QUEST} from './prologue.ts';
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
 return [a('水、下まで続いてる。脇の石も見てくるね。'),l('ああ。俺は下流の人に、溢れてないか聞いてくる。')];
}
function mossBanter(run:Run):StoryLine[]{
 if(run.node<5)return [a('上の葉だけじゃ剥がれないね。薄く分けてみる。'),l('籠を下へ寄せる。取れた分から受けよう。')];
 if(run.node<10)return [l('籠が重くなった。いったん運んでくる。'),a('じゃあ、戻るまで木べらを拭いてる。こっちも葉がいっぱい。')];
 return [a('石の継ぎ目、見えてきたよ。'),l('ああ。残りも管理人さんと確かめよう。')];
}
export function waterwayBanter(run:Run):StoryLine[]|null{
 if(![WATERWAY_QUEST,RESTORATION_QUEST,MOSS_QUEST].includes(run.quest))return null;
 if(run.phase==='rest')return [l('乾いたところへ戻ろう。少し休みたい。'),a('うん。道具を置いて、私も一緒に座る。')];
 if(run.quest===MOSS_QUEST)return mossBanter(run);
 return run.quest===WATERWAY_QUEST?searchBanter(run):repairBanter(run);
}
