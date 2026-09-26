import {
  chapterFourStages,
  isChapterFourQuest,
  MOSS_TRAIL_QUEST,
  mossTrailPhase,
} from "./chapter-four.ts";
import type { Run } from "./game.ts";
import type { StoryLine } from "./stories.ts";

const routes: Record<string, StoryLine[][]> = {
  [chapterFourStages[0].quest]: [
    [
      { speaker: "aria", text: "これも「塔の人へ」だって。四人とも、塔のことで動いてるもんね。" },
      { speaker: "leon", text: "誰宛てか聞いておこう。返事を出した分にも、印が要るな。" },
      { speaker: "aria", text: "フィンが勝手に返事したのは、別の印にしておいて。" },
    ],
    [
      { speaker: "mira", text: "食事代にする前に、預かっているお金だと思い出さなかったの？" },
      { speaker: "finn", text: "食べ終わってからなら、思い出したよ。" },
      { speaker: "mira", text: "次は、お皿が来る前に思い出しましょうね。" },
    ],
  ],
  [chapterFourStages[1].quest]: [
    [
      { speaker: "leon", text: "村は、この道を曲がった先だ。" },
      { speaker: "aria", text: "地図にない塔って、ちょっと楽しみ。" },
      { speaker: "leon", text: "楽しみにするのはいいが、直せるとはまだ言わないでくれ。" },
    ],
    [
      { speaker: "finn", text: "塔を三つも四つも直してると、忙しくなるねえ。" },
      { speaker: "mira", text: "フィンさんがご一緒したのは、一つでしょう？" },
      { speaker: "finn", text: "そういう数え方だと、急に小さくなるな。" },
    ],
  ],
  [chapterFourStages[2].quest]: [
    [
      { speaker: "aria", text: "樽がごろごろ通るね。全部エール？" },
      { speaker: "leon", text: "空樽を戻す荷もあるらしい。帰りも荷車が要るんだな。" },
      { speaker: "aria", text: "飲み終わったら仕事も終わり、じゃないんだ。" },
    ],
    [
      { speaker: "finn", text: "匂いだけで醸造所まで行けそうかい？" },
      { speaker: "aria", text: "焼いてるパンの方が近いよ。そっちへ行きそう。" },
      { speaker: "finn", text: "それはそれで、いい鼻だ。" },
    ],
  ],
  [chapterFourStages[3].quest]: [
    [
      { speaker: "aria", text: "この布、昨日もあった。" },
      { speaker: "leon", text: "今日は曲がらずに通る目印だな。" },
      { speaker: "aria", text: "……覚える役には立ったでしょ。" },
    ],
    [
      { speaker: "mira", text: "留守の間に、誰かいらっしゃるかもしれないわね。" },
      {
        speaker: "finn",
        text: "そのために先生へ頼んだんだろ。今戻ったら、引き継いだ先生が困るよ。",
      },
      { speaker: "mira", text: "……そうね。戻ったら、様子を聞かせていただくわ。" },
    ],
    [
      { speaker: "aria", text: "荷車、角を曲がるよ。" },
      { speaker: "leon", text: "見えてる。少し間を空けてから行こう。" },
      { speaker: "aria", text: "うん。今度の角は、右だね。" },
    ],
    [
      { speaker: "aria", text: "帰り道は、あの青い布のところからだよね。" },
      { speaker: "leon", text: "ああ。曲がり角も書いておいた。明日はここから先を確かめよう。" },
      { speaker: "aria", text: "うん。付き合ってくれて、ありがとう。" },
    ],
  ],
  [chapterFourStages[4].quest]: [
    [
      { speaker: "aria", text: "溝までまっすぐ。同じ深さで掘ってる。" },
      { speaker: "leon", text: "水を残したくて、ここまで揃えたんだろうな。" },
      { speaker: "aria", text: "前の塔では、水を出すのに苦労したのにね。" },
    ],
    [
      { speaker: "mira", text: "札の文字、こちらからだと読みにくいわね。" },
      { speaker: "aria", text: "抜いちゃだめだよ。植えた人しか分からない順番かもしれない。" },
      { speaker: "mira", text: "ええ。回って見るわ。" },
    ],
  ],
  [chapterFourStages[5].quest]: [
    [
      { speaker: "leon", text: "写しは俺が預かります。" },
      { speaker: "finn", text: "原本も、棚よりずっと見やすい所へ戻したしな。" },
      {
        speaker: "leon",
        text: "持ち主へ直接返しただけでしょう。枚数を数えられたところまで、見てました。",
      },
    ],
    [
      { speaker: "aria", text: "全部捨てるために来たって、思われたくないな。" },
      { speaker: "mira", text: "残せる株を入れる籠も、見せておきましょうか。" },
      { speaker: "aria", text: "うん。私たちも、あの苔に助けてもらったんだし。" },
    ],
  ],
  [chapterFourStages[6].quest]: [
    [
      { speaker: "aria", text: "この株で、端まで揃ったよ。" },
      { speaker: "lico", text: "右の根、少し浮いてる。そこ、押さえて。" },
      { speaker: "aria", text: "こう？　今度は、食べられる前に布を掛けよう。" },
    ],
    [
      { speaker: "lico", text: "魔物を食べても平気なの、どこまでなんだろ。" },
      { speaker: "finn", text: "聞きに行くと、先に籠の中を調べられるぞ。" },
      { speaker: "lico", text: "……蓋、もう一枚いるかな。" },
    ],
  ],
  [chapterFourStages[7].quest]: [
    [
      { speaker: "leon", text: "その石の先は滑ります。足を置くなら、乾いた方へ。" },
      { speaker: "lico", text: "見てる。……手帳の方を。" },
      { speaker: "leon", text: "次の平らな場所で止まりますから、それまで閉じてください。" },
    ],
    [
      { speaker: "mira", text: "その手、また擦っているでしょう。見せて。" },
      { speaker: "finn", text: "空籠を返したらな。" },
      { speaker: "mira", text: "籠は逃げないわ。手は、今のうちに。" },
    ],
  ],
  [chapterFourStages[8].quest]: [
    [
      { speaker: "lico", text: "ベルネの石の記録、歩きながら読んでいい？" },
      { speaker: "leon", text: "次の休憩で渡します。段差を見ていてください。" },
      { speaker: "lico", text: "休憩、次の木陰でもいい？" },
    ],
    [
      { speaker: "mira", text: "苔の記録も、患者さんの様子も、あの食堂へ届くのね。" },
      { speaker: "aria", text: "店主さんの仕事、増やしちゃったな。" },
      { speaker: "mira", text: "ええ。帰ったら、まずお礼を。それから置き場所を相談しましょう。" },
    ],
  ],
};
const rests: StoryLine[][] = [
  [
    { speaker: "mira", text: "一息ついて。食事と休みも、仕事のうちよ。" },
    { speaker: "finn", text: "先生の分も椅子を空けたよ。" },
  ],
  [
    { speaker: "aria", text: "足元の苔は踏まないでね。" },
    { speaker: "leon", text: "道を確かめてから進もう。" },
  ],
];
function mossTrailBanter(node: number): StoryLine[] {
  const pool = routes[MOSS_TRAIL_QUEST];
  const phase = mossTrailPhase(node);
  if (phase === 0) return pool[2];
  if (phase === 1) return pool[3];
  return pool[node < 11 ? 1 : 0];
}
export function chapterFourBanter(run: Run): StoryLine[] | null {
  if (!isChapterFourQuest(run.quest)) return null;
  if (run.phase !== "rest" && run.quest === chapterFourStages[6].quest && run.node < 9)
    return [
      { speaker: "lico", text: "苗を運ぶなら、あの籠を先に守って。" },
      { speaker: "leon", text: "道を空けます。アリア、布を頼む。" },
    ];
  if (run.phase !== "rest" && run.quest === MOSS_TRAIL_QUEST) return mossTrailBanter(run.node);
  const pool = run.phase === "rest" ? rests : routes[run.quest];
  if (!pool.length) return null;
  return pool[Math.floor(run.node / 6) % pool.length];
}
