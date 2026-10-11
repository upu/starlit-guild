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
  if (moving && !actor.pull)
    return { atlas: "home" as const, frame: residentFrame("walk", elapsed, reduced) };
  if (actor.pull)
    return { atlas: "adventure" as const, frame: cycle(20, elapsed, 180, moving && !reduced) };
  return stationaryPose(actor, elapsed, reduced);
}

function shawlPose(actor: StageActor, moving: boolean, elapsed: number, reduced: boolean) {
  return {
    atlas: "shawl" as const,
    frame: moving ? cycle(2, elapsed, 180, !reduced) : Number(!!actor.carry),
  };
}

function carryingPose(actor: StageActor, moving: boolean, elapsed: number, reduced: boolean) {
  const frame = moving ? cycle(8, elapsed, 180, !reduced) : actor.carry ? 14 + mood(actor) : 8;
  return { atlas: "conversation" as const, frame };
}

function stationaryPose(actor: StageActor, elapsed: number, reduced: boolean) {
  return { atlas: "conversation" as const, frame: stationaryFrame(actor, elapsed, reduced) };
}

function stationaryFrame(actor: StageActor, elapsed: number, reduced: boolean): number {
  if (actor.shoulder) return 19 + Number(actor.pose === "tease");
  if (actor.writing) return cycle(17, elapsed, 400, !reduced);
  if (actor.sword) return 21;
  if (actor.inspect) return actor.packing ? cycle(6, elapsed, 480, !reduced) : 13;
  if (actor.seated) return 10 + mood(actor);
  return conversationFrame(actor);
}

function conversationFrame(actor: StageActor) {
  const frames = { idle: 0, greet: 1, surprise: 2, think: 3, offer: 4, tease: 5 };
  return frames[actor.wave ? "greet" : (actor.pose ?? "idle")];
}
