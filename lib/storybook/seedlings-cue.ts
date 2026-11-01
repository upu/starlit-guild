import type { StoryStageCue } from "../story-stage-cues.ts";
import { SEEDLING_SCENE_CELL } from "../seedling-scene-scale.ts";
import { mossBedsStudyCue } from "./moss-beds-cue.ts";
import { seedlingActor, seedlingVisitor } from "./seedlings-actors.ts";
import { seedlingItem, loadingReflector } from "./seedlings-items.ts";
import { seedlingPotPickup } from "./seedlings-pot-pickup.ts";

/** Loading takes place in the clear yard, with the nursery beyond its edge. */
export function seedlingsStudyCue(cue: StoryStageCue): StoryStageCue {
  const prepared = { ...mossBedsStudyCue(cue), cell: SEEDLING_SCENE_CELL };
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = s.items ?? [];
    return {
      actors: s.actors.map((a) => seedlingActor(a, items)),
      items: [
        ...items.map((i) => seedlingItem(i, items)),
        ...(items.some((i) => i.id === "loading-reflector") ? [] : [loadingReflector()]),
      ],
      extras: s.extras?.map((extra) => seedlingVisitor(extra, items)),
    };
  };
  return {
    ...prepared,
    ...adjust(prepared),
    sequence: seedlingPotPickup(prepared.sequence?.map((s) => ({ ...s, ...adjust(s) }))),
  };
}
