import type { StageActor, StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, scene, type LaterStage } from "./story-stage-later-shared.ts";

/** The seat stays behind the hip; its floor contact is just behind the boots. */
export function lowSeat(
  sitter: StageActor,
  art: "stone" | "step-stool" = "stone",
  cell = 21,
): StageItem {
  return {
    ...ground(
      art,
      sitter.x + (sitter.left ? 1.4 : -1.4),
      (sitter.bottom ?? 14) + 2,
      ((art === "stone" ? 12 : 6.5) * cell) / 21,
    ),
    id: `seat-${sitter.id}`,
    left: sitter.left,
  };
}

const overlookCast = () => [
  actor("aria", 27, { bottom: 24 }),
  actor("leon", 48, { bottom: 24 }),
  actor("mira", 38, { bottom: 43 }),
  actor("finn", 76, { bottom: 24, seated: true, perch: true, left: true }),
];
const paper = (back = false, turn = 0) =>
  held(back ? "receipt-back" : "receipt-front", "finn", {
    id: "shipping-receipt",
    width: 6,
    bottom: 25,
    turn,
  });
const overlookLuggage = () => [
  ground("medicine-closed", 48, 41, 8),
  ground("delivery-bag", 58, 38, 8),
  ground("basket", 18, 22, 7),
];
export const overlookRest: LaterStage = scene(
  "berne-overlook",
  overlookCast(),
  [
    {
      at: 0,
      actors: { finn: { seated: false, perch: false } },
      items: [],
      sequence: [
        { after: 650, actors: { finn: { seated: true, perch: true } } },
        { after: 1350, actors: { finn: { pose: "offer" } }, items: [paper()] },
      ],
    },
    { at: 6, actors: { mira: { pose: "think" } } },
    {
      at: 10,
      actors: {
        leon: { x: 67, bottom: 24, via: [{ x: 59, bottom: 20 }], pose: "offer", left: false },
        finn: { pose: "idle" },
      },
      sequence: [
        { after: 1800, items: [paper(false, 90)] },
        { after: 2450, actors: { finn: { pose: "tease" } }, items: [paper(true, 180)] },
      ],
    },
    { at: 11, actors: { aria: { reaction: "surprise" } } },
  ],
  { furniture: [lowSeat(overlookCast()[3]), ...overlookLuggage()] },
);
