import type { StageExtra, StoryStageCue } from "../story-stage-cues.ts";

function kitchenExtra(extra: StageExtra): StageExtra {
  return extra.id === "cook" && extra.x === 66 && extra.bottom === 28
    ? { ...extra, x: 71, bottom: 23 }
    : extra;
}

/** Register the doorway, shoulder contact, and luggage against the painted courtyard. */
export function manorDoorStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: moment.actors.map((actor) => {
      if (actor.id === "finn" && actor.bottom === 46) actor = { ...actor, bottom: 54 };
      const grip = moment.extras?.find((extra) => extra.id === "cook")?.grip;
      return actor.id === "finn" && grip
        ? { ...actor, left: false, ...(grip === "hold" ? { pose: "surprise" as const } : {}) }
        : actor;
    }),
    items: (moment.items ?? []).map((item) => ({
      ...item,
      width:
        (
          { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7 } as Partial<
            Record<typeof item.art, number>
          >
        )[item.art] ?? item.width,
    })),
    extras: moment.extras?.map(kitchenExtra),
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
