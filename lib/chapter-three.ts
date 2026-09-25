import type { Quest } from "./game.ts";

export const BERNE_QUEST = "berne-road";
export const BERNE_CALLS_QUEST = "berne-house-calls";
export const STONE_TRACE_QUEST = "missing-keystone";
export const MANOR_QUEST = "riverside-manor";
export const REPLACEMENT_QUEST = "matching-lantern-stone";
export const REHEARSAL_QUEST = "manor-survey";
export const RECEPTION_QUEST = "garden-reception";
export const STONE_RETURN_QUEST = "keystone-night-road";
export const BERNE_RESTORATION_QUEST = "berne-restoration";
export const LUNCH_INTERLUDE = "interlude-walnut-lunch";

const definitions = [
  [
    BERNE_QUEST,
    "隣の席の聞き上手",
    "ベルネへの街道",
    "街道の魔物を追い払い、フィンの案内でベルネへ向かおう。",
    "ベルネに到着しました",
    "石の売買と塔の噂を聞きましょう。",
    "tower-road",
    24,
  ],
  [
    BERNE_CALLS_QUEST,
    "石を敷いた街",
    "ベルネの石畳と往診先",
    "暗くなった通りを確かめ、ミラの往診を手伝おう。",
    "往診先に荷物を届けました",
    "休憩しながら、庭の石の話を聞きましょう。",
    "berne",
    25,
  ],
  [
    STONE_TRACE_QUEST,
    "抜けた石の行き先",
    "塔へ続く古い石組み",
    "管理図と撤去の控えを照合し、石段の下の継ぎ目を調べよう。",
    "古い石組みを調べました",
    "石工と一緒に、抜けた石を確かめましょう。",
    "berne",
    27,
  ],
  [
    MANOR_QUEST,
    "庭を照らす買い物",
    "川向こうの屋敷",
    "荷運びを手伝いながら、庭に置かれた石を確かめよう。",
    "屋敷の荷運びを終えました",
    "買い手の望む灯りを、四人で確かめましょう。",
    "riverside-manor",
    27,
  ],
  [
    REPLACEMENT_QUEST,
    "同じ灯りを探して",
    "石工の資材置き場",
    "持ち出してよい保管石を運び、寸法と光を比べよう。",
    "候補の石が揃いました",
    "保管の記録と照らし合わせましょう。",
    "berne",
    29,
  ],
  [
    REHEARSAL_QUEST,
    "四人で下見",
    "屋敷の庭と作業通路",
    "鍋を返し、屋敷の仕事を手伝いながら通路と展示台を調べよう。",
    "屋敷の下見を終えました",
    "展示の予定と帰り道を確かめましょう。",
    "riverside-manor",
    30,
  ],
  [
    RECEPTION_QUEST,
    "灯りのお披露目",
    "客を迎える屋敷の庭",
    "作業用通路をたどり、鉢と包みを展示台のそばへ運ぼう。",
    "搬入を終えました",
    "予定の変わった持ち場を確かめましょう。",
    "riverside-manor",
    31,
  ],
  [
    STONE_RETURN_QUEST,
    "間違った荷物を戻す夜",
    "橋へ続く夜の街道",
    "すり替えた要の石を守り、斜面の魔物を追い払いながら橋へ戻ろう。",
    "橋まで石を守りきりました",
    "四人の無事と、包帯を確かめましょう。",
    "moss-night-road",
    34,
  ],
  [
    BERNE_RESTORATION_QUEST,
    "戻る灯り、増える同行者",
    "ベルネの塔の足元",
    "石工と石組みを直そう。フィンは柵と通行の案内を受け持つ。",
    "石組みの修復を終えました",
    "灯りが戻る街で、四人でお茶にしましょう。",
    "berne",
    31,
  ],
] as const;

export const chapterThreeStages = definitions.map(([quest, title, , , arrival, detail], i) => ({
  quest,
  number: `3-${String(i + 1)}`,
  title,
  arrival,
  detail,
}));
export const chapterThreeQuests: Quest[] = definitions.map(
  ([id, name, region, desc, , , scenery], i) => ({
    id,
    name,
    region,
    desc,
    kind: i === 0 || i === 7 ? "討伐" : i === 2 || i === 4 || i === 8 ? "採取" : "護衛",
    tier: 2,
    need: 34 + i * 2,
    seconds: 180,
    gold: 260 + i * 20,
    xp: 180 + i * 15,
    herbs: 0,
    ore: 0,
    enemy: 8,
    enemyName: "街道のスライム",
    background: `/scenery/${scenery}-background.webp`,
    availability: "repeatable",
  }),
);
export const isChapterThreeQuest = (id: string) =>
  chapterThreeStages.some((stage) => stage.quest === id);
export const chapterThreeRank = (id: string) => definitions.find((item) => item[0] === id)?.[7];

type Work = { kind: "battle" | "escort" | "gather"; name: string };
const job = (kind: Work["kind"], ...names: string[]): Work[] =>
  names.map((name) => ({ kind, name }));
const patterns: Partial<Record<string, Work[]>> = {
  [BERNE_QUEST]: [
    ...job("escort", "往診の荷物を運ぶ"),
    ...job("battle", "街道のスライム"),
    ...job("escort", "門へ続く道を確かめる"),
  ],
  [BERNE_CALLS_QUEST]: job(
    "escort",
    "往診先へ包みを運ぶ",
    "薬と湯を用意する",
    "石畳の抜けた道を確かめる",
  ),
  [STONE_TRACE_QUEST]: job(
    "gather",
    "石段の土と根を除く",
    "区画図と継ぎ目を照合する",
    "抜けた石の溝を写し取る",
  ),
  [MANOR_QUEST]: job("escort", "厨房へ荷物を運ぶ", "庭へ鉢を運ぶ", "荷札と庭の灯りを確かめる"),
  [REPLACEMENT_QUEST]: [
    ...job("escort", "保管石を比較台へ運ぶ"),
    ...job("gather", "石の色と明るさを比べる", "寸法と保管記録を照合する"),
  ],
  [REHEARSAL_QUEST]: job(
    "escort",
    "厨房へ鍋を届ける",
    "飾り布の包みを整える",
    "展示台と帰路を確かめる",
  ),
  [RECEPTION_QUEST]: job(
    "escort",
    "鉢と包みを運ぶ",
    "踏み跡から通路を確かめる",
    "会場の荷物を仕分ける",
  ),
  [STONE_RETURN_QUEST]: [
    ...job("battle", "斜面から下りてくるスライム"),
    ...job("escort", "石を載せた荷車を橋へ運ぶ"),
    ...job("battle", "荷車へ近づくスライム"),
  ],
  [BERNE_RESTORATION_QUEST]: job(
    "gather",
    "目地に入った根を取り除く",
    "石工と溝の向きを確かめる",
    "柵と石組みの通り道を整える",
  ),
};
export function chapterThreeWork(id: string, node: number) {
  const pattern = patterns[id];
  return pattern ? pattern[node % pattern.length] : null;
}
export const chapterThreeWorkload = (id: string) => (isChapterThreeQuest(id) ? 2.4 : 1);
