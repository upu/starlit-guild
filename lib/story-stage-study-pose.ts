import type { StageActor } from "./story-stage-cues.ts";

export function mossStudyPose(actor: StageActor, elapsed: number, reduced: boolean) {
  if (actor.id === "lico" && actor.mossStudy) {
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
  if (actor.id === "mira" && actor.mossCare)
    return {
      atlas: "conversation" as const,
      frame: 68 + ["hold", "slip", "support", "steady"].indexOf(actor.mossCare),
      handDrop: 0,
      onChair: false,
    };
  return null;
}
