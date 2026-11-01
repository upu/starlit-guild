import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

const tray: StageItem = {
  id: "sample-tray",
  art: "dish",
  actor: "leon",
  x: 0,
  bottom: 0,
  width: 6,
  wrist: true,
  wristAnchor: "bottom",
};
const spatula: StageItem = {
  id: "sample-spatula",
  art: "spatula",
  actor: "aria",
  x: 0,
  bottom: 0,
  width: 2.5,
  wrist: true,
  wristAnchor: "bottom",
};

function sampleActors(cue: StoryStageCue, inspecting: boolean): StageActor[] {
  return cue.actors.map((actor) =>
    actor.id === "leon"
      ? {
          ...actor,
          x: 53,
          bottom: 24,
          left: true,
          carry: true,
          wristPoints: { 14: [80, 76], 15: [80, 76] },
        }
      : {
          ...actor,
          inspect: inspecting,
          pose: "offer",
          left: false,
          wristPoints: { 13: [90, 110], 4: [83, 78] },
        },
  );
}

/** Keep collection, the approach and the handover within the narrated action. */
export function towerSampleCue(cue: StoryStageCue, line: number): StoryStageCue {
  if (line !== 19) return cue;
  const sample = cue.items?.find((item) => item.id === "sample");
  if (!sample) return cue;
  const received: StageItem = {
    ...sample,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: "bottom",
    width: 6,
  };
  const actors = sampleActors(cue, false);
  const scooped: StageItem = { ...received, actor: "aria", width: 2.5 };
  return {
    ...cue,
    actors: sampleActors(cue, true),
    items: [tray, spatula],
    finishBeforeAdvance: true,
    sequence: [
      {
        after: 1200,
        actors: sampleActors(cue, true),
        items: [tray, spatula, scooped],
        extras: cue.extras,
      },
      { after: 1800, actors, items: [tray, spatula, scooped], extras: cue.extras },
      { after: 2600, actors, items: [received], extras: cue.extras },
    ],
  };
}
