import type { StoryStageCue, StageExtra, StageItem } from "../story-stage-cues.ts";
import { cartDriver, cartItem, scaledTrailItem } from "./moss-trail-cue.ts";

export function mossSecondDayStudyCue(cue: StoryStageCue): StoryStageCue {
  const tower = cue.background === "brekka-tower-path";
  const pursuit = tower || cue.background === "brekka-fork";
  const adjust = (s: Pick<StoryStageCue, "actors" | "extras" | "items">) => ({
    actors: s.actors.map((a) =>
      a.id === "finn" && a.bottom === 80 && a.pose === "greet" ? { ...a, left: true } : a,
    ),
    extras: s.extras?.map((e) => cartDriver(lowerCart(e, tower))),
    items: (s.items ?? []).map((i) => {
      const lowered = lowerItem(i, tower);
      const driver = s.extras?.find((extra) => extra.pullCart);
      return pursuit
        ? scaledTrailItem(lowered, lowerCart(driver ?? { id: "worker", x: 0 }, tower).bottom ?? 23)
        : cartItem(lowered);
    }),
  });
  return {
    ...cue,
    ...adjust(cue),
    cell: pursuit ? (cue.cell ?? 24) * 0.75 : cue.cell,
    finishBeforeAdvance: !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}
function lowerCart(e: StageExtra, tower: boolean): StageExtra {
  // The cart takes the lower road around the retaining wall; walkers use the stairs.
  return tower && e.pullCart && e.bottom === 0 ? { ...e, bottom: -20 } : e;
}
function lowerItem(i: StageItem, tower: boolean): StageItem {
  return tower && i.art === "basket-cart" && i.bottom === 4.3 ? { ...i, bottom: i.bottom - 20 } : i;
}
