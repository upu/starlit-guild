import type { Kind, Quest, QuestStyle } from "./game.ts";

// One story stage as written: its heading, the quest it sends the party on, and that quest's
// scenery and balance. Opponents default to the road's slimes.
export type StageDefinition = {
  quest: string;
  title: string;
  region: string;
  desc: string;
  arrival: string;
  detail: string;
  scenery: string;
  kind: Kind;
  need: number;
  gold: number;
  xp: number;
  rank: number;
  enemy?: number;
  enemyName?: string;
};

export const stageHeadings = (chapter: number, definitions: readonly StageDefinition[]) =>
  definitions.map(({ quest, title, arrival, detail }, index) => ({
    quest,
    number: `${String(chapter)}-${String(index + 1)}`,
    title,
    arrival,
    detail,
  }));

export const stageQuests = (
  definitions: readonly StageDefinition[],
  tier: number,
  style: (definition: StageDefinition) => QuestStyle,
): Quest[] =>
  definitions.map((definition) => ({
    id: definition.quest,
    name: definition.title,
    region: definition.region,
    desc: definition.desc,
    kind: definition.kind,
    tier,
    need: definition.need,
    seconds: 180,
    gold: definition.gold,
    xp: definition.xp,
    herbs: 1,
    ore: 0,
    enemy: definition.enemy ?? 8,
    enemyName: definition.enemyName ?? "街道のスライム",
    background: `/scenery/${definition.scenery}-background.webp`,
    availability: "repeatable",
    style: style(definition),
  }));
