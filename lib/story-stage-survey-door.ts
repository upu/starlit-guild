import type { StageExtra, StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, npc, scene } from "./story-stage-later-shared.ts";

const cook = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("cook", "料理人", 76.3),
  bottom: 25,
  kitchen: "pot",
  ...patch,
});
type Props = {
  cook?: boolean;
  lid?: boolean;
  rag?: "cook" | "finn";
  aside?: boolean;
  walking?: boolean;
};
function props(state: Props = {}): StageItem[] {
  return [
    held("tool-rucksack", "leon", { x: 2.6, bottom: 23, width: 6.5, behindOwner: true }),
    ...potItems(state),
    ...ragItems(state),
  ];
}
function potItems(state: Props): StageItem[] {
  const pot: StageItem = state.cook
    ? {
        ...ground(
          "survey-pot",
          state.aside ? 5 : -5.5,
          state.walking ? 61 : state.aside ? 26 : 30.5,
          5.8,
        ),
        extra: "cook",
      }
    : held("survey-pot", "finn", { x: 3.3, bottom: 19.5, width: 5.8 });
  return [
    { ...pot, id: "borrowed-pot" },
    state.lid
      ? { ...ground("pot-lid", 5.8, 38.4, 5.3), id: "pot-lid", extra: "cook" }
      : { ...ground("pot-lid", 0, 3.1, 5.3), id: "pot-lid", carrier: "borrowed-pot" },
  ];
}
function ragItems(state: Props): StageItem[] {
  return state.rag === "cook"
    ? [{ ...ground("scrubbing-rag", -8, 38, 3.5), id: "scrubbing-rag", extra: "cook" as const }]
    : state.rag === "finn"
      ? [held("scrubbing-rag", "finn", { id: "scrubbing-rag", x: 0.8, bottom: 27, width: 3.5 })]
      : [];
}

export const surveyDoor = scene(
  "berne-street",
  [
    actor("aria", 22, { bottom: 18 }),
    actor("leon", 42, { bottom: 18, left: false }),
    actor("mira", 59, { bottom: 32, left: false, nameAbove: true }),
    actor("finn", 78, { bottom: 18, left: false }),
  ],
  [
    { at: 0, items: props() },
    {
      at: 9,
      background: "manor-gate",
      cast: [
        actor("aria", 28, { bottom: 22, left: false, pose: "think" }),
        actor("leon", 45, { bottom: 16, left: false }),
        actor("mira", 20, { bottom: 37, left: false, nameAbove: true }),
        actor("finn", 68, { bottom: 25, left: false }),
      ],
      extras: [{ ...npc("worker", "門番", 63), bottom: 55, left: true }],
      sequence: [
        { after: 700, extras: [{ ...npc("worker", "門番", 63), bottom: 55, left: false }] },
        { after: 1100, actors: { aria: { left: true, pose: "think" } } },
      ],
    },
    { at: 11, actors: { aria: { pose: "surprise" }, finn: { pose: "greet", left: true } } },
    {
      at: 12,
      background: "manor-kitchen-open",
      cast: [
        actor("aria", 29, { bottom: 16 }),
        actor("leon", 47, { bottom: 16, left: false }),
        actor("mira", 22, { bottom: 33, left: false, nameAbove: true }),
        actor("finn", 67.5, { bottom: 25, left: false }),
      ],
      extras: [cook({ x: 81, bottom: 60, kitchen: undefined })],
      items: props(),
      sequence: [
        { after: 200, extras: [cook({ kitchen: undefined, via: [{ x: 79, bottom: 42 }] })] },
        { after: 1800, extras: [cook()], actors: { finn: { pose: "offer" } } },
        { after: 2200, items: props({ cook: true }) },
        {
          after: 2900,
          extras: [cook({ kitchen: "lid" })],
          items: props({ cook: true, lid: true }),
        },
        { after: 3700, extras: [cook({ kitchen: "inspect" })], actors: { finn: { pose: "idle" } } },
      ],
    },
    { at: 13, extras: [cook({ kitchen: "inspect", speaking: true })] },
    {
      at: 15,
      items: props({ cook: true }),
      extras: [cook()],
      sequence: [
        {
          after: 700,
          items: props({ cook: true, aside: true, rag: "cook" }),
          extras: [cook({ kitchen: "cloth" })],
        },
        {
          after: 1400,
          items: props({ cook: true, aside: true, rag: "finn" }),
          actors: { finn: { pose: "offer" } },
        },
        {
          after: 2100,
          items: props({ cook: true, aside: true, rag: "finn", walking: true }),
          extras: [cook({ x: 81, bottom: 60, kitchen: undefined, via: [{ x: 84, bottom: 43 }] })],
        },
        {
          after: 3900,
          extras: [],
          items: props({ rag: "finn" }).filter(
            (p) => p.id !== "borrowed-pot" && p.id !== "pot-lid",
          ),
        },
      ],
    },
  ],
);
