import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

export type WalnutShade = "light" | "medium" | "dark";
export type TastingState = {
  remaining?: readonly WalnutShade[];
  cake?: WalnutShade;
  hold?: "whole" | "split" | "pass" | "lap" | "bite" | "aria-bite" | "underside";
  nuts?: "ground" | "picked" | "split" | "pass" | "lap" | "bite";
  flask?: "lift" | "held";
  nudge?: boolean;
  tidy?: "fold" | "packed";
};
const wholeArt: Record<WalnutShade, StageItem["art"]> = {
  light: "walnut-light",
  medium: "walnut-medium",
  dark: "walnut-dark",
};
const halfArt: Record<WalnutShade, StageItem["art"]> = {
  light: "walnut-light-half",
  medium: "walnut-medium-half",
  dark: "walnut-dark-half",
};

function snack(
  art: StageItem["art"],
  owner: "aria" | "leon",
  id: string,
  position: "pass" | "lap" | "bite",
  width: number,
): StageItem {
  return held(art, owner, {
    id,
    width,
    x: (owner === "aria" ? 1 : -1) * { pass: 4.5, lap: 1.8, bite: 0.8 }[position],
    bottom: { pass: 29.5, lap: 26.5, bite: 31.7 }[position],
  });
}
function cakes(state: TastingState): StageItem[] {
  const result = (state.remaining ?? []).map((shade) => ({
    ...ground(wholeArt[shade], { light: 56, medium: 60.5, dark: 65 }[shade], 18, 3.6),
    id: shade,
  }));
  if (!state.hold || !state.cake) return result;
  if (state.hold === "whole" || state.hold === "underside")
    return [
      ...result,
      snack(
        state.hold === "underside" ? "walnut-underside" : wholeArt[state.cake],
        "aria",
        "held-cake",
        "lap",
        3.6,
      ),
    ];
  const art = halfArt[state.cake];
  const a = snack(
    art,
    "aria",
    "aria-cake",
    ["bite", "aria-bite"].includes(state.hold) ? "bite" : "lap",
    2.6,
  );
  const b = snack(
    art,
    state.hold === "split" ? "aria" : "leon",
    "leon-cake",
    ["split", "pass"].includes(state.hold) ? "pass" : state.hold === "bite" ? "bite" : "lap",
    2.6,
  );
  return [...result, a, b];
}
function nuts(mode: TastingState["nuts"]): StageItem[] {
  if (!mode) return [];
  const a = { ...ground("walnut-piece", 56.5, 17.5, 1.3), id: "aria-nut" },
    b = { ...ground("walnut-piece", 59, 17.5, 1.3), id: "leon-nut" };
  if (mode === "ground") return [a, b];
  if (mode === "picked") return [snack("walnut-piece", "aria", "aria-nut", "lap", 1.3), b];
  return [
    snack("walnut-piece", "aria", "aria-nut", mode === "bite" ? "bite" : "lap", 1.3),
    snack(
      "walnut-piece",
      mode === "split" ? "aria" : "leon",
      "leon-nut",
      ["split", "pass"].includes(mode) ? "pass" : mode === "bite" ? "bite" : "lap",
      1.3,
    ),
  ];
}
export function tastingItems(state: TastingState = {}): StageItem[] {
  if (state.tidy === "packed") return [held("basket", "leon", { width: 6, bottom: 23, x: -4 })];
  const cloth =
    state.tidy === "fold"
      ? held("packing-cloth", "leon", { width: 6, bottom: 29.5, x: -4.5 })
      : ground("picnic-cloth", state.nudge ? 61.5 : 60.5, 16, 23);
  const flask = state.flask
    ? held("travel-flask", "aria", {
        width: 4,
        x: state.flask === "lift" ? 4.5 : 1.8,
        bottom: state.flask === "lift" ? 23 : 26.5,
      })
    : ground("travel-flask", 60.5, 23, 4);
  return [cloth, ground("basket", 76, 24, 6), flask, ...cakes(state), ...nuts(state.nuts)];
}
