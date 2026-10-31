import type { StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { workshopStudyCue } from "./workshop-cue.ts";

export function blockadeForkStudyCue(cue: StoryStageCue, line = Infinity): StoryStageCue {
  const painted = workshopStudyCue(cue);
  const extras = (cast?: StageExtra[]) => forkExtras(cast, line);
  const items = (props: StageItem[]) =>
    props.map((item): StageItem => {
      if (item.art === "signpost-portable" && item.actor === "leon")
        return {
          ...item,
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "bottom",
          tilt: -75,
          wristOffset: { x: 0, bottom: -9 },
        };
      if (item.art === "honey")
        return {
          ...item,
          width: 3,
          wristOffset: item.actor ? { x: 0, bottom: 0.5 } : item.wristOffset,
        };
      if (item.id === "loot-cloth")
        return {
          ...item,
          width: 5,
          wristOffset: item.actor ? { x: 0, bottom: -2.8 } : item.wristOffset,
        };
      if (item.id === "bandage" && item.actor === "aria")
        return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
      return roadBag(roadCargo(handoffPuppet(medicineCarry(item), line)), line);
    });
  return {
    ...painted,
    actors: clearCartPath(painted.actors, line),
    initial: line < 22 ? { ...painted.initial, mira: 64 } : painted.initial,
    initialBottom: line < 22 ? { ...painted.initialBottom, mira: 32 } : painted.initialBottom,
    extras: extras(painted.extras),
    items: painted.items && items(painted.items),
    sequence: settlePost(
      painted.sequence?.map((step) => ({
        ...step,
        actors: clearCartPath(step.actors, line),
        items: items(step.items),
        extras: extras(step.extras),
      })),
      line,
    ),
  };
}

function forkExtras(cast: StageExtra[] | undefined, line: number) {
  return cast?.map((extra) => {
    if (extra.id === "worker" && line === 17 && extra.carry)
      return { ...extra, x: 20, carry: false, pose: "point" as const };
    if (extra.id !== "worker" || line < 20 || !(extra.x === 13.5 || extra.x > 100)) return extra;
    return {
      ...extra,
      x: extra.x === 13.5 ? 16.9 : extra.x,
      bottom: 11.5,
      pullCart: !!extra.carry,
      via: extra.via?.map((point) => (point.x === 13.5 ? { ...point, x: 16.9 } : point)),
    };
  });
}

function medicineCarry(item: StageItem): StageItem {
  return item.id === "medicine" && item.actor
    ? { ...item, wristOffset: { x: 0, bottom: -6.5 } }
    : item;
}

function clearCartPath(actors: StoryStageCue["actors"], line: number) {
  return actors.map((actor) => {
    if (actor.id === "mira" && line < 22) return { ...actor, x: 64, bottom: 32 };
    if (actor.id === "aria" && actor.x === 60 && actor.bottom === 23)
      return { ...actor, x: 62, bottom: 25.6 };
    if (actor.id === "mira" && actor.seated)
      return {
        ...actor,
        wristPoints: {
          ...actor.wristPoints,
          10: [86, 94] as [number, number],
          11: [86, 94] as [number, number],
          12: [86, 94] as [number, number],
        },
      };
    return actor.id === "aria" && line === 30 && actor.x === 62.03125
      ? { ...actor, bottom: 25.6 }
      : actor;
  });
}

function roadBag(item: StageItem, line: number): StageItem {
  if (!["honey-bag", "honey-bag-open"].includes(item.art)) return item;
  if (item.actor === "mira" && item.x > 0)
    return {
      ...item,
      width: 6,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 1.8 },
    };
  return item.actor === "mira" && line < 22
    ? { ...item, width: 6, behindOwner: true, x: -3, bottom: 20.5 }
    : { ...item, width: 6 };
}

function handoffPuppet(item: StageItem, line: number): StageItem {
  // Leave the puppet visible beside Leon while the pole stays between them.
  if (line !== 17) return item;
  if (item.id === "puppet" && item.x === 36) return { ...item, x: 30 };
  return item.art === "signpost-portable" && item.carrier === "puppet" ? { ...item, x: 6 } : item;
}

function roadCargo(item: StageItem): StageItem {
  if (item.art === "signpost-portable" && item.carrier) return { ...item, tilt: -75 };
  if (item.id === "small-puppet" && item.carrier === "golem")
    return { ...item, x: -8, bottom: item.bottom === 15 ? 14 : item.bottom };
  // NPC-owned item.bottom is authored against that NPC's baseline, not added to it.
  if (item.art === "empty-cart" && item.extra === "worker") return { ...item, x: 13.1, bottom: 12 };
  return item.id === "other-goods" && item.carrier === "empty-cart"
    ? { ...item, bottom: 14 }
    : item;
}

function settlePost(sequence: StoryStageCue["sequence"], line: number) {
  if (line !== 17) return sequence;
  return sequence?.flatMap((step) =>
    step.after === 4000
      ? [
          {
            ...step,
            actors: step.actors.map((actor) =>
              actor.id === "leon" ? { ...actor, carry: true } : actor,
            ),
          },
          { ...step, after: 4700 },
        ]
      : [step],
  );
}
