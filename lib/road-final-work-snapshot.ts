import type { Squad } from "./game.ts";

/** A rendering snapshot can finish its last work without mutating the saved run. */
export function finalWorkSnapshot(squad: Squad, finalizing: boolean): Squad {
  const run = squad.run;
  if (!finalizing || !run) return squad;
  return {
    ...squad,
    run: {
      ...run,
      node: run.nodes - 1,
      phase: "work",
      enemies: [],
      road: run.road && {
        ...run.road,
        members: Object.fromEntries(
          Object.entries(run.road.members).map(([id, position]) => [
            id,
            { ...position, walking: false, previousX: position.x },
          ]),
        ),
      },
    },
  };
}
