import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

/** Pick the sheet up before leaving the chair, then carry it to the signature. */
export function foundingSigningPickup(cue: StoryStageCue): StoryStageCue {
  const sheet = cue.items?.find((item) => item.id === "ledger" && item.support === "table");
  if (!sheet || !cue.sequence) return cue;
  const deskItems = cue.items ?? [];
  return {
    ...cue,
    sequence: [
      { after: 300, actors: actors(cue.actors, true), items: deskItems, extras: cue.extras },
      {
        after: 700,
        actors: actors(cue.actors, true),
        items: heldItems(deskItems, true),
        extras: cue.extras,
      },
      ...cue.sequence.map((step) => ({
        ...step,
        after: step.after + 1600,
        actors: actors(step.actors, false),
        items: heldItems(step.items, false),
      })),
    ],
  };
}

function actors(input: StageActor[], reaching: boolean): StageActor[] {
  return input.map((actor) =>
    actor.id !== "leon"
      ? actor
      : {
          ...actor,
          ...(reaching
            ? { seated: true, left: true, pose: "offer" as const, seatedPaper: "reach" as const }
            : {}),
          holdingWalk: true,
          wristPoints: {
            ...actor.wristPoints,
            29: [90, 66],
            5: [80, 78],
            8: [87, 69],
            9: [87, 69],
            22: [87, 69],
            23: [87, 69],
          },
        },
  );
}

function heldItems(items: StageItem[], reaching: boolean) {
  return items.map((item) => (item.id === "ledger" ? held(item, reaching) : item));
}

function held(item: StageItem, reaching: boolean): StageItem {
  return {
    ...item,
    actor: "leon",
    support: undefined,
    x: -4,
    bottom: 23,
    wrist: true,
    wristAnchor: "bottom",
    width: 3.5,
    resizeMs: 650,
    pitch: 0,
    grip: reaching ? "receiving" : "offering",
    wristOffset: reaching ? { x: 0.140625, bottom: 0 } : undefined,
    // The writing sprite contains the same sheet after the walk is complete.
    embeddedFrames: [17, 18],
  };
}
