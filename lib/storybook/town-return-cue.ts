import type { StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { merchantPlacement } from "./merchant-placement.ts";

/** Return to the same warehouse, with the delivered stock cleared away. */
export function townReturnStudyCue(cue: StoryStageCue, line = Infinity): StoryStageCue {
  // Reuse the resting merchant, never the departure's box-placement sequence.
  const painted = merchantPlacement(cue, 1);
  const actors = (cast: StoryStageCue["actors"]) =>
    cast.map((actor) => ({
      ...actor,
      x:
        actor.id === "aria" && actor.x === 30
          ? 27
          : actor.id === "leon" && actor.x === 64
            ? 66
            : actor.x,
    }));
  const updated: StoryStageCue = {
    ...painted,
    initial: cue.initial ? { ...cue.initial, aria: 27, leon: 66 } : undefined,
    actors: actors(painted.actors),
    items: returnItems(),
    sequence: painted.sequence?.map((step) => ({
      ...step,
      actors: actors(step.actors),
    })),
  };
  if (line !== 0) return updated;
  const reaching = updated.actors.map((actor) =>
    actor.id === "aria"
      ? {
          ...actor,
          carry: true,
          pose: "idle" as const,
          wristPoints: { 14: [84, 76] as [number, number] },
        }
      : { ...actor, pose: "offer" as const },
  );
  return {
    ...updated,
    finishBeforeAdvance: true,
    actors: reaching,
    items: returnItems().map((item) =>
      item.id === "empty-wrap"
        ? { ...item, actor: "aria", x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" }
        : item.id === "delivery-receipts"
          ? { ...item, x: 60, tilt: -12 }
          : item,
    ),
    sequence: [
      {
        after: 550,
        actors: reaching,
        items: returnItems().map((item) =>
          item.id === "delivery-receipts" ? { ...item, x: 60, tilt: -12 } : item,
        ),
        extras: updated.extras,
      },
      { after: 1300, actors: reaching, items: returnItems(), extras: updated.extras },
      { after: 2050, actors: updated.actors, items: returnItems(), extras: updated.extras },
    ],
  };
}

function returnItems(): StageItem[] {
  return [
    { id: "delivery-table", art: "table", x: 46, bottom: 12, width: 30, stored: true },
    {
      id: "empty-wrap",
      art: "packing-cloth",
      x: 34.5,
      bottom: 28.5,
      width: 6,
      support: "delivery-table",
    },
    {
      id: "delivery-receipts",
      art: "receipt-front",
      x: 58.5,
      bottom: 28.5,
      width: 3,
      tilt: -3,
      support: "delivery-table",
    },
  ];
}
