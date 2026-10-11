import { type ResidentId } from "./home-actor.ts";
import { actorPose } from "./story-stage-pose.ts";
import { sampleJourney, type StagePosition } from "./story-stage-travel.ts";
export type { StagePosition } from "./story-stage-travel.ts";
import { TRADE_QUEST, prologueStages } from "./prologue.ts";
import { chapterStageCue, chapterExitCue } from "./story-stage-chapter.ts";
import { stagePair as pair, type StageActor, type StoryStageCue } from "./story-stage-cues.ts";
import { eveningStageCue, eveningExitCue } from "./story-stage-evening.ts";
export type { StoryStageCue } from "./story-stage-cues.ts";
import { townStageCue, townExitCue } from "./story-stage-town.ts";
import { laterStageCue, laterExitCue, hasLaterStage } from "./story-stage-later.ts";

export const meetingStoryId = `${TRADE_QUEST}-departure`;
export function compactStoryDialogue(storyId: string) {
  return (
    hasLaterStage(storyId) ||
    prologueStages.some(
      ({ quest }) => storyId === `${quest}-departure` || storyId === `${quest}-return`,
    )
  );
}

export type StageSample = StagePosition & {
  frame: number;
  left: boolean;
  lift: number;
  bubble: string;
  atlas: "home" | "adventure" | "conversation" | "shawl";
  visible: boolean;
};

// One cue per existing line. Authored staging, never inferred from dialogue text.
const meetingCues: StoryStageCue[] = [
  {
    description: "先に着いたレオンが、交易品と予備の荷物を積んだ荷車を点検している。",
    actors: pair(-10, 56, { visible: false }, { inspect: true, packing: true, left: false }),
    luggage: false,
  },
  {
    description: "荷車を点検するレオンのところへ、アリアが歩いてくる。",
    actors: pair(28, 56, {}, { inspect: true, packing: true, left: false }),
    luggage: true,
  },
  {
    description: "アリアがレオンに手を上げて挨拶する。",
    actors: pair(28, 56, { wave: true }, { pose: "greet" }),
    luggage: true,
  },
  {
    description: "レオンがアリアへ頷く。",
    actors: pair(28, 56, {}, { reaction: "nod" }),
    luggage: true,
  },
  {
    description: "レオンの荷物の多さに、アリアが驚く。",
    actors: pair(28, 56, { reaction: "surprise", pose: "surprise" }),
    luggage: true,
  },
  {
    description: "レオンが用意した物を説明し、アリアが聞いている。",
    actors: pair(28, 56, { pose: "think" }, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "アリアが少し近づき、レオンの荷を覗く。",
    actors: pair(34, 56, { pose: "think" }),
    luggage: true,
  },
  {
    description: "念のため、とレオンが頷く。",
    actors: pair(34, 56, { pose: "think" }, { reaction: "nod", pose: "offer" }),
    luggage: true,
  },
  {
    description: "布を分けて持とうと、アリアがレオンのそばへ寄る。",
    actors: pair(40, 56, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "荷をまとめ直し、二人は出発の支度を終える。",
    actors: pair(40, 56, {}, { inspect: true, packing: true, left: false }),
    luggage: true,
  },
  {
    description: "アリアが少し離れ、待ち合わせ場所の思い出を話す。",
    actors: pair(32, 56, { pose: "greet" }),
    luggage: true,
  },
  {
    description: "レオンは荷車の引き手へ回り、振り向いて昔の出来事を話す。",
    actors: pair(32, 81, { pose: "think" }, { pose: "tease" }),
    luggage: true,
  },
  {
    description: "アリアがレオンに言い返し、二人は出発を待っている。",
    actors: pair(32, 81, { pose: "tease" }, { pose: "tease" }),
    luggage: true,
  },
];

const meetingExit: StoryStageCue = {
  description: "アリアが自分の荷を持って先に歩き出し、レオンが荷車を引いて続く。",
  actors: pair(107, 156, {}, { left: false, pull: true }),
  luggage: false,
  cartX: 139,
};

export function storyStageExitCue(storyId: string): StoryStageCue | null {
  return storyId === meetingStoryId
    ? meetingExit
    : (eveningExitCue(storyId) ??
        townExitCue(storyId) ??
        chapterExitCue(storyId) ??
        laterExitCue(storyId));
}

export function storyStageCue(storyId: string, line: number): StoryStageCue | null {
  if (storyId !== meetingStoryId)
    return (
      eveningStageCue(storyId, line) ??
      townStageCue(storyId, line) ??
      chapterStageCue(storyId, line) ??
      laterStageCue(storyId, line)
    );
  return meetingCues[line] ?? null;
}

export function stageEntrance(id: ResidentId, cue?: StoryStageCue): StagePosition {
  return { x: cue?.initial?.[id] ?? (id === "aria" ? -10 : 56) };
}

export function stageTravel(from: number, to: number, elapsed: number, reduced = false) {
  const duration = Math.max(280, Math.abs(to - from) * 34);
  const progress = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / duration);
  return { x: from + (to - from) * progress, moving: progress < 1 && Math.abs(to - from) > 0.1 };
}

export function stageLuggage(cue: StoryStageCue, aria?: StageSample) {
  if (!aria?.visible) return "hidden";
  if (cue.bundleMode) return cue.bundleMode;
  if (cue.cartX || aria.x < 27.9) return "carried";
  return cue.luggage ? "ground" : "hidden";
}

// Start from the displayed position, so a tap during a walk never teleports or queues a walk.
export function sampleStageActor(
  actor: StageActor,
  origin: StagePosition,
  elapsed: number,
  reduced = false,
): StageSample {
  const travel = sampleJourney(actor, origin, elapsed, reduced);
  const { x, moving } = travel;
  const reaction = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / 520);
  return {
    x,
    bottom: travel.bottom,
    ...actorPose(actor, moving, elapsed, reduced),
    visible: actor.visible !== false,
    left: actor.carry && actor.lane === undefined ? actor.left : travel.left,
    lift: reactionLift(actor.reaction, reaction),
    bubble: actor.reaction === "surprise" && (reduced || elapsed < 1600) ? "！" : "",
  };
}

function reactionLift(reaction: StageActor["reaction"], progress: number) {
  if (!reaction || progress >= 1) return 0;
  return Math.round(Math.sin(progress * Math.PI) * (reaction === "surprise" ? -8 : 3));
}
