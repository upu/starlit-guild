import type { StoryLine } from "./stories.ts";
import { pumpetyBattleBanter } from "./pumpety-battle-banter.ts";
import { line } from "./story-lines.ts";
import type { Run } from "./game.ts";
import {
  BLOCKADE_QUEST,
  DELIVERY_PREP_QUEST,
  GOLEM_QUEST,
  HOUSE_CALLS_QUEST,
  MEDICINE_RETURN_QUEST,
  MOON_HERB_QUEST,
  MOUNTAIN_QUEST,
  PICNIC_QUEST,
  SIGNPOST_QUEST,
} from "./chapter-two-data.ts";
export * from "./chapter-two-data.ts";

export const trioQuest = (id: string) =>
  [
    MOUNTAIN_QUEST,
    SIGNPOST_QUEST,
    GOLEM_QUEST,
    BLOCKADE_QUEST,
    HOUSE_CALLS_QUEST,
    MEDICINE_RETURN_QUEST,
  ].includes(id);
// Pumpety's puppets and the cargo golem cause mischief rather than attacking like monsters.
export const chapterTwoMischief = (id: string) =>
  [SIGNPOST_QUEST, GOLEM_QUEST, BLOCKADE_QUEST].includes(id);
type ChapterWork = { kind: "battle" | "escort" | "gather"; name: string };
const workPatterns: Partial<Record<string, ChapterWork[]>> = {
  [DELIVERY_PREP_QUEST]: [
    "注文済みの瓶と布を受け取る",
    "薬瓶と蜜を別々に包む",
    "配達先ごとに荷札を確かめる",
  ].map((name) => ({ kind: "escort", name })),
  [MOUNTAIN_QUEST]: [{ kind: "battle", name: "山道の霧狼" }],
  [SIGNPOST_QUEST]: [
    { kind: "escort", name: "踏み跡と道標を照らし合わせる" },
    { kind: "battle", name: "道標をさらう人形" },
    { kind: "escort", name: "元の道へ道標を運ぶ" },
  ],
  [GOLEM_QUEST]: [
    { kind: "battle", name: "おねだりする運搬用ゴーレム" },
    { kind: "battle", name: "荷物へ忍び寄る人形" },
    { kind: "battle", name: "おねだりする運搬用ゴーレム" },
  ],
  [HOUSE_CALLS_QUEST]: [
    "配達先へ包みを運ぶ",
    "往診に使う湯と水を用意する",
    "ミラの指示で包みを仕分ける",
    "家の人から空き瓶を受け取る",
    "次の家への控えを確かめる",
  ].map((name) => ({ kind: "escort", name })),
  [MEDICINE_RETURN_QUEST]: [
    { kind: "escort", name: "戻った道標の向きを確かめる" },
    { kind: "escort", name: "行き交う荷車に道を譲る" },
    { kind: "battle", name: "山道のスライム" },
    { kind: "escort", name: "静かな作業場の前を通る" },
    { kind: "escort", name: "空き瓶を揺らさず運ぶ" },
  ],
  [PICNIC_QUEST]: [{ kind: "battle", name: "丘のスライム" }],
  [MOON_HERB_QUEST]: [
    { kind: "gather", name: "林の切れ目で葉の裏を見比べる" },
    { kind: "gather", name: "光を蓄えた葉を包みに分ける" },
    { kind: "battle", name: "林のスライム" },
  ],
};
export function chapterTwoWork(id: string, node: number) {
  if (id === BLOCKADE_QUEST)
    return {
      kind: "battle" as const,
      name: node < 9 ? "荷物を囲む小さな人形" : "通せんぼする運搬用ゴーレム",
    };
  const pattern = workPatterns[id];
  return pattern ? pattern[node % pattern.length] : null;
}
// Non-hostile jobs need sustained work, without pretending that a parcel attacks.
export function chapterTwoWorkload(id: string) {
  return [
    MOON_HERB_QUEST,
    DELIVERY_PREP_QUEST,
    SIGNPOST_QUEST,
    HOUSE_CALLS_QUEST,
    MEDICINE_RETURN_QUEST,
  ].includes(id)
    ? 2.4
    : 1;
}
function packingBanter(run: Run): StoryLine[] | null {
  if (run.quest !== DELIVERY_PREP_QUEST) return null;
  return [
    [
      line("aria", "瓶と蜜は別々。荷札も合ってるよ。", "smile"),
      line("leon", "布を間に挟もう。隣の瓶とぶつからないように。", "serious"),
    ],
    [
      line("aria", "蜜のお店、こっちの通りだって。", "smile"),
      line("leon", "先に瓶を受け取っておく。数だけ数えておいてくれ。", "serious"),
    ],
    [
      line("aria", "これで全部そろったね。", "smile"),
      line("leon", "控えと突き合わせよう。足りない分は、今日のうちに。", "serious"),
    ],
  ][run.node % 3];
}
const trioRests: StoryLine[][] = [
  [
    line("mira", "痛いのは、我慢しなくていいのよ。手を見せてね。", "worried"),
    line("aria", "ミラも座って。水、三人分あるから。", "smile"),
  ],
  [
    line("leon", "少し休みましょう。荷物は俺が見ています。", "smile"),
    line("mira", "ありがとう。その前に、ひとつだけ。包帯の数を――", "smile"),
    line("aria", "それは座ってから数えよう。", "worried"),
  ],
  [
    line("aria", "はあ……ちょっと、足が止まっちゃった。", "tired"),
    line("mira", "深い息を、ひとつ。急がなくていいのよ。", "smile"),
    line("leon", "水を回します。ミラさんの分も。", "smile"),
  ],
];
function trioBanter(run: Run): StoryLine[] {
  return run.phase === "rest"
    ? trioRests[run.node % trioRests.length]
    : run.quest === MOUNTAIN_QUEST
      ? [
          line("aria", "この先、段差があるよ。右側なら歩きやすそう。", "smile"),
          line("leon", "荷物は内側へ。俺が外を見る。", "serious"),
          line("mira", "段差には手を、坂には息を。ゆっくりで大丈夫よ。", "smile"),
        ]
      : run.quest === SIGNPOST_QUEST
        ? [
            line("aria", "草が踏まれてる。元の道は、こっちだね。", "smile"),
            line("mira", "あの木の向こうを、前の往診でも通ったわ。", "smile"),
            line("leon", "道標を戻そう。荷物からは離れないで。", "serious"),
          ]
        : [
            line("leon", "大きい手は俺が止める。袋の紐を見てくれ。", "serious"),
            line("aria", "小さいのも来てる！　そっちへは行かせないよ。", "serious"),
            line("mira", "薬箱はここに。傷は、そのままにしないでね。", "serious"),
          ];
}
export function chapterTwoBanter(run: Run): StoryLine[] | null {
  const battle = pumpetyBattleBanter(run);
  if (battle) return battle;
  const finale = finaleBanter(run);
  if (finale) return finale;
  if (trioQuest(run.quest)) return trioBanter(run);
  if (run.quest === DELIVERY_PREP_QUEST) return packingBanter(run);
  if (run.quest === PICNIC_QUEST)
    return [
      [
        line("aria", "今日は荷札も控えもないね。", "smile"),
        line("leon", "パンの包みなら、二つある。", "smile"),
      ],
      [
        line("aria", "ね、あの木陰は？　街も見えるよ。", "smile"),
        line("leon", "座るところが乾いてるか、見てみよう。", "smile"),
      ],
      [
        line("leon", "ここなら布を広げられそうだ。", "smile"),
        line("aria", "うん。隣に座らせてね。", "smile"),
      ],
    ][Math.min(2, Math.floor(run.node / 5))];
  if (run.quest !== MOON_HERB_QUEST) return null;
  return [
    [
      line("aria", "ここ、枝が途切れてる。夜なら月が差すね。", "smile"),
      line("leon", "場所を覚えておこう。最初の包みは、ここの分だ。", "serious"),
    ],
    [
      line("aria", "同じ草でも、裏の光り方が違う。こっちだけ採るね。", "smile"),
      line("leon", "さっきの場所とは別に包むぞ。帰って説明できるように。", "serious"),
    ],
    [
      line("leon", "草むらが動いた。包みを踏まれないように寄せよう。", "serious"),
      line("aria", "うん。追い払ったら、葉が潰れてないか確かめよう。", "serious"),
    ],
  ][run.node % 3];
}
function puppetBanter(run: Run): StoryLine[] {
  return [
    line(
      "aria",
      run.node === 2
        ? "あの手の合図で、また動く！　人形から止めるね。"
        : "小さいほうは包みの前に戻るね。そこを狙うよ。",
      "serious",
    ),
    line(
      "leon",
      run.node === 0
        ? "ああ。回り込むほうも見ておく。"
        : "大きいのが腕を広げた。俺が外へ引きつける。",
      "serious",
    ),
    line(
      "mira",
      run.node === 0
        ? "薬箱はここに。深く踏み込みすぎないでね。"
        : run.node === 1
          ? "手の痛みが戻ったら、すぐ見せてね。"
          : "怪我をしたら、すぐに言ってね。私が手当てするわ。",
      "serious",
    ),
  ];
}
function finaleBanter(run: Run): StoryLine[] | null {
  if (run.quest === BLOCKADE_QUEST && run.nodes === 3) return puppetBanter(run);
  if (run.quest === HOUSE_CALLS_QUEST)
    return [
      [
        line("aria", "次の包み、ここへ置くね。水も替えてきたよ。", "smile"),
        line("mira", "ありがとう。診察が済んだら、お薬を確かめるわ。", "smile"),
        line("leon", "空き瓶は別の袋だ。控えと合わせておこう。", "serious"),
      ],
      [
        line("aria", "お湯、もう一度沸かしてくるね。", "smile"),
        line("mira", "助かるわ。この家は、もう少しかかりそうなの。", "smile"),
        line("leon", "桶は表に置いておきます。冷めないうちに呼んでください。", "serious"),
      ],
      [
        line("aria", "この控え、次はどの家？"),
        line("leon", "坂の下の二軒だ。順番はこっちで揃えておく。", "serious"),
        line("mira", "ありがとう。着いたら、先に喉を診るわね。", "smile"),
      ],
    ][run.node % 3];
  if (run.quest === MEDICINE_RETURN_QUEST)
    return [
      [
        line("aria", "荷車が来たよ。通れるようになって、よかったね。", "smile"),
        line("leon", "ああ。草むらも見ておこう。小さい魔物はまだいる。", "serious"),
        line("mira", "空き瓶を返したら、お茶にしましょう。", "smile"),
      ],
      [
        line("aria", "道標、ちゃんとこっち向いてる。", "smile"),
        line("leon", "ああ。作業場も静かなままだ。", "serious"),
        line("mira", "あの子たち、どこへ行ったのかしらね。"),
      ],
    ][run.node % 2];
  if (run.quest === BLOCKADE_QUEST)
    return run.node < 9
      ? [
          line("aria", "荷物の前から、順番に止めるね。", "serious"),
          line("leon", "大きい手は俺が見る。ミラさん、後ろをお願いします。", "serious"),
          line("mira", "ええ。二人とも、傷はそのままにしないでね。", "serious"),
        ]
      : [
          line("aria", "ミラ、腕！　庇ったときに切ったでしょ。", "worried"),
          line("leon", "血が出てます。先に巻いてください。", "serious"),
          line("mira", "……あら。気づかなかったわ。あとで、必ず。", "surprised"),
        ];
  return null;
}
