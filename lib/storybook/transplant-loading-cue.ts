import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { seedlingsStudyCue } from "./seedlings-cue.ts";
import { transplantReturnStudyCue } from "./transplant-return-cue.ts";
import { transplantNightStudyCue } from "./transplant-night-cue.ts";

/** Keep the established loading yard and the later road as separate camera setups. */
export function transplantStudyCue(cue: StoryStageCue, id: string, line: number) {
  if (id.endsWith("return")) return transplantReturnStudyCue(cue, line);
  return cue.background === "moss-beds"
    ? transplantLoadingStudyCue(cue, line)
    : transplantNightStudyCue(cue);
}
export function transplantLoadingStudyCue(cue: StoryStageCue, line = 0): StoryStageCue {
  const prepared = seedlingsStudyCue(cue);
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    ...s,
    actors: s.actors.map((a) => loadingActor(a, s.items ?? [])),
    items: (s.items ?? []).map((i) => loadingItem(i, s.actors)),
  });
  return {
    ...prepared,
    ...adjust(prepared),
    initial: { ...prepared.initial, finn: 30 },
    finishBeforeAdvance: !!cue.finishBeforeAdvance || !!cue.sequence?.length || line === 13,
    sequence: prepared.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}
function loadingActor(a: StageActor, items: StageItem[]): StageActor {
  if (a.id === "finn") return { ...a, x: 30, nameAbove: false, nameOffset: 0 };
  // She pauses at the path for her final reply; the night cut covers the visit.
  if (a.id === "mira" && a.bottom === -65) return { ...a, bottom: -15, via: undefined };
  if (a.id !== "leon") return a;
  const secondPlaced =
    a.inspect && items.filter((i) => i.art === "farm-hoe" && !i.actor).length === 2;
  return {
    ...a,
    x: a.inspect ? 50.5 : a.x,
    bottom: secondPlaced ? 0.6 : a.bottom,
    wristPoints: { ...a.wristPoints, 13: [78, 111], 14: [82, 76], 15: [82, 76], 16: [82, 76] },
  };
}
function loadingItem(i: StageItem, actors: StageActor[]): StageItem {
  if (i.art === "farm-hoe") return loadingHoe(i, !!actors.find((a) => a.id === "leon")?.inspect);
  if (i.id === "transplant-rope") return { ...i, width: 5, pitch: 55 };
  return i;
}
function loadingHoe(i: StageItem, crouched: boolean): StageItem {
  const second = i.id.endsWith("1");
  if (i.wrist) return { ...i, width: 5.5, wristOffset: { x: 0, bottom: -7 }, tilt: 0 };
  if (i.actor)
    return { ...i, width: 5.5, x: second ? -2.5 : -0.5, bottom: 24, tilt: crouched ? -28 : -12 };
  return {
    ...i,
    x: second ? 50 : 49.5,
    bottom: second ? 3.5 : 6.9,
    width: 5.5,
    tilt: 78,
    pitch: 55,
  };
}
