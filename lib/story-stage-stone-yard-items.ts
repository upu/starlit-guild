import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

export type YardState = {
  comparing?: boolean;
  wrap?: "held" | "ground";
  cargo?: "held" | "lower" | "floor";
  chair?: "waiting" | "moving" | "offered";
};
export function yardItems(state: YardState = {}): StageItem[] {
  return [
    ground("basket", 16, 9, 7),
    ground("delivery-bag", 47, 3, 8),
    ground("medicine-closed", 61, 31, 8),
    { ...ground("candidate-blue", 30, 12, 6.2), id: "blue-stone", glow: "bright" },
    { ...ground("candidate-violet", 42, 12, 6.2), id: "violet-stone" },
    { ...ground("candidate-dull", 51, 12, 6.2), id: "dull-stone" },
    cargo(state),
    ...(state.comparing
      ? [
          held("light-cloth", "aria", {
            id: "comparison-cloth",
            width: 3.5,
            x: 3.4,
            bottom: 23,
            support: "blue-stone",
            glow: "dim",
          }),
        ]
      : []),
    ...(state.wrap === "held"
      ? [held("stone-wrap", "mira", { id: "wrapping-cloth", width: 8, x: 3, bottom: 21 })]
      : [
          {
            ...ground("stone-wrap", 62, state.wrap === "ground" ? 14 : 22, 8),
            id: "wrapping-cloth",
          },
        ]),
    seat(state),
  ];
}
function cargo(state: YardState): StageItem {
  return {
    ...ground(
      "candidate-dull",
      state.cargo === "floor" ? 79 : -3,
      state.cargo === "floor" ? 46 : state.cargo === "lower" ? 53 : 57,
      6.2,
    ),
    id: "carrier-stone",
    extra: state.cargo === "floor" ? undefined : "stone-carrier",
  };
}
function seat(state: YardState): StageItem {
  return state.chair === "moving"
    ? held("chair", "finn", { id: "mira-chair", x: 6, bottom: 18, width: 6.3, left: true })
    : {
        ...ground(
          "chair",
          state.chair === "offered" ? 58 : 89,
          state.chair === "offered" ? 34 : 37,
          6.3,
        ),
        id: "mira-chair",
        left: true,
      };
}
