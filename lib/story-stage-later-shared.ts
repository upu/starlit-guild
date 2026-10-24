import type { ResidentId } from "./home-actor.ts";
import type { Story, StoryLine } from "./stories.ts";
import type { StageActor, StoryStageCue, StageItem, StageExtra } from "./story-stage-cues.ts";
import { item } from "./story-stage-chapter-shared.ts";
import { actorDressings } from "./story-stage-dressings.ts";
export { item };

export type LaterBeat = {
  finishBeforeAdvance?: boolean;
  arrows?: StoryStageCue["arrows"];
  at: number;
  actors?: Partial<Record<ResidentId, Partial<StageActor>>>;
  cast?: StageActor[];
  items?: StageItem[];
  extras?: StageExtra[];
  furniture?: StageItem[];
  background?: StoryStageCue["background"];
  night?: boolean;
  cut?: boolean;
  sequence?: {
    after: number;
    actors?: LaterBeat["actors"];
    items?: StageItem[];
    extras?: StageExtra[];
  }[];
};
export type LaterStage = {
  background: StoryStageCue["background"];
  cast: StageActor[];
  beats: LaterBeat[];
  night?: boolean;
  exit?: ResidentId[];
  exitSide?: "left" | "right";
  exitLanes?: Partial<Record<ResidentId, number>>;
  exitRoutes?: Partial<Record<ResidentId, Pick<StageActor, "x" | "bottom" | "via">>>;
  initial?: StoryStageCue["initial"];
  cell?: number;
  furniture?: StageItem[];
};
export const actor = (id: ResidentId, x: number, extra: Partial<StageActor> = {}): StageActor => ({
  id,
  x,
  left: x > 50,
  ...extra,
});
export const duo = () => [actor("aria", 34), actor("leon", 64)];
export const trio = () => [actor("aria", 27), actor("leon", 48), actor("mira", 73)];
export const quartet = () => [...trio().map((a) => ({ ...a, x: a.x - 7 })), actor("finn", 82)];
export const quintet = () => [
  actor("aria", 19),
  actor("leon", 35),
  actor("mira", 51),
  actor("finn", 67),
  actor("lico", 83),
];
export const npc = (
  id: StageExtra["id"],
  name?: string,
  x = 73,
  pose: StageExtra["pose"] = "idle",
  speaking = false,
): StageExtra => ({ id, name, x, bottom: 36, pose, speaking });
export const held = (art: StageItem["art"], owner: ResidentId, extra: Partial<StageItem> = {}) =>
  item(art, art, owner === "leon" ? -4 : 4, 23, { actor: owner, width: 8, ...extra });
export const ground = (art: StageItem["art"], x = 50, bottom = 12, width = 12) =>
  item(art, art, x, bottom, { width });
export const table = (x = 50) => ground("table", x, 16, 21);
export const onTable = (art: StageItem["art"], x = 50, width = 10): StageItem => ({
  ...ground(art, x, 33, width),
  support: "table",
});
export const scene = (
  background: LaterStage["background"],
  cast: StageActor[],
  beats: LaterBeat[],
  extra: Partial<LaterStage> = {},
): LaterStage => ({ background, cast, beats, ...extra });

function speakingPose(line: StoryLine): StageActor["pose"] {
  if (["smile", "mischievous"].includes(line.expression ?? "")) return "tease";
  if (["surprised", "shouting"].includes(line.expression ?? "")) return "surprise";
  if (["worried", "serious", "shy", "tired", "thoughtful"].includes(line.expression ?? ""))
    return "think";
  return "offer";
}
export function buildLaterStage(story: Story, definition: LaterStage) {
  let actors = definition.cast,
    items: StageItem[] = [],
    extras: StageExtra[] = [];
  let background = definition.background,
    night = definition.night,
    furniture = definition.furniture ?? [];
  const initial = { ...Object.fromEntries(actors.map((a) => [a.id, a.x])), ...definition.initial };
  const initialBottom = Object.fromEntries(actors.map((a) => [a.id, a.bottom ?? 14]));
  return story.lines.map((line, index): StoryStageCue => {
    const beat = definition.beats.find((b) => b.at === index);
    actors = speakingActors(actors, line, beat);
    items = beat?.items ?? items;
    extras = (beat?.extras ?? extras).map((extra) => ({
      ...extra,
      speaking: extra.id === line.speaker || (beat?.extras ? extra.speaking : false),
    }));
    background = beat?.background ?? background;
    furniture = beat?.furniture ?? furniture;
    night = beat?.night ?? night;
    const openingActors = actors,
      openingItems = items,
      openingExtras = extras;
    const sequence = beat?.sequence?.map((step) => {
      actors = actors.map((a) => ({ ...a, ...step.actors?.[a.id] }));
      items = step.items ?? items;
      extras = step.extras ?? extras;
      return {
        after: step.after,
        actors,
        items: [...furniture, ...items, ...actorDressings(actors)],
        extras,
      };
    });
    return {
      finishBeforeAdvance: beat?.finishBeforeAdvance,
      description: `${story.place}。${line.text}`,
      arrows: beat?.arrows,
      actors: openingActors,
      items: [...furniture, ...openingItems, ...actorDressings(openingActors)].filter(
        (item) =>
          !item.actor || openingActors.some((a) => a.id === item.actor && a.visible !== false),
      ),
      extras: openingExtras,
      background,
      night,
      ...stageStart(openingActors, beat, { initial, initialBottom }),
      cell: stageCell(definition),
      luggage: false,
      hideCart: true,
      bundleMode: "hidden",
      sequence,
    };
  });
}

function speakingActors(actors: StageActor[], line: StoryLine, beat?: LaterBeat) {
  return (beat?.cast ?? actors).map((a) => ({
    ...a,
    lane: undefined,
    reaction: undefined,
    ...(line.speaker === a.id
      ? { pose: speakingPose(line), inspect: false, packing: false, writing: false }
      : {}),
    ...beat?.actors?.[a.id],
  }));
}

function stageStart(
  actors: StageActor[],
  beat: LaterBeat | undefined,
  initial: Pick<StoryStageCue, "initial" | "initialBottom">,
) {
  const cut = beat?.cut ?? !!beat?.background;
  if (!cut) return { ...initial, cut };
  return {
    cut,
    initial: Object.fromEntries(actors.map((a) => [a.id, a.x])),
    initialBottom: Object.fromEntries(actors.map((a) => [a.id, a.bottom ?? 14])),
  };
}

function stageCell(definition: LaterStage) {
  return (
    definition.cell ?? (definition.cast.length > 4 ? 19 : definition.cast.length > 2 ? 21 : 24)
  );
}
