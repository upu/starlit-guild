import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

const picnic = (id: string) => id.startsWith("hilltop-picnic-");
const packing = (id: string) => id.startsWith("medicine-packing-");

function picnicActor(actor: StageActor): StageActor {
  if (actor.snackAction) return actor;
  const wristPoints = { ...actor.wristPoints };
  const hold: [number, number] = actor.id === "aria" ? [86, 76] : [82, 72];
  const walk: [number, number] = actor.id === "aria" ? [84, 70] : [89, 70];
  for (const frame of [14, 15, 16]) wristPoints[frame] = hold;
  for (const frame of [8, 9, 22, 23]) wristPoints[frame] = walk;
  const lap: [number, number] = actor.id === "aria" ? [68, 94] : [66, 94];
  for (const frame of [10, 11, 12]) wristPoints[frame] = lap;
  return { ...actor, wristPoints };
}

function registeredActor(actor: StageActor, id: string): StageActor {
  if (["hilltop-picnic-departure", "hilltop-picnic-return", "old-waterway-departure"].includes(id))
    return picnicActor(actor);
  const wristPoints = { ...actor.wristPoints };
  const packingPoints: Partial<Record<StageActor["id"], StageActor["wristPoints"]>> = {
    aria: { 24: [66, 86], 26: [68, 87], 27: [66, 84], 19: [59, 65], 20: [59, 65] },
    leon: { 17: [81, 76], 18: [81, 76] },
  };
  if (packing(id)) return { ...actor, wristPoints: { ...wristPoints, ...packingPoints[actor.id] } };
  if (id === "waiting-households-return" && actor.id === "mira") wristPoints[27] = [69, 91];
  return { ...actor, wristPoints };
}

function packingItem(item: StageItem, actors: StageActor[]): StageItem {
  if (item.art === "ledger") return { ...item, width: 4.5, x: 0, bottom: 0, wrist: true };
  if (item.art === "delivery-bag")
    return {
      ...item,
      width: 6,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: actors.find((a) => a.id === item.actor)?.shoulder ? "top" : undefined,
    };
  return item;
}

function heldItem(item: StageItem, actors: StageActor[], id: string): StageItem {
  if (!item.actor) return item;
  if (packing(id)) return packingItem(item, actors);
  if (id === "old-waterway-departure" && item.art === "moss")
    return { ...item, width: item.width ?? 6, x: 0, bottom: 0, wrist: true };
  if (picnic(id) && ["bread", "cloth"].includes(item.art))
    return { ...item, x: 0, bottom: 0, wrist: true };
  return item;
}

/** Contacts for shared poses, applied after the scene's authored movement. */
export function sharedPoseContacts(cue: StoryStageCue, id: string): StoryStageCue {
  if (
    !picnic(id) &&
    !packing(id) &&
    !["waiting-households-return", "old-waterway-departure"].includes(id)
  )
    return cue;
  const actors = cue.actors.map((actor) => registeredActor(actor, id));
  return {
    ...cue,
    actors,
    items: cue.items?.map((item) => heldItem(item, actors, id)),
    sequence: cue.sequence?.map((step) => {
      const cast = step.actors.map((actor) => registeredActor(actor, id));
      return { ...step, actors: cast, items: step.items.map((item) => heldItem(item, cast, id)) };
    }),
  };
}
