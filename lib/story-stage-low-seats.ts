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

const mountainCast = () => [
  actor("aria", 35, { seated: true, perch: true }),
  actor("leon", 54, { seated: true, perch: true, left: true }),
  actor("mira", 70, { perch: true, left: true }),
];
const medicine = () => ground("medicine", 75, 14, 8);
const tea = () => ground("tea", 47, 13, 10);
export const mountainRest: LaterStage = scene(
  "mountain-road",
  mountainCast(),
  [
    { at: 0, actors: { mira: { inspect: true } }, items: [medicine()] },
    { at: 2, actors: { aria: { pose: "offer" } }, items: [medicine(), tea()] },
    {
      at: 4,
      actors: { mira: { x: 66, inspect: false, seated: true } },
      items: [medicine(), tea()],
    },
    { at: 5, actors: { aria: { reaction: "nod", pose: "offer" } } },
    {
      at: 10,
      actors: { aria: { pose: "idle" } },
      items: [medicine(), tea(), ground("bread", 45, 7, 8)],
    },
  ],
  { furniture: mountainCast().map((a) => lowSeat(a.id === "mira" ? { ...a, x: 66 } : a)) },
);

const overlookCast = () => [
  actor("aria", 28),
  actor("leon", 50),
  actor("mira", 43, { bottom: 29 }),
  actor("finn", 82, { seated: true, perch: true, left: true }),
];
const paper = (tilt = 0) => held("folded-paper", "finn", { width: 6, tilt });
export const overlookRest: LaterStage = scene(
  "hill-path",
  overlookCast(),
  [
    { at: 0, items: [paper()] },
    { at: 6, actors: { mira: { pose: "think" } } },
    {
      at: 10,
      actors: { leon: { x: 71, pose: "offer", left: false }, finn: { pose: "idle" } },
      sequence: [{ after: 1500, actors: { finn: { pose: "tease" } }, items: [paper(-16)] }],
    },
    { at: 11, actors: { aria: { reaction: "surprise" } } },
  ],
  { furniture: [lowSeat(overlookCast()[3])] },
);
