import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";

function yardActor(actor: StageActor, items: StageItem[]): StageActor {
  const holding = items.some((item) => item.actor === actor.id);
  if (actor.id === "finn")
    return {
      ...actor,
      carry: holding,
      carryWalkFrames: [8, 9, 22, 23],
      wristPoints: {
        ...actor.wristPoints,
        14: [75, 60],
        15: [75, 60],
        16: [75, 60],
        8: [75, 60],
        9: [75, 60],
        22: [75, 60],
        23: [75, 60],
      },
    };
  if (actor.id === "mira")
    return {
      ...actor,
      carry: holding && !actor.healing,
      wristPoints: { ...actor.wristPoints, 14: [73, 80], 15: [73, 80] },
    };
  return {
    ...actor,
    carry: holding && !actor.inspect,
    ...(actor.id === "aria" ? { wristPoints: { ...actor.wristPoints, 13: [89, 112] } } : {}),
  };
}

function yardExtra(extra: StageExtra): StageExtra {
  if (extra.id !== "stone-carrier") return extra;
  return {
    ...extra,
    wristPoints: { ...extra.wristPoints, 0: [54, 87], 1: [54, 87], 2: [54, 87], 3: [54, 87] },
  };
}

function yardItem(item: StageItem): StageItem {
  const width = (
    { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7 } as Partial<
      Record<StageItem["art"], number>
    >
  )[item.art];
  if (width !== undefined) return { ...item, width };
  if (item.id === "carrier-stone" && item.extra)
    return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  if (item.id === "comparison-cloth")
    return { ...item, x: 0, bottom: 0, width: 2.8, wrist: true, wristAnchor: "top" };
  if (item.id === "wrapping-cloth")
    return {
      ...item,
      width: 6,
      ...(item.actor ? { x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" as const } : {}),
    };
  if (item.art === "chair")
    return {
      ...item,
      width: 8.5,
      ...(item.actor
        ? {
            x: 0,
            bottom: 0,
            wrist: true,
            wristAnchor: "top" as const,
            wristOffset: { x: 4, bottom: 0 },
          }
        : {}),
    };
  return item;
}

export function stoneYardStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = moment.items ?? [];
    return {
      actors: nightStudyCue({ ...cue, actors: moment.actors }).actors.map((actor) =>
        yardActor(actor, items),
      ),
      items: items.map(yardItem),
      extras: moment.extras?.map(yardExtra),
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: chairPreparation(cue.sequence)?.map((step) => ({ ...step, ...adjust(step) })),
  };
}

function chairPreparation(sequence: StoryStageCue["sequence"]) {
  return sequence?.flatMap((step, index) => {
    const carried = step.items.some((item) => item.art === "chair" && item.actor === "finn");
    if (step.after === 3500 && carried) {
      const previous = sequence[index - 1];
      return [
        {
          ...step,
          after: 3300,
          items: previous.items,
          actors: step.actors.map((actor) =>
            actor.id === "finn" ? { ...actor, carry: false, inspect: true } : actor,
          ),
        },
        step,
      ];
    }
    if (step.after !== 5700 || !step.items.some((item) => item.id === "mira-chair")) return [step];
    return [
      {
        ...step,
        actors: step.actors.map((actor) =>
          actor.id === "finn" ? { ...actor, inspect: true } : actor,
        ),
      },
      {
        ...step,
        after: 6200,
        actors: step.actors.map((actor) =>
          actor.id === "finn" ? { ...actor, inspect: false } : actor,
        ),
      },
    ];
  });
}
