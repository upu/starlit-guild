import type { StageItem, StageExtra } from "./story-stage-cues.ts";
import { actor, ground, held, npc, type LaterBeat } from "./story-stage-later-shared.ts";
import { recoveryItems, recoveryController, parcelCloth } from "./story-stage-blockade-recovery.ts";

export const carrier = (extra: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("worker", "運び手", 100),
  bottom: 44,
  ...extra,
});
export const roadsideCast = () => [
  actor("aria", 50, { bottom: 24, left: false, dressed: true }),
  actor("leon", 40, { bottom: 48, left: true, dressed: true }),
  actor("mira", 72, { bottom: 12, left: false, carry: true }),
];
export const roadController = (extra: Partial<StageExtra> = {}) =>
  recoveryController({ x: 98, bottom: 74, ...extra });
export const roadSign = (): StageItem => ground("signpost-portable", 29, 57, 11);
export const roadMedicine = (open = false): StageItem => ({
  ...ground(open ? "medicine" : "medicine-closed", 56, 22, 8),
  id: "medicine",
});
export const roadHoney = () => held("honey", "mira", { bottom: 24, width: 6 });
export const roadParcel = () => [roadHoney(), parcelCloth("mira")];
const roadCart = (x = 30): StageItem => ({ ...ground("empty-cart", x, 12, 25), left: true });
export const roadCargo = (x = 30): StageItem[] => [
  roadCart(x),
  { ...ground("trade-parcels-open", -4, 15, 7.5), id: "other-goods", carrier: "empty-cart" },
];
export const leavingCarrier = () => carrier({ x: 111, bottom: 14, carry: true, left: true });
export const movingRoadCargo = (): StageItem[] => [
  { ...roadCart(16.5), bottom: 12, extra: "worker" },
  { ...ground("trade-parcels-open", -4, 15, 7.5), id: "other-goods", carrier: "empty-cart" },
];
export function roadDolls(golemX = 84, puppetX = 36): StageItem[] {
  return [
    { ...ground("golem", golemX, 32, 32), left: true, travelMs: 1600 },
    { ...ground("puppet", puppetX, 52, 9), travelMs: 1600 },
    { ...ground("puppet", 100, 26, 7), id: "small-puppet" },
  ];
}
const atRoad = (post: StageItem, dolls = roadDolls()): StageItem[] => [
  post,
  roadMedicine(),
  ...roadParcel(),
  held("honey-bag", "mira", { x: -4, bottom: 20, width: 8 }),
  ...roadCargo(),
  ...dolls,
];
const carriedSign = (owner: "puppet" | "leon"): StageItem =>
  owner === "puppet"
    ? { ...ground("signpost-portable", 0, -2, 11), carrier: "puppet", tilt: 75 }
    : held("signpost-portable", "leon", { bottom: 16, width: 11, tilt: 75 });

export const inventoryBeats: LaterBeat[] = [
  {
    at: 11,
    actors: {
      aria: {
        x: 86,
        bottom: 56,
        via: [
          { x: 66, bottom: 26 },
          { x: 86, bottom: 26 },
        ],
        pose: "offer",
      },
    },
  },
  {
    at: 12,
    extras: [recoveryController(), carrier({ x: 111, bottom: 30 })],
    sequence: [
      {
        after: 300,
        extras: [recoveryController(), carrier()],
        items: [
          ...recoveryItems("mira", "kneel"),
          { ...ground("ledger", -4, 54, 5), extra: "worker", id: "carrier-record" },
        ],
      },
    ],
  },
  {
    at: 15,
    extras: [recoveryController(), carrier({ writing: true })],
    items: recoveryItems("mira", "kneel"),
  },
];

/** The camera cuts to the existing settlement fork; one portable pole is returned to its hole. */
export const roadOpening: LaterBeat[] = [
  {
    at: 17,
    background: "mountain-fork-empty",
    cast: roadsideCast(),
    extras: [
      roadController({ pose: "point" }),
      carrier({ x: 32, bottom: 48, carry: true, left: true }),
    ],
    items: atRoad(
      carriedSign("puppet"),
      roadDolls(78, 82).map((p) => (p.art === "golem" ? { ...p, figure: "kneel", bottom: 32 } : p)),
    ),
    sequence: [
      { after: 600, items: atRoad(carriedSign("puppet")) },
      {
        after: 2400,
        actors: { leon: { carry: true } },
        items: atRoad(carriedSign("leon"), roadDolls(84, 62)),
      },
      {
        after: 3200,
        actors: { leon: { x: 33, bottom: 55 } },
        extras: [roadController(), carrier({ x: 25, bottom: 55, carry: true, left: true })],
      },
      {
        after: 4000,
        actors: { leon: { carry: false, pose: "offer" } },
        items: atRoad(roadSign(), roadDolls(84, 62)),
      },
      {
        after: 4900,
        actors: { leon: { x: 40, bottom: 45 } },
        extras: [roadController(), carrier({ x: 17, bottom: 45, pose: "point" })],
        items: atRoad(roadSign(), roadDolls(84, 62)),
      },
    ],
  },
  {
    at: 20,
    extras: [roadController(), carrier({ x: 41, bottom: 11, inspect: true })],
    sequence: [
      {
        after: 2500,
        extras: [
          roadController(),
          carrier({
            x: 13.5,
            bottom: 14,
            carry: true,
            left: true,
            via: [
              { x: 41, bottom: 0 },
              { x: 13.5, bottom: 0 },
            ],
          }),
        ],
      },
      {
        after: 5600,
        extras: [roadController(), carrier({ x: 13.5, bottom: 14, pose: "wave", left: true })],
      },
      {
        after: 6200,
        extras: [roadController(), leavingCarrier()],
        items: [
          roadSign(),
          roadMedicine(),
          ...roadParcel(),
          held("honey-bag", "mira", { x: -4, bottom: 20, width: 8 }),
          ...roadDolls(84, 62),
          ...movingRoadCargo(),
        ],
      },
    ],
  },
];
