import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { waterwayBankInspection } from "./waterway-bank-inspection.ts";
import { waterwayHatchMark } from "./waterway-hatch-mark.ts";

const basketOnBank: StageItem = {
  id: "basket",
  art: "basket",
  x: 51.3,
  bottom: 6,
  width: 8,
  travelMs: 450,
};
const returnedCloth: StageItem = {
  id: "cloth",
  art: "cloth",
  x: 0,
  bottom: 0,
  actor: "aria",
  width: 5,
  wrist: true,
  wristAnchor: "bottom",
};
const tools: StageItem = { id: "tools", art: "tools", x: 28, bottom: 72, width: 8 };

/** Keep the basket beside the same dry foothold throughout the return conversation. */
export function waterwayReturnCue(cue: StoryStageCue, line: number): StoryStageCue {
  const clearBasketLabel = (actors: StageActor[]) =>
    actors.map((actor) =>
      actor.id === "leon" ? { ...actor, nameOffset: actor.x < 55 ? 40 : 16 } : actor,
    );
  const items = (items: StoryStageCue["items"]) => [
    ...(items ?? [])
      .filter((item) => item.art !== "tools")
      .map((item) => (item.art === "basket" && !item.actor ? basketOnBank : item)),
    tools,
  ];
  const onBank = {
    ...cue,
    actors: clearBasketLabel(cue.actors),
    items: items(cue.items),
    sequence: cue.sequence?.map((beat) => ({
      ...beat,
      actors: clearBasketLabel(beat.actors),
      items: items(beat.items),
    })),
  };
  return waterwayHatchMark(
    waterwayBankInspection(line === 16 ? liftBasket(onBank) : onBank, line),
    line,
  );
}

function pickupActors(
  cue: StoryStageCue,
  phase: "cloth" | "stow" | "approach" | "low" | "lift" | "held",
) {
  return cue.actors.map((actor): StageActor => ({
    ...actor,
    x: actor.id === "aria" ? 44 : 57,
    bottom: phase === "cloth" || phase === "stow" ? 14 : 2,
    left: actor.id === "leon",
    pose: "idle",
    inspect: phase === "low",
    carry:
      phase === "lift" ||
      (phase === "held" ? actor.id === "leon" : phase === "cloth" && actor.id === "aria"),
    wristPoints: {
      ...actor.wristPoints,
      13: actor.id === "leon" ? [87, 110] : [78, 109],
    },
  }));
}

function liftBasket(cue: StoryStageCue): StoryStageCue {
  const low: StageItem = {
    ...basketOnBank,
    x: 0,
    bottom: 0,
    actor: "leon",
    wrist: true,
    wristAnchor: "bottom",
    // Registered low palm meets the grounded basket before either actor stands.
    wristOffset: { x: 1.3875, bottom: -1.0625 },
  };
  // The side handles are above the bowl: the basket hangs below the gripping hands.
  const held: StageItem = { ...low, wristOffset: { x: 2.325, bottom: -7 } };
  const state = (
    phase: Parameters<typeof pickupActors>[1],
    basket: StageItem,
    cloth?: StageItem,
  ) => ({
    actors: pickupActors(cue, phase),
    items: [basket, tools, ...(cloth ? [cloth] : [])],
    extras: cue.extras,
  });
  return {
    ...cue,
    ...state("cloth", basketOnBank, returnedCloth),
    finishBeforeAdvance: true,
    sequence: [
      { after: 350, ...state("stow", basketOnBank, returnedCloth) },
      { after: 750, ...state("approach", basketOnBank) },
      { after: 1150, ...state("low", basketOnBank) },
      { after: 1550, ...state("low", low) },
      { after: 2100, ...state("lift", held) },
      { after: 2700, ...state("held", held) },
      { after: 3300, ...state("held", held) },
    ],
  };
}

/** Leave the bank along the open foreground after the final dialogue tap. */
export function waterwayReturnExitCue(cue: StoryStageCue): StoryStageCue {
  const settled = waterwayReturnCue(cue, 16).sequence?.at(-1);
  if (!settled) return cue;
  return {
    ...cue,
    items: settled.items,
    extras: settled.extras,
    actors: settled.actors.map((actor) => ({
      ...actor,
      x: actor.id === "aria" ? -25 : -12,
      bottom: 14,
      left: true,
      via: [
        { x: actor.x, bottom: 14 },
        { x: 5 + (actor.id === "aria" ? 0 : 13), bottom: 14 },
      ],
    })),
  };
}
