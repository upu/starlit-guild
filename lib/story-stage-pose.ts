import { residentFrame } from "./home-actor.ts";
import { boxTransferDuration } from "./story-stage-props.ts";
import type { StageActor } from "./story-stage-cues.ts";

const cycle = (first: number, elapsed: number, interval: number, animate: boolean) =>
  first + (animate ? Math.floor(elapsed / interval) % 2 : 0);
const mood = (actor: StageActor) =>
  actor.pose === "tease" ? 2 : actor.pose === "think" || actor.pose === "surprise" ? 1 : 0;

export function actorPose(actor: StageActor, moving: boolean, elapsed: number, reduced: boolean) {
  if (actor.shawl) return shawlPose(actor, moving, elapsed, reduced);
  if (actor.carry || (actor.place && elapsed < boxTransferDuration && !reduced))
    return carryingPose(actor, moving, elapsed, reduced);
  if (actor.bed) return stationaryPose(actor, elapsed, reduced);
  if (actor.seated && actor.scoot) return stationaryPose(actor, elapsed, reduced);
  if (moving && !actor.pull)
    return { atlas: "home" as const, frame: residentFrame("walk", elapsed, reduced) };
  if (actor.pull)
    return { atlas: "adventure" as const, frame: cycle(20, elapsed, 180, moving && !reduced) };
  return actionPose(actor, elapsed, reduced);
}

function actionPose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.id === "mira" && actor.lookAcross)
    return { atlas: "conversation" as const, frame: 17, handDrop: 0, onChair: false };
  return (
    healingPose(actor, elapsed, reduced) ??
    injuredHandPose(actor) ??
    glovePose(actor) ??
    knockPose(actor, elapsed, reduced) ??
    pushPose(actor) ??
    bowPose(actor) ??
    stationaryPose(actor, elapsed, reduced)
  );
}

function injuredHandPose(actor: StageActor) {
  if (actor.id !== "finn" || !actor.handAction) return null;
  return {
    atlas: "conversation" as const,
    frame: { catch: 17, guard: 18, wipe: 19, palm: 20, "pat-ready": 32, "pat-touch": 33 }[
      actor.handAction
    ],
    handDrop: 0,
    onChair: false,
  };
}

function glovePose(actor: StageActor) {
  if (actor.id !== "finn" || !actor.gloves) return null;
  return {
    atlas: "conversation" as const,
    frame: actor.gloves === "worn" ? 46 : 47,
    handDrop: 0,
    onChair: false,
  };
}

function healingPose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.id !== "mira" || !actor.healing) return null;
  return {
    atlas: "conversation" as const,
    frame: healingFrame(actor.healing, elapsed, reduced),
    handDrop: 0,
    onChair: false,
  };
}

function knockPose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.id !== "finn" || !actor.knock) return null;
  return {
    atlas: "conversation" as const,
    frame: cycle(44, elapsed, 180, !reduced),
    handDrop: 0,
    onChair: false,
  };
}

function pushPose(actor: StageActor) {
  if (actor.id !== "leon" || !actor.push) return null;
  return {
    atlas: "conversation" as const,
    frame: { brace: 44, extend: 45 }[actor.push],
    handDrop: 0,
    onChair: false,
  };
}

function bowPose(actor: StageActor) {
  if (actor.id !== "aria" || !actor.bow) return null;
  return { atlas: "adventure" as const, frame: actor.bow === "aim" ? 11 : 13 };
}

function shawlPose(actor: StageActor, moving: boolean, elapsed: number, reduced: boolean) {
  return {
    atlas: "shawl" as const,
    frame: moving ? cycle(2, elapsed, 180, !reduced) : Number(!!actor.carry),
  };
}

function carryingPose(actor: StageActor, moving: boolean, elapsed: number, reduced: boolean) {
  const walk = actor.id === "aria" || actor.id === "leon" ? [8, 9, 22, 23] : [8, 9];
  const frame = moving
    ? walk[reduced ? 0 : Math.floor(elapsed / 130) % walk.length]
    : actor.carry
      ? 14 + mood(actor)
      : 8;
  return { atlas: "conversation" as const, frame };
}

function stationaryPose(actor: StageActor, elapsed: number, reduced: boolean) {
  const frame = stationaryFrame(actor, elapsed, reduced);
  // Hand displacement in the registered 128px cell, relative to standing.
  // Derive it from the displayed frame: walking/carrying override a seated cue.
  return {
    atlas: "conversation" as const,
    frame,
    handDrop: poseHandDrop(frame),
    onChair:
      actor.visible !== false &&
      ((frame >= 24 && frame < 32) || (frame >= 36 && frame < 44 && !!actor.stool)),
  };
}

function poseHandDrop(frame: number) {
  if (frame >= 36 && frame < 44) return 16;
  if (frame >= 24 && frame < 36) return 8;
  if (frame >= 10 && frame <= 12) return 20;
  if (frame === 13) return 28;
  return frame === 6 || frame === 7 ? 24 : 0;
}

function chairFrame(actor: StageActor) {
  const frames = { idle: 0, greet: 1, surprise: 3, think: 3, offer: 1, tease: 2 };
  return (
    (actor.stool || actor.perch ? 36 : 24) + (actor.left ? 4 : 0) + frames[actor.pose ?? "idle"]
  );
}

function stationaryFrame(actor: StageActor, elapsed: number, reduced: boolean): number {
  if (actor.bed) return 32 + ["rest", "edge", "breakfast", "sleep"].indexOf(actor.bed);
  if (actor.seated && (actor.chair || actor.stool || actor.perch)) return chairFrame(actor);
  if (actor.shoulder) return 19 + Number(actor.pose === "tease");
  if (actor.writing) return cycle(17, elapsed, 400, !reduced);
  if (actor.sword) return 21;
  if (actor.inspect) return actor.packing ? cycle(6, elapsed, 480, !reduced) : 13;
  if (actor.seated) return 10 + mood(actor);
  return conversationFrame(actor);
}
function healingFrame(pose: NonNullable<StageActor["healing"]>, elapsed: number, reduced: boolean) {
  if (pose === "treat") return cycle(44, elapsed, 420, !reduced);
  return pose === "rise" ? 46 : 47;
}

function conversationFrame(actor: StageActor) {
  const frames = { idle: 0, greet: 1, surprise: 2, think: 3, offer: 4, tease: 5 };
  return frames[actor.wave ? "greet" : (actor.pose ?? "idle")];
}
