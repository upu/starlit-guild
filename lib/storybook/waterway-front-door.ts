import type { StageExtra, StageMoment, StoryStageCue } from "../story-stage-cues.ts";

export const frontKeeper: StageExtra = { id: "keeper", x: 77, bottom: 30, left: false };
// The camera exposes the doorway to the right of the original world coordinates.
export const insideTower: StageExtra = {
  ...frontKeeper,
  insideCamera: true,
  x: 108,
  bottom: 62,
};
export function enteringTower(after: number): Pick<StageMoment, "extras" | "scenery"> {
  if (after < 350) return { extras: [frontKeeper] };
  if (after >= 2900) return { extras: [] };
  return {
    scenery: "tower-door-open",
    extras: [
      {
        ...insideTower,
        via: [
          { x: 86, bottom: 35 },
          { x: 99, bottom: 50 },
        ],
      },
    ],
  };
}

export function keeperReturns(cue: StoryStageCue): StoryStageCue {
  const state = (after: number, extras: StageExtra[], open = true): StageMoment => ({
    after,
    actors: cue.actors,
    items: cue.items ?? [],
    extras,
    scenery: open ? "tower-door-open" : undefined,
  });
  return {
    ...cue,
    extras: [],
    finishBeforeAdvance: true,
    sequence: [
      state(350, []),
      state(700, [insideTower]),
      state(1200, [
        {
          ...frontKeeper,
          via: [
            { x: 99, bottom: 50 },
            { x: 86, bottom: 35 },
          ],
        },
      ]),
      state(3650, [{ ...frontKeeper, towerSignal: "look" }]),
      state(4100, [{ ...frontKeeper, towerSignal: "point" }]),
    ],
  };
}
