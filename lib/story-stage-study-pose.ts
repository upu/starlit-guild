import type { StageActor } from "./story-stage-cues.ts";

export function mossStudyPose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.id === "lico")
    return licoCarePose(actor, elapsed, reduced) ?? licoStudyPose(actor, elapsed, reduced);
  if (actor.id === "mira" && actor.mossCare)
    return {
      atlas: "conversation" as const,
      frame: 68 + ["hold", "slip", "support", "steady"].indexOf(actor.mossCare),
      handDrop: 0,
      onChair: false,
    };
  return null;
}

function licoCarePose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.mossStudy === "wipe" || actor.mossStudy === "spread")
    return {
      atlas: "conversation" as const,
      frame: (actor.mossStudy === "wipe" ? 84 : 86) + (reduced ? 0 : Math.floor(elapsed / 450) % 2),
      handDrop: 0,
      onChair: false,
    };
  return null;
}
function licoStudyPose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.paperAction)
    return {
      atlas: "conversation" as const,
      frame:
        80 + ["strike-start", "strike-end", "tear-start", "tear-end"].indexOf(actor.paperAction),
      handDrop: 0,
      onChair: false,
    };
  if (actor.recordStudy)
    return {
      atlas: "conversation" as const,
      frame: 76 + ["read", "point", "page", "hug"].indexOf(actor.recordStudy),
      handDrop: 16,
      onChair: true,
    };
  if (actor.mossStudy) {
    const index = ["glasses", "read", "write", "show", "page", "reach", "taste", "brace"].indexOf(
      actor.mossStudy,
    );
    return {
      atlas: "conversation" as const,
      frame:
        68 +
        (actor.mossStudy === "write" && !reduced ? 1 + (Math.floor(elapsed / 450) % 2) : index),
      handDrop: actor.mossStudy === "brace" ? 24 : 0,
      onChair: false,
    };
  }
  return null;
}
