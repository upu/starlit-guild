import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { waterwayBasketHandoffCue } from "./waterway-basket-handoff.ts";
import { waterwayUnloadingCue } from "./waterway-unloading.ts";

const basketAtBank: StageItem = {
  id: "basket",
  art: "basket",
  x: 51.3,
  bottom: 18,
  width: 8,
  travelMs: 450,
};

/** The discussion moves from the tower entrance to the dry side of the outlet. */
export function waterwayRepairDepartureCue(cue: StoryStageCue, line: number): StoryStageCue {
  if (line < 9) return waterwayUnloadingCue(waterwayBasketHandoffCue(cue, line), line);
  const bank: StoryStageCue = {
    ...cue,
    background: "drain-blocked",
    cut: line === 9,
    initial: { aria: 57, leon: 45 },
    initialBottom: { aria: 18, leon: 18 },
    actors: cue.actors.map((actor) => ({
      ...actor,
      x: actor.id === "aria" ? 68 : 45,
      bottom: actor.id === "aria" ? 24 : 18,
      left: false,
      carry: false,
      inspect: false,
      routeNotes: actor.id === "leon" && line >= 11 && line <= 14 ? "read" : undefined,
      wristPoints: { ...actor.wristPoints, 13: [87, 110] },
    })),
    extras: cue.extras?.map((extra) => ({
      ...extra,
      x: extra.id === "keeper" ? 53 : 25,
      bottom: extra.id === "keeper" ? 44 : 28,
    })),
    items: [
      ...(cue.items ?? [])
        .filter((item) => item.art !== "basket")
        .map((item) => (item.art === "tools" ? { ...item, x: 17, bottom: 20, width: 9 } : item)),
      basketAtBank,
    ],
  };
  if (line === 9) return setDownBasket(bank);
  if (line === 11 || line === 14) return handleMap(bank, line === 11);
  return bank;
}

function setDownBasket(cue: StoryStageCue): StoryStageCue {
  const actors = (action: "carry" | "lower" | "rest") =>
    cue.actors.map((actor) => ({
      ...actor,
      carry: actor.id === "leon" && action === "carry",
      inspect: actor.id === "leon" && action === "lower",
    }));
  const held = (cue.items ?? []).map((item): StageItem =>
    item.id === "basket"
      ? {
          ...item,
          x: 0,
          bottom: 0,
          actor: "leon",
          wrist: true,
          wristAnchor: "bottom",
          wristOffset: { x: 2, bottom: 0 },
        }
      : item,
  );
  return {
    ...cue,
    actors: actors("carry"),
    items: held,
    finishBeforeAdvance: true,
    sequence: [
      { after: 600, actors: actors("lower"), items: held, extras: cue.extras },
      { after: 1200, actors: actors("lower"), items: cue.items ?? [], extras: cue.extras },
      { after: 1900, actors: actors("rest"), items: cue.items ?? [], extras: cue.extras },
    ],
  };
}

function handleMap(cue: StoryStageCue, opening: boolean): StoryStageCue {
  const actors = (routeNotes: StageActor["routeNotes"]) =>
    cue.actors.map((actor) => (actor.id === "leon" ? { ...actor, routeNotes } : actor));
  const state = { items: cue.items ?? [], extras: cue.extras };
  return {
    ...cue,
    actors: actors(opening ? "pocket" : "read"),
    finishBeforeAdvance: true,
    sequence: [
      { ...state, after: 450, actors: actors("fold") },
      { ...state, after: 900, actors: actors(opening ? "read" : "pocket") },
      ...(!opening ? [{ ...state, after: 1400, actors: actors(undefined) }] : []),
    ],
  };
}

/** Clear the basket and the wet bank, leaving along the open foreground. */
export function waterwayRepairExitCue(cue: StoryStageCue): StoryStageCue {
  const bank = waterwayRepairDepartureCue(cue, 15);
  return {
    ...bank,
    actors: bank.actors.map((actor) => ({
      ...actor,
      x: actor.id === "aria" ? -15 : -25,
      bottom: 20,
      left: true,
      via: [
        { x: actor.id === "aria" ? 68 : 45, bottom: 4 },
        { x: 5, bottom: 4 },
        { x: -5, bottom: 20 },
      ],
    })),
  };
}
