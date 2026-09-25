import type { Quest } from "./game.ts";

export const WALNUT_INTERLUDE = "interlude-promised-walnuts";
export const LINDE_REQUESTS_QUEST = "linde-requests";
export const LANTERN_DETOUR_QUEST = "lantern-detour";
export const BREKKA_ARRIVAL_QUEST = "brekka-arrival";
export const MOSS_TRAIL_QUEST = "glowing-moss-trail";
export const MOSS_BEDS_QUEST = "brekka-moss-beds";
export const LICO_RECORDS_QUEST = "lico-records";
export const MERRILL_SEEDLINGS_QUEST = "merrill-seedlings";
export const MOSS_TRANSPLANT_QUEST = "moss-transplant";
export const GUILD_FOUNDING_QUEST = "starlit-guild-founding";

const definitions = [
  [
    LINDE_REQUESTS_QUEST,
    "塔を直した人たちへ",
    "リンデの食堂と町",
    "宛先の違う依頼を配り、約束と日取りを確かめよう。",
    "頼みごとを仕分けました",
    "二つの依頼の行き先を確かめましょう。",
    "town-deliveries",
    "護衛",
  ],
  [
    LANTERN_DETOUR_QUEST,
    "見当違いの灯り",
    "ブレッカへ向かう村道",
    "村はずれの暗い灯りを確かめ、荷運び人を案内しよう。",
    "村の灯りを確かめました",
    "灯籠の手入れと返事の宛名を相談しましょう。",
    "evening-trade-road",
    "護衛",
  ],
  [
    BREKKA_ARRIVAL_QUEST,
    "醸造の町ブレッカ",
    "ブレッカの町と往診先",
    "ミラの往診を手伝い、フィンと醸造所の仕入れを調べよう。",
    "往診と仕入れ調査を終えました",
    "体調とエールに共通することを確かめましょう。",
    "berne",
    "護衛",
  ],
  [
    MOSS_TRAIL_QUEST,
    "毎朝光る苔",
    "ブレッカの裏通り",
    "無理をしたミラを休ませ、二日がかりで荷車の道筋を追おう。",
    "苔を運ぶ道が分かりました",
    "塔へ続く裏道を確かめましょう。",
    "town-deliveries",
    "護衛",
  ],
  [
    MOSS_BEDS_QUEST,
    "塔のそばの苔床",
    "ブレッカの塔の裏手",
    "等間隔の苔床と掘り直された水路を調べよう。",
    "苔床の持ち主に会いました",
    "リコの記録とミラの体調を確かめましょう。",
    "tower-drainage-open",
    "採取",
  ],
  [
    LICO_RECORDS_QUEST,
    "消える前に",
    "塔の管理小屋と苔床",
    "管理人と商人の記録を揃え、リコの光と煙の仕掛けを止めよう。",
    "仕掛けを止めました",
    "リコの記録も重ねて、灯りが落ちた日を確かめましょう。",
    "tower-drainage-open",
    "護衛",
  ],
  [
    MERRILL_SEEDLINGS_QUEST,
    "苔は渡さない",
    "塔の裏手の積み出し口",
    "リコと一緒に苗を守り、メリルが籠へ届かないよう運ぼう。",
    "苗を守りました",
    "一株分の感想と引き換えに、運ぶ苗を確かめましょう。",
    "forest-wetland",
    "護衛",
  ],
  [
    MOSS_TRANSPLANT_QUEST,
    "光が抜ける前に",
    "塔から離れた新しい苔床",
    "苗を運び、古い苔床と水路を片づけよう。",
    "苗の移植を終えました",
    "新しい苔床と塔の灯りを確かめましょう。",
    "old-waterway",
    "護衛",
  ],
  [
    GUILD_FOUNDING_QUEST,
    "同じ宛先へ",
    "ブレッカからリンデへの帰り道",
    "五人で帰り、届いていた頼みごとの返事を片づけよう。",
    "リンデへ帰りました",
    "旅団の名前と代表者を決めましょう。",
    "evening-trade-road",
    "護衛",
  ],
] as const;

export const chapterFourStages = definitions.map(([quest, title, , , arrival, detail], index) => ({
  quest,
  number: `4-${String(index + 1)}`,
  title,
  arrival,
  detail,
}));

export const chapterFourQuests: Quest[] = definitions.map(
  ([id, name, region, desc, , , scenery, kind], index) => ({
    id,
    name,
    region,
    desc,
    kind,
    tier: 3,
    need: 52 + index * 2,
    seconds: 180,
    gold: 420 + index * 25,
    xp: 220 + index * 20,
    herbs: 0,
    ore: 0,
    enemy: index === 5 || index === 6 ? 10 : 8,
    enemyName:
      index === 5 ? "リコの光と煙の仕掛け" : index === 6 ? "苗を狙うメリル" : "街道のスライム",
    background: `/scenery/${scenery}-background.webp`,
    availability: "repeatable",
  }),
);

export const isChapterFourQuest = (id: string) =>
  chapterFourStages.some((stage) => stage.quest === id);
export const chapterFourRank = (id: string) =>
  [32, 33, 34, 35, 35, 36, 37, 38, 39][chapterFourStages.findIndex((stage) => stage.quest === id)];

type Work = { kind: "battle" | "escort" | "gather"; name: string };
const jobs = (kind: Work["kind"], ...names: string[]): Work[] =>
  names.map((name) => ({ kind, name }));
const patterns: Partial<Record<string, Work[]>> = {
  [LINDE_REQUESTS_QUEST]: jobs(
    "escort",
    "依頼の手紙を届ける",
    "日取りを確かめる",
    "返事を持ち帰る",
  ),
  [LANTERN_DETOUR_QUEST]: jobs("escort", "村はずれへ案内する", "灯籠を調べる", "道の草を刈る"),
  [BREKKA_ARRIVAL_QUEST]: [
    ...jobs("escort", "往診の荷を運ぶ"),
    ...jobs("battle", "町外れの魔物を追い払う"),
    ...jobs("gather", "仕入れの控えを調べる"),
  ],
  [MOSS_TRAIL_QUEST]: jobs(
    "escort",
    "一日目の荷車を追う",
    "青い布を目印に戻る",
    "二日目の裏道を追う",
  ),
  [MOSS_BEDS_QUEST]: jobs("gather", "苔床の列を数える", "水路と札を調べる", "塔からの距離を測る"),
  [LICO_RECORDS_QUEST]: [
    ...jobs("gather", "管理人の灯りの記録を写す", "商人の注文控えを照合する"),
    ...jobs("battle", "光と煙の仕掛けを止める"),
  ],
  [MERRILL_SEEDLINGS_QUEST]: [
    ...jobs("escort", "苗の籠を運ぶ"),
    ...jobs("battle", "メリルから籠を守る"),
    ...jobs("escort", "最後の苗を運び出す"),
  ],
  [MOSS_TRANSPLANT_QUEST]: [
    ...jobs("escort", "苗を湿ったまま運ぶ"),
    ...jobs("battle", "塔の周りの魔物を追い払う"),
    ...jobs("gather", "水路を埋め戻す"),
  ],
  [GUILD_FOUNDING_QUEST]: jobs(
    "escort",
    "返事の手紙を運ぶ",
    "借り物を返す",
    "リンデの倉庫へ向かう",
  ),
};
export function chapterFourWork(id: string, node: number): Work | undefined {
  if (id === LICO_RECORDS_QUEST)
    return node === 14
      ? { kind: "battle", name: "リコの光と煙の仕掛けを止める" }
      : node % 3 === 1
        ? { kind: "escort", name: "管理人の記録を運ぶ" }
        : { kind: "gather", name: "注文控えと灯りの記録を照合する" };
  if (id === MERRILL_SEEDLINGS_QUEST)
    return node === 8
      ? { kind: "battle", name: "メリルから苗の籠を守る" }
      : { kind: "escort", name: "苗の籠を運び出す" };
  return patterns[id]?.[node % 3];
}
export const chapterFourWorkload = (id: string) => (isChapterFourQuest(id) ? 2 : 1);
