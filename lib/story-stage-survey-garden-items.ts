import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

type GardenState = {
  pot?: "carry" | "ground";
  workerBottom?: number;
  gloves?: "worn" | "hand" | "offer" | "worker" | "pocket";
  key?: "hidden" | "glove" | "finger" | "worker" | "belt";
  angle?: number;
};
export function gardenItems() {
  let state: GardenState = {
    pot: "carry",
    workerBottom: 50,
    gloves: "worn",
    key: "hidden",
    angle: 0,
  };
  return (patch: GardenState = {}): StageItem[] => {
    state = { ...state, ...patch };
    return [
      held("tool-rucksack", "leon", { x: 2.6, bottom: 23, width: 6.5, behindOwner: true }),
      state.pot === "carry"
        ? { ...ground("garden-pot", 0, (state.workerBottom ?? 42) + 6, 7), extra: "worker" }
        : ground("garden-pot", 82, 44, 7),
      ...gloves(state),
      key(state),
    ];
  };
}
function gloves(state: GardenState): StageItem[] {
  if (state.gloves === "worn") return [];
  if (state.gloves === "worker" || state.gloves === "pocket")
    return [
      {
        ...ground(
          "work-gloves",
          state.gloves === "worker" ? -5.8 : -2.5,
          state.gloves === "worker" ? 48.2 : 49,
          3.6,
        ),
        extra: "worker",
      },
    ];
  return [
    held("work-gloves", "finn", {
      x: state.gloves === "offer" ? 3.2 : -1.4,
      bottom: state.gloves === "offer" ? 20.2 : 19,
      width: 3.6,
    }),
  ];
}
function key(state: GardenState): StageItem {
  const common = { id: "case-key", width: 2.4, tilt: state.angle, stored: state.key === "hidden" };
  if (state.key === "worker" || state.key === "belt")
    return {
      ...ground("key", state.key === "worker" ? -5.8 : 2, state.key === "worker" ? 50.8 : 50, 2.4),
      ...common,
      extra: "worker",
    };
  return held("key", "finn", {
    ...common,
    x: state.key === "finger" ? 3.2 : -1.4,
    bottom: state.key === "finger" ? 22.8 : 19,
  });
}
