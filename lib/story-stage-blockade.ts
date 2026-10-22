import type { StageItem } from "./story-stage-cues.ts";
import { actor, ground, npc, scene } from "./story-stage-later-shared.ts";

/** A readable outside/inside boundary: the large puppet follows, the small one turns back. */
export const blockadeCast = () => [
  actor("aria", 30, { bottom: 32, left: false }),
  actor("leon", 40, { bottom: 20, left: false }),
  actor("mira", 43, { bottom: 62, left: false }),
];
const controller = () => ({ ...npc("masked-pumpety", undefined, 96, "point"), bottom: 58 });
export function blockadeItems(
  golem = { x: 70, bottom: 51 },
  puppet = { x: 78, bottom: 38 },
  medicineOpen = false,
): StageItem[] {
  return [
    ground("table", 92, 52, 18),
    { ...ground("honey", 90, 66, 6), support: "table" },
    ground(medicineOpen ? "medicine" : "medicine-closed", 40, 62, 8),
    { ...ground("golem", golem.x, golem.bottom, 32), travelMs: 1300 },
    { ...ground("puppet", puppet.x, puppet.bottom, 9), travelMs: 850 },
  ];
}

export const blockadeApproach = scene("workshop-yard", blockadeCast(), [
  { at: 0, extras: [{ ...controller(), pose: "explain" }], items: blockadeItems() },
  {
    at: 6,
    extras: [controller()],
    items: blockadeItems({ x: 65, bottom: 47 }, { x: 82, bottom: 45 }),
  },
  {
    at: 11,
    actors: { aria: { x: 45, bottom: 38, bow: "aim" } },
    sequence: [
      {
        after: 1100,
        items: blockadeItems({ x: 64, bottom: 39 }, { x: 64, bottom: 31 }),
      },
      {
        after: 1800,
        actors: {
          aria: { x: 34, bottom: 48, bow: undefined, pose: "surprise" },
          leon: { x: 47, bottom: 26, sword: true },
        },
        items: blockadeItems({ x: 62, bottom: 39 }, { x: 59, bottom: 25 }),
      },
    ],
  },
  { at: 12, actors: { aria: { reaction: "surprise" } } },
  {
    at: 13,
    actors: { aria: { pose: "think" } },
    items: blockadeItems({ x: 62, bottom: 39 }, { x: 82, bottom: 45 }),
  },
  { at: 17, actors: { leon: { sword: false, pose: "offer" } } },
  {
    at: 21,
    actors: { leon: { x: 8, bottom: 18, sword: true } },
    sequence: [
      { after: 1100, items: blockadeItems({ x: 30, bottom: 18 }, { x: 82, bottom: 45 }) },
      {
        after: 2500,
        actors: {
          aria: { x: 65, bottom: 39, bow: "aim", via: [{ x: 52, bottom: 51 }] },
          mira: { inspect: true },
        },
        items: blockadeItems({ x: 30, bottom: 18 }, { x: 82, bottom: 45 }, true),
      },
    ],
  },
]);
