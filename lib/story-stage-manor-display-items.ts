import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

export type DisplayState = {
  cover?: "draped" | "lifting" | "folded";
  lid?: "open" | "closed";
  stone?: "top" | "tilting" | "bottom";
  lifted?: boolean;
  key?: "belt" | "lock";
  gardenerLeaving?: boolean;
  recording?: boolean;
  cloth?: "near" | "far";
};
export const manorGear = (): StageItem[] => [
  ground("basket", 24, 8, 7),
  ground("delivery-bag", 88, 8, 8),
  ground("medicine-closed", 15, 35, 8),
];
function displayCase(state: DisplayState): StageItem[] {
  const art =
    state.cover === "draped"
      ? "display-covered"
      : state.lid === "closed"
        ? "display-closed"
        : "display-open";
  return [
    { ...ground("table", 57, 18, 24), id: "display-table" },
    { ...ground(art, 57, 35, 14), id: "case", support: "display-table" },
    {
      ...ground(
        state.stone === "bottom" ? "tower-stone-bottom" : "tower-stone",
        state.lifted ? -3 : 57,
        state.lifted ? 38 : 40,
        6.2,
      ),
      id: "tower-stone",
      extra: state.lifted ? "worker" : undefined,
      support: "case",
      stored: state.cover === "draped",
      tilt: state.stone === "tilting" ? -18 : 0,
      glow: "dim",
      glowTone: "violet",
    },
  ];
}
function displayCloth(state: DisplayState): StageItem[] {
  const lifting = state.cover === "lifting";
  return [
    {
      ...ground("cloth", lifting ? -5 : 66, lifting ? 39 : 34, lifting ? 8 : 5),
      id: "cover-cloth",
      extra: lifting ? "worker" : undefined,
      support: "display-table",
      stored: state.cover === "draped",
    },
    ...(state.cloth
      ? [
          held("light-cloth", "aria", {
            id: "light-sample",
            x: 6,
            bottom: 27,
            width: 3.5,
            glow: state.cloth === "near" ? "dim" : undefined,
            glowTone: "violet",
            support: "case",
          }),
        ]
      : []),
  ];
}
export function displayItems(state: DisplayState = {}): StageItem[] {
  return [
    ...manorGear(),
    ...displayCase(state),
    ...displayCloth(state),
    {
      ...ground(
        "key",
        state.key === "lock" ? -7 : 2,
        state.key === "lock" ? 37 : state.gardenerLeaving ? 29 : 35,
        2.4,
      ),
      id: "case-key",
      extra: "worker",
    },
    ...(state.recording
      ? []
      : [held("paper", "leon", { id: "shipping-copy", x: -3, bottom: 26, width: 4.5 })]),
  ];
}
