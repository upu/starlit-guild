import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";
import { receptionCart } from "./story-stage-reception-items.ts";

type WellState = {
  bag?: "back" | "ground" | "hand" | "cook" | "kitchen";
  fastener?: "bag" | "floor" | "hand" | "stored";
  rope?: "loose" | "snagged" | "packed";
  map?: boolean;
  pushing?: boolean;
  cookBottom?: number;
  byHandle?: boolean;
};
export function receptionWellItems() {
  let state: WellState = { bag: "back", fastener: "bag", rope: "loose" };
  return (patch: WellState = {}): StageItem[] => {
    state = { ...state, ...patch };
    return [
      ...receptionCart(state.pushing ? 16 : 55, state.pushing ? 16 : 20, state.pushing),
      bag(state),
      rope(state),
      fastener(state),
      held("map", "leon", { id: "garden-map", x: -3.3, bottom: 26, width: 5, stored: !state.map }),
    ];
  };
}

function bag(state: WellState): StageItem {
  if (state.bag === "cook")
    return {
      ...ground("tool-rucksack", -5.5, (state.cookBottom ?? 76) + 9, 6.5),
      extra: "cook",
      wrist: state.byHandle,
      wristAnchor: "top",
    };
  return state.bag === "ground"
    ? { ...ground("tool-rucksack", 89, 16, 6.5), id: "tool-rucksack" }
    : state.bag === "kitchen"
      ? { ...ground("tool-rucksack", 97, 80, 6.5), stored: true }
      : held("tool-rucksack", "leon", {
          x: state.bag === "back" ? 2.6 : -3.5,
          bottom: 23,
          width: 6.5,
          behindOwner: state.bag === "back",
        });
}
function rope(state: WellState): StageItem {
  return state.rope === "packed"
    ? { ...ground("twine", 0, 13, 3), id: "spare-rope", carrier: "reception-cart" }
    : state.rope === "snagged"
      ? { ...ground("snag-rope", 96.8, 19.3, 9), id: "spare-rope", tilt: 42 }
      : { ...ground("snag-rope", 3.5, -4, 5), id: "spare-rope", carrier: "tool-rucksack" };
}
function fastener(state: WellState): StageItem {
  return state.fastener === "floor"
    ? { ...ground("iron-fastener", 84, 16, 2), id: "loose-fastener" }
    : state.fastener === "hand"
      ? held("iron-fastener", "leon", { id: "loose-fastener", x: -1.8, bottom: 23, width: 2 })
      : {
          ...ground("iron-fastener", -1, 2, 2),
          id: "loose-fastener",
          carrier: "tool-rucksack",
          stored: state.fastener === "stored",
        };
}
