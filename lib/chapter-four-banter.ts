import {
  isChapterFourQuest,
  LINDE_REQUESTS_QUEST,
  LANTERN_DETOUR_QUEST,
  BREKKA_ARRIVAL_QUEST,
  MOSS_TRAIL_QUEST,
  MOSS_TRAIL_SECOND_DAY_QUEST,
  MOSS_BEDS_QUEST,
  LICO_RECORDS_QUEST,
  MERRILL_SEEDLINGS_QUEST,
  MOSS_TRANSPLANT_QUEST,
  GUILD_FOUNDING_QUEST,
} from "./chapter-four.ts";
import type { Run } from "./game.ts";
import type { StoryLine } from "./stories.ts";
import { chapterFourBattleBanter } from "./chapter-four-battle-banter.ts";

const routes: Record<string, StoryLine[][]> = {
  [LINDE_REQUESTS_QUEST]: [
    [
      {
        expression: "smile",
        speaker: "aria",
        text: "これも「塔の人へ」だって。四人とも、塔のことで動いてるもんね。",
      },
      {
        expression: "serious",
        speaker: "leon",
        text: "誰宛てか聞いておこう。返事を出した分にも、印が要るな。",
      },
      {
        expression: "serious",
        speaker: "aria",
        text: "フィンが勝手に返事したのは、別の印にしておいて。",
      },
    ],
    [
      {
        expression: "serious",
        speaker: "mira",
        text: "食事代にする前に、預かっているお金だと思い出さなかったの？",
      },
      { expression: "mischievous", speaker: "finn", text: "食べ終わってからなら、思い出したよ。" },
      { expression: "serious", speaker: "mira", text: "次は、お皿が来る前に思い出しましょうね。" },
    ],
  ],
  [LANTERN_DETOUR_QUEST]: [
    [
      { expression: "serious", speaker: "leon", text: "村は、この道を曲がった先だ。" },
      { expression: "smile", speaker: "aria", text: "地図にない塔って、ちょっと楽しみ。" },
      {
        expression: "worried",
        speaker: "leon",
        text: "楽しみにするのはいいが、直せるとはまだ言わないでくれ。",
      },
    ],
    [
      {
        expression: "mischievous",
        speaker: "finn",
        text: "塔を三つも四つも直してると、忙しくなるねえ。",
      },
      {
        expression: "worried",
        speaker: "mira",
        text: "フィンさんがご一緒したのは、一つでしょう？",
      },
      { expression: "worried", speaker: "finn", text: "そういう数え方だと、急に小さくなるな。" },
    ],
  ],
  [BREKKA_ARRIVAL_QUEST]: [
    [
      { expression: "smile", speaker: "aria", text: "樽がごろごろ通るね。全部エール？" },
      { speaker: "leon", text: "空樽を戻す荷もあるらしい。帰りも荷車が要るんだな。" },
      { expression: "smile", speaker: "aria", text: "飲み終わったら仕事も終わり、じゃないんだ。" },
    ],
    [
      { expression: "smile", speaker: "finn", text: "匂いだけで醸造所まで行けそうかい？" },
      {
        expression: "smile",
        speaker: "aria",
        text: "焼いてるパンの方が近いよ。そっちへ行きそう。",
      },
      { expression: "smile", speaker: "finn", text: "それはそれで、いい鼻だ。" },
    ],
  ],
  [MOSS_TRAIL_SECOND_DAY_QUEST]: [
    [
      { expression: "shy", speaker: "aria", text: "この布、昨日もあった。" },
      { expression: "shy", speaker: "leon", text: "今日は曲がらずに通る目印だな。" },
      { expression: "shy", speaker: "aria", text: "……覚える役には立ったでしょ。" },
    ],
    [
      {
        expression: "worried",
        speaker: "mira",
        text: "留守の間に、誰かいらっしゃるかもしれないわね。",
      },
      {
        expression: "worried",
        speaker: "finn",
        text: "そのために先生へ頼んだんだろ。今戻ったら、引き継いだ先生が困るよ。",
      },
      {
        expression: "shy",
        speaker: "mira",
        text: "……そうね。戻ったら、様子を聞かせていただくわ。",
      },
    ],
  ],
  [MOSS_TRAIL_QUEST]: [
    [
      { expression: "serious", speaker: "aria", text: "荷車、角を曲がるよ。" },
      { expression: "serious", speaker: "leon", text: "見えてる。少し間を空けてから行こう。" },
      { expression: "serious", speaker: "aria", text: "うん。今度の角は、右だね。" },
    ],
    [
      { speaker: "aria", text: "帰り道は、あの青い布のところからだよね。" },
      {
        expression: "smile",
        speaker: "leon",
        text: "ああ。荷車の時刻と、ここまでの曲がり角は書けた。明日はその先だ。",
      },
      { expression: "smile", speaker: "aria", text: "うん。付き合ってくれて、ありがとう。" },
    ],
  ],
  [MOSS_BEDS_QUEST]: [
    [
      { expression: "serious", speaker: "aria", text: "溝までまっすぐ。同じ深さで掘ってる。" },
      {
        expression: "serious",
        speaker: "leon",
        text: "水を残したくて、ここまで揃えたんだろうな。",
      },
      { expression: "worried", speaker: "aria", text: "前の塔では、水を出すのに苦労したのにね。" },
    ],
    [
      { expression: "worried", speaker: "mira", text: "札の文字、こちらからだと読みにくいわね。" },
      {
        expression: "serious",
        speaker: "aria",
        text: "抜いちゃだめだよ。植えた人しか分からない順番かもしれない。",
      },
      { expression: "smile", speaker: "mira", text: "ええ。回って見るわ。" },
    ],
  ],
  [LICO_RECORDS_QUEST]: [
    [
      { expression: "serious", speaker: "leon", text: "写しは俺が預かります。" },
      {
        expression: "mischievous",
        speaker: "finn",
        text: "原本も、棚よりずっと見やすい所へ戻したしな。",
      },
      {
        expression: "serious",
        speaker: "leon",
        text: "持ち主へ直接返しただけでしょう。枚数を数えられたところまで、見てました。",
      },
    ],
    [
      {
        expression: "worried",
        speaker: "aria",
        text: "全部捨てるために来たって、思われたくないな。",
      },
      {
        expression: "smile",
        speaker: "mira",
        text: "残せる株を入れる籠も、見せておきましょうか。",
      },
      {
        expression: "smile",
        speaker: "aria",
        text: "うん。私たちも、あの苔に助けてもらったんだし。",
      },
    ],
  ],
  [MERRILL_SEEDLINGS_QUEST]: [
    [
      { expression: "smile", speaker: "aria", text: "この株で、端まで揃ったよ。" },
      { expression: "serious", speaker: "lico", text: "右の根、少し浮いてる。そこ、押さえて。" },
      {
        expression: "smile",
        speaker: "aria",
        text: "こう？　今度は、食べられる前に布を掛けよう。",
      },
    ],
    [
      { expression: "smile", speaker: "lico", text: "魔物を食べても平気なの、どこまでなんだろ。" },
      { expression: "worried", speaker: "finn", text: "聞きに行くと、先に籠の中を調べられるぞ。" },
      { expression: "worried", speaker: "lico", text: "……蓋、もう一枚いるかな。" },
    ],
  ],
  [MOSS_TRANSPLANT_QUEST]: [
    [
      {
        expression: "serious",
        speaker: "leon",
        text: "その石の先は滑ります。足を置くなら、乾いた方へ。",
      },
      { speaker: "lico", text: "見てる。……手帳の方を。" },
      {
        expression: "serious",
        speaker: "leon",
        text: "次の平らな場所で止まりますから、それまで閉じてください。",
      },
    ],
    [
      { expression: "worried", speaker: "mira", text: "その手、また擦っているでしょう。見せて。" },
      { expression: "mischievous", speaker: "finn", text: "空籠を返したらな。" },
      { expression: "serious", speaker: "mira", text: "籠は逃げないわ。手は、今のうちに。" },
    ],
  ],
  [GUILD_FOUNDING_QUEST]: [
    [
      { expression: "smile", speaker: "lico", text: "ベルネの石の記録、歩きながら読んでいい？" },
      {
        expression: "serious",
        speaker: "leon",
        text: "次の休憩で渡します。段差を見ていてください。",
      },
      { expression: "smile", speaker: "lico", text: "休憩、次の木陰でもいい？" },
    ],
    [
      {
        expression: "smile",
        speaker: "mira",
        text: "苔の記録も、患者さんの様子も、あの食堂へ届くのね。",
      },
      { expression: "worried", speaker: "aria", text: "店主さんの仕事、増やしちゃったな。" },
      {
        expression: "smile",
        speaker: "mira",
        text: "ええ。帰ったら、まずお礼を。それから置き場所を相談しましょう。",
      },
    ],
  ],
};
const rests: StoryLine[][] = [
  [
    { expression: "smile", speaker: "mira", text: "一息ついて。食事と休みも、仕事のうちよ。" },
    { expression: "smile", speaker: "finn", text: "先生の分も椅子を空けたよ。" },
  ],
  [
    { expression: "serious", speaker: "aria", text: "足元の苔は踏まないでね。" },
    { expression: "serious", speaker: "leon", text: "道を確かめてから進もう。" },
  ],
];
function pursuitBanter(run: Run): StoryLine[] | null {
  if (run.quest === MOSS_TRAIL_QUEST)
    return run.phase === "rest" ? rests[1] : routes[run.quest][run.node < 10 ? 0 : 1];
  if (run.phase !== "rest" && run.quest === MOSS_TRAIL_SECOND_DAY_QUEST)
    return routes[run.quest][run.node < 5 ? 1 : 0];
  return null;
}
export function chapterFourBanter(run: Run): StoryLine[] | null {
  if (!isChapterFourQuest(run.quest)) return null;
  const battle = chapterFourBattleBanter(run);
  if (battle) return battle;
  const pursuit = pursuitBanter(run);
  if (pursuit) return pursuit;
  if (run.phase !== "rest" && run.quest === MERRILL_SEEDLINGS_QUEST && run.node < 9)
    return [
      { expression: "serious", speaker: "lico", text: "苗を運ぶなら、あの籠を先に守って。" },
      { expression: "serious", speaker: "leon", text: "道を空けます。アリア、布を頼む。" },
    ];
  const pool = run.phase === "rest" ? rests : routes[run.quest];
  if (!pool.length) return null;
  return pool[Math.floor(run.node / 6) % pool.length];
}
