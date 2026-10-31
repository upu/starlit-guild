import type { StageActor, StageItem, StageMoment, StoryStageCue } from "../story-stage-cues.ts";

function overlookActor(a: StageActor, items: StageItem[]): StageActor {
  if (a.id === "finn")
    return {
      ...a,
      pose: items.some((i) => i.id === "shipping-receipt") ? "offer" : a.pose,
      nameAbove: !!a.seated,
      wristPoints: { ...a.wristPoints, 40: [73, 88], 41: [91, 81], 42: [91, 81], 43: [73, 88] },
    };
  return a.id === "leon" && a.x === 67
    ? { ...a, x: 66.45, bottom: 24, wristPoints: { ...a.wristPoints, 4: [90, 62.666667] } }
    : a;
}
function overlookItem(i: StageItem): StageItem {
  if (i.art === "medicine-closed") return { ...i, x: 37, bottom: 7 };
  if (i.art === "delivery-bag") return { ...i, x: 49, bottom: 7 };
  if (i.id === "shipping-receipt")
    return { ...i, x: 0, bottom: 0, width: 3.8, wrist: true, wristAnchor: "bottom" };
  return i.id === "seat-finn" ? { ...i, width: 8.5, bottom: 25.5 } : i;
}
export function overlookStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (s: Pick<StoryStageCue, "actors" | "items">) => ({
    actors: s.actors.map((a) => overlookActor(a, s.items ?? [])),
    items: s.items?.map(overlookItem),
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: seating(
      cue.sequence?.map((s) => ({ ...s, ...adjust(s), items: s.items.map(overlookItem) })),
    ),
  };
}
function seating(steps?: StageMoment[]) {
  const sit = steps?.find((s) => s.after === 650);
  if (!sit) return steps;
  const phase = (after: number, seatTransition: "lower" | "settle"): StageMoment => ({
    ...sit,
    after,
    actors: sit.actors.map((a) => (a.id === "finn" ? { ...a, seated: false, seatTransition } : a)),
  });
  return [phase(250, "lower"), phase(450, "settle"), ...(steps ?? [])];
}
