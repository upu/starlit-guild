import type { QuestStyle } from "./game.ts";
import { stageHeadings, stageQuests, type StageDefinition } from "./chapter-stages.ts";
import { shortRoute, STANDARD_QUEST_NODES } from "./puppet-battles.ts";

export const WALNUT_INTERLUDE = "interlude-promised-walnuts";
export const LINDE_REQUESTS_QUEST = "linde-requests";
export const LANTERN_DETOUR_QUEST = "lantern-detour";
export const BREKKA_ARRIVAL_QUEST = "brekka-arrival";
export const MOSS_TRAIL_QUEST = "glowing-moss-trail";
export const MOSS_TRAIL_SECOND_DAY_QUEST = "glowing-moss-trail-next-day";
export const MOSS_BEDS_QUEST = "brekka-moss-beds";
export const LICO_RECORDS_QUEST = "lico-records";
export const MERRILL_SEEDLINGS_QUEST = "merrill-seedlings";
export const MOSS_TRANSPLANT_QUEST = "moss-transplant";
export const GUILD_FOUNDING_QUEST = "starlit-guild-founding";
// Lico's trap closes the last stretch of her records quest. Merrill's fight sat at this stretch
// before it became a single fight, and runs saved on that old route still meet her there.
export const LICO_TRAP_NODE = STANDARD_QUEST_NODES - 1;
export const MERRILL_LEGACY_NODE = 8;

const definitions: readonly StageDefinition[] = [
  {
    quest: LINDE_REQUESTS_QUEST,
    title: "塔を直した人たちへ",
    region: "リンデの食堂と町",
    desc: "宛先の違う依頼を配り、約束と日取りを確かめよう。",
    arrival: "頼みごとを仕分けました",
    detail: "二つの依頼の行き先を確かめましょう。",
    scenery: "town-deliveries",
    kind: "護衛",
    need: 52,
    gold: 420,
    xp: 220,
    rank: 32,
  },
  {
    quest: LANTERN_DETOUR_QUEST,
    title: "見当違いの灯り",
    region: "ブレッカへ向かう村道",
    desc: "村はずれの暗い灯りを確かめ、荷運び人を案内しよう。",
    arrival: "村の灯りを確かめました",
    detail: "灯籠の手入れと返事の宛名を相談しましょう。",
    scenery: "evening-trade-road",
    kind: "護衛",
    need: 54,
    gold: 445,
    xp: 240,
    rank: 33,
  },
  {
    quest: BREKKA_ARRIVAL_QUEST,
    title: "醸造の町ブレッカ",
    region: "ブレッカの町と往診先",
    desc: "ミラの往診を手伝い、フィンと醸造所の仕入れを調べよう。",
    arrival: "往診と仕入れ調査を終えました",
    detail: "体調とエールに共通することを確かめましょう。",
    scenery: "berne",
    kind: "護衛",
    need: 56,
    gold: 470,
    xp: 260,
    rank: 34,
  },
  {
    quest: MOSS_TRAIL_QUEST,
    title: "毎朝光る苔",
    region: "ブレッカの裏通り",
    desc: "ミラとフィンを宿に残し、アリアとレオンで荷車の道筋を追おう。",
    arrival: "途中までの道順を記録しました",
    detail: "持ち帰った手帳と苔の欠片を確かめましょう。",
    scenery: "town-deliveries",
    kind: "護衛",
    need: 58,
    gold: 250,
    xp: 140,
    rank: 35,
  },
  {
    quest: MOSS_TRAIL_SECOND_DAY_QUEST,
    title: "毎朝光る苔・二日目",
    region: "ブレッカの裏通り",
    desc: "昨日の道順を頼りに、四人で荷車の行き先を確かめよう。",
    arrival: "苔を運ぶ道が分かりました",
    detail: "塔へ続く裏道を確かめましょう。",
    scenery: "town-deliveries",
    kind: "護衛",
    need: 58,
    gold: 250,
    xp: 140,
    rank: 35,
  },
  {
    quest: MOSS_BEDS_QUEST,
    title: "塔のそばの苔床",
    region: "ブレッカの塔の裏手",
    desc: "等間隔の苔床と掘り直された水路を調べよう。",
    arrival: "苔床の持ち主に会いました",
    detail: "苔床の持ち主に話を聞いてみましょう。",
    scenery: "tower-drainage-open",
    kind: "採取",
    need: 60,
    gold: 520,
    xp: 300,
    rank: 35,
  },
  {
    quest: LICO_RECORDS_QUEST,
    title: "消える前に",
    region: "塔の管理小屋と苔床",
    desc: "管理人と商人の記録を揃え、リコの光と煙の仕掛けを止めよう。",
    arrival: "仕掛けを止めました",
    detail: "リコの記録も重ねて、灯りが落ちた日を確かめましょう。",
    scenery: "tower-drainage-open",
    kind: "護衛",
    need: 62,
    gold: 545,
    xp: 320,
    rank: 36,
    enemy: 10,
    enemyName: "リコの光と煙の仕掛け",
  },
  {
    quest: MERRILL_SEEDLINGS_QUEST,
    title: "苔は渡さない",
    region: "塔の裏手の積み出し口",
    desc: "移し替える苗を揃え、塔のそばから運び出す準備をしよう。",
    arrival: "苗を守りました",
    detail: "一株分の感想と引き換えに、運ぶ苗を確かめましょう。",
    scenery: "forest-wetland",
    kind: "護衛",
    need: 64,
    gold: 570,
    xp: 340,
    rank: 37,
    enemy: 10,
    enemyName: "苗を狙うメリル",
  },
  {
    quest: MOSS_TRANSPLANT_QUEST,
    title: "光が抜ける前に",
    region: "塔から離れた新しい苔床",
    desc: "苗を運び、古い苔床と水路を片づけよう。",
    arrival: "苗の移植を終えました",
    detail: "新しい苔床と塔の灯りを確かめましょう。",
    scenery: "old-waterway",
    kind: "護衛",
    need: 66,
    gold: 595,
    xp: 360,
    rank: 38,
  },
  {
    quest: GUILD_FOUNDING_QUEST,
    title: "同じ宛先へ",
    region: "ブレッカからリンデへの帰り道",
    desc: "五人で帰り、届いていた頼みごとの返事を片づけよう。",
    arrival: "リンデへ帰りました",
    detail: "旅団の名前と代表者を決めましょう。",
    scenery: "evening-trade-road",
    kind: "護衛",
    need: 68,
    gold: 620,
    xp: 380,
    rank: 39,
  },
];

export const chapterFourStages = stageHeadings(4, definitions);
// In these two confrontations the party shields the work rather than fighting back.
const guarded: Partial<Record<string, Pick<QuestStyle, "guardText" | "enemyText">>> = {
  [LICO_RECORDS_QUEST]: {
    guardText: "板と栓を押さえる",
    enemyText: "仕掛けの光と煙に足止めされた",
  },
  [MERRILL_SEEDLINGS_QUEST]: {
    guardText: "苗の籠を守る",
    enemyText: "メリルの演奏に籠の運び手が立ち止まった",
  },
};
export const chapterFourQuests = stageQuests(definitions, 3, ({ quest, rank }) => ({
  rank,
  ...guarded[quest],
}));

export const isChapterFourQuest = (id: string) =>
  chapterFourStages.some((stage) => stage.quest === id);

type Work = { kind: "battle" | "escort" | "gather"; name: string };
const jobs = (kind: Work["kind"], ...names: string[]): Work[] =>
  names.map((name) => ({ kind, name }));
const patterns: Partial<Record<string, Work[]>> = {
  [LINDE_REQUESTS_QUEST]: jobs("escort", "依頼の手紙を渡す", "日取りを確かめる", "返事を受け取る"),
  [LANTERN_DETOUR_QUEST]: jobs("escort", "村はずれへ案内する", "灯籠を調べる", "道の草を刈る"),
  [BREKKA_ARRIVAL_QUEST]: [
    ...jobs("escort", "往診の荷を運ぶ"),
    ...jobs("battle", "町外れの魔物を追い払う"),
    ...jobs("gather", "仕入れの控えを調べる"),
  ],
  [MOSS_TRAIL_QUEST]: jobs(
    "escort",
    "荷車を追う",
    "荷車の曲がり角を記録する",
    "車輪についた苔を確かめる",
  ),
  [MOSS_TRAIL_SECOND_DAY_QUEST]: jobs(
    "escort",
    "昨日の道順をたどる",
    "二日目の裏道を追う",
    "塔へ続く道を確かめる",
  ),
  [MOSS_BEDS_QUEST]: jobs("gather", "苔床の列を数える", "水路と札を調べる", "塔からの距離を測る"),
  [MOSS_TRANSPLANT_QUEST]: [
    ...jobs("escort", "苗を湿ったまま運ぶ"),
    ...jobs("battle", "塔の周りの魔物を追い払う"),
    ...jobs("gather", "水路を埋め戻す"),
  ],
  [GUILD_FOUNDING_QUEST]: jobs(
    "escort",
    "返事の手紙を渡す",
    "借り物を返す",
    "リンデの倉庫へ向かう",
  ),
};
export const isMossTrailQuest = (id: string) =>
  [MOSS_TRAIL_QUEST, MOSS_TRAIL_SECOND_DAY_QUEST].includes(id);

// Lico's and Merrill's quests place their confrontations by stretch, so they bypass the patterns.
export function chapterFourWork(id: string, node: number, nodes?: number): Work | undefined {
  if (id === LICO_RECORDS_QUEST)
    return node === LICO_TRAP_NODE
      ? { kind: "battle", name: "リコの光と煙の仕掛けを止める" }
      : node % 3 === 1
        ? { kind: "escort", name: "管理人の記録を渡す" }
        : { kind: "gather", name: "注文控えと灯りの記録を照合する" };
  if (id === MERRILL_SEEDLINGS_QUEST)
    return shortRoute(nodes) || node === MERRILL_LEGACY_NODE
      ? { kind: "battle", name: "メリルから苗の籠を守る" }
      : { kind: "escort", name: "苗の籠を運び出す" };
  return patterns[id]?.[isMossTrailQuest(id) ? Math.min(2, Math.floor(node / 5)) : node % 3];
}
export const chapterFourWorkload = (id: string) =>
  isChapterFourQuest(id) && !isMossTrailQuest(id) ? 2 : 1;
