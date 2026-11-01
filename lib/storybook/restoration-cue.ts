import type { StoryStageCue } from "../story-stage-cues.ts";
import { restorationActor, restorationExtra } from "./restoration-actors.ts";
import { restorationItem } from "./restoration-items.ts";
export function restorationStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map(restorationActor),
    items: (s.items ?? []).map((i) => restorationItem(i, s.extras?.map(restorationExtra))),
    extras: s.extras?.map(restorationExtra),
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance:
      cue.finishBeforeAdvance || !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}
