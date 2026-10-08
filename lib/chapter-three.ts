import { stageHeadings, stageQuests, type StageDefinition } from "./chapter-stages.ts";

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

const definitions: readonly StageDefinition[] = [
  {
    quest: BERNE_QUEST,
    title: "隣の席の聞き上手",
    region: "ベルネへの街道",
    desc: "街道の魔物を追い払い、フィンの案内でベルネへ向かおう。",
    arrival: "ベルネに到着しました",
    detail: "石の売買と塔の噂を聞きましょう。",
    scenery: "tower-road",
    kind: "討伐",
    need: 34,
    gold: 260,
    xp: 180,
    rank: 24,
  },
  {
    quest: BERNE_CALLS_QUEST,
    title: "石を敷いた街",
    region: "ベルネの石畳と往診先",
    desc: "暗くなった通りを確かめ、ミラの往診を手伝おう。",
    arrival: "往診先に荷物を届けました",
    detail: "休憩しながら、庭の石の話を聞きましょう。",
    scenery: "berne",
    kind: "護衛",
    need: 36,
    gold: 280,
    xp: 195,
    rank: 25,
  },
  {
    quest: STONE_TRACE_QUEST,
    title: "抜けた石の行き先",
    region: "塔へ続く古い石組み",
    desc: "管理図と撤去の控えを照合し、石段の下の継ぎ目を調べよう。",
    arrival: "古い石組みを調べました",
    detail: "石工と一緒に、抜けた石を確かめましょう。",
    scenery: "berne",
    kind: "採取",
    need: 38,
    gold: 300,
    xp: 210,
    rank: 27,
  },
  {
    quest: MANOR_QUEST,
    title: "庭を照らす買い物",
    region: "川向こうの屋敷",
    desc: "荷運びを手伝いながら、庭に置かれた石を確かめよう。",
    arrival: "屋敷の荷運びを終えました",
    detail: "買い手の望む灯りを、四人で確かめましょう。",
    scenery: "riverside-manor",
    kind: "護衛",
    need: 40,
    gold: 320,
    xp: 225,
    rank: 27,
  },
  {
    quest: REPLACEMENT_QUEST,
    title: "同じ灯りを探して",
    region: "石工の資材置き場",
    desc: "持ち出してよい保管石を運び、寸法と光を比べよう。",
    arrival: "候補の石が揃いました",
    detail: "保管の記録と照らし合わせましょう。",
    scenery: "berne",
    kind: "採取",
    need: 42,
    gold: 340,
    xp: 240,
    rank: 29,
  },
  {
    quest: REHEARSAL_QUEST,
    title: "四人で下見",
    region: "屋敷の庭と作業通路",
    desc: "鍋を返し、屋敷の仕事を手伝いながら通路と展示台を調べよう。",
    arrival: "屋敷の下見を終えました",
    detail: "展示の予定と帰り道を確かめましょう。",
    scenery: "riverside-manor",
    kind: "護衛",
    need: 44,
    gold: 360,
    xp: 255,
    rank: 30,
  },
  {
    quest: RECEPTION_QUEST,
    title: "灯りのお披露目",
    region: "客を迎える屋敷の庭",
    desc: "作業用通路をたどり、鉢と包みを展示台のそばへ運ぼう。",
    arrival: "搬入を終えました",
    detail: "予定の変わった持ち場を確かめましょう。",
    scenery: "riverside-manor",
    kind: "護衛",
    need: 46,
    gold: 380,
    xp: 270,
    rank: 31,
  },
  {
    quest: STONE_RETURN_QUEST,
    title: "間違った荷物を戻す夜",
    region: "橋へ続く夜の街道",
    desc: "すり替えた要の石を守り、斜面の魔物を追い払いながら橋へ戻ろう。",
    arrival: "橋まで石を守りきりました",
    detail: "四人の無事と、包帯を確かめましょう。",
    scenery: "moss-night-road",
    kind: "討伐",
    need: 48,
    gold: 400,
    xp: 285,
    rank: 34,
  },
  {
    quest: BERNE_RESTORATION_QUEST,
    title: "戻る灯り、増える同行者",
    region: "ベルネの塔の足元",
    desc: "石工と石組みを直そう。フィンは柵と通行の案内を受け持つ。",
    arrival: "石組みの修復を終えました",
    detail: "灯りが戻る街で、四人でお茶にしましょう。",
    scenery: "berne",
    kind: "採取",
    need: 50,
    gold: 420,
    xp: 300,
    rank: 31,
  },
];

export const chapterThreeStages = stageHeadings(3, definitions);
export const chapterThreeQuests = stageQuests(definitions, 2, ({ rank }) => ({
  quietWork: "work",
  workText: ["声を掛け合って作業を進める", "声を掛け合って作業を進める"],
  rank,
}));
export const isChapterThreeQuest = (id: string) =>
  chapterThreeStages.some((stage) => stage.quest === id);

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
