import type { RoadLook } from "./road-look.ts";
import type { RoadBattle } from "./road-view.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
export function interruptedFoundingFrame(
  frame: Frame,
  dropped: boolean,
  returning: boolean,
  hasRecipient: boolean,
): Frame {
  if (!frame.look.foundingDraft || (!dropped && !returning && !hasRecipient)) return frame;
  return {
    look: {
      ...frame.look,
      foundingDraft: {
        ...frame.look.foundingDraft,
        cue: dropped ? "dropped" : returning ? "recipient-wait" : "recipient-shelter",
      },
    },
    battle: {
      ...frame.battle,
      gathering: null,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: false },
    },
  };
}
