import type { StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

// In front of the keeper, beyond Leon's boots; never under the recipient's feet.
const groundBasket: StageItem = {
  id: "basket",
  art: "basket",
  x: 63.75,
  bottom: 14,
  width: 8,
  travelMs: 450,
};
const keeperHand: StageExtra["wristPoints"] = { 20: [36, 116], 21: [40, 95], 22: [32, 74] };

export function waterwayBasketHandoffCue(cue: StoryStageCue, line: number): StoryStageCue {
  if (line < 6) return { ...cue, items: replaceBasket(cue, groundBasket) };
  if (line > 6)
    return {
      ...cue,
      extras: keeperAt(cue, "idle", 73, 23),
    };
  return passBasket(cue);
}

function replaceBasket(cue: StoryStageCue, basket: StageItem) {
  return [...(cue.items ?? []).filter((item) => item.art !== "basket"), basket];
}

function keeperAt(
  cue: StoryStageCue,
  action: StageExtra["basketHandoff"],
  x: number,
  bottom: number,
) {
  return cue.extras?.map((extra) =>
    extra.id === "keeper"
      ? { ...extra, x, bottom, left: false, basketHandoff: action, wristPoints: keeperHand }
      : extra,
  );
}

function passBasket(cue: StoryStageCue): StoryStageCue {
  const actors = (phase: "wait" | "reach" | "take" | "return") =>
    cue.actors.map((actor) =>
      actor.id === "leon"
        ? {
            ...actor,
            x: 57,
            bottom: 14,
            via: phase === "wait" ? [{ x: 57, bottom: 8 }] : undefined,
            left: phase === "return",
            carry: phase === "take" || phase === "return",
            pose: phase === "wait" ? ("think" as const) : ("offer" as const),
          }
        : actor,
    );
  const held: StageItem = {
    ...groundBasket,
    x: 0,
    bottom: 0,
    extra: "keeper",
    wrist: true,
    wristAnchor: "bottom",
    wristOffset: { x: -2, bottom: 0 },
  };
  const received: StageItem = {
    ...held,
    extra: undefined,
    actor: "leon",
    wristOffset: { x: 2, bottom: 0 },
  };
  const floor = replaceBasket(cue, groundBasket),
    supporting = replaceBasket(cue, held),
    taken = replaceBasket(cue, received);
  const pickup = keeperAt(cue, "reach", 71, 14),
    lifted = keeperAt(cue, "lift", 71, 14),
    offered = keeperAt(cue, "offer", 71, 14);
  const returned = keeperAt(cue, "idle", 73, 23);
  return {
    ...cue,
    actors: actors("wait"),
    items: floor,
    extras: keeperAt(cue, "idle", 71, 14),
    finishBeforeAdvance: true,
    sequence: [
      { after: 600, actors: actors("wait"), items: floor, extras: pickup },
      { after: 1000, actors: actors("wait"), items: supporting, extras: pickup },
      { after: 1450, actors: actors("wait"), items: supporting, extras: lifted },
      { after: 1950, actors: actors("wait"), items: supporting, extras: offered },
      { after: 2250, actors: actors("reach"), items: supporting, extras: offered },
      { after: 2650, actors: actors("take"), items: taken, extras: offered },
      { after: 3250, actors: actors("return"), items: taken, extras: returned },
      { after: 3900, actors: actors("return"), items: taken, extras: returned },
    ],
  };
}
