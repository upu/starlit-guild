import { ground, held, npc, type LaterBeat } from "./story-stage-later-shared.ts";

const worker = (carry = true) => ({ ...npc("worker", undefined, 74), carry });
const tools = () => ground("tools", 20, 14, 7);
const peeledMoss = (state: "stone" | "hand" | "basket") => ({
  ...ground("colony", 71.328125, 36 + (19 * 19 * 1.5) / 128 - (2.5 / 1.3) * 0.75, 2.5),
  id: "peeled-moss",
  ...(state === "hand" ? { extra: "worker" as const, wrist: true } : {}),
  ...(state === "basket" ? { carrier: "tower-basket", x: 0, bottom: 2 } : {}),
});
const waitingBasket = () => ({ ...ground("basket", 76, 33, 6), id: "tower-basket" });
const basket = (received = false) => ({
  ...held("basket", "leon", { id: "tower-basket", width: 6, wrist: true }),
  actor: received ? ("leon" as const) : undefined,
  extra: received ? undefined : ("worker" as const),
  wristOffset: received ? { x: 1.3359375, bottom: 0.4453125 } : undefined,
});

export const returnBasketHandoff: LaterBeat = {
  at: 9,
  background: "tower-foot",
  finishBeforeAdvance: true,
  actors: {
    aria: { x: 54, bottom: 48, inspect: true, left: false },
    leon: {
      x: 66.1328125,
      bottom: 35.109375,
      left: false,
      carry: false,
      pose: "offer",
      via: [{ x: 66.1328125, bottom: 14 }],
    },
    lico: { x: 83, bottom: 14, inspect: false, mossStudy: undefined },
    finn: { visible: false },
  },
  items: [waitingBasket(), tools(), peeledMoss("stone")],
  extras: [npc("keeper", undefined, 27), { ...worker(false), inspect: true }],
  sequence: [
    { after: 900, items: [waitingBasket(), tools(), peeledMoss("hand")] },
    {
      after: 1800,
      items: [waitingBasket(), tools(), peeledMoss("basket")],
      extras: [
        npc("keeper", undefined, 27),
        {
          ...worker(false),
          x: 78.671875,
          bottom: 33 - (19 * 19 * 1.5) / 128 + (6 / 1.3) * 0.75,
          inspect: true,
        },
      ],
    },
    { after: 2800, items: [basket(), tools(), peeledMoss("basket")] },
    {
      after: 3600,
      extras: [npc("keeper", undefined, 27), worker()],
    },
    {
      after: 4600,
      extras: [npc("keeper", undefined, 27), { ...worker(false), pose: "explain" }],
    },
    { after: 6000, items: [basket(true), tools(), peeledMoss("basket")] },
    {
      after: 6800,
      actors: {
        leon: { x: 35, bottom: 14, left: true, carry: true, via: [{ x: 66.1328125, bottom: 14 }] },
      },
      extras: [npc("keeper", undefined, 27), worker(false)],
    },
  ],
};
