import { residentFrame, type ResidentId } from "./home-actor.ts";
import { TRADE_QUEST } from "./prologue.ts";

export const meetingStoryId = `${TRADE_QUEST}-departure`;
type StageActor = {
  id: ResidentId;
  x: number;
  left: boolean;
  wave?: boolean;
  reaction?: "surprise" | "nod";
};
export type StoryStageCue = {
  description: string;
  actors: StageActor[];
  luggage: boolean;
};
export type StagePosition = { x: number };
export type StageSample = StagePosition & {
  frame: number;
  left: boolean;
  lift: number;
  bubble: string;
};

const pair = (
  aria = 36,
  leon = 64,
  ariaAction: Partial<StageActor> = {},
  leonAction: Partial<StageActor> = {},
): StageActor[] => [
  { id: "aria", x: aria, left: false, ...ariaAction },
  { id: "leon", x: leon, left: true, ...leonAction },
];

// One cue per existing line. Authored staging, never inferred from dialogue text.
const meetingCues: StoryStageCue[] = [
  {
    description: "村から来たアリアとレオンが、道の合流点へ歩いてくる。",
    actors: pair(),
    luggage: false,
  },
  { description: "二人は荷物を下ろし、向かい合う。", actors: pair(), luggage: true },
  {
    description: "アリアがレオンに手を上げて挨拶する。",
    actors: pair(36, 64, { wave: true }),
    luggage: true,
  },
  {
    description: "レオンがアリアへ頷く。",
    actors: pair(36, 64, {}, { reaction: "nod" }),
    luggage: true,
  },
  {
    description: "レオンの荷物の多さに、アリアが驚く。",
    actors: pair(36, 64, { reaction: "surprise" }),
    luggage: true,
  },
  {
    description: "レオンが用意した物を説明し、アリアが聞いている。",
    actors: pair(),
    luggage: true,
  },
  { description: "アリアが少し近づき、レオンの荷を覗く。", actors: pair(42), luggage: true },
  {
    description: "念のため、とレオンが頷く。",
    actors: pair(42, 64, {}, { reaction: "nod" }),
    luggage: true,
  },
  {
    description: "布を分けて持とうと、アリアがレオンのそばへ寄る。",
    actors: pair(48),
    luggage: true,
  },
  {
    description: "荷をまとめ直し、二人は出発の支度を終える。",
    actors: pair(48, 66),
    luggage: true,
  },
  {
    description: "アリアが少し離れ、待ち合わせ場所の思い出を話す。",
    actors: pair(40, 64),
    luggage: true,
  },
  { description: "レオンがアリアを見て、昔の出来事を話す。", actors: pair(40, 64), luggage: true },
  {
    description: "アリアが先に歩き出し、レオンも同じ方へ続く。",
    actors: pair(82, 68, {}, { left: false }),
    luggage: false,
  },
];

export function storyStageCue(storyId: string, line: number): StoryStageCue | null {
  if (storyId !== meetingStoryId) return null;
  return meetingCues[line] ?? null;
}

export function stageEntrance(id: ResidentId): StagePosition {
  return { x: id === "aria" ? 12 : 88 };
}

// Start from the displayed position, so a tap during a walk never teleports or queues a walk.
export function sampleStageActor(
  actor: StageActor,
  origin: StagePosition,
  elapsed: number,
  reduced = false,
): StageSample {
  const duration = Math.max(280, Math.abs(actor.x - origin.x) * 34);
  const progress = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / duration);
  const moving = progress < 1 && Math.abs(actor.x - origin.x) > 0.1;
  const x = origin.x + (actor.x - origin.x) * progress;
  const reaction = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / 520);
  const wave = actor.wave && elapsed < 900;
  return {
    x,
    frame: residentFrame(moving ? "walk" : wave ? "wave" : "idle", elapsed, reduced),
    left: moving ? actor.x < origin.x : actor.left,
    lift: reactionLift(actor.reaction, reaction),
    bubble: actor.reaction === "surprise" && (reduced || elapsed < 1600) ? "！" : "",
  };
}

function reactionLift(reaction: StageActor["reaction"], progress: number) {
  if (!reaction || progress >= 1) return 0;
  return Math.round(Math.sin(progress * Math.PI) * (reaction === "surprise" ? -8 : 3));
}
