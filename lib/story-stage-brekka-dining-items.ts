import type { StageItem } from "./story-stage-cues.ts";
import { ground } from "./story-stage-later-shared.ts";

type Cup = "empty" | "full" | "held" | "sip";
export type DiningDrinks = {
  mira?: Cup;
  finn?: Cup;
  placing?: boolean;
  juice?: "none" | "waiting" | "carried" | "table" | "held" | "toast" | "sip";
  jug?: "table" | "held" | "pour";
  worker?: "hold" | "sip" | "meal";
  bread?: boolean;
};
const desk = (
  id: string,
  art: StageItem["art"],
  x: number,
  bottom: number,
  width: number,
  support = "table",
): StageItem => ({ ...ground(art, x, bottom, width), id, support });
function aleCup(id: "mira" | "finn", state: Cup, placing: boolean): StageItem {
  const item = desk(
    `${id}-ale`,
    state === "empty" ? "ale-cup-empty" : "ale-cup-full",
    id === "mira" ? 42 : 75,
    id === "mira" ? 29 : 30,
    2.6,
  );
  if (placing && id === "finn") return { ...item, extra: "merchant", wrist: true };
  if (state === "held" || state === "sip")
    return {
      ...item,
      actor: id,
      wrist: true,
      tilt: state === "sip" ? { finn: 20, mira: -20 }[id] : 0,
    };
  return item;
}
function fruitDrinks(juice: NonNullable<DiningDrinks["juice"]>): StageItem[] {
  const tray: StageItem = {
    ...ground(
      "serving-tray",
      juice === "waiting" || juice === "none" ? 94 : 60,
      juice === "waiting" || juice === "none" ? 43 : 26,
      9,
    ),
    id: "fruit-tray",
    ...(!["waiting", "none", "carried"].includes(juice) ? { support: "table" } : {}),
    ...(juice === "carried"
      ? { extra: "merchant" as const, wrist: true, wristAnchor: "bottom" as const }
      : {}),
  };
  const held = ["held", "toast", "sip"].includes(juice);
  return [
    tray,
    ...(["aria", "leon"] as const).map((id, i): StageItem => ({
      ...ground("fruit-glass", i ? 2 : -2, 2, 2.2),
      id: `${id}-glass`,
      stored: juice === "none",
      ...(held
        ? { actor: id, wrist: true, wristAnchor: "top", tilt: fruitTilt(juice, i) }
        : { carrier: "fruit-tray" }),
    })),
  ];
}
function fruitTilt(juice: DiningDrinks["juice"], index: number) {
  if (juice === "sip") return index ? 24 : -24;
  return juice === "toast" ? [20, -20][index] : 0;
}
function servingJug(jug: DiningDrinks["jug"]): StageItem {
  return {
    ...ground("ale-jug", 96, 48, 5),
    id: "ale-jug",
    ...(jug === "pour" ? { support: "table" } : {}),
    ...(jug === "table"
      ? {}
      : {
          extra: "merchant" as const,
          wrist: true,
          tilt: jug === "pour" ? -35 : 0,
          pouring: jug === "pour",
        }),
  };
}
export function brekkaDiningItems({
  mira = "empty",
  finn = "empty",
  placing = false,
  juice = "none",
  jug = "table",
  worker = "hold",
  bread = false,
}: DiningDrinks = {}): StageItem[] {
  return [
    { ...ground("dining-table", 60, 12, 44), id: "table" },
    { ...ground("dining-table", 14, 21, 22), id: "side-table" },
    desk("worker-lunch", "lunch-plate", 14, 27, 6, "side-table"),
    {
      ...desk(
        "worker-cup",
        worker === "meal" ? "ale-cup-empty" : "ale-cup-full",
        9,
        31,
        2.6,
        "side-table",
      ),
      ...(worker === "meal"
        ? {}
        : { extra: "worker" as const, wrist: true, tilt: worker === "sip" ? -20 : 0 }),
    },
    desk("bread-plate", "dining-plate", 43, 24, 6),
    {
      ...desk("mira-bread", "bread-roll", 41.5, 25, 3.8),
      ...(bread ? { actor: "mira" as const, wrist: true } : {}),
    },
    aleCup("mira", mira, placing),
    aleCup("finn", finn, placing),
    servingJug(jug),
    ...fruitDrinks(juice),
  ];
}
