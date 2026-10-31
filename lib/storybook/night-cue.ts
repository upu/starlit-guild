import type { StoryStageCue, StageActor } from "../story-stage-cues.ts";

function nightActor(actor: StageActor): StageActor {
  const point: [number, number] = actor.id === "aria" ? [86, 76] : [82, 72];
  const walk: [number, number] = actor.id === "aria" ? [84, 70] : [89, 70];
  return {
    ...actor,
    carryWalkFrames: actor.shawl ? [4, 5, 6, 7] : [8, 9, 22, 23],
    wristPoints: {
      ...actor.wristPoints,
      14: point,
      15: point,
      16: point,
      8: walk,
      9: walk,
      22: walk,
      23: walk,
    },
    shawlWristPoints: {
      1: [86, 76],
      2: [87, 76],
      3: [87, 76],
      4: [85, 82],
      5: [85, 82],
      6: [86, 83],
      7: [87, 83],
    },
  };
}

function lanternActor(actor: StageActor): StageActor {
  const wristPoints: StageActor["wristPoints"] =
    actor.id === "aria"
      ? {
          0: [92, 69],
          1: [92, 69],
          2: [92, 69],
          3: [92, 69],
          4: [92, 72],
          5: [93, 70],
          6: [92, 71],
          7: [94, 70],
        }
      : {
          0: [87, 69],
          1: [87, 69],
          2: [87, 70],
          3: [87, 69],
          4: [86, 68],
          5: [90, 65],
          6: [89, 68],
          7: [89, 65],
        };
  return { ...actor, lanternHold: true, wristPoints };
}

export function nightStudyCue(cue: StoryStageCue): StoryStageCue {
  const lampOwners = new Set<StageActor["id"] | undefined>(
    cue.items
      ?.filter((item) => item.art === "lantern")
      .map((item) => item.actor)
      .filter((id) => id === "aria" || id === "leon"),
  );
  return {
    ...cue,
    actors: cue.actors.map((actor) => {
      const painted = nightActor(actor);
      return lampOwners.has(actor.id) ? lanternActor(painted) : painted;
    }),
    items: cue.items
      ?.filter((item) => !(item.art === "lantern" && lampOwners.has(item.actor)))
      .map((item) =>
        item.art === "moss-jar"
          ? { ...item, x: 0, bottom: 0, width: 4, wrist: true, wristAnchor: "bottom" }
          : item,
      ),
  };
}
