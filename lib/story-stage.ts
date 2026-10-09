import { residentFrame, type ResidentId } from "./home-actor.ts";
import { TRADE_QUEST } from "./prologue.ts";

export const meetingStoryId = `${TRADE_QUEST}-departure`;
type StageActor = {
  id: ResidentId;
  x: number;
  left: boolean;
  wave?: boolean;
  inspect?: boolean;
  pull?: boolean;
  visible?: boolean;
  reaction?: "surprise" | "nod";
};
export type StoryStageCue = {
  description: string;
  actors: StageActor[];
  luggage: boolean;
  cartX?: number;
};
export type StagePosition = { x: number };
export type StageSample = StagePosition & {
  frame: number;
  left: boolean;
  lift: number;
  bubble: string;
  atlas: "home" | "adventure";
  visible: boolean;
};

const pair = (
  aria = 28,
  leon = 56,
  ariaAction: Partial<StageActor> = {},
  leonAction: Partial<StageActor> = {},
): StageActor[] => [
  { id: "aria", x: aria, left: false, ...ariaAction },
  { id: "leon", x: leon, left: true, ...leonAction },
];

// One cue per existing line. Authored staging, never inferred from dialogue text.
const meetingCues: StoryStageCue[] = [
  {
    description: "先に着いたレオンが、交易品と予備の荷物を積んだ荷車を点検している。",
    actors: pair(-10, 56, { visible: false }, { inspect: true, left: false }),
    luggage: false,
  },
  {
    description: "荷車を点検するレオンのところへ、アリアが歩いてくる。",
    actors: pair(28, 56, {}, { inspect: true, left: false }),
    luggage: true,
  },
  {
    description: "アリアがレオンに手を上げて挨拶する。",
    actors: pair(28, 56, { wave: true }),
    luggage: true,
  },
  {
    description: "レオンがアリアへ頷く。",
    actors: pair(28, 56, {}, { reaction: "nod" }),
    luggage: true,
  },
  {
    description: "レオンの荷物の多さに、アリアが驚く。",
    actors: pair(28, 56, { reaction: "surprise" }),
    luggage: true,
  },
  {
    description: "レオンが用意した物を説明し、アリアが聞いている。",
    actors: pair(),
    luggage: true,
  },
  { description: "アリアが少し近づき、レオンの荷を覗く。", actors: pair(34), luggage: true },
  {
    description: "念のため、とレオンが頷く。",
    actors: pair(34, 56, {}, { reaction: "nod" }),
    luggage: true,
  },
  {
    description: "布を分けて持とうと、アリアがレオンのそばへ寄る。",
    actors: pair(40),
    luggage: true,
  },
  {
    description: "荷をまとめ直し、二人は出発の支度を終える。",
    actors: pair(40, 56, {}, { inspect: true, left: false }),
    luggage: true,
  },
  {
    description: "アリアが少し離れ、待ち合わせ場所の思い出を話す。",
    actors: pair(32, 56),
    luggage: true,
  },
  {
    description: "レオンは荷車の引き手へ回り、振り向いて昔の出来事を話す。",
    actors: pair(32, 81),
    luggage: true,
  },
  {
    description: "アリアが自分の荷を持って先に歩き出し、レオンが荷車を引いて続く。",
    actors: pair(107, 156, {}, { left: false, pull: true }),
    luggage: false,
    cartX: 139,
  },
];

export function storyStageCue(storyId: string, line: number): StoryStageCue | null {
  if (storyId !== meetingStoryId) return null;
  return meetingCues[line] ?? null;
}

export function stageEntrance(id: ResidentId): StagePosition {
  return { x: id === "aria" ? -10 : 56 };
}

export function stageTravel(from: number, to: number, elapsed: number, reduced = false) {
  const duration = Math.max(280, Math.abs(to - from) * 34);
  const progress = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / duration);
  return { x: from + (to - from) * progress, moving: progress < 1 && Math.abs(to - from) > 0.1 };
}

function actorPose(actor: StageActor, moving: boolean, elapsed: number, reduced: boolean) {
  if (actor.inspect)
    return {
      atlas: "adventure" as const,
      frame: 22 + (reduced ? 0 : Math.floor(elapsed / 480) % 2),
    };
  if (actor.pull)
    return {
      atlas: "adventure" as const,
      frame: 20 + (moving ? Math.floor(elapsed / 180) % 2 : 0),
    };
  const wave = actor.wave && elapsed < 900;
  return {
    atlas: "home" as const,
    frame: residentFrame(moving ? "walk" : wave ? "wave" : "idle", elapsed, reduced),
  };
}

// Start from the displayed position, so a tap during a walk never teleports or queues a walk.
export function sampleStageActor(
  actor: StageActor,
  origin: StagePosition,
  elapsed: number,
  reduced = false,
): StageSample {
  const { x, moving } = stageTravel(origin.x, actor.x, elapsed, reduced);
  const reaction = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / 520);
  return {
    x,
    ...actorPose(actor, moving, elapsed, reduced),
    visible: actor.visible !== false,
    left: moving ? actor.x < origin.x : actor.left,
    lift: reactionLift(actor.reaction, reaction),
    bubble: actor.reaction === "surprise" && (reduced || elapsed < 1600) ? "！" : "",
  };
}

function reactionLift(reaction: StageActor["reaction"], progress: number) {
  if (!reaction || progress >= 1) return 0;
  return Math.round(Math.sin(progress * Math.PI) * (reaction === "surprise" ? -8 : 3));
}
