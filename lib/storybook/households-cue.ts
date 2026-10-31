import type { StoryStageCue, StageMoment } from "../story-stage-cues.ts";
import { workshopStudyCue } from "./workshop-cue.ts";
import {
  householdActor,
  householdExtras,
  householdItem,
  householdStart,
} from "./household-contacts.ts";
import { homewardStudyCue } from "./homeward-cue.ts";

export const householdStories = [
  "waiting-households-departure",
  "waiting-households-return",
  "medicine-road-home-departure",
];

export function householdStudyCue(cue: StoryStageCue, id: string, line: number): StoryStageCue {
  const registered = workshopStudyCue(cue);
  if (id === "medicine-road-home-departure") return homewardStudyCue(registered, line);
  const indoor = cue.background === "patient-room";
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) => householdActor(a, indoor)),
    items: s.items?.map((i) => householdItem(i, indoor)),
    extras: householdExtras(s.extras),
  });
  return {
    ...registered,
    ...adjust(registered),
    ...householdStart(registered, indoor),
    finishBeforeAdvance: !!registered.sequence?.length,
    sequence: householdTiming(
      registered.sequence?.map((s) => ({
        ...s,
        ...adjust(s),
        items: s.items.map((i) => householdItem(i, indoor)),
      })),
    ),
  };
}

function householdTiming(steps?: StageMoment[]) {
  return steps
    ?.filter((s) => s.after !== 800)
    .flatMap((s) => {
      if (s.after === 2000)
        return [
          {
            ...s,
            actors: s.actors.map((a) =>
              a.id === "aria" ? { ...a, x: 35, bottom: 32, via: undefined, carry: false } : a,
            ),
          },
          { ...s, after: 2600 },
        ];
      return [finishChoreStep(s)];
    });
}

function finishChoreStep(s: StageMoment): StageMoment {
  return {
    ...s,
    after: s.after === 3800 ? 5000 : s.after === 4700 ? 5900 : s.after,
    actors: s.actors.map((a) => (s.after >= 3300 && a.id === "leon" ? { ...a, pose: "idle" } : a)),
    extras: s.extras?.map((e) =>
      s.after === 4700 && e.id === "cook" ? { ...e, grip: undefined } : e,
    ),
  };
}
