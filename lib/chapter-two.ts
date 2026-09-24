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
export const chapterTwoGolem = (id: string, node: number) =>
  (id === GOLEM_QUEST && node % 3 !== 1) || (id === BLOCKADE_QUEST && node >= 9);
export function chapterTwoEnemyAsset(id: string, node: number) {
  if (chapterTwoGolem(id, node)) return "/enemies/cargo-golem.png";
  return [SIGNPOST_QUEST, GOLEM_QUEST, BLOCKADE_QUEST].includes(id)
    ? "/enemies/mountain-puppet.png"
    : null;
}
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
function packingBanter(run: Run) {
  if (run.quest !== DELIVERY_PREP_QUEST) return null;
  return [
    [
      { speaker: "aria", text: "瓶と蜜は別々。荷札も合ってるよ。" },
      { speaker: "leon", text: "布を間に挟もう。隣の瓶とぶつからないように。" },
    ],
    [
      { speaker: "aria", text: "蜜のお店、こっちの通りだって。" },
      { speaker: "leon", text: "先に瓶を受け取っておく。数だけ数えておいてくれ。" },
    ],
    [
      { speaker: "aria", text: "これで全部そろったね。" },
      { speaker: "leon", text: "控えと突き合わせよう。足りない分は、今日のうちに。" },
    ],
  ][run.node % 3];
}
const trioRests = [
  [
    { speaker: "mira", text: "痛いのは、我慢しなくていいのよ。手を見せてね。" },
    { speaker: "aria", text: "ミラも座って。水、三人分あるから。" },
  ],
  [
    { speaker: "leon", text: "少し休みましょう。荷物は俺が見ています。" },
    { speaker: "mira", text: "ありがとう。その前に、ひとつだけ。包帯の数を――" },
    { speaker: "aria", text: "それは座ってから数えよう。" },
  ],
  [
    { speaker: "aria", text: "はあ……ちょっと、足が止まっちゃった。" },
    { speaker: "mira", text: "深い息を、ひとつ。急がなくていいのよ。" },
    { speaker: "leon", text: "水を回します。ミラさんの分も。" },
  ],
];
function trioBanter(run: Run) {
  return run.phase === "rest"
    ? trioRests[run.node % trioRests.length]
    : run.quest === MOUNTAIN_QUEST
      ? [
          { speaker: "aria", text: "この先、段差があるよ。右側なら歩きやすそう。" },
          { speaker: "leon", text: "荷物は内側へ。俺が外を見る。" },
          { speaker: "mira", text: "段差には手を、坂には息を。ゆっくりで大丈夫よ。" },
        ]
      : run.quest === SIGNPOST_QUEST
        ? [
            { speaker: "aria", text: "草が踏まれてる。元の道は、こっちだね。" },
            { speaker: "mira", text: "あの木の向こうを、前の往診でも通ったわ。" },
            { speaker: "leon", text: "道標を戻そう。荷物からは離れないで。" },
          ]
        : [
            { speaker: "leon", text: "大きい手は俺が止める。袋の紐を見てくれ。" },
            { speaker: "aria", text: "小さいのも来てる！　そっちへは行かせないよ。" },
            { speaker: "mira", text: "薬箱はここに。傷は、そのままにしないでね。" },
          ];
}
export function chapterTwoBanter(run: Run) {
  const finale = finaleBanter(run);
  if (finale) return finale;
  if (trioQuest(run.quest)) return trioBanter(run);
  if (run.quest === DELIVERY_PREP_QUEST) return packingBanter(run);
  if (run.quest === PICNIC_QUEST)
    return [
      [
        { speaker: "aria", text: "今日は荷札も控えもないね。" },
        { speaker: "leon", text: "パンの包みなら、二つある。" },
      ],
      [
        { speaker: "aria", text: "ね、あの木陰は？　街も見えるよ。" },
        { speaker: "leon", text: "座るところが乾いてるか、見てみよう。" },
      ],
      [
        { speaker: "leon", text: "ここなら布を広げられそうだ。" },
        { speaker: "aria", text: "うん。隣に座らせてね。" },
      ],
    ][Math.min(2, Math.floor(run.node / 5))];
  if (run.quest !== MOON_HERB_QUEST) return null;
  return [
    [
      { speaker: "aria", text: "ここ、枝が途切れてる。夜なら月が差すね。" },
      { speaker: "leon", text: "場所を覚えておこう。最初の包みは、ここの分だ。" },
    ],
    [
      { speaker: "aria", text: "同じ草でも、裏の光り方が違う。こっちだけ採るね。" },
      { speaker: "leon", text: "さっきの場所とは別に包むぞ。帰って説明できるように。" },
    ],
    [
      { speaker: "leon", text: "草むらが動いた。包みを踏まれないように寄せよう。" },
      { speaker: "aria", text: "うん。追い払ったら、葉が潰れてないか確かめよう。" },
    ],
  ][run.node % 3];
}
function puppetBanter(run: Run) {
  return [
    {
      speaker: "aria",
      text:
        run.node === 2
          ? "あの手の合図で、また動く！　人形から止めるね。"
          : "小さいほうは包みの前に戻るね。そこを狙うよ。",
    },
    {
      speaker: "leon",
      text:
        run.node === 0
          ? "ああ。回り込むほうも見ておく。"
          : "大きいのが腕を広げた。俺が外へ引きつける。",
    },
    {
      speaker: "mira",
      text:
        run.node === 0
          ? "薬箱はここに。深く踏み込みすぎないでね。"
          : run.node === 1
            ? "手の痛みが戻ったら、すぐ見せてね。"
            : "怪我をしたら、すぐに言ってね。私が手当てするわ。",
    },
  ];
}
function finaleBanter(run: Run) {
  if (run.quest === BLOCKADE_QUEST && run.nodes === 3) return puppetBanter(run);
  if (run.quest === HOUSE_CALLS_QUEST)
    return [
      [
        { speaker: "aria", text: "次の包み、ここへ置くね。水も替えてきたよ。" },
        { speaker: "mira", text: "ありがとう。診察が済んだら、お薬を確かめるわ。" },
        { speaker: "leon", text: "空き瓶は別の袋だ。控えと合わせておこう。" },
      ],
      [
        { speaker: "aria", text: "お湯、もう一度沸かしてくるね。" },
        { speaker: "mira", text: "助かるわ。この家は、もう少しかかりそうなの。" },
        { speaker: "leon", text: "桶は表に置いておきます。冷めないうちに呼んでください。" },
      ],
      [
        { speaker: "aria", text: "この控え、次はどの家？" },
        { speaker: "leon", text: "坂の下の二軒だ。順番はこっちで揃えておく。" },
        { speaker: "mira", text: "ありがとう。着いたら、先に喉を診るわね。" },
      ],
    ][run.node % 3];
  if (run.quest === MEDICINE_RETURN_QUEST)
    return [
      [
        { speaker: "aria", text: "荷車が来たよ。通れるようになって、よかったね。" },
        { speaker: "leon", text: "ああ。草むらも見ておこう。小さい魔物はまだいる。" },
        { speaker: "mira", text: "空き瓶を返したら、お茶にしましょう。" },
      ],
      [
        { speaker: "aria", text: "道標、ちゃんとこっち向いてる。" },
        { speaker: "leon", text: "ああ。作業場も静かなままだ。" },
        { speaker: "mira", text: "あの子たち、どこへ行ったのかしらね。" },
      ],
    ][run.node % 2];
  if (run.quest === BLOCKADE_QUEST)
    return run.node < 9
      ? [
          { speaker: "aria", text: "荷物の前から、順番に止めるね。" },
          { speaker: "leon", text: "大きい手は俺が見る。ミラさん、後ろをお願いします。" },
          { speaker: "mira", text: "ええ。二人とも、傷はそのままにしないでね。" },
        ]
      : [
          { speaker: "aria", text: "ミラ、腕！　庇ったときに切ったでしょ。" },
          { speaker: "leon", text: "血が出てます。先に巻いてください。" },
          { speaker: "mira", text: "……あら。気づかなかったわ。あとで、必ず。" },
        ];
  return null;
}
