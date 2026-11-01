import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { mossBedsStudyCue } from "./moss-beds-cue.ts";
import { transplantTowerState } from "./transplant-tower.ts";
import { transplantVisitState } from "./transplant-visit.ts";
import { transplantDrainFlow } from "./transplant-drain-flow.ts";

/** Preserve the three distinct places; all motions and props use the painted registration. */
export function transplantReturnStudyCue(cue: StoryStageCue, line = -1): StoryStageCue {
  const prepared = mossBedsStudyCue(cue);
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    if (cue.background === "tower-foot") return transplantTowerState(s);
    if (cue.background !== "new-moss-beds")
      return transplantVisitState(s, cue.background === "village-house");
    return { ...s, actors: s.actors.map(bedActor), items: (s.items ?? []).map(bedItem) };
  };
  const state = adjust(prepared);
  const result = {
    ...prepared,
    ...state,
    initial: Object.fromEntries(
      state.actors.map((a) => [
        a.id,
        cue.cut && cue.background === "tower-foot" && a.id === "leon" ? 35 : a.x,
      ]),
    ),
    initialBottom: Object.fromEntries(
      state.actors.map((a) => [
        a.id,
        cue.cut && cue.background === "tower-foot" && a.id === "leon" ? 14 : a.bottom,
      ]),
    ),
    sequence: prepared.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
  return cue.background === "tower-foot" ? transplantDrainFlow(result, line) : result;
}
function bedActor(a: StageActor): StageActor {
  if (a.id === "aria") return bedAria(a);
  if (a.id === "lico") return bedLico(a);
  if (a.id === "finn")
    return {
      ...a,
      x: 70,
      bottom: 25,
      holdingWalk: !!a.carry,
      wristPoints: { ...a.wristPoints, 13: [101, 111], 14: [80, 74], 15: [80, 74], 16: [80, 74] },
    };
  return a;
}
function bedAria(a: StageActor): StageActor {
  const leaving = a.x === 34;
  return {
    ...a,
    x: leaving ? 30 : 47.4296875,
    bottom: leaving ? 32 : 43.41796875,
    carry: false,
    nameAbove: true,
    nameOffset: leaving ? 0 : -25,
    pose: leaving ? a.pose : "offer",
    via: undefined,
    wristPoints: { ...a.wristPoints, 4: [88, 71], 16: [79, 76] },
  };
}
function bedLico(a: StageActor): StageActor {
  return {
    ...a,
    x: a.mossStudy === "write" ? 59 : 55,
    bottom: a.mossStudy === "spread" ? 57 : a.mossStudy === "write" ? 48 : 46.3125,
    nameOffset: -10,
    wristPoints: { ...a.wristPoints, 73: [91, 84] },
  };
}
function bedItem(i: StageItem): StageItem {
  if (i.id === "transplanted-moss") return { ...i, x: 52.6, bottom: 62, width: 3.3 };
  if (i.id === "return-basket")
    return i.actor ? square(i, 6) : { ...i, x: 64.5078125, bottom: 24.28515625, width: 6 };
  if (i.id === "dry-cloth")
    return i.actor
      ? { ...square(i, 2.8), wristAnchor: "bottom", wristOffset: undefined }
      : { ...i, x: 57, bottom: 54, width: 2.8 };
  return i;
}
function square(i: StageItem, width: number): StageItem {
  return {
    ...i,
    width,
    x: 0,
    bottom: 0,
    wrist: true,
    wristOffset: { x: 0, bottom: -width * 0.75 * (1 - 1 / 1.3) },
  };
}
