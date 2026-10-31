import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";
type Phase = "near" | "lifting" | "road" | "door" | "guard";
export type GolemMedicine = "held" | "open" | "closed" | "stowed";
const locations = {
  near: [58, 24, 35, 43],
  lifting: [58, 24, 35, 43],
  road: [70, 37, 53, 51],
  door: [70, 51, 99, 65],
  guard: [70, 51, 78, 38],
};
export function golemFieldItems(phase: Phase, medicine: GolemMedicine = "held"): StageItem[] {
  const [gx, gy, px, py] = locations[phase];
  const pulling = phase !== "near" && phase !== "guard";
  const cloth: StageItem = {
    ...ground(
      pulling ? "dragging-cloth" : "packing-cloth",
      phase === "guard" ? 90 : 26,
      phase === "guard" ? 65 : 43,
      10,
    ),
    id: "loot-cloth",
    ...(pulling ? { carrier: "puppet", x: -9, bottom: 0 } : {}),
    ...(phase === "guard" ? { support: "table" } : {}),
  };
  return [
    ground("table", 92, 52, 18),
    medicineBox(medicine),
    { ...ground("golem", gx, gy, 32), travelMs: 1800, backstep: phase !== "guard" },
    {
      ...ground("puppet", px, py, 9),
      travelMs: phase === "door" ? 2200 : 1500,
      backstep: pulling,
      figure: phase === "lifting" ? "kneel" : undefined,
    },
    cloth,
    { ...ground("honey", 0, 1, 6), carrier: "loot-cloth" },
  ];
}

function medicineBox(medicine: GolemMedicine): StageItem {
  return medicine === "held"
    ? held("medicine-closed", "mira", { id: "medicine", width: 8, bottom: 22 })
    : {
        ...ground(
          medicine === "open" ? "medicine" : "medicine-closed",
          medicine === "stowed" ? 40 : 72,
          medicine === "stowed" ? 62 : 25,
          8,
        ),
        id: "medicine",
      };
}
