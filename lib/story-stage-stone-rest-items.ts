import type { StageItem } from "./story-stage-cues.ts";
import { actor, ground, held } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";
export type RestSeat = "finn" | "leon" | "aria" | "mira";
export type RestState = {
  comparison?: "open" | "dull" | "violet";
  paper?: "worker" | "finn" | "leon" | "bag";
  cup?: "mira" | "aria" | "table";
  kettle?: "table" | "leon" | "fire";
  chair?: RestSeat;
  arranged?: number;
  clothDown?: boolean;
  heated?: boolean;
};
export type RestItems = (patch?: RestState) => StageItem[];
export const restSeats = [
  actor("finn", 70, { bottom: 26, left: true }),
  actor("leon", 70, { bottom: 11, left: true }),
  actor("aria", 34, { bottom: 11, left: false }),
  actor("mira", 30, { bottom: 25, left: false }),
];
const originalX = [78, 80, 22, 28];
const surface = (art: StageItem["art"], x: number, width: number): StageItem => ({
  ...ground(art, x, 28, width),
  support: "table",
});
function seats(state: RestState): StageItem[] {
  return restSeats.map((seat, index) => {
    if (state.chair === seat.id)
      return held("chair", "finn", {
        id: `chair-${seat.id}`,
        x: 6,
        bottom: 18,
        width: 6.3,
        left: seat.left,
      });
    return chair({ ...seat, x: index < (state.arranged ?? 0) ? seat.x : originalX[index] });
  });
}
function candidates(state: RestState): StageItem[] {
  const violet = state.comparison === "violet";
  return [
    {
      ...ground(state.comparison === "dull" ? "covered-stone" : "candidate-violet", 44, 49, 6.2),
      id: "violet-stone",
      glow: violet ? "dim" : undefined,
    },
    { ...ground(violet ? "covered-stone" : "candidate-dull", 58, 49, 6.2), id: "dull-stone" },
    ...(state.clothDown
      ? [{ ...ground("stone-wrap", 31.2, 49, 5), id: "comparison-cloth" }]
      : [
          held("light-cloth", "aria", {
            id: "comparison-cloth",
            x: 3.4,
            bottom: 23,
            width: 3.5,
            glow: violet ? "dim" : undefined,
            glowTone: "violet",
          }),
        ]),
  ];
}
function receipt(state: RestState): StageItem[] {
  if (!state.paper) return [];
  if (state.paper === "worker")
    return [{ ...ground("paper", 4, 69, 4.5), id: "sale-receipt", extra: "worker" }];
  return [
    held("paper", state.paper === "bag" ? "leon" : state.paper, {
      id: "sale-receipt",
      width: 4.5,
      x: state.paper === "finn" ? 4 : -4,
      bottom: 23,
      stored: state.paper === "bag",
    }),
  ];
}
function tea(state: RestState): StageItem[] {
  const cup =
    state.cup === "table"
      ? { ...surface("teacup", 38, 2.8), id: "mira-cup" }
      : held("teacup", state.cup === "aria" ? "aria" : "mira", {
          id: "mira-cup",
          x: 4,
          bottom: state.cup === "aria" ? 21 : 23,
          width: 2.8,
        });
  let kettle: StageItem = { ...surface("kettle", 62, 5), id: "kettle" };
  if (state.kettle === "leon") kettle = held("kettle", "leon", { width: 5, x: -4, bottom: 23 });
  if (state.kettle === "fire")
    kettle = { ...ground("kettle", 88, 32, 5), support: "brazier", steaming: state.heated };
  return [
    cup,
    kettle,
    ...[43, 48, 53].map((x, i) => ({
      ...surface("empty-cup", x, 2.8),
      id: `guest-cup-${String(i)}`,
    })),
    surface("teapot", 58, 5),
    surface("medicine-packet", 64, 4),
  ];
}
export function restItems(state: RestState = {}): StageItem[] {
  return [
    { ...ground("dining-table", 52, 18, 28), id: "table" },
    ground("brazier", 88, 27, 7),
    ground("basket", 17, 16, 7),
    ground("delivery-bag", 87, 9, 8),
    ground("medicine-closed", 16, 34, 8),
    ...seats(state),
    ...candidates(state),
    ...receipt(state),
    ...tea(state),
  ];
}
