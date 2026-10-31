import type { StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, scene } from "./story-stage-later-shared.ts";

type PicnicPhase =
  | "laid"
  | "flask"
  | "take"
  | "given"
  | "received"
  | "both"
  | "bite"
  | "eaten"
  | "wrapping"
  | "twine"
  | "tied";
const cloth = () => ground("picnic-cloth", 49, 17, 28);
const bag = () => ground("basket", 36, 24, 6);
const cake = (owner: "aria" | "leon", position: "pass" | "lap" | "bite" = "pass"): StageItem =>
  held("honey-cake", owner, {
    id: owner === "leon" ? "shared-cake" : "aria-cake",
    width: 2.8,
    x: (owner === "aria" ? 1 : -1) * { pass: 6, lap: 2.5, bite: 1.5 }[position],
    bottom: position === "bite" ? 28.2 : 24,
  });
function handFood(phase: PicnicPhase): StageItem[] {
  const position = phase === "bite" ? "bite" : "lap";
  if (phase === "take") return [{ ...cake("aria"), id: "shared-cake" }];
  if (phase === "given") return [cake("leon")];
  if (phase === "received") return [cake("leon", position)];
  return ["both", "bite"].includes(phase) ? [cake("aria", position), cake("leon", position)] : [];
}
function foodItems(phase: PicnicPhase): StageItem[] {
  if (phase === "tied") return [ground("cake-parcel", 44.5, 19, 5)];
  if (["wrapping", "twine"].includes(phase))
    return [ground("packing-cloth", 44.5, 18, 6), ground("walnut-cake", 44.5, 20, 3)];
  const food: StageItem[] = [ground("bread", 54, 17, 4.8), ground("walnut-cake", 46, 19, 3)];
  if (["laid", "flask"].includes(phase))
    food.push({ ...ground("honey-cake", 50, 20, 2.8), id: "shared-cake" });
  food.push(...handFood(phase));
  if (["laid", "flask", "take", "given", "received"].includes(phase))
    food.push({ ...ground("honey-cake", 46, 17, 2.8), id: "aria-cake" });
  return food;
}
function picnicItems(phase: PicnicPhase = "laid", flaskOut = true): StageItem[] {
  const food = foodItems(phase);
  if (phase === "wrapping" || phase === "twine")
    food.push(
      held("twine", phase === "wrapping" ? "leon" : "aria", {
        x: phase === "wrapping" ? -6 : 6,
        bottom: 24,
        width: 4,
      }),
    );
  return [
    cloth(),
    bag(),
    ...food,
    ...(flaskOut
      ? [
          phase === "flask"
            ? held("travel-flask", "leon", { width: 4, x: -6, bottom: 24 })
            : ground("travel-flask", 49, 23, 4),
        ]
      : []),
  ];
}

export const walnutLunch = scene(
  "picnic-hill",
  [actor("aria", 43, { bottom: 24, left: false }), actor("leon", 55, { bottom: 24, left: true })],
  [
    {
      at: 0,
      actors: { aria: { inspect: true, packing: true } },
      items: [bag(), held("packing-cloth", "aria", { width: 6, bottom: 24, x: 4 })],
      sequence: [
        { after: 400, items: [cloth(), bag()] },
        { after: 1000, actors: { leon: { seated: true } } },
        { after: 1400, items: picnicItems("laid", false) },
        { after: 2200, actors: { aria: { seated: true, inspect: false, packing: false } } },
      ],
    },
    {
      at: 6,
      actors: { leon: { pose: "tease" } },
      items: picnicItems("flask"),
      sequence: [{ after: 900, items: picnicItems() }],
    },
    {
      at: 11,
      actors: { aria: { pose: "tease" }, leon: { pose: "tease" } },
      items: picnicItems("take"),
      sequence: [
        { after: 1000, items: picnicItems("given") },
        {
          after: 1800,
          actors: { aria: { pose: "idle" }, leon: { pose: "idle" } },
          items: picnicItems("received"),
        },
      ],
    },
    {
      at: 15,
      items: picnicItems("both"),
      sequence: [
        {
          after: 600,
          actors: { aria: { pose: "think" }, leon: { pose: "think" } },
          items: picnicItems("bite"),
        },
        {
          after: 1500,
          actors: { aria: { pose: "tease" }, leon: { pose: "tease" } },
          items: picnicItems("both"),
        },
        {
          after: 2400,
          actors: { aria: { pose: "think" }, leon: { pose: "think" } },
          items: picnicItems("bite"),
        },
        {
          after: 3400,
          actors: { aria: { pose: "tease" }, leon: { pose: "tease" } },
          items: picnicItems("eaten"),
        },
      ],
    },
    {
      at: 20,
      actors: { aria: { inspect: true } },
      sequence: [{ after: 900, actors: { aria: { inspect: false, pose: "think" } } }],
    },
    {
      at: 28,
      actors: { aria: { inspect: true, packing: true }, leon: { pose: "tease" } },
      items: picnicItems("wrapping"),
      sequence: [
        { after: 1000, items: picnicItems("twine") },
        { after: 2200, items: picnicItems("tied") },
        { after: 3100, actors: { aria: { inspect: false, packing: false, pose: "offer" } } },
      ],
    },
  ],
);
