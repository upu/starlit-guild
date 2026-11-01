import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { tastingItems } from "../story-stage-walnut-items.ts";

type Action = NonNullable<StageActor["snackAction"]>;
const palms: Record<string, Record<Action, [number, number]>> = {
  aria: {
    idle: [73, 87],
    lap: [73, 87],
    split: [63, 81],
    offer: [82, 80],
    bite: [63, 68],
    reach: [82, 106],
    drink: [69, 67],
  },
  leon: {
    idle: [66, 86],
    lap: [66, 86],
    split: [71, 76],
    offer: [82, 76],
    bite: [69, 72],
    reach: [69, 106],
    drink: [72, 69],
  },
};
const food = (i: StageItem) => i.art.startsWith("walnut-");
function action(a: StageActor, items: StageItem[]): Action {
  const held = items.filter((i) => i.actor === a.id);
  if (a.inspect) return "reach";
  if (held.some((i) => i.art === "travel-flask")) return "drink";
  if (held.some((i) => food(i) && i.bottom > 31)) return "bite";
  if (held.some((i) => ["leon-cake", "leon-nut"].includes(i.id) && i.bottom === 29.5))
    return "offer";
  if (held.some((i) => i.id === "held-cake" && i.art !== "walnut-underside")) return "split";
  return held.some(food) ? "lap" : a.pose === "offer" ? "offer" : "idle";
}
function actor(a: StageActor, items: StageItem[], line?: number): StageActor {
  const seated = a.seated || a.inspect;
  const snackAction = seated ? action(a, items) : undefined;
  const p = palms[a.id][snackAction ?? "idle"];
  return {
    ...a,
    x: seatedX(a, items),
    snackAction,
    bottom: reachingBottom(a, line),
    scoot: !!seated,
    nameAbove: !!seated,
    nameOffset: a.id === "aria" ? -12 : 12,
    carry: !seated && items.some((i) => i.actor === a.id && i.art === "basket"),
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      ...Object.fromEntries(
        [13, 24, 25, 26, 27, 28, 29, 30, 31, 36, 37, 38, 39, 40, 41, 42, 43].map((f) => [f, p]),
      ),
      14: [82, 76],
      15: [82, 76],
      16: [82, 76],
      8: [87, 69],
      9: [87, 69],
      22: [87, 69],
      23: [87, 69],
    },
  };
}
function seatedX(a: StageActor, items: StageItem[]) {
  if (a.id === "aria") return a.x === 56 ? 48 : a.x - 10;
  const nuts = items.some((i) => i.id === "leon-nut" && !!i.actor);
  return a.x - 9.85625 - (nuts ? 1 : 0);
}
function reachingBottom(a: StageActor, line?: number) {
  if (!a.inspect) return a.bottom;
  if (line === 42) return 18.6515625;
  return 11.6015625;
}
function item(i: StageItem, actors: StageActor[]): StageItem {
  if (!i.actor) return floorItem(i);
  const owner = actors.find((a) => a.id === i.actor);
  return {
    ...i,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: i.art === "basket" || i.art === "travel-flask" ? "top" : "bottom",
    width: propWidth(i),
    wristOffset: gripOffset(i, owner),
    ...(i.art === "travel-flask" && owner?.snackAction === "drink" ? { pitch: -30 } : {}),
  };
}
function gripOffset(i: StageItem, owner?: StageActor) {
  if (i.art === "basket") return { x: 0, bottom: (i.width ?? 6) * 1.5 * (1 - 1 / 1.3) };
  const ownHalf =
    owner?.snackAction === "offer" &&
    i.actor === "aria" &&
    ["aria-cake", "aria-nut"].includes(i.id);
  if (ownHalf) return { x: -1.5, bottom: -2 };
  if (!["leon-cake", "leon-nut"].includes(i.id) || i.bottom !== 29.5) return { x: 0, bottom: 0 };
  return { x: i.art === "walnut-piece" ? 0.4 : 0.9, bottom: i.actor === "leon" ? -0.890625 : 0 };
}
function floorItem(i: StageItem): StageItem {
  const locations: Partial<Record<string, number>> = { "aria-nut": 50.671875, "leon-nut": 52.5 };
  const x = locations[i.id] ?? (i.art === "travel-flask" ? 50.671875 : i.x - 10);
  return { ...i, x, bottom: floorBottom(i), width: propWidth(i) };
}
function propWidth(i: StageItem) {
  if (i.art === "travel-flask") return 2.7;
  if (i.art === "walnut-piece") return 0.8;
  return food(i) ? (i.art.endsWith("-half") ? 1.8 : 2.4) : i.width;
}
function floorBottom(i: StageItem) {
  if (i.art === "picnic-cloth") return 12;
  if (i.art === "low-bench") return 24.5;
  if (i.art === "travel-flask") return 19.5;
  if (i.art === "walnut-piece") return 16.5;
  return food(i) ? 16 : i.bottom;
}
export function walnutStudyCue(cue: StoryStageCue, line?: number): StoryStageCue {
  const adjust = (s: Pick<StoryStageCue, "actors" | "items">, after = 0) => {
    const items = remainingPale(s.items ?? [], line, after);
    const actors = s.actors.map((a) => actor(a, items, line));
    return { actors, items: packedContents(items.map((i) => item(i, actors))) };
  };
  return {
    ...cue,
    cell: 19,
    cameraScale: 0.72,
    finishBeforeAdvance: !!cue.sequence?.length || cue.finishBeforeAdvance,
    ...adjust(cue),
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s, s.after) })),
  };
}
function packedContents(items: StageItem[]): StageItem[] {
  const basket = items.find((i) => i.art === "basket" && !!i.actor);
  if (!basket) return items;
  return [
    ...items,
    {
      id: "packed-cloth",
      art: "packing-cloth",
      carrier: basket.id,
      x: -0.4,
      bottom: 3.5,
      width: 4,
    },
    { id: "packed-flask", art: "travel-flask", carrier: basket.id, x: 1.4, bottom: 4, width: 1.4 },
  ];
}
function remainingPale(items: StageItem[], line = -1, after: number) {
  if (line < 14 || line >= 20 || (line === 14 && after < 1600)) return items;
  if (items.some((i) => i.id === "aria-cake")) return items;
  // The narration says she examines the remainder after one bite.
  const remainder = tastingItems({ cake: "light", hold: "lap" }).find((i) => i.id === "aria-cake");
  return remainder ? [...items, remainder] : items;
}
export function walnutExitCue(cue: StoryStageCue): StoryStageCue {
  const c = walnutStudyCue(cue);
  return {
    ...c,
    actors: c.actors.map((a) => ({
      ...a,
      seated: false,
      perch: false,
      snackAction: undefined,
      via:
        a.id === "aria"
          ? [
              { x: 46, bottom: 12 },
              { x: 30, bottom: 5 },
              { x: 18, bottom: -8 },
            ]
          : [
              { x: 59, bottom: 12 },
              { x: 75, bottom: 2 },
              { x: 87, bottom: -10 },
            ],
      x: a.id === "aria" ? -10 : 110,
      bottom: -25,
    })),
  };
}
