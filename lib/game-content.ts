import { chapterThreeQuests } from "./chapter-three.ts";
import { chapterFourQuests } from "./chapter-four.ts";
import { interludeQuests, isInterlude, interludeUnlocked } from "./interludes.ts";
import {
  TRADE_QUEST,
  RETURN_QUEST,
  TOWN_QUEST,
  TOWER_QUEST,
  NIGHT_QUEST,
  WETLAND_QUEST,
  WATERWAY_QUEST,
  RESTORATION_QUEST,
  MOSS_QUEST,
  isPrologueQuest,
  stageUnlocked,
} from "./prologue.ts";
import { chapterTwoQuests } from "./chapter-two.ts";
import { heroes as baseHeroes, type Kind } from "./roster.ts";
import type { Encounter, State } from "./game-types.ts";

export const heroes = baseHeroes.map((h, i) => ({ ...h, sprite: i }));
// How one quest varies the shared adventure rules. Anything left out keeps the default.
export type QuestStyle = {
  // Stretch kinds and names repeat in this order, unless a chapter lists each stretch itself.
  stretches?: Encounter[];
  stretchNames?: string[];
  // Companions' actions read as careful work instead of attacks: always, or off battles.
  quietWork?: "always" | "work";
  // Action text as [normal, special]: on gather/escort, on gather only, or on every stretch.
  workText?: [string, string];
  gatherText?: [string, string];
  actionText?: [string, string];
  // Battles spent shielding the work read as that work.
  guardText?: string;
  // What the opponent's ordinary attack does.
  enemyText?: string;
  // Combat difficulty, and the work difficulty where it differs.
  rank?: number;
  workResistance?: number;
  // Reaching a stretch is a plain next step rather than a discovery.
  quietArrival?: boolean;
  // Escort stretches carry cargo even when their names don't say so.
  cargo?: boolean;
};
export type Quest = {
  id: string;
  name: string;
  kind: Kind;
  region: string;
  desc: string;
  tier: number;
  need: number;
  seconds: number;
  gold: number;
  xp: number;
  herbs: number;
  ore: number;
  enemy: number;
  enemyName?: string;
  background?: string;
  gatherTarget?: string;
  escortTarget?: string;
  escortAsset?: string;
  availability?: "repeatable" | "once";
  style?: QuestStyle;
};
export const quests: Quest[] = [
  {
    id: TRADE_QUEST,
    name: "街への交易",
    kind: "護衛",
    region: "街へ続く交易路",
    desc: "それぞれの村から預かった品を、街の取引先へ。道中で頼まれた薬草も採りながら、アリアとレオンで荷物を届けよう。",
    tier: 1,
    need: 12,
    seconds: 180,
    gold: 120,
    xp: 60,
    herbs: 10,
    ore: 0,
    enemy: 8,
    background: "/scenery/forest-background.webp",
    gatherTarget: "取引先に頼まれた薬草",
    escortTarget: "村から預かった荷物",
    style: { stretches: ["escort", "gather", "battle"], cargo: true },
    availability: "repeatable",
  },
  {
    id: RETURN_QUEST,
    name: "夕暮れの帰り道",
    kind: "護衛",
    region: "村へ戻る交易路",
    desc: "買い物を終えたら、村への分かれ道まで一緒に。帰りの品を運びながら、夕方の街道を進もう。",
    tier: 1,
    need: 13,
    seconds: 180,
    gold: 100,
    xp: 65,
    herbs: 1,
    ore: 0,
    enemy: 8,
    enemyName: "道に出てきたスライム",
    background: "/scenery/evening-trade-road-background.webp",
    escortTarget: "村へ持ち帰る品",
    style: { stretches: ["escort", "battle", "battle"] },
    availability: "repeatable",
  },
  {
    id: TOWN_QUEST,
    name: "街の配達仕事",
    kind: "護衛",
    region: "街の倉庫と商店",
    desc: "後日の交易を終えると、取引先から小さな配達を頼まれた。荷札と受け取りの控えを確かめ、倉庫から商店へ品を届けよう。",
    tier: 1,
    need: 12,
    seconds: 180,
    gold: 130,
    xp: 65,
    herbs: 1,
    ore: 0,
    enemy: 8,
    background: "/scenery/town-deliveries-background.webp",
    escortTarget: "商店へ届ける荷物",
    style: {
      stretches: ["escort"],
      stretchNames: ["倉庫で荷札を確かめる", "商店へ荷物を運ぶ", "品を渡して控えを受け取る"],
      quietWork: "always",
      actionText: ["荷札の確認・配達", "息を合わせて荷運び"],
      quietArrival: true,
    },
    availability: "repeatable",
  },
  {
    id: TOWER_QUEST,
    name: "丘の塔まで足を伸ばす",
    kind: "採取",
    region: "畑と林を抜ける丘の道",
    desc: "街での仕事を済ませたら、気になっていた塔へ。道端の薬草を採りながら、小さな林と湿った坂道をふたりで進もう。",
    tier: 1,
    need: 14,
    seconds: 180,
    gold: 100,
    xp: 70,
    herbs: 10,
    ore: 0,
    enemy: 8,
    enemyName: "林から出てきたスライム",
    background: "/scenery/tower-road-background.webp",
    gatherTarget: "道端の薬草",
    style: { quietWork: "work", workText: ["道端の薬草を採る", "葉を見分けて丁寧に採る"] },
    availability: "repeatable",
  },
  {
    id: NIGHT_QUEST,
    name: "苔灯と帰る夜道",
    kind: "護衛",
    region: "村々へ続く夜の交易路",
    desc: "塔で分けてもらった苔を小さな灯りにして、村々への分かれ道へ。普段のランタンも携え、足元を確かめながら帰ろう。",
    tier: 1,
    need: 14,
    seconds: 180,
    gold: 100,
    xp: 70,
    herbs: 1,
    ore: 0,
    enemy: 8,
    enemyName: "夜道に出てきたスライム",
    background: "/scenery/moss-night-road-background.webp",
    escortTarget: "苔灯で足元を照らす",
    escortAsset: "/items/moss-lamp.png",
    style: {
      stretches: ["escort", "battle", "escort"],
      quietWork: "work",
      workText: ["苔灯で足元を照らす", "灯りを寄せて道を確かめる"],
    },
    availability: "repeatable",
  },
  {
    id: WETLAND_QUEST,
    name: "森の苔を探して",
    kind: "採取",
    region: "木陰に水の残る森の湿地",
    desc: "約束した午後、持ち帰った苔を携えて森へ。アリアが見覚えのある湿った木陰を探し、少しだけ分けてもらって見比べよう。",
    tier: 1,
    need: 14,
    seconds: 180,
    gold: 100,
    xp: 75,
    herbs: 1,
    ore: 0,
    enemy: 8,
    background: "/scenery/forest-wetland-background.webp",
    gatherTarget: "湿地の草葉と苔",
    style: {
      stretches: ["gather"],
      stretchNames: ["湿った木陰を探す", "苔の葉を見分ける", "群落の周りを確かめる"],
      quietWork: "always",
      workText: ["草葉を分けて苔を探す", "葉の形と湿り気を丁寧に確かめる"],
    },
    availability: "repeatable",
  },
  {
    id: WATERWAY_QUEST,
    name: "古い水路をたどって",
    kind: "採取",
    region: "塔の裏手の湿った斜面",
    desc: "森での記録を管理人へ持っていこう。塔のそばで苔を見比べ、古い管理図と湿った地面を手がかりに、水路の出口を探そう。",
    tier: 1,
    need: 15,
    seconds: 180,
    gold: 100,
    xp: 80,
    herbs: 1,
    ore: 0,
    enemy: 8,
    enemyName: "斜面のスライム",
    background: "/scenery/old-waterway-background.webp",
    gatherTarget: "水路の道筋",
    style: {
      quietWork: "work",
      workText: ["草を分けて水路の道筋を確かめる", "地図と苔の続く先を照らし合わせる"],
    },
    availability: "repeatable",
  },
  {
    id: RESTORATION_QUEST,
    name: "水の通り道を戻す仕事",
    kind: "護衛",
    region: "塔の古い排水路",
    desc: "街の作業者と水路の修理へ。周囲の魔物を追い払い、道具を運び、水が下流へ流れることを確かめよう。",
    tier: 1,
    need: 15,
    seconds: 180,
    gold: 150,
    xp: 85,
    herbs: 1,
    ore: 0,
    enemy: 8,
    enemyName: "水路脇のスライム",
    background: "/scenery/old-waterway-background.webp",
    gatherTarget: "水路に残った枝と小石",
    escortTarget: "水路の修理を手伝う",
    style: {
      quietWork: "work",
      workText: ["声を掛け合って作業を進める", "声を掛け合って作業を進める"],
      gatherText: ["手の届く範囲を丁寧に取り除く", "手の届く範囲を丁寧に取り除く"],
    },
    availability: "repeatable",
  },
  {
    id: MOSS_QUEST,
    name: "もう一度、あの灯りを",
    kind: "採取",
    region: "水の引いた塔の足元",
    desc: "水路は直った。次は石組みの奥に増えすぎた苔を取り除こう。管理人と点検口を開け、ふたりで剥がした苔を籠へ集めて、塔から離れた場所へ運び出そう。",
    tier: 1,
    need: 15,
    seconds: 180,
    gold: 150,
    xp: 90,
    herbs: 1,
    ore: 0,
    enemy: 8,
    enemyName: "石陰のスライム",
    background: "/scenery/tower-drainage-open-background.webp",
    gatherTarget: "石組みを覆う苔",
    escortTarget: "苔の撤去を手伝う",
    style: {
      quietWork: "work",
      workText: ["声を掛け合って作業を進める", "声を掛け合って作業を進める"],
      gatherText: ["手の届く範囲を丁寧に取り除く", "手の届く範囲を丁寧に取り除く"],
    },
    availability: "repeatable",
  },
  ...chapterTwoQuests,
  ...interludeQuests,
  ...chapterThreeQuests,
  ...chapterFourQuests,
] satisfies Quest[];
export const allQuests: Quest[] = quests;
export const availableQuests = (s: State) =>
  quests.filter((q) =>
    isInterlude(q.id)
      ? interludeUnlocked(s, q.id) && !s.story?.read.includes(q.id)
      : isPrologueQuest(q.id) &&
        stageUnlocked(s, q.id) &&
        (q.availability !== "once" || !s.done[q.id]),
  );
