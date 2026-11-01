import type { StoryStageCue, StageItem } from "../story-stage-cues.ts";
import { waterwayHatchOpening } from "./waterway-hatch-opening.ts";

/** Work beside the stone bank; the collected portion stays inside its basket. */
export function mossCollectionCue(
  cue: StoryStageCue,
  line: number,
  exiting = false,
): StoryStageCue {
  const collecting = line >= 7 && !exiting;
  const holding = line >= 9;
  const items = (cue.items ?? [])
    .filter((item) => !["collected", "remaining"].includes(item.id))
    .map((item): StageItem => {
      if (item.art === "basket")
        return holding
          ? {
              ...item,
              actor: "leon",
              x: 0,
              bottom: 0,
              width: 8,
              wrist: true,
              wristAnchor: "bottom",
              wristOffset: { x: 0, bottom: -3 },
            }
          : { ...item, actor: undefined, x: 61, bottom: 43, width: 8 };
      if (item.art === "spatula")
        return { ...item, x: 0, bottom: 0, width: 2.5, wrist: true, wristAnchor: "bottom" };
      return item;
    });
  if (line >= 10)
    items.push({
      id: "collected",
      art: "colony",
      carrier: "basket",
      x: 0,
      bottom: 2.2,
      width: 4.5,
      glow: "dim",
    });
  if (line < 7) items.push({ id: "spatula", art: "spatula", x: 66, bottom: 43, width: 2.5 });
  const result: StoryStageCue = {
    ...cue,
    items,
    extras: cue.extras?.map((extra) =>
      extra.id === "keeper" ? { ...extra, x: 43, bottom: 24 } : extra,
    ),
    actors: cue.actors.map((actor) => ({
      ...actor,
      ...(collecting
        ? { x: actor.id === "aria" ? 60 : 69, bottom: actor.id === "aria" ? 62 : 47 }
        : {}),
      left: actor.id === "leon",
      carry: actor.id === "leon" && holding,
      wristPoints: { ...actor.wristPoints, 13: [90, 110] },
    })),
  };
  return waterwayHatchOpening(collectionMotion(result, line, exiting), line);
}

function collectionMotion(cue: StoryStageCue, line: number, exiting: boolean): StoryStageCue {
  if (exiting) return cue;
  if (line === 10) return collectPortion(cue);
  if (line !== 7) return cue;
  return {
    ...cue,
    finishBeforeAdvance: true,
    actors: cue.actors.map((actor) => ({
      ...actor,
      via:
        actor.id === "aria"
          ? [
              { x: 32, bottom: 54 },
              { x: 60, bottom: 54 },
            ]
          : [
              { x: 74, bottom: 24 },
              { x: 74, bottom: 47 },
            ],
    })),
  };
}

function collectPortion(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    finishBeforeAdvance: true,
    items: cue.items?.map((item) =>
      item.id === "collected"
        ? { ...item, carrier: undefined, x: 65.5, bottom: 66, width: 2.5 }
        : item,
    ),
    sequence: [{ after: 550, actors: cue.actors, items: cue.items ?? [], extras: cue.extras }],
  };
}
