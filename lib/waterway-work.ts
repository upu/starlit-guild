import type { Encounter } from "./game.ts";
import { WATERWAY_QUEST, RESTORATION_QUEST, MOSS_QUEST } from "./prologue.ts";

type WorkSite = { kind: Encounter; name: string };
// Drainage is completed in 1-8 before the colony is removed in 1-9.
const restorationSites: WorkSite[] = [
  { kind: "escort", name: "作業場所への足場を確かめる" },
  { kind: "battle", name: "草むらのスライムを追い払う" },
  { kind: "escort", name: "作業者へ道具を届ける" },
  { kind: "battle", name: "水路脇のスライムを追い払う" },
  { kind: "escort", name: "切り分け作業の周囲を見張る" },
  { kind: "escort", name: "作業者と水の行き先を確かめる" },
  { kind: "battle", name: "下流のスライムを追い払う" },
  { kind: "gather", name: "手の届く枝と小石を除く" },
  { kind: "escort", name: "排水の合図を待って足場を見守る" },
  { kind: "escort", name: "流れ出した水の通りを確かめる" },
  { kind: "gather", name: "流れに残った枝を拾い上げる" },
  { kind: "escort", name: "作業者へ補修用の石を渡す" },
  { kind: "escort", name: "直した水路の継ぎ目を確かめる" },
  { kind: "escort", name: "出口の脇へ溢れていないか見直す" },
  { kind: "escort", name: "下流まで水が通ることを確かめる" },
];
const mossSites: WorkSite[] = [
  { kind: "escort", name: "水の引いた足場を確かめる" },
  { kind: "battle", name: "点検口脇のスライムを追い払う" },
  { kind: "escort", name: "管理人と点検口を開ける" },
  { kind: "gather", name: "手前の石を覆う苔を薄く剥がす" },
  { kind: "gather", name: "剥がした苔を籠へ受け止める" },
  { kind: "escort", name: "籠を作業者へ渡して運び出す" },
  { kind: "battle", name: "石陰のスライムを追い払う" },
  { kind: "gather", name: "点検口から奥の苔を取り除く" },
  { kind: "gather", name: "重なった苔を端から分ける" },
  { kind: "escort", name: "管理人に次の点検口を開けてもらう" },
  { kind: "gather", name: "最後の石の継ぎ目の苔を剥がす" },
  { kind: "gather", name: "残った小さな葉を籠へ集める" },
  { kind: "escort", name: "管理人と石の通り道を見直す" },
  { kind: "escort", name: "取り除いた苔を塔から離して運ぶ" },
  { kind: "escort", name: "水の流れを確かめて点検口を閉じる" },
];
export function waterwayWork(id: string, node: number): WorkSite | undefined {
  if (id === RESTORATION_QUEST) return restorationSites[node];
  if (id === MOSS_QUEST) return mossSites[node];
  if (id !== WATERWAY_QUEST) return undefined;
  if (node % 3 === 1) return { kind: "battle", name: "斜面のスライムを追い払う" };
  const names = [
    "管理図と斜面の道筋を照らし合わせる",
    "苔の多い湿った場所を追う",
    "草に隠れた水路の出口を探す",
  ];
  return { kind: "gather", name: names[Math.min(2, Math.floor(node / 5))] };
}
