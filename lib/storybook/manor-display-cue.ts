import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";

function displayActor(actor: StageActor, items: StageItem[]): StageActor {
  const holding = items.some((item) => item.actor === actor.id);
  return {
    ...actor,
    ...(actor.id === "aria" && actor.x === 45 ? { x: 47 } : {}),
    carry: holding && !actor.writing,
    ...(actor.id === "leon"
      ? { wristPoints: { ...actor.wristPoints, 17: [83, 73], 18: [83, 73] } }
      : {}),
  };
}

function displayExtra(extra: StageExtra, items: StageItem[]): StageExtra {
  if (extra.id === "merchant" && extra.bottom === -55) return { ...extra, bottom: -70 };
  if (extra.id !== "worker") return extra;
  const key = items.find((item) => item.id === "case-key");
  const cloth = items.find((item) => item.id === "cover-cloth");
  return {
    ...extra,
    ...(extra.x === 64 && extra.bottom === 26
      ? { x: key?.bottom === 37 ? 65 : 70, bottom: 30 }
      : {}),
    writing: key?.bottom === 37,
    wiping: !!cloth?.extra && !extra.carry,
    wristPoints: { ...extra.wristPoints, 11: [33, 76], 13: [24, 54], 14: [24, 54] },
  };
}

function displayItem(item: StageItem): StageItem {
  const width = (
    { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7 } as Partial<
      Record<StageItem["art"], number>
    >
  )[item.art];
  if (width !== undefined) return { ...item, width };
  if (item.id === "tower-stone" && item.extra)
    return { ...item, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  if (item.id === "cover-cloth" && item.extra)
    return {
      ...item,
      art: "light-cloth",
      x: 0,
      bottom: 0,
      width: 6,
      wrist: true,
      wristAnchor: "top",
    };
  if (item.id === "light-sample")
    return { ...item, x: 0, bottom: 0, width: 2.8, wrist: true, wristAnchor: "top" };
  if (item.id === "shipping-copy")
    return { ...item, x: 0, bottom: 0, width: 3.5, wrist: true, wristAnchor: "bottom" };
  if (item.id === "case-key" && item.bottom === 37) return { ...item, stored: true };
  return item;
}

export function manorDisplayStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (moment: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    let items = moment.items ?? [];
    if (
      items.some((item) => item.id === "light-sample") &&
      !items.some((item) => item.id === "shipping-copy") &&
      !moment.actors.find((actor) => actor.id === "leon")?.writing
    ) {
      items = [
        ...items,
        {
          id: "shipping-copy",
          art: "paper",
          actor: "leon",
          x: 0,
          bottom: 0,
          width: 3.5,
          wrist: true,
          wristAnchor: "bottom",
        },
      ];
    }
    const prepared = nightStudyCue({ ...cue, actors: moment.actors });
    return {
      actors: prepared.actors.map((actor) => displayActor(actor, items)),
      items: items.map(displayItem),
      extras: moment.extras?.map((extra) => displayExtra(extra, items)),
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: cue.finishBeforeAdvance || !!cue.sequence?.length,
    sequence: cue.sequence?.map((step) => ({ ...step, ...adjust(step) })),
  };
}
