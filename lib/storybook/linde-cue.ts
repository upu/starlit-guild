import type { StoryStageCue } from "../story-stage-cues.ts";
import { lindeActor, lindeExtra } from "./linde-actors.ts";
import { lindeItem } from "./linde-items.ts";
import { lindeRise } from "./linde-transitions.ts";
export function lindeStudyCue(cue: StoryStageCue, rise = false): StoryStageCue {
  if (rise) cue = lindeRise(cue);
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) => lindeActor(a, s.items ?? [])),
    items: (s.items ?? []).map(lindeItem),
    extras: s.extras?.map((e) => lindeExtra(e, s.items ?? [])),
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance:
      cue.finishBeforeAdvance || !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}
