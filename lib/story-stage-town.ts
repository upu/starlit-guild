import { TOWN_QUEST } from "./prologue.ts";
import { stagePair, type StageActor, type StoryStageCue } from "./story-stage-cues.ts";

export const townDepartureId = `${TOWN_QUEST}-departure`;
export const townReturnId = `${TOWN_QUEST}-return`;
function town(
  description: string,
  aria: Partial<StageActor> = {},
  leon: Partial<StageActor> = {},
  box?: StoryStageCue["box"],
): StoryStageCue {
  return {
    description,
    actors: stagePair(34, 60, aria, leon),
    initial: { aria: 34, leon: 60 },
    background: "town-shop",
    hideCart: true,
    luggage: false,
    bundleMode: "hidden",
    box,
  };
}
const departure = [
  town(
    "後日の取引先で、二人が台に置かれた配達用の箱を見る。",
    { pose: "think" },
    { pose: "think" },
    "table",
  ),
  town("店の人の配達の頼みに、二人が耳を傾ける。", {}, { pose: "think" }, "table"),
  town("アリアが得意げに、一度で運べると請け合う。", { pose: "tease" }, {}, "table"),
  town(
    "アリアが小箱を抱え、台の下の残りの荷へ目を向ける。",
    { carry: true },
    { pose: "think" },
    "aria",
  ),
  town(
    "店の人の説明を聞き、アリアが箱を抱えたまま考え込む。",
    { carry: true },
    { pose: "think" },
    "aria",
  ),
  town(
    "残りの箱に気づいたアリアが驚き、抱えた箱を持ち上げる。",
    { carry: true, reaction: "surprise" },
    {},
    "high",
  ),
  town(
    "レオンがアリアの足元を示して、積みすぎを気遣う。",
    { carry: true },
    { pose: "offer" },
    "high",
  ),
  town(
    "アリアが箱を台へ戻し、自分の足元を確かめる。",
    { pose: "think" },
    { pose: "think" },
    "table",
  ),
  town("アリアが落ち着いて謝り、二回に分ける相談をする。", { pose: "think" }, {}, "table"),
  town("二人が店の人から荷札の順番を聞く。", { pose: "think" }, { pose: "think" }, "table"),
  town(
    "アリアがしゃがんで荷札を確かめ、レオンが順番を見る。",
    { inspect: true },
    { pose: "think" },
    "table",
  ),
  town("アリアが立ち上がり、先に届ける二軒を示す。", { pose: "offer" }, {}, "table"),
  town("レオンが受け取りの控えを分けると頷く。", {}, { pose: "offer", reaction: "nod" }, "table"),
  town(
    "アリアが箱の片側に手を添え、レオンへ声をかける。",
    { carry: true },
    { pose: "offer" },
    "shared",
  ),
  town(
    "レオンも持ち手を握り、二人で箱を水平に持ち上げる。",
    { carry: true },
    { carry: true },
    "shared",
  ),
];
const returning = [
  town(
    "配達を終え、アリアが手を離す横でレオンが控えを揃える。",
    { pose: "offer" },
    { pose: "think" },
  ),
  town("アリアが空になった台の下を確かめる。", { pose: "think" }),
  town("仕事が終わり、アリアが息をついて手を休める。", { pose: "tease" }),
  town("レオンが二回に分けてよかったと笑う。", {}, { pose: "tease" }),
  town("アリアがレオンに向き直り、助けてもらった礼を言う。", { pose: "offer" }, { pose: "tease" }),
  town("アリアが荷車の行き交う通りを振り返る。", { left: true, pose: "think" }, { pose: "think" }),
  town("アリアが通りの混み具合を思い出して話す。", { pose: "think" }),
  town("レオンが荷物の置き場が変わった理由を尋ねる。", {}, { pose: "offer" }),
  town("二人が街道の荷車が急ぐ理由に耳を傾ける。", { pose: "think" }, { pose: "think" }),
  town("アリアが以前の夕方の配達を思い返す。", { pose: "think" }),
  town("店の人から塔の灯りの変化を聞き、二人が考え込む。", { pose: "think" }, { pose: "think" }),
  town(
    "アリアがレオンを見て、レオンも顔を上げる。",
    { pose: "think" },
    { pose: "think", reaction: "nod" },
  ),
  town("アリアが前の帰り道を思い出し、心配そうに話す。", { pose: "think" }),
  town("レオンが自分たちと荷車の通る道を照らし合わせる。", {}, { pose: "offer" }),
  town("二人が塔の点検の話を聞く。", { pose: "think" }, { pose: "think" }),
  town(
    "二人が屋根越しの丘の塔へ顔を向ける。",
    { left: false, pose: "think" },
    { left: false, pose: "think" },
  ),
  town(
    "アリアが淡い塔の光を見上げて話す。",
    { left: false, pose: "think" },
    { left: false, pose: "think" },
  ),
  town(
    "レオンも塔を見上げ、いつもの景色を振り返る。",
    { pose: "think" },
    { left: false, pose: "think" },
  ),
  town("仕事を終えた二人が店の人へ挨拶する。", { wave: true }, { wave: true }),
  town(
    "アリアが店を離れかけ、レオンが隣へ歩み寄る。",
    { x: 45, pose: "think" },
    { x: 65, pose: "think" },
  ),
  town("アリアがレオンを見て、次は塔を見に行こうと誘う。", { x: 45, pose: "offer" }, { x: 65 }),
  town(
    "レオンが帰る時間を残して出かけようと頷く。",
    { x: 45 },
    { x: 65, pose: "offer", reaction: "nod" },
  ),
  town("アリアが次の待ち合わせを楽しみに笑う。", { x: 45, pose: "tease" }, { x: 65 }),
  town("レオンも笑顔で約束する。", { x: 45, pose: "tease" }, { x: 65, pose: "tease" }),
  town(
    "次の約束を交わし、二人は帰り道へ向き直る。",
    { x: 45, left: false },
    { x: 65, left: false },
  ),
].map((cue): StoryStageCue => ({ ...cue, background: "town-shop-return" }));

export function townStageCue(id: string, line: number): StoryStageCue | null {
  return (id === townDepartureId ? departure : id === townReturnId ? returning : [])[line] ?? null;
}
const departureExit = town(
  "二人で箱を支え、歩幅を合わせて配達へ向かう。",
  { x: 110, carry: true },
  { x: 136, carry: true },
  "shared",
);
const returnExit: StoryStageCue = {
  ...town(
    "アリアとレオンが、次に会う約束をして帰り道へ歩き出す。",
    { x: 110, left: false },
    { x: 130, left: false },
  ),
  background: "town-shop-return",
};
export function townExitCue(id: string): StoryStageCue | null {
  return id === townDepartureId ? departureExit : id === townReturnId ? returnExit : null;
}
