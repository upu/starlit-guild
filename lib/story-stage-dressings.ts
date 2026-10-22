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
  return actors.filter((a) => a.dressed && a.visible !== false).map((a) => dressingItem(a.id));
}
