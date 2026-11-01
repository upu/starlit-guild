import type { Story, StoryLine } from "./stories.ts";
import {
  stagePair,
  type StageActor,
  type StoryStageCue,
  type StageItem,
  type StageExtra,
} from "./story-stage-cues.ts";

export type StageBeat = {
  at: number;
  aria?: Partial<StageActor>;
  leon?: Partial<StageActor>;
  items?: StageItem[];
  extras?: StageExtra[];
  sequence?: {
    after: number;
    aria?: Partial<StageActor>;
    leon?: Partial<StageActor>;
    items?: StageItem[];
  }[];
};
export type ChapterStage = {
  background: StoryStageCue["background"];
  cameraScale?: number;
  night?: boolean;
  beats: StageBeat[];
  exit?: "together" | "apart";
};
export const keeper = (pose: StageExtra["pose"] = "idle", speaking = false): StageExtra => ({
  id: "keeper",
  x: 73,
  bottom: 23,
  pose,
  speaking,
});
export const worker = (pose: StageExtra["pose"] = "idle", speaking = false): StageExtra => ({
  id: "worker",
  x: 23,
  bottom: 28,
  pose,
  speaking,
});
export const item = (
  id: string,
  art: StageItem["art"],
  x: number,
  bottom: number,
  extra: Partial<StageItem> = {},
): StageItem => ({ id, art, x, bottom, ...extra });
export const moss = (actor: "aria" | "leon", glow?: StageItem["glow"]): StageItem =>
  item("sample", "moss", actor === "aria" ? 6 : -6, 24, { actor, width: 10, glow });
export const lamp = (actor: "aria" | "leon"): StageItem =>
  item(`${actor}-lamp`, "lantern", actor === "aria" ? -6 : 6, 20, {
    actor,
    width: 5,
    glow: "bright",
  });
export const basket = (actor?: "aria" | "leon"): StageItem =>
  item("basket", "basket", actor ? -6 : 51, actor ? 22 : 14, { actor, width: 14 });
export const notes = (onStone = false): StageItem =>
  item("notes", "map", 49, onStone ? 26 : 17, {
    width: 13,
    support: onStone ? "stone" : undefined,
  });
export const stone = (): StageItem => item("stone", "stone", 49, 16, { width: 24 });
export const tools = (): StageItem => item("tools", "tools", 17, 9, { width: 13 });

function talkingPose(expression: StoryLine["expression"]): StageActor["pose"] {
  switch (expression) {
    case "smile":
    case "mischievous":
      return "tease";
    case "surprised":
      return "surprise";
    case "worried":
    case "serious":
    case "shy":
    case "tired":
      return "think";
    default:
      return "offer";
  }
}

export function buildChapterStage(story: Story, definition: ChapterStage) {
  let actors = stagePair(32, 57),
    items: StageItem[] = [],
    extras: StageExtra[] = [];
  return story.lines.map((line, index): StoryStageCue => {
    const beat = definition.beats.find((b) => b.at === index);
    actors = actors.map((actor) => ({
      ...actor,
      ...(line.speaker === actor.id ? { pose: talkingPose(line.expression) } : {}),
      ...beat?.[actor.id === "aria" ? "aria" : "leon"],
    }));
    items = beat?.items ?? items;
    extras = beat?.extras ?? extras.map((extra) => ({ ...extra, speaking: false }));
    const openingActors = actors,
      openingItems = items;
    const sequence = beat?.sequence?.map((step) => {
      actors = actors.map((actor) => ({
        ...actor,
        ...step[actor.id === "aria" ? "aria" : "leon"],
      }));
      items = step.items ?? items;
      return { after: step.after, actors, items };
    });
    return {
      description: `${story.place}。${line.text}`,
      actors: openingActors,
      items: openingItems,
      sequence,
      extras,
      background: definition.background,
      cameraScale: definition.cameraScale,
      night: definition.night,
      initial: { aria: 32, leon: 57 },
      hideCart: true,
      luggage: false,
      bundleMode: "hidden",
    };
  });
}
