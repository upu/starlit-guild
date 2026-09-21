import { pendingInterlude } from "./interludes.ts";
import { BERNE_QUEST } from "./chapter-three.ts";
import { nextStage, stageEndingPending, storyStages } from "./prologue.ts";
import { allQuests, heroes, power, encounter, type State, type Squad, type Quest } from "./game.ts";
import { MOON_HERB_QUEST } from "./chapter-two.ts";
import { techniquesUnlocked, learnableTechniques } from "./techniques.ts";
import { combatRank, penetration } from "./combat.ts";

export type Destination = "adventure" | "quests" | "recruit" | "build" | "companions" | "party";
export type JourneyGoal = {
  hintId?: string;
  title: string;
  detail: string;
  action: string;
  destination: Destination;
  questId?: string;
};
export function journeyHintKey(goal: JourneyGoal) {
  return goal.hintId || [goal.destination, goal.questId || "", goal.title].join(":");
}

function prologueGoal(s: State, sq: Squad): JourneyGoal {
  if (sq.run?.phase === "rest")
    return {
      title: "手前の道で力をつけよう",
      detail:
        "苦戦するときは、読み終えたクエストの自動周回でレベル上げ。お店の武器・防具も助けになります。タップで攻撃や回復を手伝うこともできます。",
      action: "クエストを開く",
      destination: "quests",
    };
  if (sq.run)
    return {
      title: "タップで仲間を手助け",
      detail:
        "道や荷物・魔物をタップすると手助けできます。仲間をタップすると回復。見守っていても進みます。",
      action: "冒険を見守る",
      destination: "adventure",
    };
  if (pendingInterlude(s))
    return {
      title: "幕間 · 私が用意するお昼",
      detail: "約束のお昼を、ふたりで。会話を読むと第三章へ進めます。",
      action: "幕間を読む",
      destination: "adventure",
    };
  if (stageEndingPending(s))
    return {
      title: "達成後のひと幕",
      detail: "クエストクリアの表示から、話の続きを読みましょう。",
      action: "物語へ",
      destination: "adventure",
    };
  if (techniquesUnlocked(s) && !s.techniques?.learned.length && !s.done[MOON_HERB_QUEST])
    return {
      hintId: "techniques-unlocked",
      title: "技の習得・セットができるようになりました",
      detail:
        "キャラクター画面で、必要レベルとコインを確かめて技を習得できます。セットすると自動で働きます。習得せず次のクエストへ進むこともできます。",
      action: "技を見に行く",
      destination: "companions",
      questId: nextStage(s).quest,
    };
  const stage = nextStage(s),
    complete = !!s.done[stage.quest];
  const name = allQuests.find((q) => q.id === stage.quest)?.name ?? "";
  return {
    title: complete ? "第三章の冒険を終えました" : `${stage.number} ${name} · ${stage.title}`,
    detail: complete
      ? "ベルネの塔に灯りが戻り、四人で次の旅へ。読み終えた道をもう一度歩いたり、手帳で思い出を振り返れます。"
      : "画面下の「出発」で出かけましょう。行先は隣の「クエスト」から選べます。",
    action: "クエストを開く",
    destination: "quests",
    questId: stage.quest,
  };
}
export function nextGoal(s: State, sq: Squad = s.squads[0]): JourneyGoal {
  return prologueGoal(s, sq);
}
export function questAdvice(s: State, sq: Squad, q: Quest) {
  const gap =
    combatRank(q) -
    sq.members.reduce((sum, id) => sum + penetration(s, id), 0) / Math.max(1, sq.members.length);
  if (gap >= 4 && Array.from({ length: 15 }, (_, node) => encounter(q, node)).includes("battle"))
    return "魔物に攻撃が通りにくい強さです。育成が目安より遅れています。手前の依頼でレベルを上げ、武器を見直すとダメージが通りやすくなります。";
  if (power(s, sq, q) >= q.need) return "この隊が得意な依頼です。見守りながら報酬を集めましょう。";
  const strong = [...heroes]
    .filter(
      (h) =>
        s.owned.includes(h.id) &&
        !sq.members.includes(h.id) &&
        !s.squads.some((p) => p.id !== sq.id && p.members.includes(h.id)),
    )
    .sort(
      (a, b) =>
        b.stats[["採取", "護衛", "討伐"].indexOf(q.kind)] -
        a.stats[["採取", "護衛", "討伐"].indexOf(q.kind)],
    )
    .at(0);
  return `${q.kind}の力が目安より${String(q.need - power(s, sq, q))}低めです。${strong ? `${strong.name}を含む編成を比べるか、` : ""}${s.clears >= 3 ? "装備を強化するか、" : ""}手助け・回復で支えましょう。条件を満たさなくても出発できます。`;
}
export type JourneyNotice = { title: string; description: string };
function prologueNotice(before: State, after: State): JourneyNotice | null {
  const stage = storyStages.find(
    ({ quest }) => !before.done[quest] && (after.done[quest] || 0) > 0,
  );
  return stage ? { title: stage.arrival, description: stage.detail } : null;
}
export function journeyNotice(before: State, after: State): JourneyNotice | null {
  if (!before.owned.includes("finn") && after.owned.includes("finn"))
    return {
      title: "フィンが同行します",
      description: "四人でベルネへ。フィンの装備はキャラクター画面で確認できます。",
    };
  if (
    !before.story?.read.includes(BERNE_QUEST + "-return") &&
    after.story?.read.includes(BERNE_QUEST + "-return")
  )
    return {
      title: "ベルネの装備が入荷しました",
      description: "四人の武器と新しい上着が、お店に並びました。",
    };
  if (
    !before.owned.includes("mira") &&
    after.owned.includes("mira") &&
    after.story?.read.includes("medicine-packing-return")
  )
    return {
      title: "ミラが仲間になりました",
      description: "次の山道から三人で冒険します。ミラは傷ついた仲間を自動で回復します。",
    };
  return prologueNotice(before, after) ?? techniqueNotice(before, after);
}
function techniqueNotice(before: State, after: State): JourneyNotice | null {
  if (!techniquesUnlocked(before) && techniquesUnlocked(after))
    return {
      title: "技の習得・セットができるようになりました",
      description:
        "キャラクター画面で習得できます。習得したらセットして、次の冒険で試してみましょう。",
    };
  const previous = learnableTechniques(before).map((t) => t.id),
    added = learnableTechniques(after).filter((t) => !previous.includes(t.id));
  return added.length
    ? {
        title: "習得できる技があります",
        description:
          added.map((t) => t.name).join("・") +
          "。キャラクター画面で必要なコインと効果を確認できます。",
      }
    : null;
}
