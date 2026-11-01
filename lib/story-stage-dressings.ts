import type { ResidentId } from "./home-actor.ts";
import type { StageActor, StageItem } from "./story-stage-cues.ts";

export function dressingItem(actor: ResidentId): StageItem {
  return {
    id: actor === "aria" ? "arm-bandage" : actor === "leon" ? "hand-bandage" : "bandage",
    art: "wrist-bandage",
    actor,
    wrist: true,
    width: 1.3,
    x: 0,
    bottom: 0,
  };
}

export function actorDressings(actors: StageActor[]) {
  return actors
    .filter((a) => {
      // These two poses already paint the dressing on the stationary right palm.
      const painted =
        a.id === "finn" && (a.handAction === "pat-ready" || a.handAction === "pat-touch");
      return a.dressed && a.visible !== false && !painted;
    })
    .map((a) => dressingItem(a.id));
}
