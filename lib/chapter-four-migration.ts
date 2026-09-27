import { MOSS_TRAIL_QUEST, MOSS_TRAIL_SECOND_DAY_QUEST, MOSS_BEDS_QUEST } from "./chapter-four.ts";
import type { State, Squad } from "./game-types.ts";
import { nextEvent } from "./game-run.ts";
import { storyProgress } from "./stories.ts";

function hasOldPursuit(state: State) {
  return (
    state.done[MOSS_TRAIL_QUEST] ||
    state.story?.departed.includes(MOSS_TRAIL_QUEST) ||
    state.squads.some((squad) => squad.run?.quest === MOSS_TRAIL_QUEST)
  );
}
function carryReadThrough(state: State) {
  const story = (state.story ??= storyProgress(state));
  if (!state.done[MOSS_TRAIL_QUEST] || !story.read.includes(MOSS_TRAIL_QUEST + "-return")) return;
  state.done[MOSS_TRAIL_SECOND_DAY_QUEST] ||= 1;
  for (const list of [story.departed, story.completed])
    if (!list.includes(MOSS_TRAIL_SECOND_DAY_QUEST)) list.push(MOSS_TRAIL_SECOND_DAY_QUEST);
  for (const chapter of ["departure", "return"])
    if (!story.read.includes(MOSS_TRAIL_SECOND_DAY_QUEST + "-" + chapter))
      story.read.push(MOSS_TRAIL_SECOND_DAY_QUEST + "-" + chapter);
}
function restCompanions(squad: Squad) {
  const run = squad.run;
  if (run?.quest !== MOSS_TRAIL_QUEST) return;
  squad.members = ["aria", "leon"];
  run.actors = run.actors.filter((actor) => squad.members.includes(actor.hero));
  run.health = { aria: run.health.aria, leon: run.health.leon };
  if (run.road) run.road.members = { aria: run.road.members.aria, leon: run.road.members.leon };
  if (run.phase !== "rest") run.nextAt = nextEvent(run);
}
// Old local saves used one quest for both days. Preserve their read-through,
// rewards and expedition progress while leaving the two companions at the inn.
export function upgradeMossTrail(input: State): State {
  if (input.story?.mossTrailSplit || !hasOldPursuit(input)) return input;
  const state = structuredClone(input);
  (state.story ??= storyProgress(state)).mossTrailSplit = true;
  carryReadThrough(state);
  state.squads.forEach(restCompanions);
  return state;
}

// Finn is in town during the moss-bed survey. Keep existing progress and the
// three remaining companions' clocks and HP when resuming an older expedition.
export function upgradeMossBedsParty(input: State): State {
  if (!input.squads.some((sq) => sq.run?.quest === MOSS_BEDS_QUEST && sq.members.includes("finn")))
    return input;
  const state = structuredClone(input);
  for (const squad of state.squads) {
    const run = squad.run;
    if (run?.quest !== MOSS_BEDS_QUEST || !squad.members.includes("finn")) continue;
    squad.members = squad.members.filter((id) => id !== "finn");
    run.actors = run.actors.filter((actor) => actor.hero !== "finn");
    delete run.health.finn;
    if (run.road) delete run.road.members.finn;
    if (run.phase !== "rest") run.nextAt = nextEvent(run);
  }
  return state;
}
