import { ground, held, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageItem } from "./story-stage-cues.ts";

const bag = (): StageItem =>
  held("delivery-bag", "aria", {
    id: "aria-gift-bag",
    width: 6.4,
    x: -5,
    bottom: 22,
    behindOwner: true,
  });
export const foundingJar = (owner: "aria" | "lico"): StageItem =>
  held("sample-jar", owner, {
    id: "comparison-jar",
    width: 3.4,
    x: 0,
    bottom: 0,
    wrist: true,
    glow: "dim",
  });
export const storedFoundingGift = (): StageItem[] => [
  bag(),
  {
    ...ground("sample-jar", 0, 0, 3.4),
    id: "comparison-jar",
    carrier: "aria-gift-bag",
    stored: true,
  },
];
const items = (jar: StageItem) => [ground("basket", 60, 40, 9), bag(), jar];

export const foundingGift: LaterBeat = {
  at: 27,
  finishBeforeAdvance: true,
  actors: {
    aria: {
      x: 77.359375,
      bottom: 13.109375,
      left: false,
      carry: true,
      via: [
        { x: 19, bottom: -12 },
        { x: 77.359375, bottom: -12 },
      ],
    },
    lico: { mossStudy: "reach", left: true },
  },
  items: items(foundingJar("lico")),
  sequence: [
    { after: 5200, actors: { aria: { via: undefined } }, items: items(foundingJar("aria")) },
    {
      after: 6200,
      items: items({ ...foundingJar("aria"), art: "packing-cloth", glow: undefined }),
    },
    {
      after: 7200,
      actors: {
        aria: { carry: false, x: 70, bottom: -2, pose: "offer" },
        lico: { mossStudy: undefined },
      },
      items: [ground("basket", 60, 40, 9), ...storedFoundingGift()],
    },
  ],
};
