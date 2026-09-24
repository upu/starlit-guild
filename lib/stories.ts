import { chapterThreeStories } from "./chapter-three-stories.ts";
import { chapterThreeBanter } from "./chapter-three-banter.ts";
import { interludeUnlocked } from "./interludes.ts";
import type { State, Squad } from "./game.ts";
import {
  TRADE_QUEST,
  RETURN_QUEST,
  TOWN_QUEST,
  TOWER_QUEST,
  NIGHT_QUEST,
  WETLAND_QUEST,
  isPrologueQuest,
} from "./prologue.ts";
import { prologueStories } from "./prologue-stories.ts";
import { idleBanter } from "./idle-banter.ts";
import { chapterTwoStories } from "./chapter-two-stories.ts";
import { chapterTwoBanter } from "./chapter-two.ts";
import { waterwayBanter } from "./waterway-banter.ts";
import type { PortraitExpression } from "./portrait-expressions.ts";

export type StoryLine = { speaker?: string; text: string; expression?: PortraitExpression };
export type Story = {
  id: string;
  title: string;
  place: string;
  lines: StoryLine[];
  quest?: string;
  chapter: "departure" | "return" | "interlude";
};
export type StoryProgress = { departed: string[]; completed: string[]; read: string[] };
const a = (text: string, expression?: StoryLine["expression"]): StoryLine => ({
  speaker: "aria",
  text,
  ...(expression ? { expression } : {}),
});
const l = (text: string, expression?: StoryLine["expression"]): StoryLine => ({
  speaker: "leon",
  text,
  ...(expression ? { expression } : {}),
});

// Their affection is mutual. Progress shows trust and small choices, never a forced confession.
export const stories: Story[] = [...prologueStories, ...chapterTwoStories, ...chapterThreeStories];

export const characterNotes: Partial<Record<string, { habit: string }>> = {
  finn: {
    habit:
      "都合のいい話は先に、肝心な話はあとから。借りた道具も食堂代も、次の仕事が済んだらと言い続ける。",
  },
  aria: {
    habit:
      "薬草を追って帰り道を見失うことも。勢いで引き受けて失敗しても、強がったあとに自分で謝ってやり直す。",
  },
  leon: {
    habit:
      "「念のため」に予備を増やしすぎる。仲間の足元や疲れにはすぐ気づくのに、自分の望みは言いそびれる。",
  },
  mira: {
    habit:
      "人には休息を勧めるのに、自分の疲れは後回し。お茶の蒸らし時間だけは、どんなに急いでも譲らない。",
  },
};
export const together = (ids: string[]) => ids.includes("aria") && ids.includes("leon");
export const affection = (s: State) =>
  Math.min(3, 1 + Math.floor((s.friendship["aria-leon"] || 0) / 12));
// Older saves have no scene history: cleared quests become readable memories, without replaying pop-ups.
export function storyProgress(s: State): StoryProgress {
  return (
    s.story || {
      departed: Object.keys(s.done).filter(
        (id) => s.done[id] > 0 && stories.some((st) => st.quest === id),
      ),
      completed: Object.keys(s.done).filter(
        (id) => s.done[id] > 0 && stories.some((st) => st.quest === id),
      ),
      read: [],
    }
  );
}
function questStoryAvailable(progress: StoryProgress, story: Story) {
  if (!story.quest) throw Error(`物語「${story.id}」の依頼情報が見つかりません。`);
  return story.chapter === "departure"
    ? progress.departed.includes(story.quest)
    : progress.completed.includes(story.quest);
}
function storyAvailable(progress: StoryProgress, story: Story) {
  return isPrologueQuest(story.quest || "") && questStoryAvailable(progress, story);
}
export function availableStories(s: State): Story[] {
  const p = storyProgress(s);
  return stories.filter((story) =>
    story.chapter === "interlude" ? interludeUnlocked(s, story.id) : storyAvailable(p, story),
  );
}
export function coupleCombo(s: State, variant: number): string[] {
  const lines = [
    [
      ["アリア「いつもの合図でね！」", "レオン「ああ。アリアの動きは分かってる。」"],
      ["レオン「足元、気をつけろよ。」", "アリア「見ててくれるんでしょ？」"],
    ],
    [
      ["アリア「私が前に出たら、お願い。」", "レオン「任せろ。ちゃんと見てる。」"],
      ["レオン「無茶はするなよ。」", "アリア「レオンがいると、ついね。」"],
    ],
    [
      ["アリア「終わったら、一緒に帰ろうね。」", "レオン「そのために、ここにいる。」"],
      ["レオン「合図、いるか？」", "アリア「いらない。もう分かるから。」"],
    ],
  ];
  return lines[affection(s) - 1][variant % 2];
}
function returnBanter(run: NonNullable<Squad["run"]>): StoryLine[] {
  if (run.phase === "rest")
    return [a("荷物、私のほうへ寄せて。少し休もう。"), l("ああ。次の分かれ道までは一緒だ。")];
  return run.node % 3 === 0
    ? [a("帰りの包み、今度は軽いね。"), l("控えは内側にしまった。あとは村で渡せば終わりだ。")]
    : [
        a("また道の真ん中にいる。こんな時間なのに。", "worried"),
        l("荷物は端へ寄せよう。一匹ずつなら通れる。"),
      ];
}
function townBanter(run: NonNullable<Squad["run"]>): StoryLine[] {
  if (run.phase === "rest")
    return [
      l("箱はここに置こう。手、痛くないか？", "worried"),
      a("平気。でも一息ついたら、持つ側を替えよう。"),
    ];
  if (run.node % 3 === 0)
    return [
      a("この荷札、奥の倉庫じゃなくて店先だって。"),
      l("本当だ。先に確かめておいてよかった。", "smile"),
    ];
  return run.node % 3 === 1
    ? [l("次は角の店だ。荷車が通るから、少し待とう。"), a("今日はみんな、同じ時間に運んでるね。")]
    : [
        a("受け取りの控え、もらったよ。次の包みは？"),
        l("これで一区切りだ。荷札と順番を揃えよう。"),
      ];
}
function tradeBanter(run: NonNullable<Squad["run"]>): StoryLine[] {
  if (run.phase === "rest")
    return [l("荷を下ろそう。木陰なら涼しい。"), a("うん。水、レオンの分も出すね。")];
  return run.node % 3 === 1
    ? [
        a("あ、頼まれた薬草。任せて！　あの葉なら、すぐ見分けられるから。", "smile"),
        l("包みはここに置くぞ。採れたら入れてくれ。"),
      ]
    : [l("薬草の包み、荷物の上に置いたか？"), a("うん。潰れないように、紐も掛け直したよ。")];
}
function towerBanter(run: NonNullable<Squad["run"]>): StoryLine[] {
  if (run.phase === "rest")
    return [a("この石なら乾いてる。座ろう、レオン。"), l("助かる。水を飲んでから行こう。")];
  if (run.node < 5)
    return [
      a("畑の向こうまで来ると、街の声が遠いね。"),
      l("あの林の先から登りになる。今のうちに紐を締めておこう。"),
    ];
  if (run.node < 10)
    return [
      a("木陰の薬草、葉がきれい。少し採っていこう。", "smile"),
      l("入れ物を出す。俺は道のほうを見てるよ。"),
    ];
  return [
    l("坂の端はぬかるんでるな。真ん中を通ろう。"),
    a("あの石のところは乾いてるよ。塔も近くに見えてきた。"),
  ];
}
function nightBanter(run: NonNullable<Squad["run"]>): StoryLine[] {
  if (run.phase === "rest")
    return [l("灯りを置くぞ。少し休もう。"), a("うん。入れ物は、こっちの平らなところに。")];
  if (run.node < 5)
    return [
      a("小石の影まで見える。苔だけで、こんなに照らせるんだね。", "surprised"),
      l("入れ物が揺れないように持っていこう。"),
    ];
  if (run.node < 10)
    return [
      l("草が動いた。灯りはここへ置いて、少し離れよう。", "serious"),
      a("うん。通り道を確かめてからね。"),
    ];
  return [
    l("そろそろ分かれ道だな。苔灯、持つの替わろうか？"),
    a("平気。足元係だもん。レオンは前を見てて。", "smile"),
  ];
}
function wetlandBanter(run: NonNullable<Squad["run"]>): StoryLine[] {
  if (run.phase === "rest")
    return [a("布、ここに敷くね。少し座ろう。"), l("ああ。入れ物は平らなところに置いておこう。")];
  if (run.node < 5)
    return [
      a("この先の木陰、薬草を採るときによく通るんだ。"),
      l("じゃあ、踏まないほうがいい場所も教えてくれ。"),
    ];
  if (run.node < 10)
    return [
      l("石の横に水が残ってるな。"),
      a("うん。根の脇も見てみよう。葉の下に隠れてることがあるから。"),
    ];
  return [
    a("あの木の根、ちょっと見せて。草を分けるから。"),
    l("入れ物を出しておく。見つけても、まず生えてるところで比べよう。", "serious"),
  ];
}
function routeBanter(sq: Squad): StoryLine[] | null {
  const run = sq.run;
  if (!run) return null;
  const third = chapterThreeBanter(run);
  if (third) return third;
  const chapterTwo = chapterTwoBanter(run);
  if (chapterTwo) return chapterTwo;
  const waterway = waterwayBanter(run);
  if (waterway) return waterway;
  if (run.quest === WETLAND_QUEST) return wetlandBanter(run);
  if (run.quest === TOWER_QUEST) return towerBanter(run);
  if (run.quest === NIGHT_QUEST) return nightBanter(run);
  if (run.quest === RETURN_QUEST) return returnBanter(run);
  if (run.quest === TOWN_QUEST) return townBanter(run);
  if (run.quest === TRADE_QUEST) return tradeBanter(run);
  return null;
}
function affectionBanter(level: number, variant: number): StoryLine[] {
  if (level === 3)
    return variant
      ? [a("明日も晴れるかな。"), l("雨でも、約束は覚えてる。")]
      : [l("疲れてないか？"), a("もう少し歩きたい。レオンと。", "shy")];
  if (level === 2)
    return variant
      ? [a("帰ったら、隣の席取っておいて。"), l("……いつも空けてる。", "shy")]
      : [l("髪に葉っぱ、ついてるぞ。"), a("取って。……そんなにじっと見ないでよ。", "shy")];
  return variant
    ? [a("こっちが近道！　たぶん！", "smile"), l("その「たぶん」は何回目だ？", "worried")]
    : [l("少し歩くのが速くないか？"), a("レオンなら追いついてくれるでしょ。")];
}
function journeySituationBanter(run: NonNullable<Squad["run"]>, level: number): StoryLine[] | null {
  if (
    run.phase === "rest" ||
    Object.values(run.health).some((health) => health.hp < health.maxHp * 0.3)
  )
    return level >= 2
      ? [a("大丈夫、もう少しなら。", "tired"), l("俺が休みたいんだ。……隣、空けてくれ。", "worried")]
      : [l("少し休もう。水、飲めるか？", "worried"), a("うん。レオンも、ちゃんと飲んでね。")];
  return null;
}
function coupleBanter(s: State, sq: Squad, now: number): StoryLine[] {
  const run = sq.run,
    variant = Math.floor(Math.max(0, now - (run?.started || 0)) / 18000) % 2,
    level = affection(s);
  if (!run) return idleBanter(now, sq.members);
  const situation = journeySituationBanter(run, level);
  if (situation) return situation;
  return affectionBanter(level, variant);
}
export function journeyBanter(s: State, sq: Squad, now: number): StoryLine[] {
  const route = routeBanter(sq);
  if (route) return route;
  if (!together(sq.members)) return [];
  return coupleBanter(s, sq, now);
}
