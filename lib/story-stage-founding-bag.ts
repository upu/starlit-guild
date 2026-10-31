import { ground, held, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageItem } from "./story-stage-cues.ts";

const id = "lico-travel-bag";
const floorBag = (): StageItem => ({ ...ground("tool-rucksack", 80.625, 14, 6), id });
const handBag = (): StageItem =>
  held("tool-rucksack", "lico", {
    id,
    width: 6,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: "top",
  });
const backBag = (): StageItem =>
  held("tool-rucksack", "lico", {
    id,
    width: 6,
    x: -5,
    bottom: 23,
    behindOwner: true,
  });

export const liftFoundingBag: LaterBeat = {
  at: 18,
  finishBeforeAdvance: true,
  actors: { lico: { inspect: true, carry: false } },
  items: [ground("ledger", 27, 42, 9), ground("basket", 60, 40, 9), floorBag()],
  sequence: [
    {
      after: 600,
      actors: { lico: { inspect: false, carry: true } },
      items: [ground("ledger", 27, 42, 9), ground("basket", 60, 40, 9), handBag()],
    },
    {
      after: 1600,
      actors: { lico: { inspect: true, carry: false } },
      items: [ground("ledger", 27, 42, 9), ground("basket", 60, 40, 9), floorBag()],
    },
    { after: 2400, actors: { lico: { inspect: false } } },
  ],
};

export const foundingReturnCargo = (): StageItem[] => [
  { ...ground("empty-cart", 52, 36, 25), id: "return-cart" },
  { ...ground("basket", -3, 17, 6), id: "return-basket", carrier: "return-cart" },
  { ...ground("sealed-letter", 3, 17, 4), id: "return-letters", carrier: "return-cart" },
];

/** Keep the same luggage present across gift handoffs and the departure cut. */
export function foundingBags(beats: LaterBeat[]): LaterBeat[] {
  return beats.map((beat) => {
    const withBag = (items: StageItem[]) =>
      items.some((p) => p.id === id) ? items : [...items, beat.at >= 37 ? backBag() : floorBag()];
    return {
      ...beat,
      items: beat.items && withBag(beat.items),
      sequence: beat.sequence?.map((step) => ({
        ...step,
        items: step.items && withBag(step.items),
      })),
    };
  });
}
