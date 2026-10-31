import { ground, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra, StageItem } from "./story-stage-cues.ts";

export const fallenMushrooms = (collected = 0): StageItem[] =>
  Array.from({ length: 4 - collected }, (_, j) => {
    const i = j + collected;
    return { ...ground("korotake", 79.5 + i * 4.8, 6, 5.5), id: `korotake-${String(i)}` };
  });
const potSlots = [
  [-2.2, 5],
  [2.2, 5],
  [-1.4, 7.5],
  [1.4, 7.5],
] as const;
const mushroomsInPot = (collected: number): StageItem[] =>
  potSlots.slice(0, collected).map(([x, bottom], i) => ({
    ...ground("korotake", x, bottom, 5.5),
    id: `korotake-${String(i)}`,
    carrier: "merrill-pot",
  }));
const heldMushroom = (i: number): StageItem => ({
  ...ground("korotake", 0, 0, 5.5),
  id: `korotake-${String(i)}`,
  extra: "merrill",
  wrist: true,
  wristAnchor: "bottom",
});
export const merrillPot = (carried = false): StageItem => ({
  ...ground("merrill-pot", 2, 8, 8),
  id: "merrill-pot",
  extra: "merrill",
  wrist: carried,
});
const collector = (x: number, seedlingAction: StageExtra["seedlingAction"]): StageExtra => ({
  id: "merrill",
  name: "メリル",
  x,
  bottom: 5,
  left: false,
  carry: true,
  seedlingAction,
});

export function seedlingCollection(baskets: () => StageItem[]): LaterBeat {
  const sequence: NonNullable<LaterBeat["sequence"]> = [
    {
      after: 800,
      extras: [collector(75.75, "collect")],
      items: [...baskets(), ...fallenMushrooms(), merrillPot()],
    },
  ];
  for (let i = 0; i < 4; i++) {
    const start = 2000 + i * 2600;
    sequence.push(
      { after: start, extras: [collector(75.75 + i * 4.8, "collect")] },
      {
        after: start + 900,
        items: [
          ...baskets(),
          ...fallenMushrooms(i + 1),
          merrillPot(),
          ...mushroomsInPot(i),
          heldMushroom(i),
        ],
      },
      { after: start + 1200, extras: [collector(78.25 + potSlots[i][0], "collect")] },
      {
        after: start + 1900,
        items: [...baskets(), ...fallenMushrooms(i + 1), merrillPot(), ...mushroomsInPot(i + 1)],
      },
    );
  }
  sequence.push({
    after: 12400,
    extras: [collector(89, undefined)],
    items: [...baskets(), merrillPot(true)],
  });
  return {
    at: 34,
    finishBeforeAdvance: true,
    extras: [
      {
        id: "merrill",
        name: "メリル",
        x: 73.125,
        bottom: 15.46875,
        left: true,
        seedlingAction: "stow",
      },
    ],
    items: [...baskets(), ...fallenMushrooms()],
    sequence,
  };
}
