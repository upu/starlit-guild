import { allQuests, heroes, type Action, type State } from "@/lib/game";
import { stageEndingPending } from "@/lib/prologue";
import { journeyBanter, stories } from "@/lib/stories";
import type { PhoneFrameModel, Sheet } from "../../../phone-game-types";

export function studyModel(
  state: State,
  view: string,
  sheet: Sheet,
  dispatch: (action: Action) => boolean,
  setView: (view: string) => void,
  setSheet: (sheet: Sheet) => void,
  questId = "berne-restoration",
) {
  const squad = state.squads[0],
    pending = stageEndingPending(state);
  return {
    state,
    squad,
    run: squad.run,
    clock: state.updatedAt,
    ready: true,
    quest: allQuests.find((item) => item.id === questId),
    hero: heroes[0],
    roster: heroes,
    game: { profile: undefined, error: "", otherTab: false },
    hints: { unread: false },
    ending: pending ? (stories.find((story) => story.id === pending + "-return") ?? null) : null,
    banter: journeyBanter(state, squad, state.updatedAt),
    quote: "",
    view,
    sheet,
    reading: null,
    destinationChosen: true,
    returnIntent: null,
    act: dispatch,
    readStory: (id: string) => dispatch({ type: "readStory", id }),
    setView,
    navigate: setView,
    setSheet,
    openQuests: () => {},
    requestReturn: () => {},
    setReturnIntent: () => {},
    confirmReturn: () => {},
    openStory: () => {},
  } as unknown as PhoneFrameModel;
}
