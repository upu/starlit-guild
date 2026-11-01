import type { StageActor, StoryStageCue } from "../story-stage-cues.ts";

function carryImages(actor: StageActor) {
  if (!actor.carry && !actor.place && !actor.holdingWalk) return [];
  return [
    `${actor.id}-paper-walk-${actor.id === "leon" ? "v2" : "v1"}`,
    actor.id === "mira" ? "mira-healing-v1" : `${actor.id}-carry-v1`,
  ];
}

function seatedImages(actor: StageActor) {
  if (!actor.seated) return [];
  if (!actor.chair && !actor.stool && !actor.perch) return [`${actor.id}-ground-rest-v1`];
  return actor.id === "leon" ? [] : [`${actor.id}-seat-${actor.id === "mira" ? "v3" : "v1"}`];
}

function actorImages(actor: StageActor) {
  if (!["aria", "leon", "mira"].includes(actor.id)) return [];
  const actions: Record<string, [unknown, string][]> = {
    mira: [
      [actor.bed, "mira-bed-v2"],
      [actor.inspect, "mira-healing-v1"],
    ],
    aria: [
      [actor.shoulder, "aria-shoulder-v1"],
      [actor.bow, "aria-battle-v1"],
    ],
    leon: [[actor.push, "leon-push-v1"]],
  };
  return [
    ...carryImages(actor),
    ...seatedImages(actor),
    ...actions[actor.id].filter(([enabled]) => enabled).map(([, name]) => name),
  ];
}

/** Include actions that appear later in a cue, before the first pose is displayed. */
export function sharedPoseImages(cue: StoryStageCue) {
  const actors = [...cue.actors, ...(cue.sequence?.flatMap((step) => step.actors) ?? [])];
  return [...new Set(actors.flatMap(actorImages).map((name) => `/storybook-study/${name}.webp`))];
}
