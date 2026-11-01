import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";

function workshopActors(cue: StoryStageCue): StageActor[] {
  return nightStudyCue(cue).actors.map((actor) =>
    actor.id === "mira"
      ? {
          ...actor,
          wristPoints: {
            ...actor.wristPoints,
            4: [47, 80],
            14: [83, 74],
            15: [83, 74],
            16: [83, 74],
            8: [83, 74],
            9: [83, 74],
            22: [83, 74],
            23: [83, 74],
          },
        }
      : actor,
  );
}

function workshopItem(item: StageItem): StageItem {
  if (item.id === "medicine")
    return item.actor ? { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: undefined } : item;
  if (!item.actor) return item;
  if (item.art === "honey")
    return {
      ...item,
      width: 4,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "bottom",
      wristOffset: { x: 0, bottom: 1 },
    };
  if (item.id === "loot-cloth")
    return { ...item, width: 7, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  return item;
}

function workshopItems(items: StageItem[]) {
  const clothOwner = items.find((item) => item.id === "loot-cloth")?.actor;
  return items
    .filter((item) => !(clothOwner && item.art === "cloth" && item.actor === clothOwner))
    .map(workshopItem);
}

export function workshopStudyCue(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    actors: workshopActors(cue),
    items: cue.items && workshopItems(cue.items),
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: workshopActors({ ...cue, actors: step.actors }),
      items: workshopItems(step.items),
    })),
  };
}

/** The worker's painted notebook is part of the pose rather than a second floating prop. */
export function workshopCarrierCue(cue: StoryStageCue, line: number): StoryStageCue {
  const base = workshopStudyCue(cue);
  const extras = (cast?: StageExtra[]) =>
    cast?.map((extra) =>
      line >= 12 && line <= 14 && extra.id === "worker" && extra.x <= 100 && !extra.writing
        ? { ...extra, showNotebook: true }
        : extra,
    );
  const items = (props: StageItem[], after = 0) =>
    props
      .filter((item) => !(line >= 12 && line <= 16 && item.id === "carrier-record"))
      .map((item): StageItem => {
        // The struck puppet comes off the table and returns to the girl's side.
        // Keep that placement through the subsequent apology and the carrier's arrival.
        if (line >= 1 && line <= 16 && item.id === "puppet")
          return { ...item, x: 83, bottom: 60, travelMs: 850 };
        const grip = item.actor === "mira" && (line > 0 || after >= 5900) ? "receiving" : item.grip;
        if (item.art === "honey") return { ...item, width: 3, grip };
        if (item.id === "loot-cloth") return { ...item, width: 4.5, grip };
        if (item.id === "cloth" && item.actor === "mira")
          return { ...item, x: 0, bottom: 0, width: 4.5, wrist: true, wristAnchor: "bottom" };
        return item;
      });
  return {
    ...base,
    actors: workshopHandoffActors(base.actors, base.items ?? [], line),
    extras: extras(base.extras),
    items: base.items && items(base.items),
    sequence: base.sequence?.map((step) => ({
      ...step,
      actors: workshopHandoffActors(step.actors, step.items, line, step.after),
      extras: extras(step.extras),
      items: items(step.items, step.after),
    })),
  };
}

function workshopHandoffActors(
  cast: StageActor[],
  props: StageItem[],
  line: number,
  after = 0,
): StageActor[] {
  const holding = props.some(
    (item) => ["honey", "cloth"].includes(item.art) && item.actor === "mira",
  );
  return cast.map((actor) => {
    if (actor.id === "aria" && line === 0 && (after === 3000 || after === 5000))
      return { ...actor, x: 56.3671875, bottom: 45.26171875 };
    if (!holding || actor.id !== "mira") return actor;
    const reaching = line === 0 && after < 5900;
    const hand: [number, number] = reaching ? [93, 79] : [73, 84];
    return {
      ...actor,
      holdingWalk: true,
      mossStudy: reaching ? "reach" : undefined,
      wristPoints: {
        ...actor.wristPoints,
        4: hand,
        14: hand,
        15: hand,
        16: hand,
        8: [72, 83],
        9: [73, 83],
        22: [72, 83],
        23: [71, 83],
      },
    };
  });
}
