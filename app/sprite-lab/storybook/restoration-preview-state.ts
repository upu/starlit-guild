import type { State } from "@/lib/game";

type Run = State["squads"][number]["run"];
export type StudySnapshot = { state: State | null; lastRun: Run };

export function forestPreviewFrozen(quest: string, painted: boolean, state: State | null) {
  return quest === "forest-wetland" && painted && !!state?.done[quest] && !state.squads[0].run;
}

/** Keep only a rendering snapshot; the real state always remains the completed one. */
export function updateStudySnapshot(previous: StudySnapshot, next: State): StudySnapshot {
  return {
    state: next,
    lastRun: next.squads[0].run ?? previous.state?.squads[0].run ?? previous.lastRun,
  };
}

export function restorationPreviewState(quest: string, snapshot: StudySnapshot, finished: boolean) {
  const { state, lastRun } = snapshot;
  if (
    ![
      "berne-restoration",
      "lantern-detour",
      "brekka-arrival",
      "glowing-moss-trail",
      "glowing-moss-trail-next-day",
      "starlit-guild-founding",
      "town-deliveries",
      "tower-moss-removal",
      "forest-wetland",
    ].includes(quest) ||
    !state ||
    !state.done[quest] ||
    state.squads[0].run ||
    !lastRun ||
    (finished &&
      ![
        "glowing-moss-trail",
        "glowing-moss-trail-next-day",
        "starlit-guild-founding",
        "town-deliveries",
        "tower-moss-removal",
        "forest-wetland",
      ].includes(quest))
  )
    return state;
  return {
    ...state,
    squads: state.squads.map((squad, index) => (index === 0 ? { ...squad, run: lastRun } : squad)),
  };
}

export function visibleStudyState(
  quest: string,
  snapshot: StudySnapshot,
  finished: boolean,
  painted: boolean,
) {
  if (
    !painted &&
    [
      "glowing-moss-trail",
      "glowing-moss-trail-next-day",
      "starlit-guild-founding",
      "town-deliveries",
      "tower-moss-removal",
      "forest-wetland",
    ].includes(quest)
  )
    return snapshot.state;
  return restorationPreviewState(
    quest,
    snapshot,
    finished ||
      (!painted && ["lantern-detour", "brekka-arrival", "glowing-moss-trail"].includes(quest)),
  );
}
