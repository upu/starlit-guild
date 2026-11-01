import type { StoryStageCue } from "../story-stage-cues.ts";

/** Bring both registered palms together before changing the cloth's owner. */
export function forestClothReturn(cue: StoryStageCue): StoryStageCue {
  const close = cue.actors.map((actor) =>
    actor.id === "leon" ? { ...actor, x: 49.5, left: true } : { ...actor, left: false },
  );
  const before =
    cue.items?.map((item) => {
      if (item.art === "cloth") return { ...item, actor: "aria" as const };
      return item.art === "moss-jar" ? { ...item, wristOffset: { x: 0, bottom: 3 } } : item;
    }) ?? [];
  return {
    ...cue,
    finishBeforeAdvance: true,
    actors: close,
    items: before,
    sequence: [
      { after: 900, actors: close, items: cue.items ?? [] },
      { after: 1700, actors: cue.actors, items: cue.items ?? [] },
    ],
  };
}

/** Meet again before Aria takes the cloth back for the forest floor. */
export function forestClothBorrow(cue: StoryStageCue): StoryStageCue {
  const pixel = (cue.cell ?? 24) / 128;
  const close = cue.actors.map((actor) =>
    actor.id === "leon"
      ? {
          ...actor,
          x: 41 + 40 * pixel,
          bottom: 14 - 4 * pixel * 1.5,
          left: true,
          carry: true,
          nameOffset: 12,
        }
      : { ...actor, x: 41, left: false, carry: true, nameOffset: -12 },
  );
  const before =
    cue.items?.map((item) => {
      if (item.art === "cloth") return { ...item, actor: "leon" as const };
      return item.art === "moss-jar" ? { ...item, wristOffset: { x: 0, bottom: 0 } } : item;
    }) ?? [];
  return {
    ...cue,
    actors: close,
    items: before,
    finishBeforeAdvance: true,
    sequence: [
      { after: 900, actors: close, items: cue.items ?? [], extras: cue.extras },
      { after: 1700, actors: cue.actors, items: cue.items ?? [], extras: cue.extras },
    ],
  };
}
