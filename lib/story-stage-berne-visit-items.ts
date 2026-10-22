import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

export type VisitState = {
  medicine?: "ground" | "mira" | "waiting" | "lift" | "leon" | "rest";
  packet?: "mira" | "owner";
  documents?: "owner" | "leon" | "ground" | "finn" | "coat" | "stored";
  note?: "open" | "closed";
  lunch?:
    | "lap"
    | "pass"
    | "given"
    | "laid"
    | "split"
    | "edge"
    | "shared"
    | "mira-pass"
    | "mira-given"
    | "holding"
    | "eaten";
  tea?: "owner" | "finn" | "ground";
  leonWrap?: "ground";
};
const extraItem = (art: StageItem["art"], x: number, bottom: number, width: number): StageItem => ({
  ...ground(art, x, bottom, width),
  extra: "keeper",
});
const child = (
  art: StageItem["art"],
  id: string,
  carrier: string,
  x: number,
  bottom: number,
  width: number,
): StageItem => ({ ...ground(art, x, bottom, width), id, carrier });
function medicine(where: VisitState["medicine"]): StageItem {
  const positions = { ground: [70, 32], waiting: [62, 44], rest: [50, 13] } as const;
  if (where === "mira")
    return { ...held("medicine-closed", "mira", { x: 2.2, bottom: 22, width: 8 }), id: "medicine" };
  if (where === "lift" || where === "leon")
    return {
      ...held("medicine-closed", "leon", { x: -3, bottom: where === "lift" ? 20 : 22, width: 8 }),
      id: "medicine",
    };
  const [x, bottom] = positions[where ?? "ground"];
  return { ...ground("medicine-closed", x, bottom, 8), id: "medicine" };
}
function documents(where: VisitState["documents"]): StageItem[] {
  if (!where) return [];
  if (where === "owner")
    return [
      { ...extraItem("old-wrapper", -5, 46, 6), id: "old-cloth" },
      { ...extraItem("paper", -5, 49, 4), id: "purchase-copy", support: "old-cloth" },
    ];
  if (where === "leon")
    return [
      held("old-wrapper", "leon", { id: "old-cloth", x: -5, bottom: 24, width: 6 }),
      held("paper", "leon", {
        id: "purchase-copy",
        x: -5,
        bottom: 27,
        width: 4,
        support: "old-cloth",
      }),
    ];
  const cloth = { ...ground("old-wrapper", 61, 16, 6), id: "old-cloth" };
  const paper =
    where === "ground"
      ? { ...ground("paper", 61, 18.5, 4), support: "old-cloth" }
      : held("paper", "finn", {
          x: where === "finn" ? 4 : 0,
          bottom: where === "finn" ? 22 : 24,
          width: 4,
          stored: where === "stored",
        });
  return [cloth, { ...paper, id: "purchase-copy" }];
}
const mealPhases: NonNullable<VisitState["lunch"]>[] = [
  "lap",
  "pass",
  "given",
  "laid",
  "split",
  "edge",
  "shared",
  "mira-pass",
  "mira-given",
  "holding",
  "eaten",
];
function bread(phase: number): StageItem[] {
  if (phase === 10) return [];
  const own =
    phase === 9
      ? held("bread-roll", "aria", { x: 1.5, bottom: 24, width: 3.6 })
      : child("bread-roll", "aria-roll", "lunch-wrap", -2.4, 3, 3.6);
  const mira = miraBread(phase);
  const food = [
    { ...own, id: "aria-roll" },
    { ...mira, id: "mira-roll" },
  ];
  if (phase < 4)
    food.push(
      child(
        "bread-roll",
        "leon-roll",
        phase === 0 ? "lunch-wrap" : "leon-wrap",
        0,
        phase === 0 ? 1 : 3,
        3.6,
      ),
    );
  else food.push(...halves(phase));
  return food;
}
function miraBread(phase: number): StageItem {
  if (phase < 7) return child("bread-roll", "mira-roll", "lunch-wrap", 2.4, 3, 3.6);
  return held("bread-roll", phase === 7 ? "aria" : "mira", {
    x: phase < 9 ? 6 : 1.5,
    bottom: 24,
    width: 3.6,
  });
}
function halves(phase: number): StageItem[] {
  const leon =
    phase === 9
      ? held("bread-half", "leon", { x: -2, bottom: 24, width: 2.6 })
      : child("bread-half", "leon-roll", "leon-wrap", -1.5, 3, 2.6);
  const finn =
    phase >= 6
      ? held("bread-half", "finn", {
          x: phase === 6 ? 6 : 2.5,
          bottom: 24,
          width: 2.6,
        })
      : child("bread-half", "finn-roll", "leon-wrap", phase === 4 ? 1.5 : 4, 3, 2.6);
  return [
    { ...leon, id: "leon-roll" },
    { ...finn, id: "finn-roll" },
  ];
}
function lunch(phase: VisitState["lunch"], leonWrap?: "ground"): StageItem[] {
  if (!phase) return [];
  const n = mealPhases.indexOf(phase);
  const result: StageItem[] = [
    held("lap-napkin", "aria", { id: "lunch-wrap", x: 0, bottom: 21, width: 10 }),
  ];
  if (n > 0) result.push(leonNapkin(n, leonWrap));
  return [...result, ...bread(n)];
}
function leonNapkin(phase: number, floor?: "ground"): StageItem {
  if (floor) return { ...ground("lap-napkin", 54, 16, 8), id: "leon-wrap" };
  const x = phase === 1 ? 6 : phase === 2 ? -6 : -2;
  return held("lap-napkin", phase === 1 ? "aria" : "leon", {
    id: "leon-wrap",
    x,
    bottom: phase < 3 ? 24 : 21,
    width: phase < 3 ? 6 : 8,
  });
}
function tea(where: VisitState["tea"]): StageItem[] {
  if (!where) return [];
  const tray =
    where === "owner"
      ? extraItem("serving-tray", -5.8, 40, 10)
      : where === "finn"
        ? held("serving-tray", "finn", { x: 2.2, bottom: 20, width: 10 })
        : ground("serving-tray", 70, 16, 10);
  return [
    { ...tray, id: "tea-tray" },
    ...[-3, -1, 1, 3].map((x, i) => child("teacup", `tea-${String(i)}`, "tea-tray", x, 3.5, 1.8)),
  ];
}
export function visitItems(state: VisitState): StageItem[] {
  const result = [
    medicine(state.medicine),
    ...documents(state.documents),
    ...lunch(state.lunch, state.leonWrap),
    ...tea(state.tea),
    ground("basket", 34, 10, 7),
    ground("delivery-bag", 90, 16, 8),
  ];
  if (state.packet)
    result.push({
      ...(state.packet === "mira"
        ? held("medicine-packet", "mira", { x: 4, bottom: 23, width: 2.8 })
        : extraItem("medicine-packet", -4, 45, 2.8)),
      id: "prescription",
    });
  if (state.note)
    result.push(
      state.note === "open"
        ? held("ledger", "mira", { id: "visit-notebook", x: 2, bottom: 23, width: 4.5 })
        : { ...ground("closed-ledger", 21, 20, 4.5), id: "visit-notebook" },
    );
  return result;
}
